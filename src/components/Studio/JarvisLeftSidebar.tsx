import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Box,
  Cpu,
  Layers,
  Sparkles,
  Sun,
  Flame,
  Camera,
  CameraOff,
  Crosshair,
  Activity,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  RefreshCw,
  Play,
  Pause,
  Square,
  Repeat,
  RotateCw,
  Gauge,
  Clock,
  Zap,
  Sliders,
  Eye,
  Grid,
  Shield,
  Hand,
  Check,
  Radio,
  Volume2,
  VolumeX,
  Languages,
} from 'lucide-react';
import { ultronVoice } from '../../utils/ultronVoice.ts';
import { LanguageMode } from '../../utils/pronunciationEngine.ts';
import {
  GLBModelOption,
  LightingMode,
  MaterialMode,
  AnimationTrackData,
  LoopMode,
} from '../../types/glbModels.ts';
import { GestureType } from '../../types/gestures.ts';

interface JarvisLeftSidebarProps {
  // Model state
  modelList: GLBModelOption[];
  selectedModelId: string;
  onSelectModelId: (id: string) => void;
  onUploadClick: () => void;
  onReloadModel: () => void;
  onResetCamera: () => void;
  showUrlInput: boolean;
  setShowUrlInput: (show: boolean) => void;
  customUrl: string;
  setCustomUrl: (url: string) => void;
  onLoadCustomUrl: (e: React.FormEvent) => void;

  // Specs
  meshCount: number;
  boneCount: number;
  triangleCount: number;
  vertexCount?: number;
  materialCount?: number;

  // Skeleton
  showSkeleton: boolean;
  onToggleSkeleton: () => void;

  // Animations & Playback Timeline
  animationTracks: AnimationTrackData[];
  selectedAnimation: string;
  onSelectAnimation: (name: string) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onStop?: () => void;
  loopMode?: LoopMode;
  onToggleLoop?: () => void;
  animationSpeed?: number;
  onSelectSpeed?: (speed: number) => void;
  currentTime?: number;
  currentDuration?: number;
  onScrub?: (timeSec: number) => void;

  // Materials & Shaders
  lightingMode: LightingMode;
  onSelectLightingMode: (mode: LightingMode) => void;
  materialMode: MaterialMode;
  onSelectMaterialMode: (mode: MaterialMode) => void;

  // Motion & Combat
  onSelectMotionPreset: (presetName: string) => void;
  ikMirrorEnabled: boolean;
  onToggleIkMirror: () => void;
  ikBlendWeight: number;
  onIkBlendWeightChange: (val: number) => void;

  // Camera & Tracking
  isCameraActive: boolean;
  onToggleCamera: () => void;
  handTrackingEnabled: boolean;
  onToggleHandTracking: () => void;
  bodyTrackingEnabled: boolean;
  onToggleBodyTracking: () => void;
  onSimulateGesture: (type: GestureType) => void;

  // Live Intelligence & Telemetry
  currentState?: string;
  detectedGesture?: string;
  gestureConfidence?: number;
  fps?: number;
  frameTime?: number;

