/**
 * AINeuralNetwork Component
 *
 * Background celestial neural constellation with multicolored glowing star nodes
 * and chromatic neural network wave conduits (Space Star Theme).
 */

import React, { useEffect, useRef } from 'react';
import { AIStateMode } from '../../types/index.ts';

interface AINeuralNetworkProps {
  state: AIStateMode;
}

export const AINeuralNetwork: React.FC<AINeuralNetworkProps> = ({ state }) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<(SVGCircleElement | null)[]>([]);
  const stateRef = useRef<AIStateMode>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const starNodes = [
    { cx: '18%', cy: '25%', r: 3.5, phase: 0, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.8)' },   // Cyan star
    { cx: '82%', cy: '28%', r: 4.0, phase: 1.2, color: '#c084fc', glow: 'rgba(192, 132, 252, 0.8)' }, // Violet pulsar
    { cx: '50%', cy: '48%', r: 5.5, phase: 2.4, color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.9)' },   // Ruby core
    { cx: '28%', cy: '78%', r: 3.8, phase: 3.6, color: '#34d399', glow: 'rgba(52, 211, 153, 0.8)' }, // Emerald star
    { cx: '72%', cy: '76%', r: 4.2, phase: 4.8, color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.85)' }, // Solar amber
    { cx: '12%', cy: '52%', r: 3.0, phase: 1.8, color: '#f472b6', glow: 'rgba(244, 114, 182, 0.8)' }, // Magenta star
    { cx: '88%', cy: '54%', r: 3.2, phase: 3.0, color: '#67e8f9', glow: 'rgba(103, 232, 249, 0.8)' }, // Electric cyan
    { cx: '42%', cy: '20%', r: 2.5, phase: 0.8, color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.7)' }, // Nebula violet
    { cx: '58%', cy: '82%', r: 2.8, phase: 4.0, color: '#f87171', glow: 'rgba(248, 113, 113, 0.75)'}, // Rose star
  ];

  // requestAnimationFrame animation loop directly driving opacity, radius and color pulse
  useEffect(() => {
    let animId: number;
    let startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const currentState = stateRef.current;
      const isFast = currentState === 'THINKING' || currentState === 'EXECUTING';
      const isAlert = currentState === 'SECURITY_ALERT' || currentState === 'ERROR';

      const freq = isFast ? 5.0 : isAlert ? 6.5 : 2.2;

      nodesRef.current.forEach((nodeEl, idx) => {
        if (nodeEl) {
          const nodeData = starNodes[idx];
          const pulse = (Math.sin(elapsed * freq + nodeData.phase) + 1) / 2;
          const currentR = nodeData.r * (1 + pulse * (isFast ? 0.7 : 0.4));
          const opacity = 0.45 + pulse * 0.55;

          nodeEl.setAttribute('r', currentR.toFixed(1));
          nodeEl.setAttribute('opacity', opacity.toFixed(2));
          // If in security alert, tint toward red, otherwise preserve vibrant spectral star colors
          nodeEl.setAttribute('fill', isAlert ? '#ef4444' : nodeData.color);
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden">
      <svg ref={containerRef} className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wave-cyan-ruby" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="wave-emerald-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="wave-magenta-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.7" />
          </linearGradient>

          {/* Star Glow Filter */}
          <filter id="star-glow-fx" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Neural Network Spectral Wave Conduits */}
        <g strokeWidth="1" strokeDasharray="4 3" opacity="0.65">
          <line x1="18%" y1="25%" x2="50%" y2="48%" stroke="url(#wave-cyan-ruby)" />
          <line x1="82%" y1="28%" x2="50%" y2="48%" stroke="url(#wave-cyan-ruby)" />
          <line x1="28%" y1="78%" x2="50%" y2="48%" stroke="url(#wave-emerald-amber)" />
          <line x1="72%" y1="76%" x2="50%" y2="48%" stroke="url(#wave-emerald-amber)" />
          <line x1="12%" y1="52%" x2="28%" y2="78%" stroke="url(#wave-magenta-cyan)" />
          <line x1="88%" y1="54%" x2="72%" y2="76%" stroke="url(#wave-magenta-cyan)" />
          <line x1="42%" y1="20%" x2="18%" y2="25%" stroke="#a78bfa" opacity="0.5" />
          <line x1="58%" y1="82%" x2="72%" y2="76%" stroke="#f87171" opacity="0.5" />
        </g>

        {/* Multi-Colored Glowing Star Nodes */}
        {starNodes.map((node, i) => (
          <g key={i}>
            {/* Ambient Aura Halo */}
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r * 3.2}
              fill={node.glow}
              opacity="0.25"
            />
            {/* Core Glowing Star */}
            <circle
              ref={(el) => {
                nodesRef.current[i] = el;
              }}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={node.color}
              filter="url(#star-glow-fx)"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
