/**
 * CyberBotPoseStudio Component
 *
 * Dedicated Full-Featured Kinematic Posing & Gesture Matrix for the Cybernetic Bot (Ultron Sentry):
 * - 3D WebGL Three.js viewport with GLTFLoader and OrbitControls
 * - 12 Curated Full-Body Combat, Cinematic, Sovereign & Tactical Poses
 * - 8 Independent Hand Gestures (Repulsor Blast, Fist, Point, Victory, Claw, Pistol, Salute, Relaxed)
 * - 8 Independent Leg Stances (Combat Plant, Ground Impact, High Kick, Levitation, Kneeling, Lunge, Lotus)
 * - Manual Joint Kinematic Sliders (Shoulders, Elbows, Wrists, Hips, Knees, Ankles, Spine, Head, Elevation)
 * - Real-time Quaternion Slerp Interpolation between poses
 * - Three.js SkeletonHelper Wireframe Bone visualizer toggle
 * - PBR Armor Shaders: Ultron Crimson, Vibranium Chrome, Obsidian Stealth, Solar Titan Gold
 * - Built-in Kinetic Animation Clips integration (idle, walk, run, agree, headShake, sad_pose, sneak_pose)
 * - Ultron Voice Feedback & Acoustic servo telemetry
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  BotFullPoseId,
  BotHandGestureId,
  BotLegStanceId,
  BotPoseDefinition,
  ManualJointValues,
  BotArmorSkin,
} from '../../types/cyberBotPoses.ts';
import {
  BOT_FULL_POSES,
  BOT_HAND_GESTURES,
  BOT_LEG_STANCES,
  DEFAULT_MANUAL_JOINTS,
  buildManualJointMap,
  getHandGestureBoneMap,
  applyBotSkin,
} from '../../utils/cyberBotPosing.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Shield,
  Eye,
  Crosshair,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Copy,
  Check,
  Download,
  Flame,
  Radio,
  Maximize2,
  RefreshCw,
  Box,
  Hand,
} from 'lucide-react';

interface CyberBotPoseStudioProps {
  className?: string;
  compact?: boolean;
}

export const CyberBotPoseStudio: React.FC<CyberBotPoseStudioProps> = ({
  className = '',
  compact = false,
}) => {
  // 3D Canvas & WebGL Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animationActionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // Bone Cache Refs
  const bonesMapRef = useRef<Map<string, THREE.Bone>>(new Map());
  const initialRotationsRef = useRef<Map<string, THREE.Euler>>(new Map());
  const currentRotationsRef = useRef<Map<string, THREE.Quaternion>>(new Map());
  const targetRotationsRef = useRef<Map<string, THREE.Quaternion>>(new Map());

  // Hips Position Ref for Elevation
  const initialHipsYRef = useRef<number>(104);
  const currentHipsYRef = useRef<number>(104);
  const targetHipsYRef = useRef<number>(104);

  // FX: Energy Repulsor Rings Group
  const energyFxGroupRef = useRef<THREE.Group | null>(null);

  // Studio UI States
  const [activeTab, setActiveTab] = useState<'POSES' | 'HANDS' | 'LEGS' | 'RIG_SLIDERS' | 'ANIMATIONS'>('POSES');
  const [poseCategoryFilter, setPoseCategoryFilter] = useState<'ALL' | 'COMBAT' | 'CINEMATIC' | 'SOVEREIGN' | 'TACTICAL'>('ALL');
  const [selectedPoseId, setSelectedPoseId] = useState<BotFullPoseId>('DEFAULT_IDLE');

  // Independent Hand & Leg states
  const [leftHandGesture, setLeftHandGesture] = useState<BotHandGestureId>('RELAXED_NEUTRAL');
  const [rightHandGesture, setRightHandGesture] = useState<BotHandGestureId>('RELAXED_NEUTRAL');
  const [handTargetSide, setHandTargetSide] = useState<'BOTH' | 'LEFT' | 'RIGHT'>('BOTH');
  const [selectedLegStance, setSelectedLegStance] = useState<BotLegStanceId>('BIPEDAL_NEUTRAL');

  // Manual Joint Sliders State
  const [manualJoints, setManualJoints] = useState<ManualJointValues>(DEFAULT_MANUAL_JOINTS);

  // Visual Customization States
  const [armorSkin, setArmorSkin] = useState<BotArmorSkin>('ULTRON_CRIMSON');
  const [showSkeletonWireframe, setShowSkeletonWireframe] = useState<boolean>(false);
  const [showEnergyAura, setShowEnergyAura] = useState<boolean>(true);
  const [voiceAnnounce, setVoiceAnnounce] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Built-in animation playback state
  const [isPlayingClip, setIsPlayingClip] = useState<boolean>(false);
  const [activeClipName, setActiveClipName] = useState<string>('');
  const [animationClips, setAnimationClips] = useState<string[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);

  // Loading & Telemetry
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedMatrix, setCopiedMatrix] = useState<boolean>(false);
  const [lastActionStatus, setLastActionStatus] = useState<string>('SENTRY POSTURE MATRIX READY');

  // 1. Initialize WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040509);

    // Fog for cinematic depth
    scene.fog = new THREE.FogExp2(0x040509, 0.0035);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 80, 240);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 40;
    controls.maxDistance = 400;
    controls.target.set(0, 65, 0);
    controlsRef.current = controls;

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x221122, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xef4444, 2.8); // Crimson key light
    dirLight1.position.set(120, 150, 100);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.8); // Cyan rim light
    dirLight2.position.set(-120, 80, -100);
    scene.add(dirLight2);

    const bottomGlow = new THREE.PointLight(0xef4444, 2.5, 120);
    bottomGlow.position.set(0, 10, 20);
    scene.add(bottomGlow);

    // Grid Floor
    const grid = new THREE.GridHelper(300, 40, 0xef4444, 0x1f293d);
    grid.position.y = 0;
    scene.add(grid);

    // Energy FX Group (Repulsor/Thruster particles)
    const energyGroup = new THREE.Group();
    scene.add(energyGroup);
    energyFxGroupRef.current = energyGroup;

    // Load Cybernetic Android GLB
    const loader = new GLTFLoader();
    setIsLoading(true);

    loader.load(
      '/models/cyber_android.glb',
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;
        model.scale.set(0.65, 0.65, 0.65);
        model.position.set(0, 0, 0);
        scene.add(model);

        // Populate Bones Cache
        const bonesMap = new Map<string, THREE.Bone>();
        const initialRots = new Map<string, THREE.Euler>();
        const currentRots = new Map<string, THREE.Quaternion>();
        const targetRots = new Map<string, THREE.Quaternion>();

        model.traverse((child) => {
          if ((child as THREE.Bone).isBone) {
            const bone = child as THREE.Bone;
            bonesMap.set(bone.name, bone);
            initialRots.set(bone.name, bone.rotation.clone());
            currentRots.set(bone.name, bone.quaternion.clone());
            targetRots.set(bone.name, bone.quaternion.clone());

            if (bone.name === 'mixamorig:Hips') {
              initialHipsYRef.current = bone.position.y;
              currentHipsYRef.current = bone.position.y;
              targetHipsYRef.current = bone.position.y;
            }
          }
        });

        bonesMapRef.current = bonesMap;
        initialRotationsRef.current = initialRots;
        currentRotationsRef.current = currentRots;
        targetRotationsRef.current = targetRots;

        // Skeleton Wireframe Helper
        const skeletonHelper = new THREE.SkeletonHelper(model);
        (skeletonHelper.material as THREE.LineBasicMaterial).linewidth = 2;
        (skeletonHelper.material as THREE.LineBasicMaterial).color.set(0xef4444);
        skeletonHelper.visible = false;
        scene.add(skeletonHelper);
        skeletonHelperRef.current = skeletonHelper;

        // Animation Mixer for embedded clips
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          const actions = new Map<string, THREE.AnimationAction>();
          const clipNames: string[] = [];

          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actions.set(clip.name, action);
            clipNames.push(clip.name);
          });

          animationActionsRef.current = actions;
          setAnimationClips(clipNames);
          if (clipNames.length > 0) setActiveClipName(clipNames[0]);
        }

        // Apply Initial Skin
        applyBotSkin(model, 'ULTRON_CRIMSON');

        // Apply Default Pose
        applyFullPoseToTarget('DEFAULT_IDLE');

        setIsLoading(false);
        setLastActionStatus('CYBERNETIC ANDROID LOADED [70 RIGGED BONES]');
      },
      undefined,
      (err) => {
        console.error('Error loading cyber_android.glb:', err);
        setIsLoading(false);
        setLastActionStatus('FAILED TO LOAD BOT MODEL');
      }
    );

    // Render Animation Loop with Slerp Interpolation
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // If playing an animation clip, mixer updates skeleton
      if (mixerRef.current && isPlayingClip) {
        mixerRef.current.update(delta);
      } else {
        // Kinematic Slerp Interpolation between Current and Target Pose
        const bonesMap = bonesMapRef.current;
        const currentRots = currentRotationsRef.current;
        const targetRots = targetRotationsRef.current;

        // Interpolation factor (~12 per second)
        const lerpFactor = Math.min(1, delta * 14);

        targetRots.forEach((targetQ, boneName) => {
          const bone = bonesMap.get(boneName);
          let currentQ = currentRots.get(boneName);

          if (bone && currentQ) {
            currentQ.slerp(targetQ, lerpFactor);
            bone.quaternion.copy(currentQ);
          }
        });

        // Interpolate Hips Elevation
        const hipsBone = bonesMap.get('mixamorig:Hips');
        if (hipsBone) {
          currentHipsYRef.current += (targetHipsYRef.current - currentHipsYRef.current) * lerpFactor;
          hipsBone.position.y = currentHipsYRef.current;
        }
      }

      // Skeleton wireframe update
      if (skeletonHelperRef.current && skeletonHelperRef.current.visible) {
        // In three.js SkeletonHelper updates matrix automatically
      }

      // Auto-Rotate
      if (autoRotate && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.6;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Skeleton Helper Visibility
  useEffect(() => {
    if (skeletonHelperRef.current) {
      skeletonHelperRef.current.visible = showSkeletonWireframe;
    }
  }, [showSkeletonWireframe]);

  // Update Skin Material
  const handleSelectSkin = (skin: BotArmorSkin) => {
    setArmorSkin(skin);
    soundFx.playClick();
    if (modelRef.current) {
      applyBotSkin(modelRef.current, skin);
    }
  };

  // Helper: Apply target rotations into targetRotationsRef
  const applyRotationsToTarget = useCallback((rotMap: Record<string, [number, number, number]>, elevationOffset = 0) => {
    const initialRots = initialRotationsRef.current;
    const targetRots = targetRotationsRef.current;

    Object.entries(rotMap).forEach(([boneName, [rx, ry, rz]]) => {
      const initEuler = initialRots.get(boneName);
      const euler = new THREE.Euler(
        (initEuler?.x || 0) + rx,
        (initEuler?.y || 0) + ry,
        (initEuler?.z || 0) + rz,
        'XYZ'
      );
      const q = new THREE.Quaternion().setFromEuler(euler);
      targetRots.set(boneName, q);
    });

    // Elevation
    targetHipsYRef.current = initialHipsYRef.current + elevationOffset;
  }, []);

  // 2. Select Full-Body Pose
  const applyFullPoseToTarget = useCallback((poseId: BotFullPoseId) => {
    const pose = BOT_FULL_POSES[poseId] || BOT_FULL_POSES.DEFAULT_IDLE;
    setSelectedPoseId(poseId);

    // Stop any active clip so kinematic pose takes effect
    if (activeActionRef.current) {
      activeActionRef.current.stop();
      activeActionRef.current = null;
      setIsPlayingClip(false);
    }

    // Reset target rotations to baseline
    const initialRots = initialRotationsRef.current;
    const targetRots = targetRotationsRef.current;
    initialRots.forEach((euler, boneName) => {
      targetRots.set(boneName, new THREE.Quaternion().setFromEuler(euler));
    });

    // Apply pose rotations
    applyRotationsToTarget(pose.rotations, pose.elevation);

    // Apply hand finger rotations
    const leftFingers = getHandGestureBoneMap('Left', pose.handGestureLeft);
    const rightFingers = getHandGestureBoneMap('Right', pose.handGestureRight);
    applyRotationsToTarget(leftFingers);
    applyRotationsToTarget(rightFingers);

    setLeftHandGesture(pose.handGestureLeft);
    setRightHandGesture(pose.handGestureRight);
    setSelectedLegStance(pose.legStance);

    // Audio & Voice Feedback
    soundFx.playStateSound('EXECUTING');
    if (voiceAnnounce) {
      ultronVoice.speak(pose.audioAnnouncement);
    }

    setLastActionStatus(`POSE ACTIVATED: ${pose.name.toUpperCase()}`);

    // Adjust camera focus if specified
    if (controlsRef.current && cameraRef.current) {
      if (pose.cameraFocus === 'legs') {
        controlsRef.current.target.set(0, 35, 0);
      } else if (pose.cameraFocus === 'upper_body') {
        controlsRef.current.target.set(0, 85, 0);
      } else {
        controlsRef.current.target.set(0, 65, 0);
      }
    }
  }, [applyRotationsToTarget, voiceAnnounce]);

  // 3. Apply Hand Gesture (Left, Right, or Both)
  const handleApplyHandGesture = (gestureId: BotHandGestureId) => {
    soundFx.playClick();
    const def = BOT_HAND_GESTURES[gestureId];

    if (handTargetSide === 'BOTH' || handTargetSide === 'LEFT') {
      setLeftHandGesture(gestureId);
      const map = getHandGestureBoneMap('Left', gestureId);
      applyRotationsToTarget(map);
    }
    if (handTargetSide === 'BOTH' || handTargetSide === 'RIGHT') {
      setRightHandGesture(gestureId);
      const map = getHandGestureBoneMap('Right', gestureId);
      applyRotationsToTarget(map);
    }

    if (voiceAnnounce) {
      ultronVoice.speak(def.audioAnnouncement);
    }
    setLastActionStatus(`HAND GESTURE: ${def.name.toUpperCase()}`);
  };

  // 4. Apply Leg Stance
  const handleApplyLegStance = (stanceId: BotLegStanceId) => {
    soundFx.playClick();
    const stance = BOT_LEG_STANCES[stanceId];
    setSelectedLegStance(stanceId);
    applyRotationsToTarget(stance.rotations, stance.elevation);

    if (voiceAnnounce) {
      ultronVoice.speak(`Leg stance calibrated: ${stance.name}`);
    }
    setLastActionStatus(`LEG STANCE: ${stance.name.toUpperCase()}`);
  };

  // 5. Manual Joint Slider Change
  const handleManualJointChange = (key: keyof ManualJointValues, val: any) => {
    const updated = { ...manualJoints, [key]: val };
    setManualJoints(updated);

    // Build rotation map
    const map = buildManualJointMap(updated);
    applyRotationsToTarget(map, updated.elevation);
    setSelectedPoseId('CUSTOM_MANUAL');
  };

  // Reset all manual servos
  const handleResetManualServos = () => {
    soundFx.playClick();
    setManualJoints(DEFAULT_MANUAL_JOINTS);
    applyFullPoseToTarget('DEFAULT_IDLE');
  };

  // 6. Built-In Kinetic Animation Playback
  const handleTogglePlayClip = (clipName: string) => {
    soundFx.playClick();
    const actions = animationActionsRef.current;
    const action = actions.get(clipName);
    if (!action) return;

    if (activeActionRef.current && activeActionRef.current !== action) {
      activeActionRef.current.stop();
    }

    if (isPlayingClip && activeClipName === clipName) {
      action.paused = !action.paused;
      setIsPlayingClip(!action.paused);
      setLastActionStatus(action.paused ? 'ANIMATION PAUSED' : 'ANIMATION PLAYING');
    } else {
      action.reset().fadeIn(0.3).play();
      action.timeScale = animationSpeed;
      activeActionRef.current = action;
      setActiveClipName(clipName);
      setIsPlayingClip(true);
      setLastActionStatus(`PLAYING CLIP: ${clipName.toUpperCase()}`);
    }
  };

  // 7. Copy Pose Matrix JSON
  const handleCopyPoseMatrix = () => {
    const currentRots = currentRotationsRef.current;
    const exportObj: Record<string, [number, number, number]> = {};
    currentRots.forEach((q, boneName) => {
      const e = new THREE.Euler().setFromQuaternion(q);
      exportObj[boneName] = [
        parseFloat(e.x.toFixed(3)),
        parseFloat(e.y.toFixed(3)),
        parseFloat(e.z.toFixed(3)),
      ];
    });

    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    setCopiedMatrix(true);
    soundFx.playStateSound('EXECUTING');
    setTimeout(() => setCopiedMatrix(false), 2000);
  };

  // 8. Snapshot 3D Canvas
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    soundFx.playClick();
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `cyber_bot_pose_${selectedPoseId.toLowerCase()}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    setLastActionStatus('SNAPSHOT SAVED TO DEVICE');
  };

  // Reset Camera View
  const handleResetCamera = (view: 'full' | 'head' | 'hands' | 'legs') => {
    if (!controlsRef.current || !cameraRef.current) return;
    soundFx.playClick();

    switch (view) {
      case 'head':
        controlsRef.current.target.set(0, 105, 0);
        cameraRef.current.position.set(0, 110, 70);
        break;
      case 'hands':
        controlsRef.current.target.set(0, 80, 0);
        cameraRef.current.position.set(0, 85, 110);
        break;
      case 'legs':
        controlsRef.current.target.set(0, 35, 0);
        cameraRef.current.position.set(0, 45, 140);
        break;
      default:
        controlsRef.current.target.set(0, 65, 0);
        cameraRef.current.position.set(0, 80, 240);
        break;
    }
  };

  // Filtered Poses
  const poseList = Object.values(BOT_FULL_POSES).filter((p) => {
    if (p.id === 'CUSTOM_MANUAL') return false;
    if (poseCategoryFilter === 'ALL') return true;
    return p.category === poseCategoryFilter;
  });

  return (
    <div className={`flex flex-col w-full h-full bg-[#05060b] border border-red-950/80 rounded-xs font-mono select-none overflow-hidden ${className}`}>
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#090b14]/95 border-b border-zinc-800 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-950/80 border border-red-600 rounded-xs text-red-300 text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="tracking-wider">CYBERNETIC BOT POSE & GESTURE MATRIX</span>
          </div>
          <span className="hidden sm:inline text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
            SENTRY INFILTRATOR • 70 SKELETAL JOINTS
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Audio Voice Toggle */}
          <button
            type="button"
            onClick={() => setVoiceAnnounce((v) => !v)}
            title={voiceAnnounce ? 'Mute Ultron Voice Pose Announcements' : 'Unmute Ultron Voice'}
            className={`p-1.5 rounded-xs border transition-colors cursor-pointer ${
              voiceAnnounce
                ? 'bg-red-950/70 border-red-700 text-red-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {voiceAnnounce ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Skeleton Helper Toggle */}
          <button
            type="button"
            onClick={() => setShowSkeletonWireframe((w) => !w)}
            title="Toggle Kinematic Wireframe Skeleton Overlay"
            className={`px-2 py-1 text-xs rounded-xs border flex items-center gap-1 transition-colors cursor-pointer font-bold ${
              showSkeletonWireframe
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">SKELETON</span>
          </button>

          {/* Auto-Rotate Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate((r) => !r)}
            title="Toggle 360° Viewport Auto-Rotation"
            className={`px-2 py-1 text-xs rounded-xs border flex items-center gap-1 transition-colors cursor-pointer ${
              autoRotate
                ? 'bg-red-950 border-red-600 text-red-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">ROTATE</span>
          </button>

          {/* Snapshot Button */}
          <button
            type="button"
            onClick={handleCaptureSnapshot}
            title="Export Rendered Pose as PNG"
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-xs flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span className="hidden lg:inline">SNAPSHOT</span>
          </button>

          {/* Copy Matrix */}
          <button
            type="button"
            onClick={handleCopyPoseMatrix}
            title="Copy Current Skeletal Pose Quaternions to Clipboard"
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-xs flex items-center gap-1 cursor-pointer"
          >
            {copiedMatrix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden lg:inline">{copiedMatrix ? 'COPIED' : 'JSON'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Split: 3D Viewport on Left/Top, Articulation Matrix on Right/Bottom */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* 3D WEBGL VIEWPORT */}
        <div className="flex-1 relative min-h-[380px] lg:min-h-0 bg-[#040509]">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-30">
              <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-red-400 text-xs font-bold tracking-widest uppercase">
                CALIBRATING SKELETAL RIG SERVOS...
              </div>
            </div>
          )}

          {/* Top-Left Telemetry Badge */}
          <div className="absolute top-3 left-3 bg-[#080a14]/90 border border-red-950 p-2 rounded-xs backdrop-blur-md z-10 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <Activity className="w-3 h-3 text-red-500 animate-pulse" />
              <span>ACTIVE POSE MATRIX</span>
            </div>
            <div className="text-zinc-200 font-bold text-xs">
              {BOT_FULL_POSES[selectedPoseId]?.name || 'CUSTOM JOINT MATRIX'}
            </div>
            <div className="text-zinc-500 text-[9px] flex items-center gap-2">
              <span>L-HAND: <strong className="text-cyan-400">{BOT_HAND_GESTURES[leftHandGesture]?.name.split(' ')[0]}</strong></span>
              <span>R-HAND: <strong className="text-cyan-400">{BOT_HAND_GESTURES[rightHandGesture]?.name.split(' ')[0]}</strong></span>
              <span>STANCE: <strong className="text-amber-400">{BOT_LEG_STANCES[selectedLegStance]?.name.split(' ')[0]}</strong></span>
            </div>
          </div>

          {/* Top-Right Camera Viewport Shortcuts */}
          <div className="absolute top-3 right-3 bg-[#080a14]/90 border border-zinc-800 p-1.5 rounded-xs backdrop-blur-md z-10 flex flex-col gap-1 text-[9px]">
            <span className="text-zinc-500 font-bold px-1 text-[8px] text-center">FOCUS CAM</span>
            <button
              type="button"
              onClick={() => handleResetCamera('full')}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xs cursor-pointer text-left"
            >
              Full Body
            </button>
            <button
              type="button"
              onClick={() => handleResetCamera('upper_body' as any)}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xs cursor-pointer text-left"
            >
              Upper Body
            </button>
            <button
              type="button"
              onClick={() => handleResetCamera('head')}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xs cursor-pointer text-left"
            >
              Head / Helm
            </button>
            <button
              type="button"
              onClick={() => handleResetCamera('hands')}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xs cursor-pointer text-left"
            >
              Hands & Arms
            </button>
            <button
              type="button"
              onClick={() => handleResetCamera('legs')}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xs cursor-pointer text-left"
            >
              Legs & Stance
            </button>
          </div>

          {/* Bottom-Left Armor Skin Selector */}
          <div className="absolute bottom-3 left-3 bg-[#080a14]/90 border border-zinc-800 p-1.5 rounded-xs backdrop-blur-md z-10 flex items-center gap-1 text-[9px]">
            <span className="text-zinc-500 font-bold mr-1">ARMOR:</span>
            {(
              [
                { id: 'ULTRON_CRIMSON', label: 'CRIMSON', color: 'bg-red-600' },
                { id: 'VIBRANIUM_CHROME', label: 'CHROME', color: 'bg-sky-400' },
                { id: 'OBSIDIAN_STEALTH', label: 'STEALTH', color: 'bg-purple-500' },
                { id: 'SOLAR_TITAN_GOLD', label: 'TITAN', color: 'bg-amber-500' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSkin(s.id)}
                className={`px-1.5 py-0.5 rounded-2xs cursor-pointer flex items-center gap-1 text-[9px] font-bold transition-all ${
                  armorSkin === s.id
                    ? 'bg-zinc-100 text-black shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom Status Bar */}
          <div className="absolute bottom-3 right-3 bg-black/80 px-2.5 py-1 rounded-xs border border-zinc-900 text-[9px] text-zinc-400 z-10 pointer-events-none">
            {lastActionStatus}
          </div>
        </div>

        {/* RIGHT/BOTTOM CONTROLS CONSOLE */}
        <div className="w-full lg:w-96 xl:w-[420px] bg-[#07080f] border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col shrink-0 h-auto lg:h-full max-h-[500px] lg:max-h-none overflow-hidden">
          {/* Main Matrix Tabs */}
          <div className="flex items-center border-b border-zinc-800 bg-[#080912] p-1 gap-1 text-[10px] shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('POSES')}
              className={`flex-1 py-1.5 px-2 rounded-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'POSES'
                  ? 'bg-red-950 text-red-300 border border-red-700/80 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              FULL POSES (12)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('HANDS')}
              className={`flex-1 py-1.5 px-2 rounded-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'HANDS'
                  ? 'bg-red-950 text-red-300 border border-red-700/80 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              HAND GESTURES
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LEGS')}
              className={`flex-1 py-1.5 px-2 rounded-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'LEGS'
                  ? 'bg-red-950 text-red-300 border border-red-700/80 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              LEG STANCES
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RIG_SLIDERS')}
              className={`flex-1 py-1.5 px-2 rounded-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'RIG_SLIDERS'
                  ? 'bg-red-950 text-red-300 border border-red-700/80 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              JOINT SLIDERS
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ANIMATIONS')}
              className={`flex-1 py-1.5 px-2 rounded-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeTab === 'ANIMATIONS'
                  ? 'bg-red-950 text-red-300 border border-red-700/80 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              CLIPS (7)
            </button>
          </div>

          {/* TAB 1: FULL POSES */}
          {activeTab === 'POSES' && (
            <div className="flex-1 flex flex-col p-3 overflow-y-auto custom-scrollbar gap-2.5">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 text-[9px] pb-1 border-b border-zinc-850">
                {(['ALL', 'COMBAT', 'CINEMATIC', 'SOVEREIGN', 'TACTICAL'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPoseCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-2xs font-bold transition-colors cursor-pointer ${
                      poseCategoryFilter === cat
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Pose Cards Grid */}
              <div className="grid grid-cols-1 gap-2">
                {poseList.map((pose) => {
                  const isSelected = selectedPoseId === pose.id;
                  return (
                    <button
                      key={pose.id}
                      type="button"
                      onClick={() => applyFullPoseToTarget(pose.id)}
                      className={`p-2.5 rounded-xs border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-red-950/70 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                          : 'bg-[#0b0d18] border-zinc-800 hover:border-zinc-700 hover:bg-[#101322]'
                      }`}
                    >
                      <div className="text-2xl p-1 bg-black/40 rounded-xs border border-zinc-800 shrink-0">
                        {pose.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-red-300' : 'text-zinc-200'}`}>
                            {pose.name}
                          </span>
                          <span className="text-[8px] px-1.5 py-0.2 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-2xs shrink-0 font-mono">
                            {pose.category}
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {pose.subtitle}
                        </div>

                        <div className="text-[9px] text-zinc-500 line-clamp-2 mt-1">
                          {pose.description}
                        </div>

                        {/* Badges for Hands and Leg Stance */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[8px] font-mono">
                          <span className="px-1 py-0.2 bg-black/60 text-cyan-400 border border-cyan-950 rounded-2xs">
                            ✋ {BOT_HAND_GESTURES[pose.handGestureRight]?.name.split(' ')[0]}
                          </span>
                          <span className="px-1 py-0.2 bg-black/60 text-amber-400 border border-amber-950 rounded-2xs">
                            🦵 {BOT_LEG_STANCES[pose.legStance]?.name.split(' ')[0]}
                          </span>
                          {pose.elevation !== 0 && (
                            <span className="px-1 py-0.2 bg-black/60 text-purple-400 border border-purple-950 rounded-2xs">
                              ALT: {pose.elevation > 0 ? `+${pose.elevation}` : pose.elevation}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INDEPENDENT HAND GESTURES */}
          {activeTab === 'HANDS' && (
            <div className="flex-1 flex flex-col p-3 overflow-y-auto custom-scrollbar gap-3">
              {/* Target Hand Side Selector */}
              <div className="bg-[#0b0d18] border border-zinc-800 p-2 rounded-xs flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  TARGET MANIPULATOR ARM:
                </span>
                <div className="flex items-center gap-1">
                  {(['BOTH', 'LEFT', 'RIGHT'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setHandTargetSide(side)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-2xs transition-colors cursor-pointer ${
                        handTargetSide === side
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {side === 'BOTH' ? 'BOTH ARMS' : `${side} ARM`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hand Gestures Catalog */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  8 HIGH-RESOLUTION FINGER & WRIST CONFIGURATIONS:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(BOT_HAND_GESTURES).map((gesture) => {
                    const isLeftActive = leftHandGesture === gesture.id;
                    const isRightActive = rightHandGesture === gesture.id;
                    const isActive = isLeftActive || isRightActive;

                    return (
                      <button
                        key={gesture.id}
                        type="button"
                        onClick={() => handleApplyHandGesture(gesture.id)}
                        className={`p-2 rounded-xs border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isActive
                            ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                            : 'bg-[#0b0d18] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#101322]'
                        }`}
                      >
                        <span className="text-xl p-1 bg-black/40 rounded-xs border border-zinc-800 shrink-0">
                          {gesture.icon}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold truncate">
                            {gesture.name}
                          </div>
                          <div className="text-[9px] text-zinc-400 truncate">
                            {gesture.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hand Status Box */}
              <div className="bg-[#090b14] border border-cyan-950 p-2.5 rounded-xs text-[10px] space-y-1 mt-auto">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Hand className="w-3.5 h-3.5 text-cyan-500" />
                  REAL-TIME HAND ACTUATOR STATE
                </span>
                <p className="text-zinc-400 text-[9px]">
                  Fingers are articulated via 15 independent phalange bones (Proximal, Intermediate, Distal for Thumb, Index, Middle, Ring, Pinky) with wrist dorsiflexion.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: INDEPENDENT LEG STANCES */}
          {activeTab === 'LEGS' && (
            <div className="flex-1 flex flex-col p-3 overflow-y-auto custom-scrollbar gap-3">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                8 GROUND PLANT & LEVITATION LEG MATRICES:
              </span>

              <div className="grid grid-cols-1 gap-2">
                {Object.values(BOT_LEG_STANCES).map((stance) => {
                  const isSelected = selectedLegStance === stance.id;

                  return (
                    <button
                      key={stance.id}
                      type="button"
                      onClick={() => handleApplyLegStance(stance.id)}
                      className={`p-2.5 rounded-xs border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-[#0b0d18] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#101322]'
                      }`}
                    >
                      <span className="text-2xl p-1 bg-black/40 rounded-xs border border-zinc-800 shrink-0">
                        {stance.icon}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{stance.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-amber-400 rounded-2xs font-mono">
                            {stance.elevation > 0 ? `+${stance.elevation}m` : `${stance.elevation}m`}
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {stance.subtitle}
                        </div>

                        <div className="text-[9px] text-zinc-500 line-clamp-2 mt-1">
                          {stance.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Leg Physics Telemetry */}
              <div className="bg-[#090b14] border border-amber-950 p-2.5 rounded-xs text-[10px] space-y-1 mt-auto">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  BIPEDAL HYDRAULIC SERVO BALANCE
                </span>
                <p className="text-zinc-400 text-[9px]">
                  Controls hip abduction/flexion (mixamorig:LeftUpLeg / RightUpLeg), knee joints (mixamorig:LeftLeg / RightLeg), ankles, and center-of-gravity vertical elevation.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: MANUAL JOINT KINEMATIC SLIDERS */}
          {activeTab === 'RIG_SLIDERS' && (
            <div className="flex-1 flex flex-col p-3 overflow-y-auto custom-scrollbar gap-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-red-500" />
                  DIRECT SERVO CONTROLLERS
                </span>
                <button
                  type="button"
                  onClick={handleResetManualServos}
                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xs text-[9px] flex items-center gap-1 cursor-pointer font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  ZERO ALL
                </button>
              </div>

              {/* LEFT ARM & HAND */}
              <div className="bg-[#090b14] border border-zinc-800 p-2.5 rounded-xs space-y-2">
                <span className="text-[10px] font-bold text-cyan-400">LEFT ARM & MANIPULATOR</span>

                <div className="space-y-1.5 text-[9px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Shoulder Pitch</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.leftShoulderPitch}°</span>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={manualJoints.leftShoulderPitch}
                    onChange={(e) => handleManualJointChange('leftShoulderPitch', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Shoulder Roll (Outward)</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.leftShoulderRoll}°</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="100"
                    value={manualJoints.leftShoulderRoll}
                    onChange={(e) => handleManualJointChange('leftShoulderRoll', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Elbow Flexion</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.leftElbowBend}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    value={manualJoints.leftElbowBend}
                    onChange={(e) => handleManualJointChange('leftElbowBend', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400">Hand Preset</span>
                    <select
                      value={manualJoints.leftHandGesture}
                      onChange={(e) => handleManualJointChange('leftHandGesture', e.target.value)}
                      className="bg-black border border-zinc-800 text-zinc-200 text-[9px] px-2 py-0.5 rounded-2xs"
                    >
                      {Object.values(BOT_HAND_GESTURES).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* RIGHT ARM & HAND */}
              <div className="bg-[#090b14] border border-zinc-800 p-2.5 rounded-xs space-y-2">
                <span className="text-[10px] font-bold text-red-400">RIGHT ARM & MANIPULATOR</span>

                <div className="space-y-1.5 text-[9px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Shoulder Pitch</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.rightShoulderPitch}°</span>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={manualJoints.rightShoulderPitch}
                    onChange={(e) => handleManualJointChange('rightShoulderPitch', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Shoulder Roll (Outward)</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.rightShoulderRoll}°</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="100"
                    value={manualJoints.rightShoulderRoll}
                    onChange={(e) => handleManualJointChange('rightShoulderRoll', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Elbow Flexion</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.rightElbowBend}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    value={manualJoints.rightElbowBend}
                    onChange={(e) => handleManualJointChange('rightElbowBend', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400">Hand Preset</span>
                    <select
                      value={manualJoints.rightHandGesture}
                      onChange={(e) => handleManualJointChange('rightHandGesture', e.target.value)}
                      className="bg-black border border-zinc-800 text-zinc-200 text-[9px] px-2 py-0.5 rounded-2xs"
                    >
                      {Object.values(BOT_HAND_GESTURES).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* LEGS & ELEVATION */}
              <div className="bg-[#090b14] border border-zinc-800 p-2.5 rounded-xs space-y-2">
                <span className="text-[10px] font-bold text-amber-400">LEGS & CORE ELEVATION</span>

                <div className="space-y-1.5 text-[9px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Vertical Altitude</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.elevation}m</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={manualJoints.elevation}
                    onChange={(e) => handleManualJointChange('elevation', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Left Knee Flex</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.leftKneeBend}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    value={manualJoints.leftKneeBend}
                    onChange={(e) => handleManualJointChange('leftKneeBend', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Right Knee Flex</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.rightKneeBend}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    value={manualJoints.rightKneeBend}
                    onChange={(e) => handleManualJointChange('rightKneeBend', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Spine Lean / Pitch</span>
                    <span className="text-zinc-200 font-bold">{manualJoints.spinePitch}°</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="45"
                    value={manualJoints.spinePitch}
                    onChange={(e) => handleManualJointChange('spinePitch', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BUILT-IN KINETIC ANIMATION CLIPS */}
          {activeTab === 'ANIMATIONS' && (
            <div className="flex-1 flex flex-col p-3 overflow-y-auto custom-scrollbar gap-3">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                7 BUILT-IN CYBERNETIC ANIMATION TRACKS:
              </span>

              <div className="grid grid-cols-1 gap-2">
                {animationClips.map((clip) => {
                  const isPlaying = isPlayingClip && activeClipName === clip;

                  return (
                    <div
                      key={clip}
                      className={`p-2.5 rounded-xs border flex items-center justify-between transition-colors ${
                        isPlaying
                          ? 'bg-purple-950/70 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                          : 'bg-[#0b0d18] border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Play className={`w-3.5 h-3.5 ${isPlaying ? 'text-purple-400 animate-pulse' : 'text-zinc-500'}`} />
                        <div>
                          <span className="text-xs font-bold font-mono uppercase">{clip}</span>
                          <div className="text-[9px] text-zinc-500">
                            {clip === 'walk' ? 'Locomotive forward stride' : clip === 'run' ? 'Rapid tactical dash' : clip === 'agree' ? 'Nodding cyber affirmative' : clip === 'headShake' ? 'Negative refusal protocol' : 'Embedded skeletal sequence'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTogglePlayClip(clip)}
                        className={`px-3 py-1 rounded-xs text-[10px] font-bold cursor-pointer transition-colors ${
                          isPlaying
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {isPlaying ? 'PAUSE' : 'PLAY'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Speed Modulation */}
              <div className="bg-[#090b14] border border-zinc-800 p-2 rounded-xs flex items-center justify-between text-[10px] mt-auto">
                <span className="text-zinc-400">PLAYBACK VELOCITY:</span>
                <div className="flex items-center gap-1">
                  {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        setAnimationSpeed(spd);
                        if (activeActionRef.current) activeActionRef.current.timeScale = spd;
                      }}
                      className={`px-2 py-0.5 rounded-2xs font-bold cursor-pointer ${
                        animationSpeed === spd
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
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
      </div>
    </div>
  );
};
