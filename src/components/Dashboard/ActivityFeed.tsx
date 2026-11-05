/**
 * ActivityFeed Component
 * Displays recent mechanical AI activity logs and system timestamps.
 */

import React from 'react';
import { initialRecentActivity } from '../../data/mockData.ts';

export const ActivityFeed: React.FC = () => {
  return (
    <div className="space-y-1.5 font-mono text-xs">
      {initialRecentActivity.map((act) => (
        <div
          key={act.id}
          className="p-2 bg-[#090a0f] border border-zinc-800/80 rounded-xs flex items-center justify-between gap-2 hover:border-red-900/40 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500/80 shrink-0 shadow-[0_0_4px_#ef4444]" />
            <span className="text-zinc-200 text-[11px] truncate">{act.text}</span>
          </div>

          <span className="text-[10px] text-zinc-400 shrink-0">
            {act.time}
          </span>
        </div>
      ))}
    </div>
  );
};
