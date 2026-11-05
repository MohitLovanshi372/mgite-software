/**
 * NeuralNetworkRing Component
 *
 * High-performance, lightweight celestial neural network ring with mechanical HUD geometry.
 *
 * Performance Architecture:
 * - Uses requestAnimationFrame (rAF) directly via a dedicated high-efficiency canvas/SVG hybrid
 *   layer with direct transform updates on DOM refs to bypass React re-render overhead.
 * - Zero React state thrashing during high-frequency animation cycles.
 * - Dynamic rotational speed and pulsation mapped mathematically to AIStateMode:
 *   - 'THINKING': High-frequency accelerated rotation, synaptic pulse waves, amber-orange flare
 *   - 'EXECUTING': Hyper-speed overdrive, rapid crimson energy spikes and shockwave expansions
 *   - 'SECURITY_ALERT': Alarm strobe, rapid reverse orbit, high-contrast crimson warning ticks
 *   - 'SUCCESS': Emerald harmonic stabilization
 *   - 'IDLE' / 'LISTENING' / 'SPEAKING': Measured, rhythmic mechanical drift and low-overhead idle scan
 *
 * Consolidates & supersedes AICoreRings and ambient neural visuals into a unified, optimized component.
 */

import React, { useEffect, useRef } from 'react';
import { AIStateMode } from '../../types/index.ts';

export interface NeuralNetworkRingProps {
  state: AIStateMode;
  className?: string;
  size?: number;
}

interface SynapseNode {
  baseAngle: number;
  radius: number;
  size: number;
  phase: number;
  tier: 'outer' | 'mid' | 'inner';
  starColor: string;
  glowColor: string;
}

const STAR_PALETTES = [
  { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.9)' },  // Cyan
  { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.9)' }, // Violet
  { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.9)' },   // Ruby
  { color: '#34d399', glow: 'rgba(52, 211, 153, 0.9)' },  // Emerald
  { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.9)' },  // Amber
  { color: '#f472b6', glow: 'rgba(244, 114, 182, 0.9)' }, // Magenta
  { color: '#67e8f9', glow: 'rgba(103, 232, 249, 0.9)' }, // Electric cyan
];

