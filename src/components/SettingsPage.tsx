import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Monitor, 
  HardDrive, 
  RotateCcw, 
  Check, 
  Trash2, 
  Download, 
  Upload,
  PartyPopper,
  RefreshCw,
  BellOff,
  BellRing
} from 'lucide-react';
import { AppSettings } from '../types/wallpaper';
import { soundService } from '../services/soundService';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetAllData: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onReplayCelebration: () => void;
  onReArmCelebration: () => void;
  celebrationAlreadyShown: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  onExportBackup,
  onImportBackup,
  onReplayCelebration,
  onReArmCelebration,
  celebrationAlreadyShown,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const accentColors = [
    { label: 'Windows Blue', color: '#0078D4' },
    { label: 'Cyan Ice', color: '#60CDFF' },
    { label: 'Royal Purple', color: '#9B51E0' },
    { label: 'Forest Green', color: '#107C41' },
    { label: 'Warm Amber', color: '#FF8C00' },
    { label: 'Crimson Red', color: '#FF4343' },
    { label: 'Neon Pink', color: '#E0519B' },
  ];

  const handleClearCache = () => {
    setCacheCleared(true);
    soundService.playDelete();
    setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#181b22] to-[#14161f] border border-blue-500/30 flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: settings.accentColor }}
        >
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Application Settings</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure Fluent UI material themes, Windows system startup, audio cues, and storage
          </p>
        </div>
      </div>

      {/* 1. Theme & Appearance */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-bold text-gray-200">Personalization & Material Themes</h4>
        </div>

        {/* Theme Styles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">Material Backdrop Effect</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'mica-dark', name: 'Mica Dark (Win 11)' },
              { id: 'acrylic-dark', name: 'Acrylic Dark' },
              { id: 'mica-light', name: 'Mica Light' },
              { id: 'acrylic-light', name: 'Acrylic Light' },
            ].map((themeItem) => (
              <button
                key={themeItem.id}
                onClick={() => {
                  onUpdateSettings({ theme: themeItem.id as AppSettings['theme'] });
                  soundService.playClick();
                }}
                className={`py-3 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1.5 ${
                  settings.theme === themeItem.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                <span>{themeItem.name}</span>
                {settings.theme === themeItem.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Windows Accent Color */}
        <div className="space-y-2 pt-3 border-t border-white/10">
          <label className="text-xs font-semibold text-gray-300">Fluent Accent Color</label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {accentColors.map((c) => (
              <button
                key={c.color}
                onClick={() => {
                  onUpdateSettings({ accentColor: c.color });
                  soundService.playClick();
                }}
                title={c.label}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition transform hover:scale-110 cursor-pointer shadow-md ${
                  settings.accentColor === c.color ? 'ring-2 ring-white scale-110' : ''
                }`}
                style={{ backgroundColor: c.color }}
              >
                {settings.accentColor === c.color && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. System & Startup Behavior */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-gray-200">System Integration & Behavior</h4>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {/* Start with Windows */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-200">Launch at Windows Startup</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Automatically run Wallpaper Selector in the background on system boot</p>
            </div>
            <input
              type="checkbox"
              checked={settings.startWithWindows}
              onChange={(e) => {
                onUpdateSettings({ startWithWindows: e.target.checked });
                soundService.playClick();
              }}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Minimize to Tray */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-200">Minimize to System Tray</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Keep utility active in notification area when closing main window</p>
            </div>
            <input
              type="checkbox"
              checked={settings.minimizeToTray}
              onChange={(e) => {
                onUpdateSettings({ minimizeToTray: e.target.checked });
                soundService.playClick();
              }}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Audio Sound Effects */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-200">Fluent Audio & Sound Effects</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Play subtle acoustic cues when switching backgrounds, reordering slots, and opening HUD</p>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => {
                onUpdateSettings({ soundEffects: e.target.checked });
                soundService.playClick();
              }}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Hardware Acceleration */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-200">DirectX GPU Acceleration</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Leverage DirectComposition for ultra-smooth 60fps Mica background rendering</p>
            </div>
            <input
              type="checkbox"
              checked={settings.hardwareAcceleration}
              onChange={(e) => {
                onUpdateSettings({ hardwareAcceleration: e.target.checked });
                soundService.playClick();
              }}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. First-Run Celebration (one-time only) */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 space-y-4 relative overflow-hidden">
        {/* faint confetti texture, purely decorative */}
        <div className="pointer-events-none absolute -top-14 -right-10 w-56 h-56 rounded-full bg-amber-400/[0.07] blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-200">First-Run Celebration</h4>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed max-w-lg">
                The confetti burst and the side-panel notification are a <span className="text-gray-200 font-semibold">one-time welcome</span> for
                a brand-new install. After they play once, every wallpaper change applies silently — no
                repeated animation, no repeated popup.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {celebrationAlreadyShown ? (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/[0.07] text-gray-300 border border-white/10 flex items-center gap-1.5">
                <BellOff className="w-3 h-3" />
                Already shown
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <BellRing className="w-3 h-3" />
                Armed
              </span>
            )}
          </div>
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-300">Enable welcome celebration</span>
            <input
              type="checkbox"
              checked={settings.celebrationEnabled}
              onChange={(e) => {
                onUpdateSettings({ celebrationEnabled: e.target.checked });
                soundService.playClick();
              }}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-gray-500">
              {settings.celebrationEnabled ? 'On — plays once, then never again' : 'Off — all changes are silent'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onReplayCelebration();
                soundService.playClick();
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/[0.16] text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <PartyPopper className="w-3.5 h-3.5 text-amber-300" />
              <span>Preview the animation</span>
            </button>

            <button
              onClick={() => {
                onReArmCelebration();
                soundService.playClick();
              }}
              disabled={!settings.celebrationEnabled}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/[0.16] disabled:opacity-40 text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Lets the celebration play one more time on your next wallpaper change"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-arm for next change</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Storage, Cache & Data Backup */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-bold text-gray-200">Local Storage & Cache Management</h4>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold text-gray-300">Cache Directory:</span>
            <span className="text-[10px] text-blue-300 font-mono">Quota: {settings.maxCacheSizeMb} MB</span>
          </div>
          <p className="text-xs font-mono text-gray-400 truncate">{settings.cacheLocation}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearCache}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
              <span>{cacheCleared ? 'Cache Cleaned!' : 'Clear Thumbnail Cache'}</span>
            </button>
            <button
              onClick={onExportBackup}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
              <span>Export Settings JSON</span>
            </button>
            <button
              onClick={onImportBackup}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-gray-400" />
              <span>Import Settings JSON</span>
            </button>
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showClearConfirm && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-3">
            <h5 className="text-xs font-bold text-red-200">Are you sure you want to reset all data?</h5>
            <p className="text-xs text-gray-400">
              This will reset all 6 wallpaper slots, hotkey configurations, auto-rotation settings, and local cache.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onResetAllData();
                  setShowClearConfirm(false);
                  soundService.playDelete();
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
