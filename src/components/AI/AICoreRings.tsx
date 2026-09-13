/**
 * AICoreRings Component
 * Layered holographic HUD energy rings, rotating mechanical geometry, angle ticks, and red aura.
 */

import React from 'react';
import { AIStateMode } from '../../types/index.ts';

interface AICoreRingsProps {
  state: AIStateMode;
}

export const AICoreRings: React.FC<AICoreRingsProps> = ({ state }) => {
  const isExcited = state === 'THINKING' || state === 'EXECUTING' || state === 'SECURITY_ALERT';
  const isAlert = state === 'SECURITY_ALERT' || state === 'ERROR';

  const ringColor = isAlert
    ? 'text-red-500 stroke-red-500'
    : state === 'SUCCESS'
    ? 'text-emerald-400 stroke-emerald-400'
    : 'text-red-600 stroke-red-600';

  const glowColor = isAlert
    ? 'rgba(239, 68, 68, 0.4)'
    : state === 'SUCCESS'
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(220, 38, 38, 0.25)';

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-75">
      {/* Background Radial Glow */}
      <div
        className="absolute w-[420px] h-[420px] rounded-full transition-all duration-700 animate-pulse-glow"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, rgba(10, 10, 15, 0) 70%)`,
        }}
      />

      {/* Layer 1: Outer Segmented Mechanical Ring */}
      <div
        className={`absolute w-[460px] h-[460px] ${
          isExcited ? 'animate-spin-slow duration-[10s]' : 'animate-spin-slow'
        }`}
      >
        <svg viewBox="0 0 500 500" className="w-full h-full opacity-60">
          <circle
            cx="250"
            cy="250"
            r="230"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="18 12 6 12"
            className={ringColor}
          />
          <circle
            cx="250"
            cy="250"
            r="220"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="4 6"
            className={ringColor}
            opacity="0.4"
          />
          {/* Cardinal notch blocks */}
          <rect x="246" y="8" width="8" height="16" fill="currentColor" className={ringColor} />
          <rect x="246" y="476" width="8" height="16" fill="currentColor" className={ringColor} />
          <rect x="8" y="246" width="16" height="8" fill="currentColor" className={ringColor} />
          <rect x="476" y="246" width="16" height="8" fill="currentColor" className={ringColor} />
        </svg>
      </div>

      {/* Layer 2: Counter-Rotating Middle HUD Ring */}
      <div
        className={`absolute w-[360px] h-[360px] ${
          isExcited ? 'animate-spin-reverse-slow duration-[12s]' : 'animate-spin-reverse-slow'
        }`}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full opacity-50">
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="40 20 10 20"
            className={ringColor}
          />
          {/* Degree Ticks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 200 200)`}>
              <line x1="200" y1="12" x2="200" y2="28" stroke="currentColor" strokeWidth="2" className={ringColor} />
              <text x="204" y="26" fontSize="8" fontFamily="monospace" fill="currentColor" className={ringColor}>
                {deg}°
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Layer 3: Inner Fast Mechanical Ring */}
      <div className="absolute w-[260px] h-[260px] animate-spin-slow duration-[40s]">
        <svg viewBox="0 0 300 300" className="w-full h-full opacity-40">
          <circle
            cx="150"
            cy="150"
            r="135"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="12 18"
            className={ringColor}
          />
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className={ringColor}
          />
        </svg>
      </div>
    </div>
  );
};
