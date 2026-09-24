/**
 * AnimationMatrixDeck Component
 *
 * Cinematic 3D Kinematic Animation Matrix HUD:
 * - Real-time animation clip matrix selector with duration and category tagging
 * - Interactive timeline scrubber with frame-stepping (-0.1s / +0.1s)
 * - Loop modes: Repeat, Play Once, Ping-Pong
 * - Playback direction: Forward (+1x) vs. Reverse (-1x)
 * - Kinetic speed presets: 0.25x (Slow-Mo), 0.5x, 1.0x, 1.5x, 2.0x, 3.0x
 * - Smooth crossfade blending transitions (0.1s to 1.5s)
 * - Action weight slider (0% to 100% motion amplitude)
 * - Skeleton bone wireframe rig overlay toggle with bone count telemetry
 * - Compact floating dock with 1-click expand into Full Matrix HUD console
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  FastForward,
  Rewind,
  SkipBack,
  SkipForward,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  Sliders,
  Flame,
  Activity,
  Box,
  Compass,
  Zap,
  Volume2,
} from 'lucide-react';
import {
  AnimationTrackData,
  AnimationLoopMode,
  AnimationDirection,
} from '../../types/glbModels.ts';
import { soundFx } from '../../utils/audioEffects.ts';

interface AnimationMatrixDeckProps {
  tracks: AnimationTrackData[];
  selectedAnimation: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loopMode: AnimationLoopMode;
  playbackDirection: AnimationDirection;
  blendDuration: number;
  actionWeight: number;
  showSkeleton: boolean;
  boneCount: number;
  isProcedural: boolean;
  onPlayPauseToggle: () => void;
  onSelectAnimation: (name: string, blendDuration?: number) => void;
  onScrub: (timeSec: number) => void;
  onStepFrame: (deltaSec: number) => void;
  onSpeedChange: (speed: number) => void;
  onLoopModeChange: (mode: AnimationLoopMode) => void;
  onPlaybackDirectionChange: (dir: AnimationDirection) => void;
  onBlendDurationChange: (dur: number) => void;
  onWeightChange: (weight: number) => void;
  onToggleSkeleton: () => void;
}

export const AnimationMatrixDeck: React.FC<AnimationMatrixDeckProps> = ({
  tracks,
  selectedAnimation,
  isPlaying,
  currentTime,
  duration,
  speed,
  loopMode,
  playbackDirection,
  blendDuration,
  actionWeight,
  showSkeleton,
  boneCount,
  isProcedural,
  onPlayPauseToggle,
  onSelectAnimation,
  onScrub,
  onStepFrame,
  onSpeedChange,
  onLoopModeChange,
  onPlaybackDirectionChange,
  onBlendDurationChange,
  onWeightChange,
  onToggleSkeleton,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  const safeDuration = duration > 0 ? duration : 1.0;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));

  const formatTime = (sec: number) => {
    const s = Math.max(0, sec);
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(2);
    return `${mins > 0 ? `${mins}:` : ''}${secs.padStart(5, '0')}s`;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'LOCOMOTION':
        return 'border-cyan-500/60 text-cyan-300 bg-cyan-950/40';
      case 'ACTION':
        return 'border-red-500/60 text-red-300 bg-red-950/40';
      case 'EMOTE':
        return 'border-amber-500/60 text-amber-300 bg-amber-950/40';
      case 'IDLE':
        return 'border-emerald-500/60 text-emerald-300 bg-emerald-950/40';
      case 'STANCE':
        return 'border-purple-500/60 text-purple-300 bg-purple-950/40';
      default:
        return 'border-zinc-700 text-zinc-300 bg-zinc-900/60';
    }
  };

  const filteredTracks = tracks.filter((t) => {
    if (activeCategoryFilter === 'ALL') return true;
    return t.category === activeCategoryFilter;
  });

  const categories = ['ALL', ...Array.from(new Set(tracks.map((t) => t.category)))];

  return (
    <>
      {/* 1. FLOATING BOTTOM-LEFT DOCKED HUD */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto font-mono select-none">
        <div className="bg-[#070912]/95 border border-red-900/70 p-2.5 rounded-xs backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.85)] max-w-sm sm:max-w-md w-full flex flex-col gap-2 transition-all">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isPlaying && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-red-500' : 'bg-zinc-600'}`} />
              </span>

              <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5 tracking-wider">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>ANIMATION MATRIX</span>
              </span>

              <span className="text-[9px] px-1.5 py-0.2 bg-red-950/80 border border-red-800/80 text-red-300 rounded-2xs font-bold">
                {tracks.length} CLIPS
              </span>

              {boneCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 rounded-2xs font-bold hidden sm:inline-flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5" />
                  {boneCount} BONES
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Skeleton Rig Visualizer Toggle */}
              {boneCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onToggleSkeleton();
                  }}
                  title={showSkeleton ? 'Hide Skeleton Rig' : 'Show Skeleton Bone Rig'}
                  className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    showSkeleton
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-[#0e1018] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>🦴</span>
                  <span className="hidden sm:inline">RIG</span>
                </button>
              )}

              {/* Expand to Full Matrix Console */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsExpanded(!isExpanded);
                }}
                title={isExpanded ? 'Minimize Matrix' : 'Expand Full Matrix Console'}
                className="px-1.5 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 rounded-xs text-[9px] font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                <span className="hidden sm:inline">{isExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
              </button>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="truncate max-w-[170px] font-bold text-zinc-200 flex items-center gap-1">
                <span className="text-red-400">▶</span>
                {selectedAnimation || 'Standby'}
              </span>

              <div className="flex items-center gap-1 text-[9px]">
                <span className="text-red-400 font-bold">{formatTime(currentTime)}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Custom Scrub Slider */}
            <div className="relative flex items-center h-4 group cursor-pointer">
              <div className="absolute inset-x-0 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-red-500 to-cyan-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <input
                type="range"
                min={0}
                max={safeDuration}
                step={0.01}
                value={currentTime}
                onChange={(e) => onScrub(parseFloat(e.target.value))}
                className="absolute inset-x-0 w-full h-4 opacity-0 cursor-pointer z-10"
              />

              {/* Scrubber thumb glow indicator */}
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_#ef4444] border border-white pointer-events-none transition-all transform -translate-x-1/2"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Playback Controls & Frame Stepping */}
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <div className="flex items-center gap-1">
              {/* Step -0.1s */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onStepFrame(-0.1);
                }}
                title="Step back 0.1s"
                className="p-1 bg-[#0d101a] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xs cursor-pointer"
              >
                <SkipBack className="w-3 h-3" />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onPlayPauseToggle();
                }}
                className={`px-3 py-1 rounded-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                    : 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                }`}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              {/* Step +0.1s */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onStepFrame(0.1);
                }}
                title="Step forward 0.1s"
                className="p-1 bg-[#0d101a] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xs cursor-pointer"
              >
                <SkipForward className="w-3 h-3" />
              </button>

              {/* Loop Mode Cycle */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  const modes: AnimationLoopMode[] = ['REPEAT', 'ONCE', 'PING_PONG'];
                  const nextIndex = (modes.indexOf(loopMode) + 1) % modes.length;
                  onLoopModeChange(modes[nextIndex]);
                }}
                title={`Loop Mode: ${loopMode}`}
                className="px-1.5 py-1 bg-[#0d101a] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xs text-[9px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Repeat className="w-3 h-3 text-red-400" />
                <span>{loopMode}</span>
              </button>
            </div>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-0.5 text-[9px]">
              {[0.25, 0.5, 1.0, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onSpeedChange(spd);
                  }}
                  className={`px-1.5 py-0.5 rounded-2xs cursor-pointer transition-all ${
                    speed === spd
                      ? 'bg-red-600 text-white font-bold shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Tabs in Docked HUD */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5 text-[9px]">
            {categories.map((cat) => {
              const isCatActive = activeCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveCategoryFilter(cat);
                  }}
                  className={`px-1.5 py-0.5 rounded-2xs font-bold transition-all cursor-pointer shrink-0 border ${
                    isCatActive
                      ? 'bg-red-600 text-white border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Quick Track Chips (Horizontal Scroller) */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5 pt-0.5">
            {filteredTracks.map((track) => {
              const isSelected = track.name === selectedAnimation;
              return (
                <button
                  key={track.name}
                  type="button"
                  onClick={() => {
                    onSelectAnimation(track.name, blendDuration);
                  }}
                  className={`px-2 py-1 rounded-xs shrink-0 text-[9px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                      : 'bg-[#0d101a] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {isSelected && (
                    <span className="flex items-center gap-0.5 h-2">
                      <span className="w-0.5 h-2 bg-red-400 animate-pulse" />
                      <span className="w-0.5 h-1.5 bg-red-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <span className="w-0.5 h-2.5 bg-red-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </span>
                  )}
                  <span>{track.name}</span>
                  <span className="text-[8px] text-zinc-500 font-mono">
                    {track.duration > 0 ? `${track.duration.toFixed(1)}s` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. FULL MATRIX HUD CONSOLE MODAL (When Expanded) */}
      {isExpanded && (
        <div className="absolute inset-3 sm:inset-6 z-40 bg-[#060810]/95 border border-red-600/80 rounded-xs backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden font-mono select-none animate-in fade-in zoom-in-95 duration-150">
          {/* Header Bar */}
          <div className="bg-[#0b0e1a] border-b border-red-950/80 p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xs bg-red-950/90 border border-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <Flame className="w-5 h-5 text-red-400 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-100 tracking-wider uppercase">
                    CYBERNETIC ANIMATION MATRIX CONSOLE
                  </h2>
                  <span className="text-[9px] px-2 py-0.5 bg-red-950 border border-red-700 text-red-300 font-bold">
                    ACTIVE ARMATURE SEQUENCER
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Real-time multi-track blending, kinematic scrub timeline, loop modes & bone visualizer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsExpanded(false);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xs text-xs font-bold transition-all shadow-[0_0_12px_rgba(239,68,68,0.5)] cursor-pointer flex items-center gap-1.5"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>MINIMIZE MATRIX</span>
              </button>
            </div>
          </div>

          {/* Main Matrix Content (Tracks Grid + Kinetic Deck) */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {/* Top Toolbar: Category Filters & Telemetry */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500 font-bold mr-1">FILTER:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setActiveCategoryFilter(cat);
                    }}
                    className={`px-2 py-0.8 rounded-xs text-[10px] font-bold transition-all cursor-pointer ${
                      activeCategoryFilter === cat
                        ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="px-2 py-0.5 bg-[#0e1220] border border-cyan-900 text-cyan-300 rounded-xs">
                  TOTAL TRACKS: <strong className="text-white">{tracks.length}</strong>
                </span>
                {boneCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#0e1220] border border-cyan-900 text-cyan-300 rounded-xs">
                    BONES: <strong className="text-white">{boneCount}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Kinetic Tracks Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredTracks.map((track) => {
                const isSelected = track.name === selectedAnimation;
                return (
                  <div
                    key={track.name}
                    className={`p-3 rounded-xs border transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                        : 'bg-[#0a0c16] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-2xs font-bold border ${getCategoryColor(track.category)}`}>
                          {track.category}
                        </span>

                        <span className="text-[10px] text-zinc-400 font-mono">
                          {track.duration > 0 ? `${track.duration.toFixed(2)}s` : 'Continuous'}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
                        <span>{track.name}</span>
                      </h3>

                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        {track.tracksCount > 0
                          ? `${track.tracksCount} Kinematic Keyframe Channels`
                          : 'Procedural Shader & Axial Modulation'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                        {isSelected && isPlaying ? (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <Activity className="w-3 h-3 text-red-400 animate-spin" />
                            PLAYING
                          </span>
                        ) : (
                          <span>STANDBY</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectAnimation(track.name, blendDuration);
                        }}
                        className={`px-3 py-1 rounded-xs text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>{isSelected ? 'ACTIVE' : 'TRIGGER'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Parameter Rack: Blending, Direction, Rig, Loop Mode */}
            <div className="bg-[#0a0d18] border border-zinc-800/80 p-3 rounded-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-auto">
              {/* Blend Duration Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 font-bold">CROSS-FADE BLEND</span>
                  <span className="text-red-400 font-bold">{blendDuration.toFixed(2)}s</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1.5}
                  step={0.05}
                  value={blendDuration}
                  onChange={(e) => onBlendDurationChange(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
                <span className="text-[9px] text-zinc-500">Smooth quaternion slerp transition</span>
              </div>

              {/* Action Weight (Motion Amplitude) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 font-bold">ACTION WEIGHT</span>
                  <span className="text-cyan-400 font-bold">{Math.round(actionWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={actionWeight}
                  onChange={(e) => onWeightChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
                <span className="text-[9px] text-zinc-500">Modulate kinematic influence</span>
              </div>

              {/* Playback Direction & Loop Mode */}
              <div className="space-y-1">
                <span className="text-zinc-400 font-bold text-[10px]">PLAYBACK DIRECTION</span>
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onPlaybackDirectionChange('FORWARD');
                    }}
                    className={`flex-1 py-1 rounded-xs text-[10px] font-bold border transition-all cursor-pointer ${
                      playbackDirection === 'FORWARD'
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    FORWARD ▶
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onPlaybackDirectionChange('REVERSE');
                    }}
                    className={`flex-1 py-1 rounded-xs text-[10px] font-bold border transition-all cursor-pointer ${
                      playbackDirection === 'REVERSE'
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    ◀ REVERSE
                  </button>
                </div>
              </div>

              {/* Skeleton Rig Visualizer Toggle */}
              <div className="space-y-1">
                <span className="text-zinc-400 font-bold text-[10px]">KINEMATIC SKELETON</span>
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onToggleSkeleton();
                    }}
                    disabled={boneCount === 0}
                    className={`w-full py-1 rounded-xs text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      showSkeleton
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    <span>🦴</span>
                    <span>{showSkeleton ? 'SKELETON OVERLAY ON' : 'ENABLE BONE OVERLAY'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
