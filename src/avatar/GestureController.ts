/**
 * Gesture Controller (Phase 5 - Section 11)
 *
 * Coordinates subtle, realistic procedural gestures:
 * - nod (affirmation / acknowledgement)
 * - tilt (attentive listening / curiosity)
 * - wave (gentle greeting)
 * - hand_open (explanation / welcoming posture)
 * - thinking (slight chin raise / reflective head offset)
 * - welcome (inviting posture)
 * - acknowledgement (brief reassuring nod)
 * - none (neutral rest)
 *
 * Invariants:
 * - Gestures are bounded, subtle, and temporary (auto-reset to neutral)
 * - Never shakes or jitters
 * - Safe procedural fallbacks for head-only vs full-body models
 */

import { AvatarGesture, GestureParameters } from './types.ts';

export const ALL_GESTURES: AvatarGesture[] = [
  'nod',
  'tilt',
  'wave',
  'hand_open',
  'thinking',
  'welcome',
  'acknowledgement',
  'none',
];

interface GestureProfile {
  durationMs: number;
  compute(progress: number): {
    headOffset: { x: number; y: number; z: number };
    handRaiseLeft?: number;
    handRaiseRight?: number;
  };
}

const GESTURE_PROFILES: Record<AvatarGesture, GestureProfile> = {
  none: {
    durationMs: 0,
    compute: () => ({ headOffset: { x: 0, y: 0, z: 0 } }),
  },
  nod: {
    durationMs: 1200,
    compute: (p) => {
      // 2 gentle nods: sine wave damped
      const pitch = Math.sin(p * Math.PI * 4) * 0.12 * Math.sin(p * Math.PI);
      return { headOffset: { x: pitch, y: 0, z: 0 } };
    },
  },
  acknowledgement: {
    durationMs: 800,
    compute: (p) => {
      // 1 single reassuring nod
      const pitch = Math.sin(p * Math.PI * 2) * 0.08 * (1 - p);
      return { headOffset: { x: pitch, y: 0, z: 0 } };
    },
  },
  tilt: {
    durationMs: 1400,
    compute: (p) => {
      // Smooth tilt to the right and back
      const roll = Math.sin(p * Math.PI) * 0.09;
      return { headOffset: { x: 0.02 * Math.sin(p * Math.PI), y: 0, z: roll } };
    },
  },
  thinking: {
    durationMs: 2000,
    compute: (p) => {
      // Look slightly up and to the side, hold, return
      const envelope = Math.sin(p * Math.PI);
      return {
        headOffset: {
          x: 0.07 * envelope,
          y: -0.09 * envelope,
          z: 0.05 * envelope,
        },
      };
    },
  },
  wave: {
    durationMs: 1800,
    compute: (p) => {
      // Slight head tilt accompanied by hand raise if rigged
      const headRoll = Math.sin(p * Math.PI) * 0.04;
      const hand = Math.sin(p * Math.PI) * 0.8;
      return {
        headOffset: { x: -0.02 * Math.sin(p * Math.PI), y: 0, z: headRoll },
        handRaiseRight: hand,
      };
    },
  },
  hand_open: {
    durationMs: 1600,
    compute: (p) => {
      const envelope = Math.sin(p * Math.PI);
      return {
        headOffset: { x: 0.03 * envelope, y: 0, z: 0 },
        handRaiseLeft: 0.4 * envelope,
        handRaiseRight: 0.4 * envelope,
      };
    },
  },
  welcome: {
    durationMs: 1800,
    compute: (p) => {
      const envelope = Math.sin(p * Math.PI);
      return {
        headOffset: { x: 0.04 * envelope, y: 0, z: 0 },
        handRaiseLeft: 0.5 * envelope,
        handRaiseRight: 0.5 * envelope,
      };
    },
  },
};

export class GestureController {
  private currentGesture: AvatarGesture = 'none';
  private startTime: number = 0;
  private durationMs: number = 0;
  private isActive: boolean = false;
  private currentParams: GestureParameters;

  constructor() {
    this.currentParams = {
      name: 'none',
      durationMs: 0,
      startTime: 0,
      active: false,
      headOffset: { x: 0, y: 0, z: 0 },
    };
  }

  public isValidGesture(gesture: string): gesture is AvatarGesture {
    return ALL_GESTURES.includes(gesture as AvatarGesture);
  }

  public getGesture(): AvatarGesture {
    return this.currentGesture;
  }

  public getParameters(): GestureParameters {
    return { ...this.currentParams };
  }

  public triggerGesture(gesture: AvatarGesture): boolean {
    if (!this.isValidGesture(gesture)) {
      console.warn(`[GestureController] Invalid gesture rejected: ${gesture}`);
      return false;
    }

    if (gesture === 'none') {
      this.reset();
      return true;
    }

    const profile = GESTURE_PROFILES[gesture];
    this.currentGesture = gesture;
    this.startTime = Date.now();
    this.durationMs = profile.durationMs;
    this.isActive = true;

    this.currentParams = {
      name: gesture,
      durationMs: this.durationMs,
      startTime: this.startTime,
      active: true,
      headOffset: { x: 0, y: 0, z: 0 },
    };

    return true;
  }

  public update(): GestureParameters {
    if (!this.isActive || this.currentGesture === 'none') {
      this.currentParams.headOffset = { x: 0, y: 0, z: 0 };
      this.currentParams.active = false;
      return { ...this.currentParams };
    }

    const elapsed = Date.now() - this.startTime;
    if (elapsed >= this.durationMs) {
      this.reset();
      return { ...this.currentParams };
    }

    const progress = Math.min(1.0, elapsed / this.durationMs);
    const profile = GESTURE_PROFILES[this.currentGesture];
    const offsets = profile.compute(progress);

    this.currentParams.headOffset = offsets.headOffset;
    this.currentParams.handRaiseLeft = offsets.handRaiseLeft;
    this.currentParams.handRaiseRight = offsets.handRaiseRight;

    return { ...this.currentParams };
  }

  public reset(): void {
    this.currentGesture = 'none';
    this.isActive = false;
    this.currentParams = {
      name: 'none',
      durationMs: 0,
      startTime: 0,
      active: false,
      headOffset: { x: 0, y: 0, z: 0 },
    };
  }
}

export const gestureController = new GestureController();
