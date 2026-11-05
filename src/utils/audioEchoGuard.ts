/**
 * Audio Echo Guard & Hardware Latency Buffer System
 *
 * Prevents assistant from hearing its own voice echo and talking itself into replying:
 * - Measures hardware output latency directly from AudioContext (outputLatency + baseLatency).
 * - Opens a dynamically sized guard window across the acoustic gap when speech playback finishes.
 * - Suppresses assistant's self-echo while allowing instant user replies.
 * - Mid-sentence voice interruption is deliberately kept OFF in this release.
 */

export class AudioEchoGuard {
  private static instance: AudioEchoGuard | null = null;
  private audioCtx: AudioContext | null = null;
  private lastSpokenText: string = '';
  private lastSpokenNormalized: string = '';
  private playbackEndTime: number = 0;
  private isAssistantActivelySpeaking: boolean = false;

  private constructor() {
    this.initAudioContext();
  }

  public static getInstance(): AudioEchoGuard {
    if (!AudioEchoGuard.instance) {
      AudioEchoGuard.instance = new AudioEchoGuard();
    }
    return AudioEchoGuard.instance;
  }

  private initAudioContext(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (_) {
      // AudioContext not allowed before user gesture or unavailable
    }
  }

  /**
   * Calculates the hardware acoustic latency guard window in milliseconds.
   * Dynamically adapts to device-reported baseLatency + outputLatency.
   */
  public getReportedLatencyMs(): number {
    let latencySec = 0.15; // 150ms default fallback
    if (this.audioCtx) {
      const base = this.audioCtx.baseLatency || 0.05;
      const output = (this.audioCtx as any).outputLatency || 0.08;
      latencySec = Math.max(0.1, base + output);
    }
    // Convert to ms plus a 60ms acoustic room reverb tail margin
    return Math.round((latencySec + 0.06) * 1000);
  }

  /**
   * Called when assistant begins vocal playback
   */
  public onSpeechStart(text: string): void {
    this.isAssistantActivelySpeaking = true;
    this.lastSpokenText = text;
    this.lastSpokenNormalized = this.normalize(text);
  }

  /**
   * Called when assistant vocal buffer playback reports finished
   */
  public onSpeechEnd(): void {
    this.isAssistantActivelySpeaking = false;
    this.playbackEndTime = performance.now();
  }

  /**
   * Evaluates if incoming microphone transcript is assistant self-echo or within the latency gap
   */
  public isAcousticEcho(incomingTranscript: string): boolean {
    if (!incomingTranscript) return false;

    const now = performance.now();
    const latencyGuardMs = this.getReportedLatencyMs();
    const timeSinceEnd = now - this.playbackEndTime;

    // 1. If assistant is still actively speaking, any incoming identical words are immediate acoustic bleed
    if (this.isAssistantActivelySpeaking) {
      return true;
    }

    // 2. Check if we are within the hardware latency gap
    if (timeSinceEnd < latencyGuardMs) {
      const normalizedIncoming = this.normalize(incomingTranscript);
      // If the incoming text matches the tail of what the assistant just spoke, it's an echo
      if (
        this.lastSpokenNormalized &&
        (this.lastSpokenNormalized.includes(normalizedIncoming) ||
          normalizedIncoming.includes(this.lastSpokenNormalized.slice(-30)))
      ) {
        console.info(
          `[AudioEchoGuard] Suppressed assistant self-echo within ${latencyGuardMs}ms hardware latency gap: "${incomingTranscript}"`
        );
        return true;
      }
    }

    return false;
  }

  private normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }
}

export const audioEchoGuard = AudioEchoGuard.getInstance();
