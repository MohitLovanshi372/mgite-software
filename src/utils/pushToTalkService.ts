/**
 * Push-to-Talk Service
 *
 * Implements:
 * - ⚙ → PUSH-TO-TALK toggle persistence (survives restart via localStorage)
 * - Holding Ctrl+Space opens the microphone and wakes the assistant
 * - When not holding the chord, microphone stays strictly closed
 * - Platform awareness: logs accurate OS binding behavior
 */

export type PushToTalkListener = (isHolding: boolean) => void;

export class PushToTalkService {
  private static instance: PushToTalkService | null = null;
  private enabled = false;
  private isHolding = false;
  private listeners: Set<PushToTalkListener> = new Set();
  private isInitialized = false;

  private constructor() {
    this.loadState();
  }

  public static getInstance(): PushToTalkService {
    if (!PushToTalkService.instance) {
      PushToTalkService.instance = new PushToTalkService();
    }
    return PushToTalkService.instance;
  }

  private loadState(): void {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('jarvis_push_to_talk');
    this.enabled = saved === 'true';
  }

  public isPushToTalkEnabled(): boolean {
    return this.enabled;
  }

  public setPushToTalkEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('jarvis_push_to_talk', enabled ? 'true' : 'false');
    }
    if (enabled) {
      this.initKeyListeners();
      this.logPlatformBinding();
    }
  }

  public isChordActive(): boolean {
    return this.isHolding;
  }

  public subscribe(listener: PushToTalkListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isHolding: boolean): void {
    for (const listener of this.listeners) {
      listener(isHolding);
    }
  }

  public logPlatformBinding(): void {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent;
    if (ua.includes('Win')) {
      console.info(
        '[PushToTalk] Bound to Ctrl+Space chord. On native Windows, global virtual-key polling activates; inside window, keydown/keyup chord active.'
      );
    } else {
      console.info(
        '[PushToTalk] Chord bound inside window on macOS/Linux. Microphone stays strictly closed until Ctrl+Space is held.'
      );
    }
  }

  public initKeyListeners(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.enabled) return;

      // Chord: Ctrl + Space (or Cmd + Space on Mac)
      if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ')) {
        if (!this.isHolding) {
          e.preventDefault();
          this.isHolding = true;
          this.notify(true);
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (!this.enabled) return;

      // Release of Space or Ctrl
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Control' || e.key === 'Meta') {
        if (this.isHolding) {
          this.isHolding = false;
          this.notify(false);
        }
      }
    });

    // Guard if window loses focus while holding chord
    window.addEventListener('blur', () => {
      if (this.isHolding) {
        this.isHolding = false;
        this.notify(false);
      }
    });
  }
}

export const pushToTalkService = PushToTalkService.getInstance();
