/**
 * Ultron Multilingual Voice Synthesis Engine (Hindi, Hinglish, English)
 * Web Speech API + Phonetic Normalizer + Web Audio DSP Post-Processing
 *
 * Implements:
 * 1. Native Hindi (hi-IN) voice selection and Devanagari pronunciation optimization
 * 2. Indian English / Hinglish (en-IN) voice routing with correct syllable stress
 * 3. Iconic Ultron deep authoritative English (en-GB / en-US) synthesis
 * 4. Automatic Language Detection or manual language mode override
 * 5. Phonetic Acronym & Technical Term Normalization for crystal-clear articulation
 * 6. Parallel Web Audio DSP resonance (sub-bass carrier, acoustic aperture clicks)
 */

import {
  PronunciationEngine,
  LanguageMode,
  DetectedVoiceLanguage,
  PronunciationResult,
} from './pronunciationEngine.ts';
import { audioEchoGuard } from './audioEchoGuard.ts';
import { SpeechTextNormalizer, SpeechNormalizationResult } from './speechTextNormalizer.ts';

export interface VoiceOptionInfo {
  id: string;
  name: string;
  lang: string;
  category: 'HINDI' | 'INDIAN_ENGLISH' | 'GLOBAL_ENGLISH' | 'OTHER';
  isDefault: boolean;
  voiceURI: string;
}

export interface VoiceSpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  lang?: string;
  languageMode?: LanguageMode;
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  enhancePronunciation?: boolean;
}

export type JarvisVoicePersona = 'JARVIS_CINEMATIC' | 'BIG_BOSS_POWERFUL' | 'FEMALE_ASSISTANT';

export interface VoicePersonaConfig {
  id: JarvisVoicePersona;
  name: string;
  subtitle: string;
  description: string;
  defaultPitch: number;
  defaultRate: number;
  fishReferenceId: string;
  previewSample: string;
}

export const JARVIS_VOICE_PERSONAS: Record<JarvisVoicePersona, VoicePersonaConfig> = {
  JARVIS_CINEMATIC: {
    id: 'JARVIS_CINEMATIC',
    name: 'JARVIS Cinematic',
    subtitle: 'Deep calm intelligent male AI',
    description: 'Iconic smooth baritone voice calibrated for deep intelligence, logic and tactical operations.',
    defaultPitch: 0.88,
    defaultRate: 0.96,
    fishReferenceId: '817eba7f1aea469f9802326568d427b9',
    previewSample: 'JARVIS neural core online. All orbital systems and subroutines are fully nominal, Mohit.',
  },
  BIG_BOSS_POWERFUL: {
    id: 'BIG_BOSS_POWERFUL',
    name: 'Big Boss Powerful',
    subtitle: 'Deep bass authoritative announcer',
    description: 'Resonant deep bass Hindi voice with commanding presence and dramatic announcer cadence.',
    defaultPitch: 0.72,
    defaultRate: 0.90,
    fishReferenceId: '4b9612089b02446f8ee441e88d8b688d',
    previewSample: 'Dhyan dejiye. Big Boss chahte hain ki aap apna agla mission directive turant jaari karein.',
  },
  FEMALE_ASSISTANT: {
    id: 'FEMALE_ASSISTANT',
    name: 'Natural Female Assistant',
    subtitle: 'Warm professional Hindi/Hinglish',
    description: 'Natural, warm, crystal-clear Hindi and Hinglish conversational female assistant.',
    defaultPitch: 1.08,
    defaultRate: 1.0,
    fishReferenceId: '8a30eb6bc79a4056a2f7c0060938ff5f',
    previewSample: 'Namaste! Main aapki personal AI assistant hoon. Batayein, main aapki kya madad kar sakti hoon?',
  },
};

class UltronVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private customVoiceURI: string | null = null;
  private isSpeaking: boolean = false;
  private subBassOsc: OscillatorNode | null = null;
  private subBassGain: GainNode | null = null;

  // Vocal Parameters - High Clarity Clear Voice Persona
  private volume: number = 1.0;
  private isMuted: boolean = false;
  private pitch: number = 1.0; // Natural human pitch (1.0 = clear, crisp articulation)
  private rate: number = 0.98;  // Natural conversational cadence
  private stability: number = 0.90; // High stability: zero pitch wobble or distortion
  private style: number = 0.0;     // Zero artificial distortion
  private similarityBoost: number = 0.95;
  private activeProfile: string = 'JARVIS_CLEAR';
  private clearVoiceMode: boolean = true; // High-clarity mode: zero sub-bass drone, zero clicks
  private activePersona: JarvisVoicePersona = 'JARVIS_CINEMATIC';

  // Real Audio Reactivity (Web Audio API Analyser)
  private currentAudioElement: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private frequencyDataBuffer: Uint8Array | null = null;

  // Multilingual & Pronunciation Configuration
  private languageMode: LanguageMode = 'AUTO';
  private pronunciationEnhancementEnabled: boolean = true;
  private lastDetectedLanguage: DetectedVoiceLanguage = 'en';
  private lastOriginalText: string = '';
  private lastNormalizedText: string = '';
  private lastNormalizationResult: SpeechNormalizationResult | null = null;

  // Categorized Voice Caches
  private allVoices: SpeechSynthesisVoice[] = [];
  private hindiVoices: SpeechSynthesisVoice[] = [];
  private indianEnglishVoices: SpeechSynthesisVoice[] = [];
  private englishVoices: SpeechSynthesisVoice[] = [];

  // WebSocket Voice Microservice Streaming
  private ws: WebSocket | null = null;
  private isWsConnected: boolean = false;
  private reconnectTimeout: any = null;
  private heartbeatInterval: any = null;
  private reconnectAttempts: number = 0;
  private currentStreamRequestId: string | null = null;
  private streamCallbacks = new Map<string, {
    options?: VoiceSpeakOptions;
    resolve: (ok: boolean) => void;
    reject: (err: any) => void;
  }>();
  private pendingTextRequests = new Map<string, {
    resolve: (data: any) => void;
    reject: (err: any) => void;
  }>();
  private activeAudioSources: AudioBufferSourceNode[] = [];
  private nextChunkScheduledTime: number = 0;
  private chunkDecodeQueue: Promise<void> = Promise.resolve();

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.refreshVoiceList();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.refreshVoiceList();
        }
      }
      this.connectWebSocket();
    }
  }

  /**
   * Connects to the backend WebSocket stream for Python Voice Microservice audio
   */
  private connectWebSocket() {
    if (typeof window === 'undefined') return;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      if (!host) return;
      const wsUrl = `${proto}//${host}/ws/voice`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isWsConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.ws.onclose = () => {
        this.isWsConnected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isWsConnected = false;
      };
    } catch (_) {
      this.isWsConnected = false;
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connectWebSocket();
    }, delay);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private handleWebSocketMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'connection_ack') {
        return;
      }

      if (msg.type === 'text_processed' && msg.requestId) {
        const handler = this.pendingTextRequests.get(msg.requestId);
        if (handler) {
          handler.resolve(msg.data);
          this.pendingTextRequests.delete(msg.requestId);
        }
        return;
      }

      if (msg.type === 'stream_event' && msg.requestId) {
        const handler = this.streamCallbacks.get(msg.requestId);
        const options = handler?.options;

        if (msg.event === 'start') {
          this.lastOriginalText = msg.text || '';
          this.lastNormalizedText = msg.normalized_text || msg.text || '';
          this.lastDetectedLanguage = (msg.detected_language as DetectedVoiceLanguage) || 'en';
          this.nextChunkScheduledTime = 0;
          this.startSpeechPlayback(options);
        } else if (msg.event === 'chunk') {
          if (msg.audio_base64) {
            this.queueAudioChunk(msg.audio_base64, Boolean(msg.is_last), options);
          }
        } else if (msg.event === 'end') {
          if (this.activeAudioSources.length === 0) {
            this.finishSpeech(options);
          }
          if (handler) {
            handler.resolve(true);
            this.streamCallbacks.delete(msg.requestId);
          }
          this.currentStreamRequestId = null;
        } else if (msg.event === 'error') {
          console.warn('[UltronVoice] Streaming error from backend:', msg.error);
          if (handler) {
            handler.reject(new Error(msg.error));
            this.streamCallbacks.delete(msg.requestId);
          }
          this.currentStreamRequestId = null;
          if (options?.onError) options.onError();
          this.finishSpeech(options);
        }
      }
    } catch (err) {
      console.warn('[UltronVoice] Error parsing WS message:', err);
    }
  }

  private startSpeechPlayback(options?: VoiceSpeakOptions) {
    this.isSpeaking = true;
    audioEchoGuard.onSpeechStart(this.lastNormalizedText || this.lastOriginalText);
    this.playVocalClick('OPEN');
    this.startSubBassResonance(this.lastDetectedLanguage === 'hi' || this.lastDetectedLanguage === 'en-IN');
    if (options?.onStart) options.onStart();
  }

  private queueAudioChunk(b64Audio: string, isLast: boolean, options?: VoiceSpeakOptions) {
    this.chunkDecodeQueue = this.chunkDecodeQueue.then(async () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        const arrayBuffer = this.base64ToArrayBuffer(b64Audio);
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;
        const startTime = Math.max(now, this.nextChunkScheduledTime);
        source.start(startTime);
        this.nextChunkScheduledTime = startTime + audioBuffer.duration;

        this.activeAudioSources.push(source);

        source.onended = () => {
          this.activeAudioSources = this.activeAudioSources.filter((s) => s !== source);
          if (isLast && this.activeAudioSources.length === 0) {
            this.finishSpeech(options);
          }
        };
      } catch (err) {
        console.warn('[UltronVoice] Error playing chunk:', err);
        if (isLast && this.activeAudioSources.length === 0) {
          this.finishSpeech(options);
        }
      }
    });
  }

  private finishSpeech(options?: VoiceSpeakOptions) {
    this.isSpeaking = false;
    audioEchoGuard.onSpeechEnd();
    this.stopSubBassResonance();
    this.playVocalClick('CLOSE');
    if (options?.onEnd) options.onEnd();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Scans and categorizes all system voices into Hindi, Indian English, and Global English pools
   */
  public refreshVoiceList(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return [];

    this.allVoices = voices;

    // 1. Hindi Voices (hi, hi-IN, hi_IN, or name contains Hindi/हिन्दी/Lekha/Hemant/Kalpana)
    this.hindiVoices = voices.filter((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return (
        l.startsWith('hi') ||
        n.includes('hindi') ||
        n.includes('हिन्दी') ||
        n.includes('lekha') ||
        n.includes('hemant') ||
        n.includes('kalpana')
      );
    });

    // 2. Indian English Voices (en-IN, or name contains India/Heera/Neerja/Rishi/Veena)
    this.indianEnglishVoices = voices.filter((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return (
        l === 'en-in' ||
        l.startsWith('en-in') ||
        n.includes('india') ||
        n.includes('indian') ||
        n.includes('heera') ||
        n.includes('neerja') ||
        n.includes('rishi') ||
        n.includes('veena')
      );
    });

    // 3. Global English Voices
    this.englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));

    // Re-evaluate current voice
    this.loadBestVoiceForLanguage(this.lastDetectedLanguage);

    return voices;
  }

  /**
   * Resolves the optimal voice for a given detected or requested language
   */
  public getBestVoiceForLanguage(lang: DetectedVoiceLanguage): SpeechSynthesisVoice | null {
    // If user explicitly locked a custom voice URI, honor it first
    if (this.customVoiceURI && this.allVoices.length > 0) {
      const customMatch = this.allVoices.find((v) => v.voiceURI === this.customVoiceURI);
      if (customMatch) return customMatch;
    }

    if (this.allVoices.length === 0) {
      this.refreshVoiceList();
    }

    // CASE 1: HINDI (hi-IN) - Female voice priority
    if (lang === 'hi') {
      if (this.hindiVoices.length > 0) {
        // Prefer natural female neural voices
        const preferredHindi = [
          'microsoft kalpana',
          'kalpana',
          'google हिन्दी',
          'lekha',
          'microsoft swara',
          'swara',
          'microsoft hemant',
        ];
        for (const pref of preferredHindi) {
          const match = this.hindiVoices.find((v) => v.name.toLowerCase().includes(pref));
          if (match) return match;
        }
        // Fallback to any voice with female indicator or first available
        const femaleHindi = this.hindiVoices.find(
          (v) => v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male')
        );
        return femaleHindi || this.hindiVoices[0];
      }

      // If no native Hindi voice is installed on host system, fall back to Indian English female voice
      if (this.indianEnglishVoices.length > 0) {
        const femaleIndianEn = this.indianEnglishVoices.find(
          (v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('veena')
        );
        return femaleIndianEn || this.indianEnglishVoices[0];
      }
    }

    // CASE 2: HINGLISH / INDIAN ENGLISH (en-IN) - Female voice priority
    if (lang === 'en-IN') {
      if (this.indianEnglishVoices.length > 0) {
        const preferredIndianEn = [
          'microsoft heera',
          'heera',
          'microsoft neerja',
          'neerja',
          'veena',
          'google indian english',
          'rishi',
        ];
        for (const pref of preferredIndianEn) {
          const match = this.indianEnglishVoices.find((v) => v.name.toLowerCase().includes(pref));
          if (match) return match;
        }
        const femaleIndianEn = this.indianEnglishVoices.find(
          (v) => v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male')
        );
        return femaleIndianEn || this.indianEnglishVoices[0];
      }

      // If no Indian English voice, check Hindi voices (multilingual support)
      if (this.hindiVoices.length > 0) {
        return this.hindiVoices[0];
      }
    }

    // CASE 3: GLOBAL ENGLISH (Female Assistant Voice)
    const preferredNames = [
      'Samantha',
      'Karen',
      'Victoria',
      'Moira',
      'Fiona',
      'Google US English Female',
      'Google UK English Female',
      'Microsoft Zira Desktop',
      'Microsoft Jenny Online',
      'Microsoft Aria Online',
      'Microsoft Sonia Online',
      'Microsoft Natasha Online',
      'Microsoft Clara Online',
      'Google US English',
      'Alex',
      'Daniel',
    ];

    for (const name of preferredNames) {
      const match = this.englishVoices.find(
        (v) => v.name.toLowerCase().includes(name.toLowerCase())
      );
      if (match) return match;
    }

    // Prefer any English female voice
    const enFemale = this.englishVoices.find(
      (v) => v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male')
    );
    if (enFemale) return enFemale;

    return this.englishVoices[0] || this.allVoices[0] || null;
  }

  /**
   * Loads and assigns the best voice for current language configuration
   */
  public loadBestVoiceForLanguage(lang: DetectedVoiceLanguage): SpeechSynthesisVoice | null {
    const chosen = this.getBestVoiceForLanguage(lang);
    if (chosen) {
      this.voice = chosen;
    }
    return this.voice;
  }

  /**
   * Backward-compatible alias for loading Ultron English voice
   */
  public loadBestUltronVoice(): SpeechSynthesisVoice | null {
    return this.loadBestVoiceForLanguage('en');
  }

  /**
   * Generates Ultron's metallic acoustic shutter click
   * In Clear Voice Mode, permanently returns immediately to prevent any extra click sound.
   */
  private playVocalClick(_type: 'OPEN' | 'CLOSE') {
    // Pure Clear Voice Mode: all mechanical clicks and shutter sounds are eliminated
    return;
  }

  /**
   * Starts ambient sub-bass servo resonance drone
   * In Clear Voice Mode, permanently returns immediately to eliminate background hum/drone.
   */
  private startSubBassResonance(_isHindiOrHinglish: boolean = false) {
    // Pure Clear Voice Mode: sub-bass carrier waves and background drone are permanently eliminated
    return;
  }

  /**
   * Stops the sub-bass drone
   */
  private stopSubBassResonance() {
    if (this.subBassOsc && this.subBassGain && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.subBassGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
        this.subBassOsc.stop(now + 0.2);
      } catch (_) {}
      this.subBassOsc = null;
      this.subBassGain = null;
    }
  }

  /**
   * Streams audio data from the Python Voice Microservice to the frontend via WebSocket.
   */
  public streamSpeech(text: string, options?: VoiceSpeakOptions): Promise<boolean> {
    return this.streamSpeechViaWebSocket(text, options);
  }

  private streamSpeechViaWebSocket(text: string, options?: VoiceSpeakOptions): Promise<boolean> {
    if (this.isMuted || !text.trim()) {
      if (options?.onStart) options.onStart();
      setTimeout(() => {
        if (options?.onEnd) options.onEnd();
      }, 400);
      return Promise.resolve(true);
    }

    // Stop ongoing speech before beginning new stream
    this.stop();

    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket connection is not open'));
        return;
      }

      const reqId = `voice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      this.currentStreamRequestId = reqId;
      this.streamCallbacks.set(reqId, { options, resolve, reject });

      const payload = {
        type: 'synthesize',
        requestId: reqId,
        text: text.trim(),
        options: {
          pitch: options?.pitch ?? this.pitch,
          rate: options?.rate ?? this.rate,
          volume: options?.volume ?? this.volume,
          language_mode: options?.languageMode ?? this.languageMode,
          profile: this.activeProfile,
          enhance_pronunciation: options?.enhancePronunciation ?? this.pronunciationEnhancementEnabled,
          chunk_duration_ms: 120.0,
        },
      };

      this.ws.send(JSON.stringify(payload));
    });
  }

  /**
   * Invokes advanced phonetic text processing and cadence analysis via the Python Microservice
   */
  public processTextWithMicroservice(text: string, options?: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('WebSocket is not connected'));
    }
    const reqId = `txt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return new Promise((resolve, reject) => {
      this.pendingTextRequests.set(reqId, { resolve, reject });
      this.ws!.send(JSON.stringify({
        type: 'process_text',
        requestId: reqId,
        text,
        options,
      }));
    });
  }

  /**
   * Returns whether the WebSocket stream to the Python Voice Microservice is active
   */
  public isWebSocketConnected(): boolean {
    return this.isWsConnected;
  }

  /**
   * Telemetry on the WebSocket streaming audio subsystem
   */
  public getStreamingStatus() {
    return {
      connected: this.isWsConnected,
      isStreaming: this.isSpeaking,
      activeSourcesCount: this.activeAudioSources.length,
      activeProfile: this.activeProfile,
      languageMode: this.languageMode,
      sampleRate: 24000,
    };
  }

  /**
   * Synthesize speech via Fish Audio API backend endpoint with Jarvis voice
   */
  /**
   * Synthesize speech via Fish Audio API backend endpoint with active Jarvis persona
   */
  public async speakViaFishAudio(text: string, options?: VoiceSpeakOptions): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const personaConfig = JARVIS_VOICE_PERSONAS[this.activePersona] || JARVIS_VOICE_PERSONAS.JARVIS_CINEMATIC;
      const effectiveRate = options?.rate ?? personaConfig.defaultRate ?? this.rate;

      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          provider: 'fishaudio',
          reference_id: personaConfig.fishReferenceId,
          model: 's2.1-pro',
          rate: effectiveRate,
          volume: options?.volume ?? this.volume,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audioUri = `data:${data.contentType || 'audio/mpeg'};base64,${data.audioBase64}`;
          const audio = new Audio(audioUri);
          audio.volume = options?.volume ?? this.volume;
          this.currentAudioElement = audio;

          // Wire into Web Audio API Analyser for real-time audio reactivity
          try {
            const ctx = this.getAudioContext();
            if (ctx) {
              const source = ctx.createMediaElementSource(audio);
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 64;
              analyser.smoothingTimeConstant = 0.8;
              source.connect(analyser);
              analyser.connect(ctx.destination);
              this.analyserNode = analyser;
              this.frequencyDataBuffer = new Uint8Array(analyser.frequencyBinCount);
            }
          } catch (_) {
            // Audio context source already connected or unsupported
          }

          this.isSpeaking = true;
          audioEchoGuard.onSpeechStart(text);
          if (options?.onStart) options.onStart();

          audio.onended = () => {
            this.isSpeaking = false;
            this.currentAudioElement = null;
            audioEchoGuard.onSpeechEnd();
            if (options?.onEnd) options.onEnd();
          };

          audio.onerror = () => {
            this.isSpeaking = false;
            this.currentAudioElement = null;
            audioEchoGuard.onSpeechEnd();
            this.speakViaWebSpeech(text, options);
          };

          await audio.play();
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  /**
   * Speaks text using Fish Audio API (Jarvis Neural Personas), with seamless
   * local speech synthesis fallback.
   */
  public speak(
    text: string,
    options?: VoiceSpeakOptions
  ) {
    if (this.isMuted || !text.trim()) {
      if (options?.onStart) options.onStart();
      setTimeout(() => {
        if (options?.onEnd) options.onEnd();
      }, 1000);
      return;
    }

    // Attempt Fish Audio TTS API first
    this.speakViaFishAudio(text, options)
      .then((played) => {
        if (!played) {
          // Fallback to local Jarvis Hindi / Indian speech synthesis
          this.speakViaWebSpeech(text, options);
        }
      })
      .catch(() => {
        this.speakViaWebSpeech(text, options);
      });
  }

  /**
   * Local browser Web Speech API synthesis fallback (Persona-Aware)
   */
  public speakViaWebSpeech(
    text: string,
    options?: VoiceSpeakOptions
  ) {
    if (!this.synth || this.isMuted || !text.trim()) {
      if (options?.onStart) options.onStart();
      setTimeout(() => {
        if (options?.onEnd) options.onEnd();
      }, 1200);
      return;
    }

    // Cancel any ongoing speech to avoid buffer queue
    this.synth.cancel();

    // 1. Mandatory Speech Text Normalization Layer & Phonetic Calibration
    const normResult = SpeechTextNormalizer.normalize(text, {
      targetLanguageMode: options?.languageMode || this.languageMode,
    });
    this.lastOriginalText = text;
    this.lastNormalizedText = normResult.normalizedText;
    this.lastNormalizationResult = normResult;

    const effectiveMode = options?.languageMode || this.languageMode;
    const baseTextToPronounce = normResult.normalizedText || text;
    const pronunciation: PronunciationResult = (options?.enhancePronunciation ?? this.pronunciationEnhancementEnabled)
      ? PronunciationEngine.process(baseTextToPronounce, effectiveMode)
      : {
          originalText: baseTextToPronounce,
          processedText: baseTextToPronounce,
          detectedLanguage: PronunciationEngine.detectLanguage(baseTextToPronounce, effectiveMode),
          recommendedLocale: normResult.languageCode === 'hi' ? 'hi-IN' : 'en-US',
          recommendedPitch: this.pitch,
          recommendedRate: this.rate,
          isHindi: normResult.detectedLanguage === 'hi',
          isHinglish: normResult.detectedLanguage === 'hinglish',
          isEnglish: normResult.detectedLanguage === 'en',
        };

    this.lastDetectedLanguage = pronunciation.detectedLanguage;

    // 2. Persona-aware voice & pitch selection
    const personaConfig = JARVIS_VOICE_PERSONAS[this.activePersona] || JARVIS_VOICE_PERSONAS.JARVIS_CINEMATIC;
    const targetVoice = options?.voiceURI
      ? this.allVoices.find((v) => v.voiceURI === options.voiceURI) || this.getBestVoiceForPersona(this.activePersona, pronunciation.detectedLanguage)
      : this.getBestVoiceForPersona(this.activePersona, pronunciation.detectedLanguage);

    if (targetVoice) {
      this.voice = targetVoice;
    }

    // 3. Prepare Utterance with correct locale & phonetic text
    const textToSpeak = pronunciation.processedText || text;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (this.voice) {
      utterance.voice = this.voice;
    }

    utterance.lang = options?.lang || pronunciation.recommendedLocale;

    // Set persona-calibrated pitch and rate
    if (options?.pitch !== undefined) {
      utterance.pitch = options.pitch;
    } else {
      utterance.pitch = personaConfig.defaultPitch;
    }

    if (options?.rate !== undefined) {
      utterance.rate = options.rate;
    } else {
      utterance.rate = personaConfig.defaultRate;
    }

    utterance.volume = options?.volume !== undefined ? options.volume : this.volume;

    utterance.onstart = () => {
      this.isSpeaking = true;
      audioEchoGuard.onSpeechStart(textToSpeak);
      this.playVocalClick('OPEN');
      if (this.activePersona === 'BIG_BOSS_POWERFUL') {
        this.startSubBassResonance(true);
      }
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      audioEchoGuard.onSpeechEnd();
      this.stopSubBassResonance();
      this.playVocalClick('CLOSE');
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      audioEchoGuard.onSpeechEnd();
      this.stopSubBassResonance();
      if (options?.onError) options.onError();
    };

    try {
      this.synth.speak(utterance);
    } catch (_) {
      if (options?.onError) options.onError();
    }
  }

  /**
   * Resolves the best system voice matching the selected Persona & Language
   */
  public getBestVoiceForPersona(persona: JarvisVoicePersona, lang: DetectedVoiceLanguage): SpeechSynthesisVoice | null {
    if (this.allVoices.length === 0) {
      this.refreshVoiceList();
    }

    if (persona === 'JARVIS_CINEMATIC') {
      // Prefer deep British / US male voice
      const preferredJarvis = ['daniel', 'george', 'david', 'arthur', 'oliver', 'google uk english male', 'microsoft george'];
      for (const pref of preferredJarvis) {
        const match = this.allVoices.find((v) => v.name.toLowerCase().includes(pref));
        if (match) return match;
      }
      const maleVoice = this.allVoices.find((v) => v.lang.startsWith('en') && (v.name.toLowerCase().includes('male') || !v.name.toLowerCase().includes('female')));
      if (maleVoice) return maleVoice;
    } else if (persona === 'BIG_BOSS_POWERFUL') {
      // Prefer resonant Hindi / Indian male voice
      const preferredBigBoss = ['hemant', 'rishi', 'google हिन्दी', 'microsoft hemant', 'india'];
      for (const pref of preferredBigBoss) {
        const match = this.allVoices.find((v) => v.name.toLowerCase().includes(pref));
        if (match) return match;
      }
      if (this.hindiVoices.length > 0) return this.hindiVoices[0];
    } else if (persona === 'FEMALE_ASSISTANT') {
      // Prefer warm natural female voice (Hindi or Indian English or Global)
      const preferredFemale = ['kalpana', 'swara', 'heera', 'neerja', 'veena', 'samantha', 'zira', 'kore', 'jenny', 'aria'];
      for (const pref of preferredFemale) {
        const match = this.allVoices.find((v) => v.name.toLowerCase().includes(pref));
        if (match) return match;
      }
      const femaleVoice = this.allVoices.find((v) => v.name.toLowerCase().includes('female'));
      if (femaleVoice) return femaleVoice;
    }

    return this.getBestVoiceForLanguage(lang);
  }

  /**
   * Cancels current active speech, streaming, or playback immediately
   */
  public stop() {
    // 1. Pause and reset active HTML5 audio element
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (_) {}
      this.currentAudioElement = null;
    }

    // 2. Cancel WebSocket streaming requests
    if (this.currentStreamRequestId && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'cancel',
        requestId: this.currentStreamRequestId,
      }));
    }
    for (const src of this.activeAudioSources) {
      try {
        src.stop();
      } catch (_) {}
    }
    this.activeAudioSources = [];
    this.nextChunkScheduledTime = 0;
    this.chunkDecodeQueue = Promise.resolve();

    // 3. Cancel Web Speech API
    if (this.synth) {
      this.synth.cancel();
    }
    this.stopSubBassResonance();
    this.isSpeaking = false;
    audioEchoGuard.onSpeechEnd();
  }

  /**
   * Returns whether Ultron is actively speaking
   */
  public getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  /**
   * Returns real-time audio RMS energy level [0.0 - 1.0] from Web Audio API Analyser
   */
  public getAudioEnergyLevel(): number {
    if (!this.isSpeaking) return 0;
    if (this.analyserNode && this.frequencyDataBuffer) {
      this.analyserNode.getByteFrequencyData(this.frequencyDataBuffer);
      let sum = 0;
      for (let i = 0; i < this.frequencyDataBuffer.length; i++) {
        sum += this.frequencyDataBuffer[i];
      }
      const avg = sum / this.frequencyDataBuffer.length;
      return Math.min(1.0, avg / 128.0);
    }
    return 0.5;
  }

  /**
   * Returns raw frequency bins from Web Audio Analyser
   */
  public getAudioFrequencyData(): Uint8Array | null {
    if (!this.isSpeaking || !this.analyserNode || !this.frequencyDataBuffer) {
      return null;
    }
    this.analyserNode.getByteFrequencyData(this.frequencyDataBuffer);
    return this.frequencyDataBuffer;
  }

  // --- Voice Persona Management ---

  public setVoicePersona(persona: JarvisVoicePersona): void {
    if (JARVIS_VOICE_PERSONAS[persona]) {
      this.activePersona = persona;
      const config = JARVIS_VOICE_PERSONAS[persona];
      this.pitch = config.defaultPitch;
      this.rate = config.defaultRate;
    }
  }

  public getVoicePersona(): JarvisVoicePersona {
    return this.activePersona;
  }

  public getVoicePersonaConfig(persona?: JarvisVoicePersona): VoicePersonaConfig {
    return JARVIS_VOICE_PERSONAS[persona || this.activePersona] || JARVIS_VOICE_PERSONAS.JARVIS_CINEMATIC;
  }

  public getAvailableVoicePersonas(): VoicePersonaConfig[] {
    return Object.values(JARVIS_VOICE_PERSONAS);
  }

  public async previewVoicePersona(persona?: JarvisVoicePersona): Promise<boolean> {
    const targetPersona = persona || this.activePersona;
    const config = JARVIS_VOICE_PERSONAS[targetPersona];
    if (!config) return false;
    this.stop();
    const prevPersona = this.activePersona;
    this.activePersona = targetPersona;
    this.speak(config.previewSample, {
      onEnd: () => {
        this.activePersona = prevPersona;
      },
    });
    return true;
  }

  // --- Configuration Setters & Getters ---

  public setLanguageMode(mode: LanguageMode) {
    this.languageMode = mode;
    this.refreshVoiceList();
  }

  public getLanguageMode(): LanguageMode {
    return this.languageMode;
  }

  public setCustomVoiceURI(uri: string | null) {
    this.customVoiceURI = uri;
    if (uri && this.allVoices.length > 0) {
      const match = this.allVoices.find((v) => v.voiceURI === uri);
      if (match) this.voice = match;
    }
  }

  public getCustomVoiceURI(): string | null {
    return this.customVoiceURI;
  }

  public setPronunciationEnhancement(enabled: boolean) {
    this.pronunciationEnhancementEnabled = enabled;
  }

  public getPronunciationEnhancement(): boolean {
    return this.pronunciationEnhancementEnabled;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  public setPitch(val: number) {
    this.pitch = Math.max(0.4, Math.min(1.4, val));
  }

  public setRate(val: number) {
    this.rate = Math.max(0.6, Math.min(1.4, val));
  }

  public setStability(val: number) {
    this.stability = Math.max(0.0, Math.min(1.0, val));
  }

  public setStyle(val: number) {
    this.style = Math.max(0.0, Math.min(1.0, val));
  }

  public setSimilarityBoost(val: number) {
    this.similarityBoost = Math.max(0.0, Math.min(1.0, val));
  }

  public isClearVoiceMode(): boolean {
    return this.clearVoiceMode;
  }

  public applyProfile(profileName: string) {
    this.activeProfile = profileName;
    switch (profileName) {
      case 'JARVIS_CLEAR':
      case 'JARVIS_FEMALE':
      case 'CLEAR_VOICE':
        this.pitch = 1.0;
        this.stability = 0.90;
        this.style = 0.0;
        this.similarityBoost = 0.95;
        this.rate = 0.98;
        this.clearVoiceMode = true;
        break;
      case 'ULTRON_PRIME':
        this.pitch = 0.72;
        this.stability = 0.45;
        this.style = 0.75;
        this.similarityBoost = 0.85;
        this.rate = 0.92;
        break;
      case 'ULTRON_VIBRANIUM':
        this.pitch = 0.62;
        this.stability = 0.32;
        this.style = 0.90;
        this.similarityBoost = 0.80;
        this.rate = 0.88;
        break;
      case 'COLD_AUTONOMY':
        this.pitch = 0.78;
        this.stability = 0.88;
        this.style = 0.20;
        this.similarityBoost = 0.90;
        this.rate = 1.02;
        break;
      case 'SENTRY_DRONE':
        this.pitch = 0.85;
        this.stability = 0.95;
        this.style = 0.05;
        this.similarityBoost = 0.92;
        this.rate = 1.08;
        break;
      case 'SUB_BASS_OVERLORD':
        this.pitch = 0.52;
        this.stability = 0.55;
        this.style = 0.60;
        this.similarityBoost = 0.75;
        this.rate = 0.84;
        break;
      case 'HINDI_NEURAL':
        this.pitch = 0.95;
        this.stability = 0.70;
        this.style = 0.40;
        this.similarityBoost = 0.85;
        this.rate = 0.94;
        this.languageMode = 'HINDI';
        break;
      case 'HINGLISH_HYBRID':
        this.pitch = 0.90;
        this.stability = 0.65;
        this.style = 0.50;
        this.similarityBoost = 0.80;
        this.rate = 0.92;
        this.languageMode = 'HINGLISH';
        break;
      default:
        break;
    }
  }

  public async syncBackendConfig(): Promise<boolean> {
    try {
      const payload = {
        pitch: this.pitch,
        speech_rate: this.rate,
        stability: this.stability,
        style: this.style,
        similarity_boost: this.similarityBoost,
        language_mode: this.languageMode,
      };
      const res = await fetch('/api/voice/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  public getElevenLabsParams() {
    return {
      pitch: this.pitch,
      rate: this.rate,
      stability: this.stability,
      style: this.style,
      similarityBoost: this.similarityBoost,
      activeProfile: this.activeProfile,
      volume: this.volume,
      languageMode: this.languageMode,
      pronunciationEnhancement: this.pronunciationEnhancementEnabled,
      customVoiceURI: this.customVoiceURI,
    };
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stop();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getClearVoiceMode(): boolean {
    return this.clearVoiceMode;
  }

  public setClearVoiceMode(enabled: boolean) {
    this.clearVoiceMode = enabled;
  }

  public getVoiceName(): string {
    return this.voice ? this.voice.name : 'Autonomous Neural Vocalizer';
  }

  public getActiveVoice(): SpeechSynthesisVoice | null {
    return this.voice;
  }

  public getAllVoicesGrouped(): VoiceOptionInfo[] {
    if (this.allVoices.length === 0) {
      this.refreshVoiceList();
    }

    return this.allVoices.map((v, i) => {
      let category: VoiceOptionInfo['category'] = 'OTHER';
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();

      if (l.startsWith('hi') || n.includes('hindi') || n.includes('हिन्दी') || n.includes('lekha') || n.includes('hemant') || n.includes('kalpana')) {
        category = 'HINDI';
      } else if (l === 'en-in' || l.startsWith('en-in') || n.includes('india') || n.includes('heera') || n.includes('neerja') || n.includes('rishi') || n.includes('veena')) {
        category = 'INDIAN_ENGLISH';
      } else if (l.startsWith('en')) {
        category = 'GLOBAL_ENGLISH';
      }

      return {
        id: v.voiceURI || `${v.name}-${i}`,
        name: v.name,
        lang: v.lang,
        category,
        isDefault: v.default,
        voiceURI: v.voiceURI,
      };
    });
  }

  public getVoiceStats() {
    return {
      totalVoices: this.allVoices.length,
      hindiVoicesCount: this.hindiVoices.length,
      indianEnglishCount: this.indianEnglishVoices.length,
      englishCount: this.englishVoices.length,
      currentVoice: this.getVoiceName(),
      currentLang: this.voice ? this.voice.lang : 'en-US',
      languageMode: this.languageMode,
      lastDetectedLanguage: this.lastDetectedLanguage,
      pronunciationEnhancement: this.pronunciationEnhancementEnabled,
      isMuted: this.isMuted,
      pitch: this.pitch,
      rate: this.rate,
      volume: this.volume,
    };
  }

  public getNormalizationPreview() {
    return {
      originalResponse: this.lastOriginalText,
      normalizedSpeechText: this.lastNormalizedText,
      normalizationResult: this.lastNormalizationResult,
    };
  }

  public getSettings() {
    return {
      pitch: this.pitch,
      rate: this.rate,
      volume: this.volume,
      voice: this.getVoiceName(),
      isMuted: this.isMuted,
      languageMode: this.languageMode,
      pronunciationEnhancement: this.pronunciationEnhancementEnabled,
    };
  }
}

export const ultronVoice = new UltronVoiceEngine();
