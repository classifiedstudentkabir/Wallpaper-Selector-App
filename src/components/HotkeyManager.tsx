import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  RotateCcw, 
  Sparkles, 
  Check, 
  KeyRound, 
  Code 
} from 'lucide-react';
import { HotkeyConfig } from '../types/wallpaper';
import { DEFAULT_HOTKEYS } from '../constants/defaultWallpapers';
import { soundService } from '../services/soundService';

interface HotkeyManagerProps {
  hotkeys: HotkeyConfig;
  onUpdateHotkeys: (newHotkeys: HotkeyConfig) => void;
  onTestTriggerFlyout: () => void;
}

export const HotkeyManager: React.FC<HotkeyManagerProps> = ({
  hotkeys,
  onUpdateHotkeys,
  onTestTriggerFlyout,
}) => {
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [lastDetectedAction, setLastDetectedAction] = useState<string | null>(null);

  // Live Key Event Monitor for real-time demonstration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys: string[] = [];
      if (e.metaKey || e.key === 'Meta') keys.push('Win');
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      
      const standardKey = e.key.toUpperCase();
      if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(standardKey)) {
        keys.push(standardKey);
      }

      setPressedKeys(keys);

      // Check if matches Win+Alt+W
      if ((e.altKey && e.key.toLowerCase() === 'w') || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'w')) {
        e.preventDefault();
        setLastDetectedAction('Triggered Quick Switcher Flyout!');
        onTestTriggerFlyout();
      }
    };

    const handleKeyUp = () => {
      setTimeout(() => setPressedKeys([]), 400);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onTestTriggerFlyout]);

  const resetHotkeys = () => {
    onUpdateHotkeys({ ...DEFAULT_HOTKEYS });
    soundService.playClick();
  };

  const hotkeyList = [
    { key: 'openPicker', label: 'Open Quick Switcher HUD Flyout', shortcut: hotkeys.openPicker, desc: 'Pops up the floating 6-slot switcher overlay' },
    { key: 'nextSlot', label: 'Cycle Next Wallpaper', shortcut: hotkeys.nextSlot, desc: 'Switches to the next sequential wallpaper' },
    { key: 'prevSlot', label: 'Cycle Previous Wallpaper', shortcut: hotkeys.prevSlot, desc: 'Switches to the previous wallpaper' },
    { key: 'slot1', label: 'Direct Apply Slot 1', shortcut: hotkeys.slot1, desc: 'Instantly applies Slot 1 as desktop background' },
    { key: 'slot2', label: 'Direct Apply Slot 2', shortcut: hotkeys.slot2, desc: 'Instantly applies Slot 2 as desktop background' },
    { key: 'slot3', label: 'Direct Apply Slot 3', shortcut: hotkeys.slot3, desc: 'Instantly applies Slot 3 as desktop background' },
    { key: 'slot4', label: 'Direct Apply Slot 4', shortcut: hotkeys.slot4, desc: 'Instantly applies Slot 4 as desktop background' },
    { key: 'slot5', label: 'Direct Apply Slot 5', shortcut: hotkeys.slot5, desc: 'Instantly applies Slot 5 as desktop background' },
    { key: 'slot6', label: 'Direct Apply Slot 6', shortcut: hotkeys.slot6, desc: 'Instantly applies Slot 6 as desktop background' },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#14161f] border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Global Keyboard Shortcuts</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Hooks
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Switch desktop wallpapers instantly from any game or app without opening the window
            </p>
          </div>
        </div>

        <button
          onClick={onTestTriggerFlyout}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          <span>Test Trigger Picker HUD</span>
        </button>
      </div>

      {/* Live Key Detection Test Sandbox */}
      <div className="p-5 rounded-2xl bg-[#181b22] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-gray-200">Live Keyboard Event Tester</h4>
          </div>
          <span className="text-[11px] text-gray-400">Press any key combination right now</span>
        </div>

        <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pressedKeys.length > 0 ? (
              pressedKeys.map((k, idx) => (
                <kbd key={idx} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-mono text-sm font-bold shadow-md animate-bounce">
                  {k}
                </kbd>
              ))
            ) : (
              <span className="text-xs text-gray-500 italic">Waiting for key press (e.g. Press Alt + W)...</span>
            )}
          </div>

          {lastDetectedAction && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {lastDetectedAction}
            </span>
          )}
        </div>
      </div>

      {/* Hotkeys Configuration List */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-200">Registered Hotkey Bindings</h4>
          <button
            onClick={resetHotkeys}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {hotkeyList.map((item) => (
            <div key={item.key} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-gray-200">{item.label}</span>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
              </div>

              <div className="flex items-center gap-2">
                <kbd className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-blue-300 font-mono text-xs font-bold shadow-inner">
                  {item.shortcut}
                </kbd>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WinUI 3 Implementation Note */}
      <div className="p-5 rounded-2xl bg-[#16181f] border border-white/[0.08] space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
          <Code className="w-4 h-4 text-blue-400" />
          <span>WinUI 3 Native C# Hook Implementation:</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          The Windows desktop application uses Win32 <code className="text-blue-300 font-mono">RegisterHotKey</code> with <code className="text-blue-300 font-mono">MOD_WIN | MOD_ALT</code> and window message pump <code className="text-blue-300 font-mono">WM_HOTKEY (0x0312)</code> in <code className="text-blue-300 font-mono">HotkeyService.cs</code> to ensure system-wide low latency response even when minimized to the system tray.
        </p>
      </div>
    </div>
  );
};
