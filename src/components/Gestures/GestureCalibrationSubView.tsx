/**
 * GestureCalibrationSubView Component
 *
 * Dedicated 'Gesture Calibration' sub-view within the Intelligence page:
 * - Live Camera Calibration HUD with real-time skeletal tracking
 * - Visual Teaching Mode with detailed anatomy guidelines and pose targets
 * - Interactive Recording Buffer to capture, compute feature metrics, and train one-shot neural weights
 * - Custom Command & State Mapping: Bind custom hand motions to direct system actions
 * - Synaptic Gesture Library Manager: Inspect, edit, test, delete, and calibrate custom gestures
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Hand,
  Camera,
  CameraOff,
  Sparkles,
  Zap,
  Activity,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  X,
  Layers,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { VisualHandGuide } from './VisualHandGuide.tsx';
import { RealtimeGestureAccuracyChart } from './RealtimeGestureAccuracyChart.tsx';
import { gestureEngine, DEFAULT_GESTURES } from '../../utils/handGestureDetector.ts';
import { GestureType, LearnedGesture, HandLandmarks } from '../../types/gestures.ts';
import { AIStateMode } from '../../types/index.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface GestureCalibrationSubViewProps {
  currentAIState?: AIStateMode;
  onExecuteCommand?: (command: string, mappedState?: AIStateMode) => void;
}

export const GestureCalibrationSubView: React.FC<GestureCalibrationSubViewProps> = ({
  currentAIState = 'IDLE',
  onExecuteCommand,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Optical stream state
  const [isActive, setIsActive] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Detection telemetry
  const [currentGesture, setCurrentGesture] = useState<GestureType>('NONE');
  const [confidence, setConfidence] = useState<number>(0);
  const [isHandDetected, setIsHandDetected] = useState<boolean>(false);
  const [handLandmarks, setHandLandmarks] = useState<HandLandmarks | null>(null);

  // Gesture Repertoire list
  const [gesturesList, setGesturesList] = useState<LearnedGesture[]>(gestureEngine.learnedGestures);

  // Visual Teaching & Calibration Mode
  const [selectedTemplate, setSelectedTemplate] = useState<GestureType>('OPEN_PALM');
  const [customName, setCustomName] = useState<string>('PERIMETER SHIELD PROTOCOL');
  const [customAction, setCustomAction] = useState<string>('ENGAGE_DEFENSIVE_ARRAY');
  const [mappedState, setMappedState] = useState<AIStateMode>('SECURITY_ALERT');
  const [customDescription, setCustomDescription] = useState<string>(
    'Custom operator hand movement configured for instantaneous autonomous defensive posture.'
  );

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [recordedSamples, setRecordedSamples] = useState<number>(0);

  // Editing existing gesture in library
  const [editingGestureId, setEditingGestureId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editAction, setEditAction] = useState<string>('');
  const [editState, setEditState] = useState<AIStateMode>('EXECUTING');

  // Test feedback banner
  const [lastTestedGesture, setLastTestedGesture] = useState<string | null>(null);

  // Subscribe to gestureEngine status and gestures list
  useEffect(() => {
    const unsubStatus = gestureEngine.subscribeStatus((active) => {
      setIsActive(active);
    });

    const unsubGestures = gestureEngine.subscribeGestures((list) => {
      setGesturesList(list);
    });

    const unsubFrame = gestureEngine.subscribeFrame((landmarks, gesture, conf) => {
      setHandLandmarks(landmarks);
      setIsHandDetected(landmarks.isTracking);
      setCurrentGesture(gesture);
      setConfidence(conf);

      // Render overlay on local canvas
      const canvas = canvasRef.current;
      if (canvas && landmarks.isTracking) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const w = canvas.width;
          const h = canvas.height;

          // Wireframe skeletal connections
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          // Wrist to fingers
          const wristX = landmarks.wrist.x * w;
          const wristY = landmarks.wrist.y * h;

          const fingerTips = [
            landmarks.thumbTip,
            landmarks.indexTip,
            landmarks.middleTip,
            landmarks.ringTip,
            landmarks.pinkyTip,
          ];

          fingerTips.forEach((tip) => {
            ctx.moveTo(wristX, wristY);
            ctx.lineTo(tip.x * w, tip.y * h);
          });
          ctx.stroke();

          // Joint targets
          fingerTips.forEach((pt) => {
            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, 3.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Palm core
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(landmarks.palmCenter.x * w, landmarks.palmCenter.y * h, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      unsubStatus();
      unsubGestures();
      unsubFrame();
    };
  }, []);

  const toggleCamera = async () => {
    if (isActive) {
      gestureEngine.stop();
      setIsActive(false);
      setIsHandDetected(false);
      setCurrentGesture('NONE');
    } else {
      setPermissionError(null);
      if (videoRef.current) {
        const started = await gestureEngine.start(videoRef.current);
        if (started) {
          setIsActive(true);
          soundFx.playNotificationPing();
          ultronVoice.speak('Optical calibration matrix active. Camera optics synchronized.');
        } else {
          setPermissionError('Camera optics unavailable or permission denied.');
        }
      }
    }
  };

  // Start Calibration Recording & Visual Teaching Sequence
  const handleStartRecording = () => {
    if (!isActive) {
      ultronVoice.speak('Engage camera optics prior to recording gesture calibration.');
      return;
    }

    setIsRecording(true);
    setRecordingProgress(0);
    setRecordedSamples(0);

    gestureEngine.startTraining(selectedTemplate);
    soundFx.playClick();
    ultronVoice.speak(
      `Recording custom vector profile for ${selectedTemplate}. Align hand with the optical teaching guide.`
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setRecordingProgress(progress);
      setRecordedSamples(Math.floor(progress * 0.48));

      if (progress >= 100) {
        clearInterval(interval);
        const learned = gestureEngine.stopTraining(customName, customAction, mappedState);

        setIsRecording(false);
        setGesturesList([...gestureEngine.learnedGestures]);
        soundFx.playStateSound('SUCCESS');
        ultronVoice.speak(
          `Custom gesture "${customName}" calibrated and bound to directive "${customAction}".`
        );
      }
    }, 150);
  };

  // Test triggering a gesture manually
  const handleTestGesture = (gesture: LearnedGesture) => {
    setLastTestedGesture(`${gesture.name} -> ${gesture.triggerAction}`);
    soundFx.playStateSound(gesture.mappedState);
    ultronVoice.speak(`Simulating gesture directive: ${gesture.name}. Executing ${gesture.triggerAction}.`);
    if (onExecuteCommand) {
      onExecuteCommand(gesture.triggerAction, gesture.mappedState);
    }
  };

  const handleStartEdit = (g: LearnedGesture) => {
    setEditingGestureId(g.id);
    setEditName(g.name);
    setEditAction(g.triggerAction);
    setEditState(g.mappedState);
  };

  const handleSaveEdit = (id: string) => {
    gestureEngine.updateGesture(id, {
      name: editName,
      triggerAction: editAction,
      mappedState: editState,
    });
    setEditingGestureId(null);
    soundFx.playClick();
    ultronVoice.speak('Gesture mapping updated.');
  };

  const handleDeleteGesture = (id: string) => {
    gestureEngine.deleteGesture(id);
    soundFx.playClick();
    ultronVoice.speak('Gesture removed from synaptic library.');
  };

  const handleResetDefaults = () => {
    gestureEngine.resetDefaultGestures();
    soundFx.playClick();
    ultronVoice.speak('Restored default factory gesture matrix.');
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Sub-View Intro Banner */}
      <div className="p-4 bg-[#080a10] border border-red-900/60 rounded-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
              <Hand className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-wider">
                KINETIC GESTURE CALIBRATION & TEACHING LAB
              </h3>
              <p className="text-xs text-zinc-400">
                Record custom hand kinematics • Map system directives • Visual synaptic pose teaching
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleCamera}
            className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-xs border flex items-center gap-2 transition-colors cursor-pointer ${
              isActive
                ? 'bg-red-950/80 border-red-500 text-red-300 hover:bg-red-900/80 shadow-[0_0_8px_#ef4444]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            {isActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5 text-red-400" />
                <span>DISENGAGE OPTICS</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>START CAMERA OPTICS</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 bg-[#090b12] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer"
            title="Reset to Factory Gestures"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET DEFAULTS</span>
          </button>
        </div>
      </div>

      {permissionError && (
        <div className="p-3 bg-red-950/80 border border-red-500/80 text-red-200 text-xs flex items-center gap-2 rounded-xs">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Main Split: Left (Optics + Visual Guide) & Right (Teaching Recording Studio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Live Camera Feed & Visual Guide (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Live Camera Viewport */}
          <div className="bg-[#06080e] border border-zinc-800 rounded-xs p-3 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-200 tracking-wider flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-zinc-600'}`} />
                LIVE OPTICAL SENSOR HUD
              </span>
              <span className="text-[10px] text-zinc-400">
                {isActive ? (isHandDetected ? 'HAND ACQUIRED' : 'SEEKING CONTRAST') : 'STANDBY'}
              </span>
            </div>

            <div className="relative w-full h-56 sm:h-64 bg-black rounded-xs overflow-hidden border border-zinc-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${!isActive ? 'hidden' : 'block'}`}
              />

              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none ${
                  !isActive ? 'hidden' : 'block'
                }`}
              />

              {!isActive && (
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs p-4 text-center">
                  <Camera className="w-8 h-8 opacity-40 text-zinc-400" />
                  <span>OPTICAL TELEMETRY OFFLINE</span>
                  <span className="text-[10px] text-zinc-600 max-w-xs">
                    Click "Start Camera Optics" to activate the 30 FPS skeletal tracking and gesture calibration feed.
                  </span>
                </div>
              )}

              {isActive && (
                <>
                  <div className="absolute inset-0 bg-scanlines opacity-15 pointer-events-none" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 bg-black/80 border border-zinc-800 text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>CALIBRATION SCAN // 30 FPS</span>
                  </div>

                  {/* Recognition Readout Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] px-2.5 py-1 bg-black/90 border border-zinc-800 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-zinc-400">DETECTED:</span>
                      <span className="text-red-400 font-bold tracking-wider">
                        {isHandDetected ? currentGesture : 'NONE'}
                      </span>
                    </div>
                    <div className="text-zinc-400">
                      {isHandDetected ? `${Math.round(confidence * 100)}% CONFIDENCE` : '--'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
              <div className="p-2 bg-[#090b12] border border-zinc-800 text-zinc-400">
                <span className="block text-[9px] text-zinc-500 uppercase">Kinetic Motion</span>
                <span className="font-bold text-zinc-200">
                  {handLandmarks && isHandDetected ? `${Math.round(handLandmarks.rawMotion * 100)}%` : '0%'}
                </span>
              </div>
              <div className="p-2 bg-[#090b12] border border-zinc-800 text-zinc-400">
                <span className="block text-[9px] text-zinc-500 uppercase">Centroid Tracking</span>
                <span className="font-bold text-zinc-200">
                  {handLandmarks && isHandDetected
                    ? `${(handLandmarks.palmCenter.x * 100).toFixed(0)}%, ${(handLandmarks.palmCenter.y * 100).toFixed(0)}%`
                    : '--'}
                </span>
              </div>
              <div className="p-2 bg-[#090b12] border border-zinc-800 text-zinc-400">
                <span className="block text-[9px] text-zinc-500 uppercase">Pose Match</span>
                <span className="font-bold text-red-400">
                  {currentGesture === selectedTemplate ? 'TARGET LOCKED' : 'ALIGNING'}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Hand Guide: Dynamic Anatomy for current template */}
          <VisualHandGuide
            gestureType={selectedTemplate}
            isTeachingActive={isRecording}
            className="w-full"
          />
        </div>

        {/* RIGHT COLUMN: Teaching Mode & Command Mapping Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Recording & Calibration Form */}
          <div className="bg-[#080a12] border border-red-950/80 rounded-xs p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-red-400" />
                TEACHING STUDIO: RECORD & MAP GESTURE
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-red-950/60 border border-red-700/60 text-red-400 font-bold uppercase">
                NEURAL SYNAPSE TRAINING
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Select a kinetic posture template, position your hand according to the optical anatomy guide,
              and bind it to an autonomous system directive.
            </p>

            {/* Template Selector Radio Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                1. SELECT HAND POSTURE TEMPLATE:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['OPEN_PALM', 'FIST', 'VICTORY_PEACE', 'POINT_INDEX', 'THUMBS_UP'] as GestureType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedTemplate(type)}
                      className={`p-2 rounded-xs border text-left text-xs transition-all cursor-pointer ${
                        selectedTemplate === type
                          ? 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_8px_#ef4444]'
                          : 'bg-[#090b12] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold block truncate">{type.replace('_', ' ')}</span>
                      <span className="text-[9px] text-zinc-500 block truncate">
                        {type === 'OPEN_PALM' && 'Halt / Defensive'}
                        {type === 'FIST' && 'Lockdown / Security'}
                        {type === 'VICTORY_PEACE' && 'Nominal / Morph'}
                        {type === 'POINT_INDEX' && 'Directive / Aim'}
                        {type === 'THUMBS_UP' && 'Affirmative / Audio'}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Custom Gesture Name */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                2. CUSTOM GESTURE IDENTIFIER:
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. PERIMETER SHIELD PROTOCOL..."
                className="w-full bg-[#040508] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-red-500 focus:outline-hidden rounded-xs"
              />
            </div>

            {/* Command Mapping & AI State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                  3. SYSTEM COMMAND / DIRECTIVE:
                </label>
                <input
                  type="text"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  placeholder="e.g. ENGAGE_DEFENSIVE_ARRAY..."
                  className="w-full bg-[#040508] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-red-500 focus:outline-hidden rounded-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                  4. MAPPED CORE AI STATE:
                </label>
                <select
                  value={mappedState}
                  onChange={(e) => setMappedState(e.target.value as AIStateMode)}
                  className="w-full bg-[#040508] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-hidden rounded-xs"
                >
                  <option value="IDLE">IDLE (STANDBY)</option>
                  <option value="LISTENING">LISTENING (DIRECTIVE)</option>
                  <option value="THINKING">THINKING (NEURAL SYNTHESIS)</option>
                  <option value="EXECUTING">EXECUTING (KINEMATIC)</option>
                  <option value="SECURITY_ALERT">SECURITY ALERT (AIRGAP LOCK)</option>
                  <option value="SUCCESS">SUCCESS (NOMINAL CONFIRM)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                5. OPERATIONAL PROTOCOL LOG:
              </label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Tactical telemetry summary..."
                className="w-full bg-[#040508] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-red-500 focus:outline-hidden rounded-xs"
              />
            </div>

            {/* Recording Trigger Button & Progress Bar */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={!isActive || isRecording}
                onClick={handleStartRecording}
                className={`w-full py-2.5 px-4 text-xs font-bold tracking-wider rounded-xs border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isActive
                    ? 'opacity-40 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-500'
                    : isRecording
                    ? 'bg-red-950 border-red-500 text-red-200 animate-pulse shadow-[0_0_12px_#ef4444]'
                    : 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                }`}
              >
                {isRecording ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-red-300" />
                    <span>CALIBRATING SYNAPSE ({recordingProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>RECORD & CALIBRATE GESTURE</span>
                  </>
                )}
              </button>

              {isRecording && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>RECORDING FRAMES: {recordedSamples} / 48</span>
                    <span>{recordingProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="bg-red-500 h-full transition-all duration-150 shadow-[0_0_8px_#ef4444]"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME D3 GESTURE ACCURACY & CLARITY TELEMETRY (LAST 60 SECONDS) */}
      <RealtimeGestureAccuracyChart height={230} showControls={true} />

      {/* BOTTOM SECTION: Synaptic Gesture Library Manager */}
      <div className="bg-[#080a12] border border-zinc-800 rounded-xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-400" />
            <h4 className="text-xs font-bold text-zinc-100 tracking-wider">
              SYNAPTIC GESTURE LIBRARY & COMMAND MAPPINGS
            </h4>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-400 font-bold uppercase">
              {gesturesList.length} CODIFIED GESTURES
            </span>
          </div>

          {lastTestedGesture && (
            <div className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/60 px-2 py-0.5 rounded-xs flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>TEST EXECUTED: {lastTestedGesture}</span>
            </div>
          )}
        </div>

        {/* Gestures Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {gesturesList.map((gesture) => {
            const isEditing = editingGestureId === gesture.id;
            const isCurrentlyRecognized = currentGesture === gesture.type && isHandDetected;

            return (
              <div
                key={gesture.id}
                className={`p-3 rounded-xs border transition-all flex flex-col justify-between ${
                  isCurrentlyRecognized
                    ? 'bg-red-950/80 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    : 'bg-[#0a0c14] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {isEditing ? (
                  /* Edit Mode Form */
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                      <span>EDITING GESTURE</span>
                      <span className="text-red-400 font-bold">{gesture.type}</span>
                    </div>

                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#030408] border border-zinc-700 p-1.5 text-xs text-zinc-100 rounded-xs"
                      placeholder="Gesture Name"
                    />

                    <input
                      type="text"
                      value={editAction}
                      onChange={(e) => setEditAction(e.target.value)}
                      className="w-full bg-[#030408] border border-zinc-700 p-1.5 text-xs text-zinc-100 rounded-xs"
                      placeholder="Command Directive"
                    />

                    <select
                      value={editState}
                      onChange={(e) => setEditState(e.target.value as AIStateMode)}
                      className="w-full bg-[#030408] border border-zinc-700 p-1.5 text-xs text-zinc-100 rounded-xs"
                    >
                      <option value="IDLE">IDLE</option>
                      <option value="LISTENING">LISTENING</option>
                      <option value="THINKING">THINKING</option>
                      <option value="EXECUTING">EXECUTING</option>
                      <option value="SECURITY_ALERT">SECURITY_ALERT</option>
                      <option value="SUCCESS">SUCCESS</option>
                    </select>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(gesture.id)}
                        className="flex-1 py-1 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold rounded-xs flex items-center justify-center gap-1 hover:bg-emerald-900 cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>SAVE</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGestureId(null)}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs rounded-xs hover:text-zinc-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Card Display */
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                          {isCurrentlyRecognized && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          )}
                          {gesture.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-xs font-bold uppercase ${
                            gesture.isCustom
                              ? 'bg-amber-950/80 border border-amber-600/60 text-amber-400'
                              : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {gesture.isCustom ? 'CUSTOM' : 'CORE'}
                        </span>
                      </div>

                      <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1">
                        {gesture.description}
                      </p>

                      <div className="mt-2.5 p-1.5 bg-[#05060a] border border-zinc-800 rounded-xs space-y-1 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">MAPPED COMMAND:</span>
                          <span className="font-bold text-red-400">{gesture.triggerAction}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">CORE STATE:</span>
                          <span className="font-bold text-zinc-300">{gesture.mappedState}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">CONFIDENCE / SAMPLES:</span>
                          <span className="text-zinc-400">
                            {Math.round(gesture.confidence * 100)}% ({gesture.sampleCount} frames)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => handleTestGesture(gesture)}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Simulate this gesture directive"
                      >
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>TEST TRIGGER</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(gesture)}
                          className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xs cursor-pointer"
                          title="Edit gesture mapping"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {gesture.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGesture(gesture.id)}
                            className="p-1 bg-red-950/40 hover:bg-red-900/60 border border-red-900/80 text-red-400 hover:text-red-300 rounded-xs cursor-pointer"
                            title="Delete custom gesture"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
