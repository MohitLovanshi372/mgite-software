/**
 * AINeuralNetwork Component
 *
 * Lightweight background neural constellation nodes and pulsing conduits.
 * Optimized with requestAnimationFrame to eliminate CSS pulse layout recalculations
 * and sync smoothly with the NeuralNetworkRing system.
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

  const nodes = [
    { cx: '20%', cy: '30%', r: 3, phase: 0 },
    { cx: '80%', cy: '30%', r: 3, phase: 1.2 },
    { cx: '50%', cy: '50%', r: 5, phase: 2.4 },
    { cx: '30%', cy: '75%', r: 3, phase: 3.6 },
    { cx: '70%', cy: '75%', r: 3, phase: 4.8 },
    { cx: '15%', cy: '50%', r: 2.5, phase: 1.8 },
    { cx: '85%', cy: '50%', r: 2.5, phase: 3.0 },
  ];

  // requestAnimationFrame animation loop directly driving opacity and radius without React re-renders
  useEffect(() => {
    let animId: number;
    let startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const currentState = stateRef.current;
      const isFast = currentState === 'THINKING' || currentState === 'EXECUTING';
      const isAlert = currentState === 'SECURITY_ALERT' || currentState === 'ERROR';
      const isSuccess = currentState === 'SUCCESS';

      const freq = isFast ? 5.5 : isAlert ? 7.0 : 2.0;
      const fillColor = isSuccess ? '#10b981' : isAlert ? '#ef4444' : isFast ? '#f97316' : '#ef4444';

      nodesRef.current.forEach((nodeEl, idx) => {
        if (nodeEl) {
          const nodeData = nodes[idx];
          const pulse = (Math.sin(elapsed * freq + nodeData.phase) + 1) / 2;
          const currentR = nodeData.r * (1 + pulse * (isFast ? 0.6 : 0.3));
          const opacity = 0.3 + pulse * 0.7;

          nodeEl.setAttribute('r', currentR.toFixed(1));
          nodeEl.setAttribute('opacity', opacity.toFixed(2));
          nodeEl.setAttribute('fill', fillColor);
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
      <svg ref={containerRef} className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="neural-bg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Neural Conduits */}
        <g stroke="#b91c1c" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6">
          <line x1="20%" y1="30%" x2="50%" y2="50%" />
          <line x1="80%" y1="30%" x2="50%" y2="50%" />
          <line x1="30%" y1="75%" x2="50%" y2="50%" />
          <line x1="70%" y1="75%" x2="50%" y2="50%" />
          <line x1="15%" y1="50%" x2="30%" y2="75%" />
          <line x1="85%" y1="50%" x2="70%" y2="75%" />
        </g>

        {/* rAF-Driven Synaptic Nodes */}
        {nodes.map((node, i) => (
          <circle
            key={i}
            ref={(el) => {
              nodesRef.current[i] = el;
            }}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill="#ef4444"
          />
        ))}
      </svg>
    </div>
  );
};
