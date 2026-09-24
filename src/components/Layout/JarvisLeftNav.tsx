/**
 * JarvisLeftNav Component
 *
 * Clean vertical navigation matching the reference desktop AI interface:
 * - Home
 * - Chat
 * - Voice
 * - Tasks
 * - Memory
 * - Tools
 * - Notifications (with dynamic unread badge)
 * - Settings
 *
 * Visual style:
 * - Dark futuristic glassmorphism
 * - Cyan/blue neon accents
 * - Smooth hover and active gradient states
 */

import React from 'react';
import {
  Home,
  MessageSquare,
  Mic,
  CheckSquare,
  Database,
  Wrench,
  Bell,
  Settings,
  Youtube,
} from 'lucide-react';
import { NavigationPageId } from '../../types/index.ts';
import { soundFx } from '../../utils/audioEffects.ts';

interface JarvisLeftNavProps {
  activePage: NavigationPageId;
  onNavigate: (page: NavigationPageId) => void;
  unreadCount?: number;
}

interface NavItemConfig {
  id: NavigationPageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'command_center', label: 'Home', icon: Home },
  { id: 'youtube_media', label: 'YouTube', icon: Youtube },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const JarvisLeftNav: React.FC<JarvisLeftNavProps> = ({
  activePage,
  onNavigate,
  unreadCount = 0,
}) => {
  return (
    <aside className="w-48 xl:w-52 h-full flex flex-col justify-between shrink-0 select-none z-20">
      <div className="w-full h-full p-2.5 rounded-2xl bg-[#091122]/85 backdrop-blur-xl border border-blue-500/20 shadow-[0_0_25px_rgba(0,140,255,0.08)] flex flex-col justify-between">
        {/* Navigation list */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  soundFx.playClick();
                  onNavigate(item.id);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-sm font-sans font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_18px_rgba(0,140,255,0.45)] font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {/* Notifications badge */}
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : 'bg-red-500 text-white animate-pulse'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Minimalist System Footer Badge */}
        <div className="p-3 rounded-xl bg-[#060b18]/80 border border-blue-900/40 text-[11px] font-sans text-slate-400 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400 font-bold">JARVIS OS</span>
            <span className="text-[10px] text-emerald-400">v5.0 SECURE</span>
          </div>
          <span className="text-[10px] text-slate-500">Autonomous Neural Core</span>
        </div>
      </div>
    </aside>
  );
};
