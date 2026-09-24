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

export type CombatGestureType =
  | 'RIGHT_PUNCH'
  | 'LEFT_PUNCH'
  | 'GUARD'
  | 'DODGE_LEFT'
  | 'DODGE_RIGHT'
  | 'UPPERCUT'
  | 'KICK'
  | 'ENERGY_BLAST'     // Both palms thrust forward (repulsor beam)
  | 'X_GUARD'          // Crossed arms defensive barrier
  | 'T_POSE'           // Both arms extended horizontal T-pose
  | 'CROUCH_STANCE'    // Squatting / lower body crouch
  | 'POWER_SURGE'      // Arms flexed down at sides, power surge stance
  | 'HAND_WAVE'        // One hand raised waving
  | 'BOW'              // Formal martial arts bow
  | 'TORNADO_KICK'     // High spin kick
  | 'DOUBLE_PALM'      // Dual forward palm strike
  | 'STOP_IDLE'
  | 'NONE';

export type BodyHandPoseState = 'OPEN_PALM' | 'FIST' | 'POINT' | 'PEACE' | 'UNKNOWN';

export interface PoseLandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface BodyPoseLandmarks {
  nose: PoseLandmarkPoint;
  leftEye: PoseLandmarkPoint;
  rightEye: PoseLandmarkPoint;
  leftShoulder: PoseLandmarkPoint;
  rightShoulder: PoseLandmarkPoint;
  leftElbow: PoseLandmarkPoint;
  rightElbow: PoseLandmarkPoint;
  leftWrist: PoseLandmarkPoint;
  rightWrist: PoseLandmarkPoint;
  leftHip: PoseLandmarkPoint;
  rightHip: PoseLandmarkPoint;
  leftKnee: PoseLandmarkPoint;
  rightKnee: PoseLandmarkPoint;
  leftAnkle: PoseLandmarkPoint;
  rightAnkle: PoseLandmarkPoint;
  // Hand states for full body control
  leftHandState?: BodyHandPoseState;
  rightHandState?: BodyHandPoseState;
  squatDepth?: number; // 0 = standing, 1 = deep squat
  torsoLean?: number;  // -1 to 1 lateral lean
  isTracking: boolean;
  confidence: number;
  rawMotion: number;
  rawLandmarks?: PoseLandmarkPoint[];
}

export interface CombatGestureTelemetry {
  gesture: CombatGestureType;
  confidence: number;
  lastTriggerTime: number;
  comboCount: number;
  velocity: number;
  activeAnimation: string;
  isTracking: boolean;
  engine: 'MEDIAPIPE' | 'OPTICAL_KINEMATIC';
  leftHandState?: BodyHandPoseState;
  rightHandState?: BodyHandPoseState;
  squatDepth?: number;
  torsoLean?: number;
}

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
