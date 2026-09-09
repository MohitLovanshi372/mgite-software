/**
 * TTS Router (Phase 3 Voice Engine)
 *
 * Implements intelligent, fail-safe TTS routing:
 * AI Response
 * → Privacy Filter (BLOCKS secrets before TTS)
 * → Language Detection (Hindi Devanagari, Hinglish, English)
 * → TTS Router
 * → ElevenLabs TTS (Primary when configured)
 * → Audio Playback
 *
 * Fallback Rules:
 * 1. If TTS_PROVIDER=elevenlabs and API is available:
 *    → ElevenLabs
 * 2. If ElevenLabs fails (quota, network, invalid key, 401, 429):
 *    → Fallback to Local/System TTS
 * 3. If offline:
 *    → Direct to Local/System TTS (ElevenLabs is skipped)
 * 4. If no TTS provider is available:
 *    → Graceful text-only response (never crash)
 */

import {
  TextToSpeechProvider,
  SpeakOptions,
  SpeechVoice,
} from './types.ts';
import { ElevenLabsTTSProvider } from './elevenLabsProvider.ts';
import { WebSpeechTTSProvider } from './webSpeechProvider.ts';
import { MockTextToSpeechProvider } from './mockSpeechProvider.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';
import { LanguageDetector, LanguageDetectionResult } from './languageDetector.ts';
import { getConfig } from '../../config/settings.ts';
import { logger } from '../logger.ts';

export interface TTSDispatchResult {
  success: boolean;
  providerUsed: 'elevenlabs' | 'system' | 'local' | 'mock' | 'none';
  fallbackTriggered: boolean;
  fallbackReason?: string;
  detectedLanguage: 'hi' | 'en' | 'hinglish';
  languageCode: 'hi' | 'en';
  blockedByPrivacy: boolean;
  blockReason?: string;
  text: string;
  textOnly: boolean;
  error?: string;
}

export class TTSRouter implements TextToSpeechProvider {
  public readonly id = 'tts_router';
  public readonly name = 'TTS Router (ElevenLabs & Local Fallback)';

  private elevenLabsProvider: ElevenLabsTTSProvider;
  private localProvider: TextToSpeechProvider;
  private configuredProvider: string = 'elevenlabs';
  private isCurrentlySpeaking = false;
  private offlineMode = false;
  private lastDispatchResult: TTSDispatchResult | null = null;

  constructor(
    elevenLabsProvider?: ElevenLabsTTSProvider,
    localProvider?: TextToSpeechProvider,
    configuredProvider?: string
  ) {
    this.elevenLabsProvider = elevenLabsProvider || new ElevenLabsTTSProvider();
    
    // Default local provider: WebSpeech if in browser, Mock if in headless/Node
    if (localProvider) {
      this.localProvider = localProvider;
    } else {
      const web = new WebSpeechTTSProvider();
      this.localProvider = web.isAvailable() ? web : new MockTextToSpeechProvider();
    }

    const appConfig = getConfig();
    this.configuredProvider = configuredProvider || process.env.TTS_PROVIDER || appConfig.voice?.tts_provider || 'elevenlabs';
    this.offlineMode = appConfig.offline_mode ?? false;
  }

  public isAvailable(): boolean {
    const elAvail = this.elevenLabsProvider.isAvailable();
    const localAvail = this.localProvider.isAvailable();
    const isEl = typeof elAvail === 'boolean' ? elAvail : true;
    const isLocal = typeof localAvail === 'boolean' ? localAvail : true;
    return isEl || isLocal;
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking || this.elevenLabsProvider.isSpeaking() || this.localProvider.isSpeaking();
  }

  public getConfiguredProvider(): string {
    return this.configuredProvider;
  }

  public setProvider(provider: 'elevenlabs' | 'system' | 'local' | 'mock' | string): void {
    this.configuredProvider = provider;
  }

