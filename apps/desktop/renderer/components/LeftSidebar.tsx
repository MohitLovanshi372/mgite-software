/**
 * JARVIS Left Sidebar Navigation Component
 * Provides 12 core navigation and modal triggers:
 * 1. Command Center
 * 2. Assistant
 * 3. Memory
 * 4. Tasks
 * 5. Calendar
 * 6. Research
 * 7. Documents
 * 8. Apps
 * 9. Notifications
 * 10. Logs
 * 11. Architecture
 * 12. Settings
 */

import React, { useState } from 'react';
import {
  User,
  MessageSquare,
  Database,
  CheckSquare,
  Calendar,
  Globe,
  FileText,
  Grid,
  Bell,
  Terminal,
  Layers,
  Settings,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type SidebarNavId =
  | 'command_center'
  | 'assistant'
  | 'memory'
  | 'tasks'
  | 'calendar'
  | 'research'
  | 'documents'
  | 'apps'
  | 'notifications'
  | 'system_control'
  | 'logs'
  | 'architecture'
  | 'settings';

interface LeftSidebarProps {
  activeId: SidebarNavId;
  onNavigate: (id: SidebarNavId) => void;
  badgeCounts?: {
    tasks?: number;
    notifications?: number;
    memory?: number;
  };
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeId,
  onNavigate,
  badgeCounts = {},
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      id: 'command_center' as SidebarNavId,
      label: 'Command Center',
      icon: User,
      category: 'core',
      hint: 'Central 3D Holographic Stage',
    },
    {
      id: 'assistant' as SidebarNavId,
      label: 'Assistant',
      icon: MessageSquare,
      category: 'core',
      hint: 'Multi-turn Chat Workspace',
    },
    {
      id: 'memory' as SidebarNavId,
      label: 'Memory',
      icon: Database,
      category: 'core',
      badge: badgeCounts.memory,
      hint: 'Local SQLite Long-term Storage',
    },
    {
      id: 'tasks' as SidebarNavId,
      label: 'Tasks',
      icon: CheckSquare,
      category: 'intelligence',
      badge: badgeCounts.tasks,
      hint: 'Autonomous Tasks & Execution',
    },
    {
      id: 'calendar' as SidebarNavId,
      label: 'Calendar',
      icon: Calendar,
      category: 'intelligence',
      hint: 'Upcoming Schedule & Deadlines',
    },
    {
      id: 'research' as SidebarNavId,
      label: 'Research',
      icon: Globe,
      category: 'intelligence',
      hint: 'Deep Web Intelligence & Search',
    },
    {
      id: 'documents' as SidebarNavId,
      label: 'Documents',
      icon: FileText,
      category: 'intelligence',
      hint: 'Indexed Files & Knowledge Base',
    },
    {
      id: 'apps' as SidebarNavId,
      label: 'Apps',
      icon: Grid,
      category: 'system',
      hint: 'Computer Control & Tool Integrations',
    },
    {
      id: 'notifications' as SidebarNavId,
      label: 'Notifications',
      icon: Bell,
      category: 'system',
      badge: badgeCounts.notifications,
      hint: 'Privacy-Shielded Alerts & OTPs',
    },
    {
      id: 'system_control' as SidebarNavId,
      label: 'System Control',
      icon: SlidersHorizontal,
      category: 'system',
      hint: 'Hardware & OS Invariants Control',
    },
    {
      id: 'logs' as SidebarNavId,
      label: 'Logs',
      icon: Terminal,
      category: 'system',
      hint: 'System Invariants & Stream Logs',
    },
    {
      id: 'architecture' as SidebarNavId,
      label: 'Architecture',
      icon: Layers,
      category: 'system',
      hint: 'System Topology & Module Roadmap',
    },
    {
      id: 'settings' as SidebarNavId,
      label: 'Settings',
      icon: Settings,
      category: 'system',
      hint: 'Model, Voice, & Security Preferences',
    },
  ];

  return (
    <aside
      id="jarvis-left-sidebar"
      className={`relative z-20 flex flex-col h-full bg-[#06080e]/95 backdrop-blur-xl border-r border-cyan-500/15 transition-all duration-300 select-none ${
        collapsed ? 'w-14 sm:w-16' : 'w-52 lg:w-56'
      }`}
      aria-label="Navigation Sidebar"
    >
      {/* Sidebar Header Section */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800/80">
        {!collapsed && (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            <span className="font-mono text-[10px] tracking-widest text-cyan-300 font-semibold uppercase truncate">
              NAVIGATION
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors mx-auto cursor-pointer"
          title={collapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onNavigate(item.id)}
              title={`${item.label} — ${item.hint}`}
              className={`relative group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/50 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent hover:border-slate-800'
              }`}
            >
              {/* Active cyan edge indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}

              {/* Icon */}
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                }`}
              />

              {/* Label */}
              {!collapsed && (
                <span className="truncate tracking-wide flex-1 text-left">{item.label}</span>
              )}

              {/* Optional Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Collapsed Tooltip Floating Flyout */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-900 border border-cyan-500/30 text-[11px] font-mono text-cyan-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer telemetry */}
      <div className="p-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
        {!collapsed ? (
          <div className="flex items-center justify-between px-1 text-slate-400">
            <span>SYS CORE</span>
            <span className="text-cyan-400">STABLE</span>
          </div>
        ) : (
          <div className="flex justify-center text-cyan-400 font-bold">•</div>
        )}
      </div>
    </aside>
  );
};
