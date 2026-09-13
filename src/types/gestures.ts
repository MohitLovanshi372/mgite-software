/**
 * Hand Gesture Types and Definitions
 */

import { AIStateMode } from './index.ts';

export type GestureType =
  | 'OPEN_PALM'      // Halt / Stop / Security Shield
  | 'FIST'           // Airgap Lock / Defense Stance
  | 'VICTORY_PEACE'  // Success / Nominal Status
  | 'POINT_INDEX'    // Directive Targeting / Command Input
  | 'THUMBS_UP'      // Approval / Execute Affirmative
  | 'PINCH'          // Precision Focus / Calibrate
  | 'NONE';

export interface LearnedGesture {
  id: string;
  name: string;
  type: GestureType;
  description: string;
  triggerAction: string;
  mappedState: AIStateMode;
  confidence: number;
  sampleCount: number;
  lastDetected?: string;
  isCustom?: boolean;
}

export interface HandLandmarks {
  wrist: { x: number; y: number };
  thumbTip: { x: number; y: number };
  indexTip: { x: number; y: number };
  middleTip: { x: number; y: number };
  ringTip: { x: number; y: number };
  pinkyTip: { x: number; y: number };
  palmCenter: { x: number; y: number };
  isTracking: boolean;
  rawMotion: number;
}
