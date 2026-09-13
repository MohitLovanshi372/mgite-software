/**
 * CommandCenter Page
 * Central stage of the robotic AI operating system:
 * - Left: Directive Panel ("HELLO, HUMAN. I AM YOUR AI SYSTEM...")
 * - Center: Large 3D Robotic AI Core & Face with Three.js
 * - Realtime Optical Camera Hand Gesture HUD (Learn through hand gestures)
 * - Bottom Center: AI State Selector (IDLE, LISTENING, THINKING, EXECUTING, SPEAKING, SUCCESS, ERROR, ALERT)
 * - Response Speech Box & Acoustic Equalizer
 */

import React from 'react';
import { AICore } from '../components/AI/AICore.tsx';
import { AIState } from '../components/AI/AIState.tsx';
import { DirectivePanel } from '../components/Dashboard/DirectivePanel.tsx';
import { CameraGestureHUD } from '../components/Gestures/CameraGestureHUD.tsx';
import { AIStateMode } from '../types/index.ts';
import { LearnedGesture } from '../types/gestures.ts';
import { Volume2, Play, Activity } from 'lucide-react';
import { ultronVoice } from '../utils/ultronVoice.ts';

interface CommandCenterProps {
  avatarState: AIStateMode;
  onAvatarStateChange: (state: AIStateMode) => void;
  lastAssistantMessage: string;
  interimTranscript: string;
  onGestureTrigger?: (gesture: LearnedGesture) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  avatarState,
  onAvatarStateChange,
  lastAssistantMessage,
  interimTranscript,
  onGestureTrigger,
}) => {
  const handleGestureDetected = (gesture: LearnedGesture) => {
    if (gesture.mappedState) {
      onAvatarStateChange(gesture.mappedState);
    }
    if (onGestureTrigger) {
      onGestureTrigger(gesture);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid relative overflow-y-auto custom-scrollbar p-3 sm:p-4 gap-4 justify-between">
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
          <div className="w-full max-w-xl bg-[#090a10]/95 border border-red-950 p-3 rounded-xs backdrop-blur-md mt-1 shadow-lg relative">
            <div className="flex items-center justify-between absolute -top-2 left-4 right-4">
              <span className="text-[9px] font-mono px-2 py-0.2 bg-red-950 border border-red-500/60 text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_8px_rgba(220,38,38,0.3)]">
                <Volume2 className="w-3 h-3 text-red-400" />
                ULTRON ACOUSTIC SYNTHESIZER // 74Hz SUB-BASS
              </span>

              {/* Quick Audio Controls */}
              <div className="flex items-center gap-1 bg-[#0a0c12] border border-zinc-800 px-1 py-0.5 rounded-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (lastAssistantMessage) {
                      ultronVoice.speak(lastAssistantMessage);
                    }
                  }}
                  title="Replay Ultron Voice"
                  className="px-1.5 py-0.5 hover:bg-red-950 text-zinc-400 hover:text-red-400 text-[9px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>REPLAY</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed pt-2">
              {interimTranscript ? (
                <span className="text-red-400 font-bold animate-pulse">
                  &gt; [ACOUSTIC INGEST]: {interimTranscript}
                </span>
              ) : (
                <span>&gt; {lastAssistantMessage}</span>
              )}
            </p>

            {/* Realtime Vocalizer Waveform when SPEAKING */}
            {avatarState === 'SPEAKING' && (
              <div className="flex items-center gap-1 pt-2 mt-2 border-t border-red-950/60">
                <Activity className="w-3 h-3 text-red-500 animate-spin" />
                <span className="text-[9px] font-mono text-red-400 font-bold tracking-widest uppercase">
                  ACTIVE RESONANCE MATRIX:
                </span>
                <div className="flex items-center gap-0.5 h-3 flex-1 justify-end">
                  {[6, 14, 22, 10, 26, 18, 12, 28, 16, 20, 8, 24].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_#ef4444]"
                      style={{
                        height: `${h}px`,
                        animationDuration: `${0.2 + (i % 3) * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optical Camera Gesture HUD & Learning Lab */}
      <div className="w-full max-w-5xl mx-auto relative z-10">
        <CameraGestureHUD
          onGestureTrigger={handleGestureDetected}
          currentAIState={avatarState}
        />
      </div>

      {/* State Mode Selector Bar */}
      <div className="w-full max-w-3xl mx-auto pt-1 relative z-10">
        <AIState currentState={avatarState} onStateSelect={onAvatarStateChange} />
      </div>
    </div>
  );
};
