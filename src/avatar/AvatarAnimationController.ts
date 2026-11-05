/**
 * Avatar Animation Controller (Phase 5 - Section 3 & 14)
 *
 * Master coordinator for per-frame avatar evaluation:
 * - Coordinates State, Emotion, Gesture, LipSync, Eyes, and Head movement
 * - Throttles updates based on AvatarQuality (LOW = 30fps, MEDIUM/HIGH = 60fps)
 * - Computes standard ARKit/RPM blendshape weights and skeletal bone transforms
 * - Fully local execution (0 external AI roundtrips during animation)
 */

import {
  AvatarAnimationState,
  AvatarQuality,
  AvatarSettingsConfig,
} from './types.ts';
import { AvatarStateManager, avatarStateManager } from './AvatarState.ts';
import { EmotionController, emotionController } from './EmotionController.ts';
import { GestureController, gestureController } from './GestureController.ts';
import { LipSyncController, lipSyncController } from './LipSyncController.ts';
import { EyeController, eyeController } from './EyeController.ts';
import { HeadMovementController, headMovementController } from './HeadMovementController.ts';

export interface MorphTargetWeights {
  // Eye / Blink
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeSquintLeft: number;
  eyeSquintRight: number;
  eyeWideLeft: number;
  eyeWideRight: number;

  // Eyebrows
  browInnerUp: number;
  browDownLeft: number;
  browDownRight: number;
  browOuterUpLeft: number;
  browOuterUpRight: number;

  // Mouth / LipSync
  jawOpen: number;
  mouthOpen: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthFrownLeft: number;
  mouthFrownRight: number;
  mouthPucker: number;
  mouthFunnel: number;
}

export class AvatarAnimationController {
  private stateManager: AvatarStateManager;
  private emotionCtrl: EmotionController;
  private gestureCtrl: GestureController;
  private lipSyncCtrl: LipSyncController;
  private eyeCtrl: EyeController;
  private headCtrl: HeadMovementController;

  private lastFrameTime: number = 0;
  private frameIntervalMs: number = 1000 / 60; // 60 fps default

  constructor(
    stateManager: AvatarStateManager = avatarStateManager,
    emotionCtrl: EmotionController = emotionController,
    gestureCtrl: GestureController = gestureController,
    lipSyncCtrl: LipSyncController = lipSyncController,
    eyeCtrl: EyeController = eyeController,
    headCtrl: HeadMovementController = headMovementController
  ) {
    this.stateManager = stateManager;
    this.emotionCtrl = emotionCtrl;
    this.gestureCtrl = gestureCtrl;
    this.lipSyncCtrl = lipSyncCtrl;
    this.eyeCtrl = eyeCtrl;
    this.headCtrl = headCtrl;
  }

  public setQuality(quality: AvatarQuality): void {
    if (quality === 'LOW') {
      this.frameIntervalMs = 1000 / 30; // 30 fps cap for battery/CPU savings
    } else {
      this.frameIntervalMs = 1000 / 60; // 60 fps
    }
  }

  /**
   * Advances the animation pipeline by delta time.
   * Returns computed skeletal transforms and morph target dictionary.
   */
  public evaluateFrame(
    timestampMs: number = Date.now(),
    settings?: Partial<AvatarSettingsConfig>
  ): {
    animationState: AvatarAnimationState;
    morphTargets: MorphTargetWeights;
    shouldRender: boolean;
  } {
    // 1. Frame Rate Throttling check
    const elapsed = timestampMs - this.lastFrameTime;
    if (this.lastFrameTime > 0 && elapsed < this.frameIntervalMs - 1) {
      return {
        animationState: this.getCurrentStateSnapshot(),
        morphTargets: this.computeMorphTargets(0, 0, 0, 0, 0),
        shouldRender: false,
      };
    }
    this.lastFrameTime = timestampMs;
    const deltaSeconds = Math.min(0.05, Math.max(0.001, elapsed / 1000));

    // 2. Query Sub-Controllers
    const currentState = this.stateManager.getState();
    const targetState = this.stateManager.getTargetState();

    // Emotion parameters
    const emotionParams = settings?.emotionReactionsEnabled !== false
      ? this.emotionCtrl.update(deltaSeconds)
      : this.emotionCtrl.getParameters();

    // Gesture offsets
    const gestureParams = settings?.gesturesEnabled !== false
      ? this.gestureCtrl.update()
      : { headOffset: { x: 0, y: 0, z: 0 } };

    // Lip sync openness
    const lipSyncFrame = settings?.lipSyncEnabled !== false
      ? this.lipSyncCtrl.update()
      : { mouthOpenness: 0 };

    // Eyes & Blinking
    const naturalBlink = settings?.naturalBlinkingEnabled !== false;
    const eyeMovement = settings?.eyeMovementEnabled !== false;
    const eyeParams = this.eyeCtrl.update(deltaSeconds, naturalBlink, eyeMovement);

    // Head Movement & Breathing
    const headParams = settings?.animationEnabled !== false
      ? this.headCtrl.update(deltaSeconds, {
          emotionOffset: emotionParams,
          gestureOffset: gestureParams.headOffset,
          isIdle: currentState === 'IDLE',
          reducedMotion: settings?.reducedMotion ?? false,
        })
      : { rotation: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0, z: 0 } };

