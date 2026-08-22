import React from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Volume2, 
  VolumeX, 
  Layers, 
  Monitor, 
  Command, 
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { WallpaperSlot, AppSettings } from '../types/wallpaper';

interface TitleBarProps {
  activeSlot: WallpaperSlot | undefined;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenQuickFlyout: () => void;
  onOpenHelp: () => void;
  isDesktopMode: boolean;
  onToggleDesktopMode: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeSlot,
  settings,
  onUpdateSettings,
  onOpenQuickFlyout,
  onOpenHelp,
  isDesktopMode,
  onToggleDesktopMode,
  isMaximized,
  onToggleMaximize,
}) => {
  return (
    <div className="h-10 w-full bg-[#181a20]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between px-3 select-none z-50 sticky top-0">
      {/* Left: App Icon & Title */}
      <div className="flex items-center gap-2.5">
        <div 
          className="w-5 h-5 rounded-md flex items-center justify-center text-white shadow-sm font-bold text-xs"
          style={{ backgroundColor: settings.accentColor }}
        >
          <Layers className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-gray-200">
            Wallpaper Selector
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-blue-300 font-medium">
            WinUI 3
          </span>
        </div>
      </div>

      {/* Center: Active Slot Status & Quick Switcher Hotkey Pill */}
      <div className="hidden sm:flex items-center gap-2">
        {activeSlot && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-[11px] text-gray-400">Active:</span>
            <span className="text-[11px] text-gray-200 max-w-[140px] truncate font-medium">
              Slot {activeSlot.slotNumber} • {activeSlot.title}
            </span>
          </div>
        )}

        {/* Global Hotkey trigger pill */}
        <button
          onClick={onOpenQuickFlyout}
          title="Press Win + Alt + W or Click to open Quick Switcher Flyout"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[11px] font-medium transition cursor-pointer"
        >
          <Command className="w-3 h-3 text-blue-400" />
          <span>Win + Alt + W</span>
        </button>
      </div>

      {/* Right: Quick actions & Window Controls */}
      <div className="flex items-center gap-1">
        {/* Toggle Live Desktop Simulation Mode */}
        <button
          onClick={onToggleDesktopMode}
          title={isDesktopMode ? 'Switch to Standard App View' : 'Switch to Interactive Live Desktop View'}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition cursor-pointer ${
            isDesktopMode 
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden md:inline font-medium">
            {isDesktopMode ? 'Desktop View' : 'Live Desktop'}
          </span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => onUpdateSettings({ soundEffects: !settings.soundEffects })}
          title={settings.soundEffects ? 'Sound Effects Enabled' : 'Sound Effects Muted'}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-200 hover:bg-white/10 transition cursor-pointer"
        >
          {settings.soundEffects ? (
            <Volume2 className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-gray-500" />
          )}
        </button>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          title="Shortcuts and Help"
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-200 hover:bg-white/10 transition cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Window Controls (Minimize, Maximize, Close) */}
        <div className="flex items-center ml-1 pl-1 border-l border-white/10">
          <button
            onClick={() => {}}
            title="Minimize"
            className="w-8 h-7 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
            className="w-8 h-7 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
          >
            {isMaximized ? <Square className="w-2.5 h-2.5" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={() => {}}
            title="Close"
            className="w-8 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
