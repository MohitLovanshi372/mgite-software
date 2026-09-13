/**
 * QuickActions Component
 * Mechanical action chips positioned below the command console.
 */

import React from 'react';
import {
  Terminal,
  Search,
  Cpu,
  Database,
  CheckSquare,
  Grid,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { NavigationPageId } from '../../types/index.ts';

interface QuickActionsProps {
  onSelectAction: (actionId: string) => void;
  onNavigate?: (pageId: NavigationPageId) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSelectAction,
  onNavigate,
}) => {
  const chips: { label: string; id: string; page?: NavigationPageId; icon: any }[] = [
    { label: 'COMMAND', id: 'cmd', page: 'command_center', icon: Terminal },
    { label: 'RESEARCH', id: 'res', page: 'research', icon: Search },
    { label: 'ANALYZE', id: 'ana', page: 'documents', icon: Sparkles },
    { label: 'SYSTEM', id: 'sys', page: 'system_control', icon: Cpu },
    { label: 'MEMORY', id: 'mem', page: 'memory', icon: Database },
    { label: 'TASK', id: 'tsk', page: 'tasks', icon: CheckSquare },
    { label: 'APPLICATION', id: 'app', page: 'applications', icon: Grid },
    { label: 'NETWORK', id: 'net', page: 'network', icon: Wifi },
  ];

  return (
    <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <button
            key={chip.id}
            onClick={() => {
              onSelectAction(chip.label);
              if (chip.page && onNavigate) onNavigate(chip.page);
            }}
            className="px-3 py-1 bg-[#0d0e14] hover:bg-red-950/40 border border-zinc-800 hover:border-red-600/70 text-zinc-300 hover:text-red-400 font-mono text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Icon className="w-3 h-3 text-red-500/80" />
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
};
