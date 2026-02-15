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

	// 获取车型信息以计算能效
	var carModel, carMarketingName sql.NullString
	modelQuery := `SELECT model, marketing_name FROM cars WHERE id = $1`
	r.db.QueryRowxContext(ctx, modelQuery, carID).Scan(&carModel, &carMarketingName)
	carEfficiency := getEfficiencyByModel("", "")
	if carModel.Valid {
		mktName := ""
		if carMarketingName.Valid {
			mktName = carMarketingName.String
		}
		carEfficiency = getEfficiencyByModel(carModel.String, mktName)
	}

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

	// 平均能效：使用行程中的续航消耗 * 车辆能效系数 / 行驶距离
	// 能效系数根据车型硬编码
	efficiencyQuery := `
		SELECT 
			COALESCE(SUM(d.distance), 0) as total_distance,
			COALESCE(SUM(d.start_ideal_range_km - d.end_ideal_range_km), 0) as total_range_used
		FROM drives d
		WHERE d.car_id = $1 
			AND d.distance > 0 
			AND d.start_ideal_range_km IS NOT NULL 
			AND d.end_ideal_range_km IS NOT NULL
			AND d.start_ideal_range_km > d.end_ideal_range_km
	`
	var effStats struct {
		TotalDistance float64 `db:"total_distance"`
		TotalRangeUsed float64 `db:"total_range_used"`
	}
	if err := r.db.GetContext(ctx, &effStats, efficiencyQuery, carID); err == nil {
		if effStats.TotalDistance > 0 && effStats.TotalRangeUsed > 0 {
			// 能效 = 续航消耗 * 能效系数 / 行驶距离
			stats.AvgEfficiency = effStats.TotalRangeUsed * carEfficiency / effStats.TotalDistance * 1000 // Wh/km
		}
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

	// 获取车型信息以计算能效
	var carModel, carMarketingName sql.NullString
	modelQuery := `SELECT model, marketing_name FROM cars WHERE id = $1`
	r.db.QueryRowxContext(ctx, modelQuery, carID).Scan(&carModel, &carMarketingName)
	carEfficiency := getEfficiencyByModel("", "")
	if carModel.Valid {
		mktName := ""
		if carMarketingName.Valid {
			mktName = carMarketingName.String
		}
		carEfficiency = getEfficiencyByModel(carModel.String, mktName)
	}
	// 能效系数 * 1000 = Wh/km系数，用于SQL中计算
	efficiencyFactor := carEfficiency * 1000

	// 日统计
	dailyQuery := `
		SELECT 
			DATE(start_date) as date,
			COALESCE(SUM(distance), 0) as distance,
			COALESCE(SUM(start_ideal_range_km - end_ideal_range_km), 0) as range_used
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
				Date      time.Time `db:"date"`
				Distance  float64   `db:"distance"`
				RangeUsed float64   `db:"range_used"`
			}
			if err := rows.StructScan(&row); err != nil {
				continue
			}

			point := model.EfficiencyDataPoint{
				Date:      row.Date.Format("2006-01-02"),
				Distance:  row.Distance,
				EnergyUsed: row.RangeUsed * efficiencyFactor / 1000,
			}
			if row.Distance > 0 {
				point.Efficiency = row.RangeUsed * efficiencyFactor / row.Distance
			}
			stats.Daily = append(stats.Daily, point)
		}
	}

	// 周统计
	weeklyQuery := `
		SELECT 
			DATE_TRUNC('week', start_date) as date,
			COALESCE(SUM(distance), 0) as distance,
			COALESCE(SUM(start_ideal_range_km - end_ideal_range_km), 0) as range_used
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
				Date      time.Time `db:"date"`
				Distance  float64   `db:"distance"`
				RangeUsed float64   `db:"range_used"`
			}
			if err := rows.StructScan(&row); err != nil {
				continue
			}

			point := model.EfficiencyDataPoint{
				Date:      row.Date.Format("2006-01-02"),
				Distance:  row.Distance,
				EnergyUsed: row.RangeUsed * efficiencyFactor / 1000,
			}
			if row.Distance > 0 {
				point.Efficiency = row.RangeUsed * efficiencyFactor / row.Distance
			}
			stats.Weekly = append(stats.Weekly, point)
		}
	}

	// 月统计
	monthlyQuery := `
		SELECT 
			DATE_TRUNC('month', start_date) as date,
			COALESCE(SUM(distance), 0) as distance,
			COALESCE(SUM(start_ideal_range_km - end_ideal_range_km), 0) as range_used
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
				Date      time.Time `db:"date"`
				Distance  float64   `db:"distance"`
				RangeUsed float64   `db:"range_used"`
			}
			if err := rows.StructScan(&row); err != nil {
				continue
			}

			point := model.EfficiencyDataPoint{
				Date:      row.Date.Format("2006-01"),
				Distance:  row.Distance,
				EnergyUsed: row.RangeUsed * efficiencyFactor / 1000,
			}
			if row.Distance > 0 {
				point.Efficiency = row.RangeUsed * efficiencyFactor / row.Distance
			}
			stats.Monthly = append(stats.Monthly, point)
		}
	}

	return stats, nil
}

// GetBattery 获取电池统计
func (r *statsRepository) GetBattery(ctx context.Context, carID int16) (*model.BatteryStats, error) {
	stats := &model.BatteryStats{}

	// 获取车型信息以计算能效
	var carModel, carMarketingName sql.NullString
	modelQuery := `SELECT model, marketing_name FROM cars WHERE id = $1`
	r.db.QueryRowxContext(ctx, modelQuery, carID).Scan(&carModel, &carMarketingName)
	carEfficiency := getEfficiencyByModel("", "")
	if carModel.Valid {
		mktName := ""
		if carMarketingName.Valid {
			mktName = carMarketingName.String
		}
		carEfficiency = getEfficiencyByModel(carModel.String, mktName)
	}
	// 能效系数 * 1000 = Wh/km系数
	efficiencyFactor := carEfficiency * 1000

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
			// 估算电池容量，根据车型能效系数计算
			if point.IdealRangeKm > 0 && point.BatteryLevel > 0 {
				point.EstimatedCapacity = point.IdealRangeKm * efficiencyFactor / 1000 * 100 / float64(point.BatteryLevel)
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
		SELECT date, battery_level AS soc, rated_battery_range_km AS range_km
		FROM (
			SELECT battery_level, date, rated_battery_range_km
			FROM positions
			WHERE car_id = $1 AND ideal_battery_range_km IS NOT NULL 
				AND date >= $2 AND date <= $3
			UNION ALL
			SELECT battery_level, date, rated_battery_range_km
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
			Date    time.Time `db:"date"`
			Soc     int       `db:"soc"`
			RangeKm *float64  `db:"range_km"`
		}
		if err := rows.StructScan(&row); err != nil {
			continue
		}
		result = append(result, model.SocDataPoint{
			Date:    row.Date.Format(time.RFC3339),
			Soc:     row.Soc,
			RangeKm: row.RangeKm,
		})
	}

	return result, nil
}

// GetStatesTimeline 获取状态时间线数据
func (r *statsRepository) GetStatesTimeline(ctx context.Context, carID int16, start, end time.Time) ([]model.StateTimelineItem, error) {
	// SQL query matching Grafana's states timeline logic
	// Reference: teslamate-grafana/core/overview.json - States panel
	query := `
		WITH states AS (
			-- Charging processes: start with state=2, end with state=0
			SELECT
				unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
				unnest(ARRAY [2, 0]) AS state
			FROM charging_processes
			WHERE
				car_id = $1 AND 
				($2::timestamp - interval '30 day') < start_date AND 
				(end_date < ($3::timestamp + interval '30 day') OR end_date IS NULL)
			UNION
			-- Drives: start with state=1, end with state=0
			SELECT
				unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
				unnest(ARRAY [1, 0]) AS state
			FROM drives
			WHERE
				car_id = $1 AND 
				($2::timestamp - interval '30 day') < start_date AND 
				(end_date < ($3::timestamp + interval '30 day') OR end_date IS NULL)
			UNION
			-- States table: point events (offline=3, asleep=4, online=5)
			SELECT
				start_date AS date,
				CASE
					WHEN state = 'offline' THEN 3
					WHEN state = 'asleep' THEN 4
					WHEN state = 'online' THEN 5
				END AS state
			FROM states
			WHERE
				car_id = $1 AND 
				($2::timestamp - interval '30 day') < start_date AND 
				(end_date < ($3::timestamp + interval '30 day') OR end_date IS NULL)
			UNION
			-- Updates: start with state=6, end with state=0
			SELECT
				unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
				unnest(ARRAY [6, 0]) AS state
			FROM updates
			WHERE
				car_id = $1 AND 
				($2::timestamp - interval '30 day') < start_date AND 
				(end_date < ($3::timestamp + interval '30 day') OR end_date IS NULL)
		)
		SELECT date AS "time", state
		FROM states
		WHERE 
			date IS NOT NULL AND
			($2::timestamp - interval '30 day') < date AND 
			date < ($3::timestamp + interval '30 day') 
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
