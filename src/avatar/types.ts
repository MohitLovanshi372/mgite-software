/**
 * 3D AI Human Avatar & Emotion Engine Types (Phase 5)
 *
 * Defines strictly typed structures for:
 * 1. Avatar States
 * 2. Emotions
 * 3. Gestures
 * 4. Settings & Quality Levels
 * 5. Event Bus Events
 * 6. LipSync & Animation Interfaces
 */

export type AvatarState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'HAPPY'
  | 'SAD'
  | 'SURPRISED'
  | 'CONFUSED'
  | 'SERIOUS'
  | 'EXCITED'
  | 'ERROR';

export type AvatarEmotion =
  | 'neutral'
  | 'friendly'
  | 'happy'
  | 'thinking'
  | 'confused'
  | 'serious'
  | 'surprised'
  | 'excited'
  | 'concerned'
  | 'sad';

export type AvatarGesture =
  | 'nod'
  | 'tilt'
  | 'wave'
  | 'hand_open'
  | 'thinking'
  | 'welcome'
  | 'acknowledgement'
  | 'none';

export type AvatarQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AvatarSettingsConfig {
  enabled: boolean;
  modelPath: string;
  quality: AvatarQuality;
  scale: number;
  animationEnabled: boolean;
  eyeMovementEnabled: boolean;
  naturalBlinkingEnabled: boolean;
  lipSyncEnabled: boolean;
  gesturesEnabled: boolean;
  emotionReactionsEnabled: boolean;
  reducedMotion: boolean;
}

export interface AvatarInstruction {
  emotion: AvatarEmotion;
  gesture: AvatarGesture;
  speaking: boolean;
  state: AvatarState;
}

export interface EmotionParameters {
  mouthSmile: number;       // -1.0 (frown) to 1.0 (smile)
  mouthOpen: number;        // 0.0 to 1.0
  eyebrowRaise: number;     // -1.0 (furrowed) to 1.0 (raised)
  eyeSquint: number;        // 0.0 (wide) to 1.0 (squint)
  headTiltZ: number;        // rotation in radians
  headPitchX: number;       // rotation in radians
  headYawY: number;         // rotation in radians
  transitionSpeed: number;  // lerp factor
}

export interface GestureParameters {
  name: AvatarGesture;
  durationMs: number;
  startTime: number;
  active: boolean;
  headOffset: { x: number; y: number; z: number };
  handRaiseLeft?: number;
  handRaiseRight?: number;
}

export interface BlinkParameters {
  isBlinking: boolean;
  blinkProgress: number; // 0.0 (open) to 1.0 (closed)
  nextBlinkTime: number;
}

export interface EyeGazeParameters {
  yaw: number;   // horizontal eye angle
  pitch: number; // vertical eye angle
  targetYaw: number;
  targetPitch: number;
  nextSaccadeTime: number;
}

export interface LipSyncFrame {
  mouthOpenness: number; // 0.0 to 1.0
  mouthWidth?: number;
  viseme?: string;
}

export interface ILipSyncProvider {
  name: string;
  start(audioElement?: HTMLAudioElement | null): void;
  stop(): void;
  isActive(): boolean;
  getCurrentFrame(): LipSyncFrame;
}

export interface AvatarAnimationState {
  currentState: AvatarState;
  targetState: AvatarState;
  currentEmotion: AvatarEmotion;
  currentGesture: AvatarGesture;
  mouthOpenness: number;
  blinkValue: number;
  headRotation: { x: number; y: number; z: number };
  headPosition: { x: number; y: number; z: number };
  eyeGaze: { x: number; y: number };
}

export type AvatarEventType =
  | 'AVATAR_IDLE'
  | 'AVATAR_LISTENING'
  | 'AVATAR_THINKING'
  | 'AVATAR_SPEAKING'
  | 'AVATAR_EMOTION'
  | 'AVATAR_GESTURE'
  | 'AVATAR_ERROR';

export interface AvatarEvent {
  type: AvatarEventType;
  payload?: {
    state?: AvatarState;
    emotion?: AvatarEmotion;
    gesture?: AvatarGesture;
    text?: string;
    error?: string;
    source?: string;
  };
  timestamp: number;
}

export type AvatarEventListener = (event: AvatarEvent) => void;
