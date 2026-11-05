/**
 * VisualHandGuide Component
 *
 * An interactive visual teaching guide that demonstrates ideal hand poses,
 * finger extension angles, and anatomical landmarks for the Ultron Gesture Calibration subsystem.
 */

import React from 'react';
import { GestureType } from '../../types/gestures.ts';

interface VisualHandGuideProps {
  gestureType: GestureType;
  className?: string;
  isTeachingActive?: boolean;
}

export const VisualHandGuide: React.FC<VisualHandGuideProps> = ({
  gestureType,
  className = '',
  isTeachingActive = false,
}) => {
  // Render high-precision SVG wireframe illustration of each hand gesture pose
  const renderHandIllustration = () => {
    switch (gestureType) {
      case 'OPEN_PALM':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full">
            <defs>
              <radialGradient id="glow-palm" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Palm Base & Carpal Arc */}
            <path
              d="M 50 145 C 50 160, 110 160, 110 145 C 120 120, 125 90, 115 80 C 105 75, 55 75, 45 80 C 35 90, 40 120, 50 145 Z"
              fill="#181119"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            {/* Thumb (spread wide left) */}
            <path
              d="M 45 105 C 25 95, 15 85, 18 70 C 22 62, 32 68, 42 85"
              fill="none"
              stroke="#f87171"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Index Finger (extended) */}
            <path
              d="M 52 78 L 50 25"
              fill="none"
              stroke="#f87171"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Middle Finger (extended tall) */}
            <path
              d="M 72 75 L 72 15"
              fill="none"
              stroke="#f87171"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Ring Finger (extended) */}
            <path
              d="M 92 76 L 94 25"
              fill="none"
              stroke="#f87171"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Pinky (extended right) */}
            <path
              d="M 112 82 L 118 42"
              fill="none"
              stroke="#f87171"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Palm Center Reactor Glow */}
            <circle cx="80" cy="115" r="18" fill="url(#glow-palm)" />
            <circle cx="80" cy="115" r="5" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />

            {/* Fingertip target nodes */}
            {[{ x: 18, y: 70 }, { x: 50, y: 25 }, { x: 72, y: 15 }, { x: 94, y: 25 }, { x: 118, y: 42 }].map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r="4" fill="#ef4444" />
                <circle cx={pt.x} cy={pt.y} r="8" fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="2 2" />
              </g>
            ))}
          </svg>
        );

      case 'FIST':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full">
            <defs>
              <radialGradient id="glow-fist" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Tight Fist Body */}
            <rect x="42" y="55" width="76" height="85" rx="16" fill="#1b120f" stroke="#f97316" strokeWidth="2.5" />
            {/* Clenched Knuckle Arcs */}
            <path d="M 44 80 Q 60 72 76 80 Q 94 72 116 80" fill="none" stroke="#fb923c" strokeWidth="2.5" />
            <path d="M 46 102 Q 62 95 78 102 Q 96 95 114 102" fill="none" stroke="#fb923c" strokeWidth="2" strokeDasharray="3 2" />
            {/* Thumb wrapped horizontally across fingers */}
            <path
              d="M 32 108 C 30 85, 45 80, 85 85 C 98 86, 105 92, 102 100 C 98 108, 65 106, 42 120"
              fill="#2c1a14"
              stroke="#fb923c"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Clench Core Energy Ring */}
            <circle cx="80" cy="98" r="14" fill="url(#glow-fist)" />
            <circle cx="80" cy="98" r="4" fill="#ffffff" stroke="#f97316" strokeWidth="2" />
          </svg>
        );

      case 'VICTORY_PEACE':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full">
            <defs>
              <radialGradient id="glow-peace" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Folded Palm Base */}
            <path
              d="M 52 145 C 52 158, 108 158, 108 145 C 116 125, 118 95, 108 85 C 98 80, 60 80, 52 85 Z"
              fill="#0d1b15"
              stroke="#10b981"
              strokeWidth="2"
            />
            {/* Index Finger (angled left) */}
            <path
              d="M 68 85 L 50 20"
              fill="none"
              stroke="#34d399"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Middle Finger (angled right) forming V */}
            <path
              d="M 88 85 L 105 20"
              fill="none"
              stroke="#34d399"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Ring and Pinky curled down */}
            <path d="M 94 90 C 114 92, 114 115, 96 118" fill="none" stroke="#059669" strokeWidth="3" />
            {/* Thumb curled over folded fingers */}
            <path d="M 42 110 C 40 92, 75 92, 85 105" fill="none" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />

            {/* Target V-tips */}
            <circle cx="50" cy="20" r="4" fill="#10b981" />
            <circle cx="105" cy="20" r="4" fill="#10b981" />
            <circle cx="50" cy="20" r="8" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="105" cy="20" r="8" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />

            <circle cx="80" cy="115" r="12" fill="url(#glow-peace)" />
            <circle cx="80" cy="115" r="3.5" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
          </svg>
        );

      case 'POINT_INDEX':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full">
            <defs>
              <radialGradient id="glow-point" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Folded Palm Base */}
            <rect x="50" y="80" width="60" height="65" rx="14" fill="#081820" stroke="#06b6d4" strokeWidth="2" />
            {/* Tall Single Index Finger Extended Upward */}
            <path
              d="M 68 85 L 68 18"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Target Reticle at fingertip */}
            <circle cx="68" cy="18" r="4" fill="#06b6d4" />
            <circle cx="68" cy="18" r="9" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="56" y1="18" x2="80" y2="18" stroke="#22d3ee" strokeWidth="1" />
            <line x1="68" y1="6" x2="68" y2="30" stroke="#22d3ee" strokeWidth="1" />

            {/* Middle, ring, pinky folded in knuckles */}
            <path d="M 82 86 C 100 86, 102 108, 86 112" fill="none" stroke="#0891b2" strokeWidth="3" />
            <path d="M 40 108 C 40 92, 70 95, 80 110" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />

            <circle cx="78" cy="115" r="12" fill="url(#glow-point)" />
            <circle cx="78" cy="115" r="3.5" fill="#ffffff" stroke="#06b6d4" strokeWidth="1.5" />
          </svg>
        );

      case 'THUMBS_UP':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full">
            <defs>
              <radialGradient id="glow-thumb" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Clenched horizontal fingers */}
            <rect x="58" y="75" width="62" height="65" rx="12" fill="#1e180a" stroke="#eab308" strokeWidth="2" />
            {/* Knuckle folds */}
            <line x1="62" y1="94" x2="114" y2="94" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3 2" />
            <line x1="62" y1="114" x2="114" y2="114" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3 2" />

            {/* Thumb extending vertical straight up */}
            <path
              d="M 58 110 C 46 100, 48 40, 52 20 C 55 12, 68 12, 70 24 C 74 44, 76 75, 78 85"
              fill="#2b230f"
              stroke="#facc15"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Thumb tip node */}
            <circle cx="61" cy="18" r="4" fill="#eab308" />
            <circle cx="61" cy="18" r="8" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="2 2" />

            <circle cx="85" cy="105" r="12" fill="url(#glow-thumb)" />
            <circle cx="85" cy="105" r="3.5" fill="#ffffff" stroke="#eab308" strokeWidth="1.5" />
          </svg>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
            SELECT A GESTURE TEMPLATE
          </div>
        );
    }
  };

  const getPoseTips = (type: GestureType): string[] => {
    switch (type) {
      case 'OPEN_PALM':
        return [
          'Extend all 5 fingers fully outward facing the lens.',
          'Maintain 0.5m to 1.2m distance from the camera.',
          'Keep fingers separated with maximum geometric spread.',
        ];
      case 'FIST':
        return [
          'Clench fingers into a tight, consolidated block.',
          'Wrap thumb across index and middle knuckles.',
          'Minimizes silhouette contour and triggers airgap security.',
        ];
      case 'VICTORY_PEACE':
        return [
          'Extend index and middle fingers in an open 45° V-shape.',
          'Keep thumb folded tightly over ring and pinky fingers.',
          'Distinct dual vertical protrusion confirms nominal status.',
        ];
      case 'POINT_INDEX':
        return [
          'Extend index finger vertically toward ceiling.',
          'Fold thumb, middle, ring, and pinky into palm.',
          'Calibrates directional vector pointing and directive listening.',
        ];
      case 'THUMBS_UP':
        return [
          'Point thumb directly vertical with folded knuckles.',
          'Keep wrist aligned perpendicular to optical axis.',
          'High aspect-ratio vertical thumb triggers positive execution.',
        ];
      default:
        return ['Position hand within optical bounding reticle.'];
    }
  };

  return (
    <div className={`flex flex-col bg-[#07090f] border border-zinc-800 p-3 rounded-xs ${className}`}>
      {/* Visual Guide Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
        <span className="text-[11px] font-bold text-zinc-200 tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          OPTICAL ANATOMY GUIDE
        </span>
        <span className="text-[9px] px-1.5 py-0.5 bg-red-950/60 border border-red-800/60 text-red-400 font-bold uppercase">
          {gestureType.replace('_', ' ')}
        </span>
      </div>

      {/* SVG Canvas Stage */}
      <div className="w-full h-44 bg-[#030408] border border-zinc-800/80 rounded-xs relative flex items-center justify-center overflow-hidden p-2">
        {/* Synthetic Tech Grid lines */}
        <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />

        {/* Alignment Crosshairs */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500/15" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-red-500/15" />

        {isTeachingActive && (
          <div className="absolute top-2 right-2 text-[9px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 border border-red-500/80 animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            SYNAPTIC RECORDING ACTIVE
          </div>
        )}

        <div className="w-36 h-36 relative z-10">{renderHandIllustration()}</div>
      </div>

      {/* Anatomical Calibration Checklist */}
      <div className="mt-3 space-y-1.5">
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
          OPTICAL RECOGNITION CRITERIA:
        </span>
        <ul className="space-y-1 text-[10px] text-zinc-300">
          {getPoseTips(gestureType).map((tip, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-red-400 font-bold mt-0.5">›</span>
              <span className="text-zinc-300">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
