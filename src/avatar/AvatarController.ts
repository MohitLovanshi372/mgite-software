/**
 * Central Avatar Controller (Phase 5 - Section 3, 5, 10, 18)
 *
 * Primary facade and orchestrator for the 3D Avatar system:
 * - Bridges AI responses to avatar emotions, gestures, states, and lip-sync
 * - Coordinates sub-controllers in a unified, safe runtime
 * - Enforces zero-code-execution security invariant: AI can only emit validated structured instructions
 * - Strict sensitive-data lockout: OTPs/passwords never reach avatar or speech
 * - Connects to audio playback from Voice Engine / ElevenLabs for mouth synchronization
 */

import {
  AvatarEmotion,
  AvatarGesture,
  AvatarInstruction,
  AvatarSettingsConfig,
  AvatarState,
} from './types.ts';
import { AvatarStateManager, avatarStateManager } from './AvatarState.ts';
import { EmotionController, emotionController } from './EmotionController.ts';
import { GestureController, gestureController } from './GestureController.ts';
import { LipSyncController, lipSyncController } from './LipSyncController.ts';
import { EyeController, eyeController } from './EyeController.ts';
import { HeadMovementController, headMovementController } from './HeadMovementController.ts';
import { AvatarAnimationController, avatarAnimationController } from './AvatarAnimationController.ts';
import { AvatarEventBus, avatarEventBus } from './AvatarEventBus.ts';
import { AvatarSettings, avatarSettings } from './AvatarSettings.ts';
import { PrivacyFilter } from '../../core/security/privacyFilter.ts';

export class AvatarController {
  private static instance: AvatarController | null = null;

  public stateManager: AvatarStateManager = avatarStateManager;
  public emotionCtrl: EmotionController = emotionController;
  public gestureCtrl: GestureController = gestureController;
  public lipSyncCtrl: LipSyncController = lipSyncController;
  public eyeCtrl: EyeController = eyeController;
  public headCtrl: HeadMovementController = headMovementController;
  public animationCtrl: AvatarAnimationController = avatarAnimationController;
  public eventBus: AvatarEventBus = avatarEventBus;
  public settings: AvatarSettings = avatarSettings;

  private isSpeaking = false;
  private currentSettings: AvatarSettingsConfig;
  private unsubscribeSettings: (() => void) | null = null;
  private unsubscribeEvents: (() => void) | null = null;

  private constructor() {
    this.currentSettings = this.settings.getSettings();
    this.initListeners();
  }

  public static getInstance(): AvatarController {
    if (!AvatarController.instance) {
      AvatarController.instance = new AvatarController();
    }
    return AvatarController.instance;
  }

  private initListeners(): void {
    // 1. Settings updates
    this.unsubscribeSettings = this.settings.subscribe((newCfg) => {
      this.currentSettings = newCfg;
      this.animationCtrl.setQuality(newCfg.quality);
    });

    // 2. Event bus integrations
    this.unsubscribeEvents = this.eventBus.onAny((event) => {
      switch (event.type) {
        case 'AVATAR_IDLE':
          this.stateManager.transitionTo('IDLE');
          break;
        case 'AVATAR_LISTENING':
          this.stateManager.transitionTo('LISTENING');
          this.emotionCtrl.setEmotion('friendly');
          this.gestureCtrl.triggerGesture('nod');
          break;
        case 'AVATAR_THINKING':
          this.stateManager.transitionTo('THINKING');
          this.emotionCtrl.setEmotion('thinking');
          this.gestureCtrl.triggerGesture('thinking');
          break;
        case 'AVATAR_SPEAKING':
          this.stateManager.transitionTo('SPEAKING');
          break;
        case 'AVATAR_EMOTION':
          if (event.payload?.emotion) {
            this.emotionCtrl.setEmotion(event.payload.emotion);
          }
          break;
        case 'AVATAR_GESTURE':
          if (event.payload?.gesture) {
            this.gestureCtrl.triggerGesture(event.payload.gesture);
          }
          break;
        case 'AVATAR_ERROR':
          this.stateManager.transitionTo('ERROR', { autoReturnMs: 4000 });
          this.emotionCtrl.setEmotion('concerned');
          break;
      }
    });
  }