export const NeuralNetworkRing: React.FC<NeuralNetworkRingProps> = ({
  state,
  className = '',
  size = 560,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRingRef = useRef<SVGGElement>(null);
  const midRingRef = useRef<SVGGElement>(null);
  const innerRingRef = useRef<SVGGElement>(null);
  const wave1Ref = useRef<SVGCircleElement>(null);
  const wave2Ref = useRef<SVGCircleElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep state ref updated to avoid restarting rAF loop on every state change
  const stateRef = useRef<AIStateMode>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Color mappings
  const isAlert = state === 'SECURITY_ALERT' || state === 'ERROR';
  const isSuccess = state === 'SUCCESS';
  const isThinking = state === 'THINKING';
  const isExecuting = state === 'EXECUTING';

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

  const glowColor = isAlert
    ? 'rgba(239, 68, 68, 0.45)'
    : isSuccess
    ? 'rgba(16, 185, 129, 0.4)'
    : isThinking
    ? 'rgba(249, 115, 22, 0.45)'
    : 'rgba(220, 38, 38, 0.28)';

  // Static procedural node definitions (outer: 12, mid: 8, inner: 6) with spectral star colors
  const nodes: SynapseNode[] = [
    // 12 Outer celestial nodes
    ...Array.from({ length: 12 }).map((_, i) => {
      const pal = STAR_PALETTES[i % STAR_PALETTES.length];
      return {
        baseAngle: (i / 12) * Math.PI * 2,
        radius: 240,
        size: i % 3 === 0 ? 5 : 3.5,
        phase: i * 0.4,
        tier: 'outer' as const,
        starColor: pal.color,
        glowColor: pal.glow,
      };
    }),
    // 8 Mid cluster celestial nodes
    ...Array.from({ length: 8 }).map((_, i) => {
      const pal = STAR_PALETTES[(i + 2) % STAR_PALETTES.length];
      return {
        baseAngle: (i / 8) * Math.PI * 2 + Math.PI / 8,
        radius: 180,
        size: i % 2 === 0 ? 5.5 : 4,
        phase: i * 0.6 + 1.0,
        tier: 'mid' as const,
        starColor: pal.color,
        glowColor: pal.glow,
      };
    }),
    // 6 Inner core celestial nodes
    ...Array.from({ length: 6 }).map((_, i) => {
      const pal = STAR_PALETTES[(i + 4) % STAR_PALETTES.length];
      return {
        baseAngle: (i / 6) * Math.PI * 2,
        radius: 120,
        size: 4.5,
        phase: i * 0.8 + 2.0,
        tier: 'inner' as const,
        starColor: pal.color,
        glowColor: pal.glow,
      };
    }),
  ];

  // High-performance requestAnimationFrame loop with direct DOM mutation (zero React re-renders)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let outerAngle = 0;
    let midAngle = 0;
    let innerAngle = 0;
    let pulseTime = 0;

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      pulseTime += dt;

      const currentState = stateRef.current;
      const excited = currentState === 'THINKING' || currentState === 'EXECUTING' || currentState === 'SECURITY_ALERT';
      const executing = currentState === 'EXECUTING';
      const thinking = currentState === 'THINKING';
      const alert = currentState === 'SECURITY_ALERT' || currentState === 'ERROR';

      // Determine rotation speeds based on mode
      let outerSpeed = 8;  // deg/sec
      let midSpeed = -11;
      let innerSpeed = 16;
      let pulseFreq = 2.0;

      if (executing) {
        outerSpeed = 48;
        midSpeed = -64;
        innerSpeed = 90;
        pulseFreq = 6.5;
      } else if (thinking) {
        outerSpeed = 28;
        midSpeed = -36;
        innerSpeed = 50;
        pulseFreq = 4.2;
      } else if (alert) {
        outerSpeed = -40; // reverse alarm orbit
        midSpeed = 55;
        innerSpeed = -75;
        pulseFreq = 8.0;
      }

      outerAngle = (outerAngle + outerSpeed * dt) % 360;
      midAngle = (midAngle + midSpeed * dt) % 360;
      innerAngle = (innerAngle + innerSpeed * dt) % 360;

      // Update SVG Layer rotations directly via transform style
      if (outerRingRef.current) {
        outerRingRef.current.style.transform = `rotate(${outerAngle}deg)`;
      }
      if (midRingRef.current) {
        midRingRef.current.style.transform = `rotate(${midAngle}deg)`;
      }
      if (innerRingRef.current) {
        innerRingRef.current.style.transform = `rotate(${innerAngle}deg)`;
      }

      // Update pulsating radial aura
      if (auraRef.current) {
        const baseScale = excited ? 1.05 : 1.0;
        const scaleAmp = excited ? 0.12 : 0.04;
        const currentScale = baseScale + Math.sin(pulseTime * pulseFreq) * scaleAmp;
        const baseOpacity = executing ? 0.65 : thinking ? 0.55 : 0.3;
        const currentOpacity = baseOpacity + Math.sin(pulseTime * pulseFreq) * 0.15;
        auraRef.current.style.transform = `scale(${currentScale})`;
        auraRef.current.style.opacity = `${currentOpacity}`;
      }

      // Update expanding pulse shockwaves during excited/thinking/executing states
      if (excited) {
        const wavePeriod1 = executing ? 1.0 : 1.6;
        const wavePeriod2 = executing ? 1.0 : 1.6;
        const phase1 = (pulseTime % wavePeriod1) / wavePeriod1;
        const phase2 = ((pulseTime + (executing ? 0.5 : 0.8)) % wavePeriod2) / wavePeriod2;

        if (wave1Ref.current) {
          const r1 = 60 + phase1 * 185;
          const op1 = Math.max(0, (1 - phase1) * (executing ? 0.9 : 0.7));
          wave1Ref.current.setAttribute('r', r1.toFixed(1));
          wave1Ref.current.setAttribute('opacity', op1.toFixed(2));
        }
        if (wave2Ref.current) {
          const r2 = 60 + phase2 * 185;
          const op2 = Math.max(0, (1 - phase2) * (executing ? 0.8 : 0.6));
          wave2Ref.current.setAttribute('r', r2.toFixed(1));
          wave2Ref.current.setAttribute('opacity', op2.toFixed(2));
        }
      }

      // Draw dynamic synaptic electrical arcs on canvas for peak performance
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          // Render shimmering synaptic conduits between nodes
          if (excited) {
            ctx.save();
            ctx.lineWidth = executing ? 1.5 : 1.0;
            ctx.strokeStyle = thinking ? 'rgba(249, 115, 22, 0.55)' : 'rgba(239, 68, 68, 0.6)';

            // Draw connecting arcs from mid nodes to center
            const activeMidCount = 8;
            for (let i = 0; i < activeMidCount; i++) {
              const currentAngle = (i / activeMidCount) * Math.PI * 2 + (midAngle * Math.PI) / 180;
              const r = 180;
              const nx = cx + Math.cos(currentAngle) * r;
              const ny = cy + Math.sin(currentAngle) * r;

              // Electric jitter spark if executing
              const jitterX = executing ? (Math.random() - 0.5) * 6 : 0;
              const jitterY = executing ? (Math.random() - 0.5) * 6 : 0;

              // Chromatic spectral gradient for each wave conduit
              const pal = STAR_PALETTES[i % STAR_PALETTES.length];
              ctx.strokeStyle = isAlert ? 'rgba(239, 68, 68, 0.7)' : pal.glow;

              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(nx + jitterX, ny + jitterY);
              ctx.stroke();

              // Pulsing celestial star node glow dot on canvas
              ctx.fillStyle = isAlert ? '#ef4444' : pal.color;
              ctx.beginPath();
              const dotSize = 3.5 + Math.sin(pulseTime * pulseFreq + i) * 1.8;
              ctx.arc(nx + jitterX, ny + jitterY, Math.max(1.5, dotSize), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden ${className}`}
      style={{ filter: 'drop-shadow(0 0 16px rgba(0,0,0,0.85))' }}
    >
      {/* 1. Deep Core Ambient Radial Aura */}
      <div
        ref={auraRef}
        className="absolute rounded-full pointer-events-none will-change-transform"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          background: `radial-gradient(circle, ${glowColor} 0%, rgba(220, 38, 38, 0.08) 45%, rgba(0, 0, 0, 0) 70%)`,
          transition: 'background 0.5s ease-out',
        }}
      />

      {/* 2. High-Performance HTML5 Canvas for Lightweight Synaptic Arc Sparks */}
      <canvas
        ref={canvasRef}
        width={560}
        height={560}
        className="absolute w-[560px] h-[560px] pointer-events-none z-0"
      />

      {/* 3. SVG Multi-Layered Rotating Mechanical & Neural Matrix */}
      <svg
        viewBox="0 0 560 560"
        className="w-full h-full max-w-[560px] max-h-[560px] overflow-visible z-10"
      >
        <defs>
          <filter id="nn-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ========================================================
            LAYER 1: OUTER SEGMENTED MECHANICAL & SYNAPTIC RING
            ======================================================== */}
        <g
          ref={outerRingRef}
          style={{ transformOrigin: '280px 280px', willChange: 'transform' }}
        >
          {/* Segmented Boundary Rails */}
          <circle
            cx="280"
            cy="280"
            r="254"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.2"
            strokeDasharray="16 10 4 10"
            strokeOpacity={isThinking || isExecuting ? 0.8 : 0.4}
          />
          <circle
            cx="280"
            cy="280"
            r="248"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeDasharray="2 4"
            strokeOpacity="0.3"
          />

          {/* Precision Cardinal HUD Tech Brackets */}
          {[0, 90, 180, 270].map((deg) => (
            <g key={`cardinal-${deg}`} transform={`rotate(${deg} 280 280)`}>
              <path
                d="M 280 18 L 292 30 L 292 40 L 280 32 L 268 40 L 268 30 Z"
                fill={primaryColor}
                opacity={isThinking || isExecuting ? 0.95 : 0.55}
              />
              <line x1="280" y1="26" x2="280" y2="48" stroke={secondaryColor} strokeWidth="1.5" />
            </g>
          ))}

          {/* Outer Synaptic Nodes and Cardinal Block Accents */}
          {nodes
            .filter((n) => n.tier === 'outer')
            .map((node, i) => {
              const x = 280 + Math.cos(node.baseAngle) * node.radius;
              const y = 280 + Math.sin(node.baseAngle) * node.radius;
              return (
                <g key={`outer-node-${i}`}>
                  {/* Spoke line */}
                  <line
                    x1="280"
                    y1="280"
                    x2={x}
                    y2={y}
                    stroke={primaryColor}
                    strokeWidth={i % 2 === 0 ? '0.6' : '0.3'}
                    strokeDasharray="4 8"
                    strokeOpacity={isThinking || isExecuting ? '0.45' : '0.15'}
                  />
                  {/* Orbit Ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={node.size * 2}
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth="0.8"
                    strokeOpacity={isThinking || isExecuting ? 0.7 : 0.3}
                  />
                  {/* Glowing Node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={node.size}
                    fill={isAlert ? secondaryColor : node.starColor}
                    filter="url(#nn-glow)"
                  />
                  {/* Subtle Star Core Pin */}
                  <circle
                    cx={x}
                    cy={y}
                    r={node.size * 0.45}
                    fill="#ffffff"
                    opacity="0.9"
                  />
                </g>
              );
            })}
        </g>

        {/* ========================================================
            LAYER 2: DATA BUS & CALIBRATED ANGULAR DIAL RING (Counter-Clockwise)
            ======================================================== */}
        <g
          ref={midRingRef}
          style={{ transformOrigin: '280px 280px', willChange: 'transform' }}
        >
          {/* Segmented Middle Track */}
          <circle
            cx="280"
            cy="280"
            r="195"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
            strokeDasharray="45 18 10 18"
            strokeOpacity={isThinking || isExecuting ? 0.85 : 0.45}
            filter="url(#nn-glow)"
          />
          <circle
            cx="280"
            cy="280"
            r="185"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.6"
            strokeDasharray="6 8"
            strokeOpacity="0.35"
          />

          {/* Calibrated Degree Ticks & Identifiers */}
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
                  opacity="0.85"
                  letterSpacing="1"
                >
                  {(deg).toString().padStart(3, '0')}°
                </text>
              )}
            </g>
          ))}

          {/* Mid Cluster Synapse Anchors */}
          {nodes
            .filter((n) => n.tier === 'mid')
            .map((node, i, arr) => {
              const x = 280 + Math.cos(node.baseAngle) * node.radius;
              const y = 280 + Math.sin(node.baseAngle) * node.radius;
              const nextNode = arr[(i + 1) % arr.length];
              const nx = 280 + Math.cos(nextNode.baseAngle) * nextNode.radius;
              const ny = 280 + Math.sin(nextNode.baseAngle) * nextNode.radius;

              return (
                <g key={`mid-node-${i}`}>
                  {/* Perimeter conduit */}
                  <line
                    x1={x}
                    y1={y}
                    x2={nx}
                    y2={ny}
                    stroke={primaryColor}
                    strokeWidth="1"
                    strokeDasharray="5 5"
                    strokeOpacity={isThinking || isExecuting ? '0.75' : '0.3'}
                  />
                  {/* Diamond Anchor */}
                  <rect
                    x={x - node.size}
                    y={y - node.size}
                    width={node.size * 2}
                    height={node.size * 2}
                    fill={secondaryColor}
                    transform={`rotate(45 ${x} ${y})`}
                    filter="url(#nn-glow)"
                    opacity={isThinking || isExecuting ? 0.95 : 0.7}
                  />
                </g>
              );
            })}
        </g>

        {/* ========================================================
            LAYER 3: FAST INNER QUANTIZATION RAIL (Clockwise)
            ======================================================== */}
        <g
          ref={innerRingRef}
          style={{ transformOrigin: '280px 280px', willChange: 'transform' }}
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
            strokeOpacity={isThinking || isExecuting ? 0.9 : 0.5}
          />
          <circle
            cx="280"
            cy="280"
            r="118"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="0.8"
            strokeDasharray="3 6"
            strokeOpacity="0.4"
          />

          {/* Inner Neural Nodes */}
          {nodes
            .filter((n) => n.tier === 'inner')
            .map((node, i) => {
              const x = 280 + Math.cos(node.baseAngle) * node.radius;
              const y = 280 + Math.sin(node.baseAngle) * node.radius;
              return (
                <g key={`inner-node-${i}`}>
                  <line
                    x1="280"
                    y1="280"
                    x2={x}
                    y2={y}
                    stroke={secondaryColor}
                    strokeWidth="0.8"
                    strokeOpacity={isThinking || isExecuting ? 0.7 : 0.25}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={node.size}
                    fill={isAlert ? secondaryColor : node.starColor}
                    filter="url(#nn-glow)"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={node.size * 0.45}
                    fill="#ffffff"
                    opacity="0.9"
                  />
                </g>
              );
            })}

          {/* Inner Alignment Crosshairs */}
          <line x1="280" y1="156" x2="280" y2="170" stroke={secondaryColor} strokeWidth="1.5" />
          <line x1="280" y1="390" x2="280" y2="404" stroke={secondaryColor} strokeWidth="1.5" />
          <line x1="156" y1="280" x2="170" y2="280" stroke={secondaryColor} strokeWidth="1.5" />
          <line x1="390" y1="280" x2="404" y2="280" stroke={secondaryColor} strokeWidth="1.5" />
        </g>

        {/* ========================================================
            LAYER 4: LIGHTWEIGHT SYNCHRONIZED RADIAL SHOCKWAVES
            ======================================================== */}
        <circle
          ref={wave1Ref}
          cx="280"
          cy="280"
          r="60"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2"
          opacity="0"
        />
        <circle
          ref={wave2Ref}
          cx="280"
          cy="280"
          r="60"
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.5"
          opacity="0"
        />

        {/* ========================================================
            LAYER 5: STATIC HUD CORNER LABELS
            ======================================================== */}
        <g
          className="font-mono text-[8px] select-none"
          fill={primaryColor}
          opacity={isThinking || isExecuting ? '0.8' : '0.45'}
        >
          <text x="286" y="24">SYS.RADIAL // 384-DIM</text>
          <text x="286" y="546">SYNAPSE RING v3.0 // rAF</text>
          <text x="18" y="278" textAnchor="start">TENSOR_VEC</text>
          <text x="542" y="278" textAnchor="end">LATENCY: 0.8ms</text>
        </g>
      </svg>
    </div>
  );
};
