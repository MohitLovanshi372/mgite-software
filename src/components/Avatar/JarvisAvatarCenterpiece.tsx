/**
 * JarvisAvatarCenterpiece Component
 *
 * Cinematic Realistic Humanoid Transformer JARVIS Presentation:
 * - High-end cinematic humanoid AI robot
 * - Realistic human-like proportions with black / graphite metallic body
 * - Precision mechanical face with cyan glowing optical units & articulating graphite eyelids
 * - Futuristic chest core (Arc Reactor) with pulsating cyan energy
 * - Detailed mechanical joints in matte obsidian alloy
 * - Camera framed for head, shoulders, and upper torso (no extreme close-up zoom)
 * - Deep space galaxy / cosmic observation deck backdrop
 * - Subtle mouse gaze tracking & cinematic parallax
 * - Smooth state transitions for all 8 states:
 *   IDLE, LISTENING, THINKING, SPEAKING, HAPPY, SERIOUS, CONFUSED, ERROR
 * - Fully preserves existing JARVIS UI, voice system, task system, and security controls
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AIStateMode } from '../../types/index.ts';
import { Sparkles, Activity, AlertTriangle, Eye, Mic, MicOff, Shield, Cpu } from 'lucide-react';
import { AvatarEmotion } from '../../avatar/types.ts';
import { RealisticHumanoidRobot } from '../../avatar/RealisticHumanoidRobot.ts';

interface JarvisAvatarCenterpieceProps {
  avatarState: AIStateMode;
  lastAssistantMessage?: string;
  interimTranscript?: string;
  onAnimationChange?: (animName: string) => void;
  controlledEmote?: AvatarEmotion | null;
  onEmoteChange?: (emote: AvatarEmotion) => void;
  isMusicPlaying?: boolean;
  isAutoSpeechActive?: boolean;
  onToggleAutoSpeech?: () => void;
}

export const JarvisAvatarCenterpiece: React.FC<JarvisAvatarCenterpieceProps> = ({
  avatarState,
  lastAssistantMessage,
  interimTranscript,
  onAnimationChange,
  controlledEmote = null,
  onEmoteChange,
  isMusicPlaying = false,
  isAutoSpeechActive = false,
  onToggleAutoSpeech,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeAnimName, setActiveAnimName] = useState<string>('idle');
  const [availableAnimations, setAvailableAnimations] = useState<string[]>(['idle', 'agree', 'headShake', 'walk', 'run']);
  const [manualEmote, setManualEmote] = useState<AvatarEmotion | null>(null);

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const robotRef = useRef<RealisticHumanoidRobot | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Active dynamic emote during conversation
  const currentEmote: AvatarEmotion = manualEmote || controlledEmote || (() => {
    if (isMusicPlaying) return 'excited';
    switch (avatarState) {
      case 'LISTENING':
        return 'friendly';
      case 'THINKING':
      case 'EXECUTING':
        return 'thinking';
      case 'SPEAKING':
        return 'happy';
      case 'SUCCESS':
        return 'excited';
      case 'ERROR':
      case 'SECURITY_ALERT':
        return 'serious';
      case 'IDLE':
      default:
        return 'neutral';
    }
  })();

  const handleSelectEmote = (emote: AvatarEmotion | null) => {
    setManualEmote(emote);
    if (onEmoteChange && emote) {
      onEmoteChange(emote);
    }
    if (robotRef.current) {
      if (emote === 'happy') {
        robotRef.current.playAnimation('agree');
        setActiveAnimName('agree');
      } else if (emote === 'serious' || emote === 'concerned') {
        robotRef.current.playAnimation('headShake');
        setActiveAnimName('headShake');
      } else {
        robotRef.current.playAnimation('idle');
        setActiveAnimName('idle');
      }
    }
  };

  // Compute status bubble message based on dynamic states
  const getStatusMessage = () => {
    if (interimTranscript && interimTranscript.trim()) {
      return `"${interimTranscript}"`;
    }
    switch (avatarState) {
      case 'LISTENING':
        return 'Listening... Speak now.';
      case 'THINKING':
      case 'EXECUTING':
        return 'Analyzing directive & processing system actions...';
      case 'SPEAKING':
        return lastAssistantMessage && lastAssistantMessage.trim()
          ? (lastAssistantMessage.length > 90 ? `${lastAssistantMessage.slice(0, 90)}...` : lastAssistantMessage)
          : 'Speaking...';
      case 'SUCCESS':
        return 'Action executed successfully.';
      case 'ERROR':
        return 'Security or processing exception encountered.';
      case 'SECURITY_ALERT':
        return 'Security alert: Protected protocols active.';
      case 'IDLE':
      default:
        return 'How can I help you today?';
    }
  };

  // React to avatarState changes & trigger appropriate skeletal animation
  useEffect(() => {
    if (!robotRef.current) return;

    switch (avatarState) {
      case 'LISTENING':
        robotRef.current.playAnimation('idle');
        setActiveAnimName('idle');
        break;
      case 'THINKING':
      case 'EXECUTING':
        robotRef.current.playAnimation('idle');
        setActiveAnimName('idle');
        break;
      case 'SPEAKING':
        robotRef.current.playAnimation('idle');
        setActiveAnimName('idle');
        break;
      case 'SUCCESS':
        robotRef.current.playAnimation('agree');
        setActiveAnimName('agree');
        break;
      case 'ERROR':
      case 'SECURITY_ALERT':
        robotRef.current.playAnimation('headShake');
        setActiveAnimName('headShake');
        break;
      case 'IDLE':
      default:
        robotRef.current.playAnimation('idle');
        setActiveAnimName('idle');
        break;
    }
  }, [avatarState]);

  // Mouse move listener for subtle parallax & gaze tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current = { x: x * 0.12, y: y * 0.08 };

    if (robotRef.current) {
      robotRef.current.setGazeTarget(x, y);
    }
  };

  const currentEmoteRef = useRef<AvatarEmotion>(currentEmote);
  const avatarStateRef = useRef<AIStateMode>(avatarState);
  const isMusicPlayingRef = useRef<boolean>(isMusicPlaying);

  useEffect(() => {
    currentEmoteRef.current = currentEmote;
    avatarStateRef.current = avatarState;
    isMusicPlayingRef.current = isMusicPlaying;
  }, [currentEmote, avatarState, isMusicPlaying]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: Framed to showcase Head, Broad Shoulders, and Upper Torso with Chest Core
    // Generous breathing room, robot centered, no extreme face zoom
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.36, 2.45);
    camera.lookAt(0, 1.25, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Dark Cinematic Lighting with Sharp Cyan Rim Light
    // Dark Space Ambient Fill
    const ambientLight = new THREE.AmbientLight(0x081224, 1.3);
    scene.add(ambientLight);

    // Front Key Light (Highlights graphite armor bevels and specular contours)
    const keyLight = new THREE.DirectionalLight(0xeaf2ff, 2.4);
    keyLight.position.set(1.6, 2.8, 2.4);
    scene.add(keyLight);

    // Soft Deep Cyan Fill Light
    const fillLight = new THREE.DirectionalLight(0x002b4d, 0.9);
    fillLight.position.set(-2.0, 0.6, 1.8);
    scene.add(fillLight);

    // Sharp Cyan Rim / Edge Spotlight (Creates brilliant cinematic silhouette edge separation)
    const rimLight = new THREE.SpotLight(0x00e5ff, 5.5, 14, Math.PI / 3.8, 0.4);
    rimLight.position.set(0, 3.2, -2.4);
    rimLight.target.position.set(0, 1.25, 0);
    scene.add(rimLight);
    scene.add(rimLight.target);

    // Additional Lower Cyan Under-Glow (Cybernetic console bounce)
    const floorBounceLight = new THREE.DirectionalLight(0x0088cc, 0.5);
    floorBounceLight.position.set(0, -1.0, 1.0);
    scene.add(floorBounceLight);

    // 5. Starfield & Cosmic Nebula Particles
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 10 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = -5 - Math.abs(radius * Math.cos(phi));

      // Subtle cyan, icy blue, and white cosmic star colors
      const colorType = Math.random();
      if (colorType > 0.6) {
        starColors[i * 3] = 0.0;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 1.0;
      } else if (colorType > 0.3) {
        starColors[i * 3] = 0.4;
        starColors[i * 3 + 1] = 0.7;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 0.9;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;

    // 6. Holographic Wireframe Globe HUD on Observation Deck Right Side
    const globeGroup = new THREE.Group();
    globeGroup.position.set(2.4, 1.2, -1.8);
    globeGroup.scale.set(0.65, 0.65, 0.65);

    const globeGeo = new THREE.SphereGeometry(1, 24, 24);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    const ringGeo = new THREE.RingGeometry(1.2, 1.24, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    globeGroup.add(ringMesh);

    const innerGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.45,
    });
    globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    scene.add(globeGroup);
    globeRef.current = globeGroup;

    // 7. Instantiate & Load Realistic Humanoid Robot Avatar
    setIsLoading(true);
    setLoadError(null);

    const robot = new RealisticHumanoidRobot();
    robotRef.current = robot;
    scene.add(robot.group);

    robot
      .load('/models/cyber_android.glb')
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[JarvisAvatarCenterpiece] Robot load error:', err);
        setLoadError('Failed to load humanoid robot model');
        setIsLoading(false);
      });

    // 8. Render Loop with Delta Clock
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const isSpeaking = avatarStateRef.current === 'SPEAKING';
      const isMusic = isMusicPlayingRef.current;

      // Update Robot Kinematics, Optical Eyes, Vocoder, Chest Core
      if (robotRef.current) {
        robotRef.current.update(delta, isSpeaking, avatarStateRef.current, currentEmoteRef.current);

        // Music beat micro-sway
        if (isMusic) {
          robotRef.current.group.position.y = Math.sin(clock.getElapsedTime() * 4) * 0.012;
        } else {
          robotRef.current.group.position.y = 0;
        }
      }

      // Rotate Holographic Globe
      if (globeRef.current) {
        globeRef.current.rotation.y += delta * 0.25;
      }

      // Rotate Stars very slowly
      if (starsRef.current) {
        starsRef.current.rotation.y += delta * 0.015;
      }

      // Smooth Camera Parallax around the centered upper-torso framing
      if (cameraRef.current) {
        const targetCamZ = 2.45;
        const targetCamY = 1.36;
        const targetX = mousePosRef.current.x * 0.25;
        const targetY = targetCamY + mousePosRef.current.y * 0.15;

        cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
        cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * 0.05;

        cameraRef.current.lookAt(0, 1.25, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();

      if (robotRef.current) {
        robotRef.current.dispose();
        robotRef.current = null;
      }

      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full min-h-[340px] flex items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#040814] select-none shadow-[inset_0_0_80px_rgba(0,180,255,0.1)]"
    >
      {/* Space Observation Window Glows & Vignette */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/15 via-[#040814]/70 to-[#02050c]" />

      {/* Observation Deck Window Strut Top & Bottom subtle overlays */}
      <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none z-10 bg-gradient-to-b from-[#030610] to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none z-10 bg-gradient-to-t from-[#030610] to-transparent opacity-90" />

      {/* Observation Cockpit Frame Beams */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-xl pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-xl pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-xl pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl pointer-events-none z-10" />

      {/* Three.js Canvas Element */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block relative z-5 cursor-grab active:cursor-grabbing"
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#040814]/85 backdrop-blur-sm z-20">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-xs font-mono tracking-widest text-cyan-300 uppercase">
            CALIBRATING HUMANOID ROBOT MATRIX...
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#040814]/90 z-20">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-xs text-zinc-300 font-mono">{loadError}</p>
        </div>
      )}

      {/* Floating Avatar Status Message Bubble */}
      <div className="absolute top-5 left-5 z-20 max-w-sm pointer-events-auto">
        <div className="px-4 py-3 rounded-2xl bg-[#070e1e]/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_4px_24px_rgba(0,180,255,0.18)] transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="text-[11px] font-sans font-extrabold tracking-widest text-cyan-300 uppercase flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              JARVIS ROBOTICS
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
              {avatarState}
            </span>
          </div>
          <p className="text-sm font-sans text-white/95 font-medium leading-snug drop-shadow-sm">
            {getStatusMessage()}
          </p>
        </div>
      </div>

      {/* Center-Top Control Dock: Auto-Speech Toggle & Pose Switcher */}
      <div className="absolute top-5 right-5 z-20 flex flex-wrap items-center justify-end gap-2 pointer-events-auto">
        {/* Cinematic Humanoid Robot Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border border-cyan-500/30 bg-[#061022]/85 text-cyan-300 shadow-md">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>HUMANOID TRANSFORMER</span>
        </div>

        {/* Auto-Speech Conversation Mode Toggle */}
        {onToggleAutoSpeech && (
          <button
            type="button"
            onClick={onToggleAutoSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans transition-all cursor-pointer shadow-lg backdrop-blur-md border ${
              isAutoSpeechActive
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Continuous Auto-Speech Conversations"
          >
            {isAutoSpeechActive ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isAutoSpeechActive ? 'Auto-Speech: ON' : 'Auto-Speech: OFF'}</span>
          </button>
        )}

        {/* Pose / Kinetic Clips Switcher */}
        {availableAnimations.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#070e1e]/85 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-cyan-500/25">
            <span className="text-[10px] text-zinc-400 font-mono mr-1 hidden sm:inline">
              POSE:
            </span>
            {['idle', 'agree', 'headShake', 'walk', 'run'].map((anim) => {
              const isCurrent = activeAnimName === anim;
              return (
                <button
                  key={anim}
                  type="button"
                  onClick={() => {
                    if (robotRef.current) {
                      robotRef.current.playAnimation(anim);
                      setActiveAnimName(anim);
                      if (onAnimationChange) onAnimationChange(anim);
                    }
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-sans capitalize transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {anim === 'agree' ? 'Nod' : anim === 'headShake' ? 'Shake' : anim}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Holographic Compass / Telemetry Indicator in Bottom Right */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#050b18]/85 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
        <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
        <span>CYAN OPTICS // 60FPS</span>
      </div>

      {/* Interactive Avatar Emote Control Dock */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-1.5 pointer-events-auto bg-[#050b18]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/35 shadow-lg max-w-[calc(100%-180px)] overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0 mr-1 text-[10px] font-mono font-bold text-cyan-400">
          <Sparkles className="w-3 h-3 text-cyan-300" />
          <span className="hidden sm:inline">STATE:</span>
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-200 capitalize">
            {currentEmote}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSelectEmote(null)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium whitespace-nowrap transition-all cursor-pointer ${
            manualEmote === null
              ? 'bg-cyan-600 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
          title="Automatic emotional response during conversation"
        >
          Auto
        </button>

        {[
          { id: 'happy', label: '😊 Happy' },
          { id: 'thinking', label: '🤔 Think' },
          { id: 'friendly', label: '🎧 Listen' },
          { id: 'excited', label: '✨ Excited' },
          { id: 'serious', label: '😐 Serious' },
          { id: 'confused', label: '🧐 Confused' },
          { id: 'surprised', label: '😲 Alert' },
          { id: 'concerned', label: '🛡️ Shield' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelectEmote(item.id as AvatarEmotion)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium whitespace-nowrap transition-all cursor-pointer ${
              manualEmote === item.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
