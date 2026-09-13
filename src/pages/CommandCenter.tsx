/**
 * CommandCenter Page
 * Central stage of the robotic AI operating system:
 * - Left: Directive Panel ("HELLO, HUMAN. I AM YOUR AI SYSTEM...")
 * - Center: Large 3D Robotic AI Core & Face with Three.js
 * - Bottom Center: AI State Selector (IDLE, LISTENING, THINKING, EXECUTING, SPEAKING, SUCCESS, ERROR, ALERT)
 * - Response Speech Box
 */

import React from 'react';
import { AICore } from '../components/AI/AICore.tsx';
import { AIState } from '../components/AI/AIState.tsx';
import { DirectivePanel } from '../components/Dashboard/DirectivePanel.tsx';
import { AIStateMode } from '../types/index.ts';
import { Volume2, Terminal, Shield } from 'lucide-react';

interface CommandCenterProps {
  avatarState: AIStateMode;
  onAvatarStateChange: (state: AIStateMode) => void;
  lastAssistantMessage: string;
  interimTranscript: string;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  avatarState,
  onAvatarStateChange,
  lastAssistantMessage,
  interimTranscript,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid relative overflow-y-auto custom-scrollbar p-3 sm:p-4 justify-between">
      {/* Subtle Scanlines overlay */}
      <div className="absolute inset-0 bg-scanlines opacity-25 pointer-events-none z-10" />

      {/* Main Center Stage: Left Directive Panel + Center Robotic Core */}
      <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-4 relative z-10 my-auto">
        {/* Left Information Panel */}
        <div className="w-full xl:w-auto flex justify-center shrink-0">
          <DirectivePanel state={avatarState} />
        </div>

        {/* Central Robotic AI Core */}
        <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center relative">
          <AICore state={avatarState} />

          {/* Speech Bubble / Live Speech Output HUD */}
          <div className="w-full max-w-xl bg-[#090a10]/90 border border-red-950 p-3 rounded-xs backdrop-blur-md mt-1 shadow-lg relative">
            <span className="absolute -top-2 left-4 text-[9px] font-mono px-2 py-0.2 bg-red-950 border border-red-500/60 text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              SYNAPSE SPEECH SYNTHESIZER
            </span>

            <p className="text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed pt-1">
              {interimTranscript ? (
                <span className="text-red-400 font-bold animate-pulse">
                  &gt; [ACOUSTIC INGEST]: {interimTranscript}
                </span>
              ) : (
                <span>&gt; {lastAssistantMessage}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* State Mode Selector Bar */}
      <div className="w-full max-w-3xl mx-auto pt-2 relative z-10">
        <AIState currentState={avatarState} onStateSelect={onAvatarStateChange} />
      </div>
    </div>
  );
};
