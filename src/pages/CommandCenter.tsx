/**
 * CommandCenter Page
 *
 * Central stage of JARVIS Desktop AI Command Center matching reference image:
 * - Direct 3D Avatar Centerpiece with /models/jarvis-human.glb
 * - Centered framing, celestial galaxy & observation deck backdrop
 * - Dynamic floating status speech card
 * - Optical HUD gesture sensor support
 */

import React, { useState, useEffect } from 'react';
import { JarvisAvatarCenterpiece } from '../components/Avatar/JarvisAvatarCenterpiece.tsx';
import { ReactorCoreCanvas } from '../components/HUD/ReactorCoreCanvas.tsx';
import { UltronGalaxy3D } from '../components/Galaxy/UltronGalaxy3D.tsx';
import { CameraGestureHUD } from '../components/Gestures/CameraGestureHUD.tsx';
import { YouTubeFullPlayer } from '../components/Media/YouTubeFullPlayer.tsx';
import { youtubePlayerService } from '../utils/youtubePlayerService.ts';
import { AvatarEmotion } from '../avatar/types.ts';
import { AIStateMode } from '../types/index.ts';
import { LearnedGesture } from '../types/gestures.ts';
import { User, Cpu, Sparkles, Camera, CameraOff, Youtube } from 'lucide-react';

export type StageViewportMode = 'jarvis_avatar' | 'reactor_hud' | 'galaxy_3d' | 'youtube_player';

interface CommandCenterProps {
  avatarState: AIStateMode;
  onAvatarStateChange: (state: AIStateMode) => void;
  lastAssistantMessage: string;
  interimTranscript: string;
  onGestureTrigger?: (gesture: LearnedGesture) => void;
  controlledEmote?: AvatarEmotion | null;
  onEmoteChange?: (emote: AvatarEmotion) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  avatarState,
  onAvatarStateChange,
  lastAssistantMessage,
  interimTranscript,
  onGestureTrigger,
  controlledEmote,
  onEmoteChange,
}) => {
  const [viewportMode, setViewportMode] = useState<StageViewportMode>('jarvis_avatar');
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

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none">
      {/* Subtle top mode toolbar (compact and unobtrusive) */}
      <div className="absolute top-3 right-4 z-30 flex items-center gap-2 bg-[#091122]/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-blue-500/20 text-xs">
        <button
          type="button"
          onClick={() => setViewportMode('jarvis_avatar')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
            viewportMode === 'jarvis_avatar'
              ? 'bg-blue-600 text-white font-semibold shadow-[0_0_10px_rgba(37,99,235,0.5)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3 h-3" />
          <span>AVATAR</span>
        </button>

        <button
          type="button"
          onClick={() => setViewportMode('reactor_hud')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
            viewportMode === 'reactor_hud'
              ? 'bg-blue-600 text-white font-semibold shadow-[0_0_10px_rgba(37,99,235,0.5)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3 h-3" />
          <span>REACTOR</span>
        </button>

        <button
          type="button"
          onClick={() => setViewportMode('galaxy_3d')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
            viewportMode === 'galaxy_3d'
              ? 'bg-blue-600 text-white font-semibold shadow-[0_0_10px_rgba(37,99,235,0.5)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>GALAXY</span>
        </button>

        <button
          type="button"
          onClick={() => setViewportMode('youtube_player')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
            viewportMode === 'youtube_player'
              ? 'bg-red-600 text-white font-semibold shadow-[0_0_10px_rgba(239,68,68,0.5)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Youtube className="w-3 h-3 text-red-400" />
          <span>YOUTUBE</span>
          {isMediaPlaying && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          )}
        </button>

        <div className="w-[1px] h-3.5 bg-blue-900/60 mx-0.5" />

        <button
          type="button"
          onClick={() => setShowOpticalHUD((prev) => !prev)}
          title={showOpticalHUD ? 'Hide Optical Camera HUD' : 'Enable Optical Gesture Sensor'}
          className={`p-1 rounded-full transition-colors cursor-pointer ${
            showOpticalHUD
              ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {showOpticalHUD ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Center Viewport */}
      <div className="w-full h-full flex-1 relative overflow-hidden rounded-2xl">
        {viewportMode === 'jarvis_avatar' && (
          <JarvisAvatarCenterpiece
            avatarState={avatarState}
            lastAssistantMessage={lastAssistantMessage}
            interimTranscript={interimTranscript}
            controlledEmote={controlledEmote}
            onEmoteChange={onEmoteChange}
            isMusicPlaying={isMediaPlaying}
          />
        )}

        {viewportMode === 'youtube_player' && (
          <div className="w-full h-full p-4 overflow-y-auto bg-[#050a16] rounded-2xl border border-red-500/30">
            <YouTubeFullPlayer className="max-w-4xl mx-auto" />
          </div>
        )}

        {viewportMode === 'reactor_hud' && (
          <div className="w-full h-full flex items-center justify-center bg-[#060b18] rounded-2xl border border-blue-500/25">
            <ReactorCoreCanvas
              avatarState={avatarState}
              themeColor="#00d2ff"
              className="w-full h-full"
            />
          </div>
        )}

        {viewportMode === 'galaxy_3d' && (
          <div className="w-full h-full relative rounded-2xl border border-blue-500/25 overflow-hidden">
            <UltronGalaxy3D />
          </div>
        )}
      </div>

      {/* Optical Camera Gesture HUD Overlay (if toggled on) */}
      {showOpticalHUD && (
        <div className="absolute bottom-4 right-4 z-30 w-64 rounded-xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-[#060b18]/90">
          <CameraGestureHUD onGestureTrigger={handleGestureDetected} currentAIState={avatarState} />
        </div>
      )}
    </div>
  );
};
