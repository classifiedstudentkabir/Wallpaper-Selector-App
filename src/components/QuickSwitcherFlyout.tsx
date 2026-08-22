import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { WallpaperSlot, AppSettings } from '../types/wallpaper';
import { WallpaperService } from '../services/wallpaperService';
import { soundService } from '../services/soundService';

interface QuickSwitcherFlyoutProps {
  isOpen: boolean;
  slots: WallpaperSlot[];
  settings: AppSettings;
  onClose: () => void;
  onApplySlot: (slot: WallpaperSlot) => void;
}

export const QuickSwitcherFlyout: React.FC<QuickSwitcherFlyoutProps> = ({
  isOpen,
  slots,
  settings,
  onClose,
  onApplySlot,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation when open
  useEffect(() => {
    if (!isOpen) return;

    soundService.playFlyoutOpen();

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1 to 6 numerical keys
      if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const slotNum = parseInt(e.key, 10);
        const slot = slots.find((s) => s.slotNumber === slotNum);
        if (slot) {
          e.preventDefault();
          onApplySlot(slot);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const activeIdx = slots.findIndex((s) => s.isActive);
        const nextIdx = (activeIdx + 1) % slots.length;
        onApplySlot(slots[nextIdx]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const activeIdx = slots.findIndex((s) => s.isActive);
        const prevIdx = (activeIdx - 1 + slots.length) % slots.length;
        onApplySlot(slots[prevIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slots, onApplySlot, onClose]);

  if (!isOpen) return null;

  const activeSlot = slots.find((s) => s.isActive);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#1c1f28]/95 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-2xl p-6 text-white animate-flyout relative overflow-hidden"
        style={{
          boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1), 0 0 40px ${settings.accentColor}33`,
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Quick Wallpaper Selector</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  HUD Flyout
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Press <span className="text-blue-300 font-mono font-semibold">1 - 6</span> or click to switch background instantly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slot Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 my-5">
          {slots.map((slot) => {
            const cssFilter = WallpaperService.getCssFilterString(slot.filters);
            const fitStyles = WallpaperService.getFitModeStyles(slot.fitMode);

            return (
              <button
                key={slot.id}
                onClick={() => {
                  onApplySlot(slot);
                  onClose();
                }}
                className={`group relative rounded-xl overflow-hidden text-left transition-all duration-200 cursor-pointer flex flex-col bg-[#14161d] border ${
                  slot.isActive
                    ? 'border-blue-400 ring-2 ring-blue-500/70 shadow-lg shadow-blue-500/30 scale-[1.03]'
                    : 'border-white/10 hover:border-white/30 hover:scale-[1.02]'
                }`}
              >
                {/* Number Key Indicator Overlay */}
                <div className="absolute top-2 left-2 z-10">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                      slot.isActive 
                        ? 'text-white' 
                        : 'bg-black/80 text-gray-200 border border-white/20'
                    }`}
                    style={slot.isActive ? { backgroundColor: settings.accentColor } : undefined}
                  >
                    {slot.slotNumber}
                  </div>
                </div>

                {slot.isActive && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs shadow-md">
                      <Check className="w-3 h-3" />
                    </span>
                  </div>
                )}

                {/* Thumbnail Image */}
                <div className="aspect-[4/3] w-full bg-black/40 relative overflow-hidden">
                  <div
                    className="w-full h-full transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${slot.thumbnailUrl || slot.url})`,
                      filter: cssFilter,
                      ...fitStyles,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                </div>

                {/* Footer label */}
                <div className="p-2 bg-[#171922]">
                  <p className="text-[11px] font-semibold text-gray-200 truncate group-hover:text-blue-300 transition">
                    {slot.title || `Slot ${slot.slotNumber}`}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-gray-400 mt-0.5 font-mono">
                    <span>Key [{slot.slotNumber}]</span>
                    {slot.category && <span>{slot.category}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info & keyboard instructions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-gray-300">1 - 6</kbd>
              <span>Switch Slot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-gray-300">← →</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-gray-300">ESC</kbd>
              <span>Close</span>
            </div>
          </div>

          {activeSlot && (
            <div className="flex items-center gap-2 text-blue-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Slot {activeSlot.slotNumber} active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
