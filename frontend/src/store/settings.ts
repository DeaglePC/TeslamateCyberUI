import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'cyber' | 'tesla' | 'dark' | 'tech' | 'aurora';
export type UnitType = 'metric' | 'imperial';
export type LanguageType = 'zh' | 'en';

interface SettingsState {
  theme: ThemeType;
  unit: UnitType;
  language: LanguageType;
  selectedCarId: number | null;
  amapKey: string;
  setTheme: (theme: ThemeType) => void;
  setUnit: (unit: UnitType) => void;
  setLanguage: (language: LanguageType) => void;
  setSelectedCarId: (id: number | null) => void;
  setAmapKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'cyber',
      unit: 'metric',
      language: 'zh',
      selectedCarId: null,
      amapKey: '',
      setTheme: (theme) => set({ theme }),
      setUnit: (unit) => set({ unit }),
      setLanguage: (language) => set({ language }),
      setSelectedCarId: (id) => set({ selectedCarId: id }),
      setAmapKey: (key) => set({ amapKey: key }),
    }),
    {
      name: 'cyberui-settings',
    }
  )
);

