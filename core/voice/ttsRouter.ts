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
import { FishAudioTTSProvider } from './fishAudioProvider.ts';
import { WebSpeechTTSProvider } from './webSpeechProvider.ts';
import { MockTextToSpeechProvider } from './mockSpeechProvider.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';
import { LanguageDetector, LanguageDetectionResult } from './languageDetector.ts';
import { SpeechTextNormalizer, SpeechNormalizationResult } from './speechTextNormalizer.ts';
import { getConfig } from '../../config/settings.ts';
import { logger } from '../logger.ts';

export interface TTSDispatchResult {
  success: boolean;
  providerUsed: 'fish_audio' | 'elevenlabs' | 'system' | 'local' | 'mock' | 'none';
  fallbackTriggered: boolean;
  fallbackReason?: string;
  detectedLanguage: 'hi' | 'en' | 'hinglish';
  languageCode: 'hi' | 'en';
  blockedByPrivacy: boolean;
  blockReason?: string;
  text: string;
  originalText?: string;
  normalizedText?: string;
  textOnly: boolean;
  error?: string;
}

export class TTSRouter implements TextToSpeechProvider {
  public readonly id = 'tts_router';
  public readonly name = 'TTS Router (Fish Audio, ElevenLabs & Local Fallback)';

  private fishAudioProvider: FishAudioTTSProvider;
  private elevenLabsProvider: ElevenLabsTTSProvider;
  private localProvider: TextToSpeechProvider;
  private configuredProvider: string = 'fish_audio';
  private isCurrentlySpeaking = false;
  private offlineMode = false;
  private lastDispatchResult: TTSDispatchResult | null = null;

  constructor(
    first?: FishAudioTTSProvider | ElevenLabsTTSProvider | TextToSpeechProvider,
    second?: ElevenLabsTTSProvider | TextToSpeechProvider | string,
    third?: TextToSpeechProvider | string,
    fourth?: string
  ) {
    if (first instanceof FishAudioTTSProvider) {
      this.fishAudioProvider = first;
      this.elevenLabsProvider = (second instanceof ElevenLabsTTSProvider) ? second : new ElevenLabsTTSProvider();
      this.localProvider = (third && typeof third !== 'string') ? third : new WebSpeechTTSProvider();
      if (typeof third === 'string') {
        fourth = third;
      }
    } else if (first instanceof ElevenLabsTTSProvider) {
      this.fishAudioProvider = new FishAudioTTSProvider();
      this.elevenLabsProvider = first;
      this.localProvider = (second && typeof second !== 'string') ? (second as TextToSpeechProvider) : new WebSpeechTTSProvider();
      if (typeof second === 'string') {
        fourth = second;
      } else if (typeof third === 'string') {
        fourth = third;
      }
    } else {
      this.fishAudioProvider = new FishAudioTTSProvider();
      this.elevenLabsProvider = new ElevenLabsTTSProvider();
      
      // Default local provider: WebSpeech if in browser, Mock if in headless/Node
      if (first && typeof first !== 'string') {
        this.localProvider = first as TextToSpeechProvider;
      } else if (second && typeof second !== 'string') {
        this.localProvider = second as TextToSpeechProvider;
      } else {
        const web = new WebSpeechTTSProvider();
        this.localProvider = web.isAvailable() ? web : new MockTextToSpeechProvider();
      }
      if (typeof first === 'string') fourth = first;
      else if (typeof second === 'string') fourth = second;
      else if (typeof third === 'string') fourth = third;
    }

    const appConfig = getConfig();
    this.configuredProvider = fourth || process.env.TTS_PROVIDER || appConfig.voice?.tts_provider || 'fish_audio';
    this.offlineMode = appConfig.offline_mode ?? false;
  }

