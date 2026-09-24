/**
 * UltronScanlineOverlay Component
 *
 * Full-viewport, CSS-driven CRT scanline and cathode ray raster overlay
 * synchronized with the AI's real-time cognitive state.
 *
 * State Dynamics:
 * - 'THINKING': Intensified amber-orange neural synthesis scanlines, 2.6s sweep beam,
 *   accelerated interlace jitter, and edge chromatic flare.
 * - 'EXECUTING': Searing crimson-red kinetic overdrive, 1.6s hyper-speed cathode sweep,
 *   maximum raster contrast, and authentic CRT voltage flicker to amplify the iconic
 *   Ultron cinematic aesthetic.
 * - 'IDLE': Ambient low-opacity cybernetic horizontal raster.
 * - 'LISTENING': Electric cyan reception pulses.
 * - 'SECURITY_ALERT': High-voltage red alert flashing.
 *
 * Features:
 * - 100% Non-blocking: `pointer-events-none` on all visual elements ensures zero
 *   interference with 3D model orbit controls, buttons, forms, and camera tracking.
 * - Intensity Modes: 'CINEMA' (default adaptive), 'OVERDRIVE', 'SUBTLE', 'OFF'.
 * - Pure hardware-accelerated CSS keyframe animations.
 */

import React, { useState, useEffect } from 'react';
import { AIStateMode } from '../../types/index.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import { Tv, Zap, Brain } from 'lucide-react';

export type ScanlineIntensity = 'CINEMA' | 'OVERDRIVE' | 'SUBTLE' | 'OFF';

interface UltronScanlineOverlayProps {
  state: AIStateMode;
  intensity?: ScanlineIntensity;
  onIntensityChange?: (intensity: ScanlineIntensity) => void;
  showControlBadge?: boolean;
}

