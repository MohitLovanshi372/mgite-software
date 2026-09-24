import React, { useState } from 'react';
import {
  Camera,
  CameraOff,
  Minimize2,
  Maximize2,
  Zap,
  Activity,
  Shield,
  Crosshair,
  X,
  Play,
  Eye,
  Radio,
} from 'lucide-react';

interface JarvisFloatingWebcamProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  detectedGesture: string;
  gestureConfidence: number;
  errorMessage?: string | null;
  onSimulateGesture?: (gesture: any) => void;
}

export const JarvisFloatingWebcam: React.FC<JarvisFloatingWebcamProps> = ({
  isOpen = true,
  onClose,
  isCameraActive,
  onToggleCamera,
  videoRef,
  canvasRef,
  detectedGesture,
  gestureConfidence,
  errorMessage,
  onSimulateGesture,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<'bottom-left' | 'top-left' | 'bottom-right'>('bottom-left');

  if (!isOpen) {
    return null;
  }

  const getPositionClass = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
      default:
        return 'bottom-4 left-4';
    }
  };

  const quickGestures = [
    { label: 'PUNCH', val: 'RIGHT_PUNCH' },
    { label: 'GUARD', val: 'GUARD' },
    { label: 'UPPERCUT', val: 'UPPERCUT' },
    { label: 'KICK', val: 'KICK' },
    { label: 'POINT', val: 'POINT_INDEX' },
    { label: 'PALM', val: 'OPEN_PALM' },
  ];

  return (
    <div
      className={`absolute ${getPositionClass()} z-20 font-mono transition-all select-none shadow-2xl`}
      style={{ width: isMinimized ? '220px' : '290px' }}
    >
      <div className="bg-[#05070e]/95 border border-red-950/90 rounded-xs backdrop-blur-md overflow-hidden shadow-[0_0_24px_rgba(0,0,0,0.85)]">
        {/* Panel Header */}
        <div className="px-2.5 py-1.5 bg-[#080b18] border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-200">
            <Camera className={`w-3.5 h-3.5 ${isCameraActive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="tracking-wider">OPTICAL HUD</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCameraActive ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-amber-400'
              }`}
            />
            <span className="text-[9px] text-zinc-400 font-normal">
              {isCameraActive ? 'LIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const nextPos =
                  position === 'bottom-left'
                    ? 'top-left'
                    : position === 'top-left'
                    ? 'bottom-right'
                    : 'bottom-left';
                setPosition(nextPos);
              }}
              title="Relocate HUD Corner"
              className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Crosshair className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Expand Optical HUD' : 'Minimize Optical HUD'}
              className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Hide Optical HUD"
                className="p-1 text-zinc-400 hover:text-red-400 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Video & Canvas Stream Container */}
        {!isMinimized && (
          <div className="relative w-full h-44 bg-black/95 flex items-center justify-center overflow-hidden">
            {/* Live HTML5 Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${
                isCameraActive ? 'opacity-90' : 'opacity-0'
              }`}
            />

            {/* Landmark & Skeletal Overlay Canvas */}
            <canvas
              ref={canvasRef}
              width={290}
              height={176}
              className={`absolute inset-0 w-full h-full pointer-events-none -scale-x-100 ${
                isCameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Sci-Fi Targeting Crosshair overlay */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none border border-red-500/25 m-2 flex items-center justify-center">
                <div className="w-4 h-4 border border-red-500/40 rounded-full animate-ping" />
                <div className="absolute top-1 left-1 text-[8px] text-red-500 font-mono">KINEMATIC_TRACK</div>
              </div>
            )}

            {/* Standby / Off State Graphic */}
            {!isCameraActive && (
              <div className="flex flex-col items-center justify-center text-center p-3 z-10 w-full">
                <div className="w-8 h-8 rounded-full bg-zinc-900/80 border border-zinc-700 flex items-center justify-center mb-1.5">
                  <CameraOff className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="text-[10px] text-zinc-200 font-bold mb-0.5">
                  OPTICAL SENSORS STANDBY
                </span>
                <span className="text-[9px] text-zinc-400 max-w-[210px] leading-tight mb-2">
                  Track full-body combat poses and hand kinetics via optical camera
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onToggleCamera}
                    className="px-2.5 py-1 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 rounded-xs text-[9px] font-bold flex items-center gap-1 cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all"
                  >
                    <Camera className="w-3 h-3" />
                    <span>START CAMERA</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error state if any */}
            {errorMessage && isCameraActive && (
              <div className="absolute bottom-2 inset-x-2 bg-red-950/90 border border-red-500 text-red-200 text-[9px] p-1 rounded-xs text-center">
                {errorMessage}
              </div>
            )}

            {/* Live Detected Gesture Floating Pill */}
            {isCameraActive && (
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <div className="px-2 py-0.5 bg-black/80 border border-red-600/80 text-red-400 rounded-xs text-[9px] font-bold flex items-center gap-1 shadow-md">
                  <Zap className="w-2.5 h-2.5" />
                  <span>{detectedGesture || 'SEARCHING'}</span>
                </div>
                {gestureConfidence > 0 && (
                  <div className="px-1.5 py-0.5 bg-black/80 border border-zinc-700 text-zinc-300 rounded-xs text-[9px] font-mono">
                    {Math.round(gestureConfidence * 100)}%
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Optical Gesture Simulation Shortcuts */}
        {!isMinimized && onSimulateGesture && (
          <div className="px-2 py-1.5 bg-[#070914] border-t border-zinc-800/60">
            <span className="text-[8px] text-zinc-500 font-bold block mb-1">
              SIMULATE OPTICAL GESTURE:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {quickGestures.map((q) => (
                <button
                  key={q.val}
                  type="button"
                  onClick={() => onSimulateGesture(q.val)}
                  className="px-1.5 py-0.8 bg-[#090c1a] hover:bg-red-950/60 border border-zinc-800 hover:border-red-600/60 rounded-2xs text-[8px] font-bold text-zinc-300 hover:text-red-300 text-center transition-colors cursor-pointer"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Panel Footer Controls */}
        <div className="px-2.5 py-1.5 bg-[#080b16] border-t border-zinc-800/80 flex items-center justify-between gap-2">
          {isCameraActive ? (
            <>
              <div className="flex items-center gap-1 text-[9px] text-zinc-400 truncate">
                <span className="text-emerald-400 font-bold">POSE:</span>
                <span className="text-zinc-200 font-bold truncate">{detectedGesture || 'SEARCHING'}</span>
              </div>
              <button
                type="button"
                onClick={onToggleCamera}
                className="px-2 py-0.8 bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-300 rounded-xs text-[9px] font-bold cursor-pointer transition-colors"
              >
                STOP CAM
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-[9px] text-zinc-500">OPTICAL POSE SENSOR</span>
              <button
                type="button"
                onClick={onToggleCamera}
                className="px-2 py-0.8 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded-xs text-[9px] font-bold cursor-pointer transition-colors"
              >
                START CAM
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
