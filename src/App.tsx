import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { TitleBar } from './components/TitleBar';
import { NavigationSidebar, NavPage } from './components/NavigationSidebar';
import { SlotGrid } from './components/SlotGrid';
import { LiveDesktopSimulator } from './components/LiveDesktopSimulator';
import { QuickSwitcherFlyout } from './components/QuickSwitcherFlyout';
import { ImageEditorModal } from './components/ImageEditorModal';
import { WallpaperLibraryModal } from './components/WallpaperLibraryModal';
import { AutoRotateScheduler } from './components/AutoRotateScheduler';
import { HotkeyManager } from './components/HotkeyManager';
import { UnitTestsRunner } from './components/UnitTestsRunner';
import { CodeArchitectureViewer } from './components/CodeArchitectureViewer';
import { SettingsPage } from './components/SettingsPage';
import { AboutPage } from './components/AboutPage';
import { HelpShortcutsModal } from './components/HelpShortcutsModal';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { WallpaperSlot, AppSettings, HotkeyConfig, AutoRotateConfig, PresetPack, FitMode } from './types/wallpaper';
import { StorageService } from './services/storageService';
import { soundService } from './services/soundService';

export default function App() {
  // State management (MVVM Simulation)
  const [slots, setSlots] = useState<WallpaperSlot[]>(() => StorageService.loadSlots());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.loadSettings());
  const [hotkeys, setHotkeys] = useState<HotkeyConfig>(() => StorageService.loadHotkeys());
  const [autoRotate, setAutoRotate] = useState<AutoRotateConfig>(() => StorageService.loadAutoRotate());

  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDesktopMode, setIsDesktopMode] = useState(false);

  // Modals & Flyouts
  const [isQuickFlyoutOpen, setIsQuickFlyoutOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<WallpaperSlot | null>(null);
  const [libraryTargetSlot, setLibraryTargetSlot] = useState<number | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync sound setting
  useEffect(() => {
    soundService.enabled = settings.soundEffects;
  }, [settings.soundEffects]);

  // Persistent storage updates
  useEffect(() => {
    StorageService.saveSlots(slots);
  }, [slots]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    StorageService.saveHotkeys(hotkeys);
  }, [hotkeys]);

  useEffect(() => {
    StorageService.saveAutoRotate(autoRotate);
  }, [autoRotate]);

  const addToast = useCallback((type: 'success' | 'warning' | 'info', title: string, description: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      description,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Active Slot getter
  const activeSlot = slots.find((s) => s.isActive) || slots[0];

  // Apply a slot as the active desktop background
  // ── First-run welcome celebration ───────────────────────────────────────────
  // A brand-new user gets ONE party burst + side-panel notification on their
  // very first wallpaper change. Every change after that applies silently, so
  // the effect never becomes noise during normal daily use.
  const [celebrationShown, setCelebrationShown] = useState<boolean>(() =>
    StorageService.hasSeenCelebration()
  );

  // Refs keep the hotkey/cycle callbacks from reading stale values.
  const celebrationRef = useRef(celebrationShown);
  const settingsRef = useRef(settings);

  useEffect(() => {
    celebrationRef.current = celebrationShown;
  }, [celebrationShown]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  /** The full "party" moment — only ever reached once per user (or on replay). */
  const playCelebration = useCallback(
    (title: string, description: string) => {
      const palette = ['#0078d4', '#60cdff', '#9bd4ff', '#ffffff'];

      try {
        confetti({
          particleCount: 130,
          spread: 88,
          startVelocity: 44,
          origin: { y: 0.82 },
          scalar: 1.05,
          colors: palette,
        });

        // Two angled side bursts a beat later for a proper celebration feel.
        window.setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 62,
            startVelocity: 54,
            origin: { x: 0, y: 0.74 },
            colors: palette,
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 62,
            startVelocity: 54,
            origin: { x: 1, y: 0.74 },
            colors: palette,
          });
        }, 180);
      } catch {
        // Confetti is purely decorative — never block a wallpaper apply.
      }

      addToast('success', title, description);
    },
    [addToast]
  );

  const handleApplySlot = useCallback((targetSlot: WallpaperSlot) => {
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        isActive: s.id === targetSlot.id,
      }))
    );

    soundService.playApply();

    // One-time welcome only. After it has been shown once it is remembered in
    // local storage and every subsequent apply is completely silent.
    if (settingsRef.current.celebrationEnabled && !celebrationRef.current) {
      celebrationRef.current = true; // guard against double-fire
      setCelebrationShown(true);
      StorageService.setCelebrationSeen(true);

      playCelebration(
        `Welcome aboard! Wallpaper applied — Slot ${targetSlot.slotNumber}`,
        `"${targetSlot.title}" is now your desktop background. This celebration plays just once — from here on, changes apply silently.`
      );
    }
  }, [playCelebration]);

  // Next Slot
  const handleNextSlot = useCallback(() => {
    const currentIndex = slots.findIndex((s) => s.isActive);
    const nextIndex = (currentIndex + 1) % slots.length;
    handleApplySlot(slots[nextIndex]);
  }, [slots, handleApplySlot]);

  // Previous Slot
  const handlePrevSlot = useCallback(() => {
    const currentIndex = slots.findIndex((s) => s.isActive);
    const prevIndex = (currentIndex - 1 + slots.length) % slots.length;
    handleApplySlot(slots[prevIndex]);
  }, [slots, handleApplySlot]);

  // Global Keyboard Hook Listener (Win + Alt + W, Alt + W, Win + Alt + 1..6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Win+Alt+W or Alt+W -> Quick Switcher Flyout
      if ((e.altKey && e.key.toLowerCase() === 'w') || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'w')) {
        e.preventDefault();
        setIsQuickFlyoutOpen((prev) => !prev);
        return;
      }

      // Win+Alt+Right or Alt+Right -> Next Slot
      if ((e.altKey && e.key === 'ArrowRight') || (e.ctrlKey && e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        handleNextSlot();
        return;
      }

      // Win+Alt+Left or Alt+Left -> Prev Slot
      if ((e.altKey && e.key === 'ArrowLeft') || (e.ctrlKey && e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        handlePrevSlot();
        return;
      }

      // Win+Alt+[1-6] or Alt+[1-6]
      if (e.altKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const slotNum = parseInt(e.key, 10);
        const slot = slots.find((s) => s.slotNumber === slotNum);
        if (slot) {
          e.preventDefault();
          handleApplySlot(slot);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slots, handleApplySlot, handleNextSlot, handlePrevSlot]);

  // Reorder slots
  const handleReorderSlots = (newSlots: WallpaperSlot[]) => {
    setSlots(newSlots);
    addToast('info', 'Slots Reordered', 'Wallpaper slots 1 through 6 updated successfully.');
  };

  // Shuffle slots
  const handleShuffleSlots = () => {
    const shuffled = [...slots].sort(() => Math.random() - 0.5);
    const updated = shuffled.map((s, i) => ({ ...s, slotNumber: i + 1 }));
    setSlots(updated);
    addToast('info', 'Slots Shuffled', 'Randomized position of all 6 wallpaper slots.');
  };

  // Clear slot
  const handleClearSlot = (slot: WallpaperSlot) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? {
              ...s,
              title: `Empty Slot ${s.slotNumber}`,
              url: '',
              thumbnailUrl: '',
              resolution: undefined,
              fileSize: undefined,
              category: undefined,
              author: undefined,
              isActive: false,
            }
          : s
      )
    );
    addToast('info', `Slot ${slot.slotNumber} Cleared`, 'Slot is now empty.');
  };

  // Load Preset Pack
  const handleLoadPresetPack = (pack: PresetPack) => {
    const updatedSlots: WallpaperSlot[] = pack.wallpapers.slice(0, 6).map((w, index) => ({
      ...w,
      id: `slot-${index + 1}-${pack.id}`,
      slotNumber: index + 1,
      addedAt: Date.now(),
      isActive: index === 0, // slot 1 active
    }));

    setSlots(updatedSlots);
    addToast('success', `Loaded Pack: ${pack.name}`, `Assigned 6 wallpapers from ${pack.category} preset pack.`);
  };

  // Assign Wallpaper from Library/Upload
  const handleAssignWallpaper = (slotNumber: number, wallpaperData: Partial<WallpaperSlot>) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.slotNumber === slotNumber
          ? {
              ...s,
              ...wallpaperData,
              id: `slot-${slotNumber}-${Date.now()}`,
              slotNumber,
              isDeletedSource: false,
            }
          : s
      )
    );
    addToast('success', `Assigned to Slot ${slotNumber}`, `Wallpaper updated: ${wallpaperData.title || 'New Image'}`);
  };

  // Update Slot Fit Mode
  const handleUpdateSlotFit = (slotId: string, fitMode: FitMode) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, fitMode } : s))
    );
    addToast('info', 'Display Fit Updated', `Fit mode changed to ${fitMode.toUpperCase()}`);
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallpaper-selector-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundService.playSuccess();
    addToast('success', 'Backup Exported', 'Configuration JSON downloaded.');
  };

  // Import JSON backup
  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = StorageService.importFullBackup(content);
      if (result.success) {
        setSlots(StorageService.loadSlots());
        setSettings(StorageService.loadSettings());
        setHotkeys(StorageService.loadHotkeys());
        setAutoRotate(StorageService.loadAutoRotate());
        soundService.playSuccess();
        addToast('success', 'Backup Restored', result.message);
      } else {
        addToast('warning', 'Import Failed', result.message);
      }
    };
    reader.readAsText(file);
  };

  // Reset all to defaults
  const handleResetAllData = () => {
    StorageService.clearAllData();
    setSlots(StorageService.loadSlots());
    setSettings(StorageService.loadSettings());
    setHotkeys(StorageService.loadHotkeys());
    setAutoRotate(StorageService.loadAutoRotate());

    // A full reset means a fresh install experience → welcome plays once again.
    celebrationRef.current = false;
    setCelebrationShown(false);

    addToast('info', 'Reset Complete', 'Restored default slots and application preferences.');
  };

  // Simulate missing source file (Edge case test)
  const handleSimulateDeletedFile = () => {
    setSlots((prev) =>
      prev.map((s, idx) => (idx === 1 ? { ...s, isDeletedSource: true } : s))
    );
    addToast('warning', 'Edge Case Injected', 'Slot 2 source file marked as deleted/missing on disk.');
  };

  // Preview the welcome party on demand (Settings → First-Run Celebration).
  const handleReplayCelebration = () => {
    const slot = slots.find((s) => s.isActive) || slots[0];
    soundService.playApply();
    playCelebration(
      'Wallpaper Selector — celebration preview',
      `This is the one-time welcome animation. Currently active: Slot ${slot.slotNumber} · ${slot.title}.`
    );
  };

  // Re-arm so the welcome moment plays once more on the very next change.
  const handleReArmCelebration = () => {
    StorageService.setCelebrationSeen(false);
    celebrationRef.current = false;
    setCelebrationShown(false);
    addToast(
      'info',
      'Welcome celebration re-armed',
      'It will play once on your next wallpaper change, then go quiet again.'
    );
  };

  // Simulate corrupted JSON data (Edge case test)
  const handleSimulateCorruptedData = () => {
    localStorage.setItem('wallpaper_selector_slots_v1', '{ invalid json garbage');
    const recovered = StorageService.loadSlots();
    setSlots(recovered);
    addToast('success', 'Schema Auto-Repaired', 'StorageService successfully caught malformed JSON and healed state!');
  };

  return (
    <div className={`min-h-screen w-full flex flex-col select-none overflow-hidden ${
      settings.theme.includes('light') ? 'bg-[#f3f4f6] text-gray-900' : 'bg-[#0d0f14] text-gray-100'
    }`}>
      {/* Hidden File Input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileSelected}
        accept=".json"
        className="hidden"
      />

      {/* WinUI 3 Custom Mica Title Bar */}
      <TitleBar
        activeSlot={activeSlot}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onOpenQuickFlyout={() => setIsQuickFlyoutOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isDesktopMode={isDesktopMode}
        onToggleDesktopMode={() => {
          setIsDesktopMode(!isDesktopMode);
          soundService.playClick();
        }}
        isMaximized={isMaximized}
        onToggleMaximize={() => setIsMaximized(!isMaximized)}
      />

      {/* Main Workspace Body */}
      {isDesktopMode ? (
        /* Full Live Windows 11 Desktop Simulation */
        <LiveDesktopSimulator
          slots={slots}
          activeSlot={activeSlot}
          settings={settings}
          onApplySlot={handleApplySlot}
          onEditFilters={(slot) => setEditingSlot(slot)}
          onOpenQuickFlyout={() => setIsQuickFlyoutOpen(true)}
          onNextSlot={handleNextSlot}
          onPrevSlot={handlePrevSlot}
          onUpdateSlotFit={handleUpdateSlotFit}
          onOpenAppStudio={() => setIsDesktopMode(false)}
        />
      ) : (
        /* Standard WinUI 3 App Studio View */
        <div className="flex-1 flex overflow-hidden">
          {/* WinUI 3 Navigation View Sidebar */}
          <NavigationSidebar
            currentPage={currentPage}
            onNavigate={(page) => {
              setCurrentPage(page);
              soundService.playClick();
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            settings={settings}
            activeSlotCount={slots.filter((s) => s.url).length}
            autoRotateActive={autoRotate.enabled}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0f1117]/80 backdrop-blur-xl">
            {/* Page 1: Home (6 Wallpaper Slots Dashboard) */}
            {currentPage === 'home' && (
              <SlotGrid
                slots={slots}
                settings={settings}
                onApplySlot={handleApplySlot}
                onEditFilters={(slot) => setEditingSlot(slot)}
                onReplaceImage={(slot) => setLibraryTargetSlot(slot.slotNumber)}
                onClearSlot={handleClearSlot}
                onReorderSlots={handleReorderSlots}
                onLoadPresetPack={handleLoadPresetPack}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onNextSlot={handleNextSlot}
                onPrevSlot={handlePrevSlot}
                onShuffleSlots={handleShuffleSlots}
                onSimulateDeletedFile={handleSimulateDeletedFile}
              />
            )}

            {/* Page 2: Embedded Live Desktop Simulator View */}
            {currentPage === 'desktop' && (
              <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl h-[calc(100vh-6.5rem)]">
                <LiveDesktopSimulator
                  slots={slots}
                  activeSlot={activeSlot}
                  settings={settings}
                  onApplySlot={handleApplySlot}
                  onEditFilters={(slot) => setEditingSlot(slot)}
                  onOpenQuickFlyout={() => setIsQuickFlyoutOpen(true)}
                  onNextSlot={handleNextSlot}
                  onPrevSlot={handlePrevSlot}
                  onUpdateSlotFit={handleUpdateSlotFit}
                  onOpenAppStudio={() => setCurrentPage('home')}
                />
              </div>
            )}

            {/* Page 3: Library & Presets */}
            {currentPage === 'library' && (
              <div className="space-y-4 max-w-5xl">
                <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">4K Wallpaper Catalog & Custom Uploads</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Browse high-resolution packs or upload custom backgrounds to assign directly to any slot (1 to 6).
                    </p>
                  </div>
                  <button
                    onClick={() => setLibraryTargetSlot(1)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-lg"
                  >
                    Open Picker Dialog
                  </button>
                </div>

                <WallpaperLibraryModal
                  isOpen={true}
                  targetSlotNumber={libraryTargetSlot || 1}
                  onClose={() => setCurrentPage('home')}
                  onAssignWallpaper={(slotNum, wp) => {
                    handleAssignWallpaper(slotNum, wp);
                    setCurrentPage('home');
                  }}
                />
              </div>
            )}

            {/* Page 4: Auto-Rotation Scheduler */}
            {currentPage === 'autorotate' && (
              <AutoRotateScheduler
                config={autoRotate}
                slots={slots}
                activeSlot={activeSlot}
                onUpdateConfig={(newConfig) => setAutoRotate(newConfig)}
                onTriggerNext={handleNextSlot}
              />
            )}

            {/* Page 5: Global Hotkeys */}
            {currentPage === 'hotkeys' && (
              <HotkeyManager
                hotkeys={hotkeys}
                onUpdateHotkeys={(newHotkeys) => setHotkeys(newHotkeys)}
                onTestTriggerFlyout={() => setIsQuickFlyoutOpen(true)}
              />
            )}

            {/* Page 6: Diagnostics & Unit Tests */}
            {currentPage === 'diagnostics' && (
              <UnitTestsRunner
                slots={slots}
                settings={settings}
                onSimulateCorruptedData={handleSimulateCorruptedData}
                onSimulateMissingFile={handleSimulateDeletedFile}
              />
            )}

            {/* Page 7: C# WinUI 3 Architecture */}
            {currentPage === 'architecture' && <CodeArchitectureViewer />}

            {/* Page 8: Settings */}
            {currentPage === 'settings' && (
              <SettingsPage
                settings={settings}
                onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
                onResetAllData={handleResetAllData}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onReplayCelebration={handleReplayCelebration}
                onReArmCelebration={handleReArmCelebration}
                celebrationAlreadyShown={celebrationShown}
              />
            )}

            {/* Page 9: About & Handoff */}
            {currentPage === 'about' && <AboutPage settings={settings} />}
          </main>
        </div>
      )}

      {/* Win + Alt + W Floating Quick Switcher Flyout HUD */}
      <QuickSwitcherFlyout
        isOpen={isQuickFlyoutOpen}
        slots={slots}
        settings={settings}
        onClose={() => setIsQuickFlyoutOpen(false)}
        onApplySlot={handleApplySlot}
      />

      {/* Image Filters & Display Mode Editor Modal */}
      {editingSlot && (
        <ImageEditorModal
          slot={editingSlot}
          isOpen={!!editingSlot}
          onClose={() => setEditingSlot(null)}
          onSave={(updated) => {
            setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            addToast('success', 'Filters Applied', `Updated adjustments for Slot ${updated.slotNumber}`);
          }}
        />
      )}

      {/* Standalone Wallpaper Library / Upload Modal */}
      {libraryTargetSlot !== null && currentPage !== 'library' && (
        <WallpaperLibraryModal
          isOpen={libraryTargetSlot !== null}
          targetSlotNumber={libraryTargetSlot}
          onClose={() => setLibraryTargetSlot(null)}
          onAssignWallpaper={(slotNum, wp) => {
            handleAssignWallpaper(slotNum, wp);
            setLibraryTargetSlot(null);
          }}
        />
      )}

      {/* Shortcuts & Help Modal */}
      <HelpShortcutsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Windows 11 Style Toast Banners */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
