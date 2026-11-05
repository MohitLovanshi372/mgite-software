/**
 * Radar Component
 * Mechanical 360-degree sweep radar with concentric range rings, cardinal axes, and node blips.
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Radar: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-2 font-mono">
      <div className="relative w-32 h-32 rounded-full border border-red-900/60 bg-[#07080c] flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(220,38,38,0.15)]">
        {/* Concentric Rings */}
        <div className="absolute w-24 h-24 rounded-full border border-red-950/80" />
        <div className="absolute w-16 h-16 rounded-full border border-red-900/50 border-dashed" />
        <div className="absolute w-8 h-8 rounded-full border border-red-800/40" />

        {/* Crosshairs */}
        <div className="absolute w-full h-[1px] bg-red-900/40" />
        <div className="absolute h-full w-[1px] bg-red-900/40" />

        {/* Rotating Radar Sweep */}
        <div className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none">
          <div
            className="w-1/2 h-1/2 origin-bottom-right"
            style={{
              background: 'conic-gradient(from 0deg, rgba(239, 68, 68, 0.4) 0deg, rgba(239, 68, 68, 0.0) 60deg)',
            }}
          />
        </div>

        {/* Blips */}
        <span className="absolute top-6 right-8 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        <span className="absolute top-6 right-8 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_#ef4444]" />
        <span className="absolute bottom-7 left-9 w-1 h-1 rounded-full bg-orange-400 shadow-[0_0_4px_#f97316]" />
        <span className="absolute top-16 left-6 w-1 h-1 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />

        {/* Center Target Marker */}
        <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_#dc2626]" />

        {/* Cardinal Markers */}
        <span className="absolute top-1 text-[8px] text-zinc-300">000°</span>
        <span className="absolute right-1 text-[8px] text-zinc-300">090°</span>
        <span className="absolute bottom-1 text-[8px] text-zinc-300">180°</span>
        <span className="absolute left-1 text-[8px] text-zinc-300">270°</span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-300">
        <ShieldCheck className="w-3 h-3 text-red-400" />
        <span>RADAR: <strong className="text-red-400">SWEEP ACTIVE</strong></span>
      </div>
    </div>
  );
};
