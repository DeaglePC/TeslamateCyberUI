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
