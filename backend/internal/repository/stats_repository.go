package repository

import (
	"context"
	"database/sql"
	"time"

	"teslamate-cyberui/internal/logger"
	"teslamate-cyberui/internal/model"

	"github.com/jmoiron/sqlx"
)

// StatsRepository 统计数据仓储接口
type StatsRepository interface {
	GetOverview(ctx context.Context, carID int16) (*model.OverviewStats, error)
	GetEfficiency(ctx context.Context, carID int16, days int) (*model.EfficiencyStats, error)
	GetBattery(ctx context.Context, carID int16) (*model.BatteryStats, error)
	GetSocHistory(ctx context.Context, carID int16, start, end time.Time) ([]model.SocDataPoint, error)
	GetStatesTimeline(ctx context.Context, carID int16, start, end time.Time) ([]model.StateTimelineItem, error)
}

type statsRepository struct {
	db *sqlx.DB
}

// NewStatsRepository 创建统计仓储
func NewStatsRepository(db *sqlx.DB) StatsRepository {
	return &statsRepository{db: db}
}

// GetOverview 获取概览统计
func (r *statsRepository) GetOverview(ctx context.Context, carID int16) (*model.OverviewStats, error) {
	stats := &model.OverviewStats{}

	// 当前里程（总里程）
	odometerQuery := `
		SELECT COALESCE(odometer, 0)
		FROM positions
		WHERE car_id = $1 AND ideal_battery_range_km IS NOT NULL
		ORDER BY date DESC
		LIMIT 1
	`
	if err := r.db.GetContext(ctx, &stats.TotalDistance, odometerQuery, carID); err == nil {
		stats.CurrentOdometer = stats.TotalDistance
	}

	// 驾驶统计
	driveQuery := `
		SELECT 
			COUNT(*) as total_drives,
			COALESCE(SUM(duration_min), 0) as total_duration
		FROM drives
		WHERE car_id = $1
	`
	var driveStats struct {
		TotalDrives   int `db:"total_drives"`
		TotalDuration int `db:"total_duration"`
	}
	if err := r.db.GetContext(ctx, &driveStats, driveQuery, carID); err == nil {
		stats.TotalDrives = driveStats.TotalDrives
		stats.TotalDriveDuration = driveStats.TotalDuration
	}

	// 充电统计
	chargeQuery := `
		SELECT 
			COUNT(*) as total_charges,
			COALESCE(SUM(charge_energy_added), 0) as total_energy,
			COALESCE(SUM(duration_min), 0) as total_duration,
			SUM(cost) as total_cost
		FROM charging_processes
		WHERE car_id = $1
	`
	var chargeStats struct {
		TotalCharges  int             `db:"total_charges"`
		TotalEnergy   float64         `db:"total_energy"`
		TotalDuration int             `db:"total_duration"`
		TotalCost     sql.NullFloat64 `db:"total_cost"`
	}
	if err := r.db.GetContext(ctx, &chargeStats, chargeQuery, carID); err == nil {
		stats.TotalCharges = chargeStats.TotalCharges
		stats.TotalEnergyAdded = chargeStats.TotalEnergy
		stats.TotalChargeDuration = chargeStats.TotalDuration
		if chargeStats.TotalCost.Valid {
			stats.TotalEnergyCost = &chargeStats.TotalCost.Float64
		}
	}

	// 平均能效
	if stats.TotalDistance > 0 && stats.TotalEnergyAdded > 0 {
		stats.AvgEfficiency = stats.TotalEnergyAdded / stats.TotalDistance * 1000 // Wh/km
	}

	// 最后位置信息
	locationQuery := `
		WITH locations AS (
			SELECT 
				a.latitude, 
				a.longitude, 
				COALESCE(g.name, array_to_string(((string_to_array(a.display_name, ', ', ''))[0:2]), ', ')) AS address,
				COALESCE(cp.end_date, cp.start_date) AS location_time
			FROM charging_processes cp
			INNER JOIN addresses a ON cp.address_id = a.id
			LEFT JOIN geofences g ON cp.geofence_id = g.id
			WHERE cp.car_id = $1
			UNION
			SELECT 
				a.latitude, 
				a.longitude, 
				COALESCE(g.name, array_to_string(((string_to_array(a.display_name, ', ', ''))[0:2]), ', ')) AS address,
				d.end_date AS location_time
			FROM drives d
			INNER JOIN addresses a ON d.end_address_id = a.id
			LEFT JOIN geofences g ON d.end_geofence_id = g.id
			WHERE d.car_id = $1 AND d.end_date IS NOT NULL
		)
		SELECT latitude, longitude, address, location_time
		FROM locations
		WHERE location_time IS NOT NULL
		ORDER BY location_time DESC
		LIMIT 1
	`
	var locationInfo struct {
		Latitude     sql.NullFloat64 `db:"latitude"`
		Longitude    sql.NullFloat64 `db:"longitude"`
		Address      sql.NullString  `db:"address"`
		LocationTime sql.NullTime    `db:"location_time"`
	}
	if err := r.db.GetContext(ctx, &locationInfo, locationQuery, carID); err == nil {
		if locationInfo.Latitude.Valid {
			stats.LastLatitude = &locationInfo.Latitude.Float64
		}
		if locationInfo.Longitude.Valid {
			stats.LastLongitude = &locationInfo.Longitude.Float64
		}
		if locationInfo.Address.Valid {
			stats.LastAddress = &locationInfo.Address.String
		}
		if locationInfo.LocationTime.Valid {
			t := locationInfo.LocationTime.Time.Format(time.RFC3339)
			stats.LastLocationTime = &t
		}
	}

	// 最新温度信息（从 positions 和 charges 中获取最近60分钟内的温度）
	tempQuery := `
		WITH last_position AS (
			SELECT date, outside_temp, inside_temp
			FROM positions
			WHERE car_id = $1 AND outside_temp IS NOT NULL AND date >= (NOW() - INTERVAL '60 minutes')
			ORDER BY date DESC
			LIMIT 1
		),
		last_charge AS (
			SELECT c.date, c.outside_temp, NULL::double precision as inside_temp
			FROM charges c
			JOIN charging_processes cp ON c.charging_process_id = cp.id
			WHERE cp.car_id = $1 AND c.outside_temp IS NOT NULL AND c.date >= (NOW() - INTERVAL '60 minutes')
			ORDER BY c.date DESC
			LIMIT 1
		)
		SELECT * FROM last_position
		UNION ALL
		SELECT * FROM last_charge
		ORDER BY date DESC
		LIMIT 1
	`
	var tempInfo struct {
		Date        sql.NullTime    `db:"date"`
		OutsideTemp sql.NullFloat64 `db:"outside_temp"`
		InsideTemp  sql.NullFloat64 `db:"inside_temp"`
	}
	if err := r.db.GetContext(ctx, &tempInfo, tempQuery, carID); err == nil {
		if tempInfo.OutsideTemp.Valid {
			stats.OutsideTemp = &tempInfo.OutsideTemp.Float64
		}
		if tempInfo.InsideTemp.Valid {
			stats.InsideTemp = &tempInfo.InsideTemp.Float64
		}
	}

	// 充电信息（如果正在充电）
	// 获取最近一次充电过程，如果其 end_date 为 NULL，说明正在充电
	chargingQuery := `
		WITH charging_process AS (
			SELECT id, end_date
			FROM charging_processes
			WHERE car_id = $1
			ORDER BY start_date DESC
			LIMIT 1
		)
		SELECT 
			CASE WHEN cp.end_date IS NULL THEN true ELSE false END AS is_charging,
			CASE WHEN cp.end_date IS NULL THEN c.charger_voltage ELSE NULL END AS charger_voltage,
			CASE WHEN cp.end_date IS NULL THEN c.charger_power ELSE NULL END AS charger_power
		FROM charging_process cp
		LEFT JOIN LATERAL (
			SELECT charger_voltage, charger_power
			FROM charges
			WHERE charging_process_id = cp.id
			ORDER BY date DESC
			LIMIT 1
		) c ON true
		WHERE cp.id IS NOT NULL
	`
	var chargingInfo struct {
		IsCharging     bool          `db:"is_charging"`
		ChargerVoltage sql.NullInt64 `db:"charger_voltage"`
		ChargerPower   sql.NullInt64 `db:"charger_power"`
	}
	if err := r.db.GetContext(ctx, &chargingInfo, chargingQuery, carID); err == nil {
		stats.IsCharging = chargingInfo.IsCharging
		if chargingInfo.IsCharging {
			if chargingInfo.ChargerVoltage.Valid {
				v := int(chargingInfo.ChargerVoltage.Int64)
				stats.ChargingVoltage = &v
			}
			if chargingInfo.ChargerPower.Valid {
				p := int(chargingInfo.ChargerPower.Int64)
				stats.ChargingPower = &p
			}
		}
	}

	return stats, nil
}

