/**
 * React Hook for Voice Engine (Phase 3)
 *
 * Manages Speech-To-Text (STT) and Text-To-Speech (TTS) interactions in the browser.
 * Provides states: IDLE, LISTENING, PROCESSING, SPEAKING, ERROR.
 * Handles microphone permissions, interim transcription, speech interruption (barge-in),
 * and automatic privacy safeguards (secrets/OTPs are never spoken aloud).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api.ts';
import { sanitizeSpeechText } from '../utils/speechSanitizer.ts';

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';
export type VoicePermissionState = 'PROMPT' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE';

export interface VoiceHookOptions {
  onTranscriptComplete?: (text: string) => void;
  autoSpeak?: boolean;
}

export function useVoiceEngine(options?: VoiceHookOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [permissionState, setPermissionState] = useState<VoicePermissionState>('PROMPT');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [voiceConfig, setVoiceConfig] = useState({
    enabled: true,
    autoSpeak: false,
    preferredLanguage: 'auto',
    voiceId: 'default',
    speechRate: 1.0,
    speechVolume: 1.0,
    interruptSpeech: true,
  });

  const recognitionRef = useRef<any>(null);
  const onTranscriptCompleteRef = useRef(options?.onTranscriptComplete);
  onTranscriptCompleteRef.current = options?.onTranscriptComplete;

  // Load voices and status on mount
  useEffect(() => {
    // 1. Fetch server voice config
    apiService
      .getVoiceStatus()
      .then((status) => {
        if (status) {
          setVoiceConfig({
            enabled: status.enabled ?? true,
            autoSpeak: status.autoSpeak ?? false,
            preferredLanguage: status.preferredLanguage || 'auto',
            voiceId: status.voiceId || 'default',
            speechRate: status.speechRate ?? 1.0,
            speechVolume: status.speechVolume ?? 1.0,
            interruptSpeech: status.interruptSpeech ?? true,
          });
          if (status.availableVoices) {
            setAvailableVoices(status.availableVoices);
          }
        }
      })
      .catch(() => {});

    // 2. Load browser voices if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const sysVoices = window.speechSynthesis.getVoices();
        if (sysVoices.length > 0) {
          setAvailableVoices(
            sysVoices.map((v, i) => ({
              id: v.voiceURI || `${v.name}-${i}`,
              name: v.name,
              lang: v.lang,
              isDefault: v.default,
            }))
          );
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  /**
   * Stop any active Speech-To-Text and Text-To-Speech immediately
   */
  const stopAll = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // safe ignore
      }
      recognitionRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    apiService.stopVoice().catch(() => {});
    setVoiceState('IDLE');
    setInterimTranscript('');
  }, []);

  /**
   * Stop Speech Output (Barge-in / Interruption)
   */
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    apiService.stopVoice().catch(() => {});
    if (voiceState === 'SPEAKING') {
      setVoiceState('IDLE');
    }
  }, [voiceState]);

  /**
   * Safe Text-To-Speech:
   * Strips out raw OTP codes and passwords so they are NEVER spoken aloud
   */
  const speak = useCallback(
    (text: string) => {
      if (!voiceConfig.enabled || !text || !text.trim()) return;

      // Barge-in: cancel any previous speech
      stopSpeaking();

      // Privacy Filter: Check for OTP or sensitive data
      const filter = sanitizeSpeechText(text);
      const sanitizedText = filter.sanitizedText;

      setVoiceState('SPEAKING');

      // 1. Primary: Use browser SpeechSynthesis if available
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(sanitizedText);
          utterance.rate = voiceConfig.speechRate;
          utterance.volume = voiceConfig.speechVolume;

          const voices = window.speechSynthesis.getVoices();
          if (voiceConfig.voiceId && voiceConfig.voiceId !== 'default') {
            const found = voices.find(
              (v) => v.voiceURI === voiceConfig.voiceId || v.name === voiceConfig.voiceId
            );
            if (found) utterance.voice = found;
          }

          utterance.onend = () => {
            setVoiceState('IDLE');
          };

          utterance.onerror = (e: any) => {
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
              setVoiceState('IDLE');
            }
          };

          window.speechSynthesis.speak(utterance);
          return;
        } catch (e) {
          console.warn('Browser speechSynthesis failed, falling back to server TTS:', e);
        }
      }

      // 2. Secondary: Fallback to server endpoint
      apiService
        .speakText(sanitizedText, {
          rate: voiceConfig.speechRate,
          volume: voiceConfig.speechVolume,
          voice_id: voiceConfig.voiceId,
        })
        .then(() => setVoiceState('IDLE'))
        .catch((err) => {
          setErrorMessage(err.message);
          setVoiceState('ERROR');
        });
    },
    [voiceConfig, stopSpeaking]
  );

  /**
   * Start microphone listening (STT)
   */
  const startListening = useCallback(() => {
    if (!voiceConfig.enabled) {
      setErrorMessage('Voice engine is disabled in settings.');
      return;
    }

    // Barge-in: if currently speaking, interrupt it
    if (voiceState === 'SPEAKING' || (typeof window !== 'undefined' && window.speechSynthesis?.speaking)) {
      stopSpeaking();
    }

    setErrorMessage(null);
    setInterimTranscript('');

    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setPermissionState('UNAVAILABLE');
      setErrorMessage('Speech recognition is not supported in this browser. You can type normally.');
      setVoiceState('ERROR');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      // Language setting
      let lang = 'en-US';
      if (voiceConfig.preferredLanguage === 'hi-IN' || voiceConfig.preferredLanguage === 'hi') {
        lang = 'hi-IN';
      } else if (voiceConfig.preferredLanguage === 'en-IN') {
        lang = 'en-IN';
      } else if (voiceConfig.preferredLanguage !== 'auto') {
        lang = voiceConfig.preferredLanguage;
      }
      recognition.lang = lang;

      recognition.onstart = () => {
        setVoiceState('LISTENING');
        setPermissionState('GRANTED');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setInterimTranscript('');
          setVoiceState('PROCESSING');

          // Pass final recognized transcript to completion handler
          if (onTranscriptCompleteRef.current) {
            onTranscriptCompleteRef.current(final.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        if (errType === 'not-allowed' || errType === 'permission-denied') {
          setPermissionState('DENIED');
          setErrorMessage('Microphone permission required. Please allow microphone access.');
          setVoiceState('ERROR');
        } else if (errType === 'no-speech') {
          setVoiceState('IDLE');
        } else {
          setErrorMessage(`Speech recognition error: ${errType}`);
          setVoiceState('ERROR');
        }
      };

      recognition.onend = () => {
        if (voiceState === 'LISTENING') {
          setVoiceState('IDLE');
        }
      };

      recognition.start();
    } catch (err: any) {
      setVoiceState('ERROR');
      setErrorMessage(err.message || 'Failed to start microphone.');
    }
  }, [voiceConfig, voiceState, stopSpeaking]);

  /**
   * Stop microphone listening explicitly
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // safe ignore
      }
      recognitionRef.current = null;
    }
    if (voiceState === 'LISTENING') {
      setVoiceState('IDLE');
    }
    setInterimTranscript('');
  }, [voiceState]);

  const updateConfig = useCallback(async (partial: Partial<typeof voiceConfig>) => {
    const updated = { ...voiceConfig, ...partial };
    setVoiceConfig(updated);
    try {
      await apiService.updateVoiceConfig({
        enabled: updated.enabled,
        auto_speak: updated.autoSpeak,
        preferred_language: updated.preferredLanguage,
        voice_id: updated.voiceId,
        speech_rate: updated.speechRate,
        speech_volume: updated.speechVolume,
        interrupt_speech: updated.interruptSpeech,
      });
    } catch (e) {
      console.error('Failed to update voice config on server:', e);
    }
  }, [voiceConfig]);

  return {
    voiceState,
    isListening: voiceState === 'LISTENING',
    isSpeaking: voiceState === 'SPEAKING',
    isProcessing: voiceState === 'PROCESSING',
    permissionState,
    interimTranscript,
    errorMessage,
    availableVoices,
    voiceConfig,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    stopAll,
    updateConfig,
  };
}
