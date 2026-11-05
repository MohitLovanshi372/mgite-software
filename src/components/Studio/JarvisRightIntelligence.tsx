import React from 'react';
import {
  Activity,
  Shield,
  Zap,
  Radio,
  Cpu,
  Layers,
  Crosshair,
  Sparkles,
  Hand,
  Clock,
  Flame,
} from 'lucide-react';

interface JarvisRightIntelligenceProps {
  currentState: 'IDLE' | 'WALKING' | 'RUNNING' | 'FIGHTING' | string;
  detectedGesture: string;
  gestureConfidence: number;
  handTracking: boolean;
  bodyTracking: boolean;
  currentAnimation: string;
  currentTime: number;
  currentDuration: number;
  animationSpeed: number;
  fps: number;
  frameTime: number;
  polygons: number;
  vertices: number;
  meshNodes: number;
  materials: number;
}

export const JarvisRightIntelligence: React.FC<JarvisRightIntelligenceProps> = ({
  currentState,
  detectedGesture,
  gestureConfidence,
  handTracking,
  bodyTracking,
  currentAnimation,
  currentTime,
  currentDuration,
  animationSpeed,
  fps,
  frameTime,
  polygons,
  vertices,
  meshNodes,
  materials,
}) => {
  const animProgress = currentDuration > 0 ? Math.min(100, Math.round((currentTime / currentDuration) * 100)) : 0;

  // Normalized state styling
  const stateColor =
    currentState === 'FIGHTING'
      ? 'text-red-400 border-red-500 bg-red-950/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
      : currentState === 'RUNNING'
      ? 'text-emerald-400 border-emerald-500 bg-emerald-950/80'
      : currentState === 'WALKING'
      ? 'text-cyan-400 border-cyan-500 bg-cyan-950/80'
      : 'text-zinc-300 border-zinc-700 bg-zinc-900/80';

  return (
    <aside className="w-72 sm:w-80 h-full bg-[#05070e]/95 border-l border-red-950/80 flex flex-col font-mono select-none text-xs backdrop-blur-md shrink-0 z-20 overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="px-3.5 py-2.5 bg-[#080b16] border-b border-zinc-800/90 flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-300 tracking-wider flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          LIVE INTELLIGENCE
        </span>
        <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          REALTIME
        </span>
      </div>

      {/* Content Stack */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {/* 1. CURRENT STATE */}
        <div className="bg-[#070912] border border-zinc-800 p-2.5 rounded-xs space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1 text-zinc-400">
              <Radio className="w-3 h-3 text-red-400" />
              CURRENT STATE
            </span>
            <span>KINEMATIC MODE</span>
          </div>

          <div className={`px-3 py-2 rounded-xs border text-center font-bold tracking-widest text-sm uppercase transition-all ${stateColor}`}>
            {currentState}
          </div>
        </div>

        {/* 2. DETECTED GESTURE */}
        <div className="bg-[#070912] border border-zinc-800 p-2.5 rounded-xs space-y-2 shadow-md">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              DETECTED GESTURE
            </span>
            <span className="text-zinc-500 font-mono">
              {Math.round(gestureConfidence * 100)}% MATCH
            </span>
          </div>

          <div className="bg-[#0b0e1b] border border-zinc-800 px-3 py-2 rounded-xs flex items-center justify-between">
            <span className="font-bold text-zinc-100 text-xs tracking-wider uppercase flex items-center gap-1.5 truncate">
              {detectedGesture !== 'NONE' && detectedGesture !== 'None' ? (
                <span className="text-red-400 animate-pulse font-black">
                  {detectedGesture}
                </span>
              ) : (
                <span className="text-zinc-400">NONE // IDLE</span>
              )}
            </span>
            {gestureConfidence > 0 && (
              <span className="px-1.5 py-0.2 bg-red-950/80 border border-red-700 text-red-300 text-[9px] font-bold rounded-2xs">
                CONFIRMED
              </span>
            )}
          </div>

          {/* Confidence Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-zinc-500">
              <span>CONFIDENCE ACCURACY</span>
              <span className="text-zinc-300 font-bold">{Math.round(gestureConfidence * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#0b0e1a] rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-red-500 transition-all duration-150 shadow-[0_0_8px_#ef4444]"
                style={{ width: `${Math.max(4, Math.round(gestureConfidence * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. TRACKING PIPELINE */}
        <div className="bg-[#070912] border border-zinc-800 p-2.5 rounded-xs space-y-2 shadow-md">
          <div className="text-[10px] text-zinc-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              OPTICAL TRACKING
            </span>
            <span className="text-[9px] text-cyan-300 font-bold">HARDWARE SYNC</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-[#0b0e1b] border border-zinc-800/80 p-2 rounded-xs flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1">
                <Hand className="w-2.5 h-2.5 text-cyan-400" />
                HAND TRACKING
              </span>
              <span className={`text-xs font-bold ${handTracking ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {handTracking ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
              </span>
            </div>

            <div className="bg-[#0b0e1b] border border-zinc-800/80 p-2 rounded-xs flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1">
                <Crosshair className="w-2.5 h-2.5 text-red-400" />
                BODY TRACKING
              </span>
              <span className={`text-xs font-bold ${bodyTracking ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {bodyTracking ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. ACTIVE ANIMATION */}
        <div className="bg-[#070912] border border-zinc-800 p-2.5 rounded-xs space-y-2 shadow-md">
          <div className="text-[10px] text-zinc-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              ACTIVE ANIMATION
            </span>
            <span className="text-[9px] text-purple-300 font-bold">{animationSpeed}x SPEED</span>
          </div>

          <div className="bg-[#0b0e1b] border border-zinc-800 px-2.5 py-1.5 rounded-xs flex items-center justify-between">
            <span className="font-bold text-zinc-200 text-xs truncate">
              {currentAnimation || 'None'}
            </span>
            <span className="text-[9px] text-zinc-400 font-mono shrink-0 ml-1">
              {currentTime.toFixed(1)}s / {currentDuration.toFixed(1)}s
            </span>
          </div>

          {/* Scrubber progress */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-[#0b0e1a] rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-purple-500 transition-all duration-75 shadow-[0_0_8px_#a855f7]"
                style={{ width: `${animProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5. HARDWARE PERFORMANCE */}
        <div className="bg-[#070912] border border-zinc-800 p-2.5 rounded-xs space-y-2 shadow-md">
          <div className="text-[10px] text-zinc-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              HARDWARE TELEMETRY
            </span>
            <span className="text-[9px] text-zinc-500">WebGL 2.0</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="bg-[#0b0e1b] border border-zinc-800/80 p-1.5 rounded-xs flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold">FRAME RATE</span>
              <span className="text-xs font-bold text-cyan-300">
                {fps > 0 ? `${fps} FPS` : '60 FPS'}
              </span>
            </div>

            <div className="bg-[#0b0e1b] border border-zinc-800/80 p-1.5 rounded-xs flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold">FRAME TIME</span>
              <span className="text-xs font-bold text-zinc-200">
                {frameTime > 0 ? `${frameTime} ms` : '16.6 ms'}
              </span>
            </div>

            <div className="bg-[#0b0e1b] border border-zinc-800/80 p-1.5 rounded-xs flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold">POLYGONS</span>
              <span className="text-xs font-bold text-zinc-200">
                {polygons.toLocaleString()} Tris
              </span>
            </div>

            <div className="bg-[#0b0e1b] border border-zinc-800/80 p-1.5 rounded-xs flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold">VERTICES</span>
              <span className="text-xs font-bold text-zinc-200">
                {vertices.toLocaleString()} Verts
              </span>
            </div>

            <div className="bg-[#0b0e1b] border border-zinc-800/80 p-1.5 rounded-xs flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold">MESH NODES</span>
              <span className="text-xs font-bold text-red-400">
                {meshNodes} Nodes
              </span>
            </div>

            <div className="bg-[#0b0e1b] border border-zinc-800/80 p-1.5 rounded-xs flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold">PBR SHADERS</span>
              <span className="text-xs font-bold text-purple-400">
                {materials} Materials
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
