/**
 * AICoreRings Component
 * Updated to use the high-performance, lightweight NeuralNetworkRing component
 * utilizing requestAnimationFrame for optimized frame rates and zero performance degradation.
 */

import React from 'react';
import { AIStateMode } from '../../types/index.ts';
import { NeuralNetworkRing } from './NeuralNetworkRing.tsx';

interface AICoreRingsProps {
  state: AIStateMode;
}

export const AICoreRings: React.FC<AICoreRingsProps> = ({ state }) => {
  return <NeuralNetworkRing state={state} size={560} />;
};
