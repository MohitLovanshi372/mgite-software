/**
 * Custom / Cloud Voice API Adapter Architecture (Phase 3 - Section 6)
 *
 * Implements TextToSpeechProvider as a pluggable adapter for external TTS providers
 * (e.g., custom HTTP voice APIs, Cloud TTS, user-provided local servers like Piper/Coqui).
 *
 * Strict Security Rules:
 * - API keys remain exclusively server-side in environment / secure config.
 * - Raw secrets are NEVER logged, exposed to the client, or stored in memories.
 * - Texts are strictly privacy-checked before any external dispatch.
 */

import {
  TextToSpeechProvider,
  SpeechVoice,
  SpeakOptions,
  CustomVoiceApiConfig,
} from './types.ts';
import { logger } from '../logger.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';

export class CustomVoiceApiAdapter implements TextToSpeechProvider {
  public readonly id: string;
  public readonly name: string;

  private endpoint: string;
  // Strictly private API key — never serialized, never returned in status/logs
  private apiKey?: string;
  private voice: string;
  private isCurrentlySpeaking = false;
  private language = 'en-US';
  private rate = 1.0;
  private volume = 1.0;

  constructor(id = 'custom_voice_api', name = 'Custom Voice Provider', config: CustomVoiceApiConfig = {}) {
    this.id = id;
    this.name = name;
    this.endpoint = config.endpoint || process.env.CUSTOM_TTS_ENDPOINT || '';
    this.apiKey = config.apiKey || process.env.CUSTOM_TTS_API_KEY;
    this.voice = config.voice || 'default';
  }

  public isAvailable(): boolean {
    return Boolean(this.endpoint || process.env.CUSTOM_TTS_ENDPOINT);
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public async getVoices(): Promise<SpeechVoice[]> {
    return [
      { id: 'custom_default', name: 'Custom Neural Voice (Default)', lang: 'en-US', isDefault: true },
      { id: 'custom_hi_1', name: 'Custom Hindi Neural', lang: 'hi-IN' },
    ];
  }

  public setVoice(voiceId: string): void {
    this.voice = voiceId;
  }

  public setLanguage(lang: string): void {
    this.language = lang;
  }

  public setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0.0, Math.min(1.0, volume));
  }

  public async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (!text || !text.trim()) return;

    // Strict Privacy Verification: Never send unredacted secrets to external voice service
    const filter = PrivacyFilter.filterInput(text);
    const safeText = filter.safeContent || filter.cleanText;

    if (filter.hadSensitiveData && filter.classification === 'OTP') {
      logger.warn('CustomVoiceAdapter', 'Suppressed speech synthesis containing OTP payload');
      return;
    }

    this.isCurrentlySpeaking = true;
    if (options?.onStart) options.onStart();

    try {
      if (!this.endpoint) {
        // Safe fallback simulation if no remote endpoint configured
        logger.info('CustomVoiceAdapter', `Simulating speech synthesis for length: ${safeText.length}`);
        await new Promise((r) => setTimeout(r, 20));
      } else {
        // Production adapter call (keys kept server-side)
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: safeText,
            voice: options?.voiceId || this.voice,
            rate: options?.rate || this.rate,
            volume: options?.volume || this.volume,
            lang: options?.lang || this.language,
          }),
        });

        if (!res.ok) {
          throw new Error(`Custom voice API error: ${res.status} ${res.statusText}`);
        }
      }

      this.isCurrentlySpeaking = false;
      if (options?.onEnd) options.onEnd();
    } catch (err: any) {
      this.isCurrentlySpeaking = false;
      logger.error('CustomVoiceAdapter', `Voice API failure: ${err.message}`);
      if (options?.onError) options.onError(err);
      throw err;
    }
  }

  public stop(): void {
    this.isCurrentlySpeaking = false;
  }

  public pause(): void {
    this.isCurrentlySpeaking = false;
  }

  public resume(): void {
    // Resume unsupported on stateless HTTP endpoints
  }
}
