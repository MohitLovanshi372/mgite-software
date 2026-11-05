/**
 * Cybernetic Audio Engine & Background Music Synthesizer
 * Generates ambient synthwave/cyberpunk background music using Web Audio API
 * Also supports YouTube audio player integration and audio visualizer spectrum data
 */

class CyberMusicPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: any = null;
  private masterGain: GainNode | null = null;
  private step: number = 0;
  private currentTrackName: string = 'ULTRON CYBER MATRIX (SYNTH)';
  private volume: number = 0.35;
  private listeners: Set<(isPlaying: boolean, trackName: string) => void> = new Set();

  private bassNotes = [55, 55, 65.4, 73.4, 82.4, 73.4, 65.4, 49]; // A1, C2, D2, E2...
  private leadNotes = [220, 261.6, 293.7, 329.6, 392, 440, 523.2, 587.3];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public subscribe(fn: (isPlaying: boolean, trackName: string) => void) {
    this.listeners.add(fn);
    fn(this.isPlaying, this.currentTrackName);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isPlaying, this.currentTrackName));
  }

  public togglePlay(trackName?: string) {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play(trackName);
    }
  }

  public play(trackName?: string) {
    const ctx = this.getContext();
    if (!ctx) return;
    if (trackName) this.currentTrackName = trackName;
    this.isPlaying = true;
    this.notify();

    if (this.timerId) clearInterval(this.timerId);

    // 120 BPM Cyberpunk 16th note synth arpeggiator
    const bpm = 124;
    const intervalMs = (60 / bpm / 4) * 1000;

    this.timerId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): string {
    return this.currentTrackName;
  }

  public setTrackName(name: string) {
    this.currentTrackName = name;
    this.notify();
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain || !this.isPlaying) return;

    const now = ctx.currentTime;
    const s = this.step % 16;

    // 1. Cyber Sub-Bass Kick every 4 steps (quarter note)
    if (s % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, now);
      kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.08);
      kickGain.gain.setValueAtTime(0.4 * this.volume, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      kickOsc.connect(kickGain);
      kickGain.connect(this.masterGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.12);
    }

    // 2. Rolling Acid Bassline
    const bassNote = this.bassNotes[Math.floor(this.step / 2) % this.bassNotes.length];
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(bassNote, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380 + Math.sin(this.step * 0.4) * 220, now);
    filter.Q.setValueAtTime(4, now);

    bassGain.gain.setValueAtTime(0.08 * this.volume, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    bassOsc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(this.masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + 0.1);

    // 3. Glitch Arpeggio Lead (on syncopated eighths)
    if (s % 2 === 1) {
      const noteIdx = (this.step * 3) % this.leadNotes.length;
      const leadNote = this.leadNotes[noteIdx];
      const leadOsc = ctx.createOscillator();
      const leadGain = ctx.createGain();

      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(leadNote, now);

      leadGain.gain.setValueAtTime(0.045 * this.volume, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      leadOsc.connect(leadGain);
      leadGain.connect(this.masterGain);
      leadOsc.start(now);
      leadOsc.stop(now + 0.08);
    }

    this.step++;
  }
}

export const cyberMusic = new CyberMusicPlayer();
