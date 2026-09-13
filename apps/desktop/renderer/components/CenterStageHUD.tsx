/**
 * JARVIS Center Stage HUD Component
 * Houses the EXISTING 3D AvatarScene surrounded by:
 * - Holographic circular HUD orbital rings
 * - Reactive state aura (IDLE, LISTENING, THINKING, EXECUTING, SPEAKING, SUCCESS, ERROR)
 * - State indicator badge
 * - Subtle ambient glow & cybernetic grid/particles
 * - Live transcription / response readout card
 */

import React, { useMemo } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Activity,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Zap,
} from 'lucide-react';
import { AvatarScene } from '../../../../src/avatar/AvatarScene.tsx';
import { AvatarState, AvatarSettingsConfig } from '../../../../src/avatar/types.ts';
import { JARVISGreetingCard } from './JARVISGreetingCard.tsx';

export type CenterStageState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'SUCCESS'
  | 'ERROR';

interface CenterStageHUDProps {
  state: CenterStageState;
  avatarState: AvatarState;
  assistantName?: string;
  isOnline: boolean;
  interimTranscript?: string;
  lastAssistantMessage?: string;
  isAudioMuted?: boolean;
  avatarEnabled?: boolean;
  onToggleAudioMute?: () => void;
  onToggleAvatar?: () => void;
}

