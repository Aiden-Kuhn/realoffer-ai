import { DEFAULT_SETTINGS } from "@/config/defaults";

export type AppSettings = typeof DEFAULT_SETTINGS;

const STORAGE_KEY = "realoffer_demo_settings_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Thrown when a write to localStorage fails (quota exceeded, private
 * browsing with storage disabled, etc.). */
export class SettingsStorageError extends Error {
  constructor(message = "Couldn't save settings — your browser's local storage might be full or unavailable (e.g. private browsing).") {
    super(message);
    this.name = "SettingsStorageError";
  }
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
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        throw new SettingsStorageError();
      }
    }
    return settings;
  }

  reset(): AppSettings {
    if (isBrowser()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        throw new SettingsStorageError();
      }
    }
    return DEFAULT_SETTINGS;
  }
}

export const settingsRepository: SettingsRepository = new LocalStorageSettingsRepository();
