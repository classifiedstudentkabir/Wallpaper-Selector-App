import { WallpaperSlot, AppSettings, HotkeyConfig, AutoRotateConfig } from '../types/wallpaper';
import { INITIAL_WALLPAPER_SLOTS, DEFAULT_APP_SETTINGS, DEFAULT_HOTKEYS, DEFAULT_AUTO_ROTATE } from '../constants/defaultWallpapers';

const STORAGE_KEYS = {
  SLOTS: 'wallpaper_selector_slots_v1',
  SETTINGS: 'wallpaper_selector_settings_v1',
  HOTKEYS: 'wallpaper_selector_hotkeys_v1',
  AUTO_ROTATE: 'wallpaper_selector_autorotate_v1',
  CUSTOM_UPLOADS: 'wallpaper_selector_custom_images_v1',
  /** Marks that the first-run welcome celebration has already been shown. */
  CELEBRATION: 'wallpaper_selector_celebration_shown_v1',
};

export class StorageService {
  // Load wallpaper slots with schema fallback & healing
  public static loadSlots(): WallpaperSlot[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLOTS);
      if (!data) return INITIAL_WALLPAPER_SLOTS;
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure exactly 6 slots format
        const slots: WallpaperSlot[] = [];
        for (let i = 1; i <= 6; i++) {
          const found = parsed.find((s: WallpaperSlot) => s.slotNumber === i) || INITIAL_WALLPAPER_SLOTS[i - 1];
          slots.push({
            ...found,
            slotNumber: i,
            filters: found.filters || {
              brightness: 100,
              contrast: 100,
              saturation: 100,
              blur: 0,
              hueRotate: 0,
              grayscale: 0,
              sepia: 0,
              vignette: 0,
            },
          });
        }
        return slots;
      }
      return INITIAL_WALLPAPER_SLOTS;
    } catch (e) {
      console.warn('[StorageService] Error loading slots, resetting to defaults', e);
      return INITIAL_WALLPAPER_SLOTS;
    }
  }

  public static saveSlots(slots: WallpaperSlot[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
    } catch (e) {
      console.error('[StorageService] Failed to save slots to localStorage', e);
    }
  }

  public static loadSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_APP_SETTINGS;
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  }

  public static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('[StorageService] Failed to save settings', e);
    }
  }

  public static loadHotkeys(): HotkeyConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOTKEYS);
      if (!data) return DEFAULT_HOTKEYS;
      return { ...DEFAULT_HOTKEYS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_HOTKEYS;
    }
  }

  public static saveHotkeys(hotkeys: HotkeyConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HOTKEYS, JSON.stringify(hotkeys));
    } catch (e) {
      console.error('[StorageService] Failed to save hotkeys', e);
    }
  }

  public static loadAutoRotate(): AutoRotateConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTO_ROTATE);
      if (!data) return DEFAULT_AUTO_ROTATE;
      return { ...DEFAULT_AUTO_ROTATE, ...JSON.parse(data) };
    } catch {
      return DEFAULT_AUTO_ROTATE;
    }
  }

  public static saveAutoRotate(config: AutoRotateConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_ROTATE, JSON.stringify(config));
    } catch (e) {
      console.error('[StorageService] Failed to save auto rotate config', e);
    }
  }

  // Export full app bundle config as JSON
  public static exportFullBackup(): string {
    const backup = {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      slots: this.loadSlots(),
      settings: this.loadSettings(),
      hotkeys: this.loadHotkeys(),
      autoRotate: this.loadAutoRotate(),
    };
    return JSON.stringify(backup, null, 2);
  }

  // Import full app backup
  public static importFullBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.slots && Array.isArray(parsed.slots)) {
        this.saveSlots(parsed.slots);
      }
      if (parsed.settings) {
        this.saveSettings(parsed.settings);
      }
      if (parsed.hotkeys) {
        this.saveHotkeys(parsed.hotkeys);
      }
      if (parsed.autoRotate) {
        this.saveAutoRotate(parsed.autoRotate);
      }
      return { success: true, message: 'Settings and slots imported successfully!' };
    } catch (e) {
      return { success: false, message: `Invalid backup JSON format: ${(e as Error).message}` };
    }
  }

  /** True once the first-run welcome celebration has played for this user. */
  public static hasSeenCelebration(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.CELEBRATION) === '1';
    } catch {
      return false;
    }
  }

  public static setCelebrationSeen(seen: boolean): void {
    try {
      if (seen) {
        localStorage.setItem(STORAGE_KEYS.CELEBRATION, '1');
      } else {
        localStorage.removeItem(STORAGE_KEYS.CELEBRATION);
      }
    } catch (e) {
      console.warn('[StorageService] Could not persist celebration flag', e);
    }
  }

  public static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }
}