export const UltronScanlineOverlay: React.FC<UltronScanlineOverlayProps> = ({
  state,
  intensity: controlledIntensity,
  onIntensityChange,
  showControlBadge = true,
}) => {
  const [internalIntensity, setInternalIntensity] = useState<ScanlineIntensity>(() => {
    const saved = localStorage.getItem('ultron_scanline_mode');
    return (saved as ScanlineIntensity) || 'CINEMA';
  });

  const activeIntensity = controlledIntensity ?? internalIntensity;

  const cycleIntensity = () => {
    const sequence: ScanlineIntensity[] = ['CINEMA', 'OVERDRIVE', 'SUBTLE', 'OFF'];
    const nextIdx = (sequence.indexOf(activeIntensity) + 1) % sequence.length;
    const nextVal = sequence[nextIdx];
    soundFx.playClick();
    setInternalIntensity(nextVal);
    localStorage.setItem('ultron_scanline_mode', nextVal);
    if (onIntensityChange) {
      onIntensityChange(nextVal);
    }
  };

  // State-specific class mapper
  const stateClass = `ultron-overlay-${state.toLowerCase()}`;
  const intensityClass = `ultron-intensity-${activeIntensity.toLowerCase()}`;

  const isHighIntensity = state === 'THINKING' || state === 'EXECUTING' || state === 'SECURITY_ALERT';

  if (activeIntensity === 'OFF') {
    return (
      <div className="fixed bottom-2 left-2 z-50 pointer-events-auto">
        <button
          onClick={cycleIntensity}
          title="Ultron Scanlines: OFF (Click to enable)"
          className="flex items-center gap-1.5 px-2 py-0.5 bg-black/80 border border-zinc-800/80 text-[9px] font-mono text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 rounded-xs transition-colors backdrop-blur-xs cursor-pointer"
        >
          <Tv className="w-2.5 h-2.5 text-zinc-400" />
          <span>SCANLINES: OFF</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="ultron-viewport-scanline-engine"
      data-ai-state={state}
      data-intensity={activeIntensity}
      className={`fixed inset-0 pointer-events-none z-40 overflow-hidden select-none transition-all duration-300 ${stateClass} ${intensityClass}`}
      aria-hidden="true"
    >
      {/* 1. CRT Radial Vignette & Barrel Rim Glow */}
      <div className="absolute inset-0 ultron-crt-vignette pointer-events-none" />

      {/* 2. Micro Scanlines Raster Grid */}
      <div className="absolute inset-0 ultron-viewport-scanlines pointer-events-none" />

      {/* 3. Traveling Cathode Laser Sweep Beam */}
      <div className="absolute left-0 right-0 ultron-sweep-beam pointer-events-none" />

      {/* 4. High-Voltage Phosphor Flicker Layer (dynamic CSS animation during THINKING/EXECUTING) */}
      <div className="absolute inset-0 ultron-flicker-layer pointer-events-none" />

      {/* 5. Horizontal Top & Bottom Phosphor Guard Lines */}
      <div
        className={`absolute top-0 left-0 right-0 h-[1.5px] transition-all duration-300 ${
          state === 'EXECUTING'
            ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444]'
            : state === 'THINKING'
            ? 'bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_12px_#f97316]'
            : state === 'LISTENING'
            ? 'bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent'
            : 'bg-gradient-to-r from-transparent via-red-600/30 to-transparent'
        }`}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 h-[1.5px] transition-all duration-300 ${
          state === 'EXECUTING'
            ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444]'
            : state === 'THINKING'
            ? 'bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_12px_#f97316]'
            : state === 'LISTENING'
            ? 'bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent'
            : 'bg-gradient-to-r from-transparent via-red-600/30 to-transparent'
        }`}
      />

      {/* 6. Cinematic Corner HUD Crosshairs */}
      <div
        className={`absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 transition-colors duration-300 ${
          state === 'EXECUTING'
            ? 'border-red-500 shadow-[0_0_8px_#ef4444]'
            : state === 'THINKING'
            ? 'border-orange-400 shadow-[0_0_8px_#f97316]'
            : 'border-red-900/40'
        }`}
      />
      <div
        className={`absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 transition-colors duration-300 ${
          state === 'EXECUTING'
            ? 'border-red-500 shadow-[0_0_8px_#ef4444]'
            : state === 'THINKING'
            ? 'border-orange-400 shadow-[0_0_8px_#f97316]'
            : 'border-red-900/40'
        }`}
      />
      <div
        className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 transition-colors duration-300 ${
          state === 'EXECUTING'
            ? 'border-red-500 shadow-[0_0_8px_#ef4444]'
            : state === 'THINKING'
            ? 'border-orange-400 shadow-[0_0_8px_#f97316]'
            : 'border-red-900/40'
        }`}
      />
      <div
        className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 transition-colors duration-300 ${
          state === 'EXECUTING'
            ? 'border-red-500 shadow-[0_0_8px_#ef4444]'
            : state === 'THINKING'
            ? 'border-orange-400 shadow-[0_0_8px_#f97316]'
            : 'border-red-900/40'
        }`}
      />

      {/* 7. Discreet HUD Telemetry & State Status Pill (Click to cycle intensity) */}
      {showControlBadge && (
        <div className="absolute bottom-2 left-2.5 z-50 pointer-events-auto flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <button
            onClick={cycleIntensity}
            title={`Ultron CRT Scanlines: ${activeIntensity} Mode. State: ${state}. Click to toggle intensity.`}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-xs border text-[8.5px] font-mono tracking-wider backdrop-blur-md transition-all cursor-pointer ${
              state === 'EXECUTING'
                ? 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse'
                : state === 'THINKING'
                ? 'bg-orange-950/90 border-orange-500 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.4)] animate-pulse'
                : 'bg-[#080a12]/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {state === 'EXECUTING' ? (
              <Zap className="w-2.5 h-2.5 text-red-400 animate-bounce" />
            ) : state === 'THINKING' ? (
              <Brain className="w-2.5 h-2.5 text-orange-400 animate-pulse" />
            ) : (
              <Tv className="w-2.5 h-2.5 text-zinc-500" />
            )}
            <span className="font-bold">
              SCANLINES // {activeIntensity}
            </span>
            {isHighIntensity && (
              <span className="font-extrabold text-[8px] px-1 py-0.2 rounded-xs bg-black/60 border border-current">
                {state}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
