import type { LanguageType } from '@/store/settings';

// Translation dictionary
const translations = {
    // Common
    loading: { zh: '加载中...', en: 'Loading...' },
    error: { zh: '错误', en: 'Error' },
    retry: { zh: '重试', en: 'Retry' },
    noData: { zh: '暂无数据', en: 'No data' },

    // Navigation
    home: { zh: '首页', en: 'Home' },
    drives: { zh: '行驶记录', en: 'Drives' },
    charges: { zh: '充电记录', en: 'Charges' },
    settings: { zh: '设置', en: 'Settings' },

    // Home page
    vehicle: { zh: '车辆', en: 'Vehicle' },
    noCarsFound: { zh: '未找到车辆', en: 'No vehicles found' },
    currentState: { zh: '当前状态', en: 'Current State' },
    since: { zh: '持续', en: 'Since' },
    batteryLevel: { zh: '电池电量', en: 'Battery Level' },

    // Car states
    stateOnline: { zh: '在线', en: 'Online' },
    stateOffline: { zh: '离线', en: 'Offline' },
    stateAsleep: { zh: '休眠', en: 'Asleep' },
    stateCharging: { zh: '充电中', en: 'Charging' },
    stateDriving: { zh: '行驶中', en: 'Driving' },
    stateUpdating: { zh: '更新中', en: 'Updating' },

    // Stats
    range: { zh: '续航', en: 'Range' },
    odometer: { zh: '里程', en: 'Odometer' },
    temperature: { zh: '温度', en: 'Temperature' },
    efficiency: { zh: '能效', en: 'Efficiency' },
    softwareVersion: { zh: '软件版本', en: 'Software' },
    totalDistance: { zh: '总里程', en: 'Total Distance' },
    exterior: { zh: '车外', en: 'Exterior' },
    estimated: { zh: '预计', en: 'est.' },
    vsAvg: { zh: '对比平均', en: 'vs avg' },

    // Charts
    socHistory: { zh: 'SOC历史', en: 'SOC History' },
    last24h: { zh: '近24小时', en: 'Last 24h' },
    lastWeek: { zh: '近一周', en: 'Last Week' },
    lastMonth: { zh: '近一月', en: 'Last Month' },
    lastQuarter: { zh: '近三月', en: 'Last 3 Months' },
    lastYear: { zh: '近一年', en: 'Last Year' },
    custom: { zh: '自定义', en: 'Custom' },
    activityTimeline: { zh: '活动时间线', en: 'Activity Timeline' },
    today: { zh: '今日', en: 'Today' },
    drive: { zh: '行驶', en: 'Drive' },
    charge: { zh: '充电', en: 'Charge' },
    noActivityToday: { zh: '今日暂无活动记录', en: 'No activity today' },

    // Map
    parked: { zh: '停放', en: 'Parked' },
    configureMapKey: { zh: '请在设置中配置高德地图 API Key', en: 'Please configure AMap API Key in settings' },
    noLocation: { zh: '无位置信息', en: 'No location data' },

    // Settings page
    themeSettings: { zh: '主题设置', en: 'Theme Settings' },
    unitSettings: { zh: '单位设置', en: 'Unit Settings' },
    languageSettings: { zh: '语言设置', en: 'Language Settings' },
    mapSettings: { zh: '地图设置', en: 'Map Settings' },
    metric: { zh: '公制 (km, °C)', en: 'Metric (km, °C)' },
    imperial: { zh: '英制 (mi, °F)', en: 'Imperial (mi, °F)' },
    chinese: { zh: '中文', en: 'Chinese' },
    english: { zh: '英文', en: 'English' },
    amapApiKey: { zh: '高德地图 API Key', en: 'AMap API Key' },
    getApiKey: { zh: '获取 API Key', en: 'Get API Key' },
    amapKeyPlaceholder: { zh: '请输入高德地图 API Key', en: 'Enter AMap API Key' },
    autoThemeFromBg: { zh: '自动主题色', en: 'Auto Theme Color' },
    autoThemeFromBgDesc: { zh: '根据背景图片自动计算主题色', en: 'Auto-generate theme color from background image' },
    autoThemeNoBg: { zh: '需要先上传背景图片', en: 'Upload a background image first' },
    autoThemeExtracting: { zh: '正在分析图片颜色...', en: 'Analyzing image colors...' },
    autoThemeActive: { zh: '自动主题', en: 'Auto' },

    // Drive list
    driveRecords: { zh: '行驶记录', en: 'Drive Records' },
    noDriveRecords: { zh: '暂无行驶记录', en: 'No drive records' },
    startTime: { zh: '开始时间', en: 'Start Time' },
    duration: { zh: '时长', en: 'Duration' },
    distance: { zh: '距离', en: 'Distance' },
    avgSpeed: { zh: '平均速度', en: 'Avg Speed' },
    maxSpeed: { zh: '最高速度', en: 'Max Speed' },

    // Charge list
    chargeRecords: { zh: '充电记录', en: 'Charge Records' },
    noChargeRecords: { zh: '暂无充电记录', en: 'No charge records' },
    energyAdded: { zh: '充电量', en: 'Energy Added' },
    cost: { zh: '费用', en: 'Cost' },
    location: { zh: '位置', en: 'Location' },

    // Time format
    hours: { zh: '小时', en: 'hours' },
    minutes: { zh: '分钟', en: 'min' },
    ago: { zh: '前', en: 'ago' },
    lastUpdated: { zh: '最后更新', en: 'Last Updated' },

    // Charge Detail
    chargeDetail: { zh: '充电详情', en: 'Charge Detail' },
    chargeRecordNotFound: { zh: '充电记录不存在', en: 'Charge record not found' },
    batteryChange: { zh: '电量变化', en: 'Battery Change' },
    chargeDuration: { zh: '充电时长', en: 'Charge Duration' },
    energyUsed: { zh: '耗电量', en: 'Energy Used' },
    chargeEfficiency: { zh: '充电效率', en: 'Charge Efficiency' },
    avgTemp: { zh: '平均温度', en: 'Avg Temp' },
    chargeCost: { zh: '充电费用', en: 'Charge Cost' },
    chargeCurve: { zh: '充电曲线', en: 'Charge Curve' },
    power: { zh: '功率 kW', en: 'Power kW' },
    back: { zh: '返回', en: 'Back' },

    // Drive Detail
    driveDetail: { zh: '驾驶详情', en: 'Drive Detail' },
    driveRecordNotFound: { zh: '驾驶记录不存在', en: 'Drive record not found' },
    batteryConsumption: { zh: '电量消耗', en: 'Battery Consumption' },
    driveDistance: { zh: '行驶距离', en: 'Drive Distance' },
    driveDuration: { zh: '行驶时长', en: 'Drive Duration' },
    maxPower: { zh: '最大功率', en: 'Max Power' },
    maxRegen: { zh: '最大回收', en: 'Max Regen' },
    outsideTemp: { zh: '室外温度', en: 'Outside Temp' },
    insideTemp: { zh: '车内温度', en: 'Inside Temp' },
    temperatures: { zh: '温度曲线', en: 'Temperatures' },
    tirePressure: { zh: '胎压', en: 'Tire Pressure' },
    frontLeft: { zh: '左前', en: 'Front Left' },
    frontRight: { zh: '右前', en: 'Front Right' },
    rearLeft: { zh: '左后', en: 'Rear Left' },
    rearRight: { zh: '右后', en: 'Rear Right' },
    driveRoute: { zh: '行驶轨迹', en: 'Drive Route' },
    speedPowerCurve: { zh: '速度/功率曲线', en: 'Speed/Power Curve' },
    speedHistogram: { zh: '速度分布', en: 'Speed Histogram' },
    speedKmh: { zh: '速度 km/h', en: 'Speed km/h' },
    start: { zh: '起', en: 'S' },
    end: { zh: '终', en: 'E' },
    endTime: { zh: '结束时间', en: 'End Time' },
    time: { zh: '时间', en: 'Time' },
    percentage: { zh: '占比', en: 'Percentage' },
} as const;

type TranslationKey = keyof typeof translations;

export function useTranslation(language: LanguageType) {
    const t = (key: TranslationKey): string => {
        return translations[key]?.[language] || key;
    };

    const getStateLabel = (state: string): string => {
        const stateMap: Record<string, TranslationKey> = {
            online: 'stateOnline',
            offline: 'stateOffline',
            asleep: 'stateAsleep',
            charging: 'stateCharging',
            driving: 'stateDriving',
            updating: 'stateUpdating',
        };
        return t(stateMap[state] || 'stateOnline');
    };

    return { t, getStateLabel };
}

export type { TranslationKey };
