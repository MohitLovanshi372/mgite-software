/**
 * JarvisLeftNav Component (Golden Space Theme)
 *
 * Minimal collapsible navigation with icons:
 * - Home (Core)
 * - YouTube
 * - Chat
 * - Voice
 * - Tasks
 * - Memory
 * - Tools
 * - Notifications
 * - Settings
 *
 * Features:
 * - Toggleable between collapsed (icon rail, w-14) and expanded (w-48)
 * - Premium golden holographic active indicators
 * - Minimal glassmorphism
 */

import React, { useState } from 'react';
import {
  Home,
  MessageSquare,
  Mic,
  CheckSquare,
  Calendar,
  Database,
  Wrench,
  Bell,
  Settings,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Box,
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
  { id: 'command_center', label: 'AI Core', icon: Home },
  { id: 'youtube_media', label: 'YouTube', icon: Youtube },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Reminders', icon: Calendar },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'glb_studio', label: '3D Studio', icon: Box },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const JarvisLeftNav: React.FC<JarvisLeftNavProps> = ({
  activePage,
  onNavigate,
  unreadCount = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <aside
      className={`h-full flex flex-col justify-between shrink-0 select-none z-20 transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-44 xl:w-48'
      }`}
    >
      <div className="w-full h-full p-2 rounded-2xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.05)] flex flex-col justify-between overflow-hidden">
        {/* Navigation items */}
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
                title={isCollapsed ? item.label : undefined}
                className={`w-full py-2.5 rounded-xl flex items-center transition-all duration-200 cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37]/25 to-[#FFD76A]/10 text-[#FFD76A] border-l-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] font-medium'
                    : 'text-slate-400 hover:text-[#E8EAF0] hover:bg-[#D4AF37]/5 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors shrink-0 ${
                      isActive ? 'text-[#FFD76A]' : 'text-slate-400 group-hover:text-[#D4AF37]'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-xs font-sans whitespace-nowrap tracking-wide">{item.label}</span>
                  )}
                </div>

                {/* Notifications badge */}
                {item.id === 'notifications' && unreadCount > 0 && !isCollapsed && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#D4AF37] text-[#030712]">
                    {unreadCount}
                  </span>
                )}
                {item.id === 'notifications' && unreadCount > 0 && isCollapsed && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FFD76A]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Collapse Toggle */}
        <div className="pt-2 border-t border-[#D4AF37]/15">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsCollapsed((prev) => !prev);
            }}
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="w-full py-2 flex items-center justify-center text-slate-500 hover:text-[#FFD76A] hover:bg-[#D4AF37]/5 rounded-lg transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-sans">COLLAPSE</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
