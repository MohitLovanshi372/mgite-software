/**
 * Web Speech API Providers for Browser & Desktop Renderer Environments
 *
 * Implements native SpeechRecognition / webkitSpeechRecognition for STT and
 * window.speechSynthesis for local zero-cost TTS.
 */

import {
  SpeechToTextProvider,
  TextToSpeechProvider,
  STTResult,
  SpeechVoice,
  SpeechToTextOptions,
  SpeakOptions,
} from './types.ts';

export class WebSpeechSTTProvider implements SpeechToTextProvider {
  public readonly id = 'web_speech_stt';
  public readonly name = 'Browser Web Speech Recognition';

  private recognition: any = null;
  private listening = false;

  constructor() {
    // Lazy check on browser window
  }

  public isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public isListening(): boolean {
    return this.listening;
  }

  public async startListening(options: SpeechToTextOptions): Promise<void> {
    if (typeof window === 'undefined') {
      const err = new Error('Web Speech API is only available in browser window');
      options.onError(err);
      options.onEnd();
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      const err = new Error('SpeechRecognition is not supported in this browser environment');
      (err as any).code = 'unavailable';
      options.onError(err);
      options.onEnd();
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      // Language configuration
      let targetLang = 'en-US';
      if (options.language) {
        if (options.language === 'hi' || options.language === 'hi-IN') {
          targetLang = 'hi-IN';
        } else if (options.language === 'en-IN') {
          targetLang = 'en-IN';
        } else if (options.language === 'en' || options.language === 'en-US') {
          targetLang = 'en-US';
        } else if (options.language !== 'auto') {
          targetLang = options.language;
        }
      }
      this.recognition.lang = targetLang;

      this.recognition.onstart = () => {
        this.listening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim && options.onInterim) {
          options.onInterim(interim);
        }

        if (final) {
          const result: STTResult = {
            transcript: final.trim(),
            confidence: event.results[0]?.[0]?.confidence || 0.9,
            detectedLanguage: targetLang,
            isFinal: true,
          };
          options.onResult(result);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.listening = false;
        const err = new Error(event.error || 'Speech recognition error');
        (err as any).code = event.error;
        options.onError(err);
      };

      this.recognition.onend = () => {
        this.listening = false;
        options.onEnd();
      };

      this.recognition.start();
    } catch (e: any) {
      this.listening = false;
      options.onError(e);
      options.onEnd();
    }
  }

  public async stopListening(): Promise<void> {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
      this.listening = false;
    }
  }
}

export class WebSpeechTTSProvider implements TextToSpeechProvider {
  public readonly id = 'web_speech_tts';
  public readonly name = 'Browser Web Speech Synthesis';

  private activeVoiceId = 'default';
  private activeLang = 'en-US';
  private activeRate = 1.0;
  private activeVolume = 1.0;

  public isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean('speechSynthesis' in window && (window as any).SpeechSynthesisUtterance);
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }

  public async getVoices(): Promise<SpeechVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }

    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(
          voices.map((v, i) => ({
            id: v.voiceURI || `${v.name}-${i}`,
            name: v.name,
            lang: v.lang,
            isDefault: v.default,
            localService: v.localService,
          }))
        );
        return;
      }

      // Voice loading event for Chrome/Safari
      const onVoicesChanged = () => {
        voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = null;
        resolve(
          voices.map((v, i) => ({
            id: v.voiceURI || `${v.name}-${i}`,
            name: v.name,
            lang: v.lang,
            isDefault: v.default,
            localService: v.localService,
          }))
        );
      };

      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
      setTimeout(() => {
        resolve([]);
      }, 500);
    });
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
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options?.onError) {
        options.onError(new Error('SpeechSynthesis not available in this environment'));
      }
      return;
    }

    if (!text || !text.trim()) return;

    this.stop(); // Stop any previous speech

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options?.rate ?? this.activeRate;
        utterance.volume = options?.volume ?? this.activeVolume;
        
        const voices = window.speechSynthesis.getVoices();
        const chosenVoiceId = options?.voiceId || this.activeVoiceId;
        if (chosenVoiceId && chosenVoiceId !== 'default') {
          const match = voices.find((v) => v.voiceURI === chosenVoiceId || v.name === chosenVoiceId);
          if (match) {
            utterance.voice = match;
          }
        }

        utterance.onstart = () => {
          if (options?.onStart) options.onStart();
        };

        utterance.onend = () => {
          if (options?.onEnd) options.onEnd();
          resolve();
        };

        utterance.onerror = (event: any) => {
          // Cancelation is normal when user interrupts
          if (event.error === 'canceled' || event.error === 'interrupted') {
            resolve();
            return;
          }
          const err = new Error(`TTS speech error: ${event.error}`);
          if (options?.onError) options.onError(err);
          reject(err);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err: any) {
        if (options?.onError) options.onError(err);
        reject(err);
      }
    });
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }
}
