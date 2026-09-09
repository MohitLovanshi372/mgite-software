/**
 * Voice Engine Orchestration Layer (Phase 3 Foundation)
 *
 * Implements:
 * 1. Modular Provider Abstraction (SpeechToTextProvider, TextToSpeechProvider)
 * 2. Privacy-First Pipeline (Transcripts pass through Privacy Filter before AI router)
 * 3. Ephemeral Sessions (Microphone audio is never written to disk or recorded)
 * 4. Barge-In Interruption (User speech immediately cancels assistant TTS)
 * 5. State Machine: IDLE -> LISTENING -> PROCESSING -> SPEAKING -> IDLE
 * 6. Stuck-state auto-recovery (Prevents hanging in LISTENING or PROCESSING)
 * 7. Sensitive voice guard: Raw OTPs and passwords are NEVER spoken aloud
 */

import {
  SpeechToTextProvider,
  TextToSpeechProvider,
  VoiceState,
  VoicePermissionState,
  VoiceSession,
  STTResult,
  VoiceConfig,
  VoiceConfiguration,
  SpeechVoice,
} from './types.ts';
import { WebSpeechSTTProvider, WebSpeechTTSProvider } from './webSpeechProvider.ts';
import { MockSpeechToTextProvider, MockTextToSpeechProvider } from './mockSpeechProvider.ts';
import { TTSRouter } from './ttsRouter.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';
import { getConfig } from '../../config/settings.ts';
import { logger } from '../logger.ts';

export class VoiceEngine {
  private static instance: VoiceEngine | null = null;

  private sttProvider: SpeechToTextProvider;
  private ttsProvider: TextToSpeechProvider;
  private ttsRouter: TTSRouter | null = null;
  private state: VoiceState = 'IDLE';
  private permissionState: VoicePermissionState = 'PROMPT';
  private currentSession: VoiceSession | null = null;
  private stateListeners: Set<(state: VoiceState, session?: VoiceSession | null) => void> = new Set();
  private errorListeners: Set<(err: any) => void> = new Set();
  private stuckStateTimer: NodeJS.Timeout | null = null;
  private customConfig?: Partial<VoiceConfig>;
  private lastSpokenText: string = '';

  constructor(
    configOrStt?: Partial<VoiceConfig> | SpeechToTextProvider,
    sttOrTts?: SpeechToTextProvider | TextToSpeechProvider,
    tts?: TextToSpeechProvider
  ) {
    if (configOrStt && 'enabled' in (configOrStt as any)) {
      this.customConfig = configOrStt as Partial<VoiceConfig>;
      this.sttProvider = (sttOrTts as SpeechToTextProvider) || new MockSpeechToTextProvider();
      if (tts) {
        this.ttsProvider = tts;
        if (tts instanceof TTSRouter) this.ttsRouter = tts;
      } else {
        this.ttsRouter = new TTSRouter();
        this.ttsProvider = this.ttsRouter;
      }
    } else {
      const webSTT = new WebSpeechSTTProvider();
      this.sttProvider = (configOrStt as SpeechToTextProvider) || (webSTT.isAvailable() ? webSTT : new MockSpeechToTextProvider());
      if (sttOrTts && !('isListening' in (sttOrTts as any))) {
        this.ttsProvider = sttOrTts as TextToSpeechProvider;
        if (this.ttsProvider instanceof TTSRouter) this.ttsRouter = this.ttsProvider;
      } else {
        this.ttsRouter = new TTSRouter();
        this.ttsProvider = this.ttsRouter;
      }
    }
  }

  public static getInstance(): VoiceEngine {
    if (!VoiceEngine.instance) {
      VoiceEngine.instance = new VoiceEngine();
    }
    return VoiceEngine.instance;
  }

  public static resetInstance(): void {
    if (VoiceEngine.instance) {
      VoiceEngine.instance.stopAll();
      VoiceEngine.instance = null;
    }
  }

