import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Shuffle, 
  Sun, 
  Moon, 
  BatteryCharging, 
  RefreshCw, 
  Check
} from 'lucide-react';
import { AutoRotateConfig, WallpaperSlot } from '../types/wallpaper';
import { soundService } from '../services/soundService';

interface AutoRotateSchedulerProps {
  config: AutoRotateConfig;
  slots: WallpaperSlot[];
  activeSlot: WallpaperSlot;
  onUpdateConfig: (newConfig: AutoRotateConfig) => void;
  onTriggerNext: () => void;
}

export const AutoRotateScheduler: React.FC<AutoRotateSchedulerProps> = ({
  config,
  slots,
  activeSlot,
  onUpdateConfig,
  onTriggerNext,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(config.intervalMinutes * 60);

  // Interval timer for live rotation
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          onTriggerNext();
          return config.intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [config.enabled, config.intervalMinutes, onTriggerNext]);

  // Reset timer when interval changed
  const handleIntervalChange = (mins: number) => {
    onUpdateConfig({ ...config, intervalMinutes: mins });
    setSecondsRemaining(mins * 60);
    soundService.playClick();
  };

  const progressPct = Math.max(0, Math.min(100, ((config.intervalMinutes * 60 - secondsRemaining) / (config.intervalMinutes * 60)) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Top Banner Status */}
      <div className={`p-6 rounded-2xl border transition-all ${
        config.enabled
          ? 'bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#14161f] border-blue-500/30 shadow-xl'
          : 'bg-[#181a22] border-white/10'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              config.enabled ? 'bg-blue-600 text-white shadow-lg animate-pulse' : 'bg-white/10 text-gray-400'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Auto-Rotation Wallpaper Engine</h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  config.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-gray-400'
                }`}>
                  {config.enabled ? 'Active Running' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Automatically rotate your desktop background across the 6 slots at a custom interval
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => {
              const nextState = !config.enabled;
              onUpdateConfig({ ...config, enabled: nextState });
              setSecondsRemaining(config.intervalMinutes * 60);
              if (nextState) soundService.playSuccess();
              else soundService.playClick();
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg ${
              config.enabled
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-200'
            }`}
          >
            {config.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{config.enabled ? 'Disable Auto-Rotation' : 'Enable Auto-Rotation'}</span>
          </button>
        </div>

        {/* Live Progress Bar if Enabled */}
        {config.enabled && (
          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Next background change in:</span>
              <span className="font-mono font-bold text-blue-300 text-sm">
                {formatTime(secondsRemaining)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Current: Slot {activeSlot.slotNumber} ({activeSlot.title})</span>
              <button
                onClick={onTriggerNext}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Skip to Next Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interval Selector */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 space-y-4">
        <h4 className="text-sm font-bold text-gray-200">Rotation Interval</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {[
            { label: '10 sec (Demo)', val: 0.166 },
            { label: '1 min', val: 1 },
            { label: '5 min', val: 5 },
            { label: '15 min', val: 15 },
            { label: '30 min', val: 30 },
            { label: '1 hour', val: 60 },
          ].map((item) => {
            const isSelected = Math.abs(config.intervalMinutes - item.val) < 0.05;
            return (
              <button
                key={item.label}
                onClick={() => handleIntervalChange(item.val)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                <span>{item.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rotation Rules & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shuffle Mode */}
        <div className="p-5 rounded-xl bg-[#181b22] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-gray-200">Random / Shuffle Mode</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">Pick randomly from the 6 slots instead of sequential order</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.shuffle}
            onChange={(e) => onUpdateConfig({ ...config, shuffle: e.target.checked })}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Battery Pause */}
        <div className="p-5 rounded-xl bg-[#181b22] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-gray-200">Pause on Battery Saver</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">Conserve laptop power by pausing background changes</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.pauseOnBattery}
            onChange={(e) => onUpdateConfig({ ...config, pauseOnBattery: e.target.checked })}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Day / Night Dynamic Theme */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-gray-200">Day / Night Dynamic Switching</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">Automatically apply Day wallpaper at 6:00 AM and Night wallpaper at 7:00 PM</p>
            </div>
          </div>

          <input
            type="checkbox"
            checked={config.timeOfDayTheme}
            onChange={(e) => onUpdateConfig({ ...config, timeOfDayTheme: e.target.checked })}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
        </div>

        {config.timeOfDayTheme && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Daytime Slot (6 AM - 7 PM)
              </label>
              <select
                value={config.daySlot}
                onChange={(e) => onUpdateConfig({ ...config, daySlot: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
              >
                {slots.map((s) => (
                  <option key={s.id} value={s.slotNumber}>
                    Slot {s.slotNumber} — {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Nighttime Slot (7 PM - 6 AM)
              </label>
              <select
                value={config.nightSlot}
                onChange={(e) => onUpdateConfig({ ...config, nightSlot: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
              >
                {slots.map((s) => (
                  <option key={s.id} value={s.slotNumber}>
                    Slot {s.slotNumber} — {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
