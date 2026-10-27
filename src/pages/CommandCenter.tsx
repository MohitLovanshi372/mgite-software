/**
 * CommandCenter Page (Golden Space AI Interface)
 *
 * Centerpiece of JARVIS:
 * - Animated Golden AI Energy Core surrounded by slowly rotating holographic rings
 * - Real-time reaction to actual JARVIS states (Idle, Listening, Thinking, Speaking, Completed)
 * - Spacious starfield integration
 * - Clean, elegant assistant speech transcription readout
 * - Non-intrusive mode switching for GLB Studio, Galaxy, and YouTube
 */

import React, { useState, useEffect } from 'react';
import { GoldenAICore } from '../components/HUD/GoldenAICore.tsx';
import { YouTubeFullPlayer } from '../components/Media/YouTubeFullPlayer.tsx';
import { UltronGalaxy3D } from '../components/Galaxy/UltronGalaxy3D.tsx';
import { JarvisAvatarCenterpiece } from '../components/Avatar/JarvisAvatarCenterpiece.tsx';
import { CameraGestureHUD } from '../components/Gestures/CameraGestureHUD.tsx';
import { youtubePlayerService } from '../utils/youtubePlayerService.ts';
import { ultronVoice } from '../utils/ultronVoice.ts';
import { AvatarEmotion } from '../avatar/types.ts';
import { AIStateMode } from '../types/index.ts';
import { LearnedGesture } from '../types/gestures.ts';
import { Sparkles, Cpu, Youtube, Box, Camera, CameraOff, Volume2 } from 'lucide-react';

export type StageViewportMode = 'golden_core' | 'jarvis_avatar' | 'galaxy_3d' | 'youtube_player';

