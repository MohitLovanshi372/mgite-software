/**
 * GLBModelViewer Component
 *
 * Professional 3D GLB/GLTF Model Studio & Inspector for Ultron Galaxy OS:
 * - Direct Three.js WebGL rendering with GLTFLoader & OrbitControls
 * - Supports preset GLBs, procedural sci-fi cores, drag-and-drop local uploads, and remote URLs
 * - Real-time animation mixer with playback, speed modulation, and clip switching
 * - Interactive Material Shader overrides: Original PBR, Ultron Crimson Glow, Obsidian Chrome, Wireframe Ghost, Cyber Matrix
 * - Lighting environment presets: Crimson Forge, Galactic Starlight, Deep Void, Studio White, Cyber Neon
 * - Deep Model Inspection Telemetry: Triangles, Vertices, Meshes, Materials, Bounding Dimensions
 * - Snapshot PNG exporter, Auto-Rotate, and Camera framing
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  GLBModelOption,
  GLBViewerSettings,
  ModelTelemetry,
  LightingMode,
  MaterialMode,
  AnimationLoopMode,
  AnimationDirection,
  AnimationTrackData,
} from '../../types/glbModels.ts';
import { AnimationMatrixDeck } from './AnimationMatrixDeck.tsx';
import { DEFAULT_GLB_MODELS } from '../../data/glbPresets.ts';
import {
  generateBipedalCyberAnimations,
  PROCEDURAL_KINEMATIC_TRACKS,
} from '../../utils/cyberneticAnimations.ts';
import {
  RotateCcw,
  Play,
  Pause,
  Upload,
  Camera,
  Grid,
  Box,
  Sliders,
  Layers,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Maximize2,
  RefreshCw,
  Eye,
  Activity,
  Cpu,
  Hand,
  Crosshair,
  Zap,
  Move,
  Video,
  VideoOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { gestureEngine } from '../../utils/handGestureDetector.ts';
import { GestureType, HandLandmarks, CombatGestureType, BodyPoseLandmarks } from '../../types/gestures.ts';
import { GestureControlMode } from '../../types/glbModels.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';
import { CombatGestureHUD } from '../Gestures/CombatGestureHUD.tsx';
import { combatPoseDetector } from '../../utils/combatPoseDetector.ts';
import { poseIKRetargeter } from '../../utils/poseIKRetargeter.ts';
import { JarvisStudioHeader } from '../Studio/JarvisStudioHeader.tsx';
import { JarvisLeftSidebar } from '../Studio/JarvisLeftSidebar.tsx';
import { JarvisRightIntelligence } from '../Studio/JarvisRightIntelligence.tsx';
import { JarvisFloatingWebcam } from '../Studio/JarvisFloatingWebcam.tsx';

interface GLBModelViewerProps {
  className?: string;
  onModelTelemetryUpdate?: (telemetry: ModelTelemetry) => void;
  compact?: boolean;
}

export const GLBModelViewer: React.FC<GLBModelViewerProps> = ({
  className = '',
  onModelTelemetryUpdate,
  compact = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const currentModelRef = useRef<THREE.Group | THREE.Object3D | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const boxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animation Matrix Kinematic State & Refs
  const clipsRef = useRef<THREE.AnimationClip[]>([]);
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);
  const animTimeRef = useRef<{ time: number; duration: number }>({ time: 0, duration: 1.0 });
  const playbackDirectionRef = useRef<AnimationDirection>('FORWARD');
  const loopModeRef = useRef<AnimationLoopMode>('REPEAT');
  const showSkeletonRef = useRef<boolean>(false);
  const actionWeightRef = useRef<number>(1.0);

  const [boneCount, setBoneCount] = useState<number>(0);
  const [animationTracks, setAnimationTracks] = useState<AnimationTrackData[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentDuration, setCurrentDuration] = useState<number>(1.0);
  const [blendDuration, setBlendDuration] = useState<number>(0.35);
  const [actionWeight, setActionWeight] = useState<number>(1.0);
  const [loopMode, setLoopMode] = useState<AnimationLoopMode>('REPEAT');
  const [playbackDirection, setPlaybackDirection] = useState<AnimationDirection>('FORWARD');
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);

  // Model & Viewer State
  const [modelList, setModelList] = useState<GLBModelOption[]>(DEFAULT_GLB_MODELS);
  const [selectedModel, setSelectedModel] = useState<GLBModelOption>(DEFAULT_GLB_MODELS[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<ModelTelemetry>({
    triangles: 0,
    vertices: 0,
    meshes: 0,
    materials: 0,
    animations: [],
    bounds: { x: 0, y: 0, z: 0 },
    fileSize: '~3.6 MB',
  });

  const [settings, setSettings] = useState<GLBViewerSettings>({
    wireframe: false,
    autoRotate: true,
    autoRotateSpeed: 1.5,
    lightingMode: 'crimson_forge',
    materialMode: 'original',
    modelScale: 1.0,
    selectedAnimation: '',
    animationSpeed: 1.0,
    isPlaying: true,
    showGrid: true,
    showBoundingBox: false,
    showAxes: false,
  });

  // Hand Gesture 3D Model Control State
  const [gestureControlEnabled, setGestureControlEnabled] = useState<boolean>(true);
  const [gestureMode, setGestureMode] = useState<GestureControlMode>('DUAL');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [showPip, setShowPip] = useState<boolean>(false);
  const [showGestureGuide, setShowGestureGuide] = useState<boolean>(false);
  const [showCombatHUD, setShowCombatHUD] = useState<boolean>(true);
  const combatPoseLandmarksRef = useRef<BodyPoseLandmarks | null>(null);

  // JARVIS Studio Layout & Real-Time Telemetry States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [liveFps, setLiveFps] = useState<number>(60);
  const [liveFrameTime, setLiveFrameTime] = useState<number>(16.6);
  const [detectedCombatGesture, setDetectedCombatGesture] = useState<CombatGestureType>('STOP_IDLE');
  const [combatPoseConfidence, setCombatPoseConfidence] = useState<number>(0.95);
  const [bodyTrackingEnabled, setBodyTrackingEnabled] = useState<boolean>(true);
  const [ikMirrorEnabled, setIkMirrorEnabled] = useState<boolean>(true);
  const [ikBlendWeight, setIkBlendWeight] = useState<number>(0.65);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  const [handTelemetry, setHandTelemetry] = useState<{
    isTracking: boolean;
    gesture: GestureType;
    confidence: number;
    palmX: number;
    palmY: number;
    actionLabel: string;
  }>({
    isTracking: false,
    gesture: 'NONE',
    confidence: 0,
    palmX: 0.5,
    palmY: 0.5,
    actionLabel: 'READY // GESTURE ACTIVE',
  });

  const gestureVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement>(null);

  const gestureStateRef = useRef<{
    enabled: boolean;
    mode: GestureControlMode;
    isTracking: boolean;
    gesture: GestureType;
    confidence: number;
    rawMotion: number;
    palmX: number;
    palmY: number;
    targetRotX: number;
    targetRotY: number;
    targetRotZ: number;
    targetPosX: number;
    targetPosY: number;
    targetPosZ: number;
    targetScale: number;
  }>({
    enabled: true,
    mode: 'DUAL',
    isTracking: false,
    gesture: 'NONE',
    confidence: 0,
    rawMotion: 0,
    palmX: 0.5,
    palmY: 0.5,
    targetRotX: 0,
    targetRotY: 0,
    targetRotZ: 0,
    targetPosX: 0,
    targetPosY: 0,
    targetPosZ: 0,
    targetScale: 1.0,
  });

  useEffect(() => {
    gestureStateRef.current.mode = gestureMode;
  }, [gestureMode]);

  // Subscribe to optical gesture detector stream and frame broadcasts
  useEffect(() => {
    const unsubStatus = gestureEngine.subscribeStatus((active) => {
      setIsCameraActive(active);
    });

    const unsubFrame = gestureEngine.subscribeFrame((landmarks, gesture, conf) => {
      const g = gestureStateRef.current;
      g.isTracking = landmarks.isTracking;
      g.gesture = gesture;
      g.confidence = conf;
      g.rawMotion = landmarks.rawMotion;
      g.palmX = landmarks.palmCenter.x;
      g.palmY = landmarks.palmCenter.y;

      let label = 'TRACKING';
      if (!landmarks.isTracking) {
        label = isCameraActive ? 'SEARCHING FOR HAND...' : 'OPTICAL SENSOR READY';
      } else {
        // Mirrored coordinate:
        // x goes 0..1 (0 = camera left, user right in selfie view)
        const normX = (landmarks.palmCenter.x - 0.5) * 2; // -1 to +1
        const normY = (landmarks.palmCenter.y - 0.5) * 2; // -1 to +1

        // Map to 3D rotation angles (Pitch and Yaw)
        g.targetRotY = -normX * Math.PI * 1.8;
        g.targetRotX = normY * Math.PI * 0.9;
        g.targetRotZ = -normX * normY * 0.4;

        // Map to 3D spatial positions (X, Y, Z translation)
        g.targetPosX = normX * 2.6;
        g.targetPosY = -normY * 1.8;
        g.targetPosZ = (0.5 - landmarks.palmCenter.y) * 1.4;

        if (gesture === 'FIST') {
          label = '✊ GRAB & ROTATE 3D';
        } else if (gesture === 'OPEN_PALM') {
          label = '✋ LEVITATE & HOVER';
        } else if (gesture === 'POINT_INDEX') {
          label = '☝️ MOVE IN 3D SPACE';
        } else if (gesture === 'PINCH') {
          label = '🤏 ZOOM / SCALE';
          g.targetScale = Math.max(0.35, Math.min(2.8, 1.0 + -normY * 1.2));
        } else if (gesture === 'VICTORY_PEACE') {
          label = '✌️ RESET & RE-CENTER';
        } else if (gesture === 'THUMBS_UP') {
          label = '👍 TURBO SPIN';
        } else {
          label = '✋ HAND POSITION TRACKING';
        }
      }

      setHandTelemetry({
        isTracking: landmarks.isTracking,
        gesture,
        confidence: conf,
        palmX: landmarks.palmCenter.x,
        palmY: landmarks.palmCenter.y,
        actionLabel: label,
      });

      // Render skeletal lines if PIP monitor is visible
      const canvas = pipCanvasRef.current;
      if (canvas && landmarks.isTracking) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const w = canvas.width;
          const h = canvas.height;
          ctx.strokeStyle =
            gesture === 'FIST'
              ? '#ef4444'
              : gesture === 'VICTORY_PEACE'
              ? '#10b981'
              : gesture === 'POINT_INDEX'
              ? '#38bdf8'
              : '#f97316';
          ctx.lineWidth = 2;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 6;

          const pts = [
            landmarks.wrist,
            landmarks.thumbTip,
            landmarks.indexTip,
            landmarks.middleTip,
            landmarks.ringTip,
            landmarks.pinkyTip,
          ];

          ctx.beginPath();
          pts.forEach((pt) => {
            ctx.moveTo(landmarks.wrist.x * w, landmarks.wrist.y * h);
            ctx.lineTo(landmarks.palmCenter.x * w, landmarks.palmCenter.y * h);
            ctx.lineTo(pt.x * w, pt.y * h);
          });
          ctx.stroke();

          // Joint dots
          ctx.fillStyle = '#ffffff';
          pts.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, 3, 0, Math.PI * 2);
            ctx.fill();
          });

          // Palm core reactor
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.arc(landmarks.palmCenter.x * w, landmarks.palmCenter.y * h, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      unsubStatus();
      unsubFrame();
    };
  }, [isCameraActive]);

  // 1. Initialize Three.js Viewport
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene with dark atmospheric fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040508);
    scene.fog = new THREE.Fog(0x040508, 15, 60);
    sceneRef.current = scene;

    // Camera framed cleanly on full-body character
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 3.4);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.5;
    controls.maxDistance = 35;
    controls.maxPolarAngle = Math.PI * 0.95;
    controls.target.set(0, 0, 0);
    controls.autoRotate = settings.autoRotate;
    controls.autoRotateSpeed = settings.autoRotateSpeed;
    controlsRef.current = controls;

    // Circular Sci-Fi Platform / Grid (ground level aligned with base of model)
    const grid = new THREE.GridHelper(10, 20, 0xef4444, 0x27272a);
    grid.position.set(0, -1.1, 0);
    scene.add(grid);
    gridHelperRef.current = grid;

    // Lighting Group
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;
    updateLighting(settings.lightingMode, lightsGroup);

    // Animation Clock & Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Real-time FPS and Frame Time calculation
      frameCountRef.current++;
      const nowMs = performance.now();
      if (nowMs - lastFpsTimeRef.current >= 500) {
        const measuredFps = Math.round((frameCountRef.current * 1000) / (nowMs - lastFpsTimeRef.current));
        const measuredFt = Number((delta * 1000).toFixed(1));
        setLiveFps(measuredFps > 0 ? measuredFps : 60);
        setLiveFrameTime(measuredFt > 0 ? measuredFt : 16.6);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = nowMs;
      }

      if (mixerRef.current && settings.isPlaying) {
        const timeScaleDir = playbackDirectionRef.current === 'REVERSE' ? -1 : 1;
        mixerRef.current.update(delta * settings.animationSpeed * timeScaleDir);
      }

      // Real-Time Humanoid Pose IK Retargeting (shoulder -> elbow -> wrist mapping)
      if (poseIKRetargeter.getIsEnabled() && combatPoseLandmarksRef.current) {
        poseIKRetargeter.update(combatPoseLandmarksRef.current, delta);
      }

      // Update Skeletal Wireframe Rig if enabled
      if (skeletonHelperRef.current && showSkeletonRef.current) {
        skeletonHelperRef.current.updateMatrixWorld(true);
      }

      // Track current time and clip duration for Animation Matrix timeline scrubber
      if (currentActionRef.current) {
        const clip = currentActionRef.current.getClip();
        const dur = clip.duration;
        let t = currentActionRef.current.time;
        if (dur > 0) {
          if (loopModeRef.current === 'REPEAT') {
            t = t % dur;
            if (t < 0) t += dur;
          } else {
            t = Math.max(0, Math.min(dur, t));
          }
        }
        animTimeRef.current = { time: t, duration: dur };
      } else if (clipsRef.current.length === 0 && currentModelRef.current) {
        const activeTrack = PROCEDURAL_KINEMATIC_TRACKS.find((t) => t.name === settings.selectedAnimation);
        const dur = activeTrack?.duration || 4.0;
        const t = clock.getElapsedTime() % dur;
        animTimeRef.current = { time: t, duration: dur };

        if (settings.isPlaying && !gestureStateRef.current.isTracking) {
          const m = currentModelRef.current;
          const time = clock.getElapsedTime() * settings.animationSpeed;
          const anim = settings.selectedAnimation;
          const weight = actionWeightRef.current;

          if (anim === 'TURNTABLE SCAN') {
            m.rotation.y += delta * 1.5 * settings.animationSpeed;
            m.rotation.x = Math.sin(time * 2.0) * 0.12 * weight;
          } else if (anim === 'LEVITATION HOVER') {
            m.position.y = Math.sin(time * 2.5) * 0.22 * weight;
            m.rotation.z = Math.sin(time * 1.8) * 0.08 * weight;
          } else if (anim === 'TACTICAL GYRO') {
            m.rotation.y = Math.sin(time * 1.5) * 0.7 * weight;
            m.rotation.x = Math.cos(time * 1.8) * 0.25 * weight;
          } else if (anim === 'HYPER PULSE') {
            const pulse = 1.0 + Math.sin(time * 7.0) * 0.08 * weight;
            const baseS = (m.userData.baseScale as number) || 1.0;
            m.scale.set(baseS * pulse, baseS * pulse, baseS * pulse);
          } else if (anim === 'SENTINEL SWEEP') {
            m.rotation.y = Math.sin(time * 1.2) * 0.85 * weight;
            m.rotation.x = Math.sin(time * 2.4) * 0.2 * weight;
            m.position.y = Math.cos(time * 1.6) * 0.06 * weight;
          } else if (anim === 'WARP DRIVE ENGAGE') {
            m.rotation.z += delta * 4.0 * settings.animationSpeed * weight;
            m.rotation.x = Math.sin(time * 3.0) * 0.15 * weight;
            m.position.z = Math.sin(time * 5.0) * 0.25 * weight;
          } else if (anim === 'COMBAT EVASION') {
            m.rotation.z = Math.sin(time * 3.2) * 0.65 * weight;
            m.rotation.y = Math.cos(time * 2.0) * 0.45 * weight;
            m.position.x = Math.sin(time * 2.5) * 0.35 * weight;
            m.position.y = Math.cos(time * 3.5) * 0.15 * weight;
          } else if (anim === 'OVERLOAD JITTER') {
            const jitterX = (Math.random() - 0.5) * 0.04 * weight;
            const jitterY = (Math.random() - 0.5) * 0.04 * weight;
            const shock = Math.sin(time * 12.0) > 0.85 ? 0.1 : 0;
            m.position.set(jitterX, jitterY, shock * weight);
            m.rotation.z = (Math.random() - 0.5) * 0.08 * weight;
          } else if (anim === 'QUANTUM BREACH') {
            const baseS = (m.userData.baseScale as number) || 1.0;
            const sx = 1.0 + Math.sin(time * 3.0) * 0.12 * weight;
            const sy = 1.0 + Math.cos(time * 2.5) * 0.14 * weight;
            const sz = 1.0 + Math.sin(time * 4.0) * 0.10 * weight;
            m.scale.set(baseS * sx, baseS * sy, baseS * sz);
            m.rotation.y += delta * 0.8 * settings.animationSpeed;
          } else if (anim === 'STEALTH GLIDE') {
            m.position.y = Math.sin(time * 1.4) * 0.15 * weight;
            m.rotation.z = Math.sin(time * 1.4) * 0.18 * weight;
            m.rotation.x = -0.1 + Math.cos(time * 1.4) * 0.08 * weight;
          } else if (anim === 'DEFENSE MATRIX') {
            const vibr = Math.sin(time * 20.0) * 0.015 * weight;
            const pulse = 1.0 + Math.sin(time * 4.0) * 0.06 * weight;
            const baseS = (m.userData.baseScale as number) || 1.0;
            m.scale.set(baseS * pulse, baseS * pulse, baseS * pulse);
            m.position.x = vibr;
            m.position.y = Math.cos(time * 2.0) * 0.08 * weight;
          }
        }
      }

      // Hand Gesture 3D Model Motion Controller
      const g = gestureStateRef.current;
      const model = currentModelRef.current;

      if (g.enabled && model) {
        const baseScale = (model.userData.baseScale as number) || 1.0;

        if (g.isTracking) {
          // Pause camera auto-rotate so user hand directly guides the model
          if (controlsRef.current) {
            controlsRef.current.autoRotate = false;
          }

          if (g.gesture === 'OPEN_PALM') {
            // LEVITATE & HOVER:
            // Elevates and hovers at hand elevation with gentle sci-fi anti-gravity float
            const hoverY = g.targetPosY + Math.sin(clock.getElapsedTime() * 3.5) * 0.08;
            model.position.y += (hoverY - model.position.y) * 0.08;
            model.rotation.y += (g.targetRotY - model.rotation.y) * 0.06;
            model.rotation.x += (g.targetRotX * 0.5 - model.rotation.x) * 0.06;
          } else if (g.gesture === 'FIST') {
            // GRAB & ROTATE (Tight 1:1 kinetic direct manipulation)
            model.rotation.y += (g.targetRotY - model.rotation.y) * 0.16;
            model.rotation.x += (g.targetRotX - model.rotation.x) * 0.16;
            model.rotation.z += (g.targetRotZ - model.rotation.z) * 0.14;

            if (g.mode === 'DUAL' || g.mode === 'TRANSLATE') {
              model.position.x += (g.targetPosX - model.position.x) * 0.12;
              model.position.y += (g.targetPosY - model.position.y) * 0.12;
            }
          } else if (g.gesture === 'POINT_INDEX') {
            // TRANSLATE / MOVE IN 3D SPACE toward pointed coordinate
            model.position.x += (g.targetPosX - model.position.x) * 0.10;
            model.position.y += (g.targetPosY - model.position.y) * 0.10;
            model.position.z += (g.targetPosZ - model.position.z) * 0.10;
            model.rotation.y += (g.targetRotY * 0.6 - model.rotation.y) * 0.08;
          } else if (g.gesture === 'PINCH') {
            // ZOOM / SCALE model
            const targetS = Math.max(0.3, Math.min(3.0, baseScale * g.targetScale * settings.modelScale));
            model.scale.x += (targetS - model.scale.x) * 0.12;
            model.scale.y += (targetS - model.scale.y) * 0.12;
            model.scale.z += (targetS - model.scale.z) * 0.12;
          } else if (g.gesture === 'VICTORY_PEACE') {
            // RE-CENTER and reset orientation
            model.position.x += (0 - model.position.x) * 0.12;
            model.position.y += (0 - model.position.y) * 0.12;
            model.position.z += (0 - model.position.z) * 0.12;
            model.rotation.x += (0 - model.rotation.x) * 0.12;
            model.rotation.y += (0 - model.rotation.y) * 0.12;
            model.rotation.z += (0 - model.rotation.z) * 0.12;
            const targetS = baseScale * settings.modelScale;
            model.scale.x += (targetS - model.scale.x) * 0.12;
            model.scale.y += (targetS - model.scale.y) * 0.12;
            model.scale.z += (targetS - model.scale.z) * 0.12;
          } else if (g.gesture === 'THUMBS_UP') {
            // TURBO SPIN
            model.rotation.y += 0.05;
          } else {
            // Default Hand Movement when tracked
            if (g.mode === 'ROTATE' || g.mode === 'DUAL') {
              model.rotation.y += (g.targetRotY - model.rotation.y) * 0.08;
              model.rotation.x += (g.targetRotX - model.rotation.x) * 0.08;
            }
            if (g.mode === 'TRANSLATE' || g.mode === 'DUAL') {
              model.position.x += (g.targetPosX - model.position.x) * 0.08;
              model.position.y += (g.targetPosY - model.position.y) * 0.08;
            }
          }

          if (boxHelperRef.current && settings.showBoundingBox) {
            boxHelperRef.current.update();
          }
        } else {
          // Hand not in view: restore auto-rotation if enabled
          if (controlsRef.current) {
            controlsRef.current.autoRotate = settings.autoRotate;
            controlsRef.current.autoRotateSpeed = settings.autoRotateSpeed;
          }
        }
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = settings.autoRotate;
        controlsRef.current.autoRotateSpeed = settings.autoRotateSpeed;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // If procedural model, animate internal structures
      if (currentModelRef.current && currentModelRef.current.userData.isProcedural) {
        const time = clock.getElapsedTime();
        currentModelRef.current.userData.update?.(time);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Lighting Presets Configuration
  const updateLighting = (mode: LightingMode, group: THREE.Group) => {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    if (mode === 'crimson_forge') {
      // Ultron Signature Crimson / Scarlet Forge Lighting with balanced neutral key & ambient
      const ambWhite = new THREE.AmbientLight(0xffffff, 0.9);
      const ambCrimson = new THREE.AmbientLight(0x7f1d1d, 1.2);

      const keyWhite = new THREE.DirectionalLight(0xffffff, 2.6);
      keyWhite.position.set(3, 6, 4);
      keyWhite.castShadow = true;

      const fillCrimson = new THREE.DirectionalLight(0xef4444, 2.2);
      fillCrimson.position.set(-4, 2, 2);

      const rimCrimson = new THREE.DirectionalLight(0xf87171, 2.8);
      rimCrimson.position.set(0, 4, -4);

      const bottomGlow = new THREE.PointLight(0xdc2626, 2.0, 10);
      bottomGlow.position.set(0, 0.1, 0);

      group.add(ambWhite, ambCrimson, keyWhite, fillCrimson, rimCrimson, bottomGlow);
    } else if (mode === 'galactic_starlight') {
      // Deep Space Galactic Starlight (Cyan & Violet)
      const amb = new THREE.AmbientLight(0x050c18, 1.4);
      const key = new THREE.DirectionalLight(0x38bdf8, 3.2);
      key.position.set(4, 5, 3);

      const fill = new THREE.DirectionalLight(0xa855f7, 2.5);
      fill.position.set(-4, 2, -3);

      const rim = new THREE.PointLight(0x06b6d4, 3.5, 15);
      rim.position.set(0, 3, -4);

      group.add(amb, key, fill, rim);
    } else if (mode === 'deep_void') {
      // High contrast dramatic chiaroscuro
      const amb = new THREE.AmbientLight(0x030305, 0.6);
      const key = new THREE.DirectionalLight(0xffffff, 3.0);
      key.position.set(5, 5, 2);

      const rim = new THREE.DirectionalLight(0xef4444, 2.8);
      rim.position.set(-5, -1, -3);

      group.add(amb, key, rim);
    } else if (mode === 'studio') {
      // Clean neutral 3-point studio illumination
      const amb = new THREE.AmbientLight(0xffffff, 1.6);
      const key = new THREE.DirectionalLight(0xffffff, 2.5);
      key.position.set(3, 6, 4);

      const fill = new THREE.DirectionalLight(0xd4d4d8, 1.4);
      fill.position.set(-4, 2, -2);

      const back = new THREE.DirectionalLight(0xe4e4e7, 1.8);
      back.position.set(0, 4, -5);

      group.add(amb, key, fill, back);
    } else if (mode === 'cyber_neon') {
      // Hot Magenta & Cyan Cyberpunk
      const amb = new THREE.AmbientLight(0x0a0515, 1.2);
      const key = new THREE.DirectionalLight(0xec4899, 4.0);
      key.position.set(4, 4, 3);

      const fill = new THREE.DirectionalLight(0x06b6d4, 3.5);
      fill.position.set(-4, 2, -3);

      const point = new THREE.PointLight(0x8b5cf6, 3.0, 10);
      point.position.set(0, -1, 2);

      group.add(amb, key, fill, point);
    }
  };

  // Sync Lighting on change
  useEffect(() => {
    if (lightsGroupRef.current) {
      updateLighting(settings.lightingMode, lightsGroupRef.current);
    }
  }, [settings.lightingMode]);

  // Sync Grid on change
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = settings.showGrid;
    }
  }, [settings.showGrid]);

  // Sync Bounding Box on change
  useEffect(() => {
    if (boxHelperRef.current) {
      boxHelperRef.current.visible = settings.showBoundingBox;
    }
  }, [settings.showBoundingBox]);

  // 3. Procedural 3D Model Builders
  const buildProceduralSingularity = (): THREE.Group => {
    const group = new THREE.Group();
    group.userData.isProcedural = true;

    // Core pulsing tesseract (nested wireframe cubes)
    const cubeGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.95,
      roughness: 0.15,
      wireframe: false,
    });
    const cubeMesh = new THREE.Mesh(cubeGeom, cubeMat);
    group.add(cubeMesh);

    // Glowing wireframe outer cage
    const wireGeom = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
    });
    const wireMesh = new THREE.Mesh(wireGeom, wireMat);
    group.add(wireMesh);

    // Inner Singularity Plasma Core (pulsing emissive sphere)
    const sphereGeom = new THREE.SphereGeometry(0.55, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xff1122,
      emissive: 0xef4444,
      emissiveIntensity: 2.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
    group.add(sphereMesh);

    // Triple Torus Gimbal Rings
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.04, 16, 100), ringMat1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.035, 16, 100), ringMat1);
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.03, 16, 100), ringMat1);

    ring2.rotation.x = Math.PI / 3;
    ring3.rotation.y = Math.PI / 3;

    group.add(ring1, ring2, ring3);

    // Orbital Energy Particle Nodes
    const particleCount = 40;
    const particleGeom = new THREE.SphereGeometry(0.04, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleGroup = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(particleGeom, particleMat);
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.7 + (i % 3) * 0.3;
      p.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.4, Math.sin(angle) * radius);
      particleGroup.add(p);
    }
    group.add(particleGroup);

    // Dynamic rotation update hook
    group.userData.update = (time: number) => {
      cubeMesh.rotation.x = time * 0.8;
      cubeMesh.rotation.y = time * 1.1;
      wireMesh.rotation.x = -time * 0.5;
      wireMesh.rotation.z = time * 0.6;

      ring1.rotation.z = time * 1.4;
      ring2.rotation.x = Math.PI / 3 + time * 1.2;
      ring3.rotation.y = Math.PI / 3 - time * 0.9;

      particleGroup.rotation.y = time * 0.7;

      const pulse = 1.0 + Math.sin(time * 6) * 0.12;
      sphereMesh.scale.set(pulse, pulse, pulse);
    };

    return group;
  };

  const buildJarvisHologramCore = (): THREE.Group => {
    const group = new THREE.Group();
    group.userData.isProcedural = true;

    // 1. Central Arc Reactor Core (pulsing cyan / gold emissive sphere)
    const coreGeom = new THREE.SphereGeometry(0.55, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    group.add(coreMesh);

    // 2. Holographic Arc Reactor Triangular Octahedron Cage
    const octaGeom = new THREE.OctahedronGeometry(0.9, 0);
    const octaMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
    });
    const octaMesh = new THREE.Mesh(octaGeom, octaMat);
    group.add(octaMesh);

    // 3. Concentric Holographic HUD Arc Rings (Cyan & Gold)
    const cyanRingMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      metalness: 0.8,
      roughness: 0.2,
    });
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.03, 16, 80), cyanRingMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.025, 16, 80), goldRingMat);
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.03, 16, 80), cyanRingMat);

    ring2.rotation.x = Math.PI / 4;
    ring3.rotation.y = Math.PI / 4;
    group.add(ring1, ring2, ring3);

    // 4. Floating holographic nodes
    const nodeCount = 36;
    const nodeGeom = new THREE.SphereGeometry(0.035, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const nodeGroup = new THREE.Group();
    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(nodeGeom, nodeMat);
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 1.5 + (i % 3) * 0.35;
      node.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.3, Math.sin(angle) * radius);
      nodeGroup.add(node);
    }
    group.add(nodeGroup);

    group.userData.update = (time: number) => {
      const pulse = 1.0 + Math.sin(time * 3) * 0.06;
      coreMesh.scale.set(pulse, pulse, pulse);
      octaMesh.rotation.x = time * 0.7;
      octaMesh.rotation.y = time * 0.9;
      ring1.rotation.z = time * 0.5;
      ring2.rotation.x = time * 0.6;
      ring2.rotation.y = time * 0.4;
      ring3.rotation.y = -time * 0.4;
      ring3.rotation.z = time * 0.3;
      nodeGroup.rotation.y = time * 0.25;
    };

    return group;
  };

  // 4. Load 3D Model (Procedural or GLTF/GLB)
  const loadModel = useCallback((modelOption: GLBModelOption) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    setIsLoading(true);
    setLoadingProgress(10);
    setErrorMessage(null);

    // Clean up old model
    if (currentModelRef.current) {
      scene.remove(currentModelRef.current);
      currentModelRef.current = null;
    }
    if (boxHelperRef.current) {
      scene.remove(boxHelperRef.current);
      boxHelperRef.current = null;
    }
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }
    originalMaterialsRef.current.clear();

    // Check if procedural
    if (modelOption.source === 'procedural') {
      const procGroup = modelOption.id.includes('jarvis')
        ? buildJarvisHologramCore()
        : buildProceduralSingularity();

      procGroup.scale.set(modelOption.defaultScale, modelOption.defaultScale, modelOption.defaultScale);
      procGroup.userData.baseScale = modelOption.defaultScale;
      procGroup.userData.originalScale = modelOption.defaultScale;
      scene.add(procGroup);
      currentModelRef.current = procGroup;

      // Calculate Box
      const box = new THREE.Box3().setFromObject(procGroup);
      const size = new THREE.Vector3();
      box.getSize(size);

      // Setup Box Helper
      const boxHelper = new THREE.BoxHelper(procGroup, 0xef4444);
      boxHelper.visible = settings.showBoundingBox;
      scene.add(boxHelper);
      boxHelperRef.current = boxHelper;

      // Count vertices / faces
      let totalTris = 0;
      let totalVerts = 0;
      let meshCount = 0;
      procGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          meshCount++;
          if (mesh.geometry) {
            totalVerts += mesh.geometry.attributes.position?.count || 0;
            if (mesh.geometry.index) {
              totalTris += mesh.geometry.index.count / 3;
            } else {
              totalTris += (mesh.geometry.attributes.position?.count || 0) / 3;
            }
          }
          originalMaterialsRef.current.set(mesh, mesh.material);
        }
      });

      if (skeletonHelperRef.current) {
        scene.remove(skeletonHelperRef.current);
        skeletonHelperRef.current.dispose();
        skeletonHelperRef.current = null;
      }
      setBoneCount(0);
      clipsRef.current = [];
      currentActionRef.current = null;

      setAnimationTracks(PROCEDURAL_KINEMATIC_TRACKS);
      setCurrentDuration(PROCEDURAL_KINEMATIC_TRACKS[0].duration);
      setSettings((prev) => ({
        ...prev,
        selectedAnimation: PROCEDURAL_KINEMATIC_TRACKS[0].name,
        isPlaying: true,
      }));

      const telem: ModelTelemetry = {
        triangles: Math.round(totalTris),
        vertices: totalVerts,
        meshes: meshCount,
        materials: meshCount,
        animations: PROCEDURAL_KINEMATIC_TRACKS.map((t) => t.name),
        bounds: {
          x: parseFloat(size.x.toFixed(2)),
          y: parseFloat(size.y.toFixed(2)),
          z: parseFloat(size.z.toFixed(2)),
        },
        fileSize: 'Procedural Shader',
      };

      setTelemetry(telem);
      onModelTelemetryUpdate?.(telem);
      setIsLoading(false);
      setLoadingProgress(100);
      return;
    }

    // Otherwise, Load with GLTFLoader and Draco compression support
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);

    const onGLTFSuccess = (gltf: any) => {
        const root = gltf.scene;

        // Auto-center and compute bounding box
        const box = new THREE.Box3().setFromObject(root);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        // Center root object at origin
        root.position.x = -center.x;
        root.position.y = -center.y;
        root.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = (2.2 / (maxDim || 1)) * modelOption.defaultScale;

        const modelGroup = new THREE.Group();
        modelGroup.add(root);
        modelGroup.scale.set(targetScale, targetScale, targetScale);
        modelGroup.userData.baseScale = targetScale;
        modelGroup.userData.originalScale = targetScale;
        scene.add(modelGroup);
        currentModelRef.current = modelGroup;

        // Setup Box Helper
        const boxHelper = new THREE.BoxHelper(modelGroup, 0xef4444);
        boxHelper.visible = settings.showBoundingBox;
        scene.add(boxHelper);
        boxHelperRef.current = boxHelper;

        // Count meshes, materials, polygons, vertices
        let totalTris = 0;
        let totalVerts = 0;
        let meshCount = 0;
        const matSet = new Set<THREE.Material>();

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.frustumCulled = false;
            meshCount++;

            if (mesh.geometry) {
              totalVerts += mesh.geometry.attributes.position?.count || 0;
              if (mesh.geometry.index) {
                totalTris += mesh.geometry.index.count / 3;
              } else {
                totalTris += (mesh.geometry.attributes.position?.count || 0) / 3;
              }
            }

            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => matSet.add(m));
            } else if (mesh.material) {
              matSet.add(mesh.material);
            }

            originalMaterialsRef.current.set(mesh, mesh.material);
          }
        });

        // Setup Skeleton Rig Helper
        if (skeletonHelperRef.current) {
          scene.remove(skeletonHelperRef.current);
          skeletonHelperRef.current.dispose();
          skeletonHelperRef.current = null;
        }

        let bonesFound = 0;
        root.traverse((child) => {
          if ((child as THREE.Bone).isBone) {
            bonesFound++;
          }
        });
        setBoneCount(bonesFound);

        if (bonesFound > 0) {
          const skeleton = new THREE.SkeletonHelper(root);
          // @ts-ignore
          if (skeleton.material) {
            // @ts-ignore
            skeleton.material.color = new THREE.Color(0x06b6d4);
            // @ts-ignore
            skeleton.material.depthTest = false;
            // @ts-ignore
            skeleton.material.transparent = true;
            // @ts-ignore
            skeleton.material.opacity = 0.85;
          }
          skeleton.visible = showSkeletonRef.current;
          scene.add(skeleton);
          skeletonHelperRef.current = skeleton;
        }

        // Bind humanoid skeleton armature to IK Retargeter
        poseIKRetargeter.bindSkeleton(root);

        // Animations Setup
        const animationNames: string[] = [];
        const cyberClips = generateBipedalCyberAnimations(root);
        const combinedClips = [...(gltf.animations || []), ...cyberClips];

        if (combinedClips.length > 0) {
          clipsRef.current = combinedClips;
          const mixer = new THREE.AnimationMixer(root);
          mixerRef.current = mixer;

          // Auto-recovery: Return to idle when one-shot combat action completes
          mixer.addEventListener('finished', (e: any) => {
            const finishedAction = e.action as THREE.AnimationAction;
            const clip = finishedAction?.getClip();
            const name = clip?.name;
            if (
              name &&
              [
                'RIGHT_PUNCH',
                'LEFT_PUNCH',
                'UPPERCUT',
                'KINETIC_KICK',
                'DODGE_LEFT',
                'DODGE_RIGHT',
                'ENERGY_BLAST',
                'DOUBLE_PALM',
                'TORNADO_KICK',
                'ACROBATIC_FLIP',
                'BOW',
                'CYBER_WAVE',
              ].includes(name)
            ) {
              const idleClip = clipsRef.current.find((c) =>
                c.name.toLowerCase().includes('idle')
              );
              if (idleClip) {
                handleSelectAnimation(idleClip.name, 0.25);
              }
            }
          });

          const categorizedTracks: AnimationTrackData[] = combinedClips.map((clip, index) => {
            const name = clip.name || `Track_${index + 1}`;
            animationNames.push(name);

            let category: AnimationTrackData['category'] = 'ACTION';
            const lower = name.toLowerCase();
            if (
              lower.includes('walk') ||
              lower.includes('run') ||
              lower.includes('sprint') ||
              lower.includes('sneak') ||
              lower.includes('zen') ||
              lower.includes('taichi')
            ) {
              category = 'LOCOMOTION';
            } else if (
              lower.includes('agree') ||
              lower.includes('headshake') ||
              lower.includes('shake') ||
              lower.includes('nod') ||
              lower.includes('wave') ||
              lower.includes('salute') ||
              lower.includes('victory')
            ) {
              category = 'EMOTE';
            } else if (
              lower.includes('sad') ||
              lower.includes('pose') ||
              lower.includes('stance') ||
              lower.includes('guard') ||
              lower.includes('sweep') ||
              lower.includes('sentinel')
            ) {
              category = 'STANCE';
            } else if (
              lower.includes('idle') ||
              lower.includes('stand') ||
              lower.includes('rest') ||
              lower.includes('hover')
            ) {
              category = 'IDLE';
            } else {
              category = 'ACTION';
            }

            return {
              name,
              duration: parseFloat(clip.duration.toFixed(2)),
              tracksCount: clip.tracks.length,
              category,
            };
          });

          setAnimationTracks(categorizedTracks);

          // Play default first animation (or idle if available)
          const idleClip = combinedClips.find((c) => c.name.toLowerCase() === 'idle') || combinedClips[0];
          const action = mixer.clipAction(idleClip);
          if (loopModeRef.current === 'ONCE') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
          } else if (loopModeRef.current === 'PING_PONG') {
            action.setLoop(THREE.LoopPingPong, Infinity);
          } else {
            action.setLoop(THREE.LoopRepeat, Infinity);
          }
          const timeScaleDir = playbackDirectionRef.current === 'REVERSE' ? -1 : 1;
          action.setEffectiveTimeScale(settings.animationSpeed * timeScaleDir);
          action.setEffectiveWeight(actionWeightRef.current);
          action.play();
          currentActionRef.current = action;
          setCurrentDuration(idleClip.duration);

          setSettings((prev) => ({
            ...prev,
            selectedAnimation: idleClip.name || 'Track_1',
            isPlaying: true,
          }));
        } else {
          clipsRef.current = [];
          currentActionRef.current = null;
          setAnimationTracks(PROCEDURAL_KINEMATIC_TRACKS);
          animationNames.push(...PROCEDURAL_KINEMATIC_TRACKS.map((t) => t.name));
          setCurrentDuration(PROCEDURAL_KINEMATIC_TRACKS[0].duration);
          setSettings((prev) => ({
            ...prev,
            selectedAnimation: PROCEDURAL_KINEMATIC_TRACKS[0].name,
            isPlaying: true,
          }));
        }

        // Apply current material mode
        applyMaterialMode(settings.materialMode, modelGroup);

        const telem: ModelTelemetry = {
          triangles: Math.round(totalTris),
          vertices: totalVerts,
          meshes: meshCount,
          materials: matSet.size,
          animations: animationNames,
          bounds: {
            x: parseFloat(size.x.toFixed(2)),
            y: parseFloat(size.y.toFixed(2)),
            z: parseFloat(size.z.toFixed(2)),
          },
          fileSize: modelOption.triangleEstimate || '~3.2 MB',
        };

        setTelemetry(telem);
        onModelTelemetryUpdate?.(telem);

        // Frame camera cleanly centered on android model
        camera.position.set(0, 0.4, 3.2);
        controls.target.set(0, 0, 0);
        controls.update();

        setIsLoading(false);
        setLoadingProgress(100);
    };

    const onGLTFError = (error: any) => {
      console.error('Error loading GLB:', error);
      setIsLoading(false);
      setErrorMessage('Failed to parse 3D GLB/GLTF asset. Falling back to Procedural Core.');
      // Fallback to procedural model
      const fallback = DEFAULT_GLB_MODELS.find((m) => m.source === 'procedural') || DEFAULT_GLB_MODELS[0];
      if (fallback) {
        loadModel(fallback);
      }
    };

    if (modelOption.arrayBuffer) {
      try {
        loader.parse(modelOption.arrayBuffer, '', onGLTFSuccess, onGLTFError);
      } catch (err) {
        onGLTFError(err);
      }
    } else {
      loader.load(
        modelOption.url,
        onGLTFSuccess,
        (xhr) => {
          if (xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            setLoadingProgress(pct);
          } else {
            setLoadingProgress((prev) => Math.min(90, prev + 15));
          }
        },
        onGLTFError
      );
    }
  }, [settings.materialMode, settings.showBoundingBox]);

  const handleReloadModel = useCallback(() => {
    loadModel(selectedModel);
  }, [selectedModel, loadModel]);

  // Initial load
  useEffect(() => {
    loadModel(selectedModel);
  }, [selectedModel]);

  // 5. Material Shader Override Engine
  const applyMaterialMode = (mode: MaterialMode, group: THREE.Object3D) => {
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const original = originalMaterialsRef.current.get(mesh);

        if (mode === 'original') {
          if (original) {
            mesh.material = original;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => {
                if ('wireframe' in m) {
                  (m as THREE.MeshStandardMaterial).wireframe = settings.wireframe;
                }
              });
            } else if ('wireframe' in mesh.material) {
              (mesh.material as THREE.MeshStandardMaterial).wireframe = settings.wireframe;
            }
          }
        } else if (mode === 'crimson_glow') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x180505,
            emissive: 0xef4444,
            emissiveIntensity: 0.65,
            metalness: 0.9,
            roughness: 0.2,
            wireframe: settings.wireframe,
          });
        } else if (mode === 'obsidian_titanium') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x09090b,
            metalness: 0.98,
            roughness: 0.08,
            wireframe: settings.wireframe,
          });
        } else if (mode === 'wireframe_ghost') {
          mesh.material = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            wireframe: true,
          });
        } else if (mode === 'cyber_matrix') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x022c22,
            emissive: 0x10b981,
            emissiveIntensity: 0.9,
            wireframe: true,
          });
        } else if (mode === 'jarvis_cyan') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x082f49,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.75,
            metalness: 0.92,
            roughness: 0.18,
            wireframe: settings.wireframe,
          });
        } else if (mode === 'gold_titanium') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xb45309,
            emissive: 0xd97706,
            emissiveIntensity: 0.35,
            metalness: 0.96,
            roughness: 0.15,
            wireframe: settings.wireframe,
          });
        }
      }
    });
  };

  // Sync Wireframe & Material Mode changes
  useEffect(() => {
    if (currentModelRef.current) {
      applyMaterialMode(settings.materialMode, currentModelRef.current);
    }
  }, [settings.materialMode, settings.wireframe]);

  // Sync live Animation Matrix timeline scrubber smoothly
  useEffect(() => {
    if (!settings.isPlaying) return;
    const interval = setInterval(() => {
      if (animTimeRef.current) {
        setCurrentTime(animTimeRef.current.time);
        setCurrentDuration(animTimeRef.current.duration);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [settings.isPlaying]);

  // Animation Matrix Kinematic Handlers
  const handleSelectAnimation = (animName: string, customBlend = blendDuration) => {
    soundFx.playClick();

    if (clipsRef.current.length > 0 && mixerRef.current) {
      const targetClip = clipsRef.current.find((c) => c.name === animName);
      if (targetClip) {
        const prevAction = currentActionRef.current;
        const newAction = mixerRef.current.clipAction(targetClip);

        const isOneShotCombatAction = [
          'RIGHT_PUNCH',
          'LEFT_PUNCH',
          'UPPERCUT',
          'KINETIC_KICK',
          'DODGE_LEFT',
          'DODGE_RIGHT',
          'ENERGY_BLAST',
          'DOUBLE_PALM',
          'TORNADO_KICK',
          'ACROBATIC_FLIP',
          'BOW',
          'CYBER_WAVE',
        ].includes(targetClip.name);

        // Apply loop mode
        if (isOneShotCombatAction || loopMode === 'ONCE') {
          newAction.setLoop(THREE.LoopOnce, 1);
          newAction.clampWhenFinished = true;
        } else if (loopMode === 'PING_PONG') {
          newAction.setLoop(THREE.LoopPingPong, Infinity);
          newAction.clampWhenFinished = false;
        } else {
          newAction.setLoop(THREE.LoopRepeat, Infinity);
          newAction.clampWhenFinished = false;
        }

        const timeScaleDir = playbackDirection === 'REVERSE' ? -1 : 1;
        newAction.setEffectiveTimeScale(settings.animationSpeed * timeScaleDir);
        newAction.setEffectiveWeight(actionWeight);

        if (prevAction && prevAction !== newAction) {
          newAction.reset();
          newAction.fadeIn(customBlend);
          prevAction.fadeOut(customBlend);
          newAction.play();
        } else {
          newAction.reset().play();
        }

        currentActionRef.current = newAction;
        setCurrentDuration(targetClip.duration);
        setSettings((prev) => ({ ...prev, selectedAnimation: animName, isPlaying: true }));
        return;
      }
    }

    // Procedural track selected
    const procTrack = PROCEDURAL_KINEMATIC_TRACKS.find((t) => t.name === animName);
    if (procTrack) {
      setCurrentDuration(procTrack.duration);
    }
    setSettings((prev) => ({ ...prev, selectedAnimation: animName, isPlaying: true }));
  };

  const handleCombatGestureTrigger = useCallback(
    (gesture: CombatGestureType, animationName: string) => {
      if (clipsRef.current.length === 0 || !mixerRef.current) return;

      if (gesture === 'STOP_IDLE') {
        const idleClip = clipsRef.current.find((c) =>
          c.name.toLowerCase().includes('idle')
        );
        if (idleClip) {
          handleSelectAnimation(idleClip.name, 0.35);
        }
        return;
      }

      const targetClip = clipsRef.current.find(
        (c) =>
          c.name.toUpperCase() === animationName.toUpperCase() ||
          c.name.includes(animationName) ||
          c.name.toLowerCase() === animationName.toLowerCase()
      );

      if (targetClip) {
        handleSelectAnimation(targetClip.name, 0.12);
      }
    },
    [handleSelectAnimation]
  );

  // Current Kinematic State (Derived for JARVIS Intelligence)
  const currentKinematicState = useMemo(() => {
    const anim = (settings.selectedAnimation || '').toLowerCase();
    if (anim.includes('run') || anim.includes('sprint')) return 'RUNNING';
    if (anim.includes('walk') || anim.includes('sneak')) return 'WALKING';
    if (
      anim.includes('punch') ||
      anim.includes('kick') ||
      anim.includes('guard') ||
      anim.includes('combat') ||
      anim.includes('dodge') ||
      anim.includes('uppercut')
    ) {
      return 'FIGHTING';
    }
    return 'IDLE';
  }, [settings.selectedAnimation]);

  // Quick preset selector for Idle | Walk | Run | Fighting | Guard | Punch | Dodge
  const handleSelectMotionPreset = useCallback(
    (presetName: string) => {
      const p = presetName.toLowerCase();
      if (clipsRef.current.length > 0) {
        let target = clipsRef.current.find((c) => c.name.toLowerCase() === p);
        if (!target) {
          if (p.includes('idle')) {
            target = clipsRef.current.find((c) => c.name.toLowerCase().includes('idle'));
          } else if (p.includes('walk')) {
            target = clipsRef.current.find((c) => c.name.toLowerCase().includes('walk'));
          } else if (p.includes('run')) {
            target = clipsRef.current.find((c) => c.name.toLowerCase().includes('run'));
          } else if (p.includes('guard') || p.includes('fight')) {
            target = clipsRef.current.find(
              (c) => c.name.toLowerCase().includes('guard') || c.name.toLowerCase().includes('combat')
            );
          } else if (p.includes('punch')) {
            target = clipsRef.current.find((c) => c.name.toLowerCase().includes('punch'));
          } else if (p.includes('dodge')) {
            target = clipsRef.current.find((c) => c.name.toLowerCase().includes('dodge'));
          }
        }
        if (target) {
          handleSelectAnimation(target.name);
          return;
        }
      }

      const proc = PROCEDURAL_KINEMATIC_TRACKS.find((t) => t.name.toLowerCase().includes(p));
      if (proc) {
        handleSelectAnimation(proc.name);
      } else if (animationTracks.length > 0) {
        handleSelectAnimation(animationTracks[0].name);
      }
    },
    [animationTracks, handleSelectAnimation]
  );

  const handleToggleLoopMode = useCallback(() => {
    setLoopMode((prev) => {
      const next: AnimationLoopMode = prev === 'REPEAT' ? 'ONCE' : prev === 'ONCE' ? 'PING_PONG' : 'REPEAT';
      loopModeRef.current = next;
      if (currentActionRef.current) {
        if (next === 'REPEAT') {
          currentActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
          currentActionRef.current.clampWhenFinished = false;
        } else if (next === 'ONCE') {
          currentActionRef.current.setLoop(THREE.LoopOnce, 1);
          currentActionRef.current.clampWhenFinished = true;
        } else {
          currentActionRef.current.setLoop(THREE.LoopPingPong, Infinity);
          currentActionRef.current.clampWhenFinished = false;
        }
      }
      return next;
    });
  }, []);

  // Real-Time Combat Pose & Gesture Subscription
  useEffect(() => {
    const unsub = combatPoseDetector.subscribePose((landmarks, gesture, telem) => {
      combatPoseLandmarksRef.current = landmarks;
      if (gesture && gesture !== 'NONE') {
        setDetectedCombatGesture(gesture);
        setCombatPoseConfidence(telem?.confidence || 0.95);
        if (gesture === 'STOP_IDLE') {
          handleCombatGestureTrigger('STOP_IDLE', 'Idle');
        } else {
          const mapped = combatPoseDetector.mapGestureToAnimation(gesture);
          handleCombatGestureTrigger(gesture, mapped);
        }
      }

      // Render skeletal landmark overlay on floating webcam canvas
      const canvas = pipCanvasRef.current;
      if (canvas && landmarks && landmarks.isTracking) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const w = canvas.width;
          const h = canvas.height;
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#06b6d4';
          ctx.fillStyle = '#ef4444';

          const drawLine = (p1?: any, p2?: any) => {
            if (!p1 || !p2) return;
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
          };

          const drawPoint = (p?: any, color = '#22d3ee') => {
            if (!p) return;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
            ctx.fill();
          };

          drawLine(landmarks.leftShoulder, landmarks.rightShoulder);
          drawLine(landmarks.leftShoulder, landmarks.leftElbow);
          drawLine(landmarks.leftElbow, landmarks.leftWrist);
          drawLine(landmarks.rightShoulder, landmarks.rightElbow);
          drawLine(landmarks.rightElbow, landmarks.rightWrist);
          drawLine(landmarks.leftShoulder, landmarks.leftHip);
          drawLine(landmarks.rightShoulder, landmarks.rightHip);
          drawLine(landmarks.leftHip, landmarks.rightHip);
          drawLine(landmarks.leftHip, landmarks.leftKnee);
          drawLine(landmarks.leftKnee, landmarks.leftAnkle);
          drawLine(landmarks.rightHip, landmarks.rightKnee);
          drawLine(landmarks.rightKnee, landmarks.rightAnkle);

          [
            landmarks.nose,
            landmarks.leftShoulder,
            landmarks.rightShoulder,
            landmarks.leftElbow,
            landmarks.rightElbow,
            landmarks.leftWrist,
            landmarks.rightWrist,
            landmarks.leftHip,
            landmarks.rightHip,
            landmarks.leftKnee,
            landmarks.rightKnee,
            landmarks.leftAnkle,
            landmarks.rightAnkle,
          ].forEach((pt) => drawPoint(pt));
        }
      }
    });
    return () => unsub();
  }, [handleCombatGestureTrigger]);

  const handleSimulateCombatGesture = useCallback(
    (gestureKey: string) => {
      soundFx.playClick();
      const gesture = gestureKey as CombatGestureType;
      setDetectedCombatGesture(gesture);
      setCombatPoseConfidence(0.98);
      if (gesture === 'STOP_IDLE') {
        handleCombatGestureTrigger('STOP_IDLE', 'Idle');
      } else {
        const mapped = combatPoseDetector.mapGestureToAnimation(gesture);
        handleCombatGestureTrigger(gesture, mapped);
      }
    },
    [handleCombatGestureTrigger]
  );

  const handleScrub = (timeSec: number) => {
    if (currentActionRef.current && mixerRef.current) {
      currentActionRef.current.time = timeSec;
      mixerRef.current.update(0);
      setCurrentTime(timeSec);
    }
  };

  const handleStepFrame = (deltaSec: number) => {
    if (currentActionRef.current && mixerRef.current) {
      const clip = currentActionRef.current.getClip();
      const newTime = Math.max(0, Math.min(clip.duration, currentActionRef.current.time + deltaSec));
      currentActionRef.current.time = newTime;
      mixerRef.current.update(0);
      setCurrentTime(newTime);
    }
  };

  const handleLoopModeChange = (newMode: AnimationLoopMode) => {
    setLoopMode(newMode);
    loopModeRef.current = newMode;
    if (currentActionRef.current) {
      if (newMode === 'ONCE') {
        currentActionRef.current.setLoop(THREE.LoopOnce, 1);
        currentActionRef.current.clampWhenFinished = true;
      } else if (newMode === 'PING_PONG') {
        currentActionRef.current.setLoop(THREE.LoopPingPong, Infinity);
        currentActionRef.current.clampWhenFinished = false;
      } else {
        currentActionRef.current.setLoop(THREE.LoopRepeat, Infinity);
        currentActionRef.current.clampWhenFinished = false;
      }
    }
  };

  const handlePlaybackDirectionChange = (dir: AnimationDirection) => {
    setPlaybackDirection(dir);
    playbackDirectionRef.current = dir;
    if (currentActionRef.current) {
      const timeScaleDir = dir === 'REVERSE' ? -1 : 1;
      currentActionRef.current.setEffectiveTimeScale(settings.animationSpeed * timeScaleDir);
    }
  };

  const handleWeightChange = (weight: number) => {
    setActionWeight(weight);
    actionWeightRef.current = weight;
    if (currentActionRef.current) {
      currentActionRef.current.setEffectiveWeight(weight);
    }
  };

  const handleToggleSkeleton = () => {
    setShowSkeleton((prev) => {
      const next = !prev;
      showSkeletonRef.current = next;
      if (skeletonHelperRef.current) {
        skeletonHelperRef.current.visible = next;
      }
      return next;
    });
  };

  // 6. Handle File Upload (Drag & Drop or Manual Selection)
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
      setErrorMessage('Please upload a valid .glb or .gltf 3D model.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    file.arrayBuffer().then((buffer) => {
      const customOption: GLBModelOption = {
        id: `custom_${Date.now()}`,
        name: file.name.toUpperCase().replace(/\.(glb|gltf)$/i, ''),
        category: 'USER_UPLOAD',
        description: `User-imported 3D model asset (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
        source: 'upload',
        url: objectUrl,
        arrayBuffer: buffer,
        defaultScale: 1.0,
        triangleEstimate: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      };

      setModelList((prev) => [customOption, ...prev]);
      setSelectedModel(customOption);
    }).catch(() => {
      const customOption: GLBModelOption = {
        id: `custom_${Date.now()}`,
        name: file.name.toUpperCase().replace(/\.(glb|gltf)$/i, ''),
        category: 'USER_UPLOAD',
        description: `User-imported 3D model asset (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
        source: 'upload',
        url: objectUrl,
        defaultScale: 1.0,
        triangleEstimate: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      };

      setModelList((prev) => [customOption, ...prev]);
      setSelectedModel(customOption);
    });
  };

  // 7. Load from Custom URL
  const handleLoadCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    const url = customUrlInput.trim();
    const customOption: GLBModelOption = {
      id: `url_${Date.now()}`,
      name: 'REMOTE GLB MODEL',
      category: 'USER_UPLOAD',
      description: `Loaded from remote URL: ${url.slice(0, 45)}...`,
      source: 'url',
      url,
      defaultScale: 1.0,
    };

    setModelList((prev) => [customOption, ...prev]);
    setSelectedModel(customOption);
    setShowUrlInput(false);
  };

  // 8. Capture Snapshot PNG
  const handleCaptureSnapshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const link = document.createElement('a');
    link.download = `ultron_glb_${selectedModel.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
  };

  // 9. Reset Camera Position
  const handleResetCamera = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    camera.position.set(0, 0.2, 3.4);
    controls.target.set(0, 0, 0);
    controls.update();
  };

  // 10. Gesture Control Handlers
  const handleToggleGestureControl = () => {
    const next = !gestureControlEnabled;
    setGestureControlEnabled(next);
    gestureStateRef.current.enabled = next;
    soundFx.playClick();
    if (next) {
      ultronVoice.speak('Optical hand gesture control engaged.');
      if (!isCameraActive) {
        handleToggleCamera();
      }
    } else {
      ultronVoice.speak('Hand gesture control disengaged.');
    }
  };

  const handleToggleCamera = async () => {
    if (isCameraActive) {
      gestureEngine.stop();
      combatPoseDetector.stop();
      setIsCameraActive(false);
      soundFx.playClick();
      ultronVoice.speak('Camera sensor standby.');
    } else {
      const targetVideo = pipVideoRef.current || gestureVideoRef.current;
      const started = await gestureEngine.start(targetVideo);
      combatPoseDetector.start(targetVideo);
      if (started) {
        setIsCameraActive(true);
        soundFx.playNotificationPing();
        ultronVoice.speak('Optical gesture matrix active. Wave hand or strike combat poses.');
      } else {
        setErrorMessage('Webcam stream unavailable or access denied. You can test gestures using simulation controls.');
      }
    }
  };

  const handleSimulateGesture = (type: GestureType, x = 0.5, y = 0.5) => {
    soundFx.playClick();
    gestureEngine.simulateGesture(type, { x, y });
  };

  const handleSimulateMove = (dx: number, dy: number, gesture: GestureType = 'POINT_INDEX') => {
    soundFx.playHover();
    const curX = handTelemetry.isTracking ? handTelemetry.palmX : 0.5;
    const curY = handTelemetry.isTracking ? handTelemetry.palmY : 0.5;
    const nextX = Math.max(0.08, Math.min(0.92, curX + dx));
    const nextY = Math.max(0.08, Math.min(0.92, curY + dy));
    gestureEngine.simulateHandMove(nextX, nextY, gesture);
  };

  return (
    <div
      className={`relative flex flex-col w-full h-full bg-[#040508] border border-red-950/60 rounded-xs overflow-hidden select-none font-mono ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileUpload(e.dataTransfer.files);
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Hidden Background Video Element for Gesture Engine */}
      <video
        ref={gestureVideoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
      />

      {/* 1. TOP HEADER: Clean Futuristic JARVIS Header */}
      <JarvisStudioHeader
        connectionStatus="ONLINE"
        isCameraActive={isCameraActive}
        onToggleCamera={handleToggleCamera}
        showOpticalHUD={showCombatHUD}
        onToggleOpticalHUD={() => setShowCombatHUD((prev) => !prev)}
        selectedModelName={selectedModel.name}
        selectedModelId={selectedModel.id}
        availableModels={modelList}
        onSelectModel={loadModel}
        meshCount={telemetry.meshes}
        boneCount={boneCount}
        fps={liveFps}
        frameTime={liveFrameTime}
        onResetCamera={handleResetCamera}
        onReloadModel={handleReloadModel}
        onSnapshot={handleCaptureSnapshot}
        materialMode={settings.materialMode}
        onSelectMaterialMode={(mode) => setSettings((prev) => ({ ...prev, materialMode: mode }))}
        wireframe={settings.wireframe}
        onToggleWireframe={() => setSettings((s) => ({ ...s, wireframe: !s.wireframe }))}
        autoRotate={settings.autoRotate}
        onToggleAutoRotate={() => setSettings((s) => ({ ...s, autoRotate: !s.autoRotate }))}
        showGrid={settings.showGrid}
        onToggleGrid={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
        isLeftOpen={isLeftSidebarOpen}
        isRightOpen={isRightSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      {/* 2. MAIN WORKSPACE: Left Sidebar | Center 3D Viewport | Right Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR: Organized Navigation (Avatar, Motion, Camera, System) */}
        {isLeftSidebarOpen && (
          <JarvisLeftSidebar
            modelList={modelList}
            selectedModelId={selectedModel.id}
            onSelectModelId={(id) => {
              const found = modelList.find((m) => m.id === id);
              if (found) loadModel(found);
            }}
            onUploadClick={() => fileInputRef.current?.click()}
            onReloadModel={handleReloadModel}
            onResetCamera={handleResetCamera}
            showUrlInput={showUrlInput}
            setShowUrlInput={setShowUrlInput}
            customUrl={customUrlInput}
            setCustomUrl={setCustomUrlInput}
            onLoadCustomUrl={handleLoadCustomUrl}
            meshCount={telemetry.meshes}
            boneCount={boneCount}
            triangleCount={telemetry.triangles}
            showSkeleton={showSkeleton}
            onToggleSkeleton={handleToggleSkeleton}
            animationTracks={animationTracks}
            selectedAnimation={settings.selectedAnimation}
            onSelectAnimation={handleSelectAnimation}
            lightingMode={settings.lightingMode}
            onSelectLightingMode={(mode) => setSettings((s) => ({ ...s, lightingMode: mode }))}
            materialMode={settings.materialMode}
            onSelectMaterialMode={(mode) => setSettings((s) => ({ ...s, materialMode: mode }))}
            onSelectMotionPreset={handleSelectMotionPreset}
            ikMirrorEnabled={ikMirrorEnabled}
            onToggleIkMirror={() => setIkMirrorEnabled((prev) => !prev)}
            ikBlendWeight={ikBlendWeight}
            onIkBlendWeightChange={setIkBlendWeight}
            isCameraActive={isCameraActive}
            onToggleCamera={handleToggleCamera}
            handTrackingEnabled={gestureControlEnabled}
            onToggleHandTracking={() => setGestureControlEnabled((prev) => !prev)}
            bodyTrackingEnabled={bodyTrackingEnabled}
            onToggleBodyTracking={() => setBodyTrackingEnabled((prev) => !prev)}
            onSimulateGesture={(g) => handleSimulateGesture(g, 0.6, 0.3)}
            wireframe={settings.wireframe}
            onToggleWireframe={() => setSettings((s) => ({ ...s, wireframe: !s.wireframe }))}
            autoRotate={settings.autoRotate}
            onToggleAutoRotate={() => setSettings((s) => ({ ...s, autoRotate: !s.autoRotate }))}
            autoRotateSpeed={settings.autoRotateSpeed}
            onAutoRotateSpeedChange={(speed) => setSettings((s) => ({ ...s, autoRotateSpeed: speed }))}
            showGrid={settings.showGrid}
            onToggleGrid={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
            showBoundingBox={settings.showBoundingBox}
            onToggleBoundingBox={() => setSettings((s) => ({ ...s, showBoundingBox: !s.showBoundingBox }))}
            onSnapshot={handleCaptureSnapshot}
            isPlaying={settings.isPlaying}
            onPlayPause={() => setSettings((s) => ({ ...s, isPlaying: !s.isPlaying }))}
            onStop={() => {
              if (currentActionRef.current) {
                currentActionRef.current.time = 0;
              }
              setSettings((s) => ({ ...s, isPlaying: false }));
            }}
            loopMode={loopMode}
            onToggleLoop={handleToggleLoopMode}
            animationSpeed={settings.animationSpeed}
            onSelectSpeed={(spd) => setSettings((s) => ({ ...s, animationSpeed: spd }))}
            currentTime={currentTime}
            currentDuration={currentDuration}
            onScrub={handleScrub}
            currentState={currentKinematicState}
            detectedGesture={detectedCombatGesture}
            gestureConfidence={combatPoseConfidence}
            fps={liveFps}
            frameTime={liveFrameTime}
            vertexCount={telemetry.vertices}
            materialCount={telemetry.materials}
          />
        )}

        {/* CENTER VIEWPORT: MAIN 3D AVATAR VIEW (Clear visual focus, maximum screen space) */}
        <div
          className="flex-1 relative h-full w-full overflow-hidden bg-[#040508]"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFileUpload(e.dataTransfer.files);
          }}
        >
          {/* Main Three.js Canvas Container */}
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Drag & Drop Visual Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-red-950/80 border-2 border-dashed border-red-500 flex flex-col items-center justify-center gap-2 z-30 pointer-events-none backdrop-blur-xs">
              <Upload className="w-12 h-12 text-red-400 animate-bounce" />
              <p className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
                DROP YOUR .GLB / .GLTF 3D ASSET HERE
              </p>
              <p className="text-xs text-red-300">Instant parsing & real-time viewport binding</p>
            </div>
          )}

          {/* Loading Geometry Buffer Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#040508]/85 flex flex-col items-center justify-center gap-3 z-30 backdrop-blur-xs">
              <div className="w-12 h-12 rounded-xs border-2 border-red-500 border-t-transparent animate-spin" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-zinc-200 tracking-widest uppercase">
                  COMPILING GLB GEOMETRY BUFFER
                </span>
                <span className="text-[10px] text-red-400 font-bold">{loadingProgress}% LOADED</span>
                <div className="w-48 h-1 bg-zinc-800 overflow-hidden mt-1">
                  <div
                    className="h-full bg-red-500 transition-all duration-200 shadow-[0_0_8px_#ef4444]"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="absolute top-3 left-3 right-3 bg-red-950/90 border border-red-700 text-red-200 text-xs p-2 rounded-xs z-30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-white text-xs px-2 cursor-pointer"
              >
                DISMISS
              </button>
            </div>
          )}

          {/* 5. FLOATING WEBCAM: Full Optical HUD with camera feed, standby diagnostics & gesture simulation */}
          <JarvisFloatingWebcam
            isOpen={showCombatHUD}
            onClose={() => setShowCombatHUD(false)}
            isCameraActive={isCameraActive}
            onToggleCamera={handleToggleCamera}
            videoRef={pipVideoRef}
            canvasRef={pipCanvasRef}
            detectedGesture={detectedCombatGesture}
            gestureConfidence={combatPoseConfidence}
            errorMessage={null}
            onSimulateGesture={handleSimulateCombatGesture}
          />
        </div>

        {/* 4. RIGHT SIDEBAR: Live Intelligence (Telemetry, Tracking, Motion, Performance) */}
        {isRightSidebarOpen && (
          <JarvisRightIntelligence
            currentState={currentKinematicState}
            detectedGesture={detectedCombatGesture}
            gestureConfidence={combatPoseConfidence}
            handTracking={gestureControlEnabled}
            bodyTracking={bodyTrackingEnabled}
            currentAnimation={settings.selectedAnimation}
            currentTime={currentTime}
            currentDuration={currentDuration}
            animationSpeed={settings.animationSpeed}
            fps={liveFps}
            frameTime={liveFrameTime}
            polygons={telemetry.triangles}
            vertices={telemetry.vertices}
            meshNodes={telemetry.meshes}
            materials={telemetry.materials}
          />
        )}
      </div>
    </div>
  );
};
