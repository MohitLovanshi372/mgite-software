/**
 * Avatar Event Bus (Phase 5 - Section 17)
 *
 * Provides a strongly-typed, validated event bus for decoupled avatar communication.
 * Validates all incoming events before emission.
 * Blocks any sensitive or malformed payloads.
 */

import {
  AvatarEvent,
  AvatarEventType,
  AvatarEventListener,
  AvatarState,
  AvatarEmotion,
  AvatarGesture,
} from './types.ts';

const VALID_EVENT_TYPES: Set<AvatarEventType> = new Set([
  'AVATAR_IDLE',
  'AVATAR_LISTENING',
  'AVATAR_THINKING',
  'AVATAR_SPEAKING',
  'AVATAR_EMOTION',
  'AVATAR_GESTURE',
  'AVATAR_ERROR',
]);

const VALID_STATES: Set<AvatarState> = new Set([
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

const VALID_EMOTIONS: Set<AvatarEmotion> = new Set([
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

const VALID_GESTURES: Set<AvatarGesture> = new Set([
  'nod',
  'tilt',
  'wave',
  'hand_open',
  'thinking',
  'welcome',
  'acknowledgement',
  'none',
]);

export class AvatarEventBus {
  private static instance: AvatarEventBus | null = null;
  private listeners: Map<AvatarEventType, Set<AvatarEventListener>> = new Map();
  private globalListeners: Set<AvatarEventListener> = new Set();
  private eventHistory: AvatarEvent[] = [];
  private readonly maxHistory = 50;

  private constructor() {}

  public static getInstance(): AvatarEventBus {
    if (!AvatarEventBus.instance) {
      AvatarEventBus.instance = new AvatarEventBus();
    }
    return AvatarEventBus.instance;
  }

  /**
   * Validates that an incoming event conforms to the strict schema.
   */
  public validateEvent(event: unknown): event is AvatarEvent {
    if (!event || typeof event !== 'object') return false;

    const candidate = event as Partial<AvatarEvent>;
    if (!candidate.type || !VALID_EVENT_TYPES.has(candidate.type)) {
      return false;
    }

    if (candidate.payload) {
      if (candidate.payload.state && !VALID_STATES.has(candidate.payload.state)) {
        return false;
      }
      if (candidate.payload.emotion && !VALID_EMOTIONS.has(candidate.payload.emotion)) {
        return false;
      }
      if (candidate.payload.gesture && !VALID_GESTURES.has(candidate.payload.gesture)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Emits a validated avatar event. Rejects invalid events.
   */
  public emit(event: AvatarEvent): boolean {
    if (!this.validateEvent(event)) {
      console.warn('[AvatarEventBus] Rejected invalid avatar event:', event);
      return false;
    }

    // Safety: ensure timestamp
    const safeEvent: AvatarEvent = {
      ...event,
      timestamp: typeof event.timestamp === 'number' ? event.timestamp : Date.now(),
    };

    // Store in history
    this.eventHistory.unshift(safeEvent);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Dispatch to type-specific listeners
    const typeSet = this.listeners.get(safeEvent.type);
    if (typeSet) {
      typeSet.forEach((listener) => {
        try {
          listener(safeEvent);
        } catch (err) {
          console.error(`[AvatarEventBus] Error in listener for ${safeEvent.type}:`, err);
        }
      });
    }

    // Dispatch to global listeners
    this.globalListeners.forEach((listener) => {
      try {
        listener(safeEvent);
      } catch (err) {
        console.error('[AvatarEventBus] Error in global listener:', err);
      }
    });

    return true;
  }

  /**
   * Emits convenience event for state transitions.
   */
  public emitState(state: AvatarState, source?: string): boolean {
    const typeMap: Record<AvatarState, AvatarEventType> = {
      IDLE: 'AVATAR_IDLE',
      LISTENING: 'AVATAR_LISTENING',
      THINKING: 'AVATAR_THINKING',
      SPEAKING: 'AVATAR_SPEAKING',
      HAPPY: 'AVATAR_EMOTION',
      SAD: 'AVATAR_EMOTION',
      SURPRISED: 'AVATAR_EMOTION',
      CONFUSED: 'AVATAR_EMOTION',
      SERIOUS: 'AVATAR_EMOTION',
      EXCITED: 'AVATAR_EMOTION',
      ERROR: 'AVATAR_ERROR',
    };

    const type = typeMap[state] || 'AVATAR_IDLE';
    return this.emit({
      type,
      payload: { state, source },
      timestamp: Date.now(),
    });
  }

  /**
   * Emits convenience event for emotions.
   */
  public emitEmotion(emotion: AvatarEmotion, source?: string): boolean {
    return this.emit({
      type: 'AVATAR_EMOTION',
      payload: { emotion, source },
      timestamp: Date.now(),
    });
  }

  /**
   * Emits convenience event for gestures.
   */
  public emitGesture(gesture: AvatarGesture, source?: string): boolean {
    return this.emit({
      type: 'AVATAR_GESTURE',
      payload: { gesture, source },
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribes to a specific event type.
   */
  public on(type: AvatarEventType, listener: AvatarEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  /**
   * Subscribes to all avatar events.
   */
  public onAny(listener: AvatarEventListener): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  public getHistory(): AvatarEvent[] {
    return [...this.eventHistory];
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }

  public clearListeners(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }
}

export const avatarEventBus = AvatarEventBus.getInstance();