// GetEfficiency 获取能效统计
func (r *statsRepository) GetEfficiency(ctx context.Context, carID int16, days int) (*model.EfficiencyStats, error) {
	stats := &model.EfficiencyStats{}

	// 日统计
	dailyQuery := `
		SELECT 
			DATE(start_date) as date,
			COALESCE(SUM(distance), 0) as distance,
			COALESCE(SUM(start_ideal_range_km - end_ideal_range_km), 0) * 161 / 1000 as energy_used
		FROM drives
		WHERE car_id = $1 AND start_date >= $2
		GROUP BY DATE(start_date)
		ORDER BY DATE(start_date) DESC
		LIMIT 30
	`
	startDate := time.Now().AddDate(0, 0, -days)

	rows, err := r.db.QueryxContext(ctx, dailyQuery, carID, startDate)
	if err != nil {
		logger.Errorf("Failed to get daily efficiency: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var row struct {
				Date       time.Time `db:"date"`
				Distance   float64   `db:"distance"`
				EnergyUsed float64   `db:"energy_used"`
			}
			if err := rows.StructScan(&row); err != nil {
				continue
			}

			point := model.EfficiencyDataPoint{
				Date:       row.Date.Format("2006-01-02"),
				Distance:   row.Distance,
				EnergyUsed: row.EnergyUsed,
			}
			if row.Distance > 0 {
				point.Efficiency = row.EnergyUsed / row.Distance * 1000
			}
			stats.Daily = append(stats.Daily, point)
		}
	}

	// 周统计
	weeklyQuery := `
		SELECT 
			DATE_TRUNC('week', start_date) as date,
			COALESCE(SUM(distance), 0) as distance,
			COALESCE(SUM(start_ideal_range_km - end_ideal_range_km), 0) * 161 / 1000 as energy_used
		FROM drives
		WHERE car_id = $1 AND start_date >= $2
		GROUP BY DATE_TRUNC('week', start_date)
		ORDER BY DATE_TRUNC('week', start_date) DESC
		LIMIT 12
	`
	weekStart := time.Now().AddDate(0, -3, 0)

	rows, err = r.db.QueryxContext(ctx, weeklyQuery, carID, weekStart)
	if err != nil {
		logger.Errorf("Failed to get weekly efficiency: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var row struct {
				Date       time.Time `db:"date"`
				Distance   float64   `db:"distance"`
				EnergyUsed float64   `db:"energy_used"`
			}
			if err := rows.StructScan(&row); err != nil {
				continue
			}

			point := model.EfficiencyDataPoint{
				Date:       row.Date.Format("2006-01-02"),
				Distance:   row.Distance,
				EnergyUsed: row.EnergyUsed,
			}
			if row.Distance > 0 {
				point.Efficiency = row.EnergyUsed / row.Distance * 1000
			}
			stats.Weekly = append(stats.Weekly, point)
		}
	}

	// 月统计
	monthlyQuery := `
		SELECT 
			DATE_TRUNC('month', start_date) as date,
			COALESCE(SUM(distance), 0) as distance,
			COALESCE(SUM(start_ideal_range_km - end_ideal_range_km), 0) * 161 / 1000 as energy_used
		FROM drives
		WHERE car_id = $1 AND start_date >= $2
		GROUP BY DATE_TRUNC('month', start_date)
		ORDER BY DATE_TRUNC('month', start_date) DESC
		LIMIT 12
	`
	monthStart := time.Now().AddDate(-1, 0, 0)

	rows, err = r.db.QueryxContext(ctx, monthlyQuery, carID, monthStart)
	if err != nil {
		logger.Errorf("Failed to get monthly efficiency: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var row struct {
				Date       time.Time `db:"date"`
				Distance   float64   `db:"distance"`
				EnergyUsed float64   `db:"energy_used"`
			}
			if err := rows.StructScan(&row); err != nil {
				continue
			}

			point := model.EfficiencyDataPoint{
				Date:       row.Date.Format("2006-01"),
				Distance:   row.Distance,
				EnergyUsed: row.EnergyUsed,
			}
			if row.Distance > 0 {
				point.Efficiency = row.EnergyUsed / row.Distance * 1000
			}
			stats.Monthly = append(stats.Monthly, point)
		}
	}

	return stats, nil
}

