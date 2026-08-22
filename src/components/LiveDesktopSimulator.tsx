import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Sparkles, 
  Sliders, 
  Trash2, 
  Monitor, 
  Wifi, 
  Volume2, 
  Battery, 
  Search, 
  LayoutGrid, 
  Compass, 
  Terminal, 
  Folder, 
  HardDrive, 
  X, 
  Minus, 
  Square, 
  RefreshCw, 
  ChevronUp, 
  Power, 
  ChevronRight, 
  Maximize2 
} from 'lucide-react';
import { WallpaperSlot, AppSettings, FitMode } from '../types/wallpaper';
import { WallpaperService } from '../services/wallpaperService';
import { soundService } from '../services/soundService';

interface LiveDesktopSimulatorProps {
  slots: WallpaperSlot[];
  activeSlot: WallpaperSlot;
  settings: AppSettings;
  onApplySlot: (slot: WallpaperSlot) => void;
  onEditFilters: (slot: WallpaperSlot) => void;
  onOpenQuickFlyout: () => void;
  onNextSlot: () => void;
  onPrevSlot: () => void;
  onUpdateSlotFit: (slotId: string, fitMode: FitMode) => void;
  onOpenAppStudio: () => void;
}

export const LiveDesktopSimulator: React.FC<LiveDesktopSimulatorProps> = ({
  slots,
  activeSlot,
  settings,
  onApplySlot,
  onEditFilters,
  onOpenQuickFlyout,
  onNextSlot,
  onPrevSlot,
  onUpdateSlotFit,
  onOpenAppStudio,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [isAppWindowOpen, setIsAppWindowOpen] = useState(true);
  const [isAppWindowMaximized, setIsAppWindowMaximized] = useState(false);
  const [windowPos, setWindowPos] = useState({ x: 120, y: 50 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle right click on desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 300),
      visible: true,
    });
    setIsStartOpen(false);
    setIsTrayOpen(false);
  };

  // Close context menu on general click
  const handleDesktopClick = () => {
    if (contextMenu.visible) setContextMenu({ x: 0, y: 0, visible: false });
    if (isStartOpen) setIsStartOpen(false);
    if (isTrayOpen) setIsTrayOpen(false);
  };

  // Window drag handlers
  const handleWindowMouseDown = (e: React.MouseEvent) => {
    if (isAppWindowMaximized) return;
    setIsDraggingWindow(true);
    setDragOffset({
      x: e.clientX - windowPos.x,
      y: e.clientY - windowPos.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingWindow) return;
      setWindowPos({
        x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 300, e.clientY - dragOffset.y)),
      });
    };

    const handleMouseUp = () => setIsDraggingWindow(false);

    if (isDraggingWindow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWindow, dragOffset]);

  const cssFilter = WallpaperService.getCssFilterString(activeSlot.filters);
  const fitStyles = WallpaperService.getFitModeStyles(activeSlot.fitMode);

  return (
    <div 
      className="relative w-full h-[calc(100vh-2.5rem)] overflow-hidden select-none bg-black"
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
    >
      {/* Dynamic Desktop Wallpaper Background Canvas */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: `url(${activeSlot.url || activeSlot.thumbnailUrl})`,
          filter: cssFilter,
          ...fitStyles,
        }}
      />

      {/* Vignette Overlay if filter present */}
      {activeSlot.filters?.vignette > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 ${activeSlot.filters.vignette * 3}px rgba(0,0,0,0.85)`,
          }}
        />
      )}

      {/* Top Left Desktop Mode HUD Banner */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-white shadow-xl">
        <Monitor className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold">Windows 11 Live Desktop</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
          Slot {activeSlot.slotNumber}: {activeSlot.title}
        </span>
        <button
          onClick={onOpenAppStudio}
          className="ml-2 text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
        >
          Exit to Studio View
        </button>
      </div>

      {/* Desktop Icons Grid */}
      <div className="absolute top-16 left-4 flex flex-col gap-5 z-10">
        {/* App Shortcut */}
        <div 
          onDoubleClick={() => {
            setIsAppWindowOpen(true);
            soundService.playClick();
          }}
          className="w-20 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition cursor-pointer text-center group"
        >
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] line-clamp-2">
            Wallpaper Selector
          </span>
        </div>

        {/* This PC Shortcut */}
        <div className="w-20 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-center group">
          <div className="w-11 h-11 rounded-xl bg-blue-500/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-lg group-hover:scale-105 transition">
            <HardDrive className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            This PC
          </span>
        </div>

        {/* File Explorer Shortcut */}
        <div className="w-20 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-center group">
          <div className="w-11 h-11 rounded-xl bg-amber-500/30 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-lg group-hover:scale-105 transition">
            <Folder className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            Wallpapers
          </span>
        </div>

        {/* Recycle Bin */}
        <div className="w-20 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-center group">
          <div className="w-11 h-11 rounded-xl bg-gray-600/30 border border-gray-400/30 flex items-center justify-center text-gray-300 shadow-lg group-hover:scale-105 transition">
            <Trash2 className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            Recycle Bin
          </span>
        </div>
      </div>

      {/* Floating Interactive Desktop Application Window */}
      {isAppWindowOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-30 flex flex-col rounded-xl overflow-hidden shadow-2xl transition-shadow bg-[#181a20]/95 backdrop-blur-2xl border border-white/20 ${
            isAppWindowMaximized 
              ? 'inset-4 bottom-16' 
              : 'w-[680px] h-[480px]'
          }`}
          style={
            !isAppWindowMaximized
              ? {
                  left: `${windowPos.x}px`,
                  top: `${windowPos.y}px`,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.1)',
                }
              : undefined
          }
        >
          {/* Draggable Window Title Bar */}
          <div 
            onMouseDown={handleWindowMouseDown}
            className="h-10 bg-[#14161b] border-b border-white/10 flex items-center justify-between px-3 cursor-move select-none"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded flex items-center justify-center text-white text-[10px]"
                style={{ backgroundColor: settings.accentColor }}
              >
                <Layers className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold text-gray-200">
                Wallpaper Selector — Windows 11 Utility
              </span>
            </div>

            <div className="flex items-center">
              <button
                onClick={() => setIsAppWindowOpen(false)}
                className="w-8 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsAppWindowMaximized(!isAppWindowMaximized)}
                className="w-8 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                {isAppWindowMaximized ? <Square className="w-2.5 h-2.5" /> : <Maximize2 className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setIsAppWindowOpen(false)}
                className="w-8 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Window Content: 6 Mini Slots Selector */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Select Background Slot (1 to 6)</h3>
                <p className="text-xs text-gray-400">Click any card to change desktop background instantly.</p>
              </div>
              <button
                onClick={onOpenQuickFlyout}
                className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Flyout (Win+Alt+W)</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot) => {
                const sFilter = WallpaperService.getCssFilterString(slot.filters);
                const sFit = WallpaperService.getFitModeStyles(slot.fitMode);

                return (
                  <div
                    key={slot.id}
                    onClick={() => {
                      onApplySlot(slot);
                      soundService.playApply();
                    }}
                    className={`relative rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                      slot.isActive
                        ? 'border-blue-400 ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/20 scale-[1.02]'
                        : 'border-white/10 hover:border-white/30 bg-[#12141a]'
                    }`}
                  >
                    <div className="aspect-video w-full relative overflow-hidden bg-black/60">
                      <div
                        className="w-full h-full group-hover:scale-105 transition"
                        style={{
                          backgroundImage: `url(${slot.thumbnailUrl || slot.url})`,
                          filter: sFilter,
                          ...sFit,
                        }}
                      />
                      <div className="absolute top-1 left-1">
                        <span 
                          className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                          style={{ backgroundColor: slot.isActive ? settings.accentColor : 'rgba(0,0,0,0.7)' }}
                        >
                          {slot.slotNumber}
                        </span>
                      </div>

                      {slot.isActive && (
                        <div className="absolute top-1 right-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500 text-white font-bold uppercase">
                            Active
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-[#171922] flex items-center justify-between">
                      <span className="text-[11px] font-medium text-gray-200 truncate">{slot.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditFilters(slot);
                        }}
                        title="Adjust"
                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Right Click Desktop Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 w-60 bg-[#20232b]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-1.5 text-xs text-gray-200 animate-flyout select-none"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onNextSlot();
              setContextMenu({ x: 0, y: 0, visible: false });
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-600/30 hover:text-white flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Next Wallpaper</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Win+Alt+→</span>
          </button>

          <button
            onClick={() => {
              onPrevSlot();
              setContextMenu({ x: 0, y: 0, visible: false });
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-600/30 hover:text-white flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              <span>Previous Wallpaper</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Win+Alt+←</span>
          </button>

          <div className="my-1 border-t border-white/10" />

          {/* Quick Fit Mode selector */}
          <div 
            className="relative"
            onMouseEnter={() => setShowSubMenu(true)}
            onMouseLeave={() => setShowSubMenu(false)}
          >
            <button
              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-600/30 hover:text-white flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                <span>Fit Mode ({activeSlot.fitMode})</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showSubMenu && (
              <div className="absolute left-full -top-1 ml-1 w-36 bg-[#20232b] border border-white/20 rounded-xl shadow-2xl p-1 z-50 space-y-0.5">
                {(['fill', 'fit', 'stretch', 'tile', 'center', 'span'] as FitMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      onUpdateSlotFit(activeSlot.id, mode);
                      setShowSubMenu(false);
                      setContextMenu({ x: 0, y: 0, visible: false });
                      soundService.playSuccess();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md uppercase text-[11px] font-mono transition flex items-center justify-between ${
                      activeSlot.fitMode === mode 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <span>{mode}</span>
                    {activeSlot.fitMode === mode && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onEditFilters(activeSlot);
              setContextMenu({ x: 0, y: 0, visible: false });
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-600/30 hover:text-white flex items-center gap-2 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit Active Filters</span>
          </button>

          <div className="my-1 border-t border-white/10" />

          <button
            onClick={() => {
              setIsAppWindowOpen(true);
              setContextMenu({ x: 0, y: 0, visible: false });
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-600/30 hover:text-white flex items-center gap-2 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Wallpaper Selector</span>
          </button>
        </div>
      )}

      {/* Windows 11 Start Menu Popover */}
      {isStartOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[540px] h-[520px] bg-[#1d2028]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 p-6 flex flex-col justify-between animate-flyout text-white"
        >
          {/* Start Menu Search Bar */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Type here to search apps, settings, wallpapers..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Pinned Apps */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-3">
                <span>Pinned</span>
                <button className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">All apps &gt;</button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    setIsAppWindowOpen(true);
                    setIsStartOpen(false);
                    soundService.playClick();
                  }}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: settings.accentColor }}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-xs">Wallpaper Selector</span>
                </button>

                <div className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-xs">Edge Browser</span>
                </div>

                <div className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Folder className="w-5 h-5" />
                  </div>
                  <span className="text-xs">File Explorer</span>
                </div>

                <div className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-gray-700/50 border border-gray-500/30 flex items-center justify-center text-gray-200">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <span className="text-xs">Terminal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Start Menu Footer User Profile */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                WS
              </div>
              <div>
                <span className="text-xs font-semibold">Windows User</span>
                <p className="text-[10px] text-gray-400">Desktop Workstation</p>
              </div>
            </div>

            <button 
              onClick={() => setIsStartOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* System Tray Flyout */}
      {isTrayOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-14 right-4 w-72 bg-[#1d2028]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 p-4 animate-flyout text-white"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: settings.accentColor }}
              >
                <Layers className="w-3 h-3" />
              </div>
              <span className="text-xs font-bold">Wallpaper Selector Tray</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Running</span>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active Background:</span>
              <span className="font-semibold text-blue-300">Slot {activeSlot.slotNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Fit Mode:</span>
              <span className="font-mono uppercase text-gray-200">{activeSlot.fitMode}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 space-y-1.5">
            <button
              onClick={() => {
                onOpenQuickFlyout();
                setIsTrayOpen(false);
              }}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold text-center transition cursor-pointer"
            >
              Open Picker (Win+Alt+W)
            </button>
            <button
              onClick={() => {
                setIsAppWindowOpen(true);
                setIsTrayOpen(false);
              }}
              className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium text-center transition cursor-pointer"
            >
              Open Main Window
            </button>
          </div>
        </div>
      )}

      {/* Windows 11 Centered Taskbar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 h-12 bg-[#12141a]/85 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-4 z-40"
      >
        {/* Left widget placeholder */}
        <div className="flex items-center gap-2 text-xs text-gray-300 hover:bg-white/5 px-2.5 py-1 rounded-lg transition cursor-pointer">
          <span className="text-amber-300">⛅ 72°F</span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">Partly Cloudy</span>
        </div>

        {/* Center: Windows 11 Taskbar App Icons */}
        <div className="flex items-center gap-1.5">
          {/* Start Menu Button */}
          <button
            onClick={() => {
              setIsStartOpen(!isStartOpen);
              setIsTrayOpen(false);
              soundService.playClick();
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              isStartOpen ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            title="Start"
          >
            {/* Windows 11 Logo */}
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-[#00adef] rounded-[1px]" />
              <div className="bg-[#00adef] rounded-[1px]" />
              <div className="bg-[#00adef] rounded-[1px]" />
              <div className="bg-[#00adef] rounded-[1px]" />
            </div>
          </button>

          {/* Search Button */}
          <button 
            onClick={() => setIsStartOpen(true)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white/10 transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Task View */}
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white/10 transition cursor-pointer">
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Wallpaper Selector App Icon (Running) */}
          <button
            onClick={() => {
              setIsAppWindowOpen(!isAppWindowOpen);
              soundService.playClick();
            }}
            className={`relative w-10 h-10 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              isAppWindowOpen ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            title="Wallpaper Selector (Active)"
          >
            <div 
              className="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Layers className="w-3.5 h-3.5" />
            </div>
            {/* Windows 11 Running App Indicator Pill */}
            <span 
              className="absolute bottom-1 w-2 h-0.5 rounded-full"
              style={{ backgroundColor: settings.accentColor }}
            />
          </button>

          {/* Edge Browser Icon */}
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-400 hover:bg-white/10 transition cursor-pointer">
            <Compass className="w-5 h-5" />
          </button>

          {/* File Explorer Icon */}
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-amber-400 hover:bg-white/10 transition cursor-pointer">
            <Folder className="w-5 h-5" />
          </button>
        </div>

        {/* Right: System Tray & Clock */}
        <div className="flex items-center gap-2 text-gray-300">
          {/* Chevron overflow */}
          <button className="p-1.5 rounded hover:bg-white/10 transition">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* System Tray Icon: Wallpaper Selector */}
          <button
            onClick={() => {
              setIsTrayOpen(!isTrayOpen);
              setIsStartOpen(false);
              soundService.playClick();
            }}
            className={`w-7 h-7 rounded flex items-center justify-center transition cursor-pointer ${
              isTrayOpen ? 'bg-blue-600 text-white' : 'hover:bg-white/10'
            }`}
            title="Wallpaper Selector System Tray"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </button>

          {/* Quick System Icons Pill */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <Wifi className="w-3.5 h-3.5" />
            <Volume2 className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5" />
          </div>

          {/* Clock & Date */}
          <div className="text-right px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <div className="text-[11px] font-semibold leading-none">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-[9px] text-gray-400 leading-none mt-1">
              {currentTime.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
