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

class UltronVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private customVoiceURI: string | null = null;
  private isSpeaking: boolean = false;
  private subBassOsc: OscillatorNode | null = null;
  private subBassGain: GainNode | null = null;

  // Vocal Parameters
  private volume: number = 0.9;
  private isMuted: boolean = false;
  private pitch: number = 1.0; // Default natural pitch for female persona (0.80 - 1.30)
  private rate: number = 0.96;  // Natural conversational cadence
  private stability: number = 0.65; // Stability (0.0 - 1.0)
  private style: number = 0.50;     // Style exaggeration (0.0 - 1.0)
  private similarityBoost: number = 0.80; // Similarity boost (0.0 - 1.0)
  private activeProfile: string = 'JARVIS_FEMALE';

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

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.refreshVoiceList();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.refreshVoiceList();
        }
      }
    }
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
   */
  private playVocalClick(type: 'OPEN' | 'CLOSE') {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(type === 'OPEN' ? 1800 : 1200, now);
      filter.Q.setValueAtTime(3.5, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(type === 'OPEN' ? 240 : 180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (_) {}
  }

  /**
   * Starts ambient sub-bass servo resonance drone
   * When speaking Hindi or Hinglish, sub-bass is moderated to guarantee vocal clarity and eliminate distortion.
   */
  private startSubBassResonance(isHindiOrHinglish: boolean = false) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      this.stopSubBassResonance();
      const now = ctx.currentTime;

      // Sub-bass carrier frequency
      const baseFreq = 50 + (this.pitch * 32);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);

      // In Hindi/Hinglish mode, keep sub-bass very subtle (0.015) so matras are crystal clear
      const maxSubGain = isHindiOrHinglish ? 0.015 * this.volume : (0.05 + (this.similarityBoost * 0.03)) * this.volume;

      const stabilityDrift = (1 - this.stability) * 3;
      if (stabilityDrift > 0.5) {
        osc.frequency.linearRampToValueAtTime(baseFreq + stabilityDrift, now + 0.4);
      }

      const flutterFreq = 10 + (this.style * 8);
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(flutterFreq, now);
      lfoGain.gain.setValueAtTime((0.01 + (this.style * 0.015)) * this.volume, now);

      lfo.connect(gain.gain);
      lfo.start(now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(maxSubGain, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);

      this.subBassOsc = osc;
      this.subBassGain = gain;
    } catch (_) {}
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
   * Speaks text with correct pronunciation in Hindi, Hinglish, or English
   */
  public speak(
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

    // 2. Select appropriate Voice
    const targetVoice = options?.voiceURI
      ? this.allVoices.find((v) => v.voiceURI === options.voiceURI) || this.getBestVoiceForLanguage(pronunciation.detectedLanguage)
      : this.getBestVoiceForLanguage(pronunciation.detectedLanguage);

    if (targetVoice) {
      this.voice = targetVoice;
    }

    // 3. Prepare Utterance with correct locale & phonetic text
    const textToSpeak = pronunciation.processedText || text;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (this.voice) {
      utterance.voice = this.voice;
    }

    // Correct locale tag is crucial for browser synthesizer's internal phonetic dictionary
    utterance.lang = options?.lang || pronunciation.recommendedLocale;

    // Acoustic parameters:
    // If Hindi or Hinglish, use optimized crisp pitch (0.90-1.0) so vowels don't mumble
    if (pronunciation.isHindi) {
      utterance.pitch = options?.pitch !== undefined ? options.pitch : Math.max(0.85, this.pitch);
      utterance.rate = options?.rate !== undefined ? options.rate : 0.94;
    } else if (pronunciation.isHinglish) {
      utterance.pitch = options?.pitch !== undefined ? options.pitch : Math.max(0.82, this.pitch);
      utterance.rate = options?.rate !== undefined ? options.rate : 0.92;
    } else {
      utterance.pitch = options?.pitch !== undefined ? options.pitch : this.pitch;
      utterance.rate = options?.rate !== undefined ? options.rate : this.rate;
    }

    utterance.volume = options?.volume !== undefined ? options.volume : this.volume;

    utterance.onstart = () => {
      this.isSpeaking = true;
      audioEchoGuard.onSpeechStart(textToSpeak);
      this.playVocalClick('OPEN');
      this.startSubBassResonance(pronunciation.isHindi || pronunciation.isHinglish);
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
   * Cancels current active speech immediately
   */
  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.stopSubBassResonance();
    this.isSpeaking = false;
  }

  /**
   * Returns whether Ultron is actively speaking
   */
  public getSpeakingStatus(): boolean {
    return this.isSpeaking;
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

  public applyProfile(profileName: string) {
    this.activeProfile = profileName;
    switch (profileName) {
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
