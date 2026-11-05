/**
 * Emotion Controller (Phase 5 - Section 6)
 *
 * Validates and maps emotions to safe, subtle animation parameters:
 * - neutral, friendly, happy, thinking, confused, serious, surprised, excited, concerned, sad
 *
 * Controls:
 * - mouthSmile (-1.0 to 1.0)
 * - eyebrowRaise (-1.0 to 1.0)
 * - eyeSquint (0.0 to 1.0)
 * - headTiltZ, headPitchX, headYawY
 * - Smooth lerp interpolation for natural, subtle transitions without jerking
 */

import { AvatarEmotion, EmotionParameters } from './types.ts';

export const ALL_EMOTIONS: AvatarEmotion[] = [
  'neutral',
  'friendly',
  'happy',
  'thinking',
  'confused',
  'serious',
  'surprised',
  'excited',
  'concerned',
  'sad',
];

export const EMOTION_PROFILES: Record<AvatarEmotion, EmotionParameters> = {
  neutral: {
    mouthSmile: 0.05,
    mouthOpen: 0.0,
    eyebrowRaise: 0.0,
    eyeSquint: 0.0,
    headTiltZ: 0.0,
    headPitchX: 0.0,
    headYawY: 0.0,
    transitionSpeed: 0.08,
  },
  friendly: {
    mouthSmile: 0.35,
    mouthOpen: 0.0,
    eyebrowRaise: 0.15,
    eyeSquint: 0.05,
    headTiltZ: 0.03,
    headPitchX: -0.02,
    headYawY: 0.0,
    transitionSpeed: 0.1,
  },
  happy: {
    mouthSmile: 0.65,
    mouthOpen: 0.05,
    eyebrowRaise: 0.25,
    eyeSquint: 0.2,
    headTiltZ: 0.04,
    headPitchX: -0.03,
    headYawY: 0.02,
    transitionSpeed: 0.1,
  },
  thinking: {
    mouthSmile: -0.05,
    mouthOpen: 0.0,
    eyebrowRaise: -0.15,
    eyeSquint: 0.25,
    headTiltZ: 0.07,
    headPitchX: 0.06,
    headYawY: -0.08,
    transitionSpeed: 0.06,
  },
  confused: {
    mouthSmile: -0.15,
    mouthOpen: 0.02,
    eyebrowRaise: 0.2, // one eyebrow higher in blendshape
    eyeSquint: 0.15,
    headTiltZ: -0.08,
    headPitchX: 0.04,
    headYawY: 0.06,
    transitionSpeed: 0.08,
  },
  serious: {
    mouthSmile: -0.05,
    mouthOpen: 0.0,
    eyebrowRaise: -0.1,
    eyeSquint: 0.1,
    headTiltZ: 0.0,
    headPitchX: 0.03,
    headYawY: 0.0,
    transitionSpeed: 0.07,
  },
  surprised: {
    mouthSmile: 0.1,
    mouthOpen: 0.25,
    eyebrowRaise: 0.6,
    eyeSquint: -0.3, // extra wide open
    headTiltZ: -0.02,
    headPitchX: -0.06,
    headYawY: 0.0,
    transitionSpeed: 0.14,
  },
  excited: {
    mouthSmile: 0.8,
    mouthOpen: 0.15,
    eyebrowRaise: 0.45,
    eyeSquint: 0.15,
    headTiltZ: 0.05,
    headPitchX: -0.04,
    headYawY: 0.03,
    transitionSpeed: 0.12,
  },
  concerned: {
    mouthSmile: -0.25,
    mouthOpen: 0.0,
    eyebrowRaise: 0.3,
    eyeSquint: 0.1,
    headTiltZ: 0.05,
    headPitchX: 0.04,
    headYawY: 0.0,
    transitionSpeed: 0.08,
  },
  sad: {
    mouthSmile: -0.45,
    mouthOpen: 0.0,
    eyebrowRaise: 0.2,
    eyeSquint: 0.05,
    headTiltZ: -0.03,
    headPitchX: 0.08,
    headYawY: 0.0,
    transitionSpeed: 0.06,
  },
};

export class EmotionController {
  private currentEmotion: AvatarEmotion = 'neutral';
  private targetEmotion: AvatarEmotion = 'neutral';
  private currentParams: EmotionParameters;
  private targetParams: EmotionParameters;

  constructor(initialEmotion: AvatarEmotion = 'neutral') {
    this.currentEmotion = initialEmotion;
    this.targetEmotion = initialEmotion;
    this.currentParams = { ...EMOTION_PROFILES[initialEmotion] };
    this.targetParams = { ...EMOTION_PROFILES[initialEmotion] };
  }

  public isValidEmotion(emotion: string): emotion is AvatarEmotion {
    return ALL_EMOTIONS.includes(emotion as AvatarEmotion);
  }

  public getEmotion(): AvatarEmotion {
    return this.currentEmotion;
  }

  public getParameters(): EmotionParameters {
    return { ...this.currentParams };
  }

  public setEmotion(emotion: AvatarEmotion): boolean {
    if (!this.isValidEmotion(emotion)) {
      console.warn(`[EmotionController] Invalid emotion rejected: ${emotion}`);
      return false;
    }

    this.targetEmotion = emotion;
    this.targetParams = { ...EMOTION_PROFILES[emotion] };
    return true;
  }

  /**
   * Advances the animation by delta time using exponential smoothing (lerp).
   */
  public update(delta: number = 0.016): EmotionParameters {
    const speed = this.targetParams.transitionSpeed * (delta / 0.016);
    const clampSpeed = Math.min(1.0, Math.max(0.01, speed));

    this.currentParams.mouthSmile += (this.targetParams.mouthSmile - this.currentParams.mouthSmile) * clampSpeed;
    this.currentParams.mouthOpen += (this.targetParams.mouthOpen - this.currentParams.mouthOpen) * clampSpeed;
    this.currentParams.eyebrowRaise += (this.targetParams.eyebrowRaise - this.currentParams.eyebrowRaise) * clampSpeed;
    this.currentParams.eyeSquint += (this.targetParams.eyeSquint - this.currentParams.eyeSquint) * clampSpeed;
    this.currentParams.headTiltZ += (this.targetParams.headTiltZ - this.currentParams.headTiltZ) * clampSpeed;
    this.currentParams.headPitchX += (this.targetParams.headPitchX - this.currentParams.headPitchX) * clampSpeed;
    this.currentParams.headYawY += (this.targetParams.headYawY - this.currentParams.headYawY) * clampSpeed;

    // Check if transition is visually complete
    const diff = Math.abs(this.targetParams.mouthSmile - this.currentParams.mouthSmile);
    if (diff < 0.01) {
      this.currentEmotion = this.targetEmotion;
    }

    return { ...this.currentParams };
  }

  public reset(): void {
    this.currentEmotion = 'neutral';
    this.targetEmotion = 'neutral';
    this.currentParams = { ...EMOTION_PROFILES.neutral };
    this.targetParams = { ...EMOTION_PROFILES.neutral };
  }
}

export const emotionController = new EmotionController('neutral');