  public setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }

  public getElevenLabsProvider(): ElevenLabsTTSProvider {
    return this.elevenLabsProvider;
  }

  public setElevenLabsProvider(provider: ElevenLabsTTSProvider): void {
    this.elevenLabsProvider = provider;
  }

  public getLocalProvider(): TextToSpeechProvider {
    return this.localProvider;
  }

  public setLocalProvider(provider: TextToSpeechProvider): void {
    this.localProvider = provider;
  }

  public getLastDispatchResult(): TTSDispatchResult | null {
    return this.lastDispatchResult;
  }

  public async getVoices(): Promise<SpeechVoice[]> {
    if (this.configuredProvider === 'elevenlabs' && this.elevenLabsProvider.isAvailable()) {
      try {
        return await this.elevenLabsProvider.getVoices();
      } catch (e) {
        return await this.localProvider.getVoices();
      }
    }
    return this.localProvider.getVoices();
  }

  public setVoice(voiceId: string): void {
    this.elevenLabsProvider.setVoice(voiceId);
    this.localProvider.setVoice(voiceId);
  }

  public setLanguage(lang: string): void {
    this.elevenLabsProvider.setLanguage(lang);
    this.localProvider.setLanguage(lang);
  }

  public setRate(rate: number): void {
    this.elevenLabsProvider.setRate(rate);
    this.localProvider.setRate(rate);
  }

  public setVolume(volume: number): void {
    this.elevenLabsProvider.setVolume(volume);
    this.localProvider.setVolume(volume);
  }

  public stop(): void {
    this.isCurrentlySpeaking = false;
    this.elevenLabsProvider.stop();
    this.localProvider.stop();
  }

  public pause(): void {
    this.isCurrentlySpeaking = false;
    this.elevenLabsProvider.pause();
    this.localProvider.pause();
  }

  public resume(): void {
    this.isCurrentlySpeaking = true;
    if (this.configuredProvider === 'elevenlabs') {
      this.elevenLabsProvider.resume();
    } else {
      this.localProvider.resume();
    }
  }

  /**
   * Main Speak dispatch implementation satisfying TextToSpeechProvider.
   */
  public async speak(text: string, options?: SpeakOptions): Promise<void> {
    const result = await this.routeAndSpeak(text, options);
    if (!result.success && result.blockedByPrivacy) {
      throw new Error(result.blockReason || 'TTS synthesis blocked by Privacy Shield.');
    }
  }

  /**
   * Core routing pipeline with detailed telemetry & fallback handling:
   * 1. Privacy Filter (BLOCKS secrets)
   * 2. Language Detection
   * 3. ElevenLabs / Local / Text-only resolution
   */
  public async routeAndSpeak(text: string, options?: SpeakOptions): Promise<TTSDispatchResult> {
    if (!text || !text.trim()) {
      return {
        success: true,
        providerUsed: 'none',
        fallbackTriggered: false,
        detectedLanguage: 'en',
        languageCode: 'en',
        blockedByPrivacy: false,
        text: '',
        textOnly: true,
      };
    }

    // =========================================================================
    // STEP 1: PRIVACY FILTER (MANDATORY INVARIANT - MUST EXECUTE BEFORE TTS)
    // Never send OTP, password, PIN, CVV, API keys, access tokens to ElevenLabs.
    // If content is sensitive: TTS must be BLOCKED.
    // =========================================================================
    const privacy = PrivacyFilter.filter(text);
    if (privacy.blocked || privacy.findings.length > 0) {
      const type = privacy.findings[0]?.type || 'SENSITIVE_DATA';
      logger.warn('TTSRouter', `TTS dispatch BLOCKED by Privacy Shield: Found ${type}`);
      const blockedResult: TTSDispatchResult = {
        success: false,
        providerUsed: 'none',
        fallbackTriggered: false,
        detectedLanguage: 'en',
        languageCode: 'en',
        blockedByPrivacy: true,
        blockReason: `Content contains sensitive ${type}. TTS output is blocked for security.`,
        text,
        textOnly: true,
      };
      this.lastDispatchResult = blockedResult;
      return blockedResult;
    }

    // Secondary heuristic for raw OTP / PIN codes
    if (/\b(otp|pin|password|security\s*code)\b/i.test(text) && /\b\d{4,8}\b/.test(text)) {
      logger.warn('TTSRouter', 'TTS dispatch BLOCKED: Raw credentials pattern detected.');
      const blockedResult: TTSDispatchResult = {
        success: false,
        providerUsed: 'none',
        fallbackTriggered: false,
        detectedLanguage: 'en',
        languageCode: 'en',
        blockedByPrivacy: true,
        blockReason: 'Raw credential pattern detected. TTS output is blocked for security.',
        text,
        textOnly: true,
      };
      this.lastDispatchResult = blockedResult;
      return blockedResult;
    }

    // =========================================================================
    // STEP 2: LANGUAGE DETECTION
    // Hindi Devanagari text is preserved ("मुझे आज कॉलेज जाना है।").
    // Hinglish mixed text is preserved ("आज मेरा project complete हो गया।").
    // =========================================================================
    const langInfo: LanguageDetectionResult = LanguageDetector.detect(text);

    const speakOptions: SpeakOptions = {
      ...options,
      lang: options?.lang || (langInfo.languageCode === 'hi' ? 'hi-IN' : 'en-US'),
    };

    const config = getConfig();
    const effectiveProvider = this.configuredProvider || process.env.TTS_PROVIDER || config.voice?.tts_provider || 'elevenlabs';
    const isOffline = this.offlineMode || config.offline_mode;

    this.isCurrentlySpeaking = true;

    // =========================================================================
    // STEP 3: ROUTING RULES
    // Rule 3: If offline -> Local/System TTS directly
    // =========================================================================
    if (isOffline) {
      logger.info('TTSRouter', 'Offline mode active: Routing directly to Local/System TTS.');
      try {
        await this.localProvider.speak(text, speakOptions);
        const result: TTSDispatchResult = {
          success: true,
          providerUsed: (this.localProvider.id as any) || 'local',
          fallbackTriggered: true,
          fallbackReason: 'offline_mode_active',
          detectedLanguage: langInfo.language,
          languageCode: langInfo.languageCode,
          blockedByPrivacy: false,
          text,
          textOnly: false,
        };
        this.lastDispatchResult = result;
        this.isCurrentlySpeaking = false;
        return result;
      } catch (localErr: any) {
        logger.warn('TTSRouter', `Local TTS failed in offline mode: ${localErr.message}`);
        return this.fallbackToTextOnly(text, langInfo, 'Offline mode with local TTS error');
      }
    }

    // =========================================================================
    // Rule 1: If TTS_PROVIDER=elevenlabs and API is available -> ElevenLabs
    // =========================================================================
    if (effectiveProvider === 'elevenlabs') {
      const isElevenLabsAvailable = this.elevenLabsProvider.isAvailable();

      if (isElevenLabsAvailable) {
        try {
          await this.elevenLabsProvider.speak(text, speakOptions);
          const result: TTSDispatchResult = {
            success: true,
            providerUsed: 'elevenlabs',
            fallbackTriggered: false,
            detectedLanguage: langInfo.language,
            languageCode: langInfo.languageCode,
            blockedByPrivacy: false,
            text,
            textOnly: false,
          };
          this.lastDispatchResult = result;
          this.isCurrentlySpeaking = false;
          return result;
        } catch (elevenLabsErr: any) {
          // Rule 2: If ElevenLabs fails (quota, network, 401, 429) -> Local/System TTS
          logger.warn(
            'TTSRouter',
            `ElevenLabs TTS failed (${elevenLabsErr.message}). Initiating graceful fallback to Local/System TTS.`
          );
          return await this.fallbackToLocal(text, speakOptions, langInfo, elevenLabsErr.message);
        }
      } else {
        // ElevenLabs missing key or voice -> fallback to local
        logger.warn(
          'TTSRouter',
          'ElevenLabs configured but unavailable (missing API key or voice). Falling back to Local/System TTS.'
        );
        return await this.fallbackToLocal(text, speakOptions, langInfo, 'elevenlabs_credentials_missing');
      }
    }

    // If configured provider is local/system directly
    if (this.localProvider.isAvailable()) {
      try {
        await this.localProvider.speak(text, speakOptions);
        const result: TTSDispatchResult = {
          success: true,
          providerUsed: (this.localProvider.id as any) || 'local',
          fallbackTriggered: false,
          detectedLanguage: langInfo.language,
          languageCode: langInfo.languageCode,
          blockedByPrivacy: false,
          text,
          textOnly: false,
        };
        this.lastDispatchResult = result;
        this.isCurrentlySpeaking = false;
        return result;
      } catch (err: any) {
        return this.fallbackToTextOnly(text, langInfo, err.message);
      }
    }

    // Rule 4: If no TTS provider is available -> text-only response (never crash)
    return this.fallbackToTextOnly(text, langInfo, 'no_tts_provider_available');
  }

  /**
   * Safe fallback to Local/System TTS.
   */
  private async fallbackToLocal(
    text: string,
    options: SpeakOptions,
    langInfo: LanguageDetectionResult,
    reason: string
  ): Promise<TTSDispatchResult> {
    try {
      if (this.localProvider.isAvailable()) {
        await this.localProvider.speak(text, options);
        const result: TTSDispatchResult = {
          success: true,
          providerUsed: (this.localProvider.id as any) || 'local',
          fallbackTriggered: true,
          fallbackReason: reason,
          detectedLanguage: langInfo.language,
          languageCode: langInfo.languageCode,
          blockedByPrivacy: false,
          text,
          textOnly: false,
        };
        this.lastDispatchResult = result;
        this.isCurrentlySpeaking = false;
        return result;
      }
    } catch (localErr: any) {
      logger.warn('TTSRouter', `Local TTS fallback also failed: ${localErr.message}`);
    }

    // Rule 4: Fallback to text-only if local also unavailable
    return this.fallbackToTextOnly(text, langInfo, `Local fallback failed: ${reason}`);
  }

  /**
   * Rule 4: Graceful text-only fallback (never crash application).
   */
  private fallbackToTextOnly(
    text: string,
    langInfo: LanguageDetectionResult,
    reason: string
  ): TTSDispatchResult {
    this.isCurrentlySpeaking = false;
    logger.info('TTSRouter', `Graceful text-only response active: ${reason}`);
    const result: TTSDispatchResult = {
      success: true,
      providerUsed: 'none',
      fallbackTriggered: true,
      fallbackReason: reason,
      detectedLanguage: langInfo.language,
      languageCode: langInfo.languageCode,
      blockedByPrivacy: false,
      text,
      textOnly: true,
    };
    this.lastDispatchResult = result;
    return result;
  }
}
