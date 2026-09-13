/**
 * SystemIndicators Component
 * Digital indicators with crimson status beacons.
 */

import React from 'react';
import { initialSystemStatus } from '../../data/mockData.ts';

export const SystemIndicators: React.FC = () => {
  const indicators = [
    { label: 'Core', status: initialSystemStatus.core },
    { label: 'Memory', status: initialSystemStatus.memory },
    { label: 'Voice', status: initialSystemStatus.voice },
    { label: 'Network', status: initialSystemStatus.network },
    { label: 'Tools', status: initialSystemStatus.tools },
    { label: 'Security', status: initialSystemStatus.security },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
      {indicators.map((ind) => (
        <div
          key={ind.label}
          className="flex items-center justify-between p-2 bg-[#08090e] border border-zinc-800/80 rounded-xs"
        >
          <span className="text-zinc-300 text-[11px]">{ind.label}</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
            {ind.status}
          </span>
        </div>
      ))}
    </div>
  );
};
