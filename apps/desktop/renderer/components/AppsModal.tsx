/**
 * JARVIS Connected Apps & Computer Control Modal
 * Displays active local tool integrations, computer control status, and connected ecosystem apps.
 */

import React from 'react';
import { X, Grid, Terminal, Shield, Cpu, HardDrive, CheckCircle2, Lock } from 'lucide-react';

interface AppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunToolCommand?: (cmd: string) => void;
}

export const AppsModal: React.FC<AppsModalProps> = ({ isOpen, onClose, onRunToolCommand }) => {
  if (!isOpen) return null;

  const integrations = [
    {
      id: 'fs',
      name: 'Local Filesystem & Workspace',
      desc: 'Sandboxed file read/write operations with prompt validation',
      status: 'Ready',
      icon: HardDrive,
      security: 'Sandboxed',
    },
    {
      id: 'term',
      name: 'Terminal Automation',
      desc: 'Controlled shell command execution with strict allowlist policy',
      status: 'Ready',
      icon: Terminal,
      security: 'Allowlist Only',
    },
    {
      id: 'sqlite',
      name: 'SQLite Local Vector Memory',
      desc: 'Persistent long-term key-value and semantic vector store',
      status: 'Active',
      icon: Cpu,
      security: 'Airgapped',
    },
    {
      id: 'screen',
      name: 'Computer Control & GUI Automation',
      desc: 'Autonomous desktop interaction and mouse/keyboard synthetic input',
      status: 'Phase 2 (Guarded)',
      icon: Lock,
      security: 'Confirmation Req.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#06080e] border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col max-h-[85vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
                CONNECTED APPS & TOOL INTERFACES
              </h2>
              <p className="text-xs text-slate-400">Autonomous tool execution and computer control security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-1">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>TOOL EXECUTION SANDBOX POLICIES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {integrations.map((app) => {
              const Icon = app.icon;
              return (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-slate-800 text-cyan-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                        {app.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-mono font-bold text-slate-100">{app.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{app.desc}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Security:</span>
                    <span className="text-emerald-400 font-medium">{app.security}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>SAFE EXECUTION LAYER</span>
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
