import axios from 'axios';
import type {
  ApiResponse,
  ListResponse,
  Car,
  CarStatus,
  ChargeListItem,
  ChargeDetail,
  ChargeStats,
  DriveListItem,
  DriveDetail,
  DrivePosition,
  DriveTrack,
  DriveStatsSummary,
  SpeedHistogramItem,
  OverviewStats,
  EfficiencyStats,
  BatteryStats,
  SocDataPoint,
  StateTimelineItem,
  ChargeStatsSummary
} from '@/types';

// Helper function to get settings from localStorage
const getApiConfig = () => {
  try {
    const stored = localStorage.getItem('cyberui-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        baseUrl: settings.state?.baseUrl || '',
        apiKey: settings.state?.apiKey || ''
      };
    }
  } catch {
    // ignore parse errors
  }
  return { baseUrl: '', apiKey: '' };
};

const api = axios.create({
  timeout: 10000,
});

// Request interceptor to set baseURL and API key
api.interceptors.request.use((config) => {
  const { baseUrl, apiKey } = getApiConfig();

  // If API is not configured, reject the physical request to prevent proxy errors
  if (!baseUrl || !apiKey) {
    return Promise.reject(new Error('no_api_config'));
  }

  // Set baseURL dynamically
  config.baseURL = `${baseUrl}/api/v1`;
  // Add API key header
  config.headers['X-API-Key'] = apiKey;

  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || 'Request failed'));
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 车辆 API
export const carApi = {
  getAll: async (): Promise<Car[]> => {
    const res = await api.get<ApiResponse<Car[]>>('/cars');
    return res.data.data || [];
  },

  getStatus: async (carId: number): Promise<CarStatus> => {
    const res = await api.get<ApiResponse<CarStatus>>(`/cars/${carId}/status`);
    return res.data.data!;
  },
};

// 充电 API
export const chargeApi = {
  getList: async (carId: number, page = 1, pageSize = 20, startDate?: string, endDate?: string): Promise<ListResponse<ChargeListItem>> => {
    const res = await api.get<ApiResponse<ListResponse<ChargeListItem>>>(`/cars/${carId}/charges`, {
      params: { page, pageSize, startDate, endDate },
    });
    return res.data.data || { items: [], pagination: { page, pageSize, total: 0 } };
  },

  getDetail: async (chargeId: number): Promise<ChargeDetail> => {
    const res = await api.get<ApiResponse<ChargeDetail>>(`/charges/${chargeId}`);
    return res.data.data!;
  },

  getStats: async (chargeId: number): Promise<ChargeStats> => {
    const res = await api.get<ApiResponse<ChargeStats>>(`/charges/${chargeId}/stats`);
    return res.data.data!;
  },

  getStatsSummary: async (carId: number, startDate?: string, endDate?: string): Promise<ChargeStatsSummary> => {
    const res = await api.get<ApiResponse<ChargeStatsSummary>>(`/cars/${carId}/charges/stats_summary`, {
      params: { startDate, endDate },
    });
    return res.data.data!;
  },
};