// GetBattery 获取电池统计
func (r *statsRepository) GetBattery(ctx context.Context, carID int16) (*model.BatteryStats, error) {
	stats := &model.BatteryStats{}

	// 获取电池容量历史（基于100%充电记录）
	query := `
		SELECT 
			DATE(c.date) as date,
			MAX(c.ideal_battery_range_km) as ideal_range_km,
			MAX(c.rated_battery_range_km) as rated_range_km,
			MAX(c.battery_level) as battery_level
		FROM charges c
		JOIN charging_processes cp ON c.charging_process_id = cp.id
		WHERE cp.car_id = $1 
		AND c.battery_level >= 95
		GROUP BY DATE(c.date)
		ORDER BY DATE(c.date) DESC
		LIMIT 100
	`

	rows, err := r.db.QueryxContext(ctx, query, carID)
	if err != nil {
		logger.Errorf("Failed to get battery stats: %v", err)
		return stats, nil
	}
	defer rows.Close()

	for rows.Next() {
		var row struct {
			Date         time.Time       `db:"date"`
			IdealRangeKm sql.NullFloat64 `db:"ideal_range_km"`
			RatedRangeKm sql.NullFloat64 `db:"rated_range_km"`
			BatteryLevel sql.NullInt64   `db:"battery_level"`
		}
		if err := rows.StructScan(&row); err != nil {
			continue
		}

		point := model.BatteryDataPoint{
			Date: row.Date.Format("2006-01-02"),
		}
		if row.IdealRangeKm.Valid {
			point.IdealRangeKm = row.IdealRangeKm.Float64
		}
		if row.RatedRangeKm.Valid {
			point.RatedRangeKm = row.RatedRangeKm.Float64
		}
		if row.BatteryLevel.Valid {
			point.BatteryLevel = int(row.BatteryLevel.Int64)
			// 估算电池容量 (假设效率为161 Wh/km)
			if point.IdealRangeKm > 0 && point.BatteryLevel > 0 {
				point.EstimatedCapacity = point.IdealRangeKm * 161 / 1000 * 100 / float64(point.BatteryLevel)
			}
		}

		stats.DegradationHistory = append(stats.DegradationHistory, point)
	}

	// 计算当前容量和衰减
	if len(stats.DegradationHistory) > 0 {
		latest := stats.DegradationHistory[0]
		stats.CurrentCapacity = latest.EstimatedCapacity

		// 获取最早的记录作为原始容量
		if len(stats.DegradationHistory) > 1 {
			oldest := stats.DegradationHistory[len(stats.DegradationHistory)-1]
			stats.OriginalCapacity = oldest.EstimatedCapacity
			if stats.OriginalCapacity > 0 {
				stats.DegradationPercent = (1 - stats.CurrentCapacity/stats.OriginalCapacity) * 100
			}
		} else {
			stats.OriginalCapacity = stats.CurrentCapacity
		}
	}

	return stats, nil
}

