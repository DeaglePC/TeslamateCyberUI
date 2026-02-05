import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsApi, backgroundApi } from '@/services/api';

export type ThemeType = 'cyber' | 'tesla' | 'dark' | 'tech' | 'aurora';
export type UnitType = 'metric' | 'imperial';
export type LanguageType = 'zh' | 'en';
export type MapType = 'amap' | 'openstreet';

interface SettingsState {
  theme: ThemeType;
  unit: UnitType;
  language: LanguageType;
  selectedCarId: number | null;
  amapKey: string;
  baseUrl: string;
  apiKey: string;
  mapType: MapType;
  backgroundImage: string;  // Base64 格式的背景图片
  backgroundLoaded: boolean; // 标记背景图片是否已加载
  cardOpacity: number;  // 卡片透明度 (0-100)
  setTheme: (theme: ThemeType) => void;
  setUnit: (unit: UnitType) => void;
  setLanguage: (language: LanguageType) => void;
  setSelectedCarId: (id: number | null) => void;
  setAmapKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setMapType: (mapType: MapType) => void;
  setBackgroundImage: (image: string) => void;
  setCardOpacity: (opacity: number) => void;
  uploadBackgroundImage: (image: string) => Promise<void>;
  deleteBackgroundImage: () => Promise<void>;
  fetchRemoteSettings: () => Promise<void>;
  fetchBackgroundImage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'cyber',
      unit: 'metric',
      language: 'zh',
      selectedCarId: null,
      amapKey: '',
      baseUrl: '',
      apiKey: '',
      mapType: 'openstreet',  // 默认使用开源地图，无需配置
      backgroundImage: '',
      backgroundLoaded: false,
      cardOpacity: 70,  // 默认透明度 70%
      setTheme: (theme) => {
        set({ theme });
        settingsApi.update('theme', theme).catch(() => { });
      },
      setUnit: (unit) => {
        set({ unit });
        settingsApi.update('unit', unit).catch(() => { });
      },
      setLanguage: (language) => {
        set({ language });
        settingsApi.update('language', language).catch(() => { });
      },
      setSelectedCarId: (id) => set({ selectedCarId: id }),
      setAmapKey: (key) => {
        set({ amapKey: key });
        settingsApi.update('amapKey', key).catch(() => { });
      },
      setBaseUrl: (url) => set({ baseUrl: url }),
      setApiKey: (key) => set({ apiKey: key }),
      setMapType: (mapType) => {
        set({ mapType });
        settingsApi.update('mapType', mapType).catch(() => { });
      },
      setBackgroundImage: (image) => set({ backgroundImage: image }),
      setCardOpacity: (opacity) => {
        set({ cardOpacity: opacity });
        settingsApi.update('cardOpacity', String(opacity)).catch(() => { });
      },
      uploadBackgroundImage: async (image) => {
        await backgroundApi.upload(image);
        set({ backgroundImage: image });
      },
      deleteBackgroundImage: async () => {
        await backgroundApi.delete();
        set({ backgroundImage: '' });
      },
      fetchBackgroundImage: async () => {
        try {
          const state = get();
          if (!state.baseUrl) return;
          
          const image = await backgroundApi.get();
          set({ backgroundImage: image, backgroundLoaded: true });
        } catch (e) {
          console.error("Failed to fetch background image", e);
          set({ backgroundLoaded: true });
        }
      },
      fetchRemoteSettings: async () => {
        try {
          // Only fetch if base URL is set
          const state = get();
          if (!state.baseUrl) return;

          const settings = await settingsApi.get();
          set((prev) => ({
            theme: (settings.theme as ThemeType) || prev.theme,
            unit: (settings.unit as UnitType) || prev.unit,
            language: (settings.language as LanguageType) || prev.language,
            amapKey: settings.amapKey || prev.amapKey,
            mapType: (settings.mapType as MapType) || prev.mapType,
            cardOpacity: settings.cardOpacity ? parseInt(settings.cardOpacity) : prev.cardOpacity,
          }));
          
          // 同时获取背景图片
          get().fetchBackgroundImage();
        } catch (e) {
          console.error("Failed to fetch remote settings", e);
        }
      },
    }),
    {
      name: 'cyberui-settings',
      // 不持久化背景图片到 localStorage（太大）
      partialize: (state) => ({
        theme: state.theme,
        unit: state.unit,
        language: state.language,
        selectedCarId: state.selectedCarId,
        amapKey: state.amapKey,
        baseUrl: state.baseUrl,
        apiKey: state.apiKey,
        mapType: state.mapType,
        cardOpacity: state.cardOpacity,
        // backgroundImage 不保存到 localStorage
      }),
      onRehydrateStorage: () => (state) => {
        // Fetch remote settings on hydration if possible
        if (state?.baseUrl) {
          state.fetchRemoteSettings();
        }
      }
    }
  )
);

