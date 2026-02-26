import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsApi, backgroundApi } from '@/services/api';
import { getCachedBackground, setCachedBackground, clearCachedBackground } from '@/utils/bgCache';

export type ThemeType = 'cyber' | 'tesla' | 'dark' | 'tech' | 'aurora' | 'auto';
export type UnitType = 'metric' | 'imperial';
export type LanguageType = 'zh' | 'en';
export type MapType = 'amap' | 'openstreet';

const getInitialLanguage = (): LanguageType => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }
  return 'zh';
};

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
  backgroundOriginalImage: string; // 原始背景图片（用于重新裁剪）
  backgroundLoaded: boolean; // 标记背景图片是否已加载
  cardOpacity: number;  // 卡片透明度 (0-100)
  cardBlur: number;     // 卡片模糊度 (0-30px)
  autoThemeFromBg: boolean; // 是否根据背景图片自动计算主题色
  autoThemePrimaryColor: string; // 自动计算出的主题主色
  setTheme: (theme: ThemeType) => void;
  setUnit: (unit: UnitType) => void;
  setLanguage: (language: LanguageType) => void;
  setSelectedCarId: (id: number | null) => void;
  setAmapKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setMapType: (mapType: MapType) => void;
  setBackgroundImage: (image: string) => void;
  setBackgroundOriginalImage: (image: string) => void;
  setCardOpacity: (opacity: number) => void;
  setCardBlur: (blur: number) => void;
  setAutoThemeFromBg: (enabled: boolean) => void;
  setAutoThemePrimaryColor: (color: string) => void;
  uploadBackgroundImage: (image: string, originalImage?: string) => Promise<void>;
  deleteBackgroundImage: () => Promise<void>;
  fetchRemoteSettings: () => Promise<void>;
  fetchBackgroundImage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'cyber',
      unit: 'metric',
      language: getInitialLanguage(),
      selectedCarId: null,
      amapKey: '',
      baseUrl: '',
      apiKey: '',
      mapType: 'openstreet',  // 默认使用开源地图，无需配置
      backgroundImage: '',
      backgroundOriginalImage: '',
      backgroundLoaded: false,
      cardOpacity: 70,  // 默认透明度 70%
      cardBlur: 16,     // 默认模糊度 16px
      autoThemeFromBg: false,
      autoThemePrimaryColor: '',
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
      setBackgroundOriginalImage: (image) => set({ backgroundOriginalImage: image }),
      setCardOpacity: (opacity) => {
        set({ cardOpacity: opacity });
        settingsApi.update('cardOpacity', String(opacity)).catch(() => { });
      },
      setCardBlur: (blur) => {
        set({ cardBlur: blur });
        settingsApi.update('cardBlur', String(blur)).catch(() => { });
      },
      setAutoThemeFromBg: (enabled) => {
        set({ autoThemeFromBg: enabled });
        if (enabled) {
          set({ theme: 'auto' });
          settingsApi.update('theme', 'auto').catch(() => { });
        }
        settingsApi.update('autoThemeFromBg', String(enabled)).catch(() => { });
      },
      setAutoThemePrimaryColor: (color) => {
        set({ autoThemePrimaryColor: color });
      },
      uploadBackgroundImage: async (image, originalImage) => {
        await backgroundApi.upload(image, originalImage);
        // 上传后重新获取 hash 以便缓存
        const serverHash = await backgroundApi.getHash();
        await setCachedBackground(serverHash, image, originalImage || '');
        set({ backgroundImage: image, backgroundOriginalImage: originalImage || '' });
      },
      deleteBackgroundImage: async () => {
        await backgroundApi.delete();
        await clearCachedBackground();
        set({ backgroundImage: '', backgroundOriginalImage: '' });
      },
      fetchBackgroundImage: async () => {
        try {
          const state = get();
          if (!state.baseUrl) return;

          // 1. 先从 IndexedDB 缓存中读取
          const cached = await getCachedBackground();

          // 2. 请求服务端的轻量 hash 接口
          const serverHash = await backgroundApi.getHash();

          // 3. 如果有缓存且 hash 一致，直接使用缓存
          if (cached && cached.hash && cached.hash === serverHash) {
            set({ backgroundImage: cached.image, backgroundOriginalImage: cached.originalImage, backgroundLoaded: true });
            return;
          }

          // 4. Hash 不一致或无缓存，拉取完整图片
          const { image, originalImage, hash } = await backgroundApi.get();
          set({ backgroundImage: image, backgroundOriginalImage: originalImage, backgroundLoaded: true });

          // 5. 写入 IndexedDB 缓存
          if (image && hash) {
            await setCachedBackground(hash, image, originalImage);
          }
        } catch (e) {
          console.error("Failed to fetch background image", e);
          // 降级：尝试从缓存读取
          const cached = await getCachedBackground();
          if (cached?.image) {
            set({ backgroundImage: cached.image, backgroundOriginalImage: cached.originalImage, backgroundLoaded: true });
          } else {
            set({ backgroundLoaded: true });
          }
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
            cardBlur: settings.cardBlur ? parseInt(settings.cardBlur) : prev.cardBlur,
            autoThemeFromBg: settings.autoThemeFromBg === 'true' ? true : settings.autoThemeFromBg === 'false' ? false : prev.autoThemeFromBg,
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
        cardBlur: state.cardBlur,
        autoThemeFromBg: state.autoThemeFromBg,
        // backgroundImage 不保存到 localStorage
        // autoThemePrimaryColor 不保存到 localStorage（从图片动态计算）
      }),
    }
  )
);