// GetSocHistory 获取SOC历史数据
func (r *statsRepository) GetSocHistory(ctx context.Context, carID int16, start, end time.Time) ([]model.SocDataPoint, error) {
	query := `
		SELECT date, battery_level AS soc
		FROM (
			SELECT battery_level, date
			FROM positions
			WHERE car_id = $1 AND ideal_battery_range_km IS NOT NULL 
				AND date >= $2 AND date <= $3
			UNION ALL
			SELECT battery_level, date
			FROM charges c 
			JOIN charging_processes p ON p.id = c.charging_process_id
			WHERE p.car_id = $1 AND date >= $2 AND date <= $3
		) AS data
		ORDER BY date ASC
	`

	rows, err := r.db.QueryxContext(ctx, query, carID, start, end)
	if err != nil {
		logger.Errorf("Failed to get SOC history: %v", err)
		return nil, err
	}
	defer rows.Close()

	var result []model.SocDataPoint
	for rows.Next() {
		var row struct {
			Date time.Time `db:"date"`
			Soc  int       `db:"soc"`
		}
		if err := rows.StructScan(&row); err != nil {
			continue
		}
		result = append(result, model.SocDataPoint{
			Date: row.Date.Format(time.RFC3339),
			Soc:  row.Soc,
		})
	}

	return result, nil
}

