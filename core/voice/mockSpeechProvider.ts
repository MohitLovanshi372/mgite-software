/**
 * Mock Voice Providers for Headless, Node.js, and Automated Testing environments
 *
 * Implements SpeechToTextProvider and TextToSpeechProvider with deterministic
 * responses, mock voices, error simulation, and speech transcript verification.
 */

import {
  SpeechToTextProvider,
  TextToSpeechProvider,
  STTResult,
  SpeechVoice,
  SpeechToTextOptions,
  SpeakOptions,
} from './types.ts';
import { logger } from '../logger.ts';

export class MockSpeechToTextProvider implements SpeechToTextProvider {
  public readonly id = 'mock_stt';
  public readonly name = 'Mock Speech to Text';

  private listening = false;
  private queuedTranscript: string | null = null;
  private queuedError: Error | null = null;
  private shouldFailPermission = false;
  private simulatedLanguage = 'en-US';
  private activeOptions: SpeechToTextOptions | null = null;

  public isAvailable(): boolean {
    return true;
  }

  public isListening(): boolean {
    return this.listening;
  }

  public setSimulatedPermission(granted: boolean): void {
    this.shouldFailPermission = !granted;
  }

  public setPermissionDenied(denied: boolean): void {
    this.shouldFailPermission = denied;
  }

  public async requestPermission(): Promise<boolean> {
    return !this.shouldFailPermission;
  }

  public setQueuedTranscript(transcript: string, lang = 'en-US'): void {
    this.queuedTranscript = transcript;
    this.simulatedLanguage = lang;
    this.queuedError = null;
    this.shouldFailPermission = false;
  }

  public queueTranscript(transcript: string, lang = 'en-US'): void {
    this.setQueuedTranscript(transcript, lang);
  }

  public setSimulatedFailure(fail: boolean): void {
    if (fail) {
      this.queuedError = new Error('Simulated STT hardware failure');
    } else {
      this.queuedError = null;
    }
  }

  public queueError(err: Error): void {
    this.queuedError = err;
    this.queuedTranscript = null;
  }

  public getStoredAudioBuffer(): any {
    // Ephemeral verification: returns null (no persistent audio on disk)
    return null;
  }

  public async startListening(options: SpeechToTextOptions): Promise<void> {
    if (this.shouldFailPermission) {
      this.listening = false;
      const permErr = new Error('Microphone permission denied');
      (permErr as any).code = 'not-allowed';
      options.onError(permErr);
      options.onEnd();
      throw permErr;
    }

    if (this.queuedError) {
      this.listening = false;
      options.onError(this.queuedError);
      options.onEnd();
      throw this.queuedError;
    }

    this.listening = true;
    this.activeOptions = options;

    if (this.queuedTranscript && this.queuedTranscript.trim()) {
      if (options.onInterim) {
        options.onInterim(this.queuedTranscript.slice(0, Math.floor(this.queuedTranscript.length / 2)));
      }
    }
  }

  public async stopListening(): Promise<STTResult | null> {
    this.listening = false;
    const text = this.queuedTranscript !== null ? this.queuedTranscript : '';
    const res: STTResult = {
      transcript: text,
      confidence: 0.95,
      isFinal: true,
      detectedLanguage: this.simulatedLanguage,
    };
    if (this.activeOptions?.onResult) {
      this.activeOptions.onResult(res);
    }
    if (this.activeOptions?.onEnd) {
      this.activeOptions.onEnd();
    }
    this.activeOptions = null;
    this.queuedTranscript = null;
    return res;
  }

  public cancel(): void {
    this.listening = false;
    this.queuedTranscript = null;
    this.queuedError = null;
    this.activeOptions = null;
  }
}

export class MockTextToSpeechProvider implements TextToSpeechProvider {
  public readonly id = 'mock_tts';
  public readonly name = 'Mock Text to Speech';

  private speaking = false;
  private paused = false;
  private activeVoiceId = 'mock_en_1';
  private activeLang = 'en-US';
  private activeRate = 1.0;
  private activeVolume = 1.0;
  private shouldFail = false;

  public spokenTexts: string[] = [];

  public get spokenHistory(): string[] {
    return this.spokenTexts;
  }

  public getLastSpoken(): string {
    return this.spokenTexts[this.spokenTexts.length - 1] || '';
  }

  public isAvailable(): boolean {
    return true;
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  public setSimulatedFailure(fail: boolean): void {
    this.shouldFail = fail;
  }

  public async getVoices(): Promise<SpeechVoice[]> {
    return [
      { id: 'mock_en_1', name: 'Mock Natural English (Male)', lang: 'en-US', isDefault: true },
      { id: 'mock_en_2', name: 'Mock Natural English (Female)', lang: 'en-IN' },
      { id: 'mock_hi_1', name: 'Mock Hindi Voice (Lekha)', lang: 'hi-IN' },
      { id: 'mock_hi_2', name: 'Mock Hindi Voice (Neerja)', lang: 'hi-IN' },
    ];
  }

  public async getAvailableVoices(): Promise<SpeechVoice[]> {
    return this.getVoices();
  }

  public setVoice(voiceId: string): void {
    this.activeVoiceId = voiceId;
  }

  public setLanguage(lang: string): void {
    this.activeLang = lang;
  }

  public setRate(rate: number): void {
    this.activeRate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setVolume(volume: number): void {
    this.activeVolume = Math.max(0.0, Math.min(1.0, volume));
  }

  public async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (this.shouldFail) {
      const err = new Error('TTS hardware output device failure');
      if (options?.onError) options.onError(err);
      throw err;
    }

    this.speaking = true;
    this.paused = false;
    this.spokenTexts.push(text);

    if (options?.onStart) {
      options.onStart();
    }

    // Simulate speech playback
    return new Promise((resolve) => {
      setTimeout(() => {
        this.speaking = false;
        if (options?.onEnd) {
          options.onEnd();
        }
        resolve();
      }, 15);
    });
  }

  public stop(): void {
    this.speaking = false;
    this.paused = false;
  }

  public pause(): void {
    if (this.speaking) {
      this.paused = true;
    }
  }

  public resume(): void {
    if (this.paused) {
      this.paused = false;
    }
  }

  public clearHistory(): void {
    this.spokenTexts = [];
    this.speaking = false;
    this.paused = false;
  }
}
