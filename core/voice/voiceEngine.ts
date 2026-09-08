/**
 * Voice Engine Interface (Phase 2 Architectural Placeholder)
 * STATUS: Intentionally NOT implemented in Phase 1.
 * Defines future contracts for Wake Word, Speech-to-Text (Whisper/Vosk), and Text-to-Speech (Piper/Coqui).
 */

export interface VoiceEngineConfig {
  wakeWord: string;
  sttEngine: 'local_whisper' | 'vosk';
  ttsVoice: string;
  listenContinuously: boolean;
}

export class VoiceEngine {
  public static readonly STATUS = 'PHASE_2_PLACEHOLDER';

  public static isListening(): boolean {
    return false;
  }

  public static async startListening(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Voice Engine is scheduled for Phase 2 and is intentionally not implemented in Phase 1.',
    };
  }

  public static async speak(text: string): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'TTS is scheduled for Phase 2 and is intentionally not implemented in Phase 1.',
    };
  }
}