// GetStatesTimeline 获取状态时间线数据
func (r *statsRepository) GetStatesTimeline(ctx context.Context, carID int16, start, end time.Time) ([]model.StateTimelineItem, error) {
	query := `
		WITH initial_state AS (
			SELECT
				$2::timestamp AS date, -- Clamp to start time
				state
			FROM (
				SELECT start_date, 2 AS state FROM charging_processes WHERE car_id = $1 AND start_date < $2
				UNION ALL
				SELECT start_date, 1 AS state FROM drives WHERE car_id = $1 AND start_date < $2
				UNION ALL
				SELECT start_date, 
					CASE 
						WHEN state = 'offline' THEN 3 
						WHEN state = 'asleep' THEN 4 
						WHEN state = 'online' THEN 5 
					END AS state 
				FROM states WHERE car_id = $1 AND start_date < $2
				UNION ALL
				SELECT start_date, 6 AS state FROM updates WHERE car_id = $1 AND start_date < $2
			) past
			ORDER BY start_date DESC
			LIMIT 1
		),
		main_events AS (
			-- Drivers and Charges (include overlapping)
			SELECT
				unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
				unnest(ARRAY [2, 0]) AS state
			FROM charging_processes
			WHERE car_id = $1 AND start_date <= $3 AND (end_date >= $2 OR end_date IS NULL)
			UNION ALL
			SELECT
				unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
				unnest(ARRAY [1, 0]) AS state
			FROM drives
			WHERE car_id = $1 AND start_date <= $3 AND (end_date >= $2 OR end_date IS NULL)
			UNION ALL
			-- Point events
			SELECT
				start_date AS date,
				CASE
					WHEN state = 'offline' THEN 3
					WHEN state = 'asleep' THEN 4
					WHEN state = 'online' THEN 5
				END AS state
			FROM states
			WHERE car_id = $1 AND start_date >= $2 AND start_date <= $3
			UNION ALL
			SELECT
				unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
				unnest(ARRAY [6, 0]) AS state
			FROM updates
			WHERE car_id = $1 AND start_date >= $2 AND start_date <= $3
		)
		SELECT date AS time, state FROM (
			SELECT date, state FROM initial_state
			UNION ALL
			SELECT date, state FROM main_events
		) combined
		WHERE date >= $2 AND date <= $3 -- Filter final range
		ORDER BY date ASC, state ASC
	`

	rows, err := r.db.QueryxContext(ctx, query, carID, start, end)
	if err != nil {
		logger.Errorf("Failed to get states timeline: %v", err)
		return nil, err
	}
	defer rows.Close()

	var result []model.StateTimelineItem
	for rows.Next() {
		var row struct {
			Time  time.Time `db:"time"`
			State int       `db:"state"`
		}
		if err := rows.StructScan(&row); err != nil {
			continue
		}
		result = append(result, model.StateTimelineItem{
			Time:  row.Time.Format(time.RFC3339),
			State: row.State,
		})
	}

	return result, nil
}
