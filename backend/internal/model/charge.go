package model

import (
	"database/sql"
	"time"
)

// ChargingProcess 充电过程
type ChargingProcess struct {
	ID                int64           `db:"id" json:"id"`
	StartDate         time.Time       `db:"start_date" json:"startDate"`
	EndDate           sql.NullTime    `db:"end_date" json:"endDate,omitempty"`
	ChargeEnergyAdded sql.NullFloat64 `db:"charge_energy_added" json:"chargeEnergyAdded,omitempty"`
	StartIdealRangeKm sql.NullFloat64 `db:"start_ideal_range_km" json:"startIdealRangeKm,omitempty"`
	EndIdealRangeKm   sql.NullFloat64 `db:"end_ideal_range_km" json:"endIdealRangeKm,omitempty"`
	StartBatteryLevel sql.NullInt16   `db:"start_battery_level" json:"startBatteryLevel,omitempty"`
	EndBatteryLevel   sql.NullInt16   `db:"end_battery_level" json:"endBatteryLevel,omitempty"`
	DurationMin       sql.NullInt16   `db:"duration_min" json:"durationMin,omitempty"`
	OutsideTempAvg    sql.NullFloat64 `db:"outside_temp_avg" json:"outsideTempAvg,omitempty"`
	CarID             int16           `db:"car_id" json:"carId"`
	PositionID        int64           `db:"position_id" json:"positionId"`
	AddressID         sql.NullInt64   `db:"address_id" json:"addressId,omitempty"`
	StartRatedRangeKm sql.NullFloat64 `db:"start_rated_range_km" json:"startRatedRangeKm,omitempty"`
	EndRatedRangeKm   sql.NullFloat64 `db:"end_rated_range_km" json:"endRatedRangeKm,omitempty"`
	GeofenceID        sql.NullInt64   `db:"geofence_id" json:"geofenceId,omitempty"`
	ChargeEnergyUsed  sql.NullFloat64 `db:"charge_energy_used" json:"chargeEnergyUsed,omitempty"`
	Cost              sql.NullFloat64 `db:"cost" json:"cost,omitempty"`
}

// ChargeListItem 充电记录列表项
type ChargeListItem struct {
	ID                int64      `json:"id"`
	StartDate         time.Time  `json:"startDate"`
	EndDate           *time.Time `json:"endDate,omitempty"`
	DurationMin       int        `json:"durationMin"`
	ChargeEnergyAdded float64    `json:"chargeEnergyAdded"`
	StartBatteryLevel int        `json:"startBatteryLevel"`
	EndBatteryLevel   int        `json:"endBatteryLevel"`
	Location          string     `json:"location"`
	Cost              *float64   `json:"cost,omitempty"`
	Latitude          *float64   `json:"latitude,omitempty"`
	Longitude         *float64   `json:"longitude,omitempty"`
	ChargeType        string     `json:"chargeType"` // "AC" 或 "DC"
}

// ChargeDetail 充电详情
type ChargeDetail struct {
	ID                int64      `json:"id"`
	StartDate         time.Time  `json:"startDate"`
	EndDate           *time.Time `json:"endDate,omitempty"`
	DurationMin       int        `json:"durationMin"`
	ChargeEnergyAdded float64    `json:"chargeEnergyAdded"`
	ChargeEnergyUsed  *float64   `json:"chargeEnergyUsed,omitempty"`
	StartBatteryLevel int        `json:"startBatteryLevel"`
	EndBatteryLevel   int        `json:"endBatteryLevel"`
	StartIdealRangeKm float64    `json:"startIdealRangeKm"`
	EndIdealRangeKm   float64    `json:"endIdealRangeKm"`
	StartRatedRangeKm float64    `json:"startRatedRangeKm"`
	EndRatedRangeKm   float64    `json:"endRatedRangeKm"`
	OutsideTempAvg    *float64   `json:"outsideTempAvg,omitempty"`
	Location          string     `json:"location"`
	Latitude          *float64   `json:"latitude,omitempty"`
	Longitude         *float64   `json:"longitude,omitempty"`
	Cost              *float64   `json:"cost,omitempty"`
	Efficiency        *float64   `json:"efficiency,omitempty"`
	ChargeType        string     `json:"chargeType"` // "AC" 或 "DC"
}

// Charge 充电数据点
type Charge struct {
	ID                   int64           `db:"id" json:"id"`
	Date                 time.Time       `db:"date" json:"date"`
	BatteryLevel         sql.NullInt16   `db:"battery_level" json:"batteryLevel,omitempty"`
	UsableBatteryLevel   sql.NullInt16   `db:"usable_battery_level" json:"usableBatteryLevel,omitempty"`
	ChargeEnergyAdded    float64         `db:"charge_energy_added" json:"chargeEnergyAdded"`
	ChargerActualCurrent sql.NullInt16   `db:"charger_actual_current" json:"chargerActualCurrent,omitempty"`
	ChargerPhases        sql.NullInt16   `db:"charger_phases" json:"chargerPhases,omitempty"`
	ChargerPilotCurrent  sql.NullInt16   `db:"charger_pilot_current" json:"chargerPilotCurrent,omitempty"`
	ChargerPower         int16           `db:"charger_power" json:"chargerPower"`
	ChargerVoltage       sql.NullInt16   `db:"charger_voltage" json:"chargerVoltage,omitempty"`
	IdealBatteryRangeKm  float64         `db:"ideal_battery_range_km" json:"idealBatteryRangeKm"`
	NotEnoughPowerToHeat sql.NullBool    `db:"not_enough_power_to_heat" json:"notEnoughPowerToHeat,omitempty"`
	RatedBatteryRangeKm  sql.NullFloat64 `db:"rated_battery_range_km" json:"ratedBatteryRangeKm,omitempty"`
	OutsideTemp          sql.NullFloat64 `db:"outside_temp" json:"outsideTemp,omitempty"`
	ChargingProcessID    int64           `db:"charging_process_id" json:"chargingProcessId"`
	BatteryHeater        sql.NullBool    `db:"battery_heater" json:"batteryHeater,omitempty"`
	BatteryHeaterOn      sql.NullBool    `db:"battery_heater_on" json:"batteryHeaterOn,omitempty"`
	BatteryHeaterNoPower sql.NullBool    `db:"battery_heater_no_power" json:"batteryHeaterNoPower,omitempty"`
	ConnChargeCable      sql.NullString  `db:"conn_charge_cable" json:"connChargeCable,omitempty"`
	FastChargerBrand     sql.NullString  `db:"fast_charger_brand" json:"fastChargerBrand,omitempty"`
	FastChargerPresent   sql.NullBool    `db:"fast_charger_present" json:"fastChargerPresent,omitempty"`
	FastChargerType      sql.NullString  `db:"fast_charger_type" json:"fastChargerType,omitempty"`
}

// ChargeStats 充电统计
type ChargeStats struct {
	ChargingProcessID int64             `json:"chargingProcessId"`
	DataPoints        []ChargeDataPoint `json:"dataPoints"`
}

// ChargeDataPoint 充电数据点
type ChargeDataPoint struct {
	Date           time.Time `json:"date"`
	BatteryLevel   int       `json:"batteryLevel"`
	ChargerPower   int       `json:"chargerPower"`
	ChargerVoltage int       `json:"chargerVoltage"`
	ChargerCurrent int       `json:"chargerCurrent"`
	IdealRangeKm   float64   `json:"idealRangeKm"`
	OutsideTemp    *float64  `json:"outsideTemp,omitempty"`
}
