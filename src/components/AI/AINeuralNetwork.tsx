/**
 * AINeuralNetwork Component
 * Neural constellation nodes and glowing crimson conduits.
 */

import React from 'react';
import { AIStateMode } from '../../types/index.ts';

interface AINeuralNetworkProps {
  state: AIStateMode;
}

export const AINeuralNetwork: React.FC<AINeuralNetworkProps> = ({ state }) => {
  const isFast = state === 'THINKING' || state === 'EXECUTING';

  return (
    <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="neural-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Neural Conduits */}
        <g stroke="#b91c1c" strokeWidth="0.75" strokeDasharray="3 3">
          <line x1="20%" y1="30%" x2="50%" y2="50%" />
          <line x1="80%" y1="30%" x2="50%" y2="50%" />
          <line x1="30%" y1="75%" x2="50%" y2="50%" />
          <line x1="70%" y1="75%" x2="50%" y2="50%" />
          <line x1="15%" y1="50%" x2="30%" y2="75%" />
          <line x1="85%" y1="50%" x2="70%" y2="75%" />
        </g>

        {/* Nodes */}
        {[
          { cx: '20%', cy: '30%', r: 3 },
          { cx: '80%', cy: '30%', r: 3 },
          { cx: '50%', cy: '50%', r: 5 },
          { cx: '30%', cy: '75%', r: 3 },
          { cx: '70%', cy: '75%', r: 3 },
          { cx: '15%', cy: '50%', r: 2.5 },
          { cx: '85%', cy: '50%', r: 2.5 },
        ].map((node, i) => (
          <circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill="#ef4444"
            className={isFast ? 'animate-ping duration-1000' : 'animate-pulse'}
          />
        ))}
      </svg>
    </div>
  );
};