  /**
   * Processes structured AI response output.
   * Enforces zero code execution and sensitive data filtering.
   */
  public handleAIResponse(output: {
    response?: string;
    text?: string;
    avatar?: Partial<AvatarInstruction>;
    emotion?: string;
    gesture?: string;
    state?: string;
  }): boolean {
    const rawText = output.response || output.text || '';

    // Security check: ensure no sensitive credentials or OTP are present
    const privacy = PrivacyFilter.filterInput(rawText);
    if (privacy.shouldAbortExternalCall || privacy.action === 'BLOCK' || privacy.classification === 'OTP') {
      console.warn('[AvatarController] Sensitive content blocked before avatar processing.');
      this.stateManager.transitionTo('SERIOUS');
      this.emotionCtrl.setEmotion('serious');
      return false;
    }

    // Resolve instruction safely
    const requestedEmotion = (output.avatar?.emotion || output.emotion || 'friendly') as AvatarEmotion;
    const requestedGesture = (output.avatar?.gesture || output.gesture || 'nod') as AvatarGesture;
    const requestedState = (output.avatar?.state || output.state || 'SPEAKING') as AvatarState;

    if (this.currentSettings.emotionReactionsEnabled) {
      if (this.emotionCtrl.isValidEmotion(requestedEmotion)) {
        this.emotionCtrl.setEmotion(requestedEmotion);
      }
    }

    if (this.currentSettings.gesturesEnabled) {
      if (this.gestureCtrl.isValidGesture(requestedGesture)) {
        this.gestureCtrl.triggerGesture(requestedGesture);
      }
    }

    if (this.stateManager.isValidState(requestedState)) {
      this.stateManager.transitionTo(requestedState);
    }

    return true;
  }

  /**
   * Sets avatar state.
   */
  public setState(state: AvatarState): boolean {
    const success = this.stateManager.transitionTo(state);
    if (success) {
      this.eventBus.emitState(state, 'AvatarController.setState');
    }
    return success;
  }

  /**
   * Sets avatar emotion.
   */
  public setEmotion(emotion: AvatarEmotion): boolean {
    const success = this.emotionCtrl.setEmotion(emotion);
    if (success) {
      this.eventBus.emitEmotion(emotion, 'AvatarController.setEmotion');
    }
    return success;
  }

  /**
   * Triggers a gesture.
   */
  public playGesture(gesture: AvatarGesture): boolean {
    const success = this.gestureCtrl.triggerGesture(gesture);
    if (success) {
      this.eventBus.emitGesture(gesture, 'AvatarController.playGesture');
    }
    return success;
  }

  /**
   * Starts speaking & lip synchronization.
   */
  public startSpeaking(audioElement?: HTMLAudioElement | null): void {
    if (!this.currentSettings.enabled) return;

    this.isSpeaking = true;
    this.stateManager.transitionTo('SPEAKING');
    this.lipSyncCtrl.startSpeaking(audioElement);
    this.eventBus.emit({
      type: 'AVATAR_SPEAKING',
      payload: { state: 'SPEAKING' },
      timestamp: Date.now(),
    });
  }

  /**
   * Stops speaking and smoothly returns mouth to rest.
   */
  public stopSpeaking(): void {
    this.isSpeaking = false;
    this.lipSyncCtrl.stopSpeaking();
    this.stateManager.transitionTo('IDLE', { durationMs: 400 });
    this.eventBus.emit({
      type: 'AVATAR_IDLE',
      payload: { state: 'IDLE' },
      timestamp: Date.now(),
    });
  }

  /**
   * Evaluates a frame of animation.
   */
  public evaluateFrame(timestamp: number = Date.now()) {
    return this.animationCtrl.evaluateFrame(timestamp, this.currentSettings);
  }

  public destroy(): void {
    if (this.unsubscribeSettings) this.unsubscribeSettings();
    if (this.unsubscribeEvents) this.unsubscribeEvents();
    this.lipSyncCtrl.reset();
  }
}

export const avatarController = AvatarController.getInstance();
