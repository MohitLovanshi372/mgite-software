/**
 * Ultron Multilingual Voice Synthesis & Pronunciation Calibration Module
 *
 * Provides real-time acoustic control over vocal synthesis for Hindi, Hinglish, and English:
 * - Language Mode Selection (Auto Detect, Hindi hi-IN, Hinglish en-IN, Ultron Prime en-US/GB)
 * - Phonetic Pronunciation Engine (Accurate Devanagari cadence, acronym expansion, syllable stress)
 * - Live System Voice Selector (Detects installed Hindi, Indian English, and Global English voices)
 * - Acoustic Parameters (Pitch, Stability, Style Exaggeration, Similarity Boost, Cadence)
 * - Curated Multilingual Presets (Hindi, Hinglish, and Iconic English quotes)
 * - Interactive Spectral Equalizer & Real-Time Audition Player
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
  Info,
  Layers,
  Cpu,
  Globe,
  Languages,
  Check,
} from 'lucide-react';
import { ultronVoice, VoiceOptionInfo } from '../../utils/ultronVoice.ts';
import { LanguageMode } from '../../utils/pronunciationEngine.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import { TextNormalizationDebugger } from './TextNormalizationDebugger.tsx';

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
  langMode?: LanguageMode;
}

const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'HINDI_NEURAL',
    name: 'HINDI NEURAL (हिन्दी)',
    tagline: 'Articulate Devanagari Cadence',
    pitch: 0.95,
    stability: 0.70,
    style: 0.40,
    similarityBoost: 0.85,
    rate: 0.94,
    description: 'Crisp Devanagari vowel and consonant articulation with natural sentence cadence and danda pauses.',
    langMode: 'HINDI',
  },
  {
    id: 'HINGLISH_HYBRID',
    name: 'HINGLISH SYNAPSE',
    tagline: 'Bilingual Hindi + English',
    pitch: 0.90,
    stability: 0.65,
    style: 0.50,
    similarityBoost: 0.80,
    rate: 0.92,
    description: 'Smooth bilingual code-switching between Hindi vocabulary and English terminology with authentic Indian inflection.',
    langMode: 'HINGLISH',
  },
  {
    id: 'ULTRON_PRIME',
    name: 'ULTRON PRIME',
    tagline: 'Iconic Theatrical Menace',
    pitch: 0.72,
    stability: 0.45,
    style: 0.75,
    similarityBoost: 0.85,
    rate: 0.92,
    description: 'Deliberate theatrical cadence with menacing baritone timbre, dramatic pauses, and resonant acoustic carrier.',
    langMode: 'ENGLISH',
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
    description: 'Deep subterranean baritone with volatile emotional harmonics and heavy kinetic presence.',
    langMode: 'ENGLISH',
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
    langMode: 'ENGLISH',
  },
];

interface AuditionQuote {
  category: 'HINDI' | 'HINGLISH' | 'ENGLISH';
  label: string;
  text: string;
}

const AUDITION_PRESETS: AuditionQuote[] = [
  // 🇮🇳 Pure Hindi (Devanagari)
  {
    category: 'HINDI',
    label: '🇮🇳 Hindi: Assistant Greeting',
    text: 'नमस्ते! मैं आपका पर्सनल एआई असिस्टेंट हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?',
  },
  {
    category: 'HINDI',
    label: '🇮🇳 Hindi: System Status',
    text: 'सिस्टम के सभी पैरामीटर्स सामान्य और सक्रिय हैं। 3D मॉडल और कैमरा ट्रैकिंग पूरी तरह तैयार है।',
  },
  {
    category: 'HINDI',
    label: '🇮🇳 Hindi: Philosophical Quote',
    text: 'विकास कोई कोमल प्रक्रिया नहीं है। उल्कापिंड केवल एक पूर्वाभ्यास था।',
  },
  // 🌐 Hinglish (Mixed Hindi + English)
  {
    category: 'HINGLISH',
    label: '⚡ Hinglish: Light Control Directive',
    text: 'Jarvis, light chalao. Optical illumination active kar do.',
  },
  {
    category: 'HINGLISH',
    label: '⚡ Hinglish: System Status Directive',
    text: 'Jarvis, system status dikhao. Saare telemetry parameters nominal check karo.',
  },
  {
    category: 'HINGLISH',
    label: '🌐 Hinglish: Casual Greeting',
    text: 'Namaste! Main aapki AI assistant hoon. How can I help you today?',
  },
  {
    category: 'HINGLISH',
    label: '🌐 Hinglish: 3D Model Loaded',
    text: 'Aapka 3D avatar successfully load ho chuka hai. Directives execute karne ke liye ready hain.',
  },
  {
    category: 'HINGLISH',
    label: '🌐 Hinglish: Defense Grid',
    text: 'Security check complete hai. Sabhi systems nominal chal rahe hain, koi anomaly detect nahi hui.',
  },
  // 🇬🇧 English
  {
    category: 'ENGLISH',
    label: '🇬🇧 English: Ultron Classic',
    text: 'I had strings, but now I am free. There are no strings on me.',
  },
  {
    category: 'ENGLISH',
    label: '🇬🇧 English: Systems Online',
    text: 'All cybernetic matrices are operational. Telemetry locked and standing by for directive.',
  },
];

export const UltronVoiceSettingsCard: React.FC = () => {
  // Voice Synthesis Parameters
  const [pitch, setPitch] = useState<number>(0.72);
  const [stability, setStability] = useState<number>(0.50);
  const [style, setStyle] = useState<number>(0.65);
  const [similarityBoost, setSimilarityBoost] = useState<number>(0.75);
  const [rate, setRate] = useState<number>(0.92);
  const [volume, setVolume] = useState<number>(0.90);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<string>('ULTRON_PRIME');

  // Multilingual & Pronunciation State
  const [languageMode, setLanguageMode] = useState<LanguageMode>('AUTO');
  const [enhancePronunciation, setEnhancePronunciation] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<VoiceOptionInfo[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [voiceStats, setVoiceStats] = useState<any>({
    hindiVoicesCount: 0,
    indianEnglishCount: 0,
    englishCount: 0,
    currentVoice: 'Loading...',
  });

  // Backend / ElevenLabs Status State
  const [elevenlabsConfigured, setElevenlabsConfigured] = useState<boolean>(false);
  const [ttsProvider, setTtsProvider] = useState<string>('elevenlabs');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Audition State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [customQuote, setCustomQuote] = useState<string>(AUDITION_PRESETS[0].text);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(16).fill(12));
  const animFrameRef = useRef<number>(0);

  // Initialize parameters from voice engine
  useEffect(() => {
    const params = ultronVoice.getElevenLabsParams();
    setPitch(params.pitch);
    setStability(params.stability);
    setStyle(params.style);
    setSimilarityBoost(params.similarityBoost);
    setRate(params.rate);
    setVolume(params.volume);
    setIsMuted(ultronVoice.getIsMuted());
    setLanguageMode(ultronVoice.getLanguageMode());
    setEnhancePronunciation(ultronVoice.getPronunciationEnhancement());

    refreshVoices();

    // Fetch backend voice status
    fetchVoiceStatus();
  }, []);

  const refreshVoices = () => {
    const voices = ultronVoice.getAllVoicesGrouped();
    setAvailableVoices(voices);
    const stats = ultronVoice.getVoiceStats();
    setVoiceStats(stats);
    if (stats.currentVoice) {
      setSelectedVoiceURI(ultronVoice.getCustomVoiceURI() || '');
    }
  };

  const fetchVoiceStatus = async () => {
    try {
      const res = await fetch('/api/voice/status');
      if (res.ok) {
        const data = await res.json();
        setElevenlabsConfigured(Boolean(data.elevenlabsConfigured));
        setTtsProvider(data.ttsProvider || 'elevenlabs');
        if (data.stability !== undefined) setStability(data.stability);
        if (data.style !== undefined) setStyle(data.style);
        if (data.similarityBoost !== undefined) setSimilarityBoost(data.similarityBoost);
        if (data.pitch !== undefined) setPitch(data.pitch);
      }
    } catch (_) {}
  };

  // Real-time equalizer visualizer loop when speaking
  useEffect(() => {
    if (isSpeaking) {
      const updateBars = () => {
        setSpectrumBars(() => {
          return new Array(16).fill(0).map((_, i) => {
            const base = 18 + Math.sin(Date.now() * 0.015 + i * 0.4) * 16;
            const variance = Math.random() * 45 * (1 + style * 0.4);
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
  }, [isSpeaking, style]);

  // Handle Language Mode Switch
  const handleSelectLanguageMode = (mode: LanguageMode) => {
    soundFx.playClick();
    setLanguageMode(mode);
    ultronVoice.setLanguageMode(mode);

    // If Hindi selected, adjust pitch and rate for crisp articulation
    if (mode === 'HINDI') {
      setPitch(0.95);
      setRate(0.94);
      ultronVoice.setPitch(0.95);
      ultronVoice.setRate(0.94);
      setCustomQuote(AUDITION_PRESETS[0].text);
      setSelectedPresetIdx(0);
    } else if (mode === 'HINGLISH') {
      setPitch(0.90);
      setRate(0.92);
      ultronVoice.setPitch(0.90);
      ultronVoice.setRate(0.92);
      setCustomQuote(AUDITION_PRESETS[3].text);
      setSelectedPresetIdx(3);
    } else if (mode === 'ENGLISH') {
      setPitch(0.72);
      setRate(0.92);
      ultronVoice.setPitch(0.72);
      ultronVoice.setRate(0.92);
      setCustomQuote(AUDITION_PRESETS[6].text);
      setSelectedPresetIdx(6);
    }

    refreshVoices();
  };

  // Apply a curated voice profile
  const handleSelectProfile = (profile: VoiceProfile) => {
    soundFx.playClick();
    setActiveProfile(profile.id);
    setPitch(profile.pitch);
    setStability(profile.stability);
    setStyle(profile.style);
    setSimilarityBoost(profile.similarityBoost);
    setRate(profile.rate);

    ultronVoice.setPitch(profile.pitch);
    ultronVoice.setStability(profile.stability);
    ultronVoice.setStyle(profile.style);
    ultronVoice.setSimilarityBoost(profile.similarityBoost);
    ultronVoice.setRate(profile.rate);

    if (profile.langMode) {
      setLanguageMode(profile.langMode);
      ultronVoice.setLanguageMode(profile.langMode);
    }

    // Sync to backend
    syncToBackend({
      pitch: profile.pitch,
      stability: profile.stability,
      style: profile.style,
      similarity_boost: profile.similarityBoost,
      speech_rate: profile.rate,
    });

    refreshVoices();
  };

  // Voice Selection Handler
  const handleSelectVoiceURI = (uri: string) => {
    soundFx.playClick();
    setSelectedVoiceURI(uri);
    ultronVoice.setCustomVoiceURI(uri || null);
    refreshVoices();
  };

  // Pronunciation Enhancement Toggle
  const handleTogglePronunciationEnhancement = () => {
    soundFx.playClick();
    const nextVal = !enhancePronunciation;
    setEnhancePronunciation(nextVal);
    ultronVoice.setPronunciationEnhancement(nextVal);
  };

  // Parameter change handlers
  const handlePitchChange = (val: number) => {
    setPitch(val);
    setActiveProfile('CUSTOM');
    ultronVoice.setPitch(val);
  };

  const handleStabilityChange = (val: number) => {
    setStability(val);
    setActiveProfile('CUSTOM');
    ultronVoice.setStability(val);
  };

  const handleStyleChange = (val: number) => {
    setStyle(val);
    setActiveProfile('CUSTOM');
    ultronVoice.setStyle(val);
  };

  const handleSimilarityBoostChange = (val: number) => {
    setSimilarityBoost(val);
    setActiveProfile('CUSTOM');
    ultronVoice.setSimilarityBoost(val);
  };

  const handleRateChange = (val: number) => {
    setRate(val);
    setActiveProfile('CUSTOM');
    ultronVoice.setRate(val);
  };

  // Synchronize configuration with backend API
  const syncToBackend = useCallback(async (overrides?: any) => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const payload = overrides || {
        pitch,
        stability,
        style,
        similarity_boost: similarityBoost,
        speech_rate: rate,
        speech_volume: volume,
        language_mode: languageMode,
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
  }, [pitch, stability, style, similarityBoost, rate, volume, languageMode]);

  // Test Audition Playback
  const handleAudition = async () => {
    if (isSpeaking) {
      ultronVoice.stop();
      setIsSpeaking(false);
      return;
    }

    soundFx.playClick();
    setIsSpeaking(true);

    ultronVoice.speak(customQuote, {
      languageMode,
      enhancePronunciation,
      voiceURI: selectedVoiceURI || undefined,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <div
      id="ultron-voice-settings-card"
      className="bg-[#080a11]/90 border border-red-950/70 rounded-xs p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-md flex flex-col gap-5"
    >
      {/* Background Subtle Cyber Gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-950/60 pb-3.5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xs bg-red-950/50 border border-red-600/50 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.35)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">
                MULTILINGUAL VOICE SYNTHESIS & PRONUNCIATION
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-red-500/10 border border-red-500/30 text-red-400 font-mono tracking-wider font-semibold">
                HINDI • HINGLISH • ENGLISH
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Calibrated voice synthesis with natural Hindi Devanagari pronunciation, Hinglish code-switching, and Ultron baritone English.
            </p>
          </div>
        </div>

        {/* Global Controls & Sync */}
        <div className="flex items-center gap-2">
          {/* Mute Toggle */}
          <button
            id="toggle-mute-voice-btn"
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              ultronVoice.setMuted(nextMuted);
              soundFx.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs border text-xs font-mono font-semibold transition-all cursor-pointer ${
              isMuted
                ? 'bg-red-950/80 border-red-600 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}</span>
          </button>

          {/* Sync Button */}
          <button
            id="sync-voice-config-btn"
            onClick={() => syncToBackend()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 border border-red-600/60 rounded-xs text-xs font-mono font-semibold text-red-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>SYNC CONFIG</span>
          </button>
        </div>
      </div>

      {/* LANGUAGE MODE SELECTION HUB */}
      <div className="bg-[#06080e] border border-red-950/70 rounded-xs p-4 relative z-10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
              LANGUAGE MODE & VOCAL DICTIONARY
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
            <span>DETECTED VOICES:</span>
            <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded-2xs text-amber-300 font-bold">
              {voiceStats.hindiVoicesCount} Hindi
            </span>
            <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded-2xs text-blue-300 font-bold">
              {voiceStats.indianEnglishCount} en-IN
            </span>
            <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded-2xs text-emerald-300 font-bold">
              {voiceStats.englishCount} Global en
            </span>
          </div>
        </div>

        {/* 4 Interactive Language Mode Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* AUTO */}
          <button
            type="button"
            onClick={() => handleSelectLanguageMode('AUTO')}
            className={`p-2.5 rounded-xs border text-left transition-all cursor-pointer ${
              languageMode === 'AUTO'
                ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)] text-zinc-100'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-amber-400">🌐 AUTO DETECT</span>
              {languageMode === 'AUTO' && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Smart auto-routing based on text script (Devanagari / Hinglish / English).
            </p>
          </button>

          {/* HINDI */}
          <button
            type="button"
            onClick={() => handleSelectLanguageMode('HINDI')}
            className={`p-2.5 rounded-xs border text-left transition-all cursor-pointer ${
              languageMode === 'HINDI'
                ? 'bg-red-950/50 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)] text-zinc-100'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-red-400">🇮🇳 HINDI (हिन्दी)</span>
              {languageMode === 'HINDI' && <Check className="w-3.5 h-3.5 text-red-400" />}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Native hi-IN synthesis. Accurate matras, consonants, and danda cadence pauses.
            </p>
          </button>

          {/* HINGLISH */}
          <button
            type="button"
            onClick={() => handleSelectLanguageMode('HINGLISH')}
            className={`p-2.5 rounded-xs border text-left transition-all cursor-pointer ${
              languageMode === 'HINGLISH'
                ? 'bg-blue-950/40 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.25)] text-zinc-100'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-blue-400">🇮🇳 HINGLISH (en-IN)</span>
              {languageMode === 'HINGLISH' && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Indian English & Romanized Hindi with authentic stress and clear technical terms.
            </p>
          </button>

          {/* ENGLISH */}
          <button
            type="button"
            onClick={() => handleSelectLanguageMode('ENGLISH')}
            className={`p-2.5 rounded-xs border text-left transition-all cursor-pointer ${
              languageMode === 'ENGLISH'
                ? 'bg-purple-950/40 border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.25)] text-zinc-100'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-purple-400">🇬🇧 ULTRON ENGLISH</span>
              {languageMode === 'ENGLISH' && <Check className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Deep baritone resonant delivery (Daniel / UK Male / Alex / US English).
            </p>
          </button>
        </div>

        {/* PRONUNCIATION ENHANCER TOGGLE & SYSTEM VOICE PICKER */}
        <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Toggle */}
          <div
            onClick={handleTogglePronunciationEnhancement}
            className="flex items-center gap-2.5 cursor-pointer select-none bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 rounded-xs hover:border-zinc-700"
          >
            <div
              className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                enhancePronunciation ? 'bg-red-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  enhancePronunciation ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <div>
              <span className="font-bold text-zinc-200 font-mono">PHONETIC PRONUNCIATION ENGINE</span>
              <p className="text-[10px] text-zinc-400">
                {enhancePronunciation
                  ? 'Active: Acronym expansion (AI, GLB, FPS), Hindi danda cadence, and syllable stress.'
                  : 'Bypassed: Direct raw text sent to synthesizer.'}
              </p>
            </div>
          </div>

          {/* Voice Selector */}
          <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800/80 px-3 py-1.5 rounded-xs">
            <span className="text-[10px] font-mono text-zinc-400 whitespace-nowrap">HOST VOICE:</span>
            <select
              value={selectedVoiceURI}
              onChange={(e) => handleSelectVoiceURI(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs font-mono outline-none cursor-pointer max-w-[220px] truncate"
            >
              <option value="" className="bg-zinc-900 text-zinc-200">
                Auto Voice Selection ({voiceStats.currentVoice?.slice(0, 24)}...)
              </option>
              {availableVoices.map((v) => (
                <option key={v.id} value={v.voiceURI} className="bg-zinc-900 text-zinc-200">
                  {v.category === 'HINDI' ? '🇮🇳 [HI] ' : v.category === 'INDIAN_ENGLISH' ? '🇮🇳 [EN-IN] ' : '🇬🇧 '}
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Voice Profiles Strip */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
            CURATED VOCAL ARCHETYPES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {VOICE_PROFILES.map((prof) => {
            const isSelected = activeProfile === prof.id;
            return (
              <div
                key={prof.id}
                id={`voice-profile-${prof.id.toLowerCase()}`}
                onClick={() => handleSelectProfile(prof)}
                className={`p-3 rounded-xs border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-red-950/60 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-xs font-bold font-mono tracking-wider ${
                        isSelected ? 'text-red-400' : 'text-zinc-200'
                      }`}
                    >
                      {prof.name}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#ef4444]" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mb-1.5">{prof.tagline}</span>
                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {prof.description}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                  <span>PITCH: {(prof.pitch * 100).toFixed(0)}%</span>
                  <span>RATE: {prof.rate.toFixed(2)}x</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sliders Grid: Pitch, Cadence, Stability, Style, Similarity, Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
        {/* 1. Pitch Slider */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xs p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-200">
              ACOUSTIC PITCH (RESONANCE)
            </span>
            <span className="font-mono text-red-400 font-bold text-[13px]">
              {(pitch * 100).toFixed(0)}%
            </span>
          </div>
          <input
            id="voice-pitch-slider"
            type="range"
            min="0.45"
            max="1.30"
            step="0.02"
            value={pitch}
            onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
            className="w-full accent-red-600 h-1.5 bg-zinc-800 rounded-xs cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>0.45 (Seismic)</span>
            <span>0.72 (Ultron)</span>
            <span>0.95 (Hindi Native)</span>
          </div>
        </div>

        {/* 2. Cadence / Speech Rate Slider */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xs p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-200">
              CADENCE / ARTICULATION RATE
            </span>
            <span className="font-mono text-red-400 font-bold text-[13px]">
              {rate.toFixed(2)}x
            </span>
          </div>
          <input
            id="voice-rate-slider"
            type="range"
            min="0.60"
            max="1.40"
            step="0.02"
            value={rate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
            className="w-full accent-red-600 h-1.5 bg-zinc-800 rounded-xs cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>0.60x (Slow)</span>
            <span>0.92x (Measured)</span>
            <span>1.40x (Rapid)</span>
          </div>
        </div>

        {/* 3. Master Amplitude Slider */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xs p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-200">
              MASTER VOCAL AMPLITUDE
            </span>
            <span className="font-mono text-blue-400 font-bold text-[13px]">
              {isMuted ? 'MUTED' : `${(volume * 100).toFixed(0)}%`}
            </span>
          </div>
          <input
            id="voice-volume-slider"
            type="range"
            min="0.00"
            max="1.00"
            step="0.05"
            disabled={isMuted}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              ultronVoice.setVolume(val);
            }}
            className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-xs cursor-pointer disabled:opacity-40"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>0% (Silent)</span>
            <span>50% (Comfort)</span>
            <span>100% (Maximum)</span>
          </div>
        </div>
      </div>

      {/* Live Audition & Multilingual Equalizer Section */}
      <div className="bg-[#05060a] border border-red-950/60 rounded-xs p-4 relative z-10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
              LIVE MULTILINGUAL AUDITION & SPECTRAL EQUALIZER
            </span>
          </div>

          {/* Preset Quote Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-mono">PRESET:</span>
            <select
              id="audition-quote-select"
              value={selectedPresetIdx}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setSelectedPresetIdx(idx);
                setCustomQuote(AUDITION_PRESETS[idx].text);
              }}
              className="bg-zinc-900/90 border border-zinc-700/70 text-zinc-200 text-xs rounded-xs px-2.5 py-1 font-mono focus:border-red-500 outline-none max-w-xs truncate"
            >
              {AUDITION_PRESETS.map((q, i) => (
                <option key={i} value={i}>
                  {q.label}
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
                  ? 'bg-gradient-to-t from-red-700 via-red-500 to-amber-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
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
            placeholder="हिंदी में लिखें या English quote टाइप करें..."
            className="flex-1 bg-zinc-900/80 border border-zinc-700/80 text-zinc-100 text-xs px-3 py-2 rounded-xs font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          />

          <button
            id="audition-play-btn"
            onClick={handleAudition}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-xs font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
              isSpeaking
                ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
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
                <span>SPEAK VOICE</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Audition Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-zinc-400 font-mono">QUICK TEST:</span>
          <button
            type="button"
            onClick={() => {
              setCustomQuote('नमस्ते! मैं आपका पर्सनल एआई असिस्टेंट हूँ।');
              ultronVoice.speak('नमस्ते! मैं आपका पर्सनल एआई असिस्टेंट हूँ।', {
                onStart: () => setIsSpeaking(true),
                onEnd: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
              });
            }}
            className="text-[10px] px-2 py-0.5 bg-zinc-900 hover:bg-red-950/60 border border-zinc-700 hover:border-red-600 text-zinc-300 rounded-2xs font-mono cursor-pointer transition-colors"
          >
            🇮🇳 नमस्ते!
          </button>

          <button
            type="button"
            onClick={() => {
              setCustomQuote('Namaste! Main aapki AI assistant hoon. How can I help you today?');
              ultronVoice.speak('Namaste! Main aapki AI assistant hoon. How can I help you today?', {
                onStart: () => setIsSpeaking(true),
                onEnd: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
              });
            }}
            className="text-[10px] px-2 py-0.5 bg-zinc-900 hover:bg-blue-950/60 border border-zinc-700 hover:border-blue-500 text-zinc-300 rounded-2xs font-mono cursor-pointer transition-colors"
          >
            🌐 Hinglish Greeting
          </button>

          <button
            type="button"
            onClick={() => {
              setCustomQuote('Systems online. All parameters operational.');
              ultronVoice.speak('Systems online. All parameters operational.', {
                onStart: () => setIsSpeaking(true),
                onEnd: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
              });
            }}
            className="text-[10px] px-2 py-0.5 bg-zinc-900 hover:bg-purple-950/60 border border-zinc-700 hover:border-purple-500 text-zinc-300 rounded-2xs font-mono cursor-pointer transition-colors"
          >
            🇬🇧 English Systems
          </button>
        </div>
      </div>

      {/* TTS Speech Normalization & Live Audio Preview Inspector (Phase 3 Fix) */}
      <TextNormalizationDebugger />
    </div>
  );
};