// 驾驶 API
export const driveApi = {
  getList: async (carId: number, page = 1, pageSize = 20, startDate?: string, endDate?: string): Promise<ListResponse<DriveListItem>> => {
    const res = await api.get<ApiResponse<ListResponse<DriveListItem>>>(`/cars/${carId}/drives`, {
      params: { page, pageSize, startDate, endDate },
    });
    return res.data.data || { items: [], pagination: { page, pageSize, total: 0 } };
  },

  getDetail: async (driveId: number): Promise<DriveDetail> => {
    const res = await api.get<ApiResponse<DriveDetail>>(`/drives/${driveId}`);
    return res.data.data!;
  },

  getPositions: async (driveId: number): Promise<DrivePosition[]> => {
    const res = await api.get<ApiResponse<DrivePosition[]>>(`/drives/${driveId}/positions`);
    return res.data.data || [];
  },

  getAllDrivesPositions: async (carId: number, startDate?: string, endDate?: string): Promise<DriveTrack[]> => {
    const res = await api.get<ApiResponse<DriveTrack[]>>(`/cars/${carId}/drives/positions`, {
      params: { startDate, endDate },
    });
    return res.data.data || [];
  },

  getStatsSummary: async (carId: number, startDate?: string, endDate?: string): Promise<DriveStatsSummary> => {
    const res = await api.get<ApiResponse<DriveStatsSummary>>(`/cars/${carId}/drives/stats_summary`, {
      params: { startDate, endDate },
    });
    return res.data.data!;
  },

  getSpeedHistogram: async (carId: number, startDate?: string, endDate?: string): Promise<SpeedHistogramItem[]> => {
    const res = await api.get<ApiResponse<SpeedHistogramItem[]>>(`/cars/${carId}/drives/speed_histogram`, {
      params: { startDate, endDate },
    });
    return res.data.data || [];
  },

  getDriveSpeedHistogram: async (driveId: number): Promise<SpeedHistogramItem[]> => {
    const res = await api.get<ApiResponse<SpeedHistogramItem[]>>(`/drives/${driveId}/speed_histogram`);
    return res.data.data || [];
  },
};

// 统计 API
export const statsApi = {
  getOverview: async (carId: number): Promise<OverviewStats> => {
    const res = await api.get<ApiResponse<OverviewStats>>(`/cars/${carId}/stats/overview`);
    return res.data.data!;
  },

  getEfficiency: async (carId: number, days = 30): Promise<EfficiencyStats> => {
    const res = await api.get<ApiResponse<EfficiencyStats>>(`/cars/${carId}/stats/efficiency`, {
      params: { days },
    });
    return res.data.data!;
  },

  getBattery: async (carId: number): Promise<BatteryStats> => {
    const res = await api.get<ApiResponse<BatteryStats>>(`/cars/${carId}/stats/battery`);
    return res.data.data!;
  },

  getSocHistory: async (carId: number, hours = 24, from?: string, to?: string): Promise<SocDataPoint[]> => {
    const params: Record<string, any> = { hours };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<SocDataPoint[]>>(`/cars/${carId}/stats/soc-history`, {
      params,
    });
    return res.data.data || [];
  },

  getStatesTimeline: async (carId: number, hours = 24, from?: string, to?: string): Promise<StateTimelineItem[]> => {
    const params: Record<string, any> = { hours };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<ApiResponse<StateTimelineItem[]>>(`/cars/${carId}/stats/states-timeline`, {
      params,
    });
    return res.data.data || [];
  },
};

// 设置 API
export const settingsApi = {
  get: async (): Promise<Record<string, string>> => {
    const res = await api.get<ApiResponse<Record<string, string>>>('/settings');
    return res.data.data || {};
  },

  update: async (key: string, value: string): Promise<void> => {
    await api.post('/settings', { key, value });
  },

  batchUpdate: async (settings: Record<string, string>): Promise<void> => {
    await api.put('/settings', settings);
  },
};

// 背景图片 API
export const backgroundApi = {
  // 获取背景图片
  get: async (): Promise<{ image: string; originalImage: string }> => {
    const res = await api.get<ApiResponse<{ image: string; originalImage: string }>>('/background-image');
    return {
      image: res.data.data?.image || '',
      originalImage: res.data.data?.originalImage || '',
    };
  },

  // 上传背景图片（Base64 格式）
  upload: async (imageBase64: string, originalImage?: string): Promise<void> => {
    const payload: { image: string; originalImage?: string } = { image: imageBase64 };
    if (originalImage) {
      payload.originalImage = originalImage;
    }
    await api.post('/background-image', payload);
  },

  // 删除背景图片
  delete: async (): Promise<void> => {
    await api.delete('/background-image');
  },
};

