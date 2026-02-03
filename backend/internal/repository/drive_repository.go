package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"teslamate-cyberui/internal/logger"
	"teslamate-cyberui/internal/model"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// DriveRepository 驾驶数据仓储接口
type DriveRepository interface {
	GetList(ctx context.Context, carID int16, page, pageSize int, startDate, endDate *time.Time) (*model.ListResponse[model.DriveListItem], error)
	GetDetail(ctx context.Context, driveID int64) (*model.DriveDetail, error)
	GetPositions(ctx context.Context, driveID int64) ([]model.DrivePosition, error)
	GetAllDrivesPositions(ctx context.Context, carID int16, startDate, endDate *time.Time) ([]model.DriveTrack, error)
	GetStatsSummary(ctx context.Context, carID int16, startDate, endDate *time.Time) (*model.DriveStatsSummary, error)
	GetSpeedHistogram(ctx context.Context, carID int16, startDate, endDate *time.Time) ([]model.SpeedHistogramItem, error)
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

// GetAllDrivesPositions 获取指定时间范围内所有行程的轨迹点
func (r *driveRepository) GetAllDrivesPositions(ctx context.Context, carID int16, startDate, endDate *time.Time) ([]model.DriveTrack, error) {
	// 构建时间筛选条件，过滤掉距离小于2km的短途行程
	whereClause := "WHERE d.car_id = $1 AND d.end_date IS NOT NULL AND COALESCE(d.distance, 0) >= 2"
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

	// 获取所有符合条件的行程ID和开始时间
	driveQuery := fmt.Sprintf(`
		SELECT d.id, d.start_date
		FROM drives d
		%s
		ORDER BY d.start_date DESC
		LIMIT 100
	`, whereClause)

	driveRows, err := r.db.QueryxContext(ctx, driveQuery, args...)
	if err != nil {
		logger.Errorf("Failed to get drives for positions: %v", err)
		return nil, err
	}
	defer driveRows.Close()

	var tracks []model.DriveTrack
	var driveIDs []int64
	driveStartDates := make(map[int64]time.Time)

	for driveRows.Next() {
		var id int64
		var startDateVal sql.NullTime
		if err := driveRows.Scan(&id, &startDateVal); err != nil {
			continue
		}
		driveIDs = append(driveIDs, id)
		if startDateVal.Valid {
			driveStartDates[id] = startDateVal.Time
		}
	}

	if len(driveIDs) == 0 {
		return tracks, nil
	}

	// 批量获取所有轨迹点，按 drive_id 分组
	// 对轨迹点进行采样，每个行程最多100个点
	posQuery := `
		WITH numbered AS (
			SELECT 
				drive_id,
				date,
				latitude,
				longitude,
				COALESCE(speed, 0) as speed,
				COALESCE(power, 0) as power,
				COALESCE(battery_level, 0) as battery_level,
				elevation,
				ROW_NUMBER() OVER (PARTITION BY drive_id ORDER BY date) as rn,
				COUNT(*) OVER (PARTITION BY drive_id) as total
			FROM positions
			WHERE drive_id = ANY($1)
		)
		SELECT 
			drive_id,
			date,
			latitude,
			longitude,
			speed,
			power,
			battery_level,
			elevation
		FROM numbered
		WHERE rn = 1 OR rn = total OR rn % GREATEST(1, total / 100) = 0
		ORDER BY drive_id, date
	`

	posRows, err := r.db.QueryxContext(ctx, posQuery, pq.Array(driveIDs))
	if err != nil {
		logger.Errorf("Failed to get batch positions: %v", err)
		return nil, err
	}
	defer posRows.Close()

	// 按 drive_id 组织轨迹点
	trackMap := make(map[int64][]model.DrivePosition)

	for posRows.Next() {
		var row struct {
			DriveID      int64         `db:"drive_id"`
			Date         sql.NullTime  `db:"date"`
			Latitude     float64       `db:"latitude"`
			Longitude    float64       `db:"longitude"`
			Speed        int           `db:"speed"`
			Power        int           `db:"power"`
			BatteryLevel int           `db:"battery_level"`
			Elevation    sql.NullInt64 `db:"elevation"`
		}

		if err := posRows.StructScan(&row); err != nil {
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

		trackMap[row.DriveID] = append(trackMap[row.DriveID], pos)
	}

	// 按照原始顺序构建结果
	for _, driveID := range driveIDs {
		if positions, ok := trackMap[driveID]; ok && len(positions) > 0 {
			tracks = append(tracks, model.DriveTrack{
				DriveID:   driveID,
				StartDate: driveStartDates[driveID],
				Positions: positions,
			})
		}
	}

	return tracks, nil
}

// GetStatsSummary 获取驾驶统计摘要
func (r *driveRepository) GetStatsSummary(ctx context.Context, carID int16, startDate, endDate *time.Time) (*model.DriveStatsSummary, error) {
	// 构建查询条件
	whereClause := "WHERE car_id = $1 AND end_date IS NOT NULL"
	args := []interface{}{carID}
	argIdx := 2

	if startDate != nil {
		whereClause += fmt.Sprintf(" AND start_date >= $%d", argIdx)
		args = append(args, *startDate)
		argIdx++
	}
	if endDate != nil {
		whereClause += fmt.Sprintf(" AND start_date <= $%d", argIdx)
		args = append(args, *endDate)
		argIdx++
	}

	// 查询总距离、驾驶次数、最大速度
	statsQuery := fmt.Sprintf(`
		SELECT 
			COALESCE(SUM(distance), 0) as total_distance,
			COALESCE(MAX(speed_max), 0) as max_speed,
			COUNT(*) as drive_count
		FROM drives
		%s
	`, whereClause)

	var totalDistance float64
	var maxSpeed int
	var driveCount int

	row := r.db.QueryRowxContext(ctx, statsQuery, args...)
	if err := row.Scan(&totalDistance, &maxSpeed, &driveCount); err != nil {
		logger.Errorf("Failed to get drive stats summary for car %d: %v", carID, err)
		return nil, err
	}

	// 查询中位距离
	medianQuery := fmt.Sprintf(`
		SELECT COALESCE((percentile_cont(0.5) WITHIN GROUP (ORDER BY distance))::numeric, 0) as median_distance
		FROM drives
		%s
	`, whereClause)

	var medianDistance float64
	if err := r.db.GetContext(ctx, &medianDistance, medianQuery, args...); err != nil {
		logger.Errorf("Failed to get median distance for car %d: %v", carID, err)
		medianDistance = 0
	}

	// 获取该车辆首次有记录的日期
	var firstRecordDate time.Time
	firstRecordQuery := `SELECT MIN(start_date) FROM drives WHERE car_id = $1 AND end_date IS NOT NULL`
	if err := r.db.GetContext(ctx, &firstRecordDate, firstRecordQuery, carID); err != nil {
		logger.Errorf("Failed to get first record date for car %d: %v", carID, err)
		firstRecordDate = time.Time{}
	}

	// 计算统计天数 - 参考 Grafana 的计算方式
	// 实际起始日期 = max(用户选择的开始日期, 首次有数据的日期)
	// 这样如果用户选择近一年，但实际只有3个月的数据，就按3个月计算
	var daysInPeriod int
	if endDate != nil {
		actualStartDate := firstRecordDate
		if startDate != nil && startDate.After(firstRecordDate) {
			actualStartDate = *startDate
		}
		// 计算实际起始日期到结束日期的天数
		duration := endDate.Sub(actualStartDate)
		daysInPeriod = int(duration.Hours()/24) + 1
		if daysInPeriod < 1 {
			daysInPeriod = 1
		}
	} else {
		// 如果没有指定结束日期，计算第一条到最后一条记录的天数
		daysQuery := fmt.Sprintf(`
			SELECT GREATEST(
				EXTRACT(DAY FROM (MAX(start_date) - MIN(start_date)))::int + 1,
				1
			) as days_in_period
			FROM drives
			%s
		`, whereClause)
		if err := r.db.GetContext(ctx, &daysInPeriod, daysQuery, args...); err != nil {
			daysInPeriod = 1
		}
	}

	// 计算平均每日行驶距离
	avgDailyDistance := 0.0
	if daysInPeriod > 0 {
		avgDailyDistance = totalDistance / float64(daysInPeriod)
	}

	// 计算外推里程 - 参考 Grafana 的计算方式
	// 月度里程外推 = 总距离 / 实际天数 * (365/12)
	// 年度里程外推 = 总距离 / 实际天数 * 365
	extrapolatedMonthlyKm := 0.0
	extrapolatedAnnualKm := 0.0
	if daysInPeriod > 0 {
		dailyAvg := totalDistance / float64(daysInPeriod)
		extrapolatedMonthlyKm = dailyAvg * (365.0 / 12.0)
		extrapolatedAnnualKm = dailyAvg * 365.0
	}

	return &model.DriveStatsSummary{
		TotalDistance:         totalDistance,
		MedianDistance:        medianDistance,
		AvgDailyDistance:      avgDailyDistance,
		MaxSpeed:              maxSpeed,
		DriveCount:            driveCount,
		DaysInPeriod:          daysInPeriod,
		ExtrapolatedMonthlyKm: extrapolatedMonthlyKm,
		ExtrapolatedAnnualKm:  extrapolatedAnnualKm,
	}, nil
}

// GetSpeedHistogram 获取速度直方图数据
func (r *driveRepository) GetSpeedHistogram(ctx context.Context, carID int16, startDate, endDate *time.Time) ([]model.SpeedHistogramItem, error) {
	// 构建时间筛选条件
	timeFilter := ""
	args := []interface{}{carID}
	argIdx := 2

	if startDate != nil {
		timeFilter += fmt.Sprintf(" AND p.date >= $%d", argIdx)
		args = append(args, *startDate)
		argIdx++
	}
	if endDate != nil {
		timeFilter += fmt.Sprintf(" AND p.date <= $%d", argIdx)
		args = append(args, *endDate)
		argIdx++
	}

	// 参考 Grafana 的 SQL 查询
	query := fmt.Sprintf(`
		WITH drivedata AS (
			SELECT
				ROUND(p.speed::numeric / 10, 0) * 10 AS speed_section,
				EXTRACT(EPOCH FROM (LEAD(p.date) OVER (PARTITION BY p.drive_id ORDER BY p.date) - p.date)) AS seconds_elapsed
			FROM positions p
			WHERE p.car_id = $1 %s AND p.ideal_battery_range_km IS NOT NULL
		)
		SELECT 
			speed_section AS speed,
			SUM(seconds_elapsed) * 100 / NULLIF(SUM(SUM(seconds_elapsed)) OVER (), 0) AS elapsed,
			SUM(seconds_elapsed) AS time_seconds
		FROM drivedata
		WHERE speed_section > 0
		GROUP BY speed_section
		ORDER BY speed_section
	`, timeFilter)

	rows, err := r.db.QueryxContext(ctx, query, args...)
	if err != nil {
		logger.Errorf("Failed to get speed histogram for car %d: %v", carID, err)
		return nil, err
	}
	defer rows.Close()

	var items []model.SpeedHistogramItem
	for rows.Next() {
		var item struct {
			Speed       sql.NullInt64   `db:"speed"`
			Elapsed     sql.NullFloat64 `db:"elapsed"`
			TimeSeconds sql.NullFloat64 `db:"time_seconds"`
		}

		if err := rows.StructScan(&item); err != nil {
			continue
		}

		histItem := model.SpeedHistogramItem{
			Speed:       int(item.Speed.Int64),
			Elapsed:     item.Elapsed.Float64,
			TimeSeconds: item.TimeSeconds.Float64,
		}

		items = append(items, histItem)
	}

	return items, nil
}
