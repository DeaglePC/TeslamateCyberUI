package model

import (
	"database/sql"
	"time"
)

// Car 车辆信息
type Car struct {
	ID              int16          `db:"id" json:"id"`
	EID             int64          `db:"eid" json:"eid"`
	VID             int64          `db:"vid" json:"vid"`
	VIN             sql.NullString `db:"vin" json:"vin,omitempty"`
	Model           sql.NullString `db:"model" json:"model,omitempty"`
	Efficiency      sql.NullFloat64 `db:"efficiency" json:"efficiency,omitempty"`
	InsertedAt      time.Time      `db:"inserted_at" json:"insertedAt"`
	UpdatedAt       time.Time      `db:"updated_at" json:"updatedAt"`
	Name            sql.NullString `db:"name" json:"name,omitempty"`
	TrimBadging     sql.NullString `db:"trim_badging" json:"trimBadging,omitempty"`
	SettingsID      int64          `db:"settings_id" json:"settingsId"`
	ExteriorColor   sql.NullString `db:"exterior_color" json:"exteriorColor,omitempty"`
	SpoilerType     sql.NullString `db:"spoiler_type" json:"spoilerType,omitempty"`
	WheelType       sql.NullString `db:"wheel_type" json:"wheelType,omitempty"`
	DisplayPriority int16          `db:"display_priority" json:"displayPriority"`
	MarketingName   sql.NullString `db:"marketing_name" json:"marketingName,omitempty"`
}

// CarStatus 车辆实时状态
type CarStatus struct {
	CarID               int16           `json:"carId"`
	Name                string          `json:"name"`
	Model               string          `json:"model"`
	State               string          `json:"state"`
	Since               *time.Time      `json:"since,omitempty"`
	Healthy             bool            `json:"healthy"`
	BatteryLevel        int             `json:"batteryLevel"`
	UsableBatteryLevel  int             `json:"usableBatteryLevel"`
	IdealRange          float64         `json:"idealRange"`
	EstRange            float64         `json:"estRange"`
	RatedRange          float64         `json:"ratedRange"`
	Odometer            float64         `json:"odometer"`
	InsideTemp          *float64        `json:"insideTemp,omitempty"`
	OutsideTemp         *float64        `json:"outsideTemp,omitempty"`
	IsClimateOn         bool            `json:"isClimateOn"`
	IsPreconditioning   bool            `json:"isPreconditioning"`
	Locked              *bool           `json:"locked,omitempty"`
	SentryMode          *bool           `json:"sentryMode,omitempty"`
	PluggedIn           *bool           `json:"pluggedIn,omitempty"`
	ScheduledChargingStartTime *time.Time `json:"scheduledChargingStartTime,omitempty"`
	Latitude            *float64        `json:"latitude,omitempty"`
	Longitude           *float64        `json:"longitude,omitempty"`
	Heading             *int            `json:"heading,omitempty"`
	Geofence            *string         `json:"geofence,omitempty"`
	SoftwareVersion     string          `json:"softwareVersion"`
}

// Position 位置信息
type Position struct {
	ID               int64          `db:"id" json:"id"`
	Date             time.Time      `db:"date" json:"date"`
	Latitude         float64        `db:"latitude" json:"latitude"`
	Longitude        float64        `db:"longitude" json:"longitude"`
	Speed            sql.NullInt16  `db:"speed" json:"speed,omitempty"`
	Power            sql.NullInt16  `db:"power" json:"power,omitempty"`
	Odometer         sql.NullFloat64 `db:"odometer" json:"odometer,omitempty"`
	IdealBatteryRangeKm sql.NullFloat64 `db:"ideal_battery_range_km" json:"idealBatteryRangeKm,omitempty"`
	BatteryLevel     sql.NullInt16  `db:"battery_level" json:"batteryLevel,omitempty"`
	OutsideTemp      sql.NullFloat64 `db:"outside_temp" json:"outsideTemp,omitempty"`
	Elevation        sql.NullInt16  `db:"elevation" json:"elevation,omitempty"`
	FanStatus        sql.NullInt64  `db:"fan_status" json:"fanStatus,omitempty"`
	DriverTempSetting sql.NullFloat64 `db:"driver_temp_setting" json:"driverTempSetting,omitempty"`
	PassengerTempSetting sql.NullFloat64 `db:"passenger_temp_setting" json:"passengerTempSetting,omitempty"`
	IsClimateOn      sql.NullBool   `db:"is_climate_on" json:"isClimateOn,omitempty"`
	IsRearDefrosterOn sql.NullBool  `db:"is_rear_defroster_on" json:"isRearDefrosterOn,omitempty"`
	IsFrontDefrosterOn sql.NullBool `db:"is_front_defroster_on" json:"isFrontDefrosterOn,omitempty"`
	CarID            int16          `db:"car_id" json:"carId"`
	DriveID          sql.NullInt64  `db:"drive_id" json:"driveId,omitempty"`
	InsideTemp       sql.NullFloat64 `db:"inside_temp" json:"insideTemp,omitempty"`
	BatteryHeater    sql.NullBool   `db:"battery_heater" json:"batteryHeater,omitempty"`
	BatteryHeaterOn  sql.NullBool   `db:"battery_heater_on" json:"batteryHeaterOn,omitempty"`
	BatteryHeaterNoPower sql.NullBool `db:"battery_heater_no_power" json:"batteryHeaterNoPower,omitempty"`
	EstBatteryRangeKm sql.NullFloat64 `db:"est_battery_range_km" json:"estBatteryRangeKm,omitempty"`
	RatedBatteryRangeKm sql.NullFloat64 `db:"rated_battery_range_km" json:"ratedBatteryRangeKm,omitempty"`
	UsableBatteryLevel sql.NullInt16 `db:"usable_battery_level" json:"usableBatteryLevel,omitempty"`
	TpmsPressureFL    sql.NullFloat64 `db:"tpms_pressure_fl" json:"tpmsPressureFl,omitempty"`
	TpmsPressureFR    sql.NullFloat64 `db:"tpms_pressure_fr" json:"tpmsPressureFr,omitempty"`
	TpmsPressureRL    sql.NullFloat64 `db:"tpms_pressure_rl" json:"tpmsPressureRl,omitempty"`
	TpmsPressureRR    sql.NullFloat64 `db:"tpms_pressure_rr" json:"tpmsPressureRr,omitempty"`
}
