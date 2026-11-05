/**
 * NeuralRing Component
 * High-quality, multi-layered animated neural network ring system built with Framer Motion and SVG.
 *
 * Features:
 * - Multiple rotating concentric layers (Outer Synaptic Ring, Data Conduits Ring,
 *   Pulsing Node Constellation, Inner Quantization Ring, Core Energy Reticle)
 * - Dynamic pulsation, acceleration, and chromatic luminescence synced with AI States:
 *   - 'THINKING': High-frequency rotational acceleration, synaptic beam propagation, amber-orange flare, individual pulsing nodes
 *   - 'EXECUTING': Maximum orbital spin, high-intensity crimson flare, rapid node ripple waves
 *   - 'SECURITY_ALERT': Alarm strobe, rapid reverse orbit, high-contrast crimson spikes
 *   - 'SUCCESS': Emerald harmonic stabilization
 *   - 'IDLE' / 'LISTENING' / 'SPEAKING': Rhythmic breathing orbit and subtle bio-mechanical drift
 */

import React from 'react';
import { motion } from 'motion/react';
import { AIStateMode } from '../../types/index.ts';

interface NeuralRingProps {
  state: AIStateMode;
  className?: string;
  size?: number;
}

export const NeuralRing: React.FC<NeuralRingProps> = ({
  state,
  className = '',
  size = 560,
}) => {
  const isThinking = state === 'THINKING';
  const isExecuting = state === 'EXECUTING';
  const isAlert = state === 'SECURITY_ALERT' || state === 'ERROR';
  const isSuccess = state === 'SUCCESS';
  const isActive = isThinking || isExecuting || isAlert;

  // Speed and dynamics depending on AI state
  const outerDuration = isExecuting ? 10 : isThinking ? 16 : 45;
  const middleDuration = isExecuting ? 7 : isThinking ? 12 : 32;
  const innerDuration = isExecuting ? 5 : isThinking ? 8 : 22;
  const pulseDuration = isExecuting ? 0.65 : isThinking ? 1.0 : 2.8;

  // Palette selection
  const primaryColor = isAlert
    ? '#ef4444'
    : isSuccess
    ? '#10b981'
    : isThinking
    ? '#f97316'
    : '#dc2626';

  const secondaryColor = isAlert
    ? '#ff7878'
    : isSuccess
    ? '#34d399'
    : isThinking
    ? '#fb923c'
    : '#ef4444';

  const glowRgba = isAlert
    ? 'rgba(239, 68, 68, 0.45)'
    : isSuccess
    ? 'rgba(16, 185, 129, 0.4)'
    : isThinking
    ? 'rgba(249, 115, 22, 0.45)'
    : 'rgba(220, 38, 38, 0.28)';

  // Procedural node coordinates for 3 concentric tiers
  // Outer layer: 12 nodes
  const outerNodes = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const r = 240;
    return {
      x: 280 + r * Math.cos(angle),
      y: 280 + r * Math.sin(angle),
      angle: (i / 12) * 360,
      size: i % 3 === 0 ? 4.5 : 3,
      delay: (i * 0.12) % 1.5,
    };
  });

  // Mid neural layer: 8 synaptic cluster nodes
  const midNodes = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const r = 180;
    return {
      x: 280 + r * Math.cos(angle),
      y: 280 + r * Math.sin(angle),
      angle: (i / 8) * 360 + 22.5,
      size: i % 2 === 0 ? 5 : 3.5,
      delay: (i * 0.15) % 1.2,
    };
  });

  // Inner core synaptic ring: 6 dense nodes
  const innerNodes = Array.from({ length: 6 }).map((_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const r = 120;
    return {
      x: 280 + r * Math.cos(angle),
      y: 280 + r * Math.sin(angle),
      angle: (i / 6) * 360,
      size: 4,
      delay: (i * 0.2) % 1.0,
    };
  });

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden ${className}`}
      style={{ filter: 'drop-shadow(0 0 16px rgba(0,0,0,0.8))' }}
    >
      {/* 1. Deep Core Ambient Aura with State Synced Breathing */}
      <motion.div
        animate={{
          scale: isExecuting ? [1, 1.15, 1] : isThinking ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: isExecuting ? [0.45, 0.8, 0.45] : isThinking ? [0.4, 0.7, 0.4] : [0.25, 0.4, 0.25],
        }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          background: `radial-gradient(circle, ${glowRgba} 0%, rgba(220, 38, 38, 0.08) 45%, rgba(0, 0, 0, 0) 70%)`,
        }}
      />

      {/* 2. SVG Multi-Layered Rotating Neural Matrix */}
      <svg
        viewBox="0 0 560 560"
        className="w-full h-full max-w-[560px] max-h-[560px] overflow-visible"
      >
        <defs>
          <filter id="neural-neon-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ========================================================
            LAYER 1: OUTER SEGMENTED SYNAPTIC RING (Clockwise Orbit)
            ======================================================== */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: outerDuration, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '280px', originY: '280px' }}
        >
          {/* Outer Boundary Dash Ring */}
          <circle
            cx="280"
            cy="280"
            r="254"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.2"
            strokeDasharray="16 10 4 10"
            strokeOpacity={isActive ? 0.75 : 0.35}
          />
          <circle
            cx="280"
            cy="280"
            r="248"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeDasharray="2 4"
            strokeOpacity="0.25"
          />

          {/* Precision Cardinal HUD Tech Brackets */}
          {[0, 90, 180, 270].map((deg) => (
            <g key={`cardinal-${deg}`} transform={`rotate(${deg} 280 280)`}>
              <path
                d="M 280 18 L 292 30 L 292 40 L 280 32 L 268 40 L 268 30 Z"
                fill={primaryColor}
                opacity={isActive ? 0.9 : 0.5}
              />
              <line x1="280" y1="26" x2="280" y2="48" stroke={secondaryColor} strokeWidth="1.5" />
            </g>
          ))}

          {/* 12 Outer Nodes & Synaptic Arc Segment Links */}
          {outerNodes.map((node, i) => (
            <g key={`outer-node-${i}`}>
              {/* Radial spoke connector to center */}
              <line
                x1="280"
                y1="280"
                x2={node.x}
                y2={node.y}
                stroke={primaryColor}
                strokeWidth={i % 2 === 0 ? '0.6' : '0.3'}
                strokeDasharray="4 8"
                strokeOpacity={isThinking || isExecuting ? '0.4' : '0.12'}
              />

              {/* Node Outer Orbit Ring with pulsating expansion when THINKING or EXECUTING */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size * 2}
                fill="none"
                stroke={primaryColor}
                strokeWidth="0.8"
                animate={
                  isThinking || isExecuting
                    ? {
                        r: [node.size * 1.6, node.size * 2.8, node.size * 1.6],
                        opacity: [0.3, 0.9, 0.3],
                      }
                    : { r: node.size * 2, opacity: isActive ? 0.6 : 0.25 }
                }
                transition={{
                  duration: pulseDuration,
                  repeat: Infinity,
                  delay: node.delay,
                  ease: 'easeInOut',
                }}
              />

              {/* Core Node with Pulsing Scale & Luminosity */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill={secondaryColor}
                filter="url(#neural-neon-glow)"
                animate={
                  isThinking || isExecuting
                    ? {
                        scale: [1, 1.45, 1],
                        opacity: [0.7, 1, 0.7],
                      }
                    : { scale: 1, opacity: 0.85 }
                }
                transition={{
                  duration: pulseDuration,
                  repeat: Infinity,
                  delay: node.delay,
                  ease: 'easeInOut',
                }}
                style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
              />
            </g>
          ))}
        </motion.g>

        {/* ========================================================
            LAYER 2: DATA BUS & ANGULAR DIAL RING (Counter-Clockwise Orbit)
            ======================================================== */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: middleDuration, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '280px', originY: '280px' }}
        >
          {/* Segmented Middle Ring Track */}
          <circle
            cx="280"
            cy="280"
            r="195"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
            strokeDasharray="45 18 10 18"
            strokeOpacity={isActive ? 0.8 : 0.4}
            filter="url(#neural-neon-glow)"
          />
          <circle
            cx="280"
            cy="280"
            r="185"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.6"
            strokeDasharray="6 8"
            strokeOpacity="0.3"
          />

          {/* Calibrated Degree Ticks & Binary Identifiers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <g key={`tick-${deg}`} transform={`rotate(${deg} 280 280)`}>
              <line
                x1="280"
                y1="82"
                x2="280"
                y2="94"
                stroke={deg % 90 === 0 ? secondaryColor : primaryColor}
                strokeWidth={deg % 90 === 0 ? '2' : '1'}
                strokeOpacity={deg % 90 === 0 ? 0.9 : 0.5}
              />
              {deg % 90 === 0 && (
                <text
                  x="284"
                  y="92"
                  fontSize="7"
                  fontFamily="monospace"
                  fill={secondaryColor}
                  opacity="0.8"
                  letterSpacing="1"
                >
                  {(deg).toString().padStart(3, '0')}°
                </text>
              )}
            </g>
          ))}

          {/* 8 Mid Cluster Synapse Nodes with Synaptic Beams */}
          {midNodes.map((node, i) => {
            const nextNode = midNodes[(i + 1) % midNodes.length];
            return (
              <g key={`mid-node-${i}`}>
                {/* Inter-node perimeter synaptic conduit */}
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={nextNode.x}
                  y2={nextNode.y}
                  stroke={primaryColor}
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  strokeOpacity={isThinking || isExecuting ? '0.7' : '0.25'}
                />

                {/* Pulsing Synapse Diamond Anchor */}
                <motion.rect
                  x={node.x - node.size}
                  y={node.y - node.size}
                  width={node.size * 2}
                  height={node.size * 2}
                  fill={secondaryColor}
                  transform={`rotate(45 ${node.x} ${node.y})`}
                  filter="url(#neural-neon-glow)"
                  animate={
                    isThinking || isExecuting
                      ? {
                          scale: [1, 1.4, 1],
                          opacity: [0.65, 1, 0.65],
                        }
                      : { scale: 1, opacity: isActive ? 0.95 : 0.6 }
                  }
                  transition={{
                    duration: pulseDuration,
                    repeat: Infinity,
                    delay: node.delay,
                    ease: 'easeInOut',
                  }}
                  style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
                />
              </g>
            );
          })}
        </motion.g>

        {/* ========================================================
            LAYER 3: FAST INNER SYNAPSE ROTATION (Clockwise Acceleration)
            ======================================================== */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: innerDuration, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '280px', originY: '280px' }}
        >
          {/* Inner Quantization Rail */}
          <circle
            cx="280"
            cy="280"
            r="130"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
            strokeDasharray="24 16"
            strokeOpacity={isActive ? 0.85 : 0.45}
          />
          <circle
            cx="280"
            cy="280"
            r="118"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="0.8"
            strokeDasharray="3 6"
            strokeOpacity="0.35"
          />

          {/* 6 Core Neural Nodes with High Frequency Pulse */}
          {innerNodes.map((node, i) => (
            <g key={`inner-node-${i}`}>
              <line
                x1="280"
                y1="280"
                x2={node.x}
                y2={node.y}
                stroke={secondaryColor}
                strokeWidth="0.8"
                strokeOpacity={isActive ? 0.6 : 0.2}
              />
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill={secondaryColor}
                filter="url(#neural-neon-glow)"
                animate={
                  isThinking || isExecuting
                    ? {
                        scale: [1, 1.6, 1],
                        opacity: [0.6, 1, 0.6],
                      }
                    : { scale: 1, opacity: 0.8 }
                }
                transition={{
                  duration: pulseDuration * 0.8,
                  repeat: Infinity,
                  delay: node.delay,
                  ease: 'easeInOut',
                }}
                style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
              />
            </g>
          ))}

          {/* Inner Tech Crosshairs */}
          <line x1="280" y1="156" x2="280" y2="170" stroke={secondaryColor} strokeWidth="1.5" />
          <line x1="280" y1="390" x2="280" y2="404" stroke={secondaryColor} strokeWidth="1.5" />
          <line x1="156" y1="280" x2="170" y2="280" stroke={secondaryColor} strokeWidth="1.5" />
          <line x1="390" y1="280" x2="404" y2="280" stroke={secondaryColor} strokeWidth="1.5" />
        </motion.g>

        {/* ========================================================
            LAYER 4: SYNCHRONIZED RADIAL PULSE WAVES (Thinking & Executing)
            ======================================================== */}
        {(isThinking || isExecuting || isAlert) && (
          <g>
            {/* Outward Expanding Wave 1 */}
            <motion.circle
              cx="280"
              cy="280"
              r="70"
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              initial={{ r: 60, opacity: 0.9 }}
              animate={{ r: [60, 245], opacity: [0.85, 0] }}
              transition={{
                duration: isExecuting ? 1.0 : 1.6,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />

            {/* Outward Expanding Wave 2 (Phase Delayed) */}
            <motion.circle
              cx="280"
              cy="280"
              r="70"
              fill="none"
              stroke={primaryColor}
              strokeWidth="1.5"
              initial={{ r: 60, opacity: 0.9 }}
              animate={{ r: [60, 245], opacity: [0.75, 0] }}
              transition={{
                duration: isExecuting ? 1.0 : 1.6,
                delay: isExecuting ? 0.5 : 0.8,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </g>
        )}

        {/* ========================================================
            LAYER 5: STATIC HUD CORNER TICKS & VECTOR LABELS
            ======================================================== */}
        <g className="font-mono text-[8px] select-none" fill={primaryColor} opacity={isActive ? '0.75' : '0.4'}>
          <text x="286" y="24">SYS.RADIAL // 384-DIM</text>
          <text x="286" y="546">SYNAPSE RING v2.4</text>
          <text x="18" y="278" textAnchor="start">TENSOR_VEC</text>
          <text x="542" y="278" textAnchor="end">LATENCY: 1.2ms</text>
        </g>
      </svg>
    </div>
  );
};
