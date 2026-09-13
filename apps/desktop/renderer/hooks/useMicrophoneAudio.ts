/**
 * Real-time Microphone Audio Analysis Hook
 * Connects to the browser MediaStream via Web Audio API when listening.
 * Extracts:
 * - Real-time volume / RMS level (0.0 - 1.0)
 * - Peak level with decay
 * - Frequency spectrum data (Uint8Array)
 * - Time-domain waveform data (Uint8Array)
 * - Voice activity detection (VAD)
 * Gracefully handles permissions, iframe restrictions, and hardware cleanup.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseMicrophoneAudioOptions {
  enabled?: boolean;
  fftSize?: number; // Must be power of 2: 32, 64, 128, 256
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  gainMultiplier?: number;
}

export interface MicrophoneAudioState {
  micLevel: number; // 0.0 to 1.0 smoothed RMS
  rawLevel: number; // 0.0 to 1.0 immediate RMS
  peakLevel: number; // 0.0 to 1.0 with decay
  frequencyData: number[]; // normalized 0.0 to 1.0 for each bin
  timeDomainData: number[]; // normalized -1.0 to 1.0 for waveform
  isVoiceActive: boolean; // whether micLevel exceeds noise gate
  dB: number; // decibels (-60 to 0)
  status: 'inactive' | 'requesting' | 'active' | 'denied' | 'unsupported';
  errorMessage: string | null;
}

export function useMicrophoneAudio(options: UseMicrophoneAudioOptions = {}) {
  const {
    enabled = false,
    fftSize = 64,
    smoothingTimeConstant = 0.8,
    minDecibels = -80,
    maxDecibels = -10,
    gainMultiplier = 1.6,
  } = options;

  const [state, setState] = useState<MicrophoneAudioState>({
    micLevel: 0,
    rawLevel: 0,
    peakLevel: 0,
    frequencyData: new Array(fftSize / 2).fill(0),
    timeDomainData: new Array(fftSize).fill(0),
    isVoiceActive: false,
    dB: -60,
    status: 'inactive',
    errorMessage: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const peakDecayRef = useRef<number>(0);
  const smoothedLevelRef = useRef<number>(0);

  // Stop media stream tracks and disconnect audio graph
  const cleanupStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // safe ignore
      }
      sourceRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // safe ignore
        }
      });
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch {
        // safe ignore
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    peakDecayRef.current = 0;
    smoothedLevelRef.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanupStream();
      setState((prev) => ({
        ...prev,
        micLevel: 0,
        rawLevel: 0,
        peakLevel: 0,
        isVoiceActive: false,
        dB: -60,
        status: 'inactive',
        frequencyData: new Array(fftSize / 2).fill(0),
        timeDomainData: new Array(fftSize).fill(0),
      }));
      return;
    }

    let isMounted = true;

    async function initMicrophone() {
      if (typeof window === 'undefined') return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setState((prev) => ({
          ...prev,
          status: 'unsupported',
          errorMessage: 'Audio capture is not supported in this browser.',
        }));
        return;
      }

      setState((prev) => ({ ...prev, status: 'requesting', errorMessage: null }));

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          setState((prev) => ({
            ...prev,
            status: 'unsupported',
            errorMessage: 'Web Audio API not supported.',
          }));
          return;
        }

        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        sourceRef.current = source;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        analyser.minDecibels = minDecibels;
        analyser.maxDecibels = maxDecibels;
        analyserRef.current = analyser;

        source.connect(analyser);

        const freqDataLength = analyser.frequencyBinCount;
        const freqArray = new Uint8Array(freqDataLength);
        const timeArray = new Uint8Array(analyser.fftSize);

        setState((prev) => ({ ...prev, status: 'active', errorMessage: null }));

        // Real-time animation loop
        const tick = () => {
          if (!analyserRef.current || !isMounted) return;

          analyserRef.current.getByteFrequencyData(freqArray);
          analyserRef.current.getByteTimeDomainData(timeArray);

          // Calculate RMS level from time-domain data
          let sumSquares = 0;
          for (let i = 0; i < timeArray.length; i++) {
            // Convert 0..255 to -1.0 .. +1.0
            const normalized = (timeArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / timeArray.length);
          const amplifiedRms = Math.min(1.0, rms * gainMultiplier);

          // Smooth level with attack/decay
          const smoothingFactor = amplifiedRms > smoothedLevelRef.current ? 0.35 : 0.15;
          smoothedLevelRef.current += (amplifiedRms - smoothedLevelRef.current) * smoothingFactor;

          // Peak level with decay
          if (amplifiedRms > peakDecayRef.current) {
            peakDecayRef.current = amplifiedRms;
          } else {
            peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.02);
          }

          // Compute dB roughly
          const dB = amplifiedRms > 0.001 ? Math.max(-60, Math.round(20 * Math.log10(amplifiedRms))) : -60;

          // Normalized frequency array (0..1)
          const normFreq = Array.from(freqArray).map((val) => val / 255);

          // Normalized time-domain array (-1..1)
          const normTime = Array.from(timeArray).map((val) => (val - 128) / 128);

          const isVoiceActive = smoothedLevelRef.current > 0.05;

          setState({
            micLevel: smoothedLevelRef.current,
            rawLevel: amplifiedRms,
            peakLevel: peakDecayRef.current,
            frequencyData: normFreq,
            timeDomainData: normTime,
            isVoiceActive,
            dB,
            status: 'active',
            errorMessage: null,
          });

          animFrameRef.current = requestAnimationFrame(tick);
        };

        animFrameRef.current = requestAnimationFrame(tick);
      } catch (err: any) {
        console.warn('Microphone access not available or denied:', err);
        if (isMounted) {
          const isDenied =
            err.name === 'NotAllowedError' ||
            err.name === 'PermissionDeniedError' ||
            err.message?.includes('Permission');
          setState((prev) => ({
            ...prev,
            status: isDenied ? 'denied' : 'unsupported',
            errorMessage: isDenied
              ? 'Microphone permission denied.'
              : 'Could not access audio stream.',
          }));
        }
      }
    }

    initMicrophone();

    return () => {
      isMounted = false;
      cleanupStream();
    };
  }, [enabled, fftSize, smoothingTimeConstant, minDecibels, maxDecibels, gainMultiplier, cleanupStream]);

  return state;
}
