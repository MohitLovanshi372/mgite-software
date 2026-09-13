/**
 * StageGestureHUD Component
 *
 * Cinematic Tactical HUD Overlay directly over the central stage / 3D AI Core.
 * Active whenever the camera optical feed is engaged:
 *
 * - Real-time tracking skeleton overlay over the identified hand
 * - Bounding coordinate reticle and dynamic target tracking crosshair
 * - Real-time telemetry coordinates:
 *   - Wrist & Finger joint positions (X, Y, Z depth vector)
 *   - Palm centroid vector & angular tilt
 *   - Gesture classification & confidence rating
 *   - Neural vector tensor matrix (simulated real-time learning weights)
 * - Corner holographic brackets and scan status
 */

import React, { useEffect, useState, useRef } from 'react';
import { gestureEngine } from '../../utils/handGestureDetector.ts';
import { HandLandmarks, GestureType } from '../../types/gestures.ts';
import { Crosshair, Eye, Cpu, Zap, Activity, Shield, Gauge } from 'lucide-react';

interface StageGestureHUDProps {
  className?: string;
}

export const StageGestureHUD: React.FC<StageGestureHUDProps> = ({ className = '' }) => {
  const [isActive, setIsActive] = useState<boolean>(gestureEngine.getIsRunning());
  const [landmarks, setLandmarks] = useState<HandLandmarks>(gestureEngine.landmarks);
  const [gesture, setGesture] = useState<GestureType>('NONE');
  const [confidence, setConfidence] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subscribe to gesture engine status and frame updates
  useEffect(() => {
    const unsubStatus = gestureEngine.subscribeStatus((active) => {
      setIsActive(active);
    });

    const unsubFrame = gestureEngine.subscribeFrame((lm, gest, conf) => {
      setLandmarks({ ...lm });
      setGesture(gest);
      setConfidence(conf);
    });

    return () => {
      unsubStatus();
      unsubFrame();
    };
  }, []);

  // Draw HUD canvas skeleton overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isActive || !landmarks.isTracking) return;

    const w = canvas.width;
    const h = canvas.height;

    // Flip horizontal to mirror user movement naturally
    const toScreenX = (normX: number) => (1 - normX) * w;
    const toScreenY = (normY: number) => normY * h;

    const wrist = { x: toScreenX(landmarks.wrist.x), y: toScreenY(landmarks.wrist.y) };
    const palm = { x: toScreenX(landmarks.palmCenter.x), y: toScreenY(landmarks.palmCenter.y) };
    const thumb = { x: toScreenX(landmarks.thumbTip.x), y: toScreenY(landmarks.thumbTip.y) };
    const index = { x: toScreenX(landmarks.indexTip.x), y: toScreenY(landmarks.indexTip.y) };
    const middle = { x: toScreenX(landmarks.middleTip.x), y: toScreenY(landmarks.middleTip.y) };
    const ring = { x: toScreenX(landmarks.ringTip.x), y: toScreenY(landmarks.ringTip.y) };
    const pinky = { x: toScreenX(landmarks.pinkyTip.x), y: toScreenY(landmarks.pinkyTip.y) };

    const tips = [thumb, index, middle, ring, pinky];

    // Neon HUD colors based on gesture
    const strokeColor =
      gesture === 'FIST'
        ? '#ef4444' // red
        : gesture === 'VICTORY_PEACE'
        ? '#10b981' // green
        : gesture === 'POINT_INDEX'
        ? '#38bdf8' // sky blue
        : gesture === 'THUMBS_UP'
        ? '#f59e0b' // amber
        : '#f97316'; // orange

    ctx.save();

    // 1. Draw Bones from wrist to palm and out to finger tips
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 12;

    // Wrist to Palm
    ctx.beginPath();
    ctx.moveTo(wrist.x, wrist.y);
    ctx.lineTo(palm.x, palm.y);
    ctx.stroke();

    // Palm rays to tips
    tips.forEach((tip) => {
      ctx.beginPath();
      ctx.moveTo(palm.x, palm.y);
      // Joint halfway
      const jx = (palm.x + tip.x) / 2;
      const jy = (palm.y + tip.y) / 2;
      ctx.lineTo(jx, jy);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
    });

    // 2. Translucent palm webbing
    ctx.fillStyle = strokeColor === '#ef4444' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(249, 115, 22, 0.12)';
    ctx.beginPath();
    ctx.moveTo(wrist.x, wrist.y);
    tips.forEach((t) => ctx.lineTo(t.x, t.y));
    ctx.closePath();
    ctx.fill();

    // 3. Draw Joints & Optical Knuckles
    tips.forEach((tip, idx) => {
      // Joint intermediate
      const jx = (palm.x + tip.x) / 2;
      const jy = (palm.y + tip.y) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(jx, jy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Finger tip node
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Coordinate tags for index and thumb
      if (idx === 1 || idx === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '9px monospace';
        ctx.fillText(`J${idx}[${Math.round(tip.x)},${Math.round(tip.y)}]`, tip.x + 8, tip.y - 4);
      }
    });

    // 4. Central Palm Kinetic Target Reticle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(palm.x, palm.y, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(palm.x, palm.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Reticle Crosshairs
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(palm.x - 22, palm.y);
    ctx.lineTo(palm.x + 22, palm.y);
    ctx.moveTo(palm.x, palm.y - 22);
    ctx.lineTo(palm.x, palm.y + 22);
    ctx.stroke();

    // 5. Dynamic Bounding Box around hand cluster
    const allPts = [wrist, ...tips, palm];
    const minX = Math.min(...allPts.map((p) => p.x)) - 18;
    const maxX = Math.max(...allPts.map((p) => p.x)) + 18;
    const minY = Math.min(...allPts.map((p) => p.y)) - 18;
    const maxY = Math.max(...allPts.map((p) => p.y)) + 18;
    const boxW = maxX - minX;
    const boxH = maxY - minY;

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(minX, minY, boxW, boxH);
    ctx.setLineDash([]);

    // Corner brackets on bounding box
    const cLen = 10;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(minX, minY + cLen);
    ctx.lineTo(minX, minY);
    ctx.lineTo(minX + cLen, minY);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(maxX - cLen, minY);
    ctx.lineTo(maxX, minY);
    ctx.lineTo(maxX, minY + cLen);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(minX, maxY - cLen);
    ctx.lineTo(minX, maxY);
    ctx.lineTo(minX + cLen, maxY);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(maxX - cLen, maxY);
    ctx.lineTo(maxX, maxY);
    ctx.lineTo(maxX, maxY - cLen);
    ctx.stroke();

    // Bounding Box Label
    ctx.fillStyle = strokeColor;
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`KINETIC_TENSOR: ${gesture} [${Math.round(confidence * 100)}%]`, minX, minY - 6);

    ctx.restore();
  }, [isActive, landmarks, gesture, confidence]);

  if (!isActive) return null;

  const palmX = Math.round((1 - landmarks.palmCenter.x) * 1000) / 10;
  const palmY = Math.round(landmarks.palmCenter.y * 1000) / 10;
  const wristX = Math.round((1 - landmarks.wrist.x) * 1000) / 10;
  const wristY = Math.round(landmarks.wrist.y * 1000) / 10;

  const confPercent = landmarks.isTracking ? Math.round(confidence * 100) : 0;
  const confidenceColor =
    confPercent >= 85
      ? 'text-emerald-400 border-emerald-500'
      : confPercent >= 60
      ? 'text-amber-400 border-amber-500'
      : 'text-red-400 border-red-500';

  const confidenceBarColor =
    confPercent >= 85
      ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
      : confPercent >= 60
      ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
      : 'bg-red-500 shadow-[0_0_8px_#ef4444]';

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-30 font-mono select-none overflow-hidden ${className}`}
    >
      {/* 1. Full-Resolution Canvas for 60FPS Skeletal Overlay */}
      <canvas
        ref={canvasRef}
        width={720}
        height={520}
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* TOP-CENTER: Real-time Gesture Confidence Meter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 bg-black/85 border border-zinc-800 px-3.5 py-2 rounded-xs backdrop-blur-md shadow-2xl z-40 min-w-[240px]">
        <div className="flex items-center justify-between w-full text-[10px]">
          <span className="flex items-center gap-1 text-zinc-400 font-bold uppercase tracking-wider">
            <Gauge className="w-3 h-3 text-red-500" />
            GESTURE CONFIDENCE
          </span>
          <span className={`font-bold tracking-widest text-xs ${confidenceColor}`}>
            {landmarks.isTracking ? `${confPercent}%` : 'STANDBY'}
          </span>
        </div>

        {/* Segmented / Smooth Confidence Progress Gauge */}
        <div className="w-full h-2 bg-zinc-950 rounded-xs overflow-hidden border border-zinc-800/90 relative p-[1px] flex items-center">
          <div
            className={`h-full rounded-xs transition-all duration-150 ${confidenceBarColor}`}
            style={{ width: `${confPercent}%` }}
          />
        </div>

        {/* Real-time Status Micro-Telemetry */}
        <div className="flex items-center justify-between w-full text-[8px] text-zinc-500 uppercase">
          <span>
            STATUS:{' '}
            <strong className={landmarks.isTracking ? 'text-zinc-200' : 'text-zinc-600'}>
              {landmarks.isTracking ? (gesture !== 'NONE' ? gesture : 'RESOLVING') : 'NO TARGET'}
            </strong>
          </span>
          <span>
            CERTAINTY:{' '}
            <strong className={confPercent >= 80 ? 'text-emerald-400' : confPercent >= 50 ? 'text-amber-400' : 'text-zinc-500'}>
              {confPercent >= 85 ? 'HIGH' : confPercent >= 60 ? 'MODERATE' : confPercent > 0 ? 'CALIBRATING' : 'IDLE'}
            </strong>
          </span>
        </div>
      </div>

      {/* 2. Top-Left Optical Telemetry Status */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 bg-black/75 border border-red-900/60 p-2 rounded-xs backdrop-blur-md text-[10px] text-zinc-300">
        <div className="flex items-center gap-1.5 text-red-400 font-bold border-b border-red-950/80 pb-1">
          <Eye className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>OPTICAL KINETIC SENSOR ACTIVE</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[9px]">
          <span className="text-zinc-500">TARGET ACQUIRED:</span>
          <span className={landmarks.isTracking ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
            {landmarks.isTracking ? 'LOCKED (1 HAND)' : 'SEARCHING...'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[9px]">
          <span className="text-zinc-500">GESTURE CODE:</span>
          <span className="text-red-400 font-bold">{landmarks.isTracking ? gesture : '--'}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[9px]">
          <span className="text-zinc-500">CONFIDENCE:</span>
          <span className="text-zinc-200">
            {landmarks.isTracking ? `${Math.round(confidence * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* 3. Top-Right Realtime 3D Joint Coordinate Vectors */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 bg-black/75 border border-zinc-800/80 p-2 rounded-xs backdrop-blur-md text-[10px] text-zinc-300 text-right">
        <div className="flex items-center justify-end gap-1.5 text-zinc-400 font-bold border-b border-zinc-800/80 pb-1">
          <span>REAL-TIME JOINT MATRIX</span>
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <p className="text-[9px] text-zinc-400">
          PALM: <span className="text-cyan-400">X:{palmX} Y:{palmY}</span>
        </p>
        <p className="text-[9px] text-zinc-400">
          WRIST: <span className="text-zinc-300">X:{wristX} Y:{wristY}</span>
        </p>
        <p className="text-[9px] text-zinc-400">
          VELOCITY: <span className="text-amber-400">{landmarks.rawMotion} px/s</span>
        </p>
      </div>

      {/* 4. Bottom-Left Simulated Synaptic Learning Tensor Bar */}
      <div className="absolute bottom-4 left-4 bg-black/80 border border-zinc-800 p-2 rounded-xs backdrop-blur-md max-w-xs space-y-1">
        <div className="flex items-center justify-between text-[9px] text-red-400 font-bold">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-red-400" />
            SYNAPTIC GESTURE INFERENCE
          </span>
          <span>WEIGHTS: NOMINAL</span>
        </div>
        <div className="grid grid-cols-5 gap-1 pt-1">
          {['PALM', 'FIST', 'PEACE', 'POINT', 'THUMB'].map((label, idx) => {
            const isMatch =
              (idx === 0 && gesture === 'OPEN_PALM') ||
              (idx === 1 && gesture === 'FIST') ||
              (idx === 2 && gesture === 'VICTORY_PEACE') ||
              (idx === 3 && gesture === 'POINT_INDEX') ||
              (idx === 4 && gesture === 'THUMBS_UP');
            return (
              <div
                key={label}
                className={`text-center py-0.5 rounded-xs border text-[8px] transition-colors ${
                  isMatch && landmarks.isTracking
                    ? 'bg-red-950 border-red-500 text-red-200 font-bold shadow-[0_0_8px_#ef4444]'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Central Tactical Calibration Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-48 h-48 border border-dashed border-red-500 rounded-full animate-spin" style={{ animationDuration: '30s' }} />
        <div className="absolute w-64 h-64 border border-zinc-700/50 rounded-full" />
      </div>
    </div>
  );
};
