package repository

import (
	"context"
	"database/sql"
	"fmt"

	"teslamate-cyberui/internal/logger"
	"teslamate-cyberui/internal/model"

	"github.com/jmoiron/sqlx"
)

// CarRepository 车辆数据仓储接口
type CarRepository interface {
	GetAll(ctx context.Context) ([]model.Car, error)
	GetByID(ctx context.Context, id int16) (*model.Car, error)
	GetStatus(ctx context.Context, carID int16) (*model.CarStatus, error)
}

type carRepository struct {
	db *sqlx.DB
}

// NewCarRepository 创建车辆仓储
func NewCarRepository(db *sqlx.DB) CarRepository {
	return &carRepository{db: db}
}

// GetAll 获取所有车辆
func (r *carRepository) GetAll(ctx context.Context) ([]model.Car, error) {
	query := `
		SELECT 
			id, eid, vid, vin, model, efficiency, inserted_at, updated_at,
			name, trim_badging, exterior_color, spoiler_type, wheel_type,
			display_priority, marketing_name
		FROM cars 
		ORDER BY display_priority ASC, id ASC
	`
	var cars []model.Car
	if err := r.db.SelectContext(ctx, &cars, query); err != nil {
		logger.Errorf("Failed to get all cars: %v", err)
		return nil, err
	}
	return cars, nil
}

// GetByID 根据ID获取车辆
func (r *carRepository) GetByID(ctx context.Context, id int16) (*model.Car, error) {
	query := `
		SELECT 
			id, eid, vid, vin, model, efficiency, inserted_at, updated_at,
			name, trim_badging, exterior_color, spoiler_type, wheel_type,
			display_priority, marketing_name
		FROM cars 
		WHERE id = $1
	`
	var car model.Car
	if err := r.db.GetContext(ctx, &car, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		logger.Errorf("Failed to get car by id %d: %v", id, err)
		return nil, err
	}
	return &car, nil
}

