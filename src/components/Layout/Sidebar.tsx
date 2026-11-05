/**
 * Sidebar Component
 * Mechanical HUD navigation sidebar with 14 pages, crimson glowing border on active item,
 * and bottom telemetry status module.
 */

import React from 'react';
import {
  ShieldAlert,
  Brain,
  Database,
  CheckSquare,
  Calendar,
  Search,
  FileText,
  Grid,
  Bell,
  Sliders,
  Wifi,
  Terminal,
  Cpu,
  Settings,
  Flame,
  Box,
  Sparkles,
} from 'lucide-react';
import { NavigationPageId } from '../../types/index.ts';

interface SidebarProps {
  activePage: NavigationPageId;
  onNavigate: (page: NavigationPageId) => void;
  badgeCounts?: {
    tasks?: number;
    notifications?: number;
    memory?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  badgeCounts,
}) => {
  const navItems: { id: NavigationPageId; label: string; icon: any; badge?: number }[] = [
    { id: 'command_center', label: 'COMMAND MATRIX', icon: Flame },
    { id: 'glb_studio', label: '3D GLB STUDIO', icon: Box },
    { id: 'galaxy_view', label: 'ULTRON GALAXY', icon: Sparkles },
    { id: 'intelligence', label: 'INTELLIGENCE & GESTURES', icon: Brain },
    { id: 'system_control', label: 'SYSTEM CONTROL', icon: Sliders },
    { id: 'settings', label: 'SETTINGS & HUD (⚙)', icon: Settings },
  ];

  return (
    <aside className="w-56 lg:w-64 bg-[#07080c]/85 backdrop-blur-md border-r border-zinc-800/80 flex flex-col justify-between select-none font-mono shrink-0 h-full z-20">
      {/* Navigation list */}
      <div className="flex-1 py-3 px-2 overflow-y-auto custom-scrollbar space-y-1">
        <div className="px-2.5 pb-2 text-[9px] font-bold text-zinc-300 tracking-widest uppercase flex items-center justify-between">
          <span>CORE NAVIGATION</span>
          <span className="text-red-500 font-bold">5 NODES</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-3 py-2 rounded-xs flex items-center justify-between text-xs tracking-wider transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-red-950/40 border-l-3 border-red-500 text-zinc-100 font-bold shadow-[inset_0_0_12px_rgba(220,38,38,0.25)]'
                  : 'border-l-3 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              {/* Active glow indicator */}
              {isActive && (
                <span className="absolute right-0 top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_8px_#ef4444]" />
              )}

              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span className="truncate text-[11px] uppercase">{item.label}</span>
              </div>

              {/* Optional Notification or Count Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-xs font-bold ${
                    isActive
                      ? 'bg-red-600 text-white shadow-[0_0_6px_#ef4444]'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Card */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#0a0b10] m-2 rounded-xs border">
        <div className="flex items-center gap-2 mb-1.5">
          <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-200 tracking-wider">
            SOVEREIGN CORE
          </span>
        </div>
        <p className="text-[9px] text-zinc-400 leading-tight">
          Airgap restricted • Autonomous execution mode active.
        </p>
        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-zinc-800 text-[9px] text-zinc-400">
          <span>THREAT: <strong className="text-emerald-400">LOW</strong></span>
          <span className="text-red-400 font-bold">● VIGILANT</span>
        </div>
      </div>
    </aside>
  );
};
