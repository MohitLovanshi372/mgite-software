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
  Youtube,
  Music,
  Hand,
  Box,
  Sparkles,
  Layers,
  Zap,
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
  const chips: { label: string; id: string; command?: string; page?: NavigationPageId; icon: any }[] = [
    { label: '⚡ LIGHT CHALAO', id: 'light_on', command: 'Jarvis, light chalao', icon: Zap },
    { label: '⚡ SYSTEM STATUS', id: 'status', command: 'Jarvis, system status dikhao', page: 'command_center', icon: Terminal },
    { label: '3D GLB STUDIO', id: 'glb', page: 'glb_studio', icon: Box },
    { label: 'ULTRON GALAXY', id: 'galaxy', page: 'galaxy_view', icon: Sparkles },
    { label: 'GESTURE CAMERA', id: 'calibrate', page: 'intelligence', icon: Hand },
    { label: 'SYSTEM CONTROL', id: 'sys', page: 'system_control', icon: Cpu },
  ];

  return (
    <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <button
            key={chip.id}
            onClick={() => {
              onSelectAction(chip.command || chip.label);
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
