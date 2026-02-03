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
