/**
 * Architecture & Modular Roadmap Drawer
 * Clearly distinguishes Phase 1 Active Foundation modules from Phase 2 Architectural Placeholders.
 * Prevents false presentation of unimplemented features.
 */

import React from 'react';
import { X, Layers, CheckCircle2, Clock, Shield, Cpu, Mic, Bell, Terminal, Smartphone, Globe } from 'lucide-react';

interface ArchitectureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDrawer: React.FC<ArchitectureDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const phase1Modules = [
    {
      name: 'Desktop Assistant UI',
      desc: 'Frameless desktop container with custom titlebar, chat view, and modular drawer navigation.',
      status: 'Active',
      tech: 'Electron + React 19 + Tailwind',
    },
    {
      name: 'Chat & Context Interface',
      desc: 'Multi-conversation manager supporting English, Hindi, and Hinglish with status badges.',
      status: 'Active',
      tech: 'useAssistant + SQLite History',
    },
    {
      name: 'SQLite Memory Engine',
      desc: 'Local-first persistent storage with 4 sensitivity levels (PUBLIC, NORMAL, PRIVATE, SENSITIVE).',
      status: 'Active',
      tech: 'SQLite (Node 22 / Python sqlite3)',
    },
    {
      name: 'Central Assistant Orchestrator',
      desc: 'Coordinates input sanitization, OTP shield, context extraction, AI routing, and validation.',
      status: 'Active',
      tech: 'core/orchestrator/',
    },
    {
      name: 'Server-Side Gemini AI Layer',
      desc: 'Calls Gemini 3.8 Flash via @google/genai SDK on server side only. Zero API key frontend exposure.',
      status: 'Active',
      tech: 'core/ai/geminiProvider',
    },
    {
      name: 'Local Offline Fallback Engine',
      desc: 'Activates when offline or key missing. Never fabricates web information; inspects local memory.',
      status: 'Active',
      tech: 'core/ai/offlineProvider',
    },
    {
      name: 'Security Sanitizer & Validator',
      desc: 'Redacts secrets (tokens, keys) and prevents destructive shell execution directives.',
      status: 'Active',
      tech: 'core/security/sanitizer & validator',
    },
    {
      name: 'OTP Privacy Shield Boundary',
      desc: 'Immediate suppression and discard of authentication codes, PINs, and transaction passwords.',
      status: 'Active',
      tech: 'core/security/otpPrivacy',
    },
    {
      name: 'Structured Safe Logging',
      desc: 'Local structured logs with levels (DEBUG, INFO, WARN, ERROR) and zero secret leakage.',
      status: 'Active',
      tech: 'core/logger',
    },
    {
      name: 'Local Configuration Manager',
      desc: 'Reads default_config.json and environment settings. Persists user preference updates.',
      status: 'Active',
      tech: 'config/settings',
    },
  ];

  const phase2Placeholders = [
    {
      name: 'Voice Engine',
      desc: 'Continuous microphone listening, custom wake word, local STT (Whisper), and local TTS (Piper).',
      status: 'Phase 2 Placeholder',
      icon: Mic,
      tech: 'core/voice/voiceEngine.ts',
    },
    {
      name: 'Notification Intelligence',
      desc: 'OS & Android notification listener with classification and immediate OTP privacy purge.',
      status: 'Phase 2 Placeholder',
      icon: Bell,
      tech: 'core/notifications/notificationEngine.ts',
    },
    {
      name: 'Task & Reminder Engine',
      desc: 'Calendar scheduling, smart alarms, and recurring reminders with local SQLite persistence.',
      status: 'Phase 2 Placeholder',
      icon: Clock,
      tech: 'core/tasks/taskEngine.ts',
    },
    {
      name: 'Safe Computer Control',
      desc: 'Allowlisted tools for application control, volume adjustment, and safe OS actions. No arbitrary shell.',
      status: 'Phase 2 Placeholder',
      icon: Terminal,
      tech: 'core/tools/allowlist.ts',
    },
    {
      name: 'Web Research Engine',
      desc: 'Live web scraping and search grounding. Strictly disabled while offline.',
      status: 'Phase 2 Placeholder',
      icon: Globe,
      tech: 'core/tools/webResearch.ts',
    },
    {
      name: 'Multi-AI Router',
      desc: 'Hybrid routing between local models (Ollama/llama.cpp) and cloud models (Gemini/Claude).',
      status: 'Phase 2 Placeholder',
      icon: Cpu,
      tech: 'core/ai/router.ts',
    },
    {
      name: 'Android Companion Sync',
      desc: 'End-to-end encrypted local network sync between desktop assistant and Android device.',
      status: 'Phase 2 Placeholder',
      icon: Smartphone,
      tech: 'apps/android/ (Upcoming)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        id="architecture-drawer-modal"
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">Project Architecture & Modular Structure</h2>
              <span className="text-[11px] text-slate-400">
                Verifiable overview of implemented Phase 1 foundation vs upcoming Phase 2 placeholders
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Phase 1 Active Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Phase 1 Implemented Foundation ({phase1Modules.length} Modules Active)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {phase1Modules.map((m, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-950/80 border border-emerald-950/60 hover:border-emerald-800/60 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{m.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                  <div className="text-[10px] text-cyan-400/80 font-mono pt-1">
                    {m.tech}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 2 Placeholder Section */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Phase 2 Architectural Placeholders (Clean Interfaces Defined — Not Falsely Claimed)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {phase2Placeholders.map((m, i) => {
                const Icon = m.icon;
                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-xs text-slate-300">{m.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                    <div className="text-[10px] text-slate-500 font-mono pt-1">
                      Target: {m.tech}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
