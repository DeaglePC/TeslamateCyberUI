package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"teslamate-cyberui/internal/logger"
	"teslamate-cyberui/internal/model"

	"github.com/jmoiron/sqlx"
)

// DriveRepository 驾驶数据仓储接口
type DriveRepository interface {
	GetList(ctx context.Context, carID int16, page, pageSize int, startDate, endDate *time.Time) (*model.ListResponse[model.DriveListItem], error)
	GetDetail(ctx context.Context, driveID int64) (*model.DriveDetail, error)
	GetPositions(ctx context.Context, driveID int64) ([]model.DrivePosition, error)
}

type driveRepository struct {
	db *sqlx.DB
}

// NewDriveRepository 创建驾驶仓储
func NewDriveRepository(db *sqlx.DB) DriveRepository {
	return &driveRepository{db: db}
}

// GetList 获取驾驶记录列表
func (r *driveRepository) GetList(ctx context.Context, carID int16, page, pageSize int, startDate, endDate *time.Time) (*model.ListResponse[model.DriveListItem], error) {
	// 构建查询条件
	whereClause := "WHERE d.car_id = $1"
	args := []interface{}{carID}
	argIdx := 2

	if startDate != nil {
		whereClause += fmt.Sprintf(" AND d.start_date >= $%d", argIdx)
		args = append(args, *startDate)
		argIdx++
	}
	if endDate != nil {
		whereClause += fmt.Sprintf(" AND d.start_date <= $%d", argIdx)
		args = append(args, *endDate)
		argIdx++
	}

	// 获取总数
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM drives d %s`, whereClause)
	var total int
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		logger.Errorf("Failed to count drives for car %d: %v", carID, err)
		return nil, err
	}

	// 获取列表
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT
			d.id,
			d.start_date,
			d.end_date,
			COALESCE(d.duration_min, 0) as duration_min,
			COALESCE(d.distance, 0) as distance,
			COALESCE(sa.display_name, sg.name, 'Unknown') as start_location,
			COALESCE(ea.display_name, eg.name, 'Unknown') as end_location,
			COALESCE(sp.battery_level, 0) as start_battery_level,
			COALESCE(ep.battery_level, 0) as end_battery_level,
			COALESCE(d.speed_max, 0) as speed_max,
			d.start_ideal_range_km,
			d.end_ideal_range_km
		FROM drives d
		LEFT JOIN addresses sa ON d.start_address_id = sa.id
		LEFT JOIN addresses ea ON d.end_address_id = ea.id
		LEFT JOIN geofences sg ON d.start_geofence_id = sg.id
		LEFT JOIN geofences eg ON d.end_geofence_id = eg.id
		LEFT JOIN positions sp ON d.start_position_id = sp.id
		LEFT JOIN positions ep ON d.end_position_id = ep.id
		%s
		ORDER BY d.start_date DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, pageSize, offset)

	rows, err := r.db.QueryxContext(ctx, query, args...)
	if err != nil {
		logger.Errorf("Failed to get drives for car %d: %v", carID, err)
		return nil, err
	}
	defer rows.Close()

	var items []model.DriveListItem
	for rows.Next() {
		var row struct {
			ID                int64           `db:"id"`
			StartDate         sql.NullTime    `db:"start_date"`
			EndDate           sql.NullTime    `db:"end_date"`
			DurationMin       int             `db:"duration_min"`
			Distance          float64         `db:"distance"`
			StartLocation     string          `db:"start_location"`
			EndLocation       string          `db:"end_location"`
			StartBatteryLevel int             `db:"start_battery_level"`
			EndBatteryLevel   int             `db:"end_battery_level"`
			SpeedMax          int             `db:"speed_max"`
			StartIdealRangeKm sql.NullFloat64 `db:"start_ideal_range_km"`
			EndIdealRangeKm   sql.NullFloat64 `db:"end_ideal_range_km"`
		}

		if err := rows.StructScan(&row); err != nil {
			logger.Errorf("Failed to scan drive row: %v", err)
			continue
		}

		item := model.DriveListItem{
			ID:                row.ID,
			DurationMin:       row.DurationMin,
			Distance:          row.Distance,
			StartLocation:     row.StartLocation,
			EndLocation:       row.EndLocation,
			StartBatteryLevel: row.StartBatteryLevel,
			EndBatteryLevel:   row.EndBatteryLevel,
			SpeedMax:          row.SpeedMax,
		}

		if row.StartDate.Valid {
			item.StartDate = row.StartDate.Time
		}
		if row.EndDate.Valid {
			item.EndDate = &row.EndDate.Time
		}

		// 计算能效 (Wh/km)
		if row.Distance > 0 && row.StartIdealRangeKm.Valid && row.EndIdealRangeKm.Valid {
			rangeUsed := row.StartIdealRangeKm.Float64 - row.EndIdealRangeKm.Float64
			if rangeUsed > 0 {
				// 假设续航基于某个能效值，这里用简化计算
				item.Efficiency = rangeUsed / row.Distance * 161.0 // 近似 Wh/km
			}
		}

		items = append(items, item)
	}

	return &model.ListResponse[model.DriveListItem]{
		Items: items,
		Pagination: model.Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    total,
		},
	}, nil
}

// GetDetail 获取驾驶详情
func (r *driveRepository) GetDetail(ctx context.Context, driveID int64) (*model.DriveDetail, error) {
	query := `
		SELECT
			d.id,
			d.start_date,
			d.end_date,
			COALESCE(d.duration_min, 0) as duration_min,
			COALESCE(d.distance, 0) as distance,
			COALESCE(sa.display_name, sg.name, 'Unknown') as start_location,
			COALESCE(ea.display_name, eg.name, 'Unknown') as end_location,
			COALESCE(sp.latitude, 0) as start_latitude,
			COALESCE(sp.longitude, 0) as start_longitude,
			COALESCE(ep.latitude, 0) as end_latitude,
			COALESCE(ep.longitude, 0) as end_longitude,
			COALESCE(sp.battery_level, 0) as start_battery_level,
			COALESCE(ep.battery_level, 0) as end_battery_level,
			COALESCE(d.start_ideal_range_km, 0) as start_ideal_range_km,
			COALESCE(d.end_ideal_range_km, 0) as end_ideal_range_km,
			COALESCE(d.speed_max, 0) as speed_max,
			COALESCE(d.power_max, 0) as power_max,
			COALESCE(d.power_min, 0) as power_min,
			d.outside_temp_avg,
			d.inside_temp_avg
		FROM drives d
		LEFT JOIN addresses sa ON d.start_address_id = sa.id
		LEFT JOIN addresses ea ON d.end_address_id = ea.id
		LEFT JOIN geofences sg ON d.start_geofence_id = sg.id
		LEFT JOIN geofences eg ON d.end_geofence_id = eg.id
		LEFT JOIN positions sp ON d.start_position_id = sp.id
		LEFT JOIN positions ep ON d.end_position_id = ep.id
		WHERE d.id = $1
	`

	var row struct {
		ID                int64           `db:"id"`
		StartDate         sql.NullTime    `db:"start_date"`
		EndDate           sql.NullTime    `db:"end_date"`
		DurationMin       int             `db:"duration_min"`
		Distance          float64         `db:"distance"`
		StartLocation     string          `db:"start_location"`
		EndLocation       string          `db:"end_location"`
		StartLatitude     float64         `db:"start_latitude"`
		StartLongitude    float64         `db:"start_longitude"`
		EndLatitude       float64         `db:"end_latitude"`
		EndLongitude      float64         `db:"end_longitude"`
		StartBatteryLevel int             `db:"start_battery_level"`
		EndBatteryLevel   int             `db:"end_battery_level"`
		StartIdealRangeKm float64         `db:"start_ideal_range_km"`
		EndIdealRangeKm   float64         `db:"end_ideal_range_km"`
		SpeedMax          int             `db:"speed_max"`
		PowerMax          int             `db:"power_max"`
		PowerMin          int             `db:"power_min"`
		OutsideTempAvg    sql.NullFloat64 `db:"outside_temp_avg"`
		InsideTempAvg     sql.NullFloat64 `db:"inside_temp_avg"`
	}

	if err := r.db.GetContext(ctx, &row, query, driveID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		logger.Errorf("Failed to get drive detail %d: %v", driveID, err)
		return nil, err
	}

	detail := &model.DriveDetail{
		ID:                row.ID,
		DurationMin:       row.DurationMin,
		Distance:          row.Distance,
		StartLocation:     row.StartLocation,
		EndLocation:       row.EndLocation,
		StartLatitude:     row.StartLatitude,
		StartLongitude:    row.StartLongitude,
		EndLatitude:       row.EndLatitude,
		EndLongitude:      row.EndLongitude,
		StartBatteryLevel: row.StartBatteryLevel,
		EndBatteryLevel:   row.EndBatteryLevel,
		StartIdealRangeKm: row.StartIdealRangeKm,
		EndIdealRangeKm:   row.EndIdealRangeKm,
		SpeedMax:          row.SpeedMax,
		PowerMax:          row.PowerMax,
		PowerMin:          row.PowerMin,
	}

	if row.StartDate.Valid {
		detail.StartDate = row.StartDate.Time
	}
	if row.EndDate.Valid {
		detail.EndDate = &row.EndDate.Time
	}
	if row.OutsideTempAvg.Valid {
		detail.OutsideTempAvg = &row.OutsideTempAvg.Float64
	}
	if row.InsideTempAvg.Valid {
		detail.InsideTempAvg = &row.InsideTempAvg.Float64
	}

	// 计算平均速度和能效
	if row.DurationMin > 0 {
		detail.SpeedAvg = row.Distance / (float64(row.DurationMin) / 60.0)
	}
	if row.Distance > 0 {
		rangeUsed := row.StartIdealRangeKm - row.EndIdealRangeKm
		if rangeUsed > 0 {
			detail.Efficiency = rangeUsed / row.Distance * 161.0
		}
	}

	return detail, nil
}

// GetPositions 获取驾驶轨迹点
func (r *driveRepository) GetPositions(ctx context.Context, driveID int64) ([]model.DrivePosition, error) {
	query := `
		SELECT 
			date,
			latitude,
			longitude,
			COALESCE(speed, 0) as speed,
			COALESCE(power, 0) as power,
			COALESCE(battery_level, 0) as battery_level,
			elevation
		FROM positions
		WHERE drive_id = $1
		ORDER BY date ASC
	`

	rows, err := r.db.QueryxContext(ctx, query, driveID)
	if err != nil {
		logger.Errorf("Failed to get drive positions %d: %v", driveID, err)
		return nil, err
	}
	defer rows.Close()

	var positions []model.DrivePosition
	for rows.Next() {
		var row struct {
			Date         sql.NullTime  `db:"date"`
			Latitude     float64       `db:"latitude"`
			Longitude    float64       `db:"longitude"`
			Speed        int           `db:"speed"`
			Power        int           `db:"power"`
			BatteryLevel int           `db:"battery_level"`
			Elevation    sql.NullInt64 `db:"elevation"`
		}

		if err := rows.StructScan(&row); err != nil {
			continue
		}

		pos := model.DrivePosition{
			Latitude:     row.Latitude,
			Longitude:    row.Longitude,
			Speed:        row.Speed,
			Power:        row.Power,
			BatteryLevel: row.BatteryLevel,
		}

		if row.Date.Valid {
			pos.Date = row.Date.Time
		}
		if row.Elevation.Valid {
			elev := int(row.Elevation.Int64)
			pos.Elevation = &elev
		}

		positions = append(positions, pos)
	}

	return positions, nil
}
