/**
 * CameraGestureHUD Component
 *
 * Realtime Optical Hand Gesture Camera Feed & HUD Overlay:
 * - Live webcam stream with synthetic skeletal hand overlay tracking landmarks
 * - Real-time gesture classification indicator (OPEN PALM, FIST, VICTORY, POINT, THUMBS UP)
 * - "AI LEARNING LAB": Allows the operator to train the AI with their own custom gestures
 * - Displays confidence matrix, telemetry diagnostics, and execution mapping
 * - Can be toggled on/off or minimized seamlessly
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Hand,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { gestureEngine, DEFAULT_GESTURES } from '../../utils/handGestureDetector.ts';
import { GestureType, LearnedGesture, HandLandmarks } from '../../types/gestures.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';
import { AIStateMode } from '../../types/index.ts';

interface CameraGestureHUDProps {
  onGestureTrigger: (gesture: LearnedGesture) => void;
  currentAIState: AIStateMode;
}

export const CameraGestureHUD: React.FC<CameraGestureHUDProps> = ({
  onGestureTrigger,
  currentAIState,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isActive, setIsActive] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Tracking state
  const [currentGesture, setCurrentGesture] = useState<GestureType>('NONE');
  const [confidence, setConfidence] = useState<number>(0);
  const [isHandDetected, setIsHandDetected] = useState<boolean>(false);
  const [learnedList, setLearnedList] = useState<LearnedGesture[]>(DEFAULT_GESTURES);

  // Training / Learning mode
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingType, setTrainingType] = useState<GestureType>('OPEN_PALM');
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [customActionName, setCustomActionName] = useState<string>('DEFENSE MATRIX');
  const [lastActionTriggered, setLastActionTriggered] = useState<string>('');

  const lastTriggeredTimeRef = useRef<number>(0);

  // Sync callbacks with gestureEngine
  useEffect(() => {
    gestureEngine.setCallbacks(
      (gesture) => {
        const now = Date.now();
        // Debounce actual trigger dispatch by 2.2 seconds to avoid spamming state
        if (now - lastTriggeredTimeRef.current > 2200) {
          lastTriggeredTimeRef.current = now;
          setLastActionTriggered(`${gesture.name} -> ${gesture.triggerAction}`);
          soundFx.playClick();
          onGestureTrigger(gesture);
        }
      },
      (landmarks: HandLandmarks, gesture: GestureType, conf: number) => {
        setCurrentGesture(gesture);
        setConfidence(conf);
        setIsHandDetected(landmarks.isTracking);

        // Draw HUD skeletal hand over canvas overlay
        const canvas = canvasRef.current;
        if (canvas && landmarks.isTracking) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const w = canvas.width;
            const h = canvas.height;

            // Draw Skeletal Lines in crimson
            ctx.strokeStyle = gesture === 'FIST' ? '#ef4444' : gesture === 'VICTORY_PEACE' ? '#10b981' : '#f97316';
            ctx.lineWidth = 2;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 8;

            const pts = [
              landmarks.wrist,
              landmarks.thumbTip,
              landmarks.indexTip,
              landmarks.middleTip,
              landmarks.ringTip,
              landmarks.pinkyTip,
            ];

            // Palm bones
            ctx.beginPath();
            pts.slice(1).forEach((pt) => {
              ctx.moveTo(landmarks.wrist.x * w, landmarks.wrist.y * h);
              ctx.lineTo(landmarks.palmCenter.x * w, landmarks.palmCenter.y * h);
              ctx.lineTo(pt.x * w, pt.y * h);
            });
            ctx.stroke();

            // Joints
            ctx.fillStyle = '#ffffff';
            pts.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x * w, pt.y * h, 3.5, 0, Math.PI * 2);
              ctx.fill();
            });

            // Palm Center Reactor
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.arc(landmarks.palmCenter.x * w, landmarks.palmCenter.y * h, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    );
  }, [onGestureTrigger]);

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
          ultronVoice.speak('Optical gesture matrix engaged. Hand telemetry streaming.');
        } else {
          setPermissionError('Camera optical sensor unavailable or permission denied.');
        }
      }
    }
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    gestureEngine.startTraining(trainingType);
    ultronVoice.speak(`Learning gesture pattern for ${trainingType}. Hold pose steady in front of camera.`);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setTrainingProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        const learned = gestureEngine.stopTraining(
          customActionName,
          `CUSTOM_${trainingType}`,
          currentAIState
        );
        setIsTraining(false);
        setLearnedList([...gestureEngine.learnedGestures]);
        soundFx.playStateSound('SUCCESS');
        ultronVoice.speak(`Gesture acquired and mapped into local synaptic vector memory.`);
      }
    }, 250);
  };

  return (
    <div className="w-full bg-[#08090f]/95 border border-zinc-800 rounded-xs font-mono select-none overflow-hidden relative shadow-xl backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0c0e17] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400">
            <Hand className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100 tracking-wider">
                OPTICAL GESTURE LAB
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-xs font-bold uppercase ${
                  isActive
                    ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-400'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                }`}
              >
                {isActive ? 'OPTICS ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Real-time camera neural learning • Gesture directive trigger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleCamera}
            className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isActive
                ? 'bg-red-950/80 border-red-500 text-red-300 hover:bg-red-900/80'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            {isActive ? (
              <>
                <CameraOff className="w-3 h-3 text-red-400" />
                <span>DISENGAGE</span>
              </>
            ) : (
              <>
                <Camera className="w-3 h-3 text-emerald-400" />
                <span>START CAMERA</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            title={isMinimized ? 'Expand Gesture Lab' : 'Minimize Gesture Lab'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {permissionError && (
        <div className="p-2.5 bg-red-950/80 border-b border-red-500/60 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!isMinimized && (
        <div className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* LEFT: Video Viewfinder with Skeletal HUD (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            <div className="relative aspect-video bg-[#040508] border border-zinc-800 rounded-xs overflow-hidden flex items-center justify-center group">
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isActive ? 'opacity-85' : 'hidden'
                }`}
              />

              {/* Skeletal Canvas Overlay */}
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100 z-10"
              />

              {/* Inactive Standby Screen */}
              {!isActive && (
                <div className="text-center p-4 text-zinc-300 space-y-2">
                  <Camera className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs font-bold tracking-wider text-zinc-400">CAMERA STANDBY</p>
                  <p className="text-[10px] text-zinc-400 max-w-xs">
                    Engage optical feed to enable hand gesture tracking and teach Ultron custom kinetic directives.
                  </p>
                </div>
              )}

              {/* Live HUD Scanlines & Target Reticle */}
              {isActive && (
                <>
                  <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[9px] font-bold px-1.5 py-0.5 bg-black/80 border border-zinc-800 text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>OPTIC // 30 FPS</span>
                  </div>

                  {/* Recognition Badge Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] px-2 py-1 bg-black/85 border border-zinc-800 backdrop-blur-sm">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-red-400" />
                      GESTURE:
                    </span>
                    <span className="text-red-400 font-bold tracking-wider">
                      {isHandDetected ? currentGesture : 'SEEKING HAND...'}
                    </span>
                    <span className="text-zinc-400">
                      {isHandDetected ? `${Math.round(confidence * 100)}% CONF.` : '--'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Recent Action Dispatch Banner */}
            {lastActionTriggered && (
              <div className="p-1.5 bg-red-950/40 border border-red-900/60 text-red-400 text-[10px] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-red-400 animate-pulse" />
                  <span>EXECUTED: {lastActionTriggered}</span>
                </span>
                <span className="text-[9px] text-zinc-500">AUTONOMOUS DISPATCH</span>
              </div>
            )}
          </div>

          {/* RIGHT: AI Learning Lab & Gesture Memory Bank (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-3">
            {/* Gesture Memory Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-zinc-200 tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-red-400" />
                  SYNAPTIC GESTURE REPERTOIRE
                </h4>
                <span className="text-[9px] text-zinc-500 uppercase">
                  {learnedList.length} CODIFIED PATTERNS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {learnedList.map((g) => {
                  const isMatch = currentGesture === g.type && isHandDetected;
                  return (
                    <div
                      key={g.id}
                      className={`p-2 rounded-xs border transition-all text-[10px] flex flex-col justify-between ${
                        isMatch
                          ? 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.4)] scale-[1.02]'
                          : 'bg-[#0a0c13] border-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-200 truncate">{g.name}</span>
                        {isMatch && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1 line-clamp-1">{g.description}</p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-800/60 text-[9px]">
                        <span className="text-red-400 font-bold">{g.mappedState}</span>
                        <span className="text-zinc-500">{Math.round(g.confidence * 100)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Gesture Learning & Calibration Console */}
            <div className="p-3 bg-[#0a0c14] border border-zinc-800/90 rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  TEACH AI NEW KINETIC GESTURE
                </span>
                <span className="text-[9px] text-zinc-400">ONE-SHOT NEURAL INGEST</span>
              </div>

              <p className="text-[10px] text-zinc-400">
                Hold your hand in position and click calibrate. The robotic system will record feature vectors (spread, contour solidity, aspect ratio) and train its neural network weights.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <select
                  value={trainingType}
                  onChange={(e) => setTrainingType(e.target.value as GestureType)}
                  className="bg-[#05060a] border border-zinc-700 px-2 py-1.5 text-xs text-zinc-200 focus:outline-hidden rounded-xs w-full sm:w-auto"
                >
                  <option value="OPEN_PALM">OPEN PALM (HALT)</option>
                  <option value="FIST">CLENCHED FIST (DEFENSE)</option>
                  <option value="VICTORY_PEACE">PEACE / V (SUCCESS)</option>
                  <option value="POINT_INDEX">INDEX POINT (DIRECTIVE)</option>
                  <option value="THUMBS_UP">THUMBS UP (EXECUTE)</option>
                </select>

                <input
                  type="text"
                  value={customActionName}
                  onChange={(e) => setCustomActionName(e.target.value)}
                  placeholder="Trigger Action (e.g. SHIELD_LOCK)..."
                  className="bg-[#05060a] border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-hidden rounded-xs flex-1 w-full"
                />

                <button
                  type="button"
                  disabled={!isActive || isTraining}
                  onClick={handleStartTraining}
                  className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-xs border flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto transition-colors cursor-pointer ${
                    !isActive
                      ? 'opacity-40 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-500'
                      : isTraining
                      ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                      : 'bg-red-600 hover:bg-red-500 border-red-500 text-white'
                  }`}
                >
                  {isTraining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>LEARNING ({trainingProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>TEACH GESTURE</span>
                    </>
                  )}
                </button>
              </div>

              {/* Learning Progress Bar */}
              {isTraining && (
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-red-500 h-full transition-all duration-200 shadow-[0_0_8px_#ef4444]"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
