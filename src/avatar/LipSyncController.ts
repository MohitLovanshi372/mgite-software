/**
 * Lip Sync Controller (Phase 5 - Section 9 & 10)
 *
 * Provides mouth animation driven by TTS audio analysis and speech timing:
 * - Decoupled modular ILipSyncProvider architecture
 * - AudioAmplitudeLipSyncProvider for real audio frequency / amplitude tracking
 * - Organic speech-envelope fallback when timing-based audio plays
 * - Attack and decay smoothing for lifelike mouth opening without robotic clipping
 * - Zero API keys, zero external backend credentials
 */

import { ILipSyncProvider, LipSyncFrame } from './types.ts';

/**
 * Amplitude & Cadence-based Lip Sync Provider
 * Analyzes audio amplitude or generates organic syllable cadence envelopes.
 */
export class AudioAmplitudeLipSyncProvider implements ILipSyncProvider {
  public readonly name = 'AudioAmplitudeLipSyncProvider';
  private active = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private speechStartTime = 0;
  private currentOpenness = 0;

  public start(audioElement?: HTMLAudioElement | null): void {
    this.active = true;
    this.speechStartTime = Date.now();
    this.audioElement = audioElement || null;

    if (this.audioElement && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx && !this.audioContext) {
          this.audioContext = new AudioCtx();
          const source = this.audioContext.createMediaElementSource(this.audioElement);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 128;
          this.analyser.smoothingTimeConstant = 0.4;
          source.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
          this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
      } catch {
        // Fall back to cadence envelope if media element audio context is restricted
        this.analyser = null;
      }
    }
  }

  public stop(): void {
    this.active = false;
    this.currentOpenness = 0;
    this.audioElement = null;
  }

  public isActive(): boolean {
    return this.active;
  }

  public getCurrentFrame(): LipSyncFrame {
    if (!this.active) {
      // Smooth decay to zero
      this.currentOpenness *= 0.7;
      if (this.currentOpenness < 0.01) this.currentOpenness = 0;
      return { mouthOpenness: this.currentOpenness, mouthWidth: 0.5 };
    }

    let targetOpenness = 0;

    // 1. If real analyser is connected to playing audio element
    if (this.analyser && this.dataArray && this.audioContext?.state === 'running') {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      // Focus on vocal formant frequencies (bins 2 to 24: ~300Hz to 3kHz)
      const startBin = 2;
      const endBin = Math.min(24, this.dataArray.length);
      for (let i = startBin; i < endBin; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / (endBin - startBin);
      targetOpenness = Math.min(1.0, (avg / 128) * 1.2);
    } else {
      // 2. Organic speech cadence model (human syllable rhythm ~4 Hz with dynamic amplitude variations)
      const t = (Date.now() - this.speechStartTime) / 1000;
      const syllableOsc = Math.sin(t * 4.2 * Math.PI); // ~4.2 Hz primary syllable rate
      const wordEnvelope = 0.5 + 0.5 * Math.sin(t * 1.5 * Math.PI); // word boundary rhythm
      const microJitter = 0.15 * Math.sin(t * 9.7 * Math.PI);

      if (syllableOsc > 0) {
        targetOpenness = Math.min(0.9, (syllableOsc * 0.7 + microJitter) * wordEnvelope);
      } else {
        targetOpenness = 0.05 * wordEnvelope; // slight resting open
      }
    }

    // Exponential smoothing for natural fleshy lip movement
    const lerpRate = targetOpenness > this.currentOpenness ? 0.35 : 0.25;
    this.currentOpenness += (targetOpenness - this.currentOpenness) * lerpRate;

    return {
      mouthOpenness: Math.max(0, Math.min(1, this.currentOpenness)),
      mouthWidth: 0.5 + 0.1 * Math.sin((Date.now() - this.speechStartTime) / 250),
    };
  }
}

export class LipSyncController {
  private provider: ILipSyncProvider;
  private isSpeaking = false;
  private currentFrame: LipSyncFrame = { mouthOpenness: 0, mouthWidth: 0.5 };

  constructor(provider?: ILipSyncProvider) {
    this.provider = provider || new AudioAmplitudeLipSyncProvider();
  }

  public setProvider(provider: ILipSyncProvider): void {
    const wasSpeaking = this.isSpeaking;
    if (wasSpeaking) {
      this.provider.stop();
    }
    this.provider = provider;
    if (wasSpeaking) {
      this.provider.start();
    }
  }

  public getProvider(): ILipSyncProvider {
    return this.provider;
  }

  public startSpeaking(audioElement?: HTMLAudioElement | null): void {
    this.isSpeaking = true;
    this.provider.start(audioElement);
  }

  public stopSpeaking(): void {
    this.isSpeaking = false;
    this.provider.stop();
    this.currentFrame = { mouthOpenness: 0, mouthWidth: 0.5 };
  }

  public update(): LipSyncFrame {
    if (!this.isSpeaking && this.currentFrame.mouthOpenness === 0) {
      return this.currentFrame;
    }

    this.currentFrame = this.provider.getCurrentFrame();
    return this.currentFrame;
  }

  public getOpenness(): number {
    return this.currentFrame.mouthOpenness;
  }

  public reset(): void {
    this.stopSpeaking();
  }
}

export const lipSyncController = new LipSyncController();
