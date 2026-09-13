/**
 * AIState Component
 * State selector buttons allowing manual inspection of all robotic AI states.
 */

import React from 'react';
import {
  Activity,
  Mic,
  Brain,
  Zap,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { AIStateMode } from '../../types/index.ts';

interface AIStateProps {
  currentState: AIStateMode;
  onStateSelect: (state: AIStateMode) => void;
}

export const AIState: React.FC<AIStateProps> = ({ currentState, onStateSelect }) => {
  const states: { id: AIStateMode; label: string; icon: any; color: string }[] = [
    { id: 'IDLE', label: 'Idle', icon: Activity, color: 'hover:border-zinc-500' },
    { id: 'LISTENING', label: 'Listening', icon: Mic, color: 'hover:border-red-400' },
    { id: 'THINKING', label: 'Thinking', icon: Brain, color: 'hover:border-orange-400' },
    { id: 'EXECUTING', label: 'Executing', icon: Zap, color: 'hover:border-red-500' },
    { id: 'SPEAKING', label: 'Speaking', icon: Volume2, color: 'hover:border-red-400' },
    { id: 'SUCCESS', label: 'Success', icon: CheckCircle2, color: 'hover:border-emerald-400' },
    { id: 'ERROR', label: 'Error', icon: AlertTriangle, color: 'hover:border-amber-500' },
    { id: 'SECURITY_ALERT', label: 'Alert', icon: ShieldAlert, color: 'hover:border-red-600' },
  ];

  return (
    <div className="flex items-center justify-center flex-wrap gap-1.5 p-2 bg-[#08090e]/90 border border-zinc-800/80 rounded-xs backdrop-blur-md">
      <span className="text-[10px] font-mono text-zinc-300 uppercase mr-1 tracking-wider">
        AI CORE STATE:
      </span>

      {states.map((s) => {
        const Icon = s.icon;
        const isActive = currentState === s.id;

        return (
          <button
            key={s.id}
            onClick={() => onStateSelect(s.id)}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer uppercase ${
              isActive
                ? s.id === 'SECURITY_ALERT'
                  ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_#ef4444]'
                  : s.id === 'SUCCESS'
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_12px_#10b981]'
                  : s.id === 'ERROR'
                  ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-[0_0_12px_#f59e0b]'
                  : 'bg-red-950/90 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:text-zinc-200'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
};