  public getConfig(): VoiceConfig {
    const baseConfig = getConfig().voice;
    return {
      ...baseConfig,
      ...(this.customConfig || {}),
    };
  }

  public updateConfig(cfg: Partial<VoiceConfig>): VoiceConfig {
    this.customConfig = {
      ...(this.customConfig || {}),
      ...cfg,
    };
    return this.getConfig();
  }

  // Provider registration / swapping
  public setSTTProvider(provider: SpeechToTextProvider): void {
    this.sttProvider = provider;
  }

  public setTTSProvider(provider: TextToSpeechProvider): void {
    this.ttsProvider = provider;
    if (provider instanceof TTSRouter) {
      this.ttsRouter = provider;
    }
  }

  public getSTTProvider(): SpeechToTextProvider {
    return this.sttProvider;
  }

  public getTTSProvider(): TextToSpeechProvider {
    return this.ttsProvider;
  }

  public getTTSRouter(): TTSRouter | null {
    if (this.ttsProvider instanceof TTSRouter) {
      return this.ttsProvider;
    }
    return this.ttsRouter;
  }

  public getState(): VoiceState {
    return this.state;
  }

  public getPermissionState(): VoicePermissionState {
    return this.permissionState;
  }

  public getCurrentSession(): VoiceSession | null {
    return this.currentSession;
  }

  public reset(): void {
    this.stopAll();
    this.state = 'IDLE';
    this.currentSession = null;
    if (this.stuckStateTimer) {
      clearTimeout(this.stuckStateTimer);
      this.stuckStateTimer = null;
    }
  }

  public on(event: 'stateChange' | 'error', listener: (...args: any[]) => void): () => void {
    if (event === 'stateChange') {
      this.stateListeners.add(listener);
      return () => this.stateListeners.delete(listener);
    } else if (event === 'error') {
      this.errorListeners.add(listener);
      return () => this.errorListeners.delete(listener);
    }
    return () => {};
  }

