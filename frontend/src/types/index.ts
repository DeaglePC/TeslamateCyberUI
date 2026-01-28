// API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

// 分页
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface ListResponse<T> {
  items: T[];
  pagination: Pagination;
}

// 车辆
export interface Car {
  id: number;
  name?: string;
  model?: string;
  vin?: string;
  trimBadging?: string;
  exteriorColor?: string;
  wheelType?: string;
  marketingName?: string;
  displayPriority?: number;
  insertedAt: string;
  updatedAt: string;
}

// 车辆状态
export interface CarStatus {
  carId: number;
  name: string;
  model: string;
  state: string;
  since?: string;
  healthy: boolean;
  batteryLevel: number;
  usableBatteryLevel: number;
  idealRange: number;
  estRange: number;
  ratedRange: number;
  odometer: number;
  insideTemp?: number;
  outsideTemp?: number;
  isClimateOn: boolean;
  isPreconditioning: boolean;
  locked?: boolean;
  sentryMode?: boolean;
  pluggedIn?: boolean;
  scheduledChargingStartTime?: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  geofence?: string;
  softwareVersion: string;
}

// 充电记录列表项
export interface ChargeListItem {
  id: number;
  startDate: string;
  endDate?: string;
  durationMin: number;
  chargeEnergyAdded: number;
  startBatteryLevel: number;
  endBatteryLevel: number;
  location: string;
  cost?: number;
  latitude?: number;
  longitude?: number;
}

// 充电详情
export interface ChargeDetail {
  id: number;
  startDate: string;
  endDate?: string;
  durationMin: number;
  chargeEnergyAdded: number;
  chargeEnergyUsed?: number;
  startBatteryLevel: number;
  endBatteryLevel: number;
  startIdealRangeKm: number;
  endIdealRangeKm: number;
  startRatedRangeKm: number;
  endRatedRangeKm: number;
  outsideTempAvg?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  cost?: number;
  efficiency?: number;
}

// 充电统计数据点
export interface ChargeDataPoint {
  date: string;
  batteryLevel: number;
  chargerPower: number;
  chargerVoltage: number;
  chargerCurrent: number;
  idealRangeKm: number;
  outsideTemp?: number;
}

export interface ChargeStats {
  chargingProcessId: number;
  dataPoints: ChargeDataPoint[];
}

// 驾驶记录列表项
export interface DriveListItem {
  id: number;
  startDate: string;
  endDate?: string;
  durationMin: number;
  distance: number;
  startLocation: string;
  endLocation: string;
  startBatteryLevel: number;
  endBatteryLevel: number;
  efficiency: number;
  speedMax: number;
}

// 驾驶详情
export interface DriveDetail {
  id: number;
  startDate: string;
  endDate?: string;
  durationMin: number;
  distance: number;
  startLocation: string;
  endLocation: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  startBatteryLevel: number;
  endBatteryLevel: number;
  startIdealRangeKm: number;
  endIdealRangeKm: number;
  efficiency: number;
  speedMax: number;
  speedAvg: number;
  powerMax: number;
  powerMin: number;
  outsideTempAvg?: number;
  insideTempAvg?: number;
}

// 驾驶轨迹点
export interface DrivePosition {
  date: string;
  latitude: number;
  longitude: number;
  speed: number;
  power: number;
  batteryLevel: number;
  elevation?: number;
}

// 概览统计
export interface OverviewStats {
  totalDistance: number;
  totalDrives: number;
  totalCharges: number;
  totalEnergyAdded: number;
  totalEnergyCost?: number;
  totalDriveDuration: number;
  totalChargeDuration: number;
  avgEfficiency: number;
  currentOdometer: number;
  // 温度信息
  outsideTemp?: number;
  insideTemp?: number;
  // 最后位置信息
  lastLatitude?: number;
  lastLongitude?: number;
  lastAddress?: string;
  lastLocationTime?: string;
}

// 能效统计
export interface EfficiencyDataPoint {
  date: string;
  distance: number;
  energyUsed: number;
  efficiency: number;
}

export interface EfficiencyStats {
  daily: EfficiencyDataPoint[];
  weekly: EfficiencyDataPoint[];
  monthly: EfficiencyDataPoint[];
}

// 电池统计
export interface BatteryDataPoint {
  date: string;
  idealRangeKm: number;
  ratedRangeKm: number;
  batteryLevel: number;
  estimatedCapacity: number;
}

export interface BatteryStats {
  degradationHistory: BatteryDataPoint[];
  currentCapacity: number;
  originalCapacity: number;
  degradationPercent: number;
}

// SOC历史数据点
export interface SocDataPoint {
  date: string;
  soc: number;
}

// 状态时间线数据项
export interface StateTimelineItem {
  time: string;
  state: number; // 0=online, 1=driving, 2=charging, 3=offline, 4=asleep, 5=online, 6=updating
}

