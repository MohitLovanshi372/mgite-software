/**
 * Real-Time Combat Pose & Fighting Gesture Debug HUD
 *
 * Provides:
 * 1. Webcam start/stop controls
 * 2. Real-time video preview with skeletal landmark canvas overlay
 * 3. Detected fighting gesture display (Right Punch, Left Punch, Guard, Dodge Left/Right, Uppercut, Kick, Idle)
 * 4. Tracking confidence and engine status (MediaPipe / Optical Kinematic)
 * 5. Current avatar animation telemetry
 * 6. Real-time IK Arm Mirror toggle & instant gesture test triggers
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  CameraOff,
  Shield,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  Cpu,
  Crosshair,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  combatPoseDetector,
} from '../../utils/combatPoseDetector.ts';
import { poseIKRetargeter } from '../../utils/poseIKRetargeter.ts';
import { BodyPoseLandmarks, CombatGestureTelemetry, CombatGestureType } from '../../types/gestures.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface CombatGestureHUDProps {
  onGestureTrigger?: (gesture: CombatGestureType, animationName: string) => void;
  activeAnimationName?: string;
  isAvatarRigged?: boolean;
}

export const CombatGestureHUD: React.FC<CombatGestureHUDProps> = ({
  onGestureTrigger,
  activeAnimationName = 'idle',
  isAvatarRigged = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isActive, setIsActive] = useState(false);
  const [engineType, setEngineType] = useState<'MEDIAPIPE' | 'OPTICAL_KINEMATIC'>('OPTICAL_KINEMATIC');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ikMirrorEnabled, setIkMirrorEnabled] = useState(true);
  const [ikBlendWeight, setIkBlendWeight] = useState(0.65);

  const [telemetry, setTelemetry] = useState<CombatGestureTelemetry>({
    gesture: 'STOP_IDLE',
    confidence: 0,
    lastTriggerTime: 0,
    comboCount: 0,
    velocity: 0,
    activeAnimation: 'idle',
    isTracking: false,
    engine: 'OPTICAL_KINEMATIC',
  });

  // Track last triggered gesture to avoid redundant callbacks
  const lastEmittedGestureRef = useRef<CombatGestureType>('NONE');

  // Subscribe to CombatPoseDetector updates
  useEffect(() => {
    const unsubStatus = combatPoseDetector.subscribeStatus((active, engine) => {
      setIsActive(active);
      setEngineType(engine);
    });

    const unsubPose = combatPoseDetector.subscribePose((landmarks, gesture, telem) => {
      setTelemetry(telem);

      // Trigger avatar animation when gesture changes or strikes
      if (
        gesture !== 'NONE' &&
        (gesture !== lastEmittedGestureRef.current || (gesture.includes('PUNCH') && Math.random() > 0.5))
      ) {
        lastEmittedGestureRef.current = gesture;
        const animName = combatPoseDetector.mapGestureToAnimation(gesture);
        if (onGestureTrigger) {
          onGestureTrigger(gesture, animName);
        }
      }

      // Render skeletal landmark overlay on canvas
      renderSkeletalOverlay(landmarks, gesture);
    });

    return () => {
      unsubStatus();
      unsubPose();
    };
  }, [onGestureTrigger]);

  // Sync IK Retargeter settings
  useEffect(() => {
    poseIKRetargeter.setEnabled(ikMirrorEnabled);
  }, [ikMirrorEnabled]);

  useEffect(() => {
    poseIKRetargeter.setBlendWeight(ikBlendWeight);
  }, [ikBlendWeight]);

  /**
   * Renders high-precision skeletal lines and joint nodes over webcam video
   */
  const renderSkeletalOverlay = (landmarks: BodyPoseLandmarks, gesture: CombatGestureType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!landmarks.isTracking) return;

    // Gesture color themes
    let strokeColor = '#06b6d4'; // Cyan default
    let glowColor = 'rgba(6, 182, 212, 0.6)';

    if (gesture === 'RIGHT_PUNCH' || gesture === 'LEFT_PUNCH') {
      strokeColor = '#ef4444'; // Red punch
      glowColor = 'rgba(239, 68, 68, 0.8)';
    } else if (gesture === 'GUARD' || gesture === 'X_GUARD') {
      strokeColor = '#3b82f6'; // Blue guard
      glowColor = 'rgba(59, 130, 246, 0.8)';
    } else if (gesture === 'UPPERCUT') {
      strokeColor = '#a855f7'; // Purple uppercut
      glowColor = 'rgba(168, 85, 247, 0.8)';
    } else if (gesture === 'DODGE_LEFT' || gesture === 'DODGE_RIGHT') {
      strokeColor = '#10b981'; // Green dodge
      glowColor = 'rgba(16, 185, 129, 0.8)';
    } else if (gesture === 'KICK' || gesture === 'TORNADO_KICK') {
      strokeColor = '#f59e0b'; // Amber kick
      glowColor = 'rgba(245, 158, 11, 0.8)';
    } else if (gesture === 'ENERGY_BLAST' || gesture === 'DOUBLE_PALM') {
      strokeColor = '#06b6d4'; // Cyan energy blast
      glowColor = 'rgba(6, 182, 212, 0.9)';
    } else if (gesture === 'T_POSE') {
      strokeColor = '#38bdf8'; // Sky blue T-Pose
      glowColor = 'rgba(56, 189, 248, 0.8)';
    } else if (gesture === 'CROUCH_STANCE') {
      strokeColor = '#64748b'; // Slate crouch
      glowColor = 'rgba(100, 116, 139, 0.8)';
    } else if (gesture === 'POWER_SURGE') {
      strokeColor = '#f43f5e'; // Rose power surge
      glowColor = 'rgba(244, 63, 94, 0.8)';
    } else if (gesture === 'HAND_WAVE') {
      strokeColor = '#14b8a6'; // Teal wave
      glowColor = 'rgba(20, 184, 166, 0.8)';
    } else if (gesture === 'BOW') {
      strokeColor = '#d946ef'; // Fuchsia bow
      glowColor = 'rgba(217, 70, 239, 0.8)';
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;

    const pt = (p: { x: number; y: number }) => ({ x: p.x * w, y: p.y * h });

    // Bone Segments
    const drawLine = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      const a = pt(p1);
      const b = pt(p2);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    // Upper Torso & Arms
    drawLine(landmarks.leftShoulder, landmarks.rightShoulder);
    drawLine(landmarks.rightShoulder, landmarks.rightElbow);
    drawLine(landmarks.rightElbow, landmarks.rightWrist);
    drawLine(landmarks.leftShoulder, landmarks.leftElbow);
    drawLine(landmarks.leftElbow, landmarks.leftWrist);

    // Spine & Hips
    const midShoulder = {
      x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) * 0.5,
      y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) * 0.5,
    };
    const midHip = {
      x: (landmarks.leftHip.x + landmarks.rightHip.x) * 0.5,
      y: (landmarks.leftHip.y + landmarks.rightHip.y) * 0.5,
    };
    drawLine(landmarks.nose, midShoulder);
    drawLine(midShoulder, midHip);
    drawLine(landmarks.leftHip, landmarks.rightHip);

    // Legs
    drawLine(landmarks.leftHip, landmarks.leftKnee);
    drawLine(landmarks.leftKnee, landmarks.leftAnkle);
    drawLine(landmarks.rightHip, landmarks.rightKnee);
    drawLine(landmarks.rightKnee, landmarks.rightAnkle);

    // Draw Joint Nodes
    const joints = [
      landmarks.nose,
      landmarks.leftShoulder,
      landmarks.rightShoulder,
      landmarks.leftElbow,
      landmarks.rightElbow,
      landmarks.leftHip,
      landmarks.rightHip,
      landmarks.leftKnee,
      landmarks.rightKnee,
      landmarks.leftAnkle,
      landmarks.rightAnkle,
    ];

    joints.forEach((j) => {
      const p = pt(j);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Special glowing wrists with Hand Pose indicators
    const rw = pt(landmarks.rightWrist);
    const lw = pt(landmarks.leftWrist);

    // Right hand indicator
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(rw.x, rw.y, landmarks.rightHandState === 'OPEN_PALM' ? 8 : 6, 0, Math.PI * 2);
    if (landmarks.rightHandState === 'OPEN_PALM') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fill();
    }

    // Left hand indicator
    ctx.beginPath();
    ctx.arc(lw.x, lw.y, landmarks.leftHandState === 'OPEN_PALM' ? 8 : 6, 0, Math.PI * 2);
    if (landmarks.leftHandState === 'OPEN_PALM') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fill();
    }
  };

  const toggleWebcam = async () => {
    if (isActive) {
      combatPoseDetector.stop();
      setIsActive(false);
      soundFx.playStateSound('IDLE');
      ultronVoice.speak('Webcam gesture link disengaged. Returning to idle stance.');
    } else {
      setPermissionError(null);
      if (videoRef.current) {
        const started = await combatPoseDetector.start(videoRef.current);
        if (started) {
          setIsActive(true);
          soundFx.playNotificationPing();
          ultronVoice.speak('Optical combat tracking active. Humanoid gesture link established.');
        } else {
          setPermissionError('Camera access denied or unavailable. Grant camera permission to continue.');
        }
      }
    }
  };

  const handleManualGestureTest = (gesture: CombatGestureType) => {
    const animName = combatPoseDetector.mapGestureToAnimation(gesture);
    soundFx.playStateSound('EXECUTING');
    if (onGestureTrigger) {
      onGestureTrigger(gesture, animName);
    }
  };

  const getGestureBadge = (gesture: CombatGestureType) => {
    switch (gesture) {
      case 'RIGHT_PUNCH':
        return { label: 'RIGHT PUNCH', color: 'bg-red-950/80 border-red-500 text-red-300' };
      case 'LEFT_PUNCH':
        return { label: 'LEFT PUNCH', color: 'bg-orange-950/80 border-orange-500 text-orange-300' };
      case 'GUARD':
        return { label: 'DEFENSIVE GUARD', color: 'bg-blue-950/80 border-blue-500 text-blue-300' };
      case 'UPPERCUT':
        return { label: 'UPPERCUT', color: 'bg-purple-950/80 border-purple-500 text-purple-300' };
      case 'DODGE_LEFT':
        return { label: 'DODGE LEFT', color: 'bg-emerald-950/80 border-emerald-500 text-emerald-300' };
      case 'DODGE_RIGHT':
        return { label: 'DODGE RIGHT', color: 'bg-emerald-950/80 border-emerald-500 text-emerald-300' };
      case 'KICK':
        return { label: 'KINETIC KICK', color: 'bg-amber-950/80 border-amber-500 text-amber-300' };
      case 'ENERGY_BLAST':
        return { label: 'REPULSOR BLAST', color: 'bg-cyan-950/80 border-cyan-500 text-cyan-300' };
      case 'X_GUARD':
        return { label: 'X-DEFENSE SHIELD', color: 'bg-indigo-950/80 border-indigo-500 text-indigo-300' };
      case 'T_POSE':
        return { label: 'T-POSE CALIBRATION', color: 'bg-sky-950/80 border-sky-500 text-sky-300' };
      case 'CROUCH_STANCE':
        return { label: 'TACTICAL CROUCH', color: 'bg-slate-900 border-slate-500 text-slate-300' };
      case 'POWER_SURGE':
        return { label: 'POWER SURGE', color: 'bg-rose-950/80 border-rose-500 text-rose-300' };
      case 'HAND_WAVE':
        return { label: 'CYBER GREETING', color: 'bg-teal-950/80 border-teal-500 text-teal-300' };
      case 'BOW':
        return { label: 'MARTIAL BOW', color: 'bg-fuchsia-950/80 border-fuchsia-500 text-fuchsia-300' };
      case 'TORNADO_KICK':
        return { label: '360 SPIN KICK', color: 'bg-yellow-950/80 border-yellow-500 text-yellow-300' };
      case 'DOUBLE_PALM':
        return { label: 'DUAL PALM STRIKE', color: 'bg-pink-950/80 border-pink-500 text-pink-300' };
      case 'STOP_IDLE':
      default:
        return { label: 'IDLE / READY', color: 'bg-zinc-900 border-zinc-700 text-zinc-400' };
    }
  };

  const gestureBadge = getGestureBadge(telemetry.gesture);

  return (
    <div className="flex flex-col bg-[#070912]/95 border border-red-900/60 rounded-xs backdrop-blur-md shadow-2xl overflow-hidden font-mono text-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a0d18] border-b border-red-950/80">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="font-bold text-zinc-200 tracking-wider uppercase text-[11px] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-red-500" />
            WEBCAM GESTURE CONTROL & IK
          </span>
          <span className="text-[9px] px-1.5 py-0.2 bg-red-950/80 border border-red-800 text-red-400 font-bold">
            100% LOCAL
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleWebcam}
            className={`px-2.5 py-1 rounded-xs flex items-center gap-1.5 text-[11px] font-bold tracking-wider transition-all ${
              isActive
                ? 'bg-red-950 border border-red-500 text-red-300 hover:bg-red-900 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {isActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5 text-red-400" />
                STOP CAMERA
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                START CAMERA
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-zinc-800 rounded-xs text-zinc-400 hover:text-zinc-200"
            title={isExpanded ? 'Minimize HUD' : 'Expand HUD'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {permissionError && (
        <div className="p-2 bg-red-950/90 border-b border-red-800 text-red-300 text-[10px] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Main Video & Telemetry Area */}
      <div className="p-3 flex flex-col gap-3">
        {/* Live Video Monitor */}
        <div className="relative w-full aspect-video bg-black rounded-xs overflow-hidden border border-zinc-800 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transform -scale-x-100 ${isActive ? 'block' : 'hidden'}`}
          />
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100 ${
              isActive ? 'block' : 'hidden'
            }`}
          />

          {!isActive && (
            <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 p-4 text-center">
              <Camera className="w-8 h-8 text-zinc-600" />
              <p className="text-[11px] text-zinc-400">CAMERA OFFLINE</p>
              <p className="text-[9px] text-zinc-600 max-w-[220px]">
                Click 'START CAMERA' to track your body gestures locally in real-time.
              </p>
            </div>
          )}

          {/* Corner Optical Targeting Brackets */}
          <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-red-500/60 pointer-events-none" />
          <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-red-500/60 pointer-events-none" />
          <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-red-500/60 pointer-events-none" />
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-red-500/60 pointer-events-none" />

          {/* Top telemetry overlay on video */}
          {isActive && (
            <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
              <span className="px-1.5 py-0.5 bg-black/80 border border-zinc-700 text-zinc-300 text-[9px] rounded-xs backdrop-blur-sm flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                {engineType}
              </span>
              <span className="px-1.5 py-0.5 bg-black/80 border border-zinc-700 text-zinc-300 text-[9px] rounded-xs backdrop-blur-sm">
                FPS: 60
              </span>
            </div>
          )}

          {/* Bottom active gesture banner on video */}
          {isActive && (
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
              <div
                className={`px-2 py-0.5 border text-[10px] font-bold tracking-wider rounded-xs backdrop-blur-md shadow-md ${gestureBadge.color}`}
              >
                {gestureBadge.label}
              </div>
              <div className="px-1.5 py-0.5 bg-black/80 border border-zinc-700 text-zinc-300 text-[9px] rounded-xs backdrop-blur-sm">
                {Math.round(telemetry.confidence * 100)}% CONF
              </div>
            </div>
          )}
        </div>

        {/* Status Dashboard Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[#0b0e1b] border border-zinc-800 p-2 rounded-xs flex flex-col">
            <span className="text-zinc-500 text-[9px]">DETECTED GESTURE</span>
            <span className="font-bold text-zinc-200 mt-0.5 truncate">{gestureBadge.label}</span>
          </div>

          <div className="bg-[#0b0e1b] border border-zinc-800 p-2 rounded-xs flex flex-col">
            <span className="text-zinc-500 text-[9px]">AVATAR ANIMATION</span>
            <span className="font-bold text-red-400 mt-0.5 truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-red-400" />
              {activeAnimationName.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Full-Body & Hand Gesture Telemetry Bar */}
        <div className="grid grid-cols-3 gap-1.5 text-[9px] bg-[#080b15] border border-zinc-800/80 p-2 rounded-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-500 font-bold">L HAND POSE</span>
            <span className={`font-mono font-bold px-1.5 py-0.5 rounded-xs border text-center ${
              telemetry.leftHandState === 'OPEN_PALM'
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : telemetry.leftHandState === 'FIST'
                ? 'bg-red-950/80 border-red-500 text-red-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
              {telemetry.leftHandState || 'TRACKING'}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-500 font-bold">R HAND POSE</span>
            <span className={`font-mono font-bold px-1.5 py-0.5 rounded-xs border text-center ${
              telemetry.rightHandState === 'OPEN_PALM'
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : telemetry.rightHandState === 'FIST'
                ? 'bg-red-950/80 border-red-500 text-red-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
              {telemetry.rightHandState || 'TRACKING'}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-500 font-bold">SQUAT / LEAN</span>
            <div className="flex items-center justify-between text-[8px] text-zinc-400 px-1 py-0.5 bg-black/50 border border-zinc-800 rounded-xs">
              <span>{Math.round((telemetry.squatDepth ?? 0) * 100)}% SQ</span>
              <span>{Math.round((telemetry.torsoLean ?? 0) * 50)}° LN</span>
            </div>
          </div>
        </div>

        {/* Real-Time IK Retargeting & Smoothing Controls */}
        <div className="bg-[#0a0d18] border border-zinc-800/80 p-2 rounded-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer text-[10px]">
              <input
                type="checkbox"
                checked={ikMirrorEnabled}
                onChange={(e) => setIkMirrorEnabled(e.target.checked)}
                className="w-3.5 h-3.5 accent-red-600 rounded-xs"
              />
              <span className="font-bold">FULL-BODY IK MOCAP MIRROR</span>
            </label>
            <span className="text-[9px] text-zinc-500">
              {ikMirrorEnabled ? 'ACTIVE (SMOOTHED)' : 'ANIMATION CLIPS ONLY'}
            </span>
          </div>

          {ikMirrorEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-[9px] w-20">IK BLEND:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={ikBlendWeight}
                onChange={(e) => setIkBlendWeight(parseFloat(e.target.value))}
                className="flex-1 accent-red-500 h-1 bg-zinc-800 rounded-xs cursor-pointer"
              />
              <span className="text-zinc-300 text-[9px] w-8 text-right">
                {Math.round(ikBlendWeight * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Quick Gesture Trigger Deck (Testing & Manual Trigger Matrix) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[9px] text-zinc-400">
            <span className="font-bold text-zinc-500 uppercase">GESTURE TRIGGER MATRIX ({17} ACTIONS)</span>
            <span>CLICK TO TEST</span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[9px]">
            <button
              onClick={() => handleManualGestureTest('RIGHT_PUNCH')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-red-950/60 border border-zinc-800 hover:border-red-500 text-zinc-300 hover:text-red-300 rounded-xs text-center transition-all truncate"
            >
              🥊 R PUNCH
            </button>
            <button
              onClick={() => handleManualGestureTest('LEFT_PUNCH')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-orange-950/60 border border-zinc-800 hover:border-orange-500 text-zinc-300 hover:text-orange-300 rounded-xs text-center transition-all truncate"
            >
              🥊 L PUNCH
            </button>
            <button
              onClick={() => handleManualGestureTest('GUARD')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-blue-950/60 border border-zinc-800 hover:border-blue-500 text-zinc-300 hover:text-blue-300 rounded-xs text-center transition-all truncate"
            >
              🛡️ GUARD
            </button>
            <button
              onClick={() => handleManualGestureTest('UPPERCUT')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-purple-950/60 border border-zinc-800 hover:border-purple-500 text-zinc-300 hover:text-purple-300 rounded-xs text-center transition-all truncate"
            >
              ⚡ UPPERCUT
            </button>
            <button
              onClick={() => handleManualGestureTest('DODGE_LEFT')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-emerald-950/60 border border-zinc-800 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 rounded-xs text-center transition-all truncate"
            >
              ⬅️ DODGE L
            </button>
            <button
              onClick={() => handleManualGestureTest('DODGE_RIGHT')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-emerald-950/60 border border-zinc-800 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 rounded-xs text-center transition-all truncate"
            >
              ➡️ DODGE R
            </button>
            <button
              onClick={() => handleManualGestureTest('KICK')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-amber-950/60 border border-zinc-800 hover:border-amber-500 text-zinc-300 hover:text-amber-300 rounded-xs text-center transition-all truncate"
            >
              🦵 KICK
            </button>
            <button
              onClick={() => handleManualGestureTest('ENERGY_BLAST')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-cyan-950/60 border border-zinc-800 hover:border-cyan-500 text-zinc-300 hover:text-cyan-300 rounded-xs text-center transition-all truncate"
            >
              💥 BLAST
            </button>
            <button
              onClick={() => handleManualGestureTest('X_GUARD')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-indigo-950/60 border border-zinc-800 hover:border-indigo-500 text-zinc-300 hover:text-indigo-300 rounded-xs text-center transition-all truncate"
            >
              🛡️ X-GUARD
            </button>
            <button
              onClick={() => handleManualGestureTest('T_POSE')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-sky-950/60 border border-zinc-800 hover:border-sky-500 text-zinc-300 hover:text-sky-300 rounded-xs text-center transition-all truncate"
            >
              🧍 T-POSE
            </button>
            <button
              onClick={() => handleManualGestureTest('CROUCH_STANCE')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-slate-900 border border-zinc-800 hover:border-slate-500 text-zinc-300 hover:text-slate-300 rounded-xs text-center transition-all truncate"
            >
              🥷 CROUCH
            </button>
            <button
              onClick={() => handleManualGestureTest('POWER_SURGE')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500 text-zinc-300 hover:text-rose-300 rounded-xs text-center transition-all truncate"
            >
              ⚡ SURGE
            </button>
            <button
              onClick={() => handleManualGestureTest('HAND_WAVE')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-teal-950/60 border border-zinc-800 hover:border-teal-500 text-zinc-300 hover:text-teal-300 rounded-xs text-center transition-all truncate"
            >
              👋 WAVE
            </button>
            <button
              onClick={() => handleManualGestureTest('BOW')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-fuchsia-950/60 border border-zinc-800 hover:border-fuchsia-500 text-zinc-300 hover:text-fuchsia-300 rounded-xs text-center transition-all truncate"
            >
              🥋 BOW
            </button>
            <button
              onClick={() => handleManualGestureTest('TORNADO_KICK')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-yellow-950/60 border border-zinc-800 hover:border-yellow-500 text-zinc-300 hover:text-yellow-300 rounded-xs text-center transition-all truncate"
            >
              🌪️ 360 KICK
            </button>
            <button
              onClick={() => handleManualGestureTest('DOUBLE_PALM')}
              className="px-1.5 py-1.5 bg-[#0b0e1b] hover:bg-pink-950/60 border border-zinc-800 hover:border-pink-500 text-zinc-300 hover:text-pink-300 rounded-xs text-center transition-all truncate"
            >
              👐 DUAL PALM
            </button>
            <button
              onClick={() => handleManualGestureTest('STOP_IDLE')}
              className="col-span-4 px-2 py-1.5 bg-[#0b0e1b] hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 rounded-xs text-center transition-all font-bold"
            >
              ⏹️ RESET TO IDLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
