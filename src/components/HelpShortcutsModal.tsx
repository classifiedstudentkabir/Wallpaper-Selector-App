import React from 'react';
import { X, Keyboard, MousePointer, HelpCircle } from 'lucide-react';

interface HelpShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpShortcutsModal: React.FC<HelpShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Win + Alt + W', action: 'Open Quick Wallpaper Switcher HUD Flyout anywhere' },
    { key: '1, 2, 3, 4, 5, 6', action: 'Quickly select slot number when Flyout is open' },
    { key: 'Win + Alt + Right', action: 'Instantly advance to the Next Wallpaper Slot' },
    { key: 'Win + Alt + Left', action: 'Instantly cycle back to the Previous Wallpaper Slot' },
    { key: 'Escape', action: 'Close any active modal, popover, or flyout HUD' },
    { key: 'Alt + W', action: 'Web browser fallback shortcut for Flyout HUD' },
  ];

  const mouseTips = [
    { title: 'Drag & Drop Reordering', desc: 'Click and drag any slot card to rearrange the 1 to 6 sequence smoothly.' },
    { title: 'Live Desktop Simulator', desc: 'Click "Live Desktop" in the sidebar or title bar to experience a full interactive Windows 11 desktop.' },
    { title: 'Desktop Right-Click', desc: 'Inside Live Desktop mode, right-click anywhere to access the desktop background context menu.' },
    { title: 'Auto-Rotation Engine', desc: 'Enable automated rotation with configurable intervals and daytime vs nighttime dynamic switching.' },
    { title: 'One-Time Welcome Celebration', desc: 'The confetti burst and side-panel notice greet you only on your very first wallpaper change. Afterwards every switch applies silently — replay it any time from Settings.' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none transition-all"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#1c1f28] border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-flyout text-white"
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#14161d]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Shortcuts & Gestures Guide</h3>
              <p className="text-xs text-gray-400">Master fast wallpaper switching on Windows 10 & 11</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <Keyboard className="w-4 h-4" />
              <span>Keyboard Shortcuts</span>
            </div>

            <div className="divide-y divide-white/[0.06] bg-black/40 rounded-xl p-3 border border-white/10">
              {shortcuts.map((s, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between gap-4 text-xs">
                  <span className="text-gray-300">{s.action}</span>
                  <kbd className="px-2.5 py-1 rounded bg-white/10 text-blue-300 font-mono font-bold text-[11px] shrink-0">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Mouse & UI Tips */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <MousePointer className="w-4 h-4" />
              <span>Mouse & Interaction Features</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mouseTips.map((tip, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <h5 className="text-xs font-semibold text-gray-200">{tip.title}</h5>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-[#14161d] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
