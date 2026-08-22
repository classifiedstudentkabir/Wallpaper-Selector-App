import React, { useState } from 'react';
import { 
  X, 
  Check, 
  RotateCcw, 
  Sliders, 
  Monitor, 
  Sun, 
  Contrast as ContrastIcon, 
  Palette, 
  Eye, 
  Sparkles, 
  Code,
  Copy,
  CheckCheck
} from 'lucide-react';
import { WallpaperSlot, FitMode, ImageFilters } from '../types/wallpaper';
import { WallpaperService } from '../services/wallpaperService';
import { DEFAULT_FILTERS } from '../constants/defaultWallpapers';
import { soundService } from '../services/soundService';

interface ImageEditorModalProps {
  slot: WallpaperSlot | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSlot: WallpaperSlot) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  slot,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !slot) return null;

  const [title, setTitle] = useState(slot.title);
  const [fitMode, setFitMode] = useState<FitMode>(slot.fitMode);
  const [targetMonitor, setTargetMonitor] = useState<'all' | 'monitor-1' | 'monitor-2'>(slot.targetMonitor || 'all');
  const [filters, setFilters] = useState<ImageFilters>({ ...DEFAULT_FILTERS, ...slot.filters });
  const [showPowerShellCode, setShowPowerShellCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const updateFilter = (key: keyof ImageFilters, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    soundService.playClick();
  };

  const handleApplyPreset = (presetFilters: Partial<ImageFilters>) => {
    setFilters({ ...DEFAULT_FILTERS, ...presetFilters });
    soundService.playClick();
  };

  const handleSave = () => {
    const updated: WallpaperSlot = {
      ...slot,
      title,
      fitMode,
      targetMonitor,
      filters,
    };
    onSave(updated);
    soundService.playSuccess();
    onClose();
  };

  const powerShellCmd = WallpaperService.generatePowerShellCommand({
    ...slot,
    fitMode,
    filters,
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(powerShellCmd);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const cssFilter = WallpaperService.getCssFilterString(filters);
  const fitStyles = WallpaperService.getFitModeStyles(fitMode);

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all select-none"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#1a1c24] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-flyout text-white"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#14161d]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Edit Slot {slot.slotNumber} Filters & Fit</h3>
              <p className="text-xs text-gray-400">Configure visual adjustments, display mode, and target screen</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Live Preview Canvas (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Wallpaper Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Canvas Preview Container */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold">Live Monitor Preview</span>
                <span className="text-[11px] font-mono uppercase">{fitMode} mode</span>
              </div>

              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/20 shadow-inner flex items-center justify-center">
                <div
                  className="w-full h-full transition-all duration-150"
                  style={{
                    backgroundImage: `url(${slot.url || slot.thumbnailUrl})`,
                    filter: cssFilter,
                    ...fitStyles,
                  }}
                />
                {filters.vignette > 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 ${filters.vignette * 1.8}px rgba(0,0,0,0.85)`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Quick Filter Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Quick Filter Presets</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleApplyPreset({})}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-gray-300 transition"
                >
                  Normal
                </button>
                <button
                  onClick={() => handleApplyPreset({ saturation: 140, contrast: 115 })}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-blue-300 transition"
                >
                  Vibrant
                </button>
                <button
                  onClick={() => handleApplyPreset({ saturation: 130, hueRotate: 300, contrast: 120, vignette: 40 })}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-purple-300 transition"
                >
                  Cyberpunk
                </button>
                <button
                  onClick={() => handleApplyPreset({ grayscale: 100, contrast: 120 })}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-gray-300 transition"
                >
                  Monochrome
                </button>
                <button
                  onClick={() => handleApplyPreset({ sepia: 70, contrast: 95, brightness: 105 })}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-amber-300 transition"
                >
                  Vintage
                </button>
                <button
                  onClick={() => handleApplyPreset({ brightness: 80, contrast: 110, vignette: 60 })}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-gray-400 transition"
                >
                  Moody Dark
                </button>
              </div>
            </div>

            {/* PowerShell Script toggle */}
            <div>
              <button
                onClick={() => setShowPowerShellCode(!showPowerShellCode)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showPowerShellCode ? 'Hide Win32 Script' : 'View Windows Win32 API Call'}</span>
              </button>

              {showPowerShellCode && (
                <div className="mt-2 p-3 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-gray-300 relative">
                  <pre className="overflow-x-auto max-h-28 whitespace-pre-wrap">{powerShellCmd}</pre>
                  <button
                    onClick={handleCopyCode}
                    className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-gray-200"
                  >
                    {copiedCode ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Fine Adjustments & Display Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Display Fit Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Display Fit Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['fill', 'fit', 'stretch', 'tile', 'center', 'span'] as FitMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setFitMode(mode);
                      soundService.playClick();
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium uppercase tracking-wider transition cursor-pointer ${
                      fitMode === mode
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Monitor */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Target Display Monitor</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTargetMonitor('all')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    targetMonitor === 'all'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>All Monitors</span>
                </button>
                <button
                  onClick={() => setTargetMonitor('monitor-1')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    targetMonitor === 'monitor-1'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Monitor 1 (Primary)</span>
                </button>
                <button
                  onClick={() => setTargetMonitor('monitor-2')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    targetMonitor === 'monitor-2'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Monitor 2</span>
                </button>
              </div>
            </div>

            {/* Filter Sliders */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-200">Image Adjustments</span>
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Brightness
                  </span>
                  <span className="font-mono text-gray-200">{filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={filters.brightness}
                  onChange={(e) => updateFilter('brightness', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <ContrastIcon className="w-3.5 h-3.5 text-blue-400" /> Contrast
                  </span>
                  <span className="font-mono text-gray-200">{filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={filters.contrast}
                  onChange={(e) => updateFilter('contrast', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-pink-400" /> Saturation
                  </span>
                  <span className="font-mono text-gray-200">{filters.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.saturation}
                  onChange={(e) => updateFilter('saturation', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" /> Blur Effect
                  </span>
                  <span className="font-mono text-gray-200">{filters.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.blur}
                  onChange={(e) => updateFilter('blur', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Vignette */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Vignette Dark Edge
                  </span>
                  <span className="font-mono text-gray-200">{filters.vignette}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.vignette}
                  onChange={(e) => updateFilter('vignette', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#14161d] border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Adjustments</span>
          </button>
        </div>
      </div>
    </div>
  );
};
