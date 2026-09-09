/**
 * ElevenLabs TTS Provider (Phase 3 Voice Engine)
 *
 * Implements TextToSpeechProvider using official ElevenLabs API / SDK.
 *
 * Strict Security Guarantees:
 * - ELEVENLABS_API_KEY is strictly backend-side and NEVER exposed to frontend,
 *   logs, API responses, or conversation memory.
 * - PrivacyFilter MUST execute BEFORE any dispatch.
 * - OTP, passwords, PINs, CVVs, API keys, and security codes are BLOCKED.
 * - Hindi text in Devanagari is preserved ("मुझे आज कॉलेज जाना है।") with language_code='hi'.
 * - Hinglish text ("आज मेरा project complete हो गया।") is preserved without unnecessary translation.
 * - Pluggable mock client support for automated offline/sandbox testing without live API keys.
 */

import { ElevenLabsClient } from 'elevenlabs';
import {
  TextToSpeechProvider,
  SpeechVoice,
  SpeakOptions,
} from './types.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';
import { LanguageDetector } from './languageDetector.ts';
import { logger } from '../logger.ts';

export interface ElevenLabsProviderConfig {
  apiKey?: string;
  voiceId?: string;
  model?: string;
  streaming?: boolean;
}

export interface ElevenLabsSynthesisResult {
  success: boolean;
  text: string;
  voiceId: string;
  modelId: string;
  languageCode?: string;
  audioBuffer?: Buffer;
  audioBase64?: string;
  blocked?: boolean;
  blockReason?: string;
  error?: string;
}

export class ElevenLabsTTSProvider implements TextToSpeechProvider {
  public readonly id = 'elevenlabs';
  public readonly name = 'ElevenLabs AI Voice';

  // Private credentials - NEVER returned in public getters, status, or logs
  private apiKey?: string;
  private voiceId: string;
  private model: string;
  private isCurrentlySpeaking = false;
  private currentLanguage = 'auto';
  private speechRate = 1.0;
  private speechVolume = 1.0;
  private streamingEnabled = false;

  // Pluggable client (official ElevenLabsClient instance or mock)
  private client: ElevenLabsClient | any | null = null;
  private lastDispatchPayload: any = null;