  public isAvailable(): boolean {
    const fishAvail = this.fishAudioProvider.isAvailable();
    const elAvail = this.elevenLabsProvider.isAvailable();
    const localAvail = this.localProvider.isAvailable();
    const isFish = typeof fishAvail === 'boolean' ? fishAvail : true;
    const isEl = typeof elAvail === 'boolean' ? elAvail : true;
    const isLocal = typeof localAvail === 'boolean' ? localAvail : true;
    return isFish || isEl || isLocal;
  }

  public isSpeaking(): boolean {
    return (
      this.isCurrentlySpeaking ||
      this.fishAudioProvider.isSpeaking() ||
      this.elevenLabsProvider.isSpeaking() ||
      this.localProvider.isSpeaking()
    );
  }

  public getConfiguredProvider(): string {
    return this.configuredProvider;
  }

  public setProvider(provider: 'fish_audio' | 'elevenlabs' | 'system' | 'local' | 'mock' | string): void {
    this.configuredProvider = provider;
  }

  public setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }

  public getFishAudioProvider(): FishAudioTTSProvider {
    return this.fishAudioProvider;
  }

  public setFishAudioProvider(provider: FishAudioTTSProvider): void {
    this.fishAudioProvider = provider;
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
    if (this.configuredProvider === 'fish_audio' && this.fishAudioProvider.isAvailable()) {
      try {
        return await this.fishAudioProvider.getVoices();
      } catch (e) {
        // Fallback
      }
    }
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
    this.fishAudioProvider.setVoice(voiceId);
    this.elevenLabsProvider.setVoice(voiceId);
    this.localProvider.setVoice(voiceId);
  }

  public setLanguage(lang: string): void {
    this.fishAudioProvider.setLanguage(lang);
    this.elevenLabsProvider.setLanguage(lang);
    this.localProvider.setLanguage(lang);
  }

  public setRate(rate: number): void {
    this.fishAudioProvider.setRate(rate);
    this.elevenLabsProvider.setRate(rate);
    this.localProvider.setRate(rate);
  }

  public setVolume(volume: number): void {
    this.fishAudioProvider.setVolume(volume);
    this.elevenLabsProvider.setVolume(volume);
    this.localProvider.setVolume(volume);
  }

  public setStability(stability: number): void {
    this.elevenLabsProvider.setStability(stability);
  }

  public setStyle(style: number): void {
    this.elevenLabsProvider.setStyle(style);
  }

  public setSimilarityBoost(val: number): void {
    this.elevenLabsProvider.setSimilarityBoost(val);
  }

  public setPitch(pitch: number): void {
    this.elevenLabsProvider.setPitch(pitch);
  }

  public getElevenLabsSettings() {
    return this.elevenLabsProvider.getVoiceSettings();
  }

  public stop(): void {
    this.isCurrentlySpeaking = false;
    this.fishAudioProvider.stop();
    this.elevenLabsProvider.stop();
    this.localProvider.stop();
  }

  public pause(): void {
    this.isCurrentlySpeaking = false;
    this.fishAudioProvider.pause();
    this.elevenLabsProvider.pause();
    this.localProvider.pause();
  }

  public resume(): void {
    this.isCurrentlySpeaking = true;
    if (this.configuredProvider === 'fish_audio') {
      this.fishAudioProvider.resume();
    } else if (this.configuredProvider === 'elevenlabs') {
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
    // STEP 2: SPEECH TEXT NORMALIZATION LAYER
    // AI response -> SpeechTextNormalizer -> Language detection -> TTS -> Audio
    // Guarantees:
    // - Preserves normal words as complete words (never spells letter-by-letter)
    // - Keeps technical terms readable: YouTube, Gemini, CPU, GPU, RAM, API, etc.
    // - Strips markdown, code blocks, raw JSON/tool output
    // - Replaces URLs with natural phrase ("Link ready hai.")
    // =========================================================================
    const normResult: SpeechNormalizationResult = SpeechTextNormalizer.normalize(text);
    const speechText = normResult.normalizedText || text;

    // =========================================================================
    // STEP 3: LANGUAGE DETECTION & PRESERVATION
    // Hindi Devanagari text is preserved ("मुझे आज कॉलेज जाना है।").
    // Hinglish mixed text is preserved ("आज मेरा project complete हो गया।").
    // =========================================================================
    const langInfo: LanguageDetectionResult = LanguageDetector.detect(speechText);

    const speakOptions: SpeakOptions = {
      ...options,
      lang: options?.lang || (langInfo.languageCode === 'hi' ? 'hi-IN' : 'en-US'),
    };

    const config = getConfig();
    const effectiveProvider = this.configuredProvider || process.env.TTS_PROVIDER || config.voice?.tts_provider || 'elevenlabs';
    const isOffline = this.offlineMode || config.offline_mode;

    this.isCurrentlySpeaking = true;

    // =========================================================================
    // STEP 4: ROUTING RULES
    // Rule 3: If offline -> Local/System TTS directly
    // =========================================================================
    if (isOffline) {
      logger.info('TTSRouter', 'Offline mode active: Routing directly to Local/System TTS.');
      try {
        await this.localProvider.speak(speechText, speakOptions);
        const result: TTSDispatchResult = {
          success: true,
          providerUsed: (this.localProvider.id as any) || 'local',
          fallbackTriggered: true,
          fallbackReason: 'offline_mode_active',
          detectedLanguage: langInfo.language,
          languageCode: langInfo.languageCode,
          blockedByPrivacy: false,
          text: speechText,
          originalText: text,
          normalizedText: speechText,
          textOnly: false,
        };
        this.lastDispatchResult = result;
        this.isCurrentlySpeaking = false;
        return result;
      } catch (localErr: any) {
        logger.warn('TTSRouter', `Local TTS failed in offline mode: ${localErr.message}`);
        return this.fallbackToTextOnly(speechText, langInfo, 'Offline mode with local TTS error', text);
      }
    }

    // =========================================================================
    // Rule 1: If TTS_PROVIDER=fish_audio
    // Flow: Assistant response -> SpeechTextNormalizer -> FishAudioTTSProvider -> Audio -> Speaker
    // Fallback: Fish Audio fails -> try existing ElevenLabs provider -> if both fail, display text without audio.
    // =========================================================================
    if (effectiveProvider === 'fish_audio') {
      const isFishAvailable = this.fishAudioProvider.isAvailable();

      if (isFishAvailable) {
        try {
          await this.fishAudioProvider.speak(speechText, speakOptions);
          const result: TTSDispatchResult = {
            success: true,
            providerUsed: 'fish_audio',
            fallbackTriggered: false,
            detectedLanguage: langInfo.language,
            languageCode: langInfo.languageCode,
            blockedByPrivacy: false,
            text: speechText,
            originalText: text,
            normalizedText: speechText,
            textOnly: false,
          };
          this.lastDispatchResult = result;
          this.isCurrentlySpeaking = false;
          return result;
        } catch (fishErr: any) {
          logger.warn(
            'TTSRouter',
            `Fish Audio TTS failed (${fishErr.message}). Initiating fallback to ElevenLabs.`
          );
          return await this.fallbackFromFishAudio(speechText, speakOptions, langInfo, fishErr.message, text);
        }
      } else {
        logger.warn(
          'TTSRouter',
          'Fish Audio configured but unavailable (missing API key). Initiating fallback to ElevenLabs.'
        );
        return await this.fallbackFromFishAudio(speechText, speakOptions, langInfo, 'fish_audio_unavailable', text);
      }
    }

    // =========================================================================
    // Rule 2: If TTS_PROVIDER=elevenlabs and API is available -> ElevenLabs
    // =========================================================================
    if (effectiveProvider === 'elevenlabs') {
      const isElevenLabsAvailable = this.elevenLabsProvider.isAvailable();

      if (isElevenLabsAvailable) {
        try {
          await this.elevenLabsProvider.speak(speechText, speakOptions);
          const result: TTSDispatchResult = {
            success: true,
            providerUsed: 'elevenlabs',
            fallbackTriggered: false,
            detectedLanguage: langInfo.language,
            languageCode: langInfo.languageCode,
            blockedByPrivacy: false,
            text: speechText,
            originalText: text,
            normalizedText: speechText,
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
          return await this.fallbackToLocal(speechText, speakOptions, langInfo, elevenLabsErr.message, text);
        }
      } else {
        // ElevenLabs missing key or voice -> fallback to local
        logger.warn(
          'TTSRouter',
          'ElevenLabs configured but unavailable (missing API key or voice). Falling back to Local/System TTS.'
        );
        return await this.fallbackToLocal(speechText, speakOptions, langInfo, 'elevenlabs_credentials_missing', text);
      }
    }

    // If configured provider is local/system directly
    if (this.localProvider.isAvailable()) {
      try {
        await this.localProvider.speak(speechText, speakOptions);
        const result: TTSDispatchResult = {
          success: true,
          providerUsed: (this.localProvider.id as any) || 'local',
          fallbackTriggered: false,
          detectedLanguage: langInfo.language,
          languageCode: langInfo.languageCode,
          blockedByPrivacy: false,
          text: speechText,
          originalText: text,
          normalizedText: speechText,
          textOnly: false,
        };
        this.lastDispatchResult = result;
        this.isCurrentlySpeaking = false;
        return result;
      } catch (err: any) {
        return this.fallbackToTextOnly(speechText, langInfo, err.message, text);
      }
    }

    // Rule 4: If no TTS provider is available -> text-only response (never crash)
    return this.fallbackToTextOnly(speechText, langInfo, 'no_tts_provider_available', text);
  }

  /**
   * Fish Audio Fallback Pipeline:
   * Fish Audio fails -> try existing ElevenLabs provider -> if both fail, display text without audio.
   */
  private async fallbackFromFishAudio(
    text: string,
    options: SpeakOptions,
    langInfo: LanguageDetectionResult,
    reason: string,
    originalText?: string
  ): Promise<TTSDispatchResult> {
    // 1. Try ElevenLabs provider
    if (this.elevenLabsProvider.isAvailable()) {
      try {
        await this.elevenLabsProvider.speak(text, options);
        const result: TTSDispatchResult = {
          success: true,
          providerUsed: 'elevenlabs',
          fallbackTriggered: true,
          fallbackReason: `fish_audio_failed: ${reason}`,
          detectedLanguage: langInfo.language,
          languageCode: langInfo.languageCode,
          blockedByPrivacy: false,
          text,
          originalText: originalText || text,
          normalizedText: text,
          textOnly: false,
        };
        this.lastDispatchResult = result;
        this.isCurrentlySpeaking = false;
        return result;
      } catch (elevenLabsErr: any) {
        logger.warn('TTSRouter', `ElevenLabs fallback also failed: ${elevenLabsErr.message}`);
      }
    }

    // 2. If both fail, display text without audio
    return this.fallbackToTextOnly(
      text,
      langInfo,
      `Both Fish Audio and ElevenLabs failed: ${reason}`,
      originalText
    );
  }

  /**
   * Safe fallback to Local/System TTS.
   */
  private async fallbackToLocal(
    text: string,
    options: SpeakOptions,
    langInfo: LanguageDetectionResult,
    reason: string,
    originalText?: string
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
          originalText: originalText || text,
          normalizedText: text,
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
    return this.fallbackToTextOnly(text, langInfo, `Local fallback failed: ${reason}`, originalText);
  }

  /**
   * Rule 4: Graceful text-only fallback (never crash application).
   */
  private fallbackToTextOnly(
    text: string,
    langInfo: LanguageDetectionResult,
    reason: string,
    originalText?: string
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
      originalText: originalText || text,
      normalizedText: text,
      textOnly: true,
    };
    this.lastDispatchResult = result;
    return result;
  }
}
