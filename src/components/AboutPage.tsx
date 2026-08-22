import React from 'react';
import { 
  Info, 
  GitBranch, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck 
} from 'lucide-react';
import { AppSettings } from '../types/wallpaper';

interface AboutPageProps {
  settings: AppSettings;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings }) => {
  const repoUrl = 'https://github.com/classifiedstudentkabir/Wallpaper-Selector-App.git';

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top App Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#181b22] to-[#14161f] border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Layers className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Wallpaper Selector</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v1.2.0 (WinUI 3)
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              A lightweight, customizable Wallpaper Selector desktop application designed specifically for Windows 10 & 11.
            </p>
          </div>
        </div>

        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg cursor-pointer shrink-0"
        >
          <GitBranch className="w-4 h-4" />
          <span>View on GitHub</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Project Handoff Summary */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Info className="w-5 h-5" />
          <h3 className="text-sm font-bold text-gray-200">Project Handoff Specification</h3>
        </div>

        <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="font-bold text-white">What this project is:</span>
            <p className="text-gray-400">
              A lightweight, customizable Wallpaper Selector desktop application designed specifically for Windows 10 and Windows 11.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="font-bold text-white">What we are trying to build:</span>
            <p className="text-gray-400">
              A convenient and fast utility that allows users to manage a curated set of up to 6 wallpapers in "slots," enabling them to quickly switch their desktop background on the fly (via global hotkeys like <code className="text-blue-300 font-mono">Win + Alt + W</code> or direct slot keys).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <span className="font-bold text-white">Main Features Implemented:</span>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Core WinUI 3 application shell with custom Mica TitleBar & NavigationView</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>6-Slot grid dashboard with active indicators & drag-and-drop reordering</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>State persistence, local storage handling & thumbnail caching</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>MVVM architecture (MainViewModel, RelayCommands, ObservableCollection)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Desktop background application (Win32 SystemParametersInfo & COM)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Win + Alt + W Quick Switcher Flyout HUD & global hotkey hook</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Interactive Live Windows 11 Desktop simulator with taskbar & tray</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Automated diagnostic test runner validating edge cases & corrupted JSON</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>One-time welcome celebration (confetti + side panel) on first apply, silent forever after</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tech Stack Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#181b22] border border-white/10">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
            <Cpu className="w-4 h-4" />
            <span>Framework & SDK</span>
          </div>
          <p className="text-xs font-semibold text-white mt-1">.NET 8.0 (C# 12)</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Windows App SDK 1.5 (WinUI 3)</p>
        </div>

        <div className="p-4 rounded-xl bg-[#181b22] border border-white/10">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Layers className="w-4 h-4" />
            <span>Architecture</span>
          </div>
          <p className="text-xs font-semibold text-white mt-1">MVVM Pattern</p>
          <p className="text-[11px] text-gray-400 mt-0.5">CommunityToolkit.Mvvm 8.2</p>
        </div>

        <div className="p-4 rounded-xl bg-[#181b22] border border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Support</span>
          </div>
          <p className="text-xs font-semibold text-white mt-1">Windows 11 & 10</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Build 17763 or newer (x64 / ARM64)</p>
        </div>
      </div>

      {/* Repository & Branch Link Box */}
      <div className="p-5 rounded-2xl bg-[#14161d] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-gray-200">Official Git Repository:</span>
          </div>
          <p className="font-mono text-gray-400 text-[11px]">{repoUrl}</p>
        </div>

        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <span>Clone & Build</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
