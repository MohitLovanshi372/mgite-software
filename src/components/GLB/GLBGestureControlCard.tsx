/**
 * GLB 3D Kinetic Hand Gesture Matrix & Controller
 *
 * Provides direct 3D GLB model manipulation via optical hand gestures:
 * - ✊ FIST: Grab & 3D Pitch/Yaw Orbit Rotation
 * - ✋ OPEN PALM: Anti-Gravity Levitation & Vertical Float
 * - ☝️ POINT INDEX: 3D Spatial Translation (Pan along X, Y, Z)
 * - 🤏 PINCH: Kinetic Zoom & Mesh Scaling
 * - ✌️ VICTORY: Snap to Origin (Re-Center & Reset Matrix)
 * - 👍 THUMBS UP: Turbo Kinetic Yaw Spin
 *
 * Features:
 * - Live embedded WebGL Three.js viewport
 * - GLB Preset Selector (Ultron Cranium, Sentry, Singularity, Interceptor)
 * - Real-time manual gesture trigger simulation buttons
 * - Optical Webcam sensor activation with PIP skeleton feed & coordinates
 * - Gesture sensitivity calibration sliders (rotation, pan, zoom, lerp smoothing)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DEFAULT_GLB_MODELS } from '../../data/glbPresets.ts';
import { GLBModelOption } from '../../types/glbModels.ts';
import { gestureEngine } from '../../utils/handGestureDetector.ts';
import { GestureType, HandLandmarks } from '../../types/gestures.ts';
import {
  Hand,
  Video,
  VideoOff,
  RotateCcw,
  Maximize2,
  Move,
  Eye,
  Sliders,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Info,
  Radio,
  Layers,
  Flame,
} from 'lucide-react';
import { soundFx } from '../../utils/audioEffects.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface GLBGestureControlCardProps {
  onOpenFullStudio?: () => void;
}

export const GLBGestureControlCard: React.FC<GLBGestureControlCardProps> = ({
  onOpenFullStudio,
}) => {
  // 3D Canvas Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Group | THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animIdRef = useRef<number>(0);

  // Model & State
  const [selectedModel, setSelectedModel] = useState<GLBModelOption>(DEFAULT_GLB_MODELS[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Gesture Tracking State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('NONE');
  const [confidence, setConfidence] = useState<number>(0);
  const [landmarks, setLandmarks] = useState<HandLandmarks | null>(null);
  const [activeGestureAction, setActiveGestureAction] = useState<string>('System Baseline (Orbit Active)');

  // Calibration Parameters
  const [rotationSensitivity, setRotationSensitivity] = useState<number>(1.5);
  const [panSensitivity, setPanSensitivity] = useState<number>(1.2);
  const [zoomSensitivity, setZoomSensitivity] = useState<number>(1.0);
  const [lerpSmoothing, setLerpSmoothing] = useState<number>(0.12);

  // Target Transformation Lerp Buffers
  const targetRotation = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0, z: 0 });
  const targetScale = useRef<number>(1.0);
  const levitationPhase = useRef<number>(0);

  // 1. Initialize WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x04060a);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3.8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 10;
    controls.minDistance = 0.8;
    controlsRef.current = controls;

    // Lighting (Ultron Crimson Glow)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xff3333, 2.5);
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3388ff, 1.2);
    dirLight2.position.set(-3, -2, -3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xff1111, 2.0, 10);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    // Subtle Grid Floor
    const grid = new THREE.GridHelper(8, 16, 0xff2222, 0x221111);
    grid.position.y = -1.2;
    scene.add(grid);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Smooth Lerp Transformations on Model
      if (currentModelRef.current) {
        const model = currentModelRef.current;

        // Rotation Lerp
        model.rotation.y += (targetRotation.current.y - model.rotation.y) * lerpSmoothing;
        model.rotation.x += (targetRotation.current.x - model.rotation.x) * lerpSmoothing;

        // Position Lerp (Pan & Levitation)
        model.position.x += (targetPosition.current.x - model.position.x) * lerpSmoothing;
        model.position.y += (targetPosition.current.y - model.position.y) * lerpSmoothing;
        model.position.z += (targetPosition.current.z - model.position.z) * lerpSmoothing;

        // Scale Lerp
        const currentScale = model.scale.x;
        const newScale = currentScale + (targetScale.current - currentScale) * lerpSmoothing;
        model.scale.set(newScale, newScale, newScale);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [lerpSmoothing]);

  // 2. Load Selected GLB Model
  const loadModel = useCallback((modelOption: GLBModelOption) => {
    if (!sceneRef.current) return;
    setIsLoading(true);

    // Remove existing model
    if (currentModelRef.current) {
      sceneRef.current.remove(currentModelRef.current);
      currentModelRef.current = null;
    }
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }

    // Check if procedural
    if (modelOption.source === 'procedural') {
      const group = new THREE.Group();
      if (modelOption.id.includes('singularity')) {
        // Procedural Tesseract Core
        const coreGeo = new THREE.OctahedronGeometry(0.7, 2);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0xff1111,
          emissive: 0x990000,
          emissiveIntensity: 0.8,
          wireframe: true,
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        const ringGeo = new THREE.TorusGeometry(1.2, 0.04, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.9, roughness: 0.2 });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.x = Math.PI / 2;
        group.add(ring1, ring2);
      } else {
        // Procedural Interceptor
        const shipGeo = new THREE.ConeGeometry(0.8, 2.2, 4);
        shipGeo.rotateX(Math.PI / 2);
        const shipMat = new THREE.MeshStandardMaterial({ color: 0x222630, metalness: 0.8, roughness: 0.3 });
        const ship = new THREE.Mesh(shipGeo, shipMat);
        group.add(ship);
      }

      group.position.set(0, 0, 0);
      group.scale.set(modelOption.defaultScale, modelOption.defaultScale, modelOption.defaultScale);
      targetScale.current = modelOption.defaultScale;
      sceneRef.current.add(group);
      currentModelRef.current = group;
      setIsLoading(false);
      return;
    }

    // Load actual GLB
    const loader = new GLTFLoader();
    loader.load(
      modelOption.url,
      (gltf) => {
        const model = gltf.scene;
        // Center bounding box
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        model.scale.set(modelOption.defaultScale, modelOption.defaultScale, modelOption.defaultScale);
        targetScale.current = modelOption.defaultScale;

        // Animations
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        sceneRef.current?.add(model);
        currentModelRef.current = model;
        setIsLoading(false);
      },
      undefined,
      () => {
        // Fallback procedural geometry if network asset unavailable
        const fallbackGroup = new THREE.Group();
        const geo = new THREE.DodecahedronGeometry(0.8, 1);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xcc1111,
          metalness: 0.85,
          roughness: 0.25,
          emissive: 0x550000,
          emissiveIntensity: 0.4,
        });
        const mesh = new THREE.Mesh(geo, mat);
        fallbackGroup.add(mesh);
        fallbackGroup.scale.set(modelOption.defaultScale, modelOption.defaultScale, modelOption.defaultScale);
        sceneRef.current?.add(fallbackGroup);
        currentModelRef.current = fallbackGroup;
        setIsLoading(false);
      }
    );
  }, []);

  // Initial Load
  useEffect(() => {
    loadModel(selectedModel);
  }, [selectedModel, loadModel]);

  // 3. Hand Gesture Callback Processor
  const handleGestureDetected = useCallback(
    (gesture: GestureType, conf: number, marks: HandLandmarks) => {
      setCurrentGesture(gesture);
      setConfidence(conf);
      setLandmarks(marks);

      const rotSpeed = rotationSensitivity;
      const panSpeed = panSensitivity;
      const zoomSpeed = zoomSensitivity;

      switch (gesture) {
        case 'FIST':
          // ✊ Clenched Fist: 3D Grab & Orbit Rotation
          setActiveGestureAction('✊ FIST: 3D Grab & Orbit Rotation');
          targetRotation.current.y += (marks.palmCenter.x - 0.5) * 0.15 * rotSpeed;
          targetRotation.current.x += (marks.palmCenter.y - 0.5) * 0.15 * rotSpeed;
          break;

        case 'OPEN_PALM':
          // ✋ Open Palm: Anti-Gravity Levitation Float
          levitationPhase.current += 0.08;
          targetPosition.current.y = Math.sin(levitationPhase.current) * 0.35 * panSpeed;
          setActiveGestureAction('✋ OPEN PALM: Anti-Gravity Levitation');
          break;

        case 'POINT_INDEX':
          // ☝️ Point Index: 3D Spatial Translation (Pan)
          targetPosition.current.x = (marks.indexTip.x - 0.5) * 2.2 * panSpeed;
          targetPosition.current.y = -(marks.indexTip.y - 0.5) * 1.8 * panSpeed;
          setActiveGestureAction('☝️ POINT: 3D Spatial Pan');
          break;

        case 'PINCH':
          // 🤏 Pinch: Dynamic Kinetic Zoom & Mesh Scaling
          const pinchDist = Math.hypot(marks.thumbTip.x - marks.indexTip.x, marks.thumbTip.y - marks.indexTip.y);
          targetScale.current = Math.max(0.4, Math.min(2.8, selectedModel.defaultScale * (pinchDist * 4.5 * zoomSpeed)));
          setActiveGestureAction('🤏 PINCH: Kinetic Zoom & Mesh Scale');
          break;

        case 'VICTORY_PEACE':
          // ✌️ Victory: Snap to Origin & Re-Center
          targetRotation.current = { x: 0, y: 0 };
          targetPosition.current = { x: 0, y: 0, z: 0 };
          targetScale.current = selectedModel.defaultScale;
          setActiveGestureAction('✌️ PEACE: Snap to Origin (Re-Center)');
          break;

        case 'THUMBS_UP':
          // 👍 Thumbs Up: Turbo Kinetic Yaw Spin
          targetRotation.current.y += 0.25 * rotSpeed;
          setActiveGestureAction('👍 THUMBS UP: Turbo Kinetic Spin');
          break;

        default:
          setActiveGestureAction('IDLE: Awaiting Kinetic Gesture Directive');
          break;
      }
    },
    [rotationSensitivity, panSensitivity, zoomSensitivity, selectedModel]
  );

  // Subscribe to gesture engine status and frame broadcasts
  useEffect(() => {
    const unsubStatus = gestureEngine.subscribeStatus((active) => {
      setIsCameraActive(active);
    });

    const unsubFrame = gestureEngine.subscribeFrame((marks, gesture, conf) => {
      if (marks.isTracking) {
        handleGestureDetected(gesture, conf, marks);
      }
    });

    return () => {
      unsubStatus();
      unsubFrame();
    };
  }, [handleGestureDetected]);

  // 4. Optical Webcam Toggle
  const toggleCameraTracking = async () => {
    if (isCameraActive) {
      gestureEngine.stop();
      setIsCameraActive(false);
      setCurrentGesture('NONE');
      soundFx.playClick();
    } else {
      soundFx.playNotificationPing();
      const success = await gestureEngine.start();
      setIsCameraActive(success);
      if (success) {
        ultronVoice.speak('Optical gesture matrix engaged. 3D GLB model manipulation active.');
      }
    }
  };

  // 5. Manual Gesture Simulation Triggers
  const simulateGesture = (type: GestureType) => {
    soundFx.playClick();
    gestureEngine.simulateGesture(type);

    const mockMarks: HandLandmarks = {
      wrist: { x: 0.5, y: 0.8 },
      thumbTip: { x: 0.45, y: 0.35 },
      indexTip: { x: 0.5, y: 0.3 },
      middleTip: { x: 0.55, y: 0.32 },
      ringTip: { x: 0.6, y: 0.38 },
      pinkyTip: { x: 0.65, y: 0.42 },
      palmCenter: { x: 0.5, y: 0.5 },
      isTracking: true,
      rawMotion: 0.5,
    };

    switch (type) {
      case 'FIST':
        targetRotation.current.y += Math.PI / 2;
        targetRotation.current.x += 0.3;
        break;
      case 'OPEN_PALM':
        targetPosition.current.y = 0.45;
        setTimeout(() => {
          targetPosition.current.y = 0;
        }, 1200);
        break;
      case 'POINT_INDEX':
        targetPosition.current.x = targetPosition.current.x === 0 ? 0.8 : 0;
        break;
      case 'PINCH':
        targetScale.current = targetScale.current > 1.2 ? selectedModel.defaultScale * 0.7 : selectedModel.defaultScale * 1.5;
        break;
      case 'VICTORY_PEACE':
        targetRotation.current = { x: 0, y: 0 };
        targetPosition.current = { x: 0, y: 0, z: 0 };
        targetScale.current = selectedModel.defaultScale;
        break;
      case 'THUMBS_UP':
        targetRotation.current.y += Math.PI * 2;
        break;
      default:
        break;
    }

    handleGestureDetected(type, 0.95, mockMarks);
  };

  return (
    <div
      id="glb-gesture-control-card"
      className="bg-[#080a11]/90 border border-red-950/70 rounded-xs p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-md flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-950/60 pb-3.5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xs bg-red-950/50 border border-red-600/50 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.35)]">
            <Hand className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">
                GLB 3D KINETIC HAND GESTURE MATRIX
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-red-500/10 border border-red-500/30 text-red-400 font-mono tracking-wider font-semibold">
                OPTICAL 3D
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manipulate 3D GLB meshes via optical hand gestures: Rotate, Levitate, Pan, Scale, and Reset.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Optical Webcam Toggle */}
          <button
            id="toggle-camera-gesture-btn"
            onClick={toggleCameraTracking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs border text-xs font-mono tracking-wider transition-all cursor-pointer ${
              isCameraActive
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            {isCameraActive ? (
              <>
                <Video className="w-3.5 h-3.5 animate-pulse" />
                <span>CAMERA ACTIVE</span>
              </>
            ) : (
              <>
                <VideoOff className="w-3.5 h-3.5 text-zinc-400" />
                <span>START OPTICAL SENSOR</span>
              </>
            )}
          </button>

          {/* Jump to Full 3D Studio */}
          {onOpenFullStudio && (
            <button
              id="open-full-studio-btn"
              onClick={onOpenFullStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-red-950/40 hover:bg-red-900/50 border border-red-700/50 text-red-300 hover:text-white text-xs font-mono tracking-wider transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>3D STUDIO</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout: Left (3D Viewport & Gesture Telemetry) + Right (Gesture Matrix & Calibration) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        {/* Left: 3D Viewport with HUD Overlay (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Model Selector Bar */}
          <div className="flex items-center justify-between bg-zinc-950/80 px-3 py-2 rounded-xs border border-zinc-800/80 text-xs">
            <span className="font-mono text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-500" />
              TARGET 3D GLB:
            </span>
            <select
              id="glb-model-selector"
              value={selectedModel.id}
              onChange={(e) => {
                const found = DEFAULT_GLB_MODELS.find((m) => m.id === e.target.value);
                if (found) {
                  soundFx.playClick();
                  setSelectedModel(found);
                }
              }}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-xs px-2.5 py-1 font-mono focus:border-red-500 outline-none"
            >
              {DEFAULT_GLB_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category})
                </option>
              ))}
            </select>
          </div>

          {/* Sentry Cybernetic Android Quick Pose Banner */}
          {selectedModel.id === 'cyber_android' && (
            <div className="flex items-center justify-between bg-red-950/40 border border-red-800/80 px-3 py-1.5 rounded-xs text-[11px] font-mono">
              <span className="text-red-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>CYBERNETIC SENTRY: 12 POSES & HAND/LEG ARTICULATIONS ACTIVE</span>
              </span>
              {onOpenFullStudio && (
                <button
                  type="button"
                  onClick={onOpenFullStudio}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded-2xs font-bold text-[10px] cursor-pointer"
                >
                  OPEN STUDIO
                </button>
              )}
            </div>
          )}

          {/* 3D WebGL Canvas Container */}
          <div className="relative w-full h-[320px] bg-[#020306] border border-red-950/60 rounded-xs overflow-hidden shadow-inner group">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 bg-[#020306]/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-red-400 tracking-wider">
                  INITIALIZING 3D MESH CHASSIS...
                </span>
              </div>
            )}

            {/* Top HUD Telemetry Banner */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10 text-[11px] font-mono">
              <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xs border border-zinc-800/80 text-zinc-200">
                <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                <span>{activeGestureAction}</span>
              </div>

              <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xs border border-zinc-800/80 text-red-400 font-bold">
                CONF: {(confidence * 100).toFixed(0)}%
              </div>
            </div>

            {/* Camera PIP Skeleton Preview (if Camera Active) */}
            {isCameraActive && landmarks && (
              <div className="absolute bottom-2 right-2 w-28 h-24 bg-black/85 border border-red-600/70 rounded-xs overflow-hidden p-1.5 z-10 flex flex-col justify-between shadow-[0_0_12px_rgba(220,38,38,0.4)]">
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                  <span>OPTICAL PIP</span>
                  <span className="text-emerald-400">TRACK</span>
                </div>
                {/* Visual Skeleton Node Graph */}
                <div className="relative w-full h-14 bg-zinc-950/80 rounded-xs border border-zinc-800 flex items-center justify-center">
                  <div
                    style={{
                      left: `${landmarks.palmCenter.x * 100}%`,
                      top: `${landmarks.palmCenter.y * 100}%`,
                    }}
                    className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-ping"
                  />
                  <div
                    style={{
                      left: `${landmarks.indexTip.x * 100}%`,
                      top: `${landmarks.indexTip.y * 100}%`,
                    }}
                    className="absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-amber-400 rounded-full"
                  />
                </div>
                <div className="text-[9px] font-mono text-zinc-300 truncate">
                  GESTURE: {currentGesture}
                </div>
              </div>
            )}

            {/* Reset Origin Floating Button */}
            <button
              onClick={() => simulateGesture('VICTORY_PEACE')}
              className="absolute bottom-2 left-2 p-1.5 bg-black/80 hover:bg-red-950/80 border border-zinc-800 hover:border-red-600 text-zinc-300 hover:text-white rounded-xs text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors z-10"
              title="Snap Model Back to Origin"
            >
              <RotateCcw className="w-3 h-3 text-red-500" />
              <span>RE-CENTER</span>
            </button>
          </div>

          {/* Manual Gesture Simulation Buttons */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
              <span className="font-semibold text-zinc-300 uppercase tracking-wider">
                TEST KINETIC GESTURES ACCORDING TO GLB:
              </span>
              <span className="text-[10px] text-zinc-400">Instant Physics Test</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <button
                onClick={() => simulateGesture('FIST')}
                className="px-2 py-1.5 rounded-xs bg-zinc-900/80 hover:bg-red-950/60 border border-zinc-800 hover:border-red-600 text-zinc-200 text-[11px] font-mono flex flex-col items-center gap-0.5 cursor-pointer transition-all"
                title="✊ Grab & Rotate 3D Pitch/Yaw"
              >
                <span className="text-sm">✊</span>
                <span>ROTATE</span>
              </button>

              <button
                onClick={() => simulateGesture('OPEN_PALM')}
                className="px-2 py-1.5 rounded-xs bg-zinc-900/80 hover:bg-red-950/60 border border-zinc-800 hover:border-red-600 text-zinc-200 text-[11px] font-mono flex flex-col items-center gap-0.5 cursor-pointer transition-all"
                title="✋ Levitate & Anti-Gravity Hover"
              >
                <span className="text-sm">✋</span>
                <span>LEVITATE</span>
              </button>

              <button
                onClick={() => simulateGesture('POINT_INDEX')}
                className="px-2 py-1.5 rounded-xs bg-zinc-900/80 hover:bg-red-950/60 border border-zinc-800 hover:border-red-600 text-zinc-200 text-[11px] font-mono flex flex-col items-center gap-0.5 cursor-pointer transition-all"
                title="☝️ 3D Spatial Pan"
              >
                <span className="text-sm">☝️</span>
                <span>PAN</span>
              </button>

              <button
                onClick={() => simulateGesture('PINCH')}
                className="px-2 py-1.5 rounded-xs bg-zinc-900/80 hover:bg-red-950/60 border border-zinc-800 hover:border-red-600 text-zinc-200 text-[11px] font-mono flex flex-col items-center gap-0.5 cursor-pointer transition-all"
                title="🤏 Kinetic Zoom & Mesh Scale"
              >
                <span className="text-sm">🤏</span>
                <span>SCALE</span>
              </button>

              <button
                onClick={() => simulateGesture('VICTORY_PEACE')}
                className="px-2 py-1.5 rounded-xs bg-zinc-900/80 hover:bg-red-950/60 border border-zinc-800 hover:border-red-600 text-zinc-200 text-[11px] font-mono flex flex-col items-center gap-0.5 cursor-pointer transition-all"
                title="✌️ Snap to Origin"
              >
                <span className="text-sm">✌️</span>
                <span>RESET</span>
              </button>

              <button
                onClick={() => simulateGesture('THUMBS_UP')}
                className="px-2 py-1.5 rounded-xs bg-zinc-900/80 hover:bg-red-950/60 border border-zinc-800 hover:border-red-600 text-zinc-200 text-[11px] font-mono flex flex-col items-center gap-0.5 cursor-pointer transition-all"
                title="👍 Turbo Kinetic Spin"
              >
                <span className="text-sm">👍</span>
                <span>SPIN</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Gesture Calibration Sliders & Interactive Mapping Guide (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Calibration Sliders Panel */}
          <div className="bg-zinc-950/70 border border-red-950/40 rounded-xs p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono border-b border-zinc-800/80 pb-2">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-red-500" />
                GLB GESTURE SENSITIVITY CALIBRATION
              </span>
            </div>

            {/* 1. Orbit Rotation Sensitivity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-300">ROTATION SENSITIVITY (FIST)</span>
                <span className="text-red-400 font-bold">{rotationSensitivity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={rotationSensitivity}
                onChange={(e) => setRotationSensitivity(parseFloat(e.target.value))}
                className="w-full accent-red-600 h-1 bg-zinc-800 rounded-xs cursor-pointer"
              />
            </div>

            {/* 2. Pan & Levitation Speed */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-300">LEVITATION / PAN SPEED (PALM/POINT)</span>
                <span className="text-cyan-400 font-bold">{panSensitivity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={panSensitivity}
                onChange={(e) => setPanSensitivity(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded-xs cursor-pointer"
              />
            </div>

            {/* 3. Zoom Scaling Range */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-300">ZOOM SCALING RANGE (PINCH)</span>
                <span className="text-amber-400 font-bold">{zoomSensitivity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={zoomSensitivity}
                onChange={(e) => setZoomSensitivity(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-xs cursor-pointer"
              />
            </div>

            {/* 4. Lerp Smoothing Factor */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-300">DYNAMIC LERP SMOOTHING</span>
                <span className="text-purple-400 font-bold">{(lerpSmoothing * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.35"
                step="0.01"
                value={lerpSmoothing}
                onChange={(e) => setLerpSmoothing(parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-zinc-800 rounded-xs cursor-pointer"
              />
            </div>
          </div>

          {/* Gesture Mapping Legend */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xs p-3.5 space-y-2">
            <div className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-red-500" />
              OPTICAL KINETIC GESTURE BINDINGS
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex items-start gap-2 p-1.5 rounded-xs bg-zinc-900/40 border border-zinc-800/60">
                <span className="text-base leading-none">✊</span>
                <div>
                  <div className="text-zinc-200 font-bold">CLENCHED FIST</div>
                  <div className="text-zinc-400 text-[10px]">Grabs GLB chassis and binds rotation to hand pitch/yaw angle.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-1.5 rounded-xs bg-zinc-900/40 border border-zinc-800/60">
                <span className="text-base leading-none">✋</span>
                <div>
                  <div className="text-zinc-200 font-bold">OPEN PALM</div>
                  <div className="text-zinc-400 text-[10px]">Activates anti-gravity levitation with smooth vertical sinusoidal float.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-1.5 rounded-xs bg-zinc-900/40 border border-zinc-800/60">
                <span className="text-base leading-none">☝️</span>
                <div>
                  <div className="text-zinc-200 font-bold">POINT INDEX</div>
                  <div className="text-zinc-400 text-[10px]">Translates GLB model across X and Y axes according to fingertip vectors.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-1.5 rounded-xs bg-zinc-900/40 border border-zinc-800/60">
                <span className="text-base leading-none">🤏</span>
                <div>
                  <div className="text-zinc-200 font-bold">PINCH GESTURE</div>
                  <div className="text-zinc-400 text-[10px]">Dynamically expands or contracts mesh scale according to finger spread.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-1.5 rounded-xs bg-zinc-900/40 border border-zinc-800/60">
                <span className="text-base leading-none">✌️</span>
                <div>
                  <div className="text-zinc-200 font-bold">VICTORY / PEACE</div>
                  <div className="text-zinc-400 text-[10px]">Instantly snaps rotation, pan offset, and zoom back to default origin.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
