import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'cyber' | 'tesla' | 'dark' | 'tech' | 'aurora';
export type UnitType = 'metric' | 'imperial';

interface SettingsState {
  theme: ThemeType;
  unit: UnitType;
  selectedCarId: number | null;
  amapKey: string;
  setTheme: (theme: ThemeType) => void;
  setUnit: (unit: UnitType) => void;
  setSelectedCarId: (id: number | null) => void;
  setAmapKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'cyber',
      unit: 'metric',
      selectedCarId: null,
      amapKey: '',
      setTheme: (theme) => set({ theme }),
      setUnit: (unit) => set({ unit }),
      setSelectedCarId: (id) => set({ selectedCarId: id }),
      setAmapKey: (key) => set({ amapKey: key }),
    }),
    {
      name: 'cyberui-settings',
    }
  )
);
