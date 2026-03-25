import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppConfig } from '../db/schema'

interface AppState {
  config: AppConfig | null
  setConfig: (config: AppConfig) => void
  updateConfig: (data: Partial<AppConfig>) => void
}

const DEFAULT_CONFIG: AppConfig = {
  id: 1,
  language: 'es',
  theme: 'dark',
  hemisphere: 'south',
  aiProvider: 'gemini',
  photoQuality: 'high',
  pushNotifications: false,
  onboardingCompleted: false,
  fontSize: 'normal',
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      setConfig: (config) => set({ config }),
      updateConfig: (data) =>
        set((state) => ({
          config: state.config ? { ...state.config, ...data } : { ...DEFAULT_CONFIG, ...data },
        })),
    }),
    { name: 'niwamiri-app-config' }
  )
)
