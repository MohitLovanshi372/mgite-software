/**
 * SystemStatus Component
 * Displays system status telemetry matching prompt specs.
 */

import React from 'react';
import { initialSystemStatus } from '../../data/mockData.ts';

export const SystemStatus: React.FC = () => {
  const items = [
    { label: 'Core', status: initialSystemStatus.core },
    { label: 'Memory', status: initialSystemStatus.memory },
    { label: 'Voice', status: initialSystemStatus.voice },
    { label: 'Network', status: initialSystemStatus.network },
    { label: 'Tools', status: initialSystemStatus.tools },
    { label: 'Security', status: initialSystemStatus.security },
  ];

  return (
    <div className="space-y-1.5 font-mono text-xs">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between py-1 px-2 bg-[#090a0f] border border-zinc-800/80 rounded-xs hover:border-red-900/40 transition-colors"
        >
          <span className="text-zinc-300 text-[11px]">{item.label}</span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
};
