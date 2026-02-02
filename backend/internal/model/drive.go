package model

import (
	"database/sql"
	"time"
)

// Drive 驾驶记录
type Drive struct {
	ID                    int64           `db:"id" json:"id"`
	StartDate             time.Time       `db:"start_date" json:"startDate"`
	EndDate               sql.NullTime    `db:"end_date" json:"endDate,omitempty"`
	OutsideTempAvg        sql.NullFloat64 `db:"outside_temp_avg" json:"outsideTempAvg,omitempty"`
	SpeedMax              sql.NullInt16   `db:"speed_max" json:"speedMax,omitempty"`
	PowerMax              sql.NullInt16   `db:"power_max" json:"powerMax,omitempty"`
	PowerMin              sql.NullInt16   `db:"power_min" json:"powerMin,omitempty"`
	StartIdealRangeKm     sql.NullFloat64 `db:"start_ideal_range_km" json:"startIdealRangeKm,omitempty"`
	EndIdealRangeKm       sql.NullFloat64 `db:"end_ideal_range_km" json:"endIdealRangeKm,omitempty"`
	StartKm               sql.NullFloat64 `db:"start_km" json:"startKm,omitempty"`
	EndKm                 sql.NullFloat64 `db:"end_km" json:"endKm,omitempty"`
	Distance              sql.NullFloat64 `db:"distance" json:"distance,omitempty"`
	DurationMin           sql.NullInt16   `db:"duration_min" json:"durationMin,omitempty"`
	CarID                 int16           `db:"car_id" json:"carId"`
	InsideTempAvg         sql.NullFloat64 `db:"inside_temp_avg" json:"insideTempAvg,omitempty"`
	StartAddressID        sql.NullInt64   `db:"start_address_id" json:"startAddressId,omitempty"`
	EndAddressID          sql.NullInt64   `db:"end_address_id" json:"endAddressId,omitempty"`
	StartRatedRangeKm     sql.NullFloat64 `db:"start_rated_range_km" json:"startRatedRangeKm,omitempty"`
	EndRatedRangeKm       sql.NullFloat64 `db:"end_rated_range_km" json:"endRatedRangeKm,omitempty"`
	StartPositionID       sql.NullInt64   `db:"start_position_id" json:"startPositionId,omitempty"`
	EndPositionID         sql.NullInt64   `db:"end_position_id" json:"endPositionId,omitempty"`
	StartGeofenceID       sql.NullInt64   `db:"start_geofence_id" json:"startGeofenceId,omitempty"`
	EndGeofenceID         sql.NullInt64   `db:"end_geofence_id" json:"endGeofenceId,omitempty"`
	StartBatteryLevel     sql.NullInt16   `db:"start_battery_level" json:"startBatteryLevel,omitempty"`
	EndBatteryLevel       sql.NullInt16   `db:"end_battery_level" json:"endBatteryLevel,omitempty"`
	Ascent                sql.NullInt16   `db:"ascent" json:"ascent,omitempty"`
	Descent               sql.NullInt16   `db:"descent" json:"descent,omitempty"`
}

// DriveListItem 驾驶记录列表项
type DriveListItem struct {
	ID                int64      `json:"id"`
	StartDate         time.Time  `json:"startDate"`
	EndDate           *time.Time `json:"endDate,omitempty"`
	DurationMin       int        `json:"durationMin"`
	Distance          float64    `json:"distance"`
	StartLocation     string     `json:"startLocation"`
	EndLocation       string     `json:"endLocation"`
	StartBatteryLevel int        `json:"startBatteryLevel"`
	EndBatteryLevel   int        `json:"endBatteryLevel"`
	Efficiency        float64    `json:"efficiency"`
	SpeedMax          int        `json:"speedMax"`
}

// DriveDetail 驾驶详情
type DriveDetail struct {
	ID                int64      `json:"id"`
	StartDate         time.Time  `json:"startDate"`
	EndDate           *time.Time `json:"endDate,omitempty"`
	DurationMin       int        `json:"durationMin"`
	Distance          float64    `json:"distance"`
	StartLocation     string     `json:"startLocation"`
	EndLocation       string     `json:"endLocation"`
	StartLatitude     float64    `json:"startLatitude"`
	StartLongitude    float64    `json:"startLongitude"`
	EndLatitude       float64    `json:"endLatitude"`
	EndLongitude      float64    `json:"endLongitude"`
	StartBatteryLevel int        `json:"startBatteryLevel"`
	EndBatteryLevel   int        `json:"endBatteryLevel"`
	StartIdealRangeKm float64    `json:"startIdealRangeKm"`
	EndIdealRangeKm   float64    `json:"endIdealRangeKm"`
	Efficiency        float64    `json:"efficiency"`
	SpeedMax          int        `json:"speedMax"`
	SpeedAvg          float64    `json:"speedAvg"`
	PowerMax          int        `json:"powerMax"`
	PowerMin          int        `json:"powerMin"`
	OutsideTempAvg    *float64   `json:"outsideTempAvg,omitempty"`
	InsideTempAvg     *float64   `json:"insideTempAvg,omitempty"`
}

// DrivePosition 驾驶轨迹点
type DrivePosition struct {
	Date         time.Time `json:"date"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	Speed        int       `json:"speed"`
	Power        int       `json:"power"`
	BatteryLevel int       `json:"batteryLevel"`
	Elevation    *int      `json:"elevation,omitempty"`
}

// DriveStatsSummary 驾驶统计摘要
type DriveStatsSummary struct {
	TotalDistance           float64 `json:"totalDistance"`           // 记录距离 (km)
	MedianDistance          float64 `json:"medianDistance"`          // 中位距离 (km)
	AvgDailyDistance        float64 `json:"avgDailyDistance"`        // 平均每日行驶距离 (km)
	MaxSpeed                int     `json:"maxSpeed"`                // 最大速度 (km/h)
	DriveCount              int     `json:"driveCount"`              // 驾驶次数
	DaysInPeriod            int     `json:"daysInPeriod"`            // 统计天数
	ExtrapolatedMonthlyKm   float64 `json:"extrapolatedMonthlyKm"`   // 月度里程外推 (km)
	ExtrapolatedAnnualKm    float64 `json:"extrapolatedAnnualKm"`    // 年度里程外推 (km)
}

// SpeedHistogramItem 速度直方图数据项
type SpeedHistogramItem struct {
	Speed       int     `json:"speed"`       // 速度区间 (km/h)
	Elapsed     float64 `json:"elapsed"`     // 占比百分比
	TimeSeconds float64 `json:"timeSeconds"` // 时长秒数
}
