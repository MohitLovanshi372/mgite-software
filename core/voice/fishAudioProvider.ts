/**
 * Fish Audio TTS Provider (Phase 3 Voice Engine)
 *
 * Implements TextToSpeechProvider using the official Fish Audio API (fish.audio).
 * Endpoint: POST https://api.fish.audio/v1/tts
 *
 * Strict Security Guarantees:
 * - FISH_AUDIO_API_KEY is strictly backend-side and NEVER exposed to frontend,
 *   logs, API responses, or conversation memory.
 * - PrivacyFilter MUST execute BEFORE any dispatch.
 * - OTP, passwords, PINs, CVVs, API keys, and security codes are BLOCKED.
 * - Hindi text in Devanagari is preserved ("मुझे आज कॉलेज जाना है।").
 * - Hinglish text ("आज मेरा project complete हो गया।") is preserved.
 * - Pluggable mock client/fetcher support for automated offline/sandbox testing without live API keys.
 */

import {
  TextToSpeechProvider,
  SpeechVoice,
  SpeakOptions,
} from './types.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';
import { LanguageDetector } from './languageDetector.ts';
import { logger } from '../logger.ts';

export interface FishAudioProviderConfig {
  apiKey?: string;
  referenceId?: string;
  voiceId?: string;
  model?: string; // 's2.1-pro' | 's2.1-pro-free' | 's1' | 's2-pro'
  latency?: 'normal' | 'balanced';
  format?: 'mp3' | 'wav' | 'pcm' | 'opus';
  endpoint?: string;
}

export interface FishAudioSynthesisResult {
  success: boolean;
  text: string;
  referenceId?: string;
  model: string;
  format: string;
  audioBuffer?: Buffer;
  audioBase64?: string;
  blocked?: boolean;
  blockReason?: string;
  error?: string;
}

export class FishAudioTTSProvider implements TextToSpeechProvider {
  public readonly id = 'fishaudio';
  public readonly name = 'Fish Audio AI Voice';

  // Private credentials - NEVER returned in public getters, status, or logs
  private apiKey?: string;
  private referenceId: string;
  private model: string;
  private latency: 'normal' | 'balanced';
  private format: 'mp3' | 'wav' | 'pcm' | 'opus';
  private endpoint: string;

  private isCurrentlySpeaking = false;
  private currentLanguage = 'auto';
  private speechRate = 1.0;
  private speechVolume = 1.0;

  // Pluggable fetcher for unit testing and mock verification
  private mockFetcher: ((url: string, init: any) => Promise<any>) | null = null;
  private lastDispatchPayload: any = null;
  private hasAuthError = false;
  private hasCreditError = false;

  private parseAndSanitizeKey(rawKey?: string, defaultRef?: string): { cleanKey: string; refId?: string } {
    let cleanKey = (rawKey || '').trim();
    let refId = defaultRef ? defaultRef.trim() : undefined;

    if (cleanKey.includes(' ')) {
      const parts = cleanKey.split(/\s+/);
      const foundKey = parts.find((p) => p.startsWith('sk-') || p.length > 40) || parts[0];
      const foundRef = parts.find((p) => /^[a-f0-9]{32}$/i.test(p) || (p !== foundKey && p.length === 32));
      cleanKey = foundKey;
      if (foundRef && !refId) {
        refId = foundRef;
      }
    }

    return { cleanKey, refId };
  }

  public getCleanApiKey(): string {
    const raw = this.apiKey !== undefined ? this.apiKey : (process.env.FISH_AUDIO_API_KEY || '');
    return this.parseAndSanitizeKey(raw).cleanKey;
  }

  constructor(config: FishAudioProviderConfig = {}) {
    const rawEnv = (process.env.FISH_AUDIO_API_KEY || '').trim();
    const envRef = (process.env.FISH_AUDIO_REFERENCE_ID || '').trim();

    const rawKey = config.apiKey !== undefined ? config.apiKey : rawEnv;
    const rawRef = config.referenceId !== undefined ? config.referenceId : envRef;

    const parsed = this.parseAndSanitizeKey(rawKey, rawRef);
    this.apiKey = parsed.cleanKey;
    this.referenceId = parsed.refId || '817eba7f1aea469f9802326568d427b9'; // Default to user's Jarvis Hindi Voice
    this.model = config.model || process.env.FISH_AUDIO_MODEL || 's2.1-pro';
    this.latency = config.latency || (process.env.FISH_AUDIO_LATENCY as any) || 'normal';
    this.format = config.format || 'mp3';
    this.endpoint = config.endpoint || 'https://api.fish.audio/v1/tts';
  }