// GetStatus 获取车辆实时状态
func (r *carRepository) GetStatus(ctx context.Context, carID int16) (*model.CarStatus, error) {
	// 获取车辆基本信息
	car, err := r.GetByID(ctx, carID)
	if err != nil {
		return nil, err
	}
	if car == nil {
		return nil, nil
	}

	status := &model.CarStatus{
		CarID: carID,
	}

	if car.Name.Valid {
		status.Name = car.Name.String
	}
	if car.Model.Valid {
		status.Model = car.Model.String
	}
	if car.TrimBadging.Valid {
		status.Model = status.Model + " " + car.TrimBadging.String
	}

	// 获取设置中的 preferred_range 和 unit_of_length
	preferredRangeQuery := `
		SELECT preferred_range, unit_of_length
		FROM settings
		ORDER BY id DESC
		LIMIT 1
	`
	var settings struct {
		PreferredRange string `db:"preferred_range"`
		UnitOfLength   string `db:"unit_of_length"`
	}
	preferredRange := "ideal"
	unitOfLength := "km"
	if err := r.db.GetContext(ctx, &settings, preferredRangeQuery); err == nil {
		if settings.PreferredRange != "" {
			preferredRange = settings.PreferredRange
		}
		if settings.UnitOfLength != "" {
			unitOfLength = settings.UnitOfLength
		}
	}

	// 获取最新状态
	stateQuery := `
		SELECT state, start_date
		FROM states
		WHERE car_id = $1
		ORDER BY start_date DESC
		LIMIT 1
	`
	var state struct {
		State     string       `db:"state"`
		StartDate sql.NullTime `db:"start_date"`
	}
	if err := r.db.GetContext(ctx, &state, stateQuery, carID); err == nil {
		status.State = state.State
		if state.StartDate.Valid {
			status.Since = &state.StartDate.Time
		}
	}

	// 获取续航里程（从 positions 和 charges 表联合查询）
	// 根据 preferred_range 选择 ideal 或 rated battery range
	rangeColumn := "ideal_battery_range_km"
	if preferredRange == "rated" {
		rangeColumn = "rated_battery_range_km"
	}

	rangeQuery := fmt.Sprintf(`
		SELECT COALESCE(
			(SELECT %s FROM positions
				WHERE car_id = $1 AND ideal_battery_range_km IS NOT NULL
				ORDER BY date DESC LIMIT 1),
			(SELECT c.%s FROM charges c
				JOIN charging_processes p ON p.id = c.charging_process_id
				WHERE p.car_id = $1 ORDER BY c.date DESC LIMIT 1),
			0
		) as range_km
	`, rangeColumn, rangeColumn)
	var rangeKm float64
	if err := r.db.GetContext(ctx, &rangeKm, rangeQuery, carID); err == nil {
		// 根据单位转换
		if unitOfLength == "mi" {
			status.IdealRange = rangeKm * 0.621371
		} else {
			status.IdealRange = rangeKm
		}
	}

	// 获取电池电量（从 positions 和 charges 表联合查询）
	batteryQuery := `
		SELECT COALESCE(
			(SELECT battery_level FROM positions
				WHERE car_id = $1 AND ideal_battery_range_km IS NOT NULL
				ORDER BY date DESC LIMIT 1),
			(SELECT c.battery_level FROM charges c
				JOIN charging_processes p ON p.id = c.charging_process_id
				WHERE p.car_id = $1 ORDER BY c.date DESC LIMIT 1)
		) as battery_level
	`
	var batteryLevel sql.NullInt64
	if err := r.db.GetContext(ctx, &batteryLevel, batteryQuery, carID); err == nil && batteryLevel.Valid {
		status.BatteryLevel = int(batteryLevel.Int64)
	}

	// 获取最新位置信息
	positionQuery := `
		SELECT
			p.latitude, p.longitude, p.odometer, p.ideal_battery_range_km,
			p.est_battery_range_km, p.rated_battery_range_km, p.usable_battery_level,
			p.inside_temp, p.outside_temp, p.is_climate_on,
			g.name as geofence_name
		FROM positions p
		LEFT JOIN geofences g ON ST_Contains(
			ST_Buffer(ST_SetSRID(ST_MakePoint(g.longitude, g.latitude), 4326)::geography, g.radius)::geometry,
			ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)
		)
		WHERE p.car_id = $1
		ORDER BY p.date DESC
		LIMIT 1
	`
	var pos struct {
		Latitude           sql.NullFloat64 `db:"latitude"`
		Longitude          sql.NullFloat64 `db:"longitude"`
		Odometer           sql.NullFloat64 `db:"odometer"`
		IdealBatteryRangeKm sql.NullFloat64 `db:"ideal_battery_range_km"`
		EstBatteryRangeKm   sql.NullFloat64 `db:"est_battery_range_km"`
		RatedBatteryRangeKm sql.NullFloat64 `db:"rated_battery_range_km"`
		UsableBatteryLevel  sql.NullInt64   `db:"usable_battery_level"`
		InsideTemp          sql.NullFloat64 `db:"inside_temp"`
		OutsideTemp         sql.NullFloat64 `db:"outside_temp"`
		IsClimateOn         sql.NullBool    `db:"is_climate_on"`
		GeofenceName        sql.NullString  `db:"geofence_name"`
	}

	if err := r.db.GetContext(ctx, &pos, positionQuery, carID); err == nil {
		if pos.Latitude.Valid {
			status.Latitude = &pos.Latitude.Float64
		}
		if pos.Longitude.Valid {
			status.Longitude = &pos.Longitude.Float64
		}
		if pos.Odometer.Valid {
			status.Odometer = pos.Odometer.Float64
		}
		// RatedRange 从 positions 表单独获取（作为备用）
		if pos.RatedBatteryRangeKm.Valid {
			status.RatedRange = pos.RatedBatteryRangeKm.Float64
		}
		if pos.UsableBatteryLevel.Valid {
			status.UsableBatteryLevel = int(pos.UsableBatteryLevel.Int64)
		}
		if pos.InsideTemp.Valid {
			status.InsideTemp = &pos.InsideTemp.Float64
		}
		if pos.OutsideTemp.Valid {
			status.OutsideTemp = &pos.OutsideTemp.Float64
		}
		if pos.IsClimateOn.Valid {
			status.IsClimateOn = pos.IsClimateOn.Bool
		}
		if pos.GeofenceName.Valid {
			status.Geofence = &pos.GeofenceName.String
		}
	}

	// 获取软件版本
	versionQuery := `
		SELECT version FROM updates
		WHERE car_id = $1
		ORDER BY start_date DESC
		LIMIT 1
	`
	var version sql.NullString
	if err := r.db.GetContext(ctx, &version, versionQuery, carID); err == nil && version.Valid {
		status.SoftwareVersion = version.String
	}

	status.Healthy = true

	return status, nil
}