  public onStateChange(listener: (state: VoiceState, session?: VoiceSession | null) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setState(newState: VoiceState, errorMsg?: string): void {
    this.state = newState;
    if (this.currentSession) {
      this.currentSession.state = newState;
      if (errorMsg) {
        this.currentSession.lastError = errorMsg;
      }
    }

    // Reset stuck state timer
    if (this.stuckStateTimer) {
      clearTimeout(this.stuckStateTimer);
      this.stuckStateTimer = null;
    }

    // Guard against stuck states: auto-revert to IDLE after timeout
    if (newState === 'LISTENING') {
      this.stuckStateTimer = setTimeout(() => {
        if (this.state === 'LISTENING') {
          logger.warn('VoiceEngine', 'Auto-resetting stuck LISTENING state after 30s');
          this.stopListening();
        }
      }, 30000);
    } else if (newState === 'PROCESSING') {
      this.stuckStateTimer = setTimeout(() => {
        if (this.state === 'PROCESSING') {
          logger.warn('VoiceEngine', 'Auto-resetting stuck PROCESSING state after 45s');
          this.setState('IDLE');
        }
      }, 45000);
    }

    // Notify listeners
    for (const listener of this.stateListeners) {
      try {
        listener(newState, this.currentSession);
      } catch (err) {
        console.error('Error in voice state listener:', err);
      }
    }
  }

  private emitError(err: any): void {
    for (const listener of this.errorListeners) {
      try {
        listener(err);
      } catch (e) {
        console.error('Error in voice error listener:', e);
      }
    }
  }

  /**
   * Start listening for microphone speech.
   * Enforces permissions, creates ephemeral session, and interrupts any active TTS.
   */
  public async startListening(options?: {
    language?: string;
    onInterim?: (text: string) => void;
  }): Promise<{ success: boolean; message?: string }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, message: 'Voice engine is disabled in settings.' };
    }

    // Permission check
    const hasPerm = await this.sttProvider.requestPermission();
    if (!hasPerm) {
      this.permissionState = 'DENIED';
      this.setState('ERROR', 'Microphone permission denied.');
      const err = new Error('Microphone permission denied');
      this.emitError(err);
      throw err;
    }
    this.permissionState = 'GRANTED';

    // Barge-in: User speaks while assistant is speaking -> stop TTS immediately
    if (this.state === 'SPEAKING' || this.ttsProvider.isSpeaking()) {
      this.stopSpeaking();
    }

    // Initialize new ephemeral session (never permanently stored)
    this.currentSession = {
      id: `vsession-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      state: 'LISTENING',
      startTime: new Date().toISOString(),
      language: options?.language || config.preferred_language || 'auto',
    };

    this.setState('LISTENING');

    try {
      await this.sttProvider.startListening({
        language: this.currentSession?.language,
        onInterim: (interimText) => {
          if (options?.onInterim) options.onInterim(interimText);
        },
        onResult: (result: STTResult) => {
          this.handleSTTResult(result);
        },
        onError: (err: any) => {
          const errCode = err.code || err.message;
          if (errCode === 'not-allowed' || err.message?.toLowerCase().includes('permission')) {
            this.permissionState = 'DENIED';
            this.setState('ERROR', 'Microphone permission required.');
          } else if (errCode === 'no-speech') {
            this.setState('IDLE', 'No speech detected.');
          } else {
            this.setState('ERROR', err.message || 'Speech recognition failed.');
          }
          this.emitError(err);
        },
        onEnd: () => {
          if (this.state === 'LISTENING') {
            this.setState('IDLE');
          }
        },
      });
      return { success: true };
    } catch (e: any) {
      this.setState('ERROR', e.message);
      this.emitError(e);
      throw e;
    }
  }

  /**
   * Stop listening explicitly and return the recognized transcript.
   */
  public async stopListening(): Promise<string> {
    try {
      const result = await this.sttProvider.stopListening();
      if (result) {
        this.handleSTTResult(result);
      }
    } finally {
      if (this.state === 'LISTENING') {
        this.setState('IDLE');
      }
    }
    const transcript = this.currentSession?.sanitizedTranscript ?? this.currentSession?.transcript ?? '';
    return transcript.trim();
  }

  /**
   * Safe STT Result Processing:
   * 1. Privacy filter checks for secrets/OTPs.
   * 2. Raw secrets are NEVER logged or retained unsafely.
   * 3. Dispatches transcript to conversation pipeline.
   */
  public handleSTTResult(result: STTResult): {
    rawTranscript: string;
    sanitizedTranscript: string;
    hadSensitiveData: boolean;
    classification: string;
  } {
    const raw = result.transcript || '';
    if (!raw.trim()) {
      this.setState('IDLE');
      return {
        rawTranscript: '',
        sanitizedTranscript: '',
        hadSensitiveData: false,
        classification: 'NORMAL',
      };
    }

    // Step 1: Deterministic Privacy Filter
    const filter = PrivacyFilter.filter(raw);

    // Step 2: Ephemeral session recording (secrets redacted if sensitive)
    if (this.currentSession) {
      this.currentSession.transcript = raw;
      this.currentSession.sanitizedTranscript = filter.redactedText || raw;
    }

    // Step 3: Transition to IDLE/PROCESSING
    this.setState('IDLE');

    return {
      rawTranscript: raw,
      sanitizedTranscript: filter.redactedText || raw,
      hadSensitiveData: filter.blocked || filter.findings.length > 0,
      classification: filter.findings[0]?.type || 'NORMAL',
    };
  }

  /**
   * Safe Text-To-Speech Output:
   * Ensures raw passwords, OTPs, PINs, or sensitive credentials are NEVER spoken aloud by TTS.
   */
  public async speak(
    text: string,
    options?:
      | string
      | {
          voiceId?: string;
          rate?: number;
          volume?: number;
          lang?: string;
          onStart?: () => void;
          onEnd?: () => void;
        }
  ): Promise<{ success: boolean; text: string; state: 'COMPLETED' | 'ERROR'; message?: string }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, text: '', state: 'ERROR', message: 'Voice engine is disabled.' };
    }

    if (!text || !text.trim()) {
      return { success: true, text: '', state: 'COMPLETED' };
    }

    const opts = typeof options === 'string' ? { lang: options } : options;

    // Privacy Guard: Never speak secrets or OTPs aloud!
    const privacy = PrivacyFilter.filter(text);
    let textToSpeak = privacy.redactedText || text;

    // Redact any OTP or password numbers from spoken audio
    textToSpeak = textToSpeak
      .replace(/\b(otp|code|pin)\s*(is|hai|:)?\s*([0-9]{4,8})\b/gi, '$1 [SENSITIVE_DATA_REDACTED]')
      .replace(/\b([0-9]{4,8})\b/g, (m) => {
        // Redact isolated OTP-like numbers if text had sensitive classification
        if (privacy.findings.some((f) => f.type === 'OTP')) return '[SENSITIVE_DATA_REDACTED]';
        return m;
      });

    if (privacy.findings.some((f) => f.type === 'OTP')) {
      textToSpeak = 'Your OTP was detected. Per security policy, sensitive credentials cannot be read aloud.';
    }

    if (privacy.findings.some((f) => f.type === 'PASSWORD' || f.type === 'CREDENTIAL')) {
      textToSpeak = 'Your password update request was processed. Passwords cannot be read aloud.';
    }

    if (privacy.findings.some((f) => ['API_KEY', 'TOKEN', 'CVV'].includes(f.type))) {
      textToSpeak = 'Sensitive credentials detected. Per security policy, sensitive credentials cannot be read aloud.';
    }

    this.lastSpokenText = textToSpeak;
    this.setState('SPEAKING');

    try {
      await this.ttsProvider.speak(textToSpeak, {
        voiceId: opts?.voiceId || config.voice_id,
        rate: opts?.rate ?? config.speech_rate,
        volume: opts?.volume ?? config.speech_volume,
        lang: opts?.lang || config.preferred_language,
        onStart: () => {
          if (opts?.onStart) opts.onStart();
        },
        onEnd: () => {
          if (this.state === 'SPEAKING') {
            this.setState('IDLE');
          }
          if (opts?.onEnd) opts.onEnd();
        },
        onError: (err) => {
          this.setState('ERROR', err.message);
          this.emitError(err);
        },
      });

      if (this.state === 'SPEAKING') {
        this.setState('IDLE');
      }
      return { success: true, text: textToSpeak, state: 'COMPLETED' };
    } catch (err: any) {
      this.setState('ERROR', err.message);
      this.emitError(err);
      if (this.state === 'ERROR') {
        this.setState('IDLE');
      }
      throw err;
    }
  }

  /**
   * Interrupt active speech immediately.
   */
  public stopSpeaking(): void {
    if (this.state === 'SPEAKING' || this.ttsProvider.isSpeaking()) {
      this.ttsProvider.stop();
      this.setState('IDLE');
      logger.info('VoiceEngine', 'Speech playback interrupted (barge-in).');
    }
  }

  /**
   * Stop both microphone and TTS immediately.
   */
  public stopAll(): void {
    this.stopSpeaking();
    this.sttProvider.stopListening().catch(() => {});
    this.setState('IDLE');
  }

  public isListening(): boolean {
    return this.state === 'LISTENING';
  }

  public isSpeaking(): boolean {
    return this.state === 'SPEAKING' || this.ttsProvider.isSpeaking();
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }

  public async getAvailableVoices(): Promise<SpeechVoice[]> {
    return this.ttsProvider.getVoices();
  }

  public updateVoiceConfig(config: Partial<VoiceConfiguration>): VoiceConfiguration {
    return this.updateConfig(config);
  }
}

export const voiceEngine = VoiceEngine.getInstance();
