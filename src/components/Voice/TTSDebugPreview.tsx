/**
 * TTS Debug Preview & Speech Normalization Inspector (Phase 3 Voice Engine Fix)
 * Re-exports and wraps TextNormalizationDebugger for backwards compatibility.
 */

import React from 'react';
import { TextNormalizationDebugger } from './TextNormalizationDebugger.tsx';

export { TextNormalizationDebugger } from './TextNormalizationDebugger.tsx';

export const TTSDebugPreview: React.FC = () => {
  return <TextNormalizationDebugger />;
};
