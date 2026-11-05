/**
 * Avatar State Controller (Phase 5 - Section 4)
 *
 * Manages the state machine:
 * IDLE, LISTENING, THINKING, SPEAKING, HAPPY, SAD, SURPRISED, CONFUSED, SERIOUS, EXCITED, ERROR
 *
 * Features:
 * - Smooth transition easing between states
 * - Transition progress tracking (0.0 to 1.0)
 * - Validation of valid state names
 * - Automatic timeout/return to IDLE when appropriate
 */

import { AvatarState } from './types.ts';

export const ALL_AVATAR_STATES: AvatarState[] = [
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
];

export class AvatarStateManager {
  private currentState: AvatarState = 'IDLE';
  private previousState: AvatarState = 'IDLE';
  private targetState: AvatarState = 'IDLE';
  private transitionProgress: number = 1.0;
  private transitionDurationMs: number = 300; // 300ms default transition
  private transitionStartTime: number = Date.now();
  private stateChangeListeners: Set<(current: AvatarState, prev: AvatarState) => void> = new Set();
  private autoReturnTimer: any = null;

  constructor(initialState: AvatarState = 'IDLE') {
    this.currentState = initialState;
    this.targetState = initialState;
  }

  public isValidState(state: string): state is AvatarState {
    return ALL_AVATAR_STATES.includes(state as AvatarState);
  }

  public getState(): AvatarState {
    return this.currentState;
  }

  public getPreviousState(): AvatarState {
    return this.previousState;
  }

  public getTargetState(): AvatarState {
    return this.targetState;
  }

  public getTransitionProgress(): number {
    const elapsed = Date.now() - this.transitionStartTime;
    if (elapsed >= this.transitionDurationMs) {
      this.transitionProgress = 1.0;
      this.currentState = this.targetState;
      return 1.0;
    }
    this.transitionProgress = Math.min(1.0, elapsed / this.transitionDurationMs);
    return this.transitionProgress;
  }

  /**
   * Smoothly transitions the avatar to a new state.
   */
  public transitionTo(
    nextState: AvatarState,
    options?: {
      durationMs?: number;
      autoReturnMs?: number;
      returnToState?: AvatarState;
    }
  ): boolean {
    if (!this.isValidState(nextState)) {
      console.warn(`[AvatarStateManager] Invalid state transition rejected: ${nextState}`);
      return false;
    }

    if (this.autoReturnTimer) {
      clearTimeout(this.autoReturnTimer);
      this.autoReturnTimer = null;
    }

    if (this.currentState === nextState && this.targetState === nextState) {
      return true; // Already in target state
    }

    this.previousState = this.currentState;
    this.targetState = nextState;
    this.transitionDurationMs = options?.durationMs || 300;
    this.transitionStartTime = Date.now();
    this.transitionProgress = 0.0;

    this.notifyStateChange(nextState, this.previousState);

    // Optional auto-return timer (e.g. for temporary emotional reactions like SURPRISED -> IDLE)
    if (options?.autoReturnMs && options.autoReturnMs > 0) {
      const returnTarget = options.returnToState || 'IDLE';
      this.autoReturnTimer = setTimeout(() => {
        this.transitionTo(returnTarget, { durationMs: 400 });
      }, options.autoReturnMs);
    }

    return true;
  }

  public onStateChange(listener: (current: AvatarState, prev: AvatarState) => void): () => void {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  private notifyStateChange(current: AvatarState, prev: AvatarState): void {
    this.stateChangeListeners.forEach((fn) => {
      try {
        fn(current, prev);
      } catch (err) {
        console.error('[AvatarStateManager] Error in state listener:', err);
      }
    });
  }

  public reset(): void {
    if (this.autoReturnTimer) {
      clearTimeout(this.autoReturnTimer);
      this.autoReturnTimer = null;
    }
    this.currentState = 'IDLE';
    this.previousState = 'IDLE';
    this.targetState = 'IDLE';
    this.transitionProgress = 1.0;
  }
}

export const avatarStateManager = new AvatarStateManager('IDLE');
