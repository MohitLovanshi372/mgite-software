/**
 * Phase 3 — Voice Engine Type Definitions
 *
 * Modular, provider-independent contracts for Speech-To-Text (STT),
 * Text-To-Speech (TTS), Voice Sessions, States, and Settings.
 */

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export type VoicePermissionState = 'PROMPT' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE';

export interface SpeechVoice {
  id: string;
  name: string;
  lang: string;
  isDefault?: boolean;
  localService?: boolean;
}

export interface STTResult {
  transcript: string;
  confidence: number;
  detectedLanguage?: string;
  isFinal: boolean;
}

export interface VoiceConfiguration {
  enabled: boolean;
  auto_speak: boolean;
  autoSpeak?: boolean;
  preferred_language: string; // 'auto' | 'hi-IN' | 'en-US' | 'en-IN'
  preferredLanguage?: string;
  voice_id: string;
  voiceId?: string;
  speech_rate: number; // 0.5 to 2.0
  speechRate?: number;
  speech_volume: number; // 0.0 to 1.0
  speechVolume?: number;
  interrupt_speech: boolean;
  interruptSpeech?: boolean;
  stt_provider: string;
  sttProvider?: string;
  tts_provider: string; // 'elevenlabs' | 'system' | 'local' | 'mock'
  ttsProvider?: string;
  elevenlabs_voice_id?: string;
  elevenlabsVoiceId?: string;
  elevenlabs_model?: string;
  elevenlabsModel?: string;
}

export type VoiceConfig = VoiceConfiguration;

export interface VoiceSession {
  id: string;
  state: VoiceState;
  startTime: string;
  endTime?: string;
  transcript?: string;
  sanitizedTranscript?: string;
  lastError?: string;
  language?: string;
}

export interface SpeechToTextOptions {
  language?: string;
  onInterim?: (interimText: string) => void;
  onResult: (result: STTResult) => void;
  onError: (err: Error | { code: string; message: string }) => void;
  onEnd: () => void;
}

export interface SpeechToTextProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean | Promise<boolean>;
  requestPermission?(): Promise<boolean>;
  startListening(options: SpeechToTextOptions): Promise<void>;
  stopListening(): Promise<STTResult | void | null>;
  isListening(): boolean;
}

export interface SpeakOptions {
  voiceId?: string;
  rate?: number;
  volume?: number;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

export interface TextToSpeechProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean | Promise<boolean>;
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isSpeaking(): boolean;
  getVoices(): Promise<SpeechVoice[]>;
  setVoice(voiceId: string): void;
  setLanguage(lang: string): void;
  setRate(rate: number): void;
  setVolume(volume: number): void;
}

export interface CustomVoiceApiConfig {
  endpoint?: string;
  apiKey?: string; // Kept server-side only, never exposed to client
  model?: string;
  voice?: string;
}