export const CenterStageHUD: React.FC<CenterStageHUDProps> = ({
  state,
  avatarState,
  assistantName = 'JARVIS',
  isOnline,
  interimTranscript,
  lastAssistantMessage,
  isAudioMuted = false,
  avatarEnabled = true,
  onToggleAudioMute,
  onToggleAvatar,
}) => {
  // Compute state-specific styling & aura colors
  const stateConfig = useMemo(() => {
    switch (state) {
      case 'LISTENING':
        return {
          label: 'LISTENING',
          subtitle: 'Acoustic Sensor Active • Receiving Audio',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/40',
          bgBadge: 'bg-emerald-950/60',
          auraGradient: 'from-emerald-500/20 via-emerald-600/5 to-transparent',
          ringColor: '#10b981',
          ringSecondary: '#34d399',
          dotColor: 'bg-emerald-400',
          icon: Mic,
        };
      case 'THINKING':
        return {
          label: 'THINKING',
          subtitle: 'Neural Synthesis & Contextual Routing',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/40',
          bgBadge: 'bg-purple-950/60',
          auraGradient: 'from-purple-500/25 via-indigo-600/5 to-transparent',
          ringColor: '#a855f7',
          ringSecondary: '#c084fc',
          dotColor: 'bg-purple-400',
          icon: Cpu,
        };
      case 'EXECUTING':
        return {
          label: 'EXECUTING',
          subtitle: 'Autonomous Task Engine Processing',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/40',
          bgBadge: 'bg-amber-950/60',
          auraGradient: 'from-amber-500/20 via-amber-600/5 to-transparent',
          ringColor: '#f59e0b',
          ringSecondary: '#fbbf24',
          dotColor: 'bg-amber-400',
          icon: Zap,
        };
      case 'SPEAKING':
        return {
          label: 'SPEAKING',
          subtitle: 'Voice Synthesis & Audio Frequency Active',
          textColor: 'text-sky-400',
          borderColor: 'border-sky-500/40',
          bgBadge: 'bg-sky-950/60',
          auraGradient: 'from-sky-500/20 via-sky-600/5 to-transparent',
          ringColor: '#38bdf8',
          ringSecondary: '#7dd3fc',
          dotColor: 'bg-sky-400',
          icon: Volume2,
        };
      case 'SUCCESS':
        return {
          label: 'SUCCESS',
          subtitle: 'Instruction Completed • All Invariants Valid',
          textColor: 'text-teal-400',
          borderColor: 'border-teal-500/40',
          bgBadge: 'bg-teal-950/60',
          auraGradient: 'from-teal-500/20 via-teal-600/5 to-transparent',
          ringColor: '#2dd4bf',
          ringSecondary: '#5eead4',
          dotColor: 'bg-teal-400',
          icon: CheckCircle2,
        };
      case 'ERROR':
        return {
          label: 'ERROR',
          subtitle: 'Security Intercept or Execution Exception',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/40',
          bgBadge: 'bg-red-950/60',
          auraGradient: 'from-red-500/25 via-red-600/5 to-transparent',
          ringColor: '#ef4444',
          ringSecondary: '#f87171',
          dotColor: 'bg-red-400',
          icon: AlertTriangle,
        };
      case 'IDLE':
      default:
        return {
          label: 'IDLE',
          subtitle: 'Standing By • Ready for Command',
          textColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/30',
          bgBadge: 'bg-slate-900/70',
          auraGradient: 'from-cyan-500/15 via-blue-600/5 to-transparent',
          ringColor: '#06b6d4',
          ringSecondary: '#38bdf8',
          dotColor: 'bg-cyan-400',
          icon: Activity,
        };
    }
  }, [state]);

  const StateIcon = stateConfig.icon;

  return (
    <div
      id="jarvis-center-stage"
      className="relative flex-1 flex flex-col items-center justify-between p-3 sm:p-5 overflow-hidden select-none"
    >
      {/* 1. Subtle Background Matrix Grid & Cybernetic Crosshairs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e90a_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e90a_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

      {/* Decorative corner HUD markers */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-cyan-500/40 tracking-widest pointer-events-none hidden sm:block">
        [ SYS-01 // COORD: 37.77° N ]
      </div>
      <div className="absolute top-3 right-4 font-mono text-[9px] text-cyan-500/40 tracking-widest pointer-events-none hidden sm:block">
        [ STATUS: NOMINAL // CORE: {isOnline ? 'CLOUD' : 'AIRGAP'} ]
      </div>
      <div className="absolute bottom-3 left-4 font-mono text-[9px] text-cyan-500/30 tracking-widest pointer-events-none hidden lg:block">
        [ PROTOCOL: LOCAL-FIRST // MEM: SECURE ]
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-cyan-500/30 tracking-widest pointer-events-none hidden lg:block">
        [ MARK VII INTERFACE ENGINE ]
      </div>

      {/* LEFT-CENTER: Compact JARVIS Greeting & Cognitive Flow Card (Understand → Plan → Execute → Learn) */}
      <div className="hidden lg:block absolute left-3 xl:left-6 top-14 z-20 w-72 xl:w-80 pointer-events-auto">
        <JARVISGreetingCard
          assistantName={assistantName}
          state={state}
          isOnline={isOnline}
        />
      </div>

      {/* 2. Top Stage Telemetry & Controls Bar */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between px-2 mb-1">
        {/* State Indicator Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md transition-all ${stateConfig.bgBadge} ${stateConfig.borderColor}`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stateConfig.dotColor}`}
            />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${stateConfig.dotColor}`} />
          </span>
          <StateIcon className={`w-3.5 h-3.5 ${stateConfig.textColor}`} />
          <span className={`font-mono text-xs font-bold tracking-wider ${stateConfig.textColor}`}>
            {stateConfig.label}
          </span>
          <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
            • {stateConfig.subtitle}
          </span>
        </div>

        {/* Quick Voice / Avatar Controls */}
        <div className="flex items-center gap-1.5">
          {onToggleAudioMute && (
            <button
              onClick={onToggleAudioMute}
              title={isAudioMuted ? 'Unmute Audio Voice Output' : 'Mute Audio Voice Output'}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isAudioMuted
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {onToggleAvatar && (
            <button
              onClick={onToggleAvatar}
              title={avatarEnabled ? 'Pause 3D Rendering (Conserve Energy)' : 'Resume 3D Avatar Rendering'}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                !avatarEnabled
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Center Stage Holographic Avatar Chamber */}
      <div className="relative z-10 w-full max-w-xl flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[360px] md:min-h-[400px]">
        {/* Ambient Radial Aura Glow */}
        <div
          className={`absolute w-72 sm:w-96 md:w-[420px] h-72 sm:h-96 md:h-[420px] rounded-full bg-gradient-to-r ${stateConfig.auraGradient} blur-3xl pointer-events-none transition-all duration-700`}
        />

        {/* Holographic Circular HUD Rings Layer (SVG) */}
        <div className="absolute w-80 sm:w-96 md:w-[440px] h-80 sm:h-96 md:h-[440px] pointer-events-none flex items-center justify-center">
          <svg
            className="w-full h-full animate-spin-slow opacity-60"
            viewBox="0 0 400 400"
            fill="none"
          >
            {/* Outer dotted orbital ring */}
            <circle
              cx="200"
              cy="200"
              r="190"
              stroke={stateConfig.ringColor}
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.4"
            />
            {/* Cardinal tick markers */}
            <line x1="200" y1="5" x2="200" y2="15" stroke={stateConfig.ringColor} strokeWidth="2" />
            <line x1="200" y1="385" x2="200" y2="395" stroke={stateConfig.ringColor} strokeWidth="2" />
            <line x1="5" y1="200" x2="15" y2="200" stroke={stateConfig.ringColor} strokeWidth="2" />
            <line x1="385" y1="200" x2="395" y2="200" stroke={stateConfig.ringColor} strokeWidth="2" />
          </svg>

          {/* Counter-rotating segmented middle gyro ring */}
          <svg
            className="absolute w-[86%] h-[86%] animate-spin-reverse-slow opacity-40"
            viewBox="0 0 350 350"
            fill="none"
          >
            <circle
              cx="175"
              cy="175"
              r="165"
              stroke={stateConfig.ringSecondary}
              strokeWidth="1.5"
              strokeDasharray="20 40 80 40"
            />
            <circle
              cx="175"
              cy="175"
              r="140"
              stroke={stateConfig.ringColor}
              strokeWidth="0.8"
              strokeDasharray="6 6"
              opacity="0.3"
            />
          </svg>

          {/* Inner reactive pulsing aura ring */}
          <div
            className={`absolute w-[68%] h-[68%] rounded-full border border-cyan-500/20 animate-pulse-glow pointer-events-none`}
            style={{
              borderColor: `${stateConfig.ringColor}44`,
              boxShadow: `0 0 20px ${stateConfig.ringColor}22, inset 0 0 20px ${stateConfig.ringColor}11`,
            }}
          />
        </div>

        {/* Existing AvatarScene (Visually Dominant) */}
        <div className="relative z-10 w-full h-full max-w-md max-h-[420px] flex items-center justify-center">
          <AvatarScene className="w-full h-full" />
        </div>
      </div>

      {/* 4. Live Speech Bubble / Contextual Transcript Readout */}
      <div className="relative z-10 w-full max-w-xl text-center px-4 my-1">
        {interimTranscript ? (
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-cyan-400 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>LIVE TRANSCRIBING</span>
            </div>
            <p className="text-sm font-mono text-cyan-200 italic animate-pulse">
              "{interimTranscript}"
            </p>
          </div>
        ) : lastAssistantMessage ? (
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/25 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span className="text-cyan-400 font-semibold">{assistantName} RESPONSE</span>
              <span>SYNTHESIZED</span>
            </div>
            <p className="text-sm text-slate-200 font-normal leading-relaxed line-clamp-3">
              "{lastAssistantMessage}"
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-sm inline-block">
            <p className="text-xs sm:text-sm font-mono text-slate-400 tracking-wide">
              "How may I assist you today?"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