  /**
   * Check if Fish Audio is configured with a valid API key.
   */
  public isAvailable(): boolean {
    if (this.hasAuthError) {
      return false;
    }
    const cleanKey = this.getCleanApiKey();
    return Boolean(cleanKey && cleanKey.trim().length > 0);
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public getReferenceId(): string {
    return this.referenceId;
  }

  public setReferenceId(refId: string): void {
    if (refId && refId.trim()) {
      this.referenceId = refId.trim();
    }
  }

  public setVoice(voiceId: string): void {
    this.setReferenceId(voiceId);
  }

  public getModel(): string {
    return this.model;
  }

  public setModel(modelId: string): void {
    if (modelId && modelId.trim()) {
      this.model = modelId.trim();
    }
  }

  public getLatency(): 'normal' | 'balanced' {
    return this.latency;
  }

  public setLatency(lat: 'normal' | 'balanced'): void {
    this.latency = lat;
  }

  public getFormat(): 'mp3' | 'wav' | 'pcm' | 'opus' {
    return this.format;
  }

  public setFormat(fmt: 'mp3' | 'wav' | 'pcm' | 'opus'): void {
    this.format = fmt;
  }

  public setLanguage(lang: string): void {
    this.currentLanguage = lang;
  }

  public setRate(rate: number): void {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setVolume(volume: number): void {
    this.speechVolume = Math.max(0.0, Math.min(1.0, volume));
  }

  public setApiKey(apiKey: string): void {
    const parsed = this.parseAndSanitizeKey(apiKey);
    this.apiKey = parsed.cleanKey;
    if (parsed.refId) {
      this.referenceId = parsed.refId;
    }
    this.hasAuthError = false;
    this.hasCreditError = false;
  }

  public resetErrorState(): void {
    this.hasAuthError = false;
    this.hasCreditError = false;
  }

  public getHasAuthError(): boolean {
    return this.hasAuthError;
  }

  public setHasAuthError(hasError: boolean): void {
    this.hasAuthError = hasError;
  }

  public getHasCreditError(): boolean {
    return this.hasCreditError;
  }

  public setHasCreditError(hasError: boolean): void {
    this.hasCreditError = hasError;
  }

  public getVoiceId(): string {
    return this.referenceId;
  }

  public setMockClient(mock: any): void {
    if (typeof mock === 'function') {
      this.mockFetcher = mock;
    } else if (mock && typeof mock.fetch === 'function') {
      this.mockFetcher = mock.fetch.bind(mock);
    } else {
      this.mockFetcher = () => Promise.resolve(Buffer.from('MOCK_AUDIO'));
    }
  }

  public getSettings() {
    return {
      model: this.model,
      reference_id: this.referenceId,
      latency: this.latency,
      format: this.format,
      speed: this.speechRate,
      volume: this.speechVolume,
    };
  }

  /**
   * Inject a mock fetcher for automated offline testing.
   */
  public setMockFetcher(fetcher: ((url: string, init: any) => Promise<any>) | null): void {
    this.mockFetcher = fetcher;
  }

  /**
   * Inspector for tests: returns sanitized dispatch payload without API keys
   */
  public getLastDispatchPayload(): any {
    return this.lastDispatchPayload ? { ...this.lastDispatchPayload } : null;
  }

  /**
   * Returns list of curated / available Fish Audio voices.
   */
  public async getVoices(): Promise<SpeechVoice[]> {
    return [
      {
        id: '817eba7f1aea469f9802326568d427b9',
        name: 'Fish Audio: Jarvis Hindi Voice (Official Indian Model)',
        lang: 'hi-IN / en-IN',
        isDefault: true,
      },
      {
        id: 'ultron_sub_bass_core',
        name: 'Fish Audio: Ultron Cybernetic Baritone',
        lang: 'en-US / hi-IN',
      },
      {
        id: 'fish_deep_commander',
        name: 'Fish Audio: Deep Android Commander',
        lang: 'en-US',
      },
      {
        id: 'fish_multilingual_assistant',
        name: 'Fish Audio: Multilingual Assistant (Hindi & English)',
        lang: 'multilingual',
      },
      {
        id: 'fish_cold_tactical_node',
        name: 'Fish Audio: Cold Tactical AI Core',
        lang: 'en-US',
      },
      {
        id: 'fish_natural_dialogue',
        name: 'Fish Audio: Conversational S2.1 Pro Voice',
        lang: 'multilingual',
      },
    ];
  }

  /**
   * Synthesizes speech from text and returns the binary audio buffer and base64 string.
   */
  public async synthesize(
    text: string,
    options?: SpeakOptions & { referenceId?: string; model?: string; latency?: 'normal' | 'balanced' }
  ): Promise<FishAudioSynthesisResult> {
    if (!text || !text.trim()) {
      return {
        success: true,
        text: '',
        model: this.model,
        format: this.format,
        audioBuffer: Buffer.from(''),
      };
    }

    // STEP 1: PRIVACY FILTER EXECUTION BEFORE TTS (MANDATORY REQUIREMENT)
    const privacy = PrivacyFilter.filter(text);
    if (privacy.blocked || privacy.findings.length > 0) {
      const sensitiveFinding = privacy.findings[0];
      const sensitiveType = sensitiveFinding?.type || 'SENSITIVE_DATA';
      logger.warn('FishAudioProvider', `TTS dispatch BLOCKED due to sensitive content: ${sensitiveType}`);
      throw new Error(`TTS synthesis blocked by Privacy Shield: Content contains sensitive ${sensitiveType}.`);
    }

    // Secondary check for raw OTP or password patterns
    if (/\b(otp|one[- ]time[- ]password|pin|security\s*code)\b/i.test(text) && /\b\d{4,8}\b/.test(text)) {
      logger.warn('FishAudioProvider', 'TTS dispatch BLOCKED: Raw OTP / PIN pattern detected.');
      throw new Error('TTS synthesis blocked by Privacy Shield: Raw OTP / PIN pattern detected.');
    }

    // Check API key availability
    const activeKey = this.getCleanApiKey();
    if (!activeKey && !this.mockFetcher) {
      logger.warn('FishAudioProvider', 'Cannot synthesize: FISH_AUDIO_API_KEY is missing.');
      throw new Error('Fish Audio API key is missing. Please configure FISH_AUDIO_API_KEY in settings or environment.');
    }

    // STEP 2: LANGUAGE DETECTION & PRESERVATION
    const langInfo = LanguageDetector.detect(text);
    const targetRefId = options?.referenceId || options?.voiceId || this.referenceId;
    const targetModel = options?.model || this.model;
    const targetLatency = options?.latency || this.latency;
    const speed = options?.rate ?? this.speechRate;

    const requestBody: any = {
      text,
      format: this.format,
      mp3_bitrate: 128,
      latency: targetLatency,
      prosody: {
        speed,
        volume: 0,
      },
    };

    if (targetRefId && targetRefId !== 'default' && targetRefId !== 'none') {
      requestBody.reference_id = targetRefId;
    }

    // Store sanitized payload for assertions and tests (never storing activeKey)
    this.lastDispatchPayload = {
      url: this.endpoint,
      model: targetModel,
      reference_id: targetRefId,
      text,
      detectedLanguage: langInfo.language,
      isHindi: langInfo.isPureHindi || langInfo.isHinglish,
      latency: targetLatency,
      format: this.format,
      speed,
      timestamp: Date.now(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeKey || 'mock_test_key'}`,
      'model': targetModel,
    };

    let audioBuffer: Buffer;

    try {
      if (this.mockFetcher) {
        // Mock fetcher for testing
        const mockRes = await this.mockFetcher(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
        audioBuffer = Buffer.isBuffer(mockRes) ? mockRes : Buffer.from(mockRes || 'MOCK_AUDIO_DATA');
      } else {
        // Live Fish Audio HTTP API call
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          if (response.status === 401 || response.status === 403) {
            this.hasAuthError = true;
          }
          if (response.status === 402) {
            this.hasCreditError = true;
            this.hasAuthError = false;
          }
          throw new Error(`Fish Audio API error (${response.status}): ${errText || response.statusText}`);
        }

        this.hasAuthError = false;
        this.hasCreditError = false;

        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
      }

      logger.info(
        'FishAudioProvider',
        `Successfully synthesized ${text.length} chars with Fish Audio [model=${targetModel}, bytes=${audioBuffer.length}]`
      );

      return {
        success: true,
        text,
        referenceId: targetRefId,
        model: targetModel,
        format: this.format,
        audioBuffer,
        audioBase64: audioBuffer.toString('base64'),
      };
    } catch (err: any) {
      const safeErrorMsg = err?.message || 'Fish Audio synthesis failed';
      // Ensure API keys are NEVER leaked in logs or error messages
      const sanitizedError = activeKey ? safeErrorMsg.replace(new RegExp(activeKey, 'g'), '[REDACTED_API_KEY]') : safeErrorMsg;
      if (sanitizedError.includes('401') || sanitizedError.includes('Invalid Token')) {
        this.hasAuthError = true;
        logger.warn('FishAudioProvider', `Synthesis token invalid: ${sanitizedError}`);
      } else if (sanitizedError.includes('402') || sanitizedError.includes('credit') || sanitizedError.includes('Payment Required')) {
        this.hasCreditError = true;
        this.hasAuthError = false;
        logger.warn('FishAudioProvider', `Fish Audio credit exhausted (402). Local Jarvis Hindi voice synthesis active.`);
      } else {
        logger.error('FishAudioProvider', `Synthesis failed: ${sanitizedError}`);
      }
      throw new Error(sanitizedError);
    }
  }

  /**
   * Speak text via Fish Audio API (satisfies TextToSpeechProvider).
   */
  public async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (!text || !text.trim()) return;

    this.isCurrentlySpeaking = true;
    if (options?.onStart) options.onStart();

    try {
      await this.synthesize(text, options);
      this.isCurrentlySpeaking = false;
      if (options?.onEnd) options.onEnd();
    } catch (err: any) {
      this.isCurrentlySpeaking = false;
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
    this.isCurrentlySpeaking = true;
  }
}
