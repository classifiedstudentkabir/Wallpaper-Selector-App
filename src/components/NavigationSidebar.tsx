import React from 'react';
import { 
  Home, 
  Monitor, 
  Image as ImageIcon, 
  Clock, 
  Keyboard, 
  CheckCircle2, 
  Code2, 
  Settings as SettingsIcon, 
  Info,
  Menu,
  ChevronRight
} from 'lucide-react';
import { AppSettings } from '../types/wallpaper';

export type NavPage = 
  | 'home' 
  | 'desktop' 
  | 'library' 
  | 'autorotate' 
  | 'hotkeys' 
  | 'diagnostics' 
  | 'architecture' 
  | 'settings' 
  | 'about';

interface NavigationSidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  settings: AppSettings;
  activeSlotCount: number;
  autoRotateActive: boolean;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentPage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  settings,
  activeSlotCount,
  autoRotateActive,
}) => {
  const navItems = [
    { id: 'home', label: 'Home (6 Slots)', icon: Home, badge: `${activeSlotCount}/6` },
    { id: 'desktop', label: 'Live Desktop Simulator', icon: Monitor, isNew: true },
    { id: 'library', label: 'Wallpaper Library & Presets', icon: ImageIcon },
    { id: 'autorotate', label: 'Auto-Rotate Scheduler', icon: Clock, activeDot: autoRotateActive },
    { id: 'hotkeys', label: 'Global Hotkeys', icon: Keyboard, badge: 'Win+Alt+W' },
    { id: 'diagnostics', label: 'Edge Tests & Diagnostics', icon: CheckCircle2 },
    { id: 'architecture', label: 'C# WinUI 3 Architecture', icon: Code2 },
  ];

  const footerNavItems = [
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'about', label: 'About & Handoff', icon: Info },
  ];

  return (
    <aside 
      className={`h-[calc(100vh-2.5rem)] bg-[#14161b]/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col justify-between transition-all duration-200 z-40 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Menu / Navigation List */}
      <div className="p-2 space-y-1">
        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition text-xs font-medium cursor-pointer"
          title={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
        >
          <Menu className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">Wallpaper Selector</span>}
        </button>

        <div className="pt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as NavPage)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer relative group ${
                  isSelected
                    ? 'text-white font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${settings.accentColor}26`,
                        borderLeft: `3px solid ${settings.accentColor}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={isSelected ? { color: settings.accentColor } : undefined}
                  />
                  {!isCollapsed && (
                    <span className="truncate text-left">{item.label}</span>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {item.activeDot && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                    {item.isNew && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                        Live
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#20232a] text-white text-xs rounded-md shadow-lg border border-white/10 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Items (Settings & About) */}
      <div className="p-2 border-t border-white/[0.08] space-y-1">
        {footerNavItems.map((item) => {
          const Icon = item.icon;
          const isSelected = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as NavPage)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer relative group ${
                isSelected
                  ? 'text-white font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: `${settings.accentColor}26`,
                      borderLeft: `3px solid ${settings.accentColor}`,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={isSelected ? { color: settings.accentColor } : undefined}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && isSelected && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              )}

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#20232a] text-white text-xs rounded-md shadow-lg border border-white/10 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
