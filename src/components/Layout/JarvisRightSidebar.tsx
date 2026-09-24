/**
 * JarvisRightSidebar Component
 *
 * Right intelligence panel matching the reference desktop AI interface:
 * 1. SYSTEM STATUS Card:
 *    - AI Online (Connected)
 *    - Voice Ready (Ready)
 *    - Gemini Connected (Online)
 *    - TTS Ready (Ready)
 * 2. CURRENT TASK Card:
 *    - Real running task/tool with circular animated spinner
 * 3. SECURITY Card:
 *    - Shield checkmark, "Protected", "Actions are monitored and secured."
 * 4. QUICK ACTIONS Card:
 *    - 2x2 grid: System Status, Open YouTube, Create Reminder, Take Note
 *    - Dispatches to real system handlers
 */

import React from 'react';
import {
  ShieldCheck,
  Activity,
  Youtube,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { soundFx } from '../../utils/audioEffects.ts';

interface JarvisRightSidebarProps {
  currentTaskTitle?: string;
  isTaskRunning?: boolean;
  onQuickAction?: (actionKey: 'system_status' | 'open_youtube' | 'create_reminder' | 'take_note') => void;
  geminiConnected?: boolean;
  voiceReady?: boolean;
  ttsReady?: boolean;
}

export const JarvisRightSidebar: React.FC<JarvisRightSidebarProps> = ({
  currentTaskTitle = 'System Standby',
  isTaskRunning = false,
  onQuickAction,
  geminiConnected = true,
  voiceReady = true,
  ttsReady = true,
}) => {
  const handleAction = (key: 'system_status' | 'open_youtube' | 'create_reminder' | 'take_note') => {
    soundFx.playClick();
    if (onQuickAction) {
      onQuickAction(key);
    }
  };

  return (
    <aside className="w-72 xl:w-80 h-full flex flex-col gap-3 shrink-0 select-none overflow-y-auto custom-scrollbar z-20">
      {/* 1. SYSTEM STATUS CARD */}
      <div className="p-4 rounded-2xl bg-[#091122]/85 backdrop-blur-xl border border-blue-500/20 shadow-[0_0_20px_rgba(0,140,255,0.06)] flex flex-col gap-3">
        <div className="flex items-center justify-between pb-1 border-b border-blue-900/30">
          <span className="text-xs font-sans font-bold tracking-wider text-cyan-400 uppercase">
            SYSTEM STATUS
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            OPTIMAL
          </span>
        </div>

        <div className="space-y-2.5 text-xs font-sans">
          {/* AI Online */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>AI Online</span>
            </div>
            <span className="text-emerald-400 font-medium">Connected</span>
          </div>

          {/* Voice Ready */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${voiceReady ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'}`} />
              <span>Voice Ready</span>
            </div>
            <span className="text-emerald-400 font-medium">{voiceReady ? 'Ready' : 'Calibrating'}</span>
          </div>

          {/* Gemini Connected */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${geminiConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-red-400'}`} />
              <span>Gemini Connected</span>
            </div>
            <span className="text-emerald-400 font-medium">{geminiConnected ? 'Online' : 'Offline'}</span>
          </div>

          {/* TTS Ready */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${ttsReady ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'}`} />
              <span>TTS Ready</span>
            </div>
            <span className="text-emerald-400 font-medium">{ttsReady ? 'Ready' : 'Initializing'}</span>
          </div>
        </div>
      </div>

      {/* 2. CURRENT TASK CARD */}
      <div className="p-4 rounded-2xl bg-[#091122]/85 backdrop-blur-xl border border-blue-500/20 shadow-[0_0_20px_rgba(0,140,255,0.06)] flex flex-col gap-3">
        <div className="flex items-center justify-between pb-1 border-b border-blue-900/30">
          <span className="text-xs font-sans font-bold tracking-wider text-cyan-400 uppercase">
            CURRENT TASK
          </span>
          {isTaskRunning && (
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full animate-pulse">
              RUNNING
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#060b18]/80 border border-blue-900/40">
          <div className="flex items-center gap-3 min-w-0">
            {/* Task Icon (YouTube or Activity) */}
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
              {currentTaskTitle.toLowerCase().includes('youtube') ? (
                <Youtube className="w-5 h-5 text-red-500" />
              ) : (
                <Activity className="w-5 h-5 text-cyan-400" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-sans font-medium text-white truncate">
                {currentTaskTitle}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">
                {isTaskRunning ? 'Executing secure tool...' : 'Idle • Ready for input'}
              </span>
            </div>
          </div>

          {/* Animated Spinner or Check Icon */}
          <div className="shrink-0">
            {isTaskRunning ? (
              <div className="w-5 h-5 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* 3. SECURITY CARD */}
      <div className="p-4 rounded-2xl bg-[#091122]/85 backdrop-blur-xl border border-blue-500/20 shadow-[0_0_20px_rgba(0,140,255,0.06)] flex flex-col gap-2.5">
        <span className="text-xs font-sans font-bold tracking-wider text-cyan-400 uppercase pb-1 border-b border-blue-900/30">
          SECURITY
        </span>

        <div className="flex items-center gap-3.5 p-2">
          <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-sans font-bold text-emerald-400 tracking-wide">
              Protected
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Actions are monitored and secured.
            </span>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTIONS CARD */}
      <div className="p-4 rounded-2xl bg-[#091122]/85 backdrop-blur-xl border border-blue-500/20 shadow-[0_0_20px_rgba(0,140,255,0.06)] flex flex-col gap-3">
        <span className="text-xs font-sans font-bold tracking-wider text-cyan-400 uppercase pb-1 border-b border-blue-900/30">
          QUICK ACTIONS
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs font-sans">
          {/* Action 1: System Status */}
          <button
            onClick={() => handleAction('system_status')}
            className="p-3 rounded-xl bg-[#0c162b]/80 hover:bg-[#132347] border border-blue-500/25 hover:border-cyan-400 flex flex-col items-center justify-center gap-2 text-center text-slate-200 hover:text-white transition-all cursor-pointer group"
          >
            <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium leading-tight">System Status</span>
          </button>

          {/* Action 2: Open YouTube */}
          <button
            onClick={() => handleAction('open_youtube')}
            className="p-3 rounded-xl bg-[#0c162b]/80 hover:bg-[#132347] border border-blue-500/25 hover:border-cyan-400 flex flex-col items-center justify-center gap-2 text-center text-slate-200 hover:text-white transition-all cursor-pointer group"
          >
            <Youtube className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium leading-tight">Open YouTube</span>
          </button>

          {/* Action 3: Create Reminder */}
          <button
            onClick={() => handleAction('create_reminder')}
            className="p-3 rounded-xl bg-[#0c162b]/80 hover:bg-[#132347] border border-blue-500/25 hover:border-cyan-400 flex flex-col items-center justify-center gap-2 text-center text-slate-200 hover:text-white transition-all cursor-pointer group"
          >
            <Calendar className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium leading-tight">Create Reminder</span>
          </button>

          {/* Action 4: Take Note */}
          <button
            onClick={() => handleAction('take_note')}
            className="p-3 rounded-xl bg-[#0c162b]/80 hover:bg-[#132347] border border-blue-500/25 hover:border-cyan-400 flex flex-col items-center justify-center gap-2 text-center text-slate-200 hover:text-white transition-all cursor-pointer group"
          >
            <FileText className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium leading-tight">Take Note</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
