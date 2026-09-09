/**
 * 3D Avatar Scene (Phase 5 - Section 2, 14, 15, 16)
 *
 * Renders the Three.js / React Three Fiber viewport:
 * - Studio lighting (Key, Fill, Rim) with subtle shadows
 * - Responsive container tracking via ResizeObserver
 * - Gaze tracking from mouse coordinates
 * - Voice visualizer aura around avatar
 * - Performance throttling according to quality level
 * - Accessible fallback when avatar or WebGL is disabled
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AvatarModel } from './AvatarModel.tsx';
import { avatarController } from './AvatarController.ts';
import { avatarSettings } from './AvatarSettings.ts';
import { AvatarAnimationState, AvatarSettingsConfig } from './types.ts';
import { MorphTargetWeights } from './AvatarAnimationController.ts';
import { Activity, Eye, Mic, Volume2, Sparkles } from 'lucide-react';

interface InnerSceneProps {
  settings: AvatarSettingsConfig;
  onStateUpdate: (state: AvatarAnimationState) => void;
}

const InnerSceneContent: React.FC<InnerSceneProps> = ({ settings, onStateUpdate }) => {
  const [animState, setAnimState] = useState<AvatarAnimationState>(() =>
    avatarController.animationCtrl.evaluateFrame(Date.now(), settings).animationState
  );
  const [morphs, setMorphs] = useState<MorphTargetWeights>(() =>
    avatarController.animationCtrl.evaluateFrame(Date.now(), settings).morphTargets
  );

  // useFrame runs on every animation tick
  useFrame((_, delta) => {
    if (!settings.enabled) return;

    const res = avatarController.animationCtrl.evaluateFrame(Date.now(), settings);
    if (res.shouldRender) {
      setAnimState(res.animationState);
      setMorphs(res.morphTargets);
      onStateUpdate(res.animationState);
    }
  });

  // State-reactive aura colors
  const getAuraColor = () => {
    switch (animState.currentState) {
      case 'SPEAKING':
        return '#38bdf8'; // Sky blue
      case 'LISTENING':
        return '#34d399'; // Emerald
      case 'THINKING':
        return '#a855f7'; // Purple
      case 'ERROR':
        return '#f87171'; // Red
      case 'HAPPY':
        return '#fbbf24'; // Amber
      default:
        return '#0284c7'; // Deep cyan
    }
  };

  return (
    <>
      {/* Lighting Configuration */}
      <ambientLight intensity={settings.quality === 'LOW' ? 0.8 : 0.6} />
      <directionalLight
        position={[2, 3, 3]}
        intensity={1.2}
        castShadow={settings.quality === 'HIGH'}
      />
      <directionalLight
        position={[-2, 1, 2]}
        intensity={0.4}
        color="#38bdf8"
      />
      {/* Rim light from behind */}
      <spotLight
        position={[0, 3, -2]}
        intensity={1.0}
        color="#60a5fa"
        angle={0.6}
      />

      {/* Subtle Voice Visualizer Rings behind avatar */}
      <group position={[0, -0.2, -0.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.13, 48]} />
          <meshBasicMaterial
            color={getAuraColor()}
            transparent
            opacity={animState.currentState === 'SPEAKING' ? 0.7 : 0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.32, 48]} />
          <meshBasicMaterial
            color={getAuraColor()}
            transparent
            opacity={animState.currentState === 'LISTENING' ? 0.6 : 0.15}
          />
        </mesh>
      </group>

      {/* Avatar 3D Model */}
      <AvatarModel
        modelPath={settings.modelPath}
        animationState={animState}
        morphTargets={morphs}
        scale={settings.scale}
        quality={settings.quality}
      />
    </>
  );
};

export const AvatarScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<AvatarSettingsConfig>(() => avatarSettings.getSettings());
  const [activeState, setActiveState] = useState<AvatarAnimationState | null>(null);
  const [hasWebGl, setHasWebGl] = useState(true);

  // Subscribe to avatar settings
  useEffect(() => {
    return avatarSettings.subscribe((newCfg) => {
      setSettings(newCfg);
    });
  }, []);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGl(!!gl);
    } catch {
      setHasWebGl(false);
    }
  }, []);

  // Mouse move gaze tracker
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !settings.eyeMovementEnabled) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    avatarController.eyeCtrl.setTargetGaze(x, y);
  }, [settings.eyeMovementEnabled]);

  const handleMouseLeave = useCallback(() => {
    avatarController.eyeCtrl.setTargetGaze(0, 0);
  }, []);

  if (!settings.enabled || !hasWebGl) {
    return (
      <div
        id="avatar-disabled-placeholder"
        className={`flex flex-col items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 text-slate-300 select-none ${className}`}
      >
        <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
          <Activity className="w-8 h-8 animate-pulse text-cyan-400" />
        </div>
        <h3 className="font-semibold text-slate-200 text-sm tracking-wide">3D Avatar Standby</h3>
        <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
          {!hasWebGl
            ? 'Hardware WebGL acceleration is unavailable in this display mode.'
            : 'Avatar display is currently paused in settings to minimize power usage.'}
        </p>
        <button
          onClick={() => avatarSettings.updateSettings({ enabled: true })}
          className="mt-4 px-3 py-1.5 text-xs font-mono bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
        >
          Enable Avatar
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="avatar-3d-scene"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full min-h-[320px] select-none overflow-hidden rounded-2xl ${className}`}
    >
      {/* Background Atmosphere Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* React Three Fiber Canvas */}
      <Canvas
        camera={{ position: [0, 0, 2.2], fov: 42 }}
        dpr={settings.quality === 'HIGH' ? [1, 2] : [1, 1.5]}
        gl={{ antialias: settings.quality !== 'LOW', alpha: true, powerPreference: 'default' }}
        style={{ width: '100%', height: '100%' }}
      >
        <InnerSceneContent settings={settings} onStateUpdate={setActiveState} />
      </Canvas>

      {/* Floating State & Emotion HUD Pills */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none px-2">
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-[11px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-cyan-300">{activeState?.currentState || 'IDLE'}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 capitalize">{activeState?.currentEmotion || 'neutral'}</span>
        </div>

        {activeState?.currentGesture && activeState.currentGesture !== 'none' && (
          <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-[11px] font-mono text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="capitalize">{activeState.currentGesture}</span>
          </div>
        )}
      </div>
    </div>
  );
};
