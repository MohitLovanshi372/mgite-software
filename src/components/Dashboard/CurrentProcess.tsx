/**
 * CurrentProcess Component
 * Displays active background process, animated progress bar, and threat level matrix.
 */

import React, { useState } from 'react';
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { initialCurrentProcess } from '../../data/mockData.ts';

interface CurrentProcessProps {
  onThreatChange?: (threat: 'LOW' | 'ELEVATED' | 'CRITICAL') => void;
}

export const CurrentProcess: React.FC<CurrentProcessProps> = ({ onThreatChange }) => {
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'ELEVATED' | 'CRITICAL'>('LOW');
  const [progress, setProgress] = useState(initialCurrentProcess.progress);

  const cycleThreat = () => {
    const next = threatLevel === 'LOW' ? 'ELEVATED' : threatLevel === 'ELEVATED' ? 'CRITICAL' : 'LOW';
    setThreatLevel(next);
    if (onThreatChange) onThreatChange(next);
  };

  const getThreatStyle = () => {
    switch (threatLevel) {
      case 'CRITICAL':
        return 'text-red-500 bg-red-950/70 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]';
      case 'ELEVATED':
        return 'text-orange-400 bg-orange-950/60 border-orange-500';
      case 'LOW':
      default:
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-500/60';
    }
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Active Process Title */}
      <div className="p-2.5 bg-[#090a0f] border border-zinc-800/80 rounded-xs space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-400 uppercase">Process</span>
          <span className="text-red-400 font-bold flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" />
            RUNNING
          </span>
        </div>

        <p className="text-zinc-100 font-bold text-xs">{initialCurrentProcess.name}</p>

        {/* Animated Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>PROGRESS</span>
            <span className="text-zinc-200 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-xs overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500 shadow-[0_0_8px_#ef4444]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Threat Level Badge */}
      <div className="p-2.5 bg-[#090a0f] border border-zinc-800/80 rounded-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase block">THREAT LEVEL</span>
          <span className={`text-xs font-bold px-2 py-0.5 border rounded-xs inline-block mt-1 ${getThreatStyle()}`}>
            {threatLevel}
          </span>
        </div>

        <button
          onClick={cycleThreat}
          className="text-[10px] px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xs transition-colors cursor-pointer"
          title="Simulate threat level change"
        >
          Toggle Threat
        </button>
      </div>
    </div>
  );
};
