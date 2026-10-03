/**
 * Web Audio API Acoustic Synthesizer
 * Provides realistic cinematic observatory and mechanical HUD sounds without external audio files.
 */

import { AIStateMode } from '../types/index.ts';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private extraSoundEnabled: boolean = false; // Default FALSE: "Clear voice not extra sound"

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jarvis_extra_sound_effects');
      // Default to false (muted extra sound) to guarantee pure, clear voice output
      this.extraSoundEnabled = saved === 'true';
    }
  }

  public isExtraSoundEnabled(): boolean {
    return this.extraSoundEnabled;
  }

  public setExtraSoundEnabled(enabled: boolean) {
    this.extraSoundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('jarvis_extra_sound_effects', String(enabled));
      window.dispatchEvent(
        new CustomEvent('jarvis_extra_sound_changed', { detail: { enabled } })
      );
    }
  }

  public toggleExtraSound(): boolean {
    const next = !this.extraSoundEnabled;
    this.setExtraSoundEnabled(next);
    return next;
  }

  private getContext(): AudioContext | null {
    if (!this.extraSoundEnabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playStateSound(state: AIStateMode) {
    if (!this.extraSoundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      switch (state) {
        case 'LISTENING': {
          // Dual rising chirp
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'THINKING': {
          // Rapid cybernetic arpeggio
          [520, 680, 840].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            gain.gain.setValueAtTime(0.05, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.08);
          });
          break;
        }

        case 'EXECUTING': {
          // Heavy bass kinetic mechanical strike
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        case 'SPEAKING': {
          // Mechanical vocal shutter click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'SUCCESS': {
          // Resonant harmonic chord
          [440, 554, 659].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
          });
          break;
        }

        case 'ERROR': {
          // Low saw buzzer
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        case 'SECURITY_ALERT': {
          // Stark crimson alarm klaxon
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        case 'IDLE':
        default:
          break;
      }
    } catch {
      // Ignore audio synthesis errors on blocked browsers
    }
  }

  public playSuccess() {
    this.playStateSound('SUCCESS');
  }

  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Ignore
    }
  }

  public playSend() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  public playHover() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // Ignore
    }
  }

  public playNotificationPing() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // High-pitched dual acoustic ping
      [1440, 1920].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.045, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.12);
      });
    } catch {
      // Ignore
    }
  }

  public playThemeWarp() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Ethereal celestial warp sweep
      [220, 330, 440, 660].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + idx * 0.02 + 0.35);
        gain.gain.setValueAtTime(0.001, now + idx * 0.02);
        gain.gain.linearRampToValueAtTime(0.035, now + idx * 0.02 + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.02 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + idx * 0.02 + 0.56);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new SoundSynthesizer();
