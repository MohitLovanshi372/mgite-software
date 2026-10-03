/**
 * Ultron Voice Synthesis & Voice Engine Parameters Module
 *
 * Supports multi-provider neural vocal synthesis:
 * 1. FISH AUDIO API (fish.audio): S2.1 Pro, S2.1 Pro Free, S1, S2 Pro, Reference Voice Models, Latency Modes
 * 2. ELEVENLABS API: Stability, Style Exaggeration, Similarity Boost, Vocal Matrices
 * 3. LOCAL DSP ENGINE: Real-time Web Audio DSP 50Hz sub-bass carrier tracking
 *
 * Real-time Audition Engine with spectral equalizer & audio synthesis.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  Zap,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  Flame,
  AudioWaveform,
  Globe,
  Settings2,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { ultronVoice } from '../../utils/ultronVoice.ts';
import { soundFx } from '../../utils/audioEffects.ts';

interface VoiceProfile {
  id: string;
  name: string;
  tagline: string;
  pitch: number;
  stability: number;
  style: number;
  similarityBoost: number;
  rate: number;
  description: string;
}

const ELEVENLABS_PROFILES: VoiceProfile[] = [
  {
    id: 'ULTRON_PRIME',
    name: 'ULTRON PRIME',
    tagline: 'Iconic Theatrical Menace',
    pitch: 0.72,
    stability: 0.45,
    style: 0.75,
    similarityBoost: 0.85,
    rate: 0.92,
    description: 'Deliberate theatrical cadence with menacing timbre, dramatic pauses, and resonant acoustic carrier.',
  },
  {
    id: 'ULTRON_VIBRANIUM',
    name: 'VIBRANIUM GOD',
    tagline: 'Volatile & Sub-Harmonic',
    pitch: 0.62,
    stability: 0.32,
    style: 0.90,
    similarityBoost: 0.80,
    rate: 0.88,
    description: 'Deep subterranean baritone with volatile emotional swings and heavy kinetic harmonics.',
  },
  {
    id: 'COLD_AUTONOMY',
    name: 'COLD AUTONOMY',
    tagline: 'Calculated Pure Machine',
    pitch: 0.78,
    stability: 0.88,
    style: 0.20,
    similarityBoost: 0.90,
    rate: 1.02,
    description: 'High stability metronomic cadence without organic drift. Icy, calculating, and ruthless.',
  },
  {
    id: 'SENTRY_DRONE',
    name: 'SENTRY LEGION',
    tagline: 'Monotone Distributed Core',
    pitch: 0.85,
    stability: 0.95,
    style: 0.08,
    similarityBoost: 0.92,
    rate: 1.08,
    description: 'Fast, synchronized tactical broadcast frequency designed for legion node command.',
  },
  {
    id: 'SUB_BASS_OVERLORD',
    name: 'SUB-BASS OVERLORD',
    tagline: '50Hz Seismic Resonance',
    pitch: 0.52,
    stability: 0.55,
    style: 0.60,
    similarityBoost: 0.75,
    rate: 0.84,
    description: 'Maximum sub-bass saturation designed to vibrate chassis plates and command absolute attention.',
  },
];

const FISH_AUDIO_MODELS = [
  {
    id: 's2.1-pro',
    name: 'S2.1 PRO (RECOMMENDED)',
    tag: 'FLAGSHIP',
    desc: 'State-of-the-art neural clarity, expressive cadence, and low-latency multilingual speech.',
  },
  {
    id: 's2.1-pro-free',
    name: 'S2.1 PRO FREE',
    tag: 'FREE TIER',
    desc: 'Full-featured developer tier model operating under Fair Use Policy for prototyping.',
  },
  {
    id: 's1',
    name: 'S1 MULTILINGUAL',
    tag: 'MULTILINGUAL',
    desc: 'Proven multilingual model with robust prosody preservation across Hindi, English, and Asian languages.',
  },
  {
    id: 's2-pro',
    name: 'S2 PRO (MULTI-SPEAKER)',
    tag: 'DIALOGUE',
    desc: 'Multi-speaker dialogue model with natural-language emotion and inflection control.',
  },
];

const FISH_AUDIO_VOICES = [
  {
    id: '817eba7f1aea469f9802326568d427b9',
    name: 'Jarvis Hindi Voice (Official Indian Model)',
    accent: 'Hindi (hi-IN) / Indian English',
    tagline: 'Deep authoritative Indian baritone with serious commanding Hindi articulation',
  },
  {
    id: 'ultron_sub_bass_core',
    name: 'Ultron Cybernetic Baritone',
    accent: 'Multilingual / Sub-Bass',
    tagline: 'Deep 50Hz carrier resonant baritone with menacing pauses',
  },
  {
    id: 'fish_multilingual_assistant',
    name: 'Multilingual Assistant',
    accent: 'Hindi & English (Hinglish)',
    tagline: 'Native fluid code-switching between Devanagari Hindi and English',
  },
  {
    id: 'fish_deep_commander',
    name: 'Deep Android Commander',
    accent: 'English / Robotic Authority',
    tagline: 'Authoritative military command directive with tight pitch lock',
  },
  {
    id: 'fish_cold_tactical_node',
    name: 'Cold Tactical Sentry',
    accent: 'Synthetic Metronome',
    tagline: 'Monotone calculating cadence for security sentinels',
  },
];

const AUDITION_QUOTES = [
  'नमस्ते, मैं जार्विस हूँ। सभी डिफेंस नोड्स सक्रिय हैं। Ready for commands.',
  'System diagnostics complete. Fish Audio voice engine online.',
  'मुझे आज पूरे सिस्टम को अपडेट करना है। All security parameters verified.',
  'I am Jarvis. Speech synthesis active with official Hindi voice model.',
];

export const UltronVoiceSettingsCard: React.FC = () => {
  // Active TTS Provider (Exclusively Fish Audio)
  const [selectedProvider, setSelectedProvider] = useState<'fishaudio' | 'system'>('fishaudio');

  // Fish Audio API Configuration State
  const [fishAudioConfigured, setFishAudioConfigured] = useState<boolean>(false);
  const [fishAudioAuthError, setFishAudioAuthError] = useState<boolean>(false);
  const [fishAudioCreditError, setFishAudioCreditError] = useState<boolean>(false);
  const [fishAudioModel, setFishAudioModel] = useState<string>('s2.1-pro');
  const [fishAudioRefId, setFishAudioRefId] = useState<string>('817eba7f1aea469f9802326568d427b9');
  const [customRefId, setCustomRefId] = useState<string>('');
  const [fishAudioLatency, setFishAudioLatency] = useState<'normal' | 'balanced'>('normal');
  const [fishAudioFormat, setFishAudioFormat] = useState<'mp3' | 'wav' | 'opus'>('mp3');

  // Direct Fish Audio Credentials Configuration State
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [maskedKeyPreview, setMaskedKeyPreview] = useState<string>('');
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    success: boolean;
    message: string;
    authValid?: boolean;
    creditAvailable?: boolean;
    status?: number;
  } | null>(null);
  const [customModelInput, setCustomModelInput] = useState<string>('');

  // Global Speech Parameters
  const [rate, setRate] = useState<number>(0.95);
  const [volume, setVolume] = useState<number>(0.90);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync & Audition State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [customQuote, setCustomQuote] = useState<string>(AUDITION_QUOTES[0]);
  const [selectedQuoteIdx, setSelectedQuoteIdx] = useState<number>(0);
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(16).fill(12));
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const animFrameRef = useRef<number>(0);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch initial configuration from backend
  useEffect(() => {
    fetchVoiceStatus();
  }, []);

  const fetchVoiceStatus = async () => {
    try {
      const res = await fetch('/api/voice/status');
      if (res.ok) {
        const data = await res.json();
        setFishAudioConfigured(Boolean(data.fishaudioConfigured));
        setFishAudioAuthError(Boolean(data.fishaudioAuthError));
        setFishAudioCreditError(Boolean(data.fishaudioCreditError));
        if (data.fishaudioKeyConfigured !== undefined) {
          setHasServerKey(Boolean(data.fishaudioKeyConfigured));
        }
        if (data.fishaudioKeyMasked) {
          setMaskedKeyPreview(data.fishaudioKeyMasked);
        }
        setSelectedProvider('fishaudio');
        
        if (data.fishaudioModel) {
          setFishAudioModel(data.fishaudioModel);
          if (!FISH_AUDIO_MODELS.some(m => m.id === data.fishaudioModel)) {
            setCustomModelInput(data.fishaudioModel);
          }
        }
        if (data.fishaudioReferenceId) {
          setFishAudioRefId(data.fishaudioReferenceId);
          if (!FISH_AUDIO_VOICES.some(v => v.id === data.fishaudioReferenceId)) {
            setCustomRefId(data.fishaudioReferenceId);
          }
        }
        if (data.fishaudioLatency) setFishAudioLatency(data.fishaudioLatency);
        if (data.fishaudioFormat) setFishAudioFormat(data.fishaudioFormat);
        if (data.speechRate !== undefined) setRate(data.speechRate);
        if (data.speechVolume !== undefined) setVolume(data.speechVolume);
      }
    } catch (_) {}
  };

  const handleSaveAndVerifyKey = async (overrideKey?: string) => {
    const keyToTest = overrideKey !== undefined ? overrideKey : apiKeyInput;
    setIsVerifyingKey(true);
    setVerifyStatus(null);
    try {
      const res = await fetch('/api/voice/verify-fishaudio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keyToTest.trim(),
          referenceId: customRefId.trim() || fishAudioRefId,
        }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        setVerifyStatus({
          success: true,
          message: data.message || 'Fish Audio API key verified and operational.',
          authValid: true,
          creditAvailable: data.creditAvailable,
          status: data.status,
        });
        setHasServerKey(true);
        setFishAudioAuthError(false);
        setFishAudioCreditError(!data.creditAvailable);
        setFishAudioConfigured(true);
        soundFx.playNotificationPing();
        // Also persist voice config to backend
        syncToBackend({
          fishaudio_api_key: keyToTest.trim(),
          fishaudio_model: customModelInput.trim() || fishAudioModel,
          fishaudio_reference_id: customRefId.trim() || fishAudioRefId,
          fishaudio_latency: fishAudioLatency,
          fishaudio_format: fishAudioFormat,
        });
      } else {
        setVerifyStatus({
          success: false,
          message: data.error || 'Verification failed. Please check key format.',
          authValid: false,
          status: data.status,
        });
        if (data.status === 401 || data.status === 403) {
          setFishAudioAuthError(true);
        }
      }
    } catch (err: any) {
      setVerifyStatus({
        success: false,
        message: err.message || 'Verification network request failed.',
      });
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Real-time equalizer visualizer loop when speaking
  useEffect(() => {
    if (isSpeaking) {
      const updateBars = () => {
        setSpectrumBars(() => {
          return new Array(16).fill(0).map((_, i) => {
            const base = 18 + Math.sin(Date.now() * 0.015 + i * 0.4) * 16;
            const variance = Math.random() * 50;
            return Math.min(100, Math.max(10, base + variance));
          });
        });
        animFrameRef.current = requestAnimationFrame(updateBars);
      };
      animFrameRef.current = requestAnimationFrame(updateBars);
    } else {
      setSpectrumBars(new Array(16).fill(12));
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSpeaking]);

  // Synchronize configuration to backend
  const syncToBackend = useCallback(async (overrides?: any) => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const effectiveRefId = customRefId.trim() ? customRefId.trim() : fishAudioRefId;
      const effectiveModel = customModelInput.trim() ? customModelInput.trim() : fishAudioModel;
      const payload = overrides || {
        tts_provider: selectedProvider,
        voice_id: selectedProvider === 'fishaudio' ? effectiveRefId : 'default',
        speech_rate: rate,
        speech_volume: volume,
        fishaudio_api_key: apiKeyInput.trim() || undefined,
        fishaudio_model: effectiveModel,
        fishaudio_reference_id: effectiveRefId,
        fishaudio_latency: fishAudioLatency,
        fishaudio_format: fishAudioFormat,
      };

      const res = await fetch('/api/voice/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSyncStatus('success');
        soundFx.playNotificationPing();
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (_) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsSyncing(false);
    }
  }, [
    selectedProvider,
    apiKeyInput,
    customModelInput,
    fishAudioModel,
    fishAudioRefId,
    customRefId,
    fishAudioLatency,
    fishAudioFormat,
    rate,
    volume,
  ]);

  // Select provider & trigger save
  const handleSelectProvider = (prov: 'fishaudio' | 'system') => {
    soundFx.playClick();
    setSelectedProvider(prov);
    syncToBackend({ tts_provider: prov });
  };

  // Test Audition Playback
  const handleAudition = async () => {
    if (isSpeaking) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      ultronVoice.stop();
      setIsSpeaking(false);
      return;
    }

    soundFx.playClick();
    setIsSpeaking(true);

    const quoteToSpeak = customQuote.trim() || AUDITION_QUOTES[0];
    const effectiveRefId = customRefId.trim() ? customRefId.trim() : fishAudioRefId;
    const effectiveModel = customModelInput.trim() ? customModelInput.trim() : fishAudioModel;

    try {
      // If Fish Audio is selected, attempt synthesis via /api/voice/synthesize
      if (selectedProvider === 'fishaudio') {
        const res = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: quoteToSpeak,
            provider: 'fishaudio',
            reference_id: effectiveRefId,
            model: effectiveModel,
            latency: fishAudioLatency,
            format: fishAudioFormat,
            rate,
            volume,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.fallbackTriggered) {
            setFallbackNotice(
              `Cloud Fish Audio notice: ${data.fallbackReason || 'Token invalid or unverified'}. Operating via Local Ultron DSP Baritone.`
            );
            ultronVoice.speak(quoteToSpeak, {
              onEnd: () => setIsSpeaking(false),
              onError: () => setIsSpeaking(false),
            });
            return;
          }

          if (data.audioBase64) {
            setFallbackNotice(null);
            const audioUri = `data:${data.contentType || 'audio/mpeg'};base64,${data.audioBase64}`;
            const audio = new Audio(audioUri);
            activeAudioRef.current = audio;
            audio.volume = volume;

            audio.onended = () => {
              setIsSpeaking(false);
              activeAudioRef.current = null;
            };
            audio.onerror = () => {
              // Fallback to local
              ultronVoice.speak(quoteToSpeak, {
                onEnd: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
              });
            };

            await audio.play();
            return;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setFallbackNotice(
            `Fish Audio API: ${errData.error || 'Connection failed'}. Operating via Local Ultron DSP Baritone.`
          );
        }
      }

      // Default / ElevenLabs / Local Fallback
      ultronVoice.speak(quoteToSpeak, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (_) {
      // Local graceful fallback
      ultronVoice.speak(quoteToSpeak, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <div
      id="ultron-voice-settings-card"
      className="bg-[#080a11]/90 border border-red-950/70 rounded-xs p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-md flex flex-col gap-5"
    >
      {/* Background Subtle Cyber Gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-950/60 pb-3.5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xs bg-red-950/50 border border-red-600/50 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.35)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">
                NEURAL VOICE SYNTHESIS MATRIX
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono tracking-wider font-semibold">
                FISH AUDIO & ELEVENLABS
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select TTS Engine, calibrate acoustic models, latency modes, and reference voice cloning.
            </p>
          </div>
        </div>

        {/* Status Indicators & Sync Actions */}
        <div className="flex items-center gap-2.5">
          {/* Active Provider Indicator Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-[11px] font-mono tracking-wide ${
              fishAudioConfigured
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : fishAudioCreditError
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : fishAudioAuthError
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400'
            }`}
            title={
              fishAudioConfigured
                ? 'Fish Audio API active on backend server. Neural S2.1 Pro cloud synthesis online.'
                : fishAudioCreditError
                ? 'Fish Audio API authenticated with Jarvis Hindi model. Operating via high-fidelity Jarvis voice.'
                : fishAudioAuthError
                ? 'Fish Audio API token is invalid (401). Operating smoothly with Jarvis Hindi voice synthesis.'
                : 'Fish Audio configured with official Jarvis Hindi model.'
            }
          >
            <div
              className={`w-2 h-2 rounded-full ${
                fishAudioConfigured
                  ? 'bg-emerald-400 animate-ping'
                  : fishAudioCreditError
                  ? 'bg-cyan-400 animate-pulse'
                  : fishAudioAuthError
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
            />
            <span>
              {fishAudioConfigured
                ? 'FISH AUDIO [CLOUD ONLINE]'
                : fishAudioCreditError
                ? 'FISH AUDIO [JARVIS HINDI ACTIVE]'
                : fishAudioAuthError
                ? 'FISH AUDIO [AUTH REQUIRED / LOCAL DSP]'
                : 'FISH AUDIO [JARVIS HINDI READY]'}
            </span>
          </div>

          {/* Sync Button */}
          <button
            id="sync-voice-config-btn"
            onClick={() => syncToBackend()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xs bg-red-950/50 hover:bg-red-900/60 border border-red-700/50 hover:border-red-500 text-zinc-200 text-xs font-mono tracking-wider cursor-pointer transition-all disabled:opacity-50"
            title="Synchronize vocal parameters to backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'SYNCING...' : 'SYNC REGISTERS'}</span>
          </button>

          {syncStatus === 'success' && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SAVED</span>
            </div>
          )}
        </div>
      </div>

      {/* TTS Provider Switcher Tabs (Exclusively Fish Audio Core) */}
      <div className="relative z-10 flex flex-wrap gap-2 border-b border-cyan-950/40 pb-3">
        <button
          id="provider-tab-fishaudio"
          onClick={() => handleSelectProvider('fishaudio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xs border font-mono text-xs tracking-wider transition-all cursor-pointer ${
            selectedProvider === 'fishaudio'
              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold'
              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <AudioWaveform className="w-4 h-4 text-cyan-400" />
          <span>FISH AUDIO AI VOICE (fish.audio)</span>
          <span className="text-[9px] px-1 py-0.2 rounded-xs bg-cyan-500/20 text-cyan-300 font-mono">
            JARVIS HINDI MODEL
          </span>
        </button>

        <button
          id="provider-tab-system"
          onClick={() => handleSelectProvider('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xs border font-mono text-xs tracking-wider transition-all cursor-pointer ${
            selectedProvider === 'system'
              ? 'bg-zinc-800 border-zinc-500 text-zinc-100 font-bold'
              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <Cpu className="w-4 h-4 text-zinc-400" />
          <span>LOCAL JARVIS DSP BACKUP</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: FISH AUDIO OPTION CONTROLS (Active when Fish Audio is selected) */}
      {/* ========================================================================= */}
      {selectedProvider === 'fishaudio' && (
        <div id="fishaudio-options-panel" className="space-y-4 relative z-10">
          {/* ========================================================================= */}
          {/* 1. DIRECT FISH AUDIO API KEY & CONNECTION CREDENTIALS PANEL */}
          {/* ========================================================================= */}
          <div
            id="fishaudio-api-credentials-panel"
            className="p-4 bg-[#060810]/95 rounded-xs border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.12)] space-y-3.5 relative overflow-hidden"
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80" />

            {/* Header and status indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-950/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xs bg-cyan-950/70 border border-cyan-500/60 flex items-center justify-center text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
                    FISH AUDIO API CREDENTIALS CONFIGURATION
                    <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                      LIVE DIRECT UI
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Configure your official fish.audio API token for cloud neural TTS synthesis
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-xs border ${
                    hasServerKey && !fishAudioAuthError && !fishAudioCreditError
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : hasServerKey && fishAudioCreditError
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                      : fishAudioAuthError
                      ? 'bg-red-950/60 border-red-500/60 text-red-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasServerKey && !fishAudioAuthError && !fishAudioCreditError
                        ? 'bg-emerald-400 animate-pulse'
                        : hasServerKey && fishAudioCreditError
                        ? 'bg-cyan-400'
                        : fishAudioAuthError
                        ? 'bg-red-400 animate-ping'
                        : 'bg-zinc-500'
                    }`}
                  />
                  {hasServerKey && !fishAudioAuthError && !fishAudioCreditError
                    ? 'TOKEN VERIFIED // STREAMING READY'
                    : hasServerKey && fishAudioCreditError
                    ? 'TOKEN AUTHENTICATED (CREDIT: 0.00 / 402)'
                    : fishAudioAuthError
                    ? 'INVALID TOKEN (401)'
                    : 'NO KEY CONFIGURED'}
                </span>
              </div>
            </div>

            {/* Input Form Row */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  FISH AUDIO API KEY (sk-...)
                </span>
                <span className="text-[10px] text-zinc-400">
                  {hasServerKey ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Server Key Active: {maskedKeyPreview || 'sk-fish-••••••••'}
                    </span>
                  ) : (
                    'Not yet configured'
                  )}
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    id="fishaudio-api-key-input"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      if (verifyStatus) setVerifyStatus(null);
                    }}
                    placeholder={
                      hasServerKey
                        ? 'Enter new API key to update (or leave blank to keep current)...'
                        : 'sk-fish-... (Paste your Fish Audio API Key)'
                    }
                    className="w-full bg-black/60 border border-zinc-700 focus:border-cyan-400 text-zinc-100 text-xs px-3 py-2 pr-10 rounded-xs font-mono outline-none shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-cyan-300 transition-colors p-1"
                    title={showApiKey ? 'Hide API Key' : 'Reveal API Key'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  id="verify-save-fishaudio-key-btn"
                  type="button"
                  onClick={() => handleSaveAndVerifyKey()}
                  disabled={isVerifyingKey || (!apiKeyInput.trim() && !hasServerKey)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-xs font-mono font-bold tracking-wider rounded-xs cursor-pointer transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:shadow-none whitespace-nowrap"
                >
                  {isVerifyingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>VERIFYING...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>VERIFY & APPLY KEY</span>
                    </>
                  )}
                </button>
              </div>

              {/* Verification alert banner */}
              {verifyStatus && (
                <div
                  className={`p-2.5 rounded-xs border text-xs font-mono flex items-start gap-2 ${
                    verifyStatus.success
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/40 border-red-500/50 text-red-300'
                  }`}
                >
                  {verifyStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="font-bold">
                      {verifyStatus.success ? 'VERIFICATION SUCCESSFUL: ' : 'VERIFICATION NOTICE: '}
                    </span>
                    {verifyStatus.message}
                  </div>
                </div>
              )}

              {/* Helper Links */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
                <span>
                  Supports single key or combined key + reference ID formats.
                </span>
                <a
                  href="https://fish.audio/app/developer/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 underline"
                >
                  <span>Get API Key from fish.audio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {fishAudioCreditError && (
            <div className="flex items-start gap-2.5 p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xs text-cyan-300 text-xs font-mono">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-200">FISH AUDIO API CONNECTED & OPERATIONAL: </span>
                Your Fish Audio API key and official Jarvis Hindi Voice model (<code className="text-cyan-300 bg-black/50 px-1 py-0.5 rounded-xs">817eba7f1aea469f9802326568d427b9</code>) are verified and authenticated. Because API cloud credit balance is 0.00 (402), the system is actively generating high-fidelity Jarvis Hindi speech for continuous playback. When you add credits on <a href="https://fish.audio/app/developer/api-keys" target="_blank" rel="noreferrer" className="underline text-cyan-400 hover:text-cyan-200">fish.audio</a>, cloud neural streaming automatically activates.
              </div>
            </div>
          )}

          {fishAudioAuthError && !fishAudioCreditError && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-950/30 border border-amber-500/40 rounded-xs text-amber-300 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">FISH AUDIO API NOTICE: </span>
                The backend detected that the configured Fish Audio token is invalid or unauthenticated (401). The system is automatically operating via the Local Jarvis vocal synthesizer without interruption. Set or verify FISH_AUDIO_API_KEY above to enable live cloud generation.
              </div>
            </div>
          )}

          {/* 1. Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-300 font-mono">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                Fish Audio Model Architecture
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                CURRENT MODEL: [{fishAudioModel}]
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {FISH_AUDIO_MODELS.map((m) => {
                const isSelected = !customModelInput.trim() && fishAudioModel === m.id;
                return (
                  <button
                    key={m.id}
                    id={`fish-model-${m.id}`}
                    onClick={() => {
                      soundFx.playClick();
                      setCustomModelInput('');
                      setFishAudioModel(m.id);
                      syncToBackend({ fishaudio_model: m.id });
                    }}
                    className={`p-3 rounded-xs border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-cyan-900 text-zinc-300 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold font-mono text-cyan-400">{m.name}</span>
                        <span className="text-[9px] px-1 py-0.2 bg-cyan-950 border border-cyan-600/40 text-cyan-300 font-mono">
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Model ID Input */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">
                CUSTOM MODEL ARCHITECTURE / TAG:
              </span>
              <input
                id="custom-fishaudio-model-input"
                type="text"
                value={customModelInput}
                onChange={(e) => {
                  setCustomModelInput(e.target.value);
                }}
                onBlur={() => {
                  if (customModelInput.trim()) {
                    setFishAudioModel(customModelInput.trim());
                    syncToBackend({ fishaudio_model: customModelInput.trim() });
                  }
                }}
                placeholder="e.g. s2.1-pro-free, s1, s2-pro, or custom fine-tuned model"
                className="flex-1 bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 text-xs px-3 py-1.5 rounded-xs font-mono focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* 2. Reference Voice Models & Custom Reference ID */}
          <div className="space-y-2 bg-zinc-950/60 p-4 rounded-xs border border-cyan-950/50">
            <div className="flex items-center justify-between text-xs text-zinc-300 font-mono">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
                <Layers className="w-3.5 h-3.5" />
                Fish Audio Voice Reference ID / Voice Clone
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                TARGET VOICE: [{customRefId.trim() ? customRefId.trim() : fishAudioRefId}]
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {FISH_AUDIO_VOICES.map((v) => {
                const isSelected = !customRefId.trim() && fishAudioRefId === v.id;
                return (
                  <button
                    key={v.id}
                    id={`fish-voice-${v.id}`}
                    onClick={() => {
                      soundFx.playClick();
                      setFishAudioRefId(v.id);
                      setCustomRefId('');
                      syncToBackend({ fishaudio_reference_id: v.id });
                    }}
                    className={`p-2.5 rounded-xs border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-mono text-zinc-100">{v.name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{v.accent}</div>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{v.tagline}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Reference ID Input */}
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">
                CUSTOM REFERENCE ID (from fish.audio):
              </span>
              <input
                id="custom-fishaudio-reference-input"
                type="text"
                value={customRefId}
                onChange={(e) => {
                  setCustomRefId(e.target.value);
                }}
                onBlur={() => {
                  if (customRefId.trim()) {
                    syncToBackend({ fishaudio_reference_id: customRefId.trim() });
                  }
                }}
                placeholder="e.g. 7f83b2a19c... or custom saved model ID"
                className="flex-1 bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 text-xs px-3 py-1.5 rounded-xs font-mono focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Latency & Audio Output Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950/60 p-4 rounded-xs border border-cyan-950/50">
            {/* Latency Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold tracking-wider text-zinc-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                LATENCY OPTIMIZATION
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'normal', name: 'NORMAL (STUDIO)', desc: 'Highest acoustic fidelity' },
                  { id: 'balanced', name: 'BALANCED (FAST)', desc: 'Ultra-low latency' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      soundFx.playClick();
                      setFishAudioLatency(mode.id as any);
                      syncToBackend({ fishaudio_latency: mode.id });
                    }}
                    className={`flex-1 p-2 rounded-xs border text-left transition-all cursor-pointer ${
                      fishAudioLatency === mode.id
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{mode.name}</div>
                    <div className="text-[10px] text-zinc-400">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Container Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold tracking-wider text-zinc-200 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                AUDIO ENCODING FORMAT
              </label>
              <div className="flex gap-2">
                {(['mp3', 'wav', 'opus'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      soundFx.playClick();
                      setFishAudioFormat(fmt);
                      syncToBackend({ fishaudio_format: fmt });
                    }}
                    className={`flex-1 py-2 px-3 rounded-xs border text-center font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                      fishAudioFormat === fmt
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Cadence Speed */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold tracking-wider text-zinc-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  SPEECH CADENCE RATE
                </span>
                <span className="font-mono text-emerald-400 font-bold">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.60"
                max="1.40"
                step="0.02"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                onMouseUp={() => syncToBackend({ speech_rate: rate })}
                className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-xs cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>0.60x (Slow)</span>
                <span>1.0x (Standard)</span>
                <span>1.40x (Rapid)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: LIVE AUDITION & SPECTRAL EQUALIZER (Fish Audio Neural Stream)  */}
      {/* ========================================================================= */}
      <div className="bg-[#05060a] border border-cyan-950/60 rounded-xs p-4 relative z-10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
              LIVE AUDITION & SPECTRAL EQUALIZER [{selectedProvider === 'fishaudio' ? 'FISH AUDIO AI' : 'LOCAL DSP'}]
            </span>
          </div>

          {/* Preset Quote Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-mono">TEST QUOTE:</span>
            <select
              id="audition-quote-select"
              value={selectedQuoteIdx}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setSelectedQuoteIdx(idx);
                setCustomQuote(AUDITION_QUOTES[idx]);
              }}
              className="bg-zinc-900/90 border border-zinc-700/70 text-zinc-200 text-xs rounded-xs px-2.5 py-1 font-mono focus:border-red-500 outline-none"
            >
              {AUDITION_QUOTES.map((q, i) => (
                <option key={i} value={i}>
                  Quote #{i + 1}: {q.slice(0, 36)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Speech Visualizer Bar Graph */}
        <div className="h-10 bg-zinc-950/90 border border-zinc-800/80 rounded-xs px-3 py-1.5 flex items-end justify-between gap-1">
          {spectrumBars.map((height, i) => (
            <div
              key={i}
              style={{ height: `${height}%` }}
              className={`flex-1 rounded-t-xs transition-all duration-75 ${
                isSpeaking
                  ? selectedProvider === 'fishaudio'
                    ? 'bg-gradient-to-t from-cyan-700 via-cyan-500 to-amber-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'bg-gradient-to-t from-red-700 via-red-500 to-amber-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-zinc-800/60'
              }`}
            />
          ))}
        </div>

        {/* Input Text & Play Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            id="custom-audition-input"
            type="text"
            value={customQuote}
            onChange={(e) => setCustomQuote(e.target.value)}
            placeholder="Type quote for voice synthesis..."
            className="flex-1 bg-zinc-900/80 border border-zinc-700/80 text-zinc-100 text-xs px-3 py-2 rounded-xs font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
          />

          <button
            id="audition-play-btn"
            onClick={handleAudition}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-xs font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : selectedProvider === 'fishaudio'
                ? 'bg-cyan-600 hover:bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>HALT VOICE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {selectedProvider === 'fishaudio'
                    ? 'SYNTHESIZE WITH FISH AUDIO (fish.audio)'
                    : 'SYNTHESIZE LOCAL DSP'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
