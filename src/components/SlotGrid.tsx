import React, { useState } from 'react';
import { 
  Sparkles, 
  Shuffle, 
  Download, 
  Upload, 
  Command, 
  ArrowRight, 
  ArrowLeft, 
  SlidersHorizontal, 
  CheckCircle2, 
  FileCode 
} from 'lucide-react';
import { WallpaperSlot, AppSettings, PresetPack } from '../types/wallpaper';
import { SlotCard } from './SlotCard';
import { soundService } from '../services/soundService';
import { PRESET_PACKS } from '../constants/defaultWallpapers';

interface SlotGridProps {
  slots: WallpaperSlot[];
  settings: AppSettings;
  onApplySlot: (slot: WallpaperSlot) => void;
  onEditFilters: (slot: WallpaperSlot) => void;
  onReplaceImage: (slot: WallpaperSlot) => void;
  onClearSlot: (slot: WallpaperSlot) => void;
  onReorderSlots: (newSlots: WallpaperSlot[]) => void;
  onLoadPresetPack: (pack: PresetPack) => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onNextSlot: () => void;
  onPrevSlot: () => void;
  onShuffleSlots: () => void;
  onSimulateDeletedFile: () => void;
}

export const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  settings,
  onApplySlot,
  onEditFilters,
  onReplaceImage,
  onClearSlot,
  onReorderSlots,
  onLoadPresetPack,
  onExportBackup,
  onImportBackup,
  onNextSlot,
  onPrevSlot,
  onShuffleSlots,
  onSimulateDeletedFile,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const activeSlot = slots.find((s) => s.isActive) || slots[0];

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
    soundService.playClick();
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // Keep clean
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...slots];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Update slot numbers to maintain 1..6 sequence
    const updated = reordered.map((slot, i) => ({
      ...slot,
      slotNumber: i + 1,
    }));

    soundService.playDrop();
    onReorderSlots(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Button-based move fallback
  const handleMoveSlot = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...slots];
    const [movedItem] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedItem);

    const updated = reordered.map((slot, i) => ({
      ...slot,
      slotNumber: i + 1,
    }));

    soundService.playDrop();
    onReorderSlots(updated);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Banner: Active Wallpaper Showcase */}
      {activeSlot && (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-[#14171f] p-5 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-14 rounded-lg overflow-hidden border border-white/20 shadow-md shrink-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${activeSlot.thumbnailUrl || activeSlot.url})` }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Currently Active
                  </span>
                  <span className="text-xs text-gray-400">Slot {activeSlot.slotNumber} of 6</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{activeSlot.title}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span>{activeSlot.resolution || '4K Ultra HD'}</span>
                  <span>•</span>
                  <span>Fit: <strong className="uppercase text-gray-300">{activeSlot.fitMode}</strong></span>
                  <span>•</span>
                  <span>Category: {activeSlot.category || 'General'}</span>
                </div>
              </div>
            </div>

            {/* Quick Step Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={onPrevSlot}
                title="Previous Slot (Win + Alt + Left)"
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={onNextSlot}
                title="Next Slot (Win + Alt + Right)"
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEditFilters(activeSlot)}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Adjust Live</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Bulk Actions & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181b22]/90 p-3 rounded-xl border border-white/[0.08]">
        {/* Left Section: Slot Reordering notice & Quick Pack */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Load Curated Pack</span>
            </button>

            {/* Dropdown Menu */}
            {showPresetDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-[#20232c] border border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-flyout">
                <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
                  Select Wallpaper Pack
                </div>
                {PRESET_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => {
                      onLoadPresetPack(pack);
                      setShowPresetDropdown(false);
                      soundService.playSuccess();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-600/20 text-xs font-medium text-gray-200 hover:text-white transition flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-blue-300">{pack.name}</span>
                    <span className="text-[10px] text-gray-400">{pack.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onShuffleSlots();
              soundService.playClick();
            }}
            title="Randomize slot positions"
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>

          {/* Test Edge Case button */}
          <button
            onClick={onSimulateDeletedFile}
            title="Test recovery behavior when a wallpaper source file is deleted or missing"
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-medium text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Simulate Missing File Edge Case</span>
          </button>
        </div>

        {/* Right Section: Export & Import JSON */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportBackup}
            title="Export slots configuration as JSON backup"
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Slots</span>
          </button>
          <button
            onClick={onImportBackup}
            title="Import configuration JSON"
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* 6-Slots Grid View */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-200">Active Wallpaper Slots (1 to 6)</h3>
            <span className="text-xs text-gray-400">• Drag cards to reorder</span>
          </div>
          <span className="text-xs text-blue-400 font-medium">
            Global Hotkey: Press <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/10 font-mono text-[11px]">Win + Alt + [1-6]</kbd>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot, index) => (
            <SlotCard
              key={slot.id || index}
              slot={slot}
              index={index}
              totalSlots={slots.length}
              settings={settings}
              isDragging={draggedIndex === index}
              isDragOver={dragOverIndex === index}
              onApply={onApplySlot}
              onEditFilters={onEditFilters}
              onReplaceImage={onReplaceImage}
              onClearSlot={onClearSlot}
              onMoveSlot={handleMoveSlot}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Feature & Architecture Guidance Footnote */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-xl bg-[#16181f] border border-white/[0.06] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <Command className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-200">Instant Global Hotkeys</h4>
            <p className="text-[11px] text-gray-400 mt-1">
              Press <span className="text-blue-300 font-mono">Win + Alt + W</span> to trigger the Quick Switcher HUD anywhere on your desktop.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16181f] border border-white/[0.06] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-200">Fluent WinUI 3 Architecture</h4>
            <p className="text-[11px] text-gray-400 mt-1">
              Engineered with .NET 8, MVVM, and native Windows Mica/Acrylic backdrops with persistent Local Storage.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16181f] border border-white/[0.06] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-200">Live Desktop Preview</h4>
            <p className="text-[11px] text-gray-400 mt-1">
              Switch to Live Desktop mode to interact with the simulated Windows 11 taskbar, start menu, and tray.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