    // 3. Compute Composite Morph Targets
    const mouthSmile = Math.max(0, emotionParams.mouthSmile);
    const mouthFrown = Math.max(0, -emotionParams.mouthSmile);
    const browUp = Math.max(0, emotionParams.eyebrowRaise);
    const browDown = Math.max(0, -emotionParams.eyebrowRaise);
    const jawOpen = Math.min(1.0, lipSyncFrame.mouthOpenness + emotionParams.mouthOpen);

    const morphTargets = this.computeMorphTargets(
      eyeParams.blinkValue,
      jawOpen,
      mouthSmile,
      mouthFrown,
      browUp,
      browDown,
      emotionParams.eyeSquint
    );

    const animationState: AvatarAnimationState = {
      currentState,
      targetState,
      currentEmotion: this.emotionCtrl.getEmotion(),
      currentGesture: this.gestureCtrl.getGesture(),
      mouthOpenness: jawOpen,
      blinkValue: eyeParams.blinkValue,
      headRotation: headParams.rotation,
      headPosition: headParams.position,
      eyeGaze: eyeParams.gaze,
    };

    return {
      animationState,
      morphTargets,
      shouldRender: true,
    };
  }

  private computeMorphTargets(
    blink: number,
    jawOpen: number,
    smile: number,
    frown: number,
    browUp: number,
    browDown: number = 0,
    squint: number = 0
  ): MorphTargetWeights {
    return {
      eyeBlinkLeft: blink,
      eyeBlinkRight: blink,
      eyeSquintLeft: Math.max(0, squint),
      eyeSquintRight: Math.max(0, squint),
      eyeWideLeft: squint < 0 ? -squint : 0,
      eyeWideRight: squint < 0 ? -squint : 0,
      browInnerUp: browUp,
      browDownLeft: browDown,
      browDownRight: browDown,
      browOuterUpLeft: browUp * 0.7,
      browOuterUpRight: browUp * 0.7,
      jawOpen: jawOpen,
      mouthOpen: jawOpen * 0.8,
      mouthSmileLeft: smile,
      mouthSmileRight: smile,
      mouthFrownLeft: frown,
      mouthFrownRight: frown,
      mouthPucker: jawOpen > 0.4 ? 0.15 : 0,
      mouthFunnel: jawOpen > 0.6 ? 0.2 : 0,
    };
  }

  private getCurrentStateSnapshot(): AvatarAnimationState {
    return {
      currentState: this.stateManager.getState(),
      targetState: this.stateManager.getTargetState(),
      currentEmotion: this.emotionCtrl.getEmotion(),
      currentGesture: this.gestureCtrl.getGesture(),
      mouthOpenness: this.lipSyncCtrl.getOpenness(),
      blinkValue: 0,
      headRotation: { x: 0, y: 0, z: 0 },
      headPosition: { x: 0, y: 0, z: 0 },
      eyeGaze: { x: 0, y: 0 },
    };
  }

  public reset(): void {
    this.stateManager.reset();
    this.emotionCtrl.reset();
    this.gestureCtrl.reset();
    this.lipSyncCtrl.reset();
    this.eyeCtrl.reset();
    this.headCtrl.reset();
  }
}

export const avatarAnimationController = new AvatarAnimationController();
