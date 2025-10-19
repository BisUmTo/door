import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioSettings {
  sfx: number;
  music: number;
}

interface UiSettings {
  reducedMotion: boolean;
}

interface SettingsState {
  language: string;
  audio: AudioSettings;
  ui: UiSettings;
  setLanguage: (language: string) => void;
  setAudio: (audio: Partial<AudioSettings>) => void;
  toggleReducedMotion: () => void;
}

const defaultSettings: SettingsState = {
  language: "it",
  audio: { sfx: 70, music: 60 },
  ui: { reducedMotion: true },
  setLanguage: () => {},
  setAudio: () => {},
  toggleReducedMotion: () => {}
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setLanguage: (language) =>
        set((state) => ({
          language,
          audio: state.audio,
          ui: state.ui
        })),
      setAudio: (audio) =>
        set((state) => ({
          audio: { ...state.audio, ...audio }
        })),
      toggleReducedMotion: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            reducedMotion: !state.ui.reducedMotion
          }
        }))
    }),
    {
      name: "gc:settings"
    }
  )
);
