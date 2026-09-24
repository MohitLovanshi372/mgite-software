/**
 * JarvisVoiceStateCards Component
 *
 * Horizontal strip of 4 state cards matching the reference image:
 * 1. Listening (Mic icon)
 * 2. Thinking (Brain icon)
 * 3. Speaking (Equalizer waveform icon)
 * 4. Completed (Shield checkmark icon)
 *
 * Highlighting logic:
 * - Only the currently active state is highlighted with vibrant blue gradient and glow
 */

import React from 'react';
import { Mic, Brain, Volume2, ShieldCheck } from 'lucide-react';
import { AIStateMode } from '../../types/index.ts';
import { soundFx } from '../../utils/audioEffects.ts';

interface JarvisVoiceStateCardsProps {
  currentState: AIStateMode;
  onSelectState?: (state: AIStateMode) => void;
}

export const JarvisVoiceStateCards: React.FC<JarvisVoiceStateCardsProps> = ({
  currentState,
  onSelectState,
}) => {
  const cards = [
    {
      id: 'LISTENING' as AIStateMode,
      label: 'Listening',
      icon: Mic,
      isActive: currentState === 'LISTENING',
    },
    {
      id: 'THINKING' as AIStateMode,
      label: 'Thinking',
      icon: Brain,
      isActive: currentState === 'THINKING' || currentState === 'EXECUTING',
    },
    {
      id: 'SPEAKING' as AIStateMode,
      label: 'Speaking',
      icon: Volume2,
      isActive: currentState === 'SPEAKING',
    },
    {
      id: 'SUCCESS' as AIStateMode,
      label: 'Completed',
      icon: ShieldCheck,
      isActive: currentState === 'SUCCESS',
    },
  ];

  return (
    <div className="w-full grid grid-cols-4 gap-2.5 sm:gap-3 select-none">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = card.isActive;

        return (
          <div
            key={card.id}
            onClick={() => {
              soundFx.playClick();
              if (onSelectState) onSelectState(card.id);
            }}
            className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl flex items-center justify-center gap-2.5 sm:gap-3 transition-all duration-300 cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-cyan-300 shadow-[0_0_24px_rgba(0,140,255,0.5)] font-semibold scale-[1.01]'
                : 'bg-[#091122]/70 hover:bg-[#0d1830] border border-blue-500/20 text-slate-400 hover:text-slate-200 backdrop-blur-md'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-950/60 text-slate-400'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive && card.id === 'LISTENING' ? 'animate-pulse text-white' : ''
                } ${isActive && card.id === 'THINKING' ? 'animate-spin-slow text-white' : ''}`}
              />
            </div>
            <span className="text-xs sm:text-sm font-sans font-medium tracking-wide">
              {card.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
