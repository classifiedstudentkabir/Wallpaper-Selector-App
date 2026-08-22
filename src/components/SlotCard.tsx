import React from 'react';
import { 
  Check, 
  Sliders, 
  Trash2, 
  MoveLeft, 
  MoveRight, 
  GripVertical, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles,
  Layers
} from 'lucide-react';
import { WallpaperSlot, AppSettings } from '../types/wallpaper';
import { WallpaperService } from '../services/wallpaperService';
import { soundService } from '../services/soundService';

interface SlotCardProps {
  slot: WallpaperSlot;
  index: number;
  totalSlots: number;
  settings: AppSettings;
  isDragging: boolean;
  isDragOver: boolean;
  onApply: (slot: WallpaperSlot) => void;
  onEditFilters: (slot: WallpaperSlot) => void;
  onReplaceImage: (slot: WallpaperSlot) => void;
  onClearSlot: (slot: WallpaperSlot) => void;
  onMoveSlot: (fromIndex: number, toIndex: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  index,
  totalSlots,
  settings,
  isDragging,
  isDragOver,
  onApply,
  onEditFilters,
  onReplaceImage,
  onClearSlot,
  onMoveSlot,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const cssFilter = WallpaperService.getCssFilterString(slot.filters);
  const fitStyles = WallpaperService.getFitModeStyles(slot.fitMode);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl transition-all duration-200 flex flex-col bg-[#1c1f26]/90 border ${
        slot.isActive
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50'
          : isDragOver
          ? 'border-blue-400 bg-blue-950/30 scale-[1.02] shadow-xl'
          : 'border-white/[0.08] hover:border-white/20 hover:bg-[#21252e]'
      } ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
    >
      {/* Top Header / Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <div 
            className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-0.5"
            title="Drag to reorder slot"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Slot Badge */}
          <div className="flex items-center gap-1.5">
            <span 
              className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: slot.isActive ? settings.accentColor : 'rgba(255,255,255,0.12)' }}
            >
              {slot.slotNumber}
            </span>
            <span className="text-xs font-semibold text-gray-200">
              Slot {slot.slotNumber}
            </span>
          </div>
        </div>

        {/* Hotkey Tag & Active Indicator */}
        <div className="flex items-center gap-1.5">
          {slot.isActive && (
            <span 
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-blue-300 bg-blue-500/20 border border-blue-500/30 animate-pulse"
            >
              <Check className="w-3 h-3 text-blue-400" /> Active
            </span>
          )}

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-gray-400 border border-white/5">
            Win+Alt+{slot.slotNumber}
          </span>
        </div>
      </div>

      {/* Wallpaper Image Canvas Preview */}
      <div 
        className="relative aspect-video w-full overflow-hidden bg-black/50 cursor-pointer group/img"
        onClick={() => onApply(slot)}
        title="Click to apply this wallpaper to desktop"
      >
        {slot.url ? (
          <>
            <div
              className="w-full h-full transition-transform duration-300 group-hover/img:scale-105"
              style={{
                backgroundImage: `url(${slot.thumbnailUrl || slot.url})`,
                filter: cssFilter,
                ...fitStyles,
              }}
            />
            {/* Vignette Overlay if enabled */}
            {slot.filters?.vignette > 0 && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 ${slot.filters.vignette * 1.5}px rgba(0,0,0,0.8)`,
                }}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2 p-4 text-center">
            <Layers className="w-8 h-8 opacity-40" />
            <span className="text-xs">Empty Slot. Click Change Image to assign.</span>
          </div>
        )}

        {/* Hover Quick Overlay Action */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply(slot);
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg flex items-center gap-1.5 transition transform hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply Background</span>
          </button>
        </div>

        {/* Metadata Badges Overlay at bottom of preview */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1">
            {slot.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-gray-200 font-medium">
                {slot.category}
              </span>
            )}
            {slot.fitMode && (
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-blue-300 font-mono">
                {slot.fitMode}
              </span>
            )}
          </div>

          {slot.resolution && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-gray-300 font-mono">
              {slot.resolution.split(' ')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Simulated Edge-Case Warning Banner (if source deleted) */}
      {slot.isDeletedSource && (
        <div className="bg-amber-950/60 border-y border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-amber-300 text-[11px]">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Original file moved/deleted</span>
          </div>
          <button 
            onClick={() => onReplaceImage(slot)}
            className="text-[10px] underline font-semibold text-amber-200 hover:text-white"
          >
            Relink
          </button>
        </div>
      )}

      {/* Slot Details Body */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-semibold text-gray-100 truncate" title={slot.title}>
            {slot.title || `Wallpaper Slot ${slot.slotNumber}`}
          </h4>
          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
            <span>By {slot.author || 'Local User'}</span>
            {slot.fileSize && <span>{slot.fileSize}</span>}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between gap-1">
          {/* Reorder Buttons (Accessible fallback to drag & drop) */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onMoveSlot(index, Math.max(0, index - 1))}
              disabled={index === 0}
              title="Move Left (Reorder Slot)"
              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <MoveLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMoveSlot(index, Math.min(totalSlots - 1, index + 1))}
              disabled={index === totalSlots - 1}
              title="Move Right (Reorder Slot)"
              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <MoveRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Slot Actions */}
          <div className="flex items-center gap-1">
            {/* Filters & Adjustments */}
            <button
              onClick={() => {
                soundService.playClick();
                onEditFilters(slot);
              }}
              title="Edit Filters & Display Fit"
              className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Replace / Change Image */}
            <button
              onClick={() => {
                soundService.playClick();
                onReplaceImage(slot);
              }}
              title="Change or Upload New Image"
              className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Clear Slot */}
            <button
              onClick={() => {
                soundService.playDelete();
                onClearSlot(slot);
              }}
              title="Clear / Reset Slot"
              className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Apply Button */}
            <button
              onClick={() => onApply(slot)}
              style={
                slot.isActive
                  ? { backgroundColor: settings.accentColor }
                  : undefined
              }
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                slot.isActive
                  ? 'text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-gray-200'
              }`}
            >
              {slot.isActive ? (
                <>
                  <Check className="w-3 h-3" /> Active
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
