/**
 * Desktop Window TitleBar / Top Status Bar Component
 * Provides:
 * - JARVIS brand identifier
 * - ONLINE/OFFLINE status pill
 * - LOCAL-FIRST indicator
 * - AI status indicator
 * - VOICE status indicator
 * - Live real-time clock
 * - Window controls & quick drawer toggles
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Wifi,
  WifiOff,
  Settings as SettingsIcon,
  Database,
  Terminal,
  Layers,
  Sparkles,
  User,
  LayoutDashboard,
  Clock,
  Mic,
  Cpu,
} from 'lucide-react';

interface TitleBarProps {
  assistantName: string;
  isOnline: boolean;
  manualOfflineMode: boolean;
  viewMode?: 'command_center' | 'workspace';
  onToggleViewMode?: () => void;
  onToggleOffline: () => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  onOpenLogs: () => void;
  onOpenArchitecture: () => void;
  aiStatus?: string;
  voiceStatus?: string;
  privacyStatus?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  assistantName = 'JARVIS',
  isOnline,
  manualOfflineMode,
  viewMode = 'command_center',
  onToggleViewMode,
  onToggleOffline,
  onOpenSettings,
  onOpenMemory,
  onOpenLogs,
  onOpenArchitecture,
  aiStatus,
  voiceStatus,
  privacyStatus = 'SHIELDED',
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="desktop-titlebar"
      className="flex items-center justify-between px-3.5 py-2 bg-[#06080e]/95 border-b border-cyan-500/15 backdrop-blur-xl select-none sticky top-0 z-40 text-slate-200"
    >
      {/* 1. Left: Window Traffic Dots + Brand Mark */}
      <div className="flex items-center gap-3">
        {/* Window controls */}
        <div className="flex items-center gap-1.5 mr-1">
          <span
            className="w-2.5 h-2.5 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors cursor-pointer inline-block"
            title="Close Window"
          />
          <span
            className="w-2.5 h-2.5 rounded-full bg-amber-500/80 hover:bg-amber-400 transition-colors cursor-pointer inline-block"
            title="Minimize Window"
          />
          <span
            className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-400 transition-colors cursor-pointer inline-block"
            title="Maximize Window"
          />
        </div>

        {/* Brand Monogram */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-xs tracking-widest text-slate-100 uppercase">
            {assistantName || 'JARVIS'}
          </span>
          <span className="hidden sm:inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
            MARK VII
          </span>
        </div>
      </div>

      {/* 2. Center: Telemetry Status Badges (Online, Local-First, AI, Voice, Time) */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center">
        {/* ONLINE / OFFLINE Status Pill */}
        <button
          id="online-status-pill"
          onClick={onToggleOffline}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border transition-all cursor-pointer ${
            isOnline
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/40'
          }`}
          title={
            manualOfflineMode
              ? 'Forced Offline Mode. Click to switch to Online Cloud AI.'
              : isOnline
              ? 'Online Cloud Ready (Gemini API Active). Click to test Offline.'
              : 'Offline Airgap Active (Local SQLite only).'
          }
        >
          {isOnline ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>ONLINE</span>
            </>
          ) : (
            <>
              <span className="inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>OFFLINE</span>
            </>
          )}
        </button>

        {/* LOCAL-FIRST Badge */}
        <div
          className="hidden md:flex items-center gap-1 text-[11px] text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-500/20 font-mono"
          title="Privacy Foundation: SQLite Local Database with zero unencrypted telemetry"
        >
          <Shield className="w-3 h-3 text-cyan-400" />
          <span>LOCAL-FIRST</span>
        </div>

        {/* AI Status */}
        <div
          className="hidden lg:flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800 text-slate-300"
          title="Cognitive Intelligence Pipeline"
        >
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-400">AI:</span>
          <span className="text-cyan-300 font-medium">
            {aiStatus || (isOnline ? 'ONLINE (GEMINI)' : 'LOCAL ONLY')}
          </span>
        </div>

        {/* VOICE Status */}
        <div
          className="hidden xl:flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800 text-slate-300"
          title="Speech Synthesis & Voice Engine"
        >
          <Mic className="w-3 h-3 text-sky-400" />
          <span className="text-slate-400">VOICE:</span>
          <span className="text-sky-300 font-medium">{voiceStatus || 'ACTIVE'}</span>
        </div>

        {/* PRIVACY Status */}
        <div
          className="hidden 2xl:flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-500/25 text-emerald-300"
          title="Local Airgap Shield & OTP Scrubbing Active"
        >
          <Shield className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">PRIVACY:</span>
          <span className="text-emerald-300 font-medium">{privacyStatus || 'SHIELDED'}</span>
        </div>

        {/* Live Digital Clock */}
        <div
          className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#0a0f1d] border border-cyan-500/20 text-cyan-400 shadow-inner"
          title="System Synchronized Chronometer"
        >
          <Clock className="w-3 h-3 text-cyan-500" />
          <span className="tracking-widest">{timeString || '00:00:00'}</span>
        </div>
      </div>

      {/* 3. Right: View Toggle + Quick Access Tool Buttons */}
      <div className="flex items-center gap-1">
        {onToggleViewMode && (
          <button
            id="btn-nav-viewmode"
            onClick={onToggleViewMode}
            className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5 cursor-pointer font-mono border ${
              viewMode === 'command_center'
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
            title={
              viewMode === 'command_center'
                ? 'Switch to Multi-Panel Chat Workspace'
                : 'Switch to 3D Avatar Command Center'
            }
          >
            {viewMode === 'command_center' ? (
              <>
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] hidden sm:inline">Command Center</span>
              </>
            ) : (
              <>
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] hidden sm:inline">Workspace</span>
              </>
            )}
          </button>
        )}

        <button
          id="btn-nav-memory"
          onClick={onOpenMemory}
          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 rounded-md transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-cyan-500/20 cursor-pointer"
          title="Inspect SQLite Memory"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden 2xl:inline text-[11px] font-mono">Memory</span>
        </button>

        <button
          id="btn-nav-logs"
          onClick={onOpenLogs}
          className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30 rounded-md transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-emerald-500/20 cursor-pointer"
          title="View System Logs"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden 2xl:inline text-[11px] font-mono">Logs</span>
        </button>

        <button
          id="btn-nav-arch"
          onClick={onOpenArchitecture}
          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30 rounded-md transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-indigo-500/20 cursor-pointer"
          title="Architecture & Roadmap"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden 2xl:inline text-[11px] font-mono">Architecture</span>
        </button>

        <button
          id="btn-nav-settings"
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors text-xs flex items-center gap-1 ml-0.5 border border-slate-800/80 cursor-pointer"
          title="Open Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden 2xl:inline text-[11px] font-mono">Settings</span>
        </button>
      </div>
    </header>
  );
};

