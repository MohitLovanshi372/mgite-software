/**
 * Client-side Speech Recognition Service for JARVIS & Ultron
 *
 * Provides real-time browser Speech-to-Text with prioritized 'hi-IN' and 'en-IN'
 * mixed language detection engines to ensure high accuracy for bilingual
 * Hinglish commands (e.g., "Jarvis, light chalao", "Jarvis, system status dikhao",
 * "जार्विस, लाइट चलाओ").
 */

import {
  normalizeHinglishTranscript,
  parseHinglishCommand,
  isHinglishOrHindi,
  type HinglishParsedCommand,
} from './languageModel.ts';
import { audioEchoGuard } from './audioEchoGuard.ts';
import { pushToTalkService } from './pushToTalkService.ts';

// Re-export for convenient unified imports
export {
  normalizeHinglishTranscript,
  parseHinglishCommand,
  isHinglishOrHindi,
  type HinglishParsedCommand,
};

export type SpeechEngineLocale = 'en-IN' | 'hi-IN' | 'en-US' | string;

export interface SpeechRecognitionConfig {
  language: 'auto' | 'mixed' | 'en-IN' | 'hi-IN' | 'en-US' | string;
  enginePriority: SpeechEngineLocale[];
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface STTResultMetadata {
  raw: string;
  confidence: number;
  language: string;
  engine: string;
  parsedCommand?: HinglishParsedCommand;
  alternatives?: string[];
}

export interface STTOptions {
  language?: 'auto' | 'mixed' | 'en-IN' | 'hi-IN' | 'en-US' | string;
  enginePriority?: SpeechEngineLocale[];
  onInterim?: (interim: string, parsed?: HinglishParsedCommand) => void;
  onResult?: (finalText: string, metadata: STTResultMetadata) => void;
  onError?: (error: Error) => void;
  onStart?: (engine: string) => void;
  onEnd?: () => void;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isCurrentlyListening = false;
  private currentOptions: STTOptions | null = null;

  /**
   * Mixed-language engine priority order.
   * 'en-IN' (Indian English) is the primary engine for mixed Hinglish/English code-switching,
   * followed immediately by 'hi-IN' (Hindi) for pure Hindi & Devanagari acoustics.
   * 'en-US' is relegated to fallback status.
   */
  private enginePriority: SpeechEngineLocale[] = ['en-IN', 'hi-IN', 'en-US'];
  private activeEngine: SpeechEngineLocale = 'en-IN';
  private currentEngineIndex = 0;

  constructor() {
    this.initRecognition();
  }

