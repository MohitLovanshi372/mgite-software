/**
 * JarvisAvatarCenterpiece Component
 *
 * Primary 3D Centerpiece matching the reference desktop AI interface:
 * - Real /models/jarvis-human.glb loaded and centered
 * - Deep space galaxy / cosmic observation deck backdrop
 * - Three.js AnimationMixer supporting 'idle', 'walk', 'run', 'agree', 'headShake'
 * - Smooth state transitions (IDLE, LISTENING, THINKING, SPEAKING, CONFIRMATION, ERROR)
 * - Floating glassmorphic status bubble: "JARVIS / How can I help you today?"
 * - Holographic wireframe globe HUD in the observation deck
 * - Subtle camera mouse parallax
 * - Optimized rendering with requestAnimationFrame, dispose on unmount
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AIStateMode } from '../../types/index.ts';
import { Sparkles, Activity, Play, CheckCircle2, AlertTriangle, Smile, Brain, Headphones, MessageSquare, Zap, HelpCircle, Shield, Hand, ThumbsUp } from 'lucide-react';
import { AvatarEmotion } from '../../avatar/types.ts';
import { EMOTION_PROFILES } from '../../avatar/EmotionController.ts';

interface JarvisAvatarCenterpieceProps {
  avatarState: AIStateMode;
  lastAssistantMessage?: string;
  interimTranscript?: string;
  onAnimationChange?: (animName: string) => void;
  controlledEmote?: AvatarEmotion | null;
  onEmoteChange?: (emote: AvatarEmotion) => void;
  isMusicPlaying?: boolean;
}

export const JarvisAvatarCenterpiece: React.FC<JarvisAvatarCenterpieceProps> = ({
  avatarState,
  lastAssistantMessage,
  interimTranscript,
  onAnimationChange,
  controlledEmote = null,
  onEmoteChange,
  isMusicPlaying = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeAnimName, setActiveAnimName] = useState<string>('idle');
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [manualEmote, setManualEmote] = useState<AvatarEmotion | null>(null);

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
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
    if (emote === 'happy' && actionsRef.current.has('agree')) {
      playAnimation('agree');
    } else if (emote === 'thinking') {
      playAnimation('idle');
    } else if (emote === 'serious' && actionsRef.current.has('headShake')) {
      playAnimation('headShake');
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

  // Cross-fade animation helper
  const playAnimation = (name: string, duration = 0.4) => {
    const action = actionsRef.current.get(name);
    if (!action) return;

    if (currentActionRef.current && currentActionRef.current !== action) {
      currentActionRef.current.fadeOut(duration);
    }

    action.reset();
    action.fadeIn(duration);
    action.play();
    currentActionRef.current = action;
    setActiveAnimName(name);
    if (onAnimationChange) onAnimationChange(name);
  };

  // React to avatarState changes
  useEffect(() => {
    if (!actionsRef.current.size) return;

    switch (avatarState) {
      case 'LISTENING':
        if (actionsRef.current.has('agree')) {
          playAnimation('agree');
        } else {
          playAnimation('idle');
        }
        break;
      case 'THINKING':
        playAnimation('idle');
        break;
      case 'SPEAKING':
        if (actionsRef.current.has('agree')) {
          playAnimation('agree');
        } else {
          playAnimation('idle');
        }
        break;
      case 'ERROR':
      case 'SECURITY_ALERT':
        if (actionsRef.current.has('headShake')) {
          playAnimation('headShake');
        } else if (actionsRef.current.has('sad_pose')) {
          playAnimation('sad_pose');
        }
        break;
      case 'IDLE':
      default:
        playAnimation('idle');
        break;
    }
  }, [avatarState]);

  // Mouse move listener for subtle parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current = { x: x * 0.15, y: y * 0.1 };
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

    // 2. Camera: Framed specifically for the upper torso and head of JARVIS
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.45, 2.5);
    camera.lookAt(0, 1.4, 0);
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

    // 4. Lighting: Studio Key + Fill + Rim lights matching cybernetic dark theme
    const ambientLight = new THREE.AmbientLight(0x101b38, 1.8);
    scene.add(ambientLight);

    // Front Key Light (Crisp, natural highlight on face and hair)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(1.5, 3.0, 3.0);
    scene.add(keyLight);

    // Cyan Fill Light (Cyber glow from bottom-left consoles)
    const fillLight = new THREE.DirectionalLight(0x00d2ff, 1.5);
    fillLight.position.set(-2.5, 0.5, 2.0);
    scene.add(fillLight);

    // Neon Blue Rim Light (Back edge lighting separating avatar from space)
    const rimLight = new THREE.SpotLight(0x0088ff, 3.5, 12, Math.PI / 4, 0.5);
    rimLight.position.set(0, 3.5, -2.5);
    rimLight.target.position.set(0, 1.3, 0);
    scene.add(rimLight);
    scene.add(rimLight.target);

    // 5. Starfield & Cosmic Nebula Particles
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Distribute in sphere behind avatar
      const radius = 10 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = -5 - Math.abs(radius * Math.cos(phi));

      // Shimmering cyan, white, and soft purple stars
      const colorType = Math.random();
      if (colorType < 0.6) {
        starColors[i * 3] = 0.8;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
      } else if (colorType < 0.85) {
        starColors[i * 3] = 0.1;
        starColors[i * 3 + 1] = 0.75;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 0.8;
        starColors[i * 3 + 1] = 0.5;
        starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;

    // 6. Holographic Wireframe Globe HUD on observation bridge right side
    const globeGroup = new THREE.Group();
    globeGroup.position.set(2.4, 1.2, -1.8);
    globeGroup.scale.set(0.65, 0.65, 0.65);

    // Wireframe Sphere
    const globeGeo = new THREE.SphereGeometry(1, 24, 24);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Glowing Equator Ring
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

    // Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.45,
    });
    globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    scene.add(globeGroup);
    globeRef.current = globeGroup;

    // 7. Load /models/jarvis-human.glb
    setIsLoading(true);
    setLoadError(null);

    const loader = new GLTFLoader();
    const modelUrl = '/models/jarvis-human.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Position avatar centered, correctly scaled and framed
        model.position.set(0, 0, 0);
        model.scale.set(1.25, 1.25, 1.25);

        // Enhance shaders: Ensure skin tone looks natural, chest arc reactor/eyes glow
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.roughness = Math.max(mat.roughness, 0.4);
                  mat.metalness = Math.min(mat.metalness, 0.35);

                  // If glowing accent or chest element
                  if (mat.name && (mat.name.toLowerCase().includes('glow') || mat.name.toLowerCase().includes('core') || mat.name.toLowerCase().includes('cyan'))) {
                    mat.emissive = new THREE.Color(0x00d2ff);
                    mat.emissiveIntensity = 1.2;
                  }
                }
              });
            }
          }
        });

        scene.add(model);

        // Setup Animation Mixer
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          const animNames: string[] = [];
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actionsRef.current.set(clip.name, action);
            animNames.push(clip.name);
          });

          setAvailableAnimations(animNames);

          // Play default idle animation
          const idleAction = actionsRef.current.get('idle') || actionsRef.current.values().next().value;
          if (idleAction) {
            idleAction.play();
            currentActionRef.current = idleAction;
            setActiveAnimName('idle');
          }
        }

        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn('[JarvisAvatarCenterpiece] Could not load /models/jarvis-human.glb, checking fallback:', err);
        // Fallback to cyber_android.glb if needed
        loader.load(
          '/models/cyber_android.glb',
          (gltfFallback) => {
            const model = gltfFallback.scene;
            modelRef.current = model;
            model.position.set(0, 0, 0);
            model.scale.set(1.25, 1.25, 1.25);
            scene.add(model);

            if (gltfFallback.animations && gltfFallback.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(model);
              mixerRef.current = mixer;
              const names: string[] = [];
              gltfFallback.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                actionsRef.current.set(clip.name, action);
                names.push(clip.name);
              });
              setAvailableAnimations(names);
              const idleAction = actionsRef.current.get('idle') || actionsRef.current.values().next().value;
              if (idleAction) {
                idleAction.play();
                currentActionRef.current = idleAction;
                setActiveAnimName('idle');
              }
            }
            setIsLoading(false);
          },
          undefined,
          (errFallback) => {
            console.error('[JarvisAvatarCenterpiece] Model loading failed:', errFallback);
            setLoadError('Failed to load 3D GLB avatar');
            setIsLoading(false);
          }
        );
      }
    );

    // 8. Render Loop with Delta Clock
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Update animation mixer
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Dynamic Emote & Conversational Kinematics
      if (modelRef.current) {
        const emote = currentEmoteRef.current;
        const profile = EMOTION_PROFILES[emote] || EMOTION_PROFILES.neutral;
        const isSpeaking = avatarStateRef.current === 'SPEAKING';
        const isMusic = isMusicPlayingRef.current;

        const targetPitch = profile.headPitchX + (isSpeaking ? Math.sin(clock.getElapsedTime() * 4) * 0.04 : 0);
        const targetYaw = profile.headYawY + (isMusic ? Math.sin(clock.getElapsedTime() * 2.5) * 0.06 : 0);
        const targetTilt = profile.headTiltZ + (isMusic ? Math.sin(clock.getElapsedTime() * 5) * 0.03 : 0);

        modelRef.current.rotation.x += (targetPitch - modelRef.current.rotation.x) * 0.08;
        modelRef.current.rotation.y += (targetYaw - modelRef.current.rotation.y) * 0.08;
        modelRef.current.rotation.z += (targetTilt - modelRef.current.rotation.z) * 0.08;
      }

      // Rotate Holographic Globe
      if (globeRef.current) {
        globeRef.current.rotation.y += delta * 0.25;
      }

      // Rotate Stars very slowly
      if (starsRef.current) {
        starsRef.current.rotation.y += delta * 0.02;
      }

      // Smooth camera parallax
      if (cameraRef.current) {
        const targetX = mousePosRef.current.x * 0.4;
        const targetY = 1.45 + mousePosRef.current.y * 0.25;
        cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
        cameraRef.current.lookAt(0, 1.38, 0);
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

      // Clean up Three.js objects
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
      actionsRef.current.clear();
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full min-h-[340px] flex items-center justify-center overflow-hidden rounded-2xl border border-blue-500/25 bg-[#060b18] select-none shadow-[inset_0_0_80px_rgba(0,100,255,0.12)]"
    >
      {/* Space Observation Window Glows & Vignette */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#060b18]/60 to-[#040711]" />

      {/* Observation Deck Window Strut Top & Bottom subtle overlays */}
      <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none z-10 bg-gradient-to-b from-[#050914] to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none z-10 bg-gradient-to-t from-[#050914] to-transparent opacity-90" />

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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#060b18]/85 backdrop-blur-sm z-20">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-xs font-mono tracking-widest text-cyan-300 uppercase">
            CALIBRATING JARVIS AVATAR...
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#060b18]/90 z-20">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-xs text-zinc-300 font-mono">{loadError}</p>
        </div>
      )}

      {/* 5. FLOATING AVATAR STATUS MESSAGE BUBBLE (Exact match to reference image) */}
      <div className="absolute top-5 left-5 z-20 max-w-sm pointer-events-auto">
        <div className="px-4 py-3 rounded-2xl bg-[#091326]/85 backdrop-blur-xl border border-blue-500/30 shadow-[0_4px_24px_rgba(0,140,255,0.2)] transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="text-[11px] font-sans font-extrabold tracking-widest text-cyan-300 uppercase">
              JARVIS
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 font-mono">
              {avatarState}
            </span>
          </div>
          <p className="text-sm font-sans text-white/95 font-medium leading-snug drop-shadow-sm">
            {getStatusMessage()}
          </p>
        </div>
      </div>

      {/* Optional Interactive Animation Switcher Chips (Idle, Walk, Run, Agree) */}
      {availableAnimations.length > 0 && (
        <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-[#091326]/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-blue-500/25">
          <span className="text-[10px] text-zinc-400 font-mono mr-1 hidden sm:inline">
            POSE:
          </span>
          {['idle', 'walk', 'run', 'agree'].map((anim) => {
            const isAvailable = availableAnimations.includes(anim);
            if (!isAvailable) return null;
            const isCurrent = activeAnimName === anim;

            return (
              <button
                key={anim}
                onClick={() => playAnimation(anim)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-sans capitalize transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.6)] font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {anim}
              </button>
            );
          })}
        </div>
      )}

      {/* Holographic Compass / Gaze Indicator in Bottom Right */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#081020]/75 border border-cyan-500/20 text-[10px] font-mono text-cyan-300">
        <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
        <span>KINEMATIC RIG 60FPS</span>
      </div>

      {/* Interactive Avatar Emote Control Dock */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-1.5 pointer-events-auto bg-[#070e20]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 shadow-lg max-w-[calc(100%-180px)] overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0 mr-1 text-[10px] font-mono font-bold text-cyan-400">
          <Sparkles className="w-3 h-3 text-cyan-300" />
          <span className="hidden sm:inline">EMOTE:</span>
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-200 capitalize">
            {currentEmote}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSelectEmote(null)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium whitespace-nowrap transition-all cursor-pointer ${
            manualEmote === null
              ? 'bg-blue-600 text-white font-bold shadow-[0_0_8px_rgba(37,99,235,0.6)]'
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
          { id: 'surprised', label: '😲 Surprise' },
          { id: 'concerned', label: '🥺 Empathy' },
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