interface CommandCenterProps {
  avatarState: AIStateMode;
  onAvatarStateChange: (state: AIStateMode) => void;
  lastAssistantMessage: string;
  interimTranscript: string;
  onGestureTrigger?: (gesture: LearnedGesture) => void;
  controlledEmote?: AvatarEmotion | null;
  onEmoteChange?: (emote: AvatarEmotion) => void;
  isAutoSpeechActive?: boolean;
  onToggleAutoSpeech?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  avatarState,
  onAvatarStateChange,
  lastAssistantMessage,
  interimTranscript,
  onGestureTrigger,
  controlledEmote,
  onEmoteChange,
  isAutoSpeechActive = false,
  onToggleAutoSpeech,
}) => {
  const [viewportMode, setViewportMode] = useState<StageViewportMode>('golden_core');
  const [showOpticalHUD, setShowOpticalHUD] = useState<boolean>(false);
  const [isMediaPlaying, setIsMediaPlaying] = useState<boolean>(youtubePlayerService.getState().isPlaying);

  useEffect(() => {
    const unsub = youtubePlayerService.subscribe((s) => {
      setIsMediaPlaying(s.isPlaying);
    });
    return () => unsub();
  }, []);

  const handleGestureDetected = (gesture: LearnedGesture) => {
    if (gesture.mappedState) {
      onAvatarStateChange(gesture.mappedState);
    }
    if (onGestureTrigger) {
      onGestureTrigger(gesture);
    }
  };

  // State descriptor text for the golden HUD
  const getStateTelemetry = () => {
    switch (avatarState) {
      case 'LISTENING':
        return { label: 'LISTENING', detail: 'Awaiting voice directive in Hindi or English', color: 'text-[#FFD76A]' };
      case 'THINKING':
      case 'EXECUTING':
        return { label: 'THINKING', detail: 'Processing neural intent with Gemini AI', color: 'text-[#FFD76A]' };
      case 'SPEAKING':
        return { label: 'SPEAKING', detail: 'Synthesizing voice response with Fish Audio', color: 'text-[#F59E0B]' };
      case 'SUCCESS':
        return { label: 'COMPLETED', detail: 'Directive executed successfully', color: 'text-[#FFD76A]' };
      case 'SECURITY_ALERT':
        return { label: 'SECURITY ACTIVE', detail: 'Airgap sentinel operational', color: 'text-amber-500' };
      default:
        return { label: 'IDLE', detail: 'Standing by for directives', color: 'text-[#D4AF37]' };
    }
  };

  const stateInfo = getStateTelemetry();

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none">
      {/* Subtle top mode toolbar (minimal, non-cluttered golden glassmorphism) */}
      <div className="absolute top-2 right-4 z-30 flex items-center gap-1.5 bg-[#030712]/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#D4AF37]/20 text-xs">
        <button
          type="button"
          onClick={() => setViewportMode('golden_core')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            viewportMode === 'golden_core'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD76A] text-[#030712] font-semibold shadow-[0_0_12px_rgba(212,175,55,0.4)]'
              : 'text-slate-400 hover:text-[#FFD76A]'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>AI CORE</span>
        </button>

        <button
          type="button"
          onClick={() => setViewportMode('jarvis_avatar')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            viewportMode === 'jarvis_avatar'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD76A] text-[#030712] font-semibold shadow-[0_0_12px_rgba(212,175,55,0.4)]'
              : 'text-slate-400 hover:text-[#FFD76A]'
          }`}
        >
          <Box className="w-3 h-3" />
          <span>AVATAR 3D</span>
        </button>

        <button
          type="button"
          onClick={() => setViewportMode('galaxy_3d')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            viewportMode === 'galaxy_3d'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD76A] text-[#030712] font-semibold shadow-[0_0_12px_rgba(212,175,55,0.4)]'
              : 'text-slate-400 hover:text-[#FFD76A]'
          }`}
        >
          <Cpu className="w-3 h-3" />
          <span>GALAXY</span>
        </button>

        <button
          type="button"
          onClick={() => setViewportMode('youtube_player')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            viewportMode === 'youtube_player'
              ? 'bg-red-600 text-white font-semibold shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Youtube className="w-3 h-3 text-red-400" />
          <span>YOUTUBE</span>
          {isMediaPlaying && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          )}
        </button>

        <div className="w-[1px] h-3 bg-[#D4AF37]/30 mx-0.5" />

        <button
          type="button"
          onClick={() => setShowOpticalHUD((prev) => !prev)}
          title={showOpticalHUD ? 'Hide Gesture HUD' : 'Enable Optical Gesture Sensor'}
          className={`p-1 rounded-full transition-colors cursor-pointer ${
            showOpticalHUD
              ? 'text-[#FFD76A] bg-[#D4AF37]/20 border border-[#D4AF37]/50'
              : 'text-slate-500 hover:text-[#FFD76A]'
          }`}
        >
          {showOpticalHUD ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Center Stage Viewport */}
      <div className="w-full h-full flex-1 relative overflow-hidden rounded-2xl flex flex-col items-center justify-between">
        {viewportMode === 'golden_core' && (
          <div className="w-full h-full flex flex-col items-center justify-between relative px-4 py-2">
            {/* Core & Space Atmosphere Container */}
            <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
              <GoldenAICore
                state={avatarState}
                size={440}
                onCoreClick={() => {
                  // Interactive manual click cycles to LISTENING or IDLE
                  if (avatarState === 'IDLE') {
                    onAvatarStateChange('LISTENING');
                  } else {
                    onAvatarStateChange('IDLE');
                  }
                }}
              />
            </div>

            {/* Bottom Telemetry & Clean Speech Readout (Elegant, Uncluttered) */}
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2 pb-1 z-20">
              {/* State Status Indicator */}
              <div className="flex items-center gap-2 text-xs tracking-widest font-mono uppercase text-[#D4AF37]/90">
                <span className={`w-2 h-2 rounded-full ${avatarState === 'SPEAKING' ? 'bg-[#FFD76A] animate-ping' : avatarState === 'LISTENING' ? 'bg-[#FFD76A] animate-pulse' : 'bg-[#D4AF37]'}`} />
                <span className={stateInfo.color}>{stateInfo.label}</span>
                <span className="text-slate-500 font-sans">·</span>
                <span className="text-slate-400 font-sans tracking-normal normal-case text-xs">{stateInfo.detail}</span>
              </div>

              {/* Speech / Assistant Message Card */}
              <div className="w-full px-5 py-3 rounded-xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/25 shadow-[0_0_20px_rgba(212,175,55,0.06)] text-center transition-all duration-300">
                {interimTranscript ? (
                  <div className="flex items-center justify-center gap-2 text-[#FFD76A] text-sm italic font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD76A] animate-ping" />
                    <span>"{interimTranscript}"</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2.5 text-[#E8EAF0] text-sm font-sans leading-relaxed">
                    {avatarState === 'SPEAKING' && (
                      <Volume2 className="w-4 h-4 text-[#FFD76A] animate-pulse shrink-0" />
                    )}
                    <p className="max-w-xl truncate">
                      {lastAssistantMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewportMode === 'jarvis_avatar' && (
          <JarvisAvatarCenterpiece
            avatarState={avatarState}
            lastAssistantMessage={lastAssistantMessage}
            interimTranscript={interimTranscript}
            controlledEmote={controlledEmote}
            onEmoteChange={onEmoteChange}
            isMusicPlaying={isMediaPlaying}
            isAutoSpeechActive={isAutoSpeechActive}
            onToggleAutoSpeech={onToggleAutoSpeech}
          />
        )}

        {viewportMode === 'youtube_player' && (
          <div className="w-full h-full p-4 overflow-y-auto bg-[#030712] rounded-2xl border border-[#D4AF37]/25">
            <YouTubeFullPlayer className="max-w-4xl mx-auto" />
          </div>
        )}

        {viewportMode === 'galaxy_3d' && (
          <div className="w-full h-full relative rounded-2xl border border-[#D4AF37]/25 overflow-hidden">
            <UltronGalaxy3D />
          </div>
        )}
      </div>

      {/* Optical Camera Gesture HUD Overlay (if toggled on) */}
      {showOpticalHUD && (
        <div className="absolute bottom-4 right-4 z-30 w-64 rounded-xl overflow-hidden border border-[#D4AF37]/40 shadow-2xl bg-[#030712]/95 backdrop-blur-md">
          <CameraGestureHUD onGestureTrigger={handleGestureDetected} currentAIState={avatarState} />
        </div>
      )}
    </div>
  );
};