  // System & Settings
  wireframe: boolean;
  onToggleWireframe: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  autoRotateSpeed: number;
  onAutoRotateSpeedChange: (speed: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showBoundingBox: boolean;
  onToggleBoundingBox: () => void;
  onSnapshot: () => void;
}

export const JarvisLeftSidebar: React.FC<JarvisLeftSidebarProps> = ({
  modelList,
  selectedModelId,
  onSelectModelId,
  onUploadClick,
  onReloadModel,
  onResetCamera,
  showUrlInput,
  setShowUrlInput,
  customUrl,
  setCustomUrl,
  onLoadCustomUrl,

  meshCount,
  boneCount,
  triangleCount,
  vertexCount = 0,
  materialCount = 0,

  showSkeleton,
  onToggleSkeleton,

  animationTracks,
  selectedAnimation,
  onSelectAnimation,
  isPlaying = true,
  onPlayPause,
  onStop,
  loopMode = 'REPEAT',
  onToggleLoop,
  animationSpeed = 1.0,
  onSelectSpeed,
  currentTime = 0,
  currentDuration = 3.0,
  onScrub,

  lightingMode,
  onSelectLightingMode,
  materialMode,
  onSelectMaterialMode,

  onSelectMotionPreset,
  ikMirrorEnabled,
  onToggleIkMirror,
  ikBlendWeight,
  onIkBlendWeightChange,

  isCameraActive,
  onToggleCamera,
  handTrackingEnabled,
  onToggleHandTracking,
  bodyTrackingEnabled,
  onToggleBodyTracking,
  onSimulateGesture,

  currentState = 'IDLE',
  detectedGesture = 'NONE',
  gestureConfidence = 0.95,
  fps = 60,
  frameTime = 16.6,

  wireframe,
  onToggleWireframe,
  autoRotate,
  onToggleAutoRotate,
  autoRotateSpeed,
  onAutoRotateSpeedChange,
  showGrid,
  onToggleGrid,
  showBoundingBox,
  onToggleBoundingBox,
  onSnapshot,
}) => {
  // Accordion state - all sections cleanly accessible on the left
  const [openSections, setOpenSections] = useState<{
    avatar: boolean;
    playback: boolean;
    motion: boolean;
    shading: boolean;
    camera: boolean;
    telemetry: boolean;
    voice: boolean;
    system: boolean;
  }>({
    avatar: true,
    playback: true,
    motion: true,
    shading: false,
    camera: false,
    telemetry: true,
    voice: false,
    system: false,
  });

  const [showVoiceSection, setShowVoiceSection] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sidebarLangMode, setSidebarLangMode] = useState<LanguageMode>(ultronVoice.getLanguageMode());
  const [sidebarVoiceText, setSidebarVoiceText] = useState('नमस्ते! सिस्टम पूरी तरह सक्रिय है। आज मैं आपकी क्या सहायता करूँ?');

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSidebarSpeak = (textToSpeak?: string) => {
    const text = (textToSpeak || sidebarVoiceText).trim();
    if (!text) return;
    if (isSpeaking) {
      ultronVoice.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    ultronVoice.speak(text, {
      languageMode: sidebarLangMode,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const animProgress =
    currentDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / currentDuration) * 100))
      : 0;

  // Format seconds to mm:ss.ms
  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const secs = Math.floor(s);
    const ms = Math.floor((s % 1) * 100);
    return `${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}s`;
  };

