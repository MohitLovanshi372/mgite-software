/**
 * Head Movement & Natural Breathing Controller (Phase 5 - Section 7)
 *
 * Implements:
 * 1. Subtle natural breathing simulation (~0.25 Hz breathing rhythm)
 * 2. Subtle idle micro-sway (gentle compound sine waves)
 * 3. Smooth blend of:
 *    - Idle breathing
 *    - Emotion posture (from EmotionController)
 *    - Procedural gesture offsets (from GestureController)
 * 4. Reduced-motion compliance (disables non-essential sway)
 */

export class HeadMovementController {
  private headRotation = { x: 0, y: 0, z: 0 };
  private headPosition = { x: 0, y: 0, z: 0 };
  private timeOffset: number = Math.random() * 100;
  private smoothFactor: number = 0.1;

  public update(
    delta: number = 0.016,
    options: {
      emotionOffset?: { headPitchX: number; headYawY: number; headTiltZ: number };
      gestureOffset?: { x: number; y: number; z: number };
      isIdle?: boolean;
      reducedMotion?: boolean;
    } = {}
  ): {
    rotation: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
  } {
    this.timeOffset += delta;

    if (options.reducedMotion) {
      // Reduced motion: clamp to minimal posture cues without idle sway
      const targetX = options.emotionOffset?.headPitchX || 0;
      const targetY = options.emotionOffset?.headYawY || 0;
      const targetZ = options.emotionOffset?.headTiltZ || 0;

      this.headRotation.x += (targetX - this.headRotation.x) * 0.15;
      this.headRotation.y += (targetY - this.headRotation.y) * 0.15;
      this.headRotation.z += (targetZ - this.headRotation.z) * 0.15;
      this.headPosition = { x: 0, y: 0, z: 0 };

      return {
        rotation: { ...this.headRotation },
        position: { ...this.headPosition },
      };
    }

    // 1. Natural Breathing (~0.25 Hz: period = 4.0s)
    const breathPhase = this.timeOffset * Math.PI * 0.5;
    const breathPitch = Math.sin(breathPhase) * 0.012; // ~0.7 degrees pitch oscillation
    const breathLift = Math.sin(breathPhase) * 0.003;  // ~3mm subtle vertical lift

    // 2. Idle Micro-Sway (Compound asynchronous low-frequency sines)
    const idleYaw = Math.sin(this.timeOffset * 0.43) * 0.015 + Math.sin(this.timeOffset * 0.81) * 0.008;
    const idleRoll = Math.cos(this.timeOffset * 0.37) * 0.012;

    // 3. Target combination
    const emotionX = options.emotionOffset?.headPitchX || 0;
    const emotionY = options.emotionOffset?.headYawY || 0;
    const emotionZ = options.emotionOffset?.headTiltZ || 0;

    const gestureX = options.gestureOffset?.x || 0;
    const gestureY = options.gestureOffset?.y || 0;
    const gestureZ = options.gestureOffset?.z || 0;

    const targetRotX = emotionX + gestureX + breathPitch;
    const targetRotY = emotionY + gestureY + idleYaw;
    const targetRotZ = emotionZ + gestureZ + idleRoll;

    const targetPosY = breathLift;

    // 4. Smooth exponential damping
    const factor = Math.min(1.0, this.smoothFactor * (delta / 0.016));
    this.headRotation.x += (targetRotX - this.headRotation.x) * factor;
    this.headRotation.y += (targetRotY - this.headRotation.y) * factor;
    this.headRotation.z += (targetRotZ - this.headRotation.z) * factor;

    this.headPosition.y += (targetPosY - this.headPosition.y) * factor;

    return {
      rotation: { ...this.headRotation },
      position: { ...this.headPosition },
    };
  }

  public reset(): void {
    this.headRotation = { x: 0, y: 0, z: 0 };
    this.headPosition = { x: 0, y: 0, z: 0 };
    this.timeOffset = 0;
  }
}

export const headMovementController = new HeadMovementController();