  private initRecognition(): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      return false;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      return true;
    } catch (e) {
      console.warn('[SpeechRecognitionService] Initialization error:', e);
      return false;
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public isListening(): boolean {
    return this.isCurrentlyListening;
  }

  /**
   * Sets the detection engine priority sequence.
   * Guarantees 'hi-IN' and 'en-IN' mixed language detection engines are prioritized.
   */
  public setEnginePriority(priority: SpeechEngineLocale[]): void {
    if (priority && priority.length > 0) {
      this.enginePriority = [...priority];
      this.activeEngine = this.enginePriority[0];
    }
  }

  public getEnginePriority(): SpeechEngineLocale[] {
    return [...this.enginePriority];
  }

  public getActiveEngine(): SpeechEngineLocale {
    return this.activeEngine;
  }

  public setPreferredLanguage(lang: string): void {
    const lower = lang.toLowerCase();
    if (lower === 'hi' || lower === 'hi-in' || lower === 'hindi') {
      this.enginePriority = ['hi-IN', 'en-IN', 'en-US'];
      this.activeEngine = 'hi-IN';
    } else if (lower === 'en-us' || lower === 'en' || lower === 'english') {
      this.enginePriority = ['en-US', 'en-IN', 'hi-IN'];
      this.activeEngine = 'en-US';
    } else {
      // 'auto', 'mixed', 'hinglish', or 'en-in' prioritizes 'en-IN' and 'hi-IN'
      this.enginePriority = ['en-IN', 'hi-IN', 'en-US'];
      this.activeEngine = 'en-IN';
    }
  }

  public getPreferredLanguage(): string {
    return this.activeEngine;
  }

  /**
   * Resolves the best speech recognition engine locale based on requested options
   * and the prioritized ['en-IN', 'hi-IN'] mixed-language engine suite.
   */
  private resolveEngineLocale(options: STTOptions): SpeechEngineLocale {
    if (options.enginePriority && options.enginePriority.length > 0) {
      this.enginePriority = [...options.enginePriority];
    }

    const requestedLang = (options.language || 'auto').toLowerCase();

    if (requestedLang === 'hi' || requestedLang === 'hi-in' || requestedLang === 'hindi') {
      return 'hi-IN';
    }

    if (requestedLang === 'en-us') {
      return 'en-US';
    }

    if (requestedLang === 'en-in' || requestedLang === 'hinglish') {
      return 'en-IN';
    }

    // For 'auto', 'mixed', or unspecified, prioritize the first engine in enginePriority
    // which defaults to 'en-IN' with 'hi-IN' closely coupled.
    return this.enginePriority[0] || 'en-IN';
  }

  public startListening(options: STTOptions = {}): boolean {
    if (!this.recognition && !this.initRecognition()) {
      options.onError?.(new Error('Speech recognition is not supported in this browser environment.'));
      return false;
    }

    if (this.isCurrentlyListening) {
      this.stopListening();
    }

    this.currentOptions = options;
    this.currentEngineIndex = 0;
    this.activeEngine = this.resolveEngineLocale(options);

    this.recognition.lang = this.activeEngine;

    this.recognition.onstart = () => {
      this.isCurrentlyListening = true;
      this.currentOptions?.onStart?.(this.activeEngine);
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      const alternatives: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcript = item[0]?.transcript || '';
        if (item.isFinal) {
          final += transcript;
          for (let alt = 1; alt < item.length; alt++) {
            if (item[alt]?.transcript) {
              alternatives.push(item[alt].transcript);
            }
          }
        } else {
          interim += transcript;
        }
      }

      if (interim && this.currentOptions?.onInterim) {
        // Drop interim if Push-to-Talk is enabled and chord is not held
        if (pushToTalkService.isPushToTalkEnabled() && !pushToTalkService.isChordActive()) {
          return;
        }
        if (audioEchoGuard.isAcousticEcho(interim)) {
          return;
        }
        const normalizedInterim = normalizeHinglishTranscript(interim);
        const parsedInterim = parseHinglishCommand(interim);
        this.currentOptions.onInterim(normalizedInterim, parsedInterim);
      }

      if (final) {
        const raw = final.trim();

        // Push-to-Talk Enforcement: ignore speech if push-to-talk enabled and chord not active
        if (pushToTalkService.isPushToTalkEnabled() && !pushToTalkService.isChordActive()) {
          return;
        }

        // Acoustic Echo Guard: drop assistant's own voice echo in device latency gap
        if (audioEchoGuard.isAcousticEcho(raw)) {
          return;
        }

        // Parse with comprehensive dictionary model
        const parsedCommand = parseHinglishCommand(raw, alternatives);
        const normalizedText = parsedCommand.normalizedText;
        const confidence = event.results[0]?.[0]?.confidence || 0.92;

        // Auto-detect language classification:
        // If Devanagari is present, mark as 'hi-IN'; if Hinglish detected, mark 'en-IN'
        const detectedLanguage = parsedCommand.detectedLanguage || this.activeEngine;

        const metadata: STTResultMetadata = {
          raw,
          confidence,
          language: detectedLanguage,
          engine: this.activeEngine,
          parsedCommand,
          alternatives,
        };

        this.currentOptions?.onResult?.(normalizedText, metadata);
      }
    };

    this.recognition.onerror = (event: any) => {
      const errorMsg = event.error || 'Speech recognition error';

      // If recognition produced no-speech on the primary engine in auto/mixed mode,
      // attempt one fallback switch to the alternate prioritized engine ('hi-IN' <-> 'en-IN')
      if (
        (event.error === 'no-speech' || event.error === 'network') &&
        this.currentEngineIndex < 1 &&
        (options.language === 'auto' || options.language === 'mixed' || !options.language)
      ) {
        this.currentEngineIndex++;
        const nextEngine = this.enginePriority[this.currentEngineIndex];
        if (nextEngine && nextEngine !== this.activeEngine) {
          console.info(
            `[SpeechRecognitionService] Switching mixed engine from ${this.activeEngine} to prioritized fallback ${nextEngine}`
          );
          this.activeEngine = nextEngine;
          this.recognition.lang = nextEngine;
          try {
            this.recognition.start();
            return;
          } catch {
            // Fall through to error handler if restart fails
          }
        }
      }

      this.isCurrentlyListening = false;
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[SpeechRecognitionService] Engine error:', event.error);
        this.currentOptions?.onError?.(new Error(errorMsg));
      }
      this.currentOptions?.onEnd?.();
    };

    this.recognition.onend = () => {
      this.isCurrentlyListening = false;
      this.currentOptions?.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      console.warn('[SpeechRecognitionService] Failed to start recognition:', err);
      this.isCurrentlyListening = false;
      options.onError?.(err);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isCurrentlyListening) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
    }
    this.isCurrentlyListening = false;
  }
}

// Global singleton instance
export const speechRecognitionService = new SpeechRecognitionService();
