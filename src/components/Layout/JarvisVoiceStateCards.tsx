/**
 * JarvisVoiceStateCards Component (Golden Space Theme)
 *
 * Horizontal strip of 4 state indicators:
 * 1. Listening (Mic icon)
 * 2. Thinking (Brain icon)
 * 3. Speaking (Equalizer waveform icon)
 * 4. Completed (Shield checkmark icon)
 *
 * Interactively drives and highlights the Golden AI Core's physical state.
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
    <div className="w-full grid grid-cols-4 gap-2 select-none">
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
            className={`px-3 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
              isActive
                ? 'bg-[#D4AF37]/15 border border-[#FFD76A] text-[#FFD76A] shadow-[0_0_18px_rgba(212,175,55,0.25)] font-medium scale-[1.01]'
                : 'bg-[#030712]/75 hover:bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-slate-400 hover:text-[#E8EAF0] backdrop-blur-md'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                isActive
                  ? 'bg-[#D4AF37]/30 text-[#FFD76A]'
                  : 'bg-slate-900 text-slate-500'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive && card.id === 'LISTENING' ? 'animate-pulse text-[#FFD76A]' : ''
                } ${isActive && card.id === 'THINKING' ? 'animate-spin-slow text-[#FFD76A]' : ''}`}
              />
            </div>
            <span className="text-xs font-sans tracking-wide truncate">
              {card.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
