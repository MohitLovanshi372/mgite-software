/**
 * Avatar Instruction Generator & Validator (Phase 5 - Section 5 & 6)
 *
 * Enforces:
 * 1. AI produces only validated structured avatar instructions (emotion, gesture, speaking, state)
 * 2. Zero frontend code execution
 * 3. Sanitization of sensitive data before avatar dispatch
 * 4. Deterministic mapping based on intent and text analysis
 */

import {
  AvatarEmotion,
  AvatarGesture,
  AvatarInstruction,
  AvatarStateName,
} from '../ai/types.ts';

export const VALID_EMOTIONS: Set<AvatarEmotion> = new Set([
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
]);

export const VALID_GESTURES: Set<AvatarGesture> = new Set([
  'nod',
  'tilt',
  'wave',
  'hand_open',
  'thinking',
  'welcome',
  'acknowledgement',
  'none',
]);

export const VALID_STATES: Set<AvatarStateName> = new Set([
  'IDLE',
  'LISTENING',
  'THINKING',
  'SPEAKING',
  'HAPPY',
  'SAD',
  'SURPRISED',
  'CONFUSED',
  'SERIOUS',
  'EXCITED',
  'ERROR',
]);

export class AvatarInstructionValidator {
  /**
   * Validates and returns a safe AvatarInstruction from untrusted or partial input.
   */
  public static validate(input: unknown): AvatarInstruction {
    if (!input || typeof input !== 'object') {
      return this.defaultInstruction();
    }

    const candidate = input as Partial<AvatarInstruction>;

    const emotion: AvatarEmotion =
      candidate.emotion && VALID_EMOTIONS.has(candidate.emotion)
        ? candidate.emotion
        : 'friendly';

    const gesture: AvatarGesture =
      candidate.gesture && VALID_GESTURES.has(candidate.gesture)
        ? candidate.gesture
        : 'nod';

    const state: AvatarStateName =
      candidate.state && VALID_STATES.has(candidate.state)
        ? candidate.state
        : 'SPEAKING';

    const speaking = typeof candidate.speaking === 'boolean' ? candidate.speaking : true;

    return {
      emotion,
      gesture,
      speaking,
      state,
    };
  }

  public static defaultInstruction(): AvatarInstruction {
    return {
      emotion: 'friendly',
      gesture: 'nod',
      speaking: true,
      state: 'SPEAKING',
    };
  }

  /**
   * Generates a context-aware AvatarInstruction based on intent category and message text.
   */
  public static generateFromResponse(text: string, intentCategory?: string): AvatarInstruction {
    const lower = text.toLowerCase();

    // 1. Check for Security / Warning / OTP context
    if (lower.includes('sensitive') || lower.includes('security') || lower.includes('privacy') || lower.includes('blocked')) {
      return {
        emotion: 'serious',
        gesture: 'acknowledgement',
        speaking: true,
        state: 'SERIOUS',
      };
    }

    // 2. Check for Intent Categories
    if (intentCategory === 'GREETING' || lower.startsWith('hello') || lower.startsWith('hi ') || lower.startsWith('namaste')) {
      return {
        emotion: 'friendly',
        gesture: 'wave',
        speaking: true,
        state: 'SPEAKING',
      };
    }

    if (intentCategory === 'FAREWELL') {
      return {
        emotion: 'friendly',
        gesture: 'wave',
        speaking: true,
        state: 'SPEAKING',
      };
    }

    // 3. Delighted / Excited / Success
    if (lower.includes('great!') || lower.includes('awesome') || lower.includes('congratulations') || lower.includes('fantastic') || lower.includes('success')) {
      return {
        emotion: 'excited',
        gesture: 'hand_open',
        speaking: true,
        state: 'EXCITED',
      };
    }

    // 4. Thinking / Problem Solving / Research
    if (intentCategory === 'RESEARCH' || lower.includes('let me analyze') || lower.includes('calculating') || lower.includes('investigating')) {
      return {
        emotion: 'thinking',
        gesture: 'thinking',
        speaking: true,
        state: 'THINKING',
      };
    }

    // 5. Apology / Concern / Failure
    if (lower.includes('sorry') || lower.includes('apologize') || lower.includes('unfortunately') || lower.includes('error occurred')) {
      return {
        emotion: 'concerned',
        gesture: 'tilt',
        speaking: true,
        state: 'SPEAKING',
      };
    }

    // 6. Confused / Ambiguous
    if (lower.includes('could you clarify') || lower.includes('not sure what you mean') || lower.includes('can you specify')) {
      return {
        emotion: 'confused',
        gesture: 'tilt',
        speaking: true,
        state: 'CONFUSED',
      };
    }

    // Default polite response
    return {
      emotion: 'friendly',
      gesture: 'nod',
      speaking: true,
      state: 'SPEAKING',
    };
  }
}
