/**
 * GalaxyViewPage
 *
 * Dedicated Full-Screen Ultron 3D Galaxy Viewport Page:
 * - 35,000+ interactive stars plotted across 4 logarithmic galactic arms
 * - Sagittarius A* supermassive black hole with relativistic Doppler accretion disk
 * - Real-time astrophysics ephemeris & quadrant coordinates
 */

import React, { useState } from 'react';
import { UltronGalaxy3D } from '../components/Galaxy/UltronGalaxy3D.tsx';
import { GalaxyTelemetry } from '../types/glbModels.ts';
import { Sparkles, Compass, Radio, Activity, ShieldAlert, Cpu } from 'lucide-react';

export const GalaxyViewPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<GalaxyTelemetry | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#020306] bg-tech-grid relative overflow-y-auto custom-scrollbar p-3 sm:p-4 gap-3">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#060812]/90 border border-red-950/80 p-3 rounded-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xs bg-red-950/80 border border-red-600 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.4)]">
            <Sparkles className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-100 tracking-wider uppercase font-mono">
                ULTRON GALAXY OBSERVATORY // 3D DEEP SPACE
              </h1>
              <span className="text-[10px] px-2 py-0.5 bg-red-950 border border-red-800 text-red-300 font-bold font-mono">
                MILKY WAY DISK
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Relativistic gravitational modeling of Sagittarius A*, spiral density waves, and interstellar dust lanes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="px-2.5 py-1 bg-[#090d18] border border-red-900 text-red-300 rounded-xs flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            STELLAR ARRAYS SYNCHRONIZED
          </span>
        </div>
      </div>

      {/* Main 3D Galaxy Viewport */}
      <div className="flex-1 min-h-[520px] relative rounded-xs overflow-hidden border border-zinc-800 shadow-2xl flex flex-col">
        <UltronGalaxy3D onSelectQuadrant={setTelemetry} />
      </div>

      {/* Bottom Telemetry Bar */}
      {telemetry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="bg-[#060812] border border-zinc-800 p-2 rounded-xs flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold">TARGET SECTOR</span>
            <span className="text-xs font-bold text-zinc-100 truncate">{telemetry.name}</span>
          </div>

          <div className="bg-[#060812] border border-zinc-800 p-2 rounded-xs flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold">BLACK HOLE MASS</span>
            <span className="text-xs font-bold text-red-400">{telemetry.blackHoleMass}</span>
          </div>

          <div className="bg-[#060812] border border-zinc-800 p-2 rounded-xs flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold">STELLAR POPULATION</span>
            <span className="text-xs font-bold text-cyan-400">{telemetry.starsEstimate}</span>
          </div>

          <div className="bg-[#060812] border border-zinc-800 p-2 rounded-xs flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold">COORDINATES</span>
            <span className="text-xs font-bold text-amber-400 truncate">{telemetry.coordinates}</span>
          </div>
        </div>
      )}
    </div>
  );
};
