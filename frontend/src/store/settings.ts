import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsApi } from '@/services/api';

export type ThemeType = 'cyber' | 'tesla' | 'dark' | 'tech' | 'aurora';
export type UnitType = 'metric' | 'imperial';
export type LanguageType = 'zh' | 'en';

interface SettingsState {
  theme: ThemeType;
  unit: UnitType;
  language: LanguageType;
  selectedCarId: number | null;
  amapKey: string;
  baseUrl: string;
  apiKey: string;
  setTheme: (theme: ThemeType) => void;
  setUnit: (unit: UnitType) => void;
  setLanguage: (language: LanguageType) => void;
  setSelectedCarId: (id: number | null) => void;
  setAmapKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  fetchRemoteSettings: () => Promise<void>;
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
          }));
        } catch (e) {
          console.error("Failed to fetch remote settings", e);
        }
      },
    }),
    {
      name: 'cyberui-settings',
      onRehydrateStorage: () => (state) => {
        // Fetch remote settings on hydration if possible
        if (state?.baseUrl) {
          state.fetchRemoteSettings();
        }
      }
    }
  )
);

