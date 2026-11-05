/**
 * Logs Page
 * Real-time diagnostic console with airgap defense logs and neural heartbeats.
 */

import React, { useState, useEffect } from 'react';
import { Terminal, Play, Pause, Trash2, ShieldAlert } from 'lucide-react';
import { initialSystemLogs } from '../data/mockData.ts';
import { SystemLogEntry } from '../types/index.ts';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SystemLogEntry[]>(initialSystemLogs);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');

  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const subsystems = ['AIRGAP', 'CORE_V1', 'ACOUSTICS', 'MEMORY_BUS', 'SENTINEL', 'KINEMATICS'];
      const sub = subsystems[Math.floor(Math.random() * subsystems.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const messages = [
        'Acoustic waveform synthesized: zero distortion.',
        'Local SQLite WAL write locked: 0 dirty buffers.',
        'Airgap sentinel inspected socket buffer: zero egress leaks.',
        'Planetary ephemeris telemetry stream nominal (60 FPS).',
        'Neural weights locked in high-speed NPU cache.',
      ];

      const newLog: SystemLogEntry = {
        id: `log-${Date.now()}`,
        time: timeStr,
        level: sub === 'AIRGAP' ? 'DEFENSE' : sub === 'CORE_V1' ? 'NEURAL' : 'INFO',
        subsystem: sub,
        message: messages[Math.floor(Math.random() * messages.length)],
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    }, 2400);

    return () => clearInterval(timer);
  }, [isStreaming]);

  const filtered = logs.filter((l) => {
    if (filterLevel === 'ALL') return true;
    return l.level === filterLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'DEFENSE':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50';
      case 'NEURAL':
        return 'text-red-400 bg-red-950/70 border-red-500/50';
      case 'CRITICAL':
        return 'text-red-500 bg-red-950 border-red-600';
      case 'WARN':
        return 'text-orange-400 bg-orange-950 border-orange-500/50';
      case 'INFO':
      default:
        return 'text-zinc-300 bg-zinc-900 border-zinc-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-hidden font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              SYSTEM DIAGNOSTIC CONSOLE & LOGS
            </h2>
            <p className="text-xs text-zinc-400">
              Kernel bus heartbeats • Airgap firewall triggers • Hardware servo logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className="px-3 py-1.5 bg-[#08090e] border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5 text-orange-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isStreaming ? 'PAUSE' : 'RESUME'}</span>
          </button>

          <button
            onClick={() => setLogs([])}
            className="px-3 py-1.5 bg-[#08090e] border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 my-3 text-xs">
        <span className="text-[10px] text-zinc-400 uppercase mr-1">LEVEL:</span>
        {['ALL', 'DEFENSE', 'NEURAL', 'INFO'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={`px-2.5 py-1 border transition-colors cursor-pointer ${
              filterLevel === lvl
                ? 'bg-red-950 text-red-400 border-red-500 font-bold'
                : 'bg-[#08090e] text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Log Console Window */}
      <div className="flex-1 bg-[#020305] border border-zinc-800 p-4 overflow-y-auto custom-scrollbar text-xs space-y-1.5 rounded-xs">
        {filtered.map((log) => (
          <div key={log.id} className="flex items-start gap-2 hover:bg-zinc-900/40 px-1 py-0.5 rounded-xs">
            <span className="text-zinc-500 shrink-0 select-none">[{log.time}]</span>
            <span className={`text-[9px] px-1.5 py-0.2 border font-bold shrink-0 ${getLevelColor(log.level)}`}>
              {log.level}
            </span>
            <span className="text-red-400 font-bold shrink-0">[{log.subsystem}]</span>
            <span className="text-zinc-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