  constructor(config: ElevenLabsProviderConfig = {}) {
    this.apiKey = config.apiKey !== undefined ? config.apiKey : (process.env.ELEVENLABS_API_KEY || '');
    this.voiceId = config.voiceId !== undefined ? config.voiceId : (process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM');
    this.model = config.model || process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
    this.streamingEnabled = config.streaming ?? true;

    if (this.apiKey && this.apiKey.trim()) {
      try {
        this.client = new ElevenLabsClient({ apiKey: this.apiKey });
      } catch (err: any) {
        logger.error('ElevenLabsProvider', `Failed to initialize ElevenLabs client: ${err.message}`);
      }
    }
  }

  /**
   * Check if ElevenLabs is configured with an API key and voice ID.
   */
  public isAvailable(): boolean {
    const hasKey = Boolean(this.apiKey && this.apiKey.trim().length > 0);
    const hasVoice = Boolean(this.voiceId && this.voiceId.trim().length > 0);
    return hasKey && hasVoice;
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public getVoiceId(): string {
    return this.voiceId;
  }

  public setVoice(voiceId: string): void {
    if (voiceId && voiceId.trim()) {
      this.voiceId = voiceId.trim();
    }
  }

  public getModel(): string {
    return this.model;
  }

  public setModel(modelId: string): void {
    if (modelId && modelId.trim()) {
      this.model = modelId.trim();
    }
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

  /**
   * Allows unit tests to inject a mock ElevenLabsClient without real network or API calls.
   */
  public setMockClient(mockClient: any): void {
    this.client = mockClient;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (apiKey) {
      try {
        this.client = new ElevenLabsClient({ apiKey });
      } catch (err: any) {
        logger.error('ElevenLabsProvider', `Failed to re-initialize ElevenLabs client: ${err.message}`);
      }
    } else {
      this.client = null;
    }
  }

  /**
   * Test inspector: returns sanitized dispatch payload without API keys for assertions
   */
  public getLastDispatchPayload(): any {
    return this.lastDispatchPayload ? { ...this.lastDispatchPayload } : null;
  }

  /**
   * Returns list of configured/available ElevenLabs voices.
   */
  public async getVoices(): Promise<SpeechVoice[]> {
    if (this.client?.voices?.getAll) {
      try {
        const response = await this.client.voices.getAll();
        const voices = (response.voices || response || []).map((v: any) => ({
          id: v.voice_id || v.id,
          name: v.name || 'ElevenLabs Voice',
          lang: v.labels?.accent || v.labels?.language || 'multilingual',
          isDefault: v.voice_id === this.voiceId,
        }));
        if (voices.length > 0) return voices;
      } catch (err: any) {
        logger.warn('ElevenLabsProvider', `Failed to fetch remote voices, returning standard catalog: ${err.message}`);
      }
    }

    // Default catalog of popular multilingual / Indian compatible voices
    return [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Multilingual)', lang: 'en-US / hi-IN', isDefault: true },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Multilingual Hindi/English)', lang: 'multilingual' },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Multilingual)', lang: 'multilingual' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Multilingual)', lang: 'multilingual' },
      { id: 'custom_elevenlabs_hindi', name: 'Kavita (Indian English & Hindi)', lang: 'hi-IN' },
    ];
  }

  /**
   * Speak text via ElevenLabs.
   *
   * Architectural Pipeline:
   * 1. Deterministic Privacy Filter (STRICT GUARD: Blocks OTPs, PINs, Passwords, Secrets)
   * 2. Language Detection (Hindi Devanagari preservation, Hinglish preservation, English)
   * 3. ElevenLabs API synthesis with language_code configuration
   * 4. Safe streaming / buffer handling
   */
  public async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (!text || !text.trim()) return;

    // STEP 1: PRIVACY FILTER EXECUTION BEFORE TTS (MANDATORY REQUIREMENT)
    const privacy = PrivacyFilter.filter(text);
    if (privacy.blocked || privacy.findings.length > 0) {
      const sensitiveFinding = privacy.findings[0];
      const sensitiveType = sensitiveFinding?.type || 'SENSITIVE_DATA';
      logger.warn('ElevenLabsProvider', `TTS dispatch BLOCKED due to sensitive content: ${sensitiveType}`);
      throw new Error(`TTS synthesis blocked by Privacy Shield: Content contains sensitive ${sensitiveType}.`);
    }

    // Secondary check for raw OTP or password patterns
    if (/\b(otp|one[- ]time[- ]password|pin|security\s*code)\b/i.test(text) && /\b\d{4,8}\b/.test(text)) {
      logger.warn('ElevenLabsProvider', 'TTS dispatch BLOCKED: Raw OTP / PIN pattern detected.');
      throw new Error('TTS synthesis blocked by Privacy Shield: Raw OTP / PIN pattern detected.');
    }

    // Check API availability
    const activeKey = this.apiKey || process.env.ELEVENLABS_API_KEY;
    if (!activeKey) {
      logger.warn('ElevenLabsProvider', 'Cannot speak: ELEVENLABS_API_KEY is missing.');
      throw new Error('ElevenLabs API key is missing. Please configure ELEVENLABS_API_KEY in settings or environment.');
    }

    const targetVoiceId = options?.voiceId || this.voiceId;
    if (!targetVoiceId) {
      logger.warn('ElevenLabsProvider', 'Cannot speak: ELEVENLABS_VOICE_ID is missing.');
      throw new Error('ElevenLabs voice ID is missing. Please configure a voice ID.');
    }

    // STEP 2: LANGUAGE DETECTION & PRESERVATION
    const langInfo = LanguageDetector.detect(text);
    // For Hindi and Hinglish: prefer natural text without Latin transliteration
    // use language_code = 'hi' when supported by model
    const languageCode = (langInfo.isPureHindi || langInfo.isHinglish) ? 'hi' : (options?.lang === 'hi-IN' ? 'hi' : undefined);

    const voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      speed: options?.rate ?? this.speechRate,
    };

    // Store sanitized payload for verification & tests (excluding API key)
    this.lastDispatchPayload = {
      voiceId: targetVoiceId,
      model_id: this.model,
      text,
      language_code: languageCode,
      detectedLanguage: langInfo.language,
      voice_settings: voiceSettings,
      timestamp: Date.now(),
    };

    this.isCurrentlySpeaking = true;
    if (options?.onStart) options.onStart();

    try {
      // Lazy client initialization if needed
      if (!this.client) {
        this.client = new ElevenLabsClient({ apiKey: activeKey });
      }

      // If client has textToSpeech.convert
      if (this.client?.textToSpeech?.convert) {
        const convertParams: any = {
          text,
          model_id: this.model,
          voice_settings: voiceSettings,
        };

        if (languageCode) {
          convertParams.language_code = languageCode;
        }

        const audioStream = await this.client.textToSpeech.convert(targetVoiceId, convertParams);

        // Read audio stream into memory buffer
        const chunks: Buffer[] = [];
        if (audioStream && typeof (audioStream as any)[Symbol.asyncIterator] === 'function') {
          for await (const chunk of audioStream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
        }

        const audioBuffer = chunks.length > 0 ? Buffer.concat(chunks) : Buffer.from('');
        logger.info(
          'ElevenLabsProvider',
          `Successfully synthesized ${text.length} chars (lang: ${langInfo.language}, code: ${languageCode || 'auto'}, bytes: ${audioBuffer.length})`
        );
      } else {
        // Fallback for mocked or non-SDK test environments
        await new Promise((r) => setTimeout(r, 20));
      }

      this.isCurrentlySpeaking = false;
      if (options?.onEnd) options.onEnd();
    } catch (err: any) {
      this.isCurrentlySpeaking = false;
      const safeErrorMsg = err?.message || 'ElevenLabs synthesis failed';
      // Ensure API keys are never leaked in error messages or logs
      const sanitizedError = safeErrorMsg.replace(new RegExp(activeKey, 'g'), '[REDACTED_API_KEY]');
      logger.error('ElevenLabsProvider', `Synthesis failed: ${sanitizedError}`);
      if (options?.onError) options.onError(new Error(sanitizedError));
      throw new Error(sanitizedError);
    }
  }

  /**
   * Stop active speech.
   */
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
