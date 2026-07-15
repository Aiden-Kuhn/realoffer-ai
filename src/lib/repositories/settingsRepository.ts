import { DEFAULT_SETTINGS } from "@/config/defaults";

export type AppSettings = typeof DEFAULT_SETTINGS;

const STORAGE_KEY = "realoffer_demo_settings_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export interface SettingsRepository {
  get(): AppSettings;
  save(settings: AppSettings): AppSettings;
  reset(): AppSettings;
}

export class LocalStorageSettingsRepository implements SettingsRepository {
  get(): AppSettings {
    if (!isBrowser()) return DEFAULT_SETTINGS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  save(settings: AppSettings): AppSettings {
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    return settings;
  }

  reset(): AppSettings {
    if (isBrowser()) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return DEFAULT_SETTINGS;
  }
}

export const settingsRepository: SettingsRepository = new LocalStorageSettingsRepository();
