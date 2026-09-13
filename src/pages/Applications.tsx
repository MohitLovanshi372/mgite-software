/**
 * Applications Page
 * Process orchestrator, sandboxed bridges, and memory consumption.
 */

import React, { useState } from 'react';
import { Grid, Play, Square, Cpu, HardDrive, Shield } from 'lucide-react';
import { initialApplications } from '../data/mockData.ts';
import { ApplicationBridge } from '../types/index.ts';

export const ApplicationsPage: React.FC = () => {
  const [apps, setApps] = useState<ApplicationBridge[]>(initialApplications);

  const toggleStatus = (id: string) => {
    setApps(
      apps.map((a) => {
        if (a.id === id) {
          const next = a.status === 'ACTIVE' ? 'STANDBY' : 'ACTIVE';
          return { ...a, status: next };
        }
        return a;
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              APPLICATIONS & PROCESS BRIDGES
            </h2>
            <p className="text-xs text-zinc-400">
              Low-level IPC hooks • Sandboxed memory isolation • Subsystem control
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-400 font-bold uppercase">
          {apps.filter((a) => a.status === 'ACTIVE').length} ACTIVE PROCESSES
        </span>
      </div>

      {/* Grid of Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        {apps.map((app) => {
          const isActive = app.status === 'ACTIVE';
          return (
            <div
              key={app.id}
              className={`p-4 rounded-xs border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[#0a0c12] border-red-900/60 shadow-[0_0_12px_rgba(220,38,38,0.15)]'
                  : 'bg-[#06070a] border-zinc-800/80 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-400 uppercase">{app.category}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 border uppercase ${
                      isActive
                        ? 'border-emerald-600/60 bg-emerald-950/60 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    ● {app.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-zinc-100">{app.name}</h3>

                <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-red-400" />
                    {app.memory}
                  </span>
                  <span>•</span>
                  <span>{app.pids} PIDS</span>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">CLEARANCE: {app.securityRating}</span>

                <button
                  onClick={() => toggleStatus(app.id)}
                  className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 hover:bg-red-950 text-zinc-300 hover:text-red-400 border border-zinc-700'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Square className="w-3 h-3" />
                      <span>SUSPEND</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>LAUNCH</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