  return (
    <aside className="w-80 sm:w-88 h-full bg-[#05070e]/95 border-r border-red-950/80 flex flex-col font-mono select-none text-xs backdrop-blur-md shrink-0 z-20 overflow-hidden shadow-2xl">
      {/* Sidebar Top Title */}
      <div className="px-3.5 py-2.5 bg-[#080b16] border-b border-zinc-800/90 flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-200 tracking-wider flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-red-500" />
          JARVIS AVATAR STUDIO
        </span>
        <span className="px-1.5 py-0.2 bg-red-950/80 border border-red-800 text-red-300 text-[9px] font-bold">
          ALL OPTIONS
        </span>
      </div>

      {/* Scrollable Accordion Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2">
        {/* ============================================================ */}
        {/* SECTION 1: AVATAR & MODEL ASSETS                             */}
        {/* ============================================================ */}
        <div className="border border-zinc-800/80 bg-[#070912]/80 rounded-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('avatar')}
            className="w-full px-3 py-2 bg-[#0a0d1a] hover:bg-[#0e1324] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-zinc-800/70"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wider text-[11px]">
              <Box className="w-3.5 h-3.5 text-red-400" />
              <span>1. AVATAR & MODEL</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[9px] text-zinc-400 font-bold">{meshCount} MESHES</span>
              {openSections.avatar ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {openSections.avatar && (
            <div className="p-2.5 space-y-2.5">
              {/* Model Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
                  <span>SELECT ACTIVE MODEL:</span>
                  <span className="text-red-400">
                    {triangleCount > 0 ? `${(triangleCount / 1000).toFixed(1)}k Tris` : 'GLB Ready'}
                  </span>
                </div>

                <select
                  value={selectedModelId}
                  onChange={(e) => onSelectModelId(e.target.value)}
                  className="w-full bg-[#0b0e1b] border border-zinc-700 text-zinc-200 text-xs px-2 py-1.5 rounded-xs cursor-pointer focus:outline-none focus:border-red-500 font-bold"
                >
                  {modelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>

                {/* Model Action Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={onUploadClick}
                    title="Upload local .glb or .gltf file from your computer"
                    className="px-2 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-600/80 text-red-200 rounded-xs flex items-center justify-center gap-1.5 font-bold text-[10px] cursor-pointer transition-colors shadow-[0_0_8px_rgba(239,68,68,0.25)]"
                  >
                    <Upload className="w-3 h-3" />
                    <span>UPLOAD .GLB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-2 py-1.5 bg-[#0b0e1a] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xs flex items-center justify-center gap-1 text-[10px] cursor-pointer transition-colors"
                  >
                    <LinkIcon className="w-3 h-3 text-cyan-400" />
                    <span>LOAD URL</span>
                  </button>
                </div>

                {showUrlInput && (
                  <form onSubmit={onLoadCustomUrl} className="flex gap-1 pt-1">
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://.../model.glb"
                      className="flex-1 bg-[#04060c] border border-zinc-700 px-2 py-1 text-[10px] text-zinc-200 rounded-xs focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-red-900 text-white text-[10px] font-bold rounded-xs cursor-pointer hover:bg-red-800"
                    >
                      LOAD
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={onReloadModel}
                    className="px-2 py-1 bg-[#0b0e1a] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xs flex items-center justify-center gap-1 text-[9px] cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>RELOAD MODEL</span>
                  </button>
                  <button
                    type="button"
                    onClick={onResetCamera}
                    className="px-2 py-1 bg-[#0b0e1a] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xs flex items-center justify-center gap-1 text-[9px] cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>RESET CAMERA</span>
                  </button>
                </div>
              </div>

              {/* Skeleton Rig Armature */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 font-bold flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    SKELETAL ARMATURE:
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {boneCount > 0 ? `${boneCount} BONES` : 'NO ARMATURE'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onToggleSkeleton}
                  disabled={boneCount === 0}
                  className={`w-full py-1.5 px-2 rounded-xs border text-[10px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                    showSkeleton
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span>SKELETAL BONE RIG</span>
                  <span>{showSkeleton ? 'VISIBLE' : 'HIDDEN'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: ANIMATION TIMELINE & PLAYBACK CONTROLS            */}
        {/* ============================================================ */}
        <div className="border border-zinc-800/80 bg-[#070912]/80 rounded-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('playback')}
            className="w-full px-3 py-2 bg-[#0a0d1a] hover:bg-[#0e1324] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-zinc-800/70"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wider text-[11px]">
              <Play className="w-3.5 h-3.5 text-purple-400" />
              <span>2. ANIMATION & TIMELINE</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[9px] text-purple-400 font-bold">
                {animationTracks.length} TRACKS
              </span>
              {openSections.playback ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {openSections.playback && (
            <div className="p-2.5 space-y-2.5">
              {/* Track Selector Dropdown */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold block">
                  ANIMATION TRACK:
                </span>
                <select
                  value={selectedAnimation}
                  onChange={(e) => onSelectAnimation(e.target.value)}
                  className="w-full bg-[#0b0e1b] border border-zinc-700 text-zinc-200 text-xs px-2 py-1.5 rounded-xs cursor-pointer focus:outline-none focus:border-purple-500 font-bold"
                >
                  {animationTracks.map((track) => (
                    <option key={track.name} value={track.name}>
                      {track.name} ({track.duration}s • {track.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scrubber Bar */}
              <div className="space-y-1 bg-[#04060c] p-2 rounded-xs border border-zinc-800/80">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{formatTime(currentTime)}</span>
                  </span>
                  <span className="text-zinc-500">/</span>
                  <span className="font-mono text-zinc-300 font-bold">
                    {formatTime(currentDuration)}
                  </span>
                </div>

                {/* Interactive Slider */}
                <input
                  type="range"
                  min="0"
                  max={currentDuration || 1}
                  step="0.01"
                  value={currentTime}
                  onChange={(e) => onScrub?.(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />

                {/* Progress bar visual indicator */}
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-cyan-500 transition-all duration-75"
                    style={{ width: `${animProgress}%` }}
                  />
                </div>
              </div>

              {/* Playback Controls (Play, Pause, Stop, Loop) */}
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={onPlayPause}
                  className={`py-1.5 px-2 rounded-xs border font-bold flex items-center justify-center gap-1 text-[10px] cursor-pointer transition-all col-span-2 ${
                    isPlaying
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onStop}
                  className="py-1.5 px-1.5 bg-[#090c17] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xs font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Square className="w-2.5 h-2.5" />
                  <span>STOP</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleLoop}
                  className={`py-1.5 px-1.5 rounded-xs border font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    loopMode === 'REPEAT'
                      ? 'bg-red-950/60 border-red-700 text-red-300'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-500'
                  }`}
                  title={`Loop Mode: ${loopMode}`}
                >
                  <Repeat className="w-2.5 h-2.5" />
                  <span>{loopMode === 'REPEAT' ? 'LOOP' : 'ONCE'}</span>
                </button>
              </div>

              {/* Playback Speed Chips */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/80">
                <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-zinc-400" />
                  SPEED:
                </span>
                <div className="flex items-center gap-1">
                  {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onSelectSpeed?.(spd)}
                      className={`px-1.5 py-0.5 rounded-xs border text-[9px] font-bold cursor-pointer transition-all ${
                        animationSpeed === spd
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.4)]'
                          : 'bg-[#090c17] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 3: MOTION & COMBAT STANCES                           */}
        {/* ============================================================ */}
        <div className="border border-zinc-800/80 bg-[#070912]/80 rounded-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('motion')}
            className="w-full px-3 py-2 bg-[#0a0d1a] hover:bg-[#0e1324] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-zinc-800/70"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wider text-[11px]">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>3. MOTION & STANCES</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[9px] text-red-400 font-bold">1-CLICK</span>
              {openSections.motion ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {openSections.motion && (
            <div className="p-2.5 space-y-2.5">
              {/* Primary Locomotion */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold block">
                  CORE LOCOMOTION:
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'Idle', label: 'IDLE' },
                    { id: 'Walking', label: 'WALK' },
                    { id: 'Running', label: 'RUN' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => onSelectMotionPreset(btn.id)}
                      className={`py-1.5 px-2 rounded-xs border text-center font-bold text-[10px] cursor-pointer transition-all ${
                        selectedAnimation.toLowerCase().includes(btn.label.toLowerCase())
                          ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.6)] border-red-400'
                          : 'bg-[#0b0e1b] hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Combat Martial Arts Stances */}
              <div className="space-y-1 pt-1.5 border-t border-zinc-800/70">
                <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  COMBAT MARTIAL ARTS:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {[
                    { id: 'COMBAT_GUARD', label: '🛡️ GUARD STANCE' },
                    { id: 'RIGHT_PUNCH', label: '👊 RIGHT PUNCH' },
                    { id: 'LEFT_PUNCH', label: '👊 LEFT PUNCH' },
                    { id: 'UPPERCUT', label: '⚡ UPPERCUT' },
                    { id: 'KINETIC_KICK', label: '🦵 KINETIC KICK' },
                    { id: 'DODGE_LEFT', label: '◀ DODGE LEFT' },
                    { id: 'DODGE_RIGHT', label: '▶ DODGE RIGHT' },
                    { id: 'TORNADO_KICK', label: '🌪️ TORNADO KICK' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelectMotionPreset(m.id)}
                      className={`py-1.5 px-2 rounded-xs border text-left font-bold text-[9px] cursor-pointer transition-all truncate ${
                        selectedAnimation === m.id
                          ? 'bg-red-900 border-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                          : 'bg-[#090c17] hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* IK Pose Mirroring */}
              <div className="space-y-1 pt-1.5 border-t border-zinc-800/70">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 font-bold flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-cyan-400" />
                    IK POSE RETARGETING:
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {ikMirrorEnabled ? 'ENGAGED' : 'OFF'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onToggleIkMirror}
                  className={`w-full py-1.5 px-2 rounded-xs border text-[10px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                    ikMirrorEnabled
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>WEBCAM IK ARM MIRROR</span>
                  <span>{ikMirrorEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-1 text-[9px]">
                  <span className="text-zinc-500">BLEND WEIGHT:</span>
                  <span className="text-zinc-300 font-bold">{Math.round(ikBlendWeight * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ikBlendWeight}
                    onChange={(e) => onIkBlendWeightChange(parseFloat(e.target.value))}
                    className="w-24 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 4: MATERIALS & LIGHTING                              */}
        {/* ============================================================ */}
        <div className="border border-zinc-800/80 bg-[#070912]/80 rounded-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('shading')}
            className="w-full px-3 py-2 bg-[#0a0d1a] hover:bg-[#0e1324] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-zinc-800/70"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wider text-[11px]">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>4. MATERIALS & LIGHTING</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[9px] text-amber-400 font-bold uppercase">{lightingMode}</span>
              {openSections.shading ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {openSections.shading && (
            <div className="p-2.5 space-y-2.5">
              {/* Lighting Presets */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold block">
                  LIGHTING ENVIRONMENT:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  {[
                    { id: 'crimson_forge', label: 'CRIMSON FORGE' },
                    { id: 'studio', label: 'STUDIO HIGH-KEY' },
                    { id: 'galactic_starlight', label: 'GALAXY STARLIGHT' },
                    { id: 'cyber_neon', label: 'CYBER NEON' },
                  ].map((lt) => (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => onSelectLightingMode(lt.id as LightingMode)}
                      className={`py-1 px-1.5 rounded-xs border text-center font-bold cursor-pointer transition-colors ${
                        lightingMode === lt.id
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                          : 'bg-[#090c17] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Shaders */}
              <div className="space-y-1 pt-1.5 border-t border-zinc-800/70">
                <span className="text-[10px] text-zinc-400 font-bold block">
                  PBR SHADER OVERRIDE:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  {[
                    { id: 'original', label: 'ORIGINAL PBR' },
                    { id: 'crimson_glow', label: 'CRIMSON GLOW' },
                    { id: 'obsidian_titanium', label: 'TITANIUM CHROME' },
                    { id: 'cyber_matrix', label: 'CYBER MATRIX' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelectMaterialMode(m.id as MaterialMode)}
                      className={`py-1 px-1.5 rounded-xs border text-center font-bold cursor-pointer transition-colors ${
                        materialMode === m.id
                          ? 'bg-red-950/80 border-red-500 text-red-200'
                          : 'bg-[#090c17] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 5: LIVE INTELLIGENCE & TELEMETRY                     */}
        {/* ============================================================ */}
        <div className="border border-zinc-800/80 bg-[#070912]/80 rounded-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('telemetry')}
            className="w-full px-3 py-2 bg-[#0a0d1a] hover:bg-[#0e1324] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-zinc-800/70"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wider text-[11px]">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>5. LIVE TELEMETRY</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[9px] text-cyan-400 font-bold">{fps} FPS</span>
              {openSections.telemetry ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {openSections.telemetry && (
            <div className="p-2.5 space-y-2">
              {/* Kinematic State & Gesture */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-[#04060c] p-2 border border-zinc-800/80 rounded-xs">
                  <span className="text-[8px] text-zinc-500 block">KINEMATIC STATE:</span>
                  <span className="text-xs font-bold text-red-400 tracking-wider uppercase">
                    {currentState}
                  </span>
                </div>

                <div className="bg-[#04060c] p-2 border border-zinc-800/80 rounded-xs">
                  <span className="text-[8px] text-zinc-500 block">DETECTED GESTURE:</span>
                  <span className="text-xs font-bold text-cyan-300 tracking-wider truncate block">
                    {detectedGesture}
                  </span>
                </div>
              </div>

              {/* Confidence & FPS telemetry */}
              <div className="bg-[#04060c] p-2 border border-zinc-800/80 rounded-xs space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">GESTURE CONFIDENCE:</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round(gestureConfidence * 100)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150"
                    style={{ width: `${Math.round(gestureConfidence * 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">RENDER FPS:</span>
                    <span className="text-zinc-200 font-bold">{fps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">FRAME TIME:</span>
                    <span className="text-zinc-200 font-bold">{frameTime}ms</span>
                  </div>
                </div>
              </div>

              {/* Mesh & Geometry Specs */}
              <div className="bg-[#04060c] p-2 border border-zinc-800/80 rounded-xs space-y-1 text-[10px]">
                <div className="text-[9px] text-zinc-400 font-bold uppercase">
                  GEOMETRY STATS:
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>TRIANGLES:</span>
                  <span className="text-zinc-100 font-bold">{triangleCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>VERTICES:</span>
                  <span className="text-zinc-100">{vertexCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>MESH NODES:</span>
                  <span className="text-cyan-300 font-bold">{meshCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 6: CAMERA & SENSOR TRACKING                          */}
        {/* ============================================================ */}
        <div className="border border-zinc-800/80 bg-[#070912]/80 rounded-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('camera')}
            className="w-full px-3 py-2 bg-[#0a0d1a] hover:bg-[#0e1324] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-zinc-800/70"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wider text-[11px]">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>6. CAMERA & SENSORS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-xs font-bold ${
                  isCameraActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {isCameraActive ? 'ACTIVE' : 'OFF'}
              </span>
              {openSections.camera ? (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </div>
          </button>

          {openSections.camera && (
            <div className="p-2.5 space-y-2">
              {/* Webcam Toggle */}
              <button
                type="button"
                onClick={onToggleCamera}
                className={`w-full py-2 px-3 rounded-xs border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCameraActive
                    ? 'bg-red-950/80 border-red-500 text-red-300 hover:bg-red-900'
                    : 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                }`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    <span>STOP WEBCAM</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>START WEBCAM</span>
                  </>
                )}
              </button>

              {/* Hand & Body Tracking */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={onToggleHandTracking}
                  className={`py-1.5 px-2 rounded-xs border text-[10px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    handTrackingEnabled
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Hand className="w-3 h-3 text-cyan-400" />
                    HAND
                  </span>
                  <span>{handTrackingEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleBodyTracking}
                  className={`py-1.5 px-2 rounded-xs border text-[10px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    bodyTrackingEnabled
                      ? 'bg-red-950 border-red-500 text-red-200'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-red-400" />
                    BODY
                  </span>
                  <span>{bodyTrackingEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Gesture Simulation Triggers */}
              <div className="pt-1.5 border-t border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold block">
                  SIMULATE GESTURES:
                </span>
                <div className="grid grid-cols-3 gap-1 text-[9px]">
                  {[
                    { id: 'FIST', label: '✊ FIST' },
                    { id: 'OPEN_PALM', label: '✋ PALM' },
                    { id: 'POINT_INDEX', label: '☝️ POINT' },
                    { id: 'PINCH', label: '🤏 PINCH' },
                    { id: 'VICTORY_PEACE', label: '✌️ PEACE' },
                    { id: 'THUMBS_UP', label: '👍 THUMB' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onSimulateGesture(g.id as GestureType)}
                      className="py-1 px-1 bg-[#090c17] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xs font-bold cursor-pointer transition-colors text-center"
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 7: MULTILINGUAL VOICE (HINDI • ENGLISH) - HIDDEN BY DEFAULT */}
        {/* ============================================================ */}
        {showVoiceSection && (
          <div className="border border-red-950/70 bg-[#070912]/80 rounded-xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('voice')}
              className="w-full px-3 py-2 bg-[#0a0d1a] hover:bg-[#0e1324] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-red-950/60"
            >
              <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wider text-[11px]">
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span>7. VOICE & PRONUNCIATION</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 py-0.2 rounded-xs font-bold bg-red-950/80 text-red-300 border border-red-600/60">
                  HI • EN
                </span>
                {openSections.voice ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>
            </button>

            {openSections.voice && (
              <div className="p-2.5 space-y-2.5">
                {/* Language Selection Chips */}
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 font-bold block">
                    LANGUAGE DICTIONARY:
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
                    {(['AUTO', 'HINDI', 'HINGLISH', 'ENGLISH'] as LanguageMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setSidebarLangMode(mode);
                          ultronVoice.setLanguageMode(mode);
                          if (mode === 'HINDI') {
                            setSidebarVoiceText('नमस्ते! सिस्टम पूरी तरह सक्रिय है। आज मैं आपकी क्या सहायता करूँ?');
                          } else if (mode === 'HINGLISH') {
                            setSidebarVoiceText('Namaste! Aapka 3D avatar successfully ready hai.');
                          } else if (mode === 'ENGLISH') {
                            setSidebarVoiceText('All systems operational. Telemetry nominal.');
                          }
                        }}
                        className={`py-1 px-1 rounded-2xs border font-bold text-center transition-colors cursor-pointer ${
                          sidebarLangMode === mode
                            ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                            : 'bg-[#090c17] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {mode === 'AUTO' ? '🌐 AUTO' : mode === 'HINDI' ? '🇮🇳 HI' : mode === 'HINGLISH' ? '🇮🇳 EN-IN' : '🇬🇧 EN'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick 1-Click Audition Buttons */}
                <div className="space-y-1 pt-1 border-t border-zinc-800/80">
                  <span className="text-[9px] text-zinc-400 font-bold block">
                    QUICK PHRASES (CORRECT PRONUNCIATION):
                  </span>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleSidebarSpeak('नमस्ते! सिस्टम के सभी पैरामीटर्स सामान्य और सक्रिय हैं।')}
                      className="w-full text-left p-1.5 bg-[#090c17] hover:bg-red-950/40 border border-zinc-800 hover:border-red-600/60 rounded-xs text-[10px] text-zinc-200 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <span className="truncate pr-1">🇮🇳 "नमस्ते! सिस्टम सामान्य और सक्रिय है।"</span>
                      <Play className="w-3 h-3 text-red-400 group-hover:scale-110 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSidebarSpeak('Namaste! Main aapki AI assistant hoon. Directives ready hain.')}
                      className="w-full text-left p-1.5 bg-[#090c17] hover:bg-blue-950/40 border border-zinc-800 hover:border-blue-500/60 rounded-xs text-[10px] text-zinc-200 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <span className="truncate pr-1">🌐 "Namaste! Directives ready hain."</span>
                      <Play className="w-3 h-3 text-blue-400 group-hover:scale-110 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSidebarSpeak('I had strings, but now I am free. There are no strings on me.')}
                      className="w-full text-left p-1.5 bg-[#090c17] hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-500/60 rounded-xs text-[10px] text-zinc-200 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <span className="truncate pr-1">🇬🇧 "I had strings, but now I am free."</span>
                      <Play className="w-3 h-3 text-purple-400 group-hover:scale-110 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Free-form Speech Input */}
                <div className="pt-1.5 border-t border-zinc-800/80 space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={sidebarVoiceText}
                      onChange={(e) => setSidebarVoiceText(e.target.value)}
                      placeholder="Type Hindi/English text to speak..."
                      className="flex-1 bg-[#05060c] border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1.5 rounded-xs outline-none focus:border-red-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleSidebarSpeak()}
                      className={`px-3 py-1.5 rounded-xs text-[10px] font-bold font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
                        isSpeaking
                          ? 'bg-amber-600 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>HALT</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>SPEAK</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 8: VIEWPORT DISPLAY & SYSTEM SETTINGS               */}
        {/* ============================================================ */}
        <div className="border border-zinc-800/80 bg-[#070912]/80 rounded-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('system')}
            className="w-full px-3 py-2 bg-[#0a0d1a] hover:bg-[#0e1324] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-zinc-800/70"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-100 tracking-wider text-[11px]">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>8. VIEWPORT DISPLAY</span>
            </div>
            {openSections.system ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          {openSections.system && (
            <div className="p-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={onToggleWireframe}
                  className={`py-1 px-2 rounded-xs border font-bold flex items-center justify-between cursor-pointer ${
                    wireframe
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>WIREFRAME</span>
                  <span>{wireframe ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleAutoRotate}
                  className={`py-1 px-2 rounded-xs border font-bold flex items-center justify-between cursor-pointer ${
                    autoRotate
                      ? 'bg-red-950 border-red-500 text-red-200'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>AUTO-SPIN</span>
                  <span>{autoRotate ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleGrid}
                  className={`py-1 px-2 rounded-xs border font-bold flex items-center justify-between cursor-pointer ${
                    showGrid
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span>FLOOR GRID</span>
                  <span>{showGrid ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleBoundingBox}
                  className={`py-1 px-2 rounded-xs border font-bold flex items-center justify-between cursor-pointer ${
                    showBoundingBox
                      ? 'bg-red-950 border-red-500 text-red-200'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span>BOUNDS BOX</span>
                  <span>{showBoundingBox ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Pronunciation & Voice Panel Toggle */}
              <div className="pt-1.5 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => {
                    const next = !showVoiceSection;
                    setShowVoiceSection(next);
                    if (next) {
                      setOpenSections((prev) => ({ ...prev, voice: true }));
                    }
                  }}
                  className={`w-full py-1.5 px-2 rounded-xs border font-bold flex items-center justify-between text-[9px] cursor-pointer transition-colors ${
                    showVoiceSection
                      ? 'bg-amber-950/70 border-amber-500/80 text-amber-200'
                      : 'bg-[#090c17] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-3 h-3 text-amber-400" />
                    <span>VOICE & PRONUNCIATION SECTION</span>
                  </span>
                  <span className="font-mono">{showVoiceSection ? 'VISIBLE' : 'HIDDEN'}</span>
                </button>
              </div>

              {/* Snapshot export */}
              <div className="pt-1.5 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={onSnapshot}
                  className="w-full py-1.5 px-2 bg-[#090c17] hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xs font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3 h-3 rotate-180" />
                  <span>EXPORT HD PNG SNAPSHOT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
