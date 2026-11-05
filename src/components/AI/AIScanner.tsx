/**
 * AIScanner Component
 * Vertical mechanical scanning laser beam and HUD telemetry overlay.
 */

import React from 'react';
import { AIStateMode } from '../../types/index.ts';

interface AIScannerProps {
  state: AIStateMode;
}

export const AIScanner: React.FC<AIScannerProps> = ({ state }) => {
  const isScanning = state === 'THINKING' || state === 'EXECUTING' || state === 'SECURITY_ALERT';

  if (!isScanning) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Animated Scanning Beam */}
      <div className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_16px_#ef4444,0_0_32px_#dc2626] animate-scanner-bar">
        <div className="absolute right-4 -top-3 text-[8px] font-mono text-red-400 bg-black/80 px-1.5 py-0.5 border border-red-500/50">
          SCAN_FREQ: 2.8 GHz // PASS 01
        </div>
      </div>

      {/* Grid Scan Overlay */}
      <div className="absolute inset-0 bg-scanlines opacity-40" />
    </div>
  );
};
