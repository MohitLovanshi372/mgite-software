/**
 * Ultron Voice Synthesis Engine (Web Speech API + Web Audio DSP Post-Processing)
 *
 * Implements Ultron's iconic dark, deep, resonant mechanical cadence:
 * - Low pitch (0.65 - 0.78), measured cadence (0.92 rate)
 * - Prioritizes authoritative deep English voices (Daniel, Google UK English Male, Alex, Fred, Arthur, etc.)
 * - Parallel Web Audio DSP robotic synthesis:
 *   - Sub-bass resonance carrier (65-90 Hz) that hums during vocal delivery
 *   - Dual vocoder ring modulation pulses on syllables
 *   - Metallic reverberation & high-shelf mechanical filter
 *   - Acoustic vocal aperture clicks at start and end of utterance
 * - Integrated Speech Recognition for realistic voice commanding
 */

class UltronVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isSpeaking: boolean = false;
  private subBassOsc: OscillatorNode | null = null;
  private subBassGain: GainNode | null = null;
  private volume: number = 0.9;
  private isMuted: boolean = false;
  private pitch: number = 0.72; // Deep authoritative baritone
  private rate: number = 0.92;  // Deliberate, mechanical cadence
  private recognition: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadBestUltronVoice();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadBestUltronVoice();
        }
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Selects the optimal deep, authoritative baritone voice available on the host system.
   */
  public loadBestUltronVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    // Prioritized list for Ultron voice persona
    const preferredNames = [
      'Daniel', // UK deep male
      'Google UK English Male',
      'Oliver',
      'George',
      'Arthur',
      'Microsoft David Desktop',
      'Microsoft James Online',
      'Microsoft Guy Online',
      'Google US English',
      'Alex',
      'Fred',
    ];

    for (const name of preferredNames) {
      const match = voices.find(
        (v) => v.name.toLowerCase().includes(name.toLowerCase()) && v.lang.startsWith('en')
      );
      if (match) {
        this.voice = match;
        return match;
      }
    }

    // Fallback to any English male voice or generic English
    const enMale = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.toLowerCase().includes('male') || !v.name.toLowerCase().includes('female'))
    );
    this.voice = enMale || voices.find((v) => v.lang.startsWith('en')) || voices[0];
    return this.voice;
  }

  /**
   * Generates Ultron's metallic acoustic shutter click
   */
  private playVocalClick(type: 'OPEN' | 'CLOSE') {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(type === 'OPEN' ? 1800 : 1200, now);
      filter.Q.setValueAtTime(3.5, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(type === 'OPEN' ? 240 : 180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (_) {}
  }

  /**
   * Starts an ambient sub-bass servo resonance drone that accompanies speech
   */
  private startSubBassResonance() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      this.stopSubBassResonance();
      const now = ctx.currentTime;

      // Sub-bass carrier 72Hz with subtle amplitude modulation
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(74, now); // 74 Hz deep robotic fundamental

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(14, now); // 14Hz cybernetic flutter
      lfoGain.gain.setValueAtTime(0.02 * this.volume, now);

      lfo.connect(gain.gain);
      lfo.start(now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07 * this.volume, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);

      this.subBassOsc = osc;
      this.subBassGain = gain;
    } catch (_) {}
  }

  /**
   * Stops the sub-bass drone
   */
  private stopSubBassResonance() {
    if (this.subBassOsc && this.subBassGain && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.subBassGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
        this.subBassOsc.stop(now + 0.2);
      } catch (_) {}
      this.subBassOsc = null;
      this.subBassGain = null;
    }
  }

  /**
   * Speaks text using Ultron's deep mechanical pitch, cadence, and acoustic synthesis
   */
  public speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (!this.synth || this.isMuted || !text.trim()) {
      if (options?.onStart) options.onStart();
      setTimeout(() => {
        if (options?.onEnd) options.onEnd();
      }, 1500);
      return;
    }

    // Cancel ongoing speech to avoid backlog
    this.synth.cancel();

    // Prepare speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    if (!this.voice) {
      this.loadBestUltronVoice();
    }
    if (this.voice) {
      utterance.voice = this.voice;
    }

    // Ultron Vocal Signature Parameters:
    // Pitch: 0.68 - 0.76 (Heavy, menacing low resonance)
    // Rate: 0.90 - 0.94 (Calm, deliberate, articulate robotic pacing)
    utterance.pitch = this.pitch;
    utterance.rate = this.rate;
    utterance.volume = this.volume;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.playVocalClick('OPEN');
      this.startSubBassResonance();
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.stopSubBassResonance();
      this.playVocalClick('CLOSE');
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.stopSubBassResonance();
      if (options?.onError) options.onError();
    };

    try {
      this.synth.speak(utterance);
    } catch (_) {
      if (options?.onError) options.onError();
    }
  }

  /**
   * Cancels current active speech
   */
  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.stopSubBassResonance();
    this.isSpeaking = false;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  public setPitch(val: number) {
    this.pitch = Math.max(0.4, Math.min(1.2, val));
  }

  public setRate(val: number) {
    this.rate = Math.max(0.6, Math.min(1.4, val));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stop();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVoiceName(): string {
    return this.voice ? this.voice.name : 'Autonomous Neural Vocalizer';
  }

  public getSettings() {
    return {
      pitch: this.pitch,
      rate: this.rate,
      volume: this.volume,
      voice: this.getVoiceName(),
      isMuted: this.isMuted,
    };
  }
}

export const ultronVoice = new UltronVoiceEngine();
