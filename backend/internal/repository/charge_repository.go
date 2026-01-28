package repository

import (
	"context"
	"database/sql"

	"teslamate-cyberui/internal/logger"
	"teslamate-cyberui/internal/model"

	"github.com/jmoiron/sqlx"
)

// ChargeRepository 充电数据仓储接口
type ChargeRepository interface {
	GetList(ctx context.Context, carID int16, page, pageSize int) (*model.ListResponse[model.ChargeListItem], error)
	GetDetail(ctx context.Context, chargeID int64) (*model.ChargeDetail, error)
	GetStats(ctx context.Context, chargeID int64) (*model.ChargeStats, error)
}

type chargeRepository struct {
	db *sqlx.DB
}

// NewChargeRepository 创建充电仓储
func NewChargeRepository(db *sqlx.DB) ChargeRepository {
	return &chargeRepository{db: db}
}

// GetList 获取充电记录列表
func (r *chargeRepository) GetList(ctx context.Context, carID int16, page, pageSize int) (*model.ListResponse[model.ChargeListItem], error) {
	// 获取总数
	countQuery := `SELECT COUNT(*) FROM charging_processes WHERE car_id = $1`
	var total int
	if err := r.db.GetContext(ctx, &total, countQuery, carID); err != nil {
		logger.Errorf("Failed to count charges for car %d: %v", carID, err)
		return nil, err
	}

	// 获取列表
	offset := (page - 1) * pageSize
	query := `
		SELECT 
			cp.id,
			cp.start_date,
			cp.end_date,
			COALESCE(cp.duration_min, 0) as duration_min,
			COALESCE(cp.charge_energy_added, 0) as charge_energy_added,
			COALESCE(cp.start_battery_level, 0) as start_battery_level,
			COALESCE(cp.end_battery_level, 0) as end_battery_level,
			COALESCE(g.name, a.display_name, 'Unknown') as location,
			cp.cost,
			p.latitude,
			p.longitude
		FROM charging_processes cp
		LEFT JOIN addresses a ON cp.address_id = a.id
		LEFT JOIN geofences g ON cp.geofence_id = g.id
		LEFT JOIN positions p ON cp.position_id = p.id
		WHERE cp.car_id = $1
		ORDER BY cp.start_date DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryxContext(ctx, query, carID, pageSize, offset)
	if err != nil {
		logger.Errorf("Failed to get charges for car %d: %v", carID, err)
		return nil, err
	}
	defer rows.Close()

	var items []model.ChargeListItem
	for rows.Next() {
		var item struct {
			ID                int64           `db:"id"`
			StartDate         sql.NullTime    `db:"start_date"`
			EndDate           sql.NullTime    `db:"end_date"`
			DurationMin       int             `db:"duration_min"`
			ChargeEnergyAdded float64         `db:"charge_energy_added"`
			StartBatteryLevel int             `db:"start_battery_level"`
			EndBatteryLevel   int             `db:"end_battery_level"`
			Location          string          `db:"location"`
			Cost              sql.NullFloat64 `db:"cost"`
			Latitude          sql.NullFloat64 `db:"latitude"`
			Longitude         sql.NullFloat64 `db:"longitude"`
		}

		if err := rows.StructScan(&item); err != nil {
			logger.Errorf("Failed to scan charge row: %v", err)
			continue
		}

		listItem := model.ChargeListItem{
			ID:                item.ID,
			DurationMin:       item.DurationMin,
			ChargeEnergyAdded: item.ChargeEnergyAdded,
			StartBatteryLevel: item.StartBatteryLevel,
			EndBatteryLevel:   item.EndBatteryLevel,
			Location:          item.Location,
		}

		if item.StartDate.Valid {
			listItem.StartDate = item.StartDate.Time
		}
		if item.EndDate.Valid {
			listItem.EndDate = &item.EndDate.Time
		}
		if item.Cost.Valid {
			listItem.Cost = &item.Cost.Float64
		}
		if item.Latitude.Valid {
			listItem.Latitude = &item.Latitude.Float64
		}
		if item.Longitude.Valid {
			listItem.Longitude = &item.Longitude.Float64
		}

		items = append(items, listItem)
	}

	return &model.ListResponse[model.ChargeListItem]{
		Items: items,
		Pagination: model.Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    total,
		},
	}, nil
}

// GetDetail 获取充电详情
func (r *chargeRepository) GetDetail(ctx context.Context, chargeID int64) (*model.ChargeDetail, error) {
	query := `
		SELECT 
			cp.id,
			cp.start_date,
			cp.end_date,
			COALESCE(cp.duration_min, 0) as duration_min,
			COALESCE(cp.charge_energy_added, 0) as charge_energy_added,
			cp.charge_energy_used,
			COALESCE(cp.start_battery_level, 0) as start_battery_level,
			COALESCE(cp.end_battery_level, 0) as end_battery_level,
			COALESCE(cp.start_ideal_range_km, 0) as start_ideal_range_km,
			COALESCE(cp.end_ideal_range_km, 0) as end_ideal_range_km,
			COALESCE(cp.start_rated_range_km, 0) as start_rated_range_km,
			COALESCE(cp.end_rated_range_km, 0) as end_rated_range_km,
			cp.outside_temp_avg,
			COALESCE(g.name, a.display_name, 'Unknown') as location,
			p.latitude,
			p.longitude,
			cp.cost
		FROM charging_processes cp
		LEFT JOIN addresses a ON cp.address_id = a.id
		LEFT JOIN geofences g ON cp.geofence_id = g.id
		LEFT JOIN positions p ON cp.position_id = p.id
		WHERE cp.id = $1
	`

	var row struct {
		ID                int64           `db:"id"`
		StartDate         sql.NullTime    `db:"start_date"`
		EndDate           sql.NullTime    `db:"end_date"`
		DurationMin       int             `db:"duration_min"`
		ChargeEnergyAdded float64         `db:"charge_energy_added"`
		ChargeEnergyUsed  sql.NullFloat64 `db:"charge_energy_used"`
		StartBatteryLevel int             `db:"start_battery_level"`
		EndBatteryLevel   int             `db:"end_battery_level"`
		StartIdealRangeKm float64         `db:"start_ideal_range_km"`
		EndIdealRangeKm   float64         `db:"end_ideal_range_km"`
		StartRatedRangeKm float64         `db:"start_rated_range_km"`
		EndRatedRangeKm   float64         `db:"end_rated_range_km"`
		OutsideTempAvg    sql.NullFloat64 `db:"outside_temp_avg"`
		Location          string          `db:"location"`
		Latitude          sql.NullFloat64 `db:"latitude"`
		Longitude         sql.NullFloat64 `db:"longitude"`
		Cost              sql.NullFloat64 `db:"cost"`
	}

	if err := r.db.GetContext(ctx, &row, query, chargeID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		logger.Errorf("Failed to get charge detail %d: %v", chargeID, err)
		return nil, err
	}

	detail := &model.ChargeDetail{
		ID:                row.ID,
		DurationMin:       row.DurationMin,
		ChargeEnergyAdded: row.ChargeEnergyAdded,
		StartBatteryLevel: row.StartBatteryLevel,
		EndBatteryLevel:   row.EndBatteryLevel,
		StartIdealRangeKm: row.StartIdealRangeKm,
		EndIdealRangeKm:   row.EndIdealRangeKm,
		StartRatedRangeKm: row.StartRatedRangeKm,
		EndRatedRangeKm:   row.EndRatedRangeKm,
		Location:          row.Location,
	}

	if row.StartDate.Valid {
		detail.StartDate = row.StartDate.Time
	}
	if row.EndDate.Valid {
		detail.EndDate = &row.EndDate.Time
	}
	if row.ChargeEnergyUsed.Valid {
		detail.ChargeEnergyUsed = &row.ChargeEnergyUsed.Float64
	}
	if row.OutsideTempAvg.Valid {
		detail.OutsideTempAvg = &row.OutsideTempAvg.Float64
	}
	if row.Latitude.Valid {
		detail.Latitude = &row.Latitude.Float64
	}
	if row.Longitude.Valid {
		detail.Longitude = &row.Longitude.Float64
	}
	if row.Cost.Valid {
		detail.Cost = &row.Cost.Float64
	}

	// 计算充电效率
	if detail.ChargeEnergyUsed != nil && detail.ChargeEnergyAdded > 0 {
		eff := detail.ChargeEnergyAdded / *detail.ChargeEnergyUsed * 100
		detail.Efficiency = &eff
	}

	return detail, nil
}

// GetStats 获取充电过程统计数据
func (r *chargeRepository) GetStats(ctx context.Context, chargeID int64) (*model.ChargeStats, error) {
	query := `
		SELECT 
			date,
			COALESCE(battery_level, 0) as battery_level,
			COALESCE(charger_power, 0) as charger_power,
			COALESCE(charger_voltage, 0) as charger_voltage,
			COALESCE(charger_actual_current, 0) as charger_current,
			COALESCE(ideal_battery_range_km, 0) as ideal_range_km,
			outside_temp
		FROM charges
		WHERE charging_process_id = $1
		ORDER BY date ASC
	`

	rows, err := r.db.QueryxContext(ctx, query, chargeID)
	if err != nil {
		logger.Errorf("Failed to get charge stats %d: %v", chargeID, err)
		return nil, err
	}
	defer rows.Close()

	var allPoints []model.ChargeDataPoint
	for rows.Next() {
		var row struct {
			Date           sql.NullTime    `db:"date"`
			BatteryLevel   int             `db:"battery_level"`
			ChargerPower   int             `db:"charger_power"`
			ChargerVoltage int             `db:"charger_voltage"`
			ChargerCurrent int             `db:"charger_current"`
			IdealRangeKm   float64         `db:"ideal_range_km"`
			OutsideTemp    sql.NullFloat64 `db:"outside_temp"`
		}

		if err := rows.StructScan(&row); err != nil {
			continue
		}

		point := model.ChargeDataPoint{
			BatteryLevel:   row.BatteryLevel,
			ChargerPower:   row.ChargerPower,
			ChargerVoltage: row.ChargerVoltage,
			ChargerCurrent: row.ChargerCurrent,
			IdealRangeKm:   row.IdealRangeKm,
		}

		if row.Date.Valid {
			point.Date = row.Date.Time
		}
		if row.OutsideTemp.Valid {
			point.OutsideTemp = &row.OutsideTemp.Float64
		}

		allPoints = append(allPoints, point)
	}

	// 采样优化：只保留关键数据点（电量变化点、功率显著变化点）
	// 这样可以减少锯齿效果，同时保持曲线的关键特征
	var sampledPoints []model.ChargeDataPoint

	if len(allPoints) > 0 {
		// 始终保留第一个点
		sampledPoints = append(sampledPoints, allPoints[0])
		lastAddedBatteryLevel := allPoints[0].BatteryLevel
		lastAddedPower := allPoints[0].ChargerPower

		for i := 1; i < len(allPoints)-1; i++ {
			point := allPoints[i]

			// 保留条件：
			// 1. 电量变化了（每变化1%保留一个点）
			// 2. 功率变化超过3kW（捕捉充电功率的显著变化）
			batteryChanged := point.BatteryLevel != lastAddedBatteryLevel
			powerChangedSignificantly := abs(point.ChargerPower-lastAddedPower) >= 3

			if batteryChanged || powerChangedSignificantly {
				sampledPoints = append(sampledPoints, point)
				lastAddedBatteryLevel = point.BatteryLevel
				lastAddedPower = point.ChargerPower
			}
		}

		// 始终保留最后一个点
		if len(allPoints) > 1 {
			sampledPoints = append(sampledPoints, allPoints[len(allPoints)-1])
		}
	}

	return &model.ChargeStats{
		ChargingProcessID: chargeID,
		DataPoints:        sampledPoints,
	}, nil
}

// abs 返回整数的绝对值
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
