import React from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  RotateCw,
  Gauge,
  Sparkles,
  Flame,
  Shield,
  Zap,
} from 'lucide-react';
import { LoopMode } from '../../types/glbModels.ts';

interface JarvisAnimationTimelineProps {
  currentAnimation: string;
  onSelectPreset: (presetName: string) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  loopMode: LoopMode;
  onToggleLoop: () => void;
  animationSpeed: number;
  onSelectSpeed: (speed: number) => void;
  currentTime: number;
  currentDuration: number;
  onScrub: (timeSec: number) => void;
}

export const JarvisAnimationTimeline: React.FC<JarvisAnimationTimelineProps> = ({
  currentAnimation,
  onSelectPreset,
  isPlaying,
  onPlayPause,
  onStop,
  loopMode,
  onToggleLoop,
  animationSpeed,
  onSelectSpeed,
  currentTime,
  currentDuration,
  onScrub,
}) => {
  // Key motion presets requested by the user:
  // Idle | Walk | Run | Fighting | Guard | Punch | Dodge
  const keyActions = [
    { key: 'Idle', label: 'IDLE', icon: Sparkles, matchKeywords: ['idle', 'stand', 'hover'] },
    { key: 'Walking', label: 'WALK', icon: Sparkles, matchKeywords: ['walk'] },
    { key: 'Running', label: 'RUN', icon: Flame, matchKeywords: ['run', 'sprint'] },
    { key: 'COMBAT_GUARD', label: 'FIGHTING', icon: Flame, matchKeywords: ['combat', 'fighting', 'guard'] },
    { key: 'COMBAT_GUARD', label: 'GUARD', icon: Shield, matchKeywords: ['guard', 'block'] },
    { key: 'RIGHT_PUNCH', label: 'PUNCH', icon: Zap, matchKeywords: ['punch', 'strike', 'jab'] },
    { key: 'DODGE_LEFT', label: 'DODGE', icon: Zap, matchKeywords: ['dodge', 'evade'] },
  ];

  const isPresetActive = (item: typeof keyActions[0]) => {
    const cur = currentAnimation.toLowerCase();
    return (
      cur === item.key.toLowerCase() ||
      item.matchKeywords.some((k) => cur.includes(k))
    );
  };

  const progressPercent =
    currentDuration > 0 ? Math.min(100, Math.max(0, (currentTime / currentDuration) * 100)) : 0;

  return (
    <div className="w-full h-18 sm:h-20 bg-[#05070e]/95 border-t border-red-950/80 px-3 sm:px-4 py-2 flex flex-col justify-between z-20 font-mono select-none backdrop-blur-md shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
      {/* 1. Horizontal Motion Trigger Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar pb-1">
        {/* Quick Action Presets */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1 hidden sm:inline">
            TIMELINE TRACK:
          </span>

          {keyActions.map((action, idx) => {
            const active = isPresetActive(action);
            return (
              <button
                key={`${action.label}-${idx}`}
                type="button"
                onClick={() => onSelectPreset(action.key)}
                className={`px-2.5 py-1 rounded-xs border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  active
                    ? 'bg-red-600 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.7)] scale-105'
                    : 'bg-[#090c17] hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Current Track Label & Time */}
        <div className="flex items-center gap-2 text-xs shrink-0 pl-2">
          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <span className="text-red-400 font-bold max-w-[120px] sm:max-w-[180px] truncate">
              {currentAnimation || 'No Clip'}
            </span>
            <span className="text-zinc-500 font-mono">
              ({currentTime.toFixed(2)}s / {currentDuration.toFixed(2)}s)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Playback Transport & Scrubber Bar */}
      <div className="flex items-center gap-3">
        {/* Play/Pause/Stop controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPlayPause}
            title={isPlaying ? 'Pause Animation' : 'Play Animation'}
            className="p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-200 rounded-xs cursor-pointer transition-colors shadow-sm"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onStop}
            title="Stop & Rewind to Frame 0"
            className="p-1.5 bg-[#090c17] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xs cursor-pointer transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            title={`Loop Mode: ${loopMode}`}
            className={`px-2 py-1 border rounded-xs text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              loopMode === 'REPEAT'
                ? 'bg-purple-950/70 border-purple-600 text-purple-300'
                : loopMode === 'PING_PONG'
                ? 'bg-cyan-950/70 border-cyan-600 text-cyan-300'
                : 'bg-[#090c17] border-zinc-800 text-zinc-500'
            }`}
          >
            <Repeat className="w-3 h-3" />
            <span className="hidden md:inline">{loopMode}</span>
          </button>
        </div>

        {/* Interactive Scrub Track */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={currentDuration || 1}
            step="0.01"
            value={currentTime}
            onChange={(e) => onScrub(parseFloat(e.target.value))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#0c1020] rounded-full overflow-hidden border border-zinc-800"
          />
        </div>

        {/* Speed Selector (0.5x / 1x / 1.5x / 2x) */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] text-zinc-500 hidden sm:inline">SPEED:</span>
          {[0.5, 1.0, 1.5, 2.0].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onSelectSpeed(spd)}
              className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold border transition-colors cursor-pointer ${
                animationSpeed === spd
                  ? 'bg-red-600 text-white border-red-400 shadow-sm'
                  : 'bg-[#090c17] text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
