export type FitMode = 'fill' | 'fit' | 'stretch' | 'tile' | 'center' | 'span';

export interface ImageFilters {
  brightness: number; // 50 to 150 (default 100)
  contrast: number;   // 50 to 150 (default 100)
  saturation: number; // 0 to 200 (default 100)
  blur: number;       // 0 to 20px (default 0)
  hueRotate: number;  // 0 to 360deg (default 0)
  grayscale: number;  // 0 to 100% (default 0)
  sepia: number;      // 0 to 100% (default 0)
  vignette: number;   // 0 to 100% (default 0)
}

export interface WallpaperSlot {
  id: string;
  slotNumber: number; // 1 to 6
  title: string;
  url: string;
  thumbnailUrl: string;
  sourceType: 'preset' | 'local' | 'url' | 'generated';
  resolution?: string;
  fileSize?: string;
  category?: string;
  author?: string;
  authorUrl?: string;
  fitMode: FitMode;
  targetMonitor: 'all' | 'monitor-1' | 'monitor-2';
  filters: ImageFilters;
  addedAt: number;
  isActive: boolean;
  isDeletedSource?: boolean; // Simulated edge case for deleted local file
}

export interface HotkeyConfig {
  openPicker: string; // e.g. "Win+Alt+W"
  nextSlot: string;   // e.g. "Win+Alt+Right"
  prevSlot: string;   // e.g. "Win+Alt+Left"
  slot1: string;      // e.g. "Win+Alt+1"
  slot2: string;      // e.g. "Win+Alt+2"
  slot3: string;      // e.g. "Win+Alt+3"
  slot4: string;      // e.g. "Win+Alt+4"
  slot5: string;      // e.g. "Win+Alt+5"
  slot6: string;      // e.g. "Win+Alt+6"
  enableGlobalHotkeys: boolean;
}

export interface AutoRotateConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g. 5, 15, 30, 60
  shuffle: boolean;
  pauseOnBattery: boolean;
  pauseWhenFullscreenApp: boolean;
  timeOfDayTheme: boolean; // Day / Night dynamic slots
  daySlot: number;
  nightSlot: number;
  transitionEffect: 'fade' | 'slide' | 'zoom' | 'blur' | 'instant';
  transitionDurationMs: number;
}

export interface AppSettings {
  theme: 'mica-dark' | 'mica-light' | 'acrylic-dark' | 'acrylic-light';
  accentColor: string; // e.g. "#0078D4", "#60CDFF", "#9B51E0", "#107C41", "#FF8C00", "#FF4343"
  startWithWindows: boolean;
  minimizeToTray: boolean;
  showDesktopFlyoutOnHotkey: boolean;
  soundEffects: boolean;
  hardwareAcceleration: boolean;
  confirmBeforeSlotDelete: boolean;
  cacheLocation: string;
  maxCacheSizeMb: number;
  currentMonitorCount: number;
  telemetryEnabled: boolean;
  /**
   * One-time welcome celebration. When true, a brand-new user sees the confetti
   * burst + side panel notification on their very FIRST wallpaper change only.
   * Turning it back on re-arms the celebration for one more showing.
   */
  celebrationEnabled: boolean;
}

export interface PresetPack {
  id: string;
  name: string;
  description: string;
  category: string;
  wallpapers: Omit<WallpaperSlot, 'id' | 'slotNumber' | 'addedAt' | 'isActive'>[];
}

export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'Storage' | 'Hotkeys' | 'WallpaperService' | 'EdgeCases' | 'MVVM';
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed' | 'warning';
  output?: string;
  durationMs?: number;
}
