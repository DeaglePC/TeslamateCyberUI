package model

// OverviewStats 概览统计
type OverviewStats struct {
	TotalDistance       float64  `json:"totalDistance"`
	TotalDrives         int      `json:"totalDrives"`
	TotalCharges        int      `json:"totalCharges"`
	TotalEnergyAdded    float64  `json:"totalEnergyAdded"`
	TotalEnergyCost     *float64 `json:"totalEnergyCost,omitempty"`
	TotalDriveDuration  int      `json:"totalDriveDuration"`
	TotalChargeDuration int      `json:"totalChargeDuration"`
	AvgEfficiency       float64  `json:"avgEfficiency"`
	CurrentOdometer     float64  `json:"currentOdometer"`
	// 温度信息
	OutsideTemp *float64 `json:"outsideTemp,omitempty"`
	InsideTemp  *float64 `json:"insideTemp,omitempty"`
	// 最后位置信息
	LastLatitude     *float64 `json:"lastLatitude,omitempty"`
	LastLongitude    *float64 `json:"lastLongitude,omitempty"`
	LastAddress      *string  `json:"lastAddress,omitempty"`
	LastLocationTime *string  `json:"lastLocationTime,omitempty"`
}

// EfficiencyStats 能效统计
type EfficiencyStats struct {
	Daily   []EfficiencyDataPoint `json:"daily"`
	Weekly  []EfficiencyDataPoint `json:"weekly"`
	Monthly []EfficiencyDataPoint `json:"monthly"`
}

// EfficiencyDataPoint 能效数据点
type EfficiencyDataPoint struct {
	Date       string  `json:"date"`
	Distance   float64 `json:"distance"`
	EnergyUsed float64 `json:"energyUsed"`
	Efficiency float64 `json:"efficiency"`
}

// BatteryStats 电池统计
type BatteryStats struct {
	DegradationHistory []BatteryDataPoint `json:"degradationHistory"`
	CurrentCapacity    float64            `json:"currentCapacity"`
	OriginalCapacity   float64            `json:"originalCapacity"`
	DegradationPercent float64            `json:"degradationPercent"`
}

// BatteryDataPoint 电池数据点
type BatteryDataPoint struct {
	Date              string  `json:"date"`
	IdealRangeKm      float64 `json:"idealRangeKm"`
	RatedRangeKm      float64 `json:"ratedRangeKm"`
	BatteryLevel      int     `json:"batteryLevel"`
	EstimatedCapacity float64 `json:"estimatedCapacity"`
}

// SocDataPoint SOC历史数据点
type SocDataPoint struct {
	Date string `json:"date"`
	Soc  int    `json:"soc"`
}

// StateTimelineItem 状态时间线数据项
type StateTimelineItem struct {
	Time  string `json:"time"`
	State int    `json:"state"` // 0=online, 1=driving, 2=charging, 3=offline, 4=asleep, 5=online, 6=updating
}

// Pagination 分页参数
type Pagination struct {
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
	Total    int `json:"total"`
}

// ListResponse 列表响应
type ListResponse[T any] struct {
	Items      []T        `json:"items"`
	Pagination Pagination `json:"pagination"`
}
