/**
 * Desktop Window TitleBar Component
 * Provides custom frameless window controls, assistant title, status badge,
 * and quick access to Settings, Memory Inspector, System Logs, and Architecture.
 */

import React from 'react';
import {
  Shield,
  Wifi,
  WifiOff,
  Settings as SettingsIcon,
  Database,
  Terminal,
  Layers,
  Sparkles,
  Minus,
  Square,
  X,
} from 'lucide-react';

interface TitleBarProps {
  assistantName: string;
  isOnline: boolean;
  manualOfflineMode: boolean;
  onToggleOffline: () => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  onOpenLogs: () => void;
  onOpenArchitecture: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  assistantName,
  isOnline,
  manualOfflineMode,
  onToggleOffline,
  onOpenSettings,
  onOpenMemory,
  onOpenLogs,
  onOpenArchitecture,
}) => {
  return (
    <header
      id="desktop-titlebar"
      className="flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md select-none sticky top-0 z-30"
    >
      {/* Left: Window Dots / Brand */}
      <div className="flex items-center gap-3">
        {/* macOS/Window styling traffic dots */}
        <div className="flex items-center gap-1.5 mr-1">
          <span className="w-3 h-3 rounded-full bg-red-500/80 hover:opacity-100 transition-opacity cursor-pointer inline-block" title="Close" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:opacity-100 transition-opacity cursor-pointer inline-block" title="Minimize" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:opacity-100 transition-opacity cursor-pointer inline-block" title="Maximize" />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-slate-100">
            {assistantName}
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            v0.1.0 • Phase 1
          </span>
        </div>
      </div>

      {/* Center: Online/Offline Status Indicator */}
      <div className="flex items-center gap-2">
        <button
          id="online-status-pill"
          onClick={onToggleOffline}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            isOnline
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
              : 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
          }`}
          title={
            manualOfflineMode
              ? 'Offline mode forced by user. Click to switch to online.'
              : isOnline
              ? 'Online: Cloud AI connected. Click to test Offline mode.'
              : 'Offline: Local database & fallback active. Click to retry.'
          }
        >
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </>
          ) : (
            <>
              <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode</span>
            </>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
          <Shield className="w-3 h-3 text-cyan-400" />
          <span>Local-First</span>
        </div>
      </div>

      {/* Right: Quick Tool Buttons */}
      <div className="flex items-center gap-1">
        <button
          id="btn-nav-memory"
          onClick={onOpenMemory}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors text-xs flex items-center gap-1"
          title="Inspect SQLite Memory"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline text-[11px]">Memory</span>
        </button>

        <button
          id="btn-nav-logs"
          onClick={onOpenLogs}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors text-xs flex items-center gap-1"
          title="View System Logs"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline text-[11px]">Logs</span>
        </button>

        <button
          id="btn-nav-arch"
          onClick={onOpenArchitecture}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors text-xs flex items-center gap-1"
          title="Architecture & Future Modules"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline text-[11px]">Architecture</span>
        </button>

        <button
          id="btn-nav-settings"
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors text-xs flex items-center gap-1 ml-1"
          title="Open Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden md:inline text-[11px]">Settings</span>
        </button>
      </div>
    </header>
  );
};
