/**
 * Settings Page
 * System configuration, operator profile, optical lighting parameters,
 * HUD centerpiece selector (Face vs Reactor Core), and Push-to-Talk chord control.
 */

import React, { useState, useEffect } from 'react';
import { Settings, User, Eye, Check, Cpu, Mic, Radio, Volume2, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { pushToTalkService } from '../utils/pushToTalkService.ts';

interface VoiceStatusInfo {
  ttsProvider: string;
  fishAudioConfigured: boolean;
  fishModel: string;
  fishVoiceId?: string;
  elevenlabsConfigured: boolean;
  elevenlabsModel?: string;
}

export const SettingsPage: React.FC = () => {
  const [operator, setOperator] = useState('Mohit Lovanshi');
  const [colorProfile, setColorProfile] = useState('CRIMSON_RED');
  const [hudCenterpiece, setHudCenterpiece] = useState<'face' | 'reactor'>('face');
  const [pushToTalk, setPushToTalk] = useState<boolean>(false);
  const [ttsProvider, setTtsProvider] = useState<'fish_audio' | 'elevenlabs' | 'system'>('fish_audio');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatusInfo | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    // Load persisted HUD centerpiece mode
    const savedHud = localStorage.getItem('jarvis_hud_centerpiece_mode');
    if (savedHud === 'reactor' || savedHud === 'face') {
      setHudCenterpiece(savedHud);
    }
    // Load persisted Push-to-talk
    setPushToTalk(pushToTalkService.isPushToTalkEnabled());

    // Fetch Voice Status from backend
    fetch('/api/voice/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setVoiceStatus({
            ttsProvider: data.ttsProvider || 'fish_audio',
            fishAudioConfigured: Boolean(data.fishAudioConfigured),
            fishModel: data.fishModel || 's2.1-pro-free',
            fishVoiceId: data.fishVoiceId || '',
            elevenlabsConfigured: Boolean(data.elevenlabsConfigured),
            elevenlabsModel: data.elevenlabsModel || 'eleven_multilingual_v2',
          });
          if (data.ttsProvider) {
            setTtsProvider(data.ttsProvider as any);
          }
        }
      })
      .catch(() => {
        // Safe offline default
        setVoiceStatus({
          ttsProvider: 'fish_audio',
          fishAudioConfigured: false,
          fishModel: 's2.1-pro-free',
          elevenlabsConfigured: false,
        });
      });
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem('jarvis_hud_centerpiece_mode', hudCenterpiece);
    pushToTalkService.setPushToTalkEnabled(pushToTalk);

    // Update backend voice configuration
    fetch('/api/voice/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tts_provider: ttsProvider }),
    }).catch(() => {});

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2400);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              SYSTEM SETTINGS & PARAMETERS
            </h2>
            <p className="text-xs text-zinc-400">
              HUD Centerpiece • Push-to-Talk • Optical Laser Palette • Operator Clearances
            </p>
          </div>
        </div>

        {savedToast && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-500 text-emerald-400 text-xs font-bold animate-fade-in">
            <Check className="w-4 h-4" />
            <span>CONFIGURATION APPLIED</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 my-6 max-w-3xl">
        {/* 1. HUD Centerpiece Mode (Two HUDs, one toggle) */}
        <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-3 rounded-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              HUD CENTERPIECE VISUALIZATION (⚙ → HUD)
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">100% SOFTWARE 2D PAINTER</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Select the central visualization module. Both render via zero-dependency software painter with identical performance and survive restart.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div
              onClick={() => setHudCenterpiece('face')}
              className={`p-3.5 border transition-all cursor-pointer rounded-xs flex flex-col justify-between ${
                hudCenterpiece === 'face'
                  ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-[#050608] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    🧑‍🎤 ANIMATED HUMAN HEAD
                  </span>
                  {hudCenterpiece === 'face' && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-600/40 text-red-300 font-mono">ACTIVE</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  MediaPipe canonical face geometry with actual eyelids, lips, and cheekbones. Dual-source lip-sync (50 shapes/sec) from formant physics and transcript articulation rules.
                </p>
              </div>
              <div className="text-[9px] text-red-400/80 mt-2 font-mono">
                &gt; Features: Saccades, phrase-riding brows, eyelid blink, gaze status light
              </div>
            </div>

            <div
              onClick={() => setHudCenterpiece('reactor')}
              className={`p-3.5 border transition-all cursor-pointer rounded-xs flex flex-col justify-between ${
                hudCenterpiece === 'reactor'
                  ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-[#050608] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    ◉ ARC REACTOR CORE
                  </span>
                  {hudCenterpiece === 'reactor' && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-600/40 text-red-300 font-mono">ACTIVE</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Calibrated gauge ring, 3 concentric arcs whose speed matches AI thought state, real-time audio waveform spectrum ring, and a core that brightens with the voice.
                </p>
              </div>
              <div className="text-[9px] text-red-400/80 mt-2 font-mono">
                &gt; Features: Zero decorative motion; all arcs and spikes are functional telemetry
              </div>
            </div>
          </div>
        </div>

        {/* 2. Push-to-Talk (⚙ → PUSH-TO-TALK) */}
        <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-3 rounded-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
              <Mic className="w-4 h-4" />
              PUSH-TO-TALK CHORD CONTROL (⚙ → PUSH-TO-TALK)
            </h3>
            <button
              type="button"
              onClick={() => setPushToTalk(!pushToTalk)}
              className={`px-3 py-1 text-xs font-bold font-mono transition-colors cursor-pointer border ${
                pushToTalk
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
              }`}
            >
              {pushToTalk ? 'ENABLED [CTRL+SPACE]' : 'DISABLED [HANDS-FREE]'}
            </button>
          </div>

          <p className="text-[11px] text-zinc-300 leading-relaxed">
            When enabled, the microphone stays closed and nothing leaves the machine until you hold <strong className="text-red-400">Ctrl+Space</strong>. Holding the chord wakes the assistant as a silent alternative to speaking the wake word.
          </p>

          <div className="p-2.5 bg-[#030406] border border-zinc-800 text-[10px] text-zinc-400 font-mono space-y-1">
            <div className="flex items-center gap-2 text-zinc-300">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>PLATFORM CHORD STATUS:</span>
            </div>
            <p>
              • <span className="text-zinc-200">Windows:</span> Polling virtual-key codes for global chord capture without message loop overhead.
            </p>
            <p>
              • <span className="text-zinc-200">macOS & Linux:</span> Chord bound cleanly inside the active window.
            </p>
          </div>
        </div>

        {/* 3. TTS Provider & Fish Audio Status */}
        <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-4 rounded-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              VOICE & TEXT-TO-SPEECH PROVIDER
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">BACKEND SECURE</span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Select the primary speech synthesizer. All API keys are kept strictly on the backend and never exposed to the client.
          </p>

          {/* Provider Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fish Audio */}
            <div
              onClick={() => setTtsProvider('fish_audio')}
              className={`p-3.5 border transition-all cursor-pointer rounded-xs flex flex-col justify-between ${
                ttsProvider === 'fish_audio'
                  ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-[#050608] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    🐟 FISH AUDIO
                  </span>
                  {ttsProvider === 'fish_audio' && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-600/40 text-red-300 font-mono">SELECTED</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Official Fish Audio API (model: <code className="text-zinc-300">{voiceStatus?.fishModel || 's2.1-pro-free'}</code>). Natural multilingual Hindi &amp; Hinglish cadence.
                </p>
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-mono">Status:</span>
                {voiceStatus?.fishAudioConfigured ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono font-bold">
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    Not Connected
                  </span>
                )}
              </div>
            </div>

            {/* ElevenLabs */}
            <div
              onClick={() => setTtsProvider('elevenlabs')}
              className={`p-3.5 border transition-all cursor-pointer rounded-xs flex flex-col justify-between ${
                ttsProvider === 'elevenlabs'
                  ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-[#050608] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    ✨ ELEVENLABS
                  </span>
                  {ttsProvider === 'elevenlabs' && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-600/40 text-red-300 font-mono">SELECTED</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  ElevenLabs Multilingual V2 provider. High stability &amp; speech styling.
                </p>
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-mono">Status:</span>
                {voiceStatus?.elevenlabsConfigured ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                    <WifiOff className="w-3 h-3 text-zinc-500" />
                    Not Connected
                  </span>
                )}
              </div>
            </div>

            {/* System / Local */}
            <div
              onClick={() => setTtsProvider('system')}
              className={`p-3.5 border transition-all cursor-pointer rounded-xs flex flex-col justify-between ${
                ttsProvider === 'system'
                  ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-[#050608] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    🔊 LOCAL / BROWSER
                  </span>
                  {ttsProvider === 'system' && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-600/40 text-red-300 font-mono">SELECTED</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Web Speech API native synthesis. Offline-ready and zero external network latency.
                </p>
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-mono">Status:</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Available
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline & Fallback Architecture Callout */}
          <div className="p-3 bg-[#030406] border border-zinc-800 text-[10px] text-zinc-400 font-mono space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">TTS PIPELINE &amp; FALLBACK ARCHITECTURE:</span>
            </div>
            <p className="text-zinc-300">
              Assistant response → <span className="text-cyan-400">SpeechTextNormalizer</span> → <span className="text-red-400 font-bold">FishAudioTTSProvider</span> → Audio → Speaker
            </p>
            <p className="text-zinc-400">
              • <span className="text-zinc-300">Failover:</span> If Fish Audio fails → try existing ElevenLabs provider → if both fail, display text without audio.
            </p>
            <p className="text-zinc-400">
              • <span className="text-zinc-300">Feminine Voice Persona:</span> Preserves Hindi/Hinglish natural feminine grammar (<em>"karti hoon"</em>, <em>"kar deti hoon"</em>, <em>"kar dungi"</em>, <em>"samajh gayi"</em>).
            </p>
          </div>
        </div>

        {/* 4. Operator Designation */}
        <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-3 rounded-xs">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <User className="w-4 h-4" />
            OPERATOR DESIGNATION
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">CALLSIGN / NAME</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-[#030406] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">SOVEREIGN CLEARANCE</label>
              <input
                type="text"
                disabled
                value="LEVEL 5 // INVIOLABLE"
                className="w-full bg-[#030406] border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 4. Optical Glow Lighting */}
        <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-3 rounded-xs">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <Eye className="w-4 h-4" />
            OPTICAL LASER & ENERGY PALETTE
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'CRIMSON_RED', name: 'Crimson Red', desc: 'Sovereign Ultron specification' },
              { id: 'EMBER_ORANGE', name: 'Ember Orange', desc: 'High-temperature thermal optic' },
              { id: 'ALARM_VERMILION', name: 'Alarm Vermilion', desc: 'Defensive red alert profile' },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setColorProfile(p.id)}
                className={`p-3 border transition-all cursor-pointer rounded-xs ${
                  colorProfile === p.id
                    ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'bg-[#050608] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <p className="text-xs font-bold text-zinc-100">{p.name}</p>
                <p className="text-[10px] text-zinc-400 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs uppercase tracking-widest border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
        >
          APPLY CONFIGURATION
        </button>
      </form>
    </div>
  );
};
