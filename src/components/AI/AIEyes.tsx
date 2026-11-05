/**
 * AIEyes HUD Optic Indicator
 * Shows focal targeting telemetry, red optical dilation, and eye status.
 */

import React from 'react';
import { AIStateMode } from '../../types/index.ts';

interface AIEyesProps {
  state: AIStateMode;
}

export const AIEyes: React.FC<AIEyesProps> = ({ state }) => {
  const getOpticTelemetry = () => {
    switch (state) {
      case 'LISTENING':
        return { lumen: '94%', mode: 'ACOUSTIC LOCK', color: 'text-red-400' };
      case 'THINKING':
        return { lumen: '88%', mode: 'NEURAL SEARCH', color: 'text-orange-400' };
      case 'EXECUTING':
        return { lumen: '98%', mode: 'ACTION VECTOR', color: 'text-red-400' };
      case 'SPEAKING':
        return { lumen: '90%', mode: 'SYNAPSE OUTPUT', color: 'text-red-400' };
      case 'SECURITY_ALERT':
        return { lumen: '100%', mode: 'THREAT TARGETING', color: 'text-red-500' };
      case 'SUCCESS':
        return { lumen: '80%', mode: 'NOMINAL', color: 'text-emerald-400' };
      case 'ERROR':
        return { lumen: '100%', mode: 'PARITY ERROR', color: 'text-amber-500' };
      case 'IDLE':
      default:
        return { lumen: '72%', mode: 'PERIMETER VIGIL', color: 'text-zinc-400' };
    }
  };

  const tele = getOpticTelemetry();

  return (
    <div className="absolute top-4 left-4 z-20 font-mono text-[9px] text-zinc-300 pointer-events-none flex flex-col gap-1">
      <div className="flex items-center gap-1.5 bg-black/60 border border-zinc-800 px-2 py-1 rounded-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
        <span>OPTICS: <strong className={tele.color}>{tele.mode}</strong></span>
      </div>
      <div className="flex items-center gap-1.5 bg-black/60 border border-zinc-800 px-2 py-0.5 rounded-xs">
        <span>LUMEN: <strong className="text-zinc-200">{tele.lumen}</strong></span>
      </div>
    </div>
  );
};
