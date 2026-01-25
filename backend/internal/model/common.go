package model

import (
	"database/sql"
	"encoding/json"
	"time"
)

// Address 地址信息
type Address struct {
	ID               int64          `db:"id" json:"id"`
	DisplayName      sql.NullString `db:"display_name" json:"displayName,omitempty"`
	Name             sql.NullString `db:"name" json:"name,omitempty"`
	HouseNumber      sql.NullString `db:"house_number" json:"houseNumber,omitempty"`
	Road             sql.NullString `db:"road" json:"road,omitempty"`
	Neighbourhood    sql.NullString `db:"neighbourhood" json:"neighbourhood,omitempty"`
	City             sql.NullString `db:"city" json:"city,omitempty"`
	County           sql.NullString `db:"county" json:"county,omitempty"`
	Postcode         sql.NullString `db:"postcode" json:"postcode,omitempty"`
	State            sql.NullString `db:"state" json:"state,omitempty"`
	StateDistrict    sql.NullString `db:"state_district" json:"stateDistrict,omitempty"`
	Country          sql.NullString `db:"country" json:"country,omitempty"`
	Raw              json.RawMessage `db:"raw" json:"raw,omitempty"`
	InsertedAt       time.Time      `db:"inserted_at" json:"insertedAt"`
	UpdatedAt        time.Time      `db:"updated_at" json:"updatedAt"`
	OsmID            sql.NullInt64  `db:"osm_id" json:"osmId,omitempty"`
	OsmType          sql.NullString `db:"osm_type" json:"osmType,omitempty"`
	Latitude         sql.NullFloat64 `db:"latitude" json:"latitude,omitempty"`
	Longitude        sql.NullFloat64 `db:"longitude" json:"longitude,omitempty"`
}

// Geofence 地理围栏
type Geofence struct {
	ID          int64           `db:"id" json:"id"`
	Name        string          `db:"name" json:"name"`
	Latitude    float64         `db:"latitude" json:"latitude"`
	Longitude   float64         `db:"longitude" json:"longitude"`
	Radius      int             `db:"radius" json:"radius"`
	BillingType string          `db:"billing_type" json:"billingType"`
	InsertedAt  time.Time       `db:"inserted_at" json:"insertedAt"`
	UpdatedAt   time.Time       `db:"updated_at" json:"updatedAt"`
	CostPerUnit sql.NullFloat64 `db:"cost_per_unit" json:"costPerUnit,omitempty"`
	SessionFee  sql.NullFloat64 `db:"session_fee" json:"sessionFee,omitempty"`
}

// State 状态记录
type State struct {
	ID         int64        `db:"id" json:"id"`
	State      string       `db:"state" json:"state"`
	StartDate  time.Time    `db:"start_date" json:"startDate"`
	EndDate    sql.NullTime `db:"end_date" json:"endDate,omitempty"`
	CarID      int16        `db:"car_id" json:"carId"`
}

// Update 更新信息
type Update struct {
	ID         int64           `db:"id" json:"id"`
	StartDate  time.Time       `db:"start_date" json:"startDate"`
	EndDate    sql.NullTime    `db:"end_date" json:"endDate,omitempty"`
	Version    sql.NullString  `db:"version" json:"version,omitempty"`
	CarID      int16           `db:"car_id" json:"carId"`
}

// CarSetting 车辆设置
type CarSetting struct {
	ID                    int64 `db:"id" json:"id"`
	SuspendMin            int32 `db:"suspend_min" json:"suspendMin"`
	SuspendAfterIdleMin   int32 `db:"suspend_after_idle_min" json:"suspendAfterIdleMin"`
	ReqNotUnlocked        bool  `db:"req_not_unlocked" json:"reqNotUnlocked"`
	FreeSupercharging     bool  `db:"free_supercharging" json:"freeSupercharging"`
	UseStreamingAPI       bool  `db:"use_streaming_api" json:"useStreamingApi"`
	Enabled               bool  `db:"enabled" json:"enabled"`
	LfpBattery            bool  `db:"lfp_battery" json:"lfpBattery"`
}

// Setting 全局设置
type Setting struct {
	ID                int64           `db:"id" json:"id"`
	InsertedAt        time.Time       `db:"inserted_at" json:"insertedAt"`
	UpdatedAt         time.Time       `db:"updated_at" json:"updatedAt"`
	UnitOfLength      string          `db:"unit_of_length" json:"unitOfLength"`
	UnitOfTemperature string          `db:"unit_of_temperature" json:"unitOfTemperature"`
	PreferredRange    string          `db:"preferred_range" json:"preferredRange"`
	BaseURL           sql.NullString  `db:"base_url" json:"baseUrl,omitempty"`
	GrafanaURL        sql.NullString  `db:"grafana_url" json:"grafanaUrl,omitempty"`
	Language          string          `db:"language" json:"language"`
	UnitOfPressure    string          `db:"unit_of_pressure" json:"unitOfPressure"`
}
