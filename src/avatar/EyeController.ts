/**
 * Eye & Blink Controller (Phase 5 - Section 8)
 *
 * Implements:
 * 1. Randomized natural human blinking (2.8s to 5.5s interval, 150ms blink cycle)
 * 2. Natural micro-saccadic eye movement (gentle gaze shifts)
 * 3. Mouse / attention gaze tracking with safe boundary limits (±8 degrees)
 * 4. Fallback blendshape / morph target integration
 */

import { BlinkParameters, EyeGazeParameters } from './types.ts';

export class EyeController {
  // Blinking state
  private blinkState: BlinkParameters;
  private blinkStartTime: number = 0;
  private blinkDurationMs: number = 150; // human blink: ~120-180ms
  private isBlinking: boolean = false;

  // Gaze / Saccades state
  private gazeState: EyeGazeParameters;
  private gazeSmoothFactor: number = 0.12;

  constructor() {
    this.blinkState = {
      isBlinking: false,
      blinkProgress: 0,
      nextBlinkTime: Date.now() + this.getRandomBlinkInterval(),
    };

    this.gazeState = {
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
      nextSaccadeTime: Date.now() + this.getRandomSaccadeInterval(),
    };
  }

  private getRandomBlinkInterval(): number {
    // 2.8s to 5.5s interval
    return 2800 + Math.random() * 2700;
  }

  private getRandomSaccadeInterval(): number {
    // 1.5s to 3.5s interval
    return 1500 + Math.random() * 2000;
  }

  /**
   * Triggers an immediate blink (useful for emotional response like surprise or wake-up)
   */
  public triggerBlink(): void {
    this.isBlinking = true;
    this.blinkStartTime = Date.now();
    this.blinkState.isBlinking = true;
  }

  /**
   * Sets a target gaze point (e.g. from normalized mouse coords -1 to 1).
   * Automatically clamps to safe physiological eye rotation angles (±0.25 rad / ~14 deg).
   */
  public setTargetGaze(normalizedX: number, normalizedY: number): void {
    const maxYaw = 0.22;   // ~12.6 degrees
    const maxPitch = 0.16; // ~9.1 degrees

    this.gazeState.targetYaw = Math.max(-maxYaw, Math.min(maxYaw, normalizedX * maxYaw));
    this.gazeState.targetPitch = Math.max(-maxPitch, Math.min(maxPitch, normalizedY * maxPitch));
  }

  /**
   * Updates blinking and eye gaze for the current frame.
   */
  public update(delta: number = 0.016, naturalBlinking: boolean = true, eyeMovement: boolean = true): {
    blinkValue: number;
    gaze: { x: number; y: number };
  } {
    const now = Date.now();

    // 1. Blink Update
    let blinkValue = 0;
    if (naturalBlinking) {
      if (!this.isBlinking && now >= this.blinkState.nextBlinkTime) {
        this.triggerBlink();
      }

      if (this.isBlinking) {
        const elapsed = now - this.blinkStartTime;
        if (elapsed >= this.blinkDurationMs) {
          this.isBlinking = false;
          this.blinkState.isBlinking = false;
          blinkValue = 0;
          this.blinkState.nextBlinkTime = now + this.getRandomBlinkInterval();
        } else {
          // Asymmetrical human blink curve: fast close (~40%), slightly slower open (~60%)
          const p = elapsed / this.blinkDurationMs;
          if (p < 0.4) {
            blinkValue = p / 0.4;
          } else {
            blinkValue = 1.0 - (p - 0.4) / 0.6;
          }
        }
      }
    } else {
      this.isBlinking = false;
      blinkValue = 0;
    }

    this.blinkState.blinkProgress = Math.max(0, Math.min(1, blinkValue));

    // 2. Eye Gaze & Micro-Saccades Update
    if (eyeMovement) {
      if (now >= this.gazeState.nextSaccadeTime) {
        // Micro-saccade: subtle natural glance offset
        const microYaw = (Math.random() - 0.5) * 0.06;
        const microPitch = (Math.random() - 0.5) * 0.04;
        this.gazeState.targetYaw += microYaw;
        this.gazeState.targetPitch += microPitch;
        this.gazeState.nextSaccadeTime = now + this.getRandomSaccadeInterval();
      }

      // Smooth damped interpolation towards target gaze
      const factor = Math.min(1.0, this.gazeSmoothFactor * (delta / 0.016));
      this.gazeState.yaw += (this.gazeState.targetYaw - this.gazeState.yaw) * factor;
      this.gazeState.pitch += (this.gazeState.targetPitch - this.gazeState.pitch) * factor;
    } else {
      this.gazeState.yaw = 0;
      this.gazeState.pitch = 0;
    }

    return {
      blinkValue: this.blinkState.blinkProgress,
      gaze: { x: this.gazeState.yaw, y: this.gazeState.pitch },
    };
  }

  public reset(): void {
    this.isBlinking = false;
    this.blinkState = {
      isBlinking: false,
      blinkProgress: 0,
      nextBlinkTime: Date.now() + 2000,
    };
    this.gazeState = {
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
      nextSaccadeTime: Date.now() + 2000,
    };
  }
}

export const eyeController = new EyeController();
