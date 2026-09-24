/**
 * SystemControl Page
 *
 * Comprehensive System & Hardware Control Center for Ultron Galaxy OS:
 * 1. Ultron Neural Voice Synthesis Module (ElevenLabs API parameters: pitch, stability, style, similarity_boost, voice profiles)
 * 2. GLB 3D Kinetic Hand Gesture Matrix & Optical Tracking Controller (Rotate, Levitate, Pan, Scale, Reset)
 * 3. Low-level hardware registers, acoustic inference sliders, and airgap security switches
 */

import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Mic,
  Volume2,
  Shield,
  Flame,
  RotateCcw,
  Sparkles,
  Hand,
  Radio,
  Layers,
  Lock,
  Activity,
  Tv,
} from 'lucide-react';
import { ScanlineIntensity } from '../components/Theme/UltronScanlineOverlay.tsx';
import { UltronVoiceSettingsCard } from '../components/Voice/UltronVoiceSettingsCard.tsx';
import { TextNormalizationDebugger } from '../components/Voice/TextNormalizationDebugger.tsx';
import { ultronVoice } from '../utils/ultronVoice.ts';
import { soundFx } from '../utils/audioEffects.ts';

interface SystemControlPageProps {
  onNavigate?: (page: any) => void;
}

export const SystemControlPage: React.FC<SystemControlPageProps> = ({
  onNavigate,
}) => {
  // Navigation / Filter Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'voice' | 'normalization' | 'hardware'>('all');

  // Low-level Hardware & Inference State
  const [micSensitivity, setMicSensitivity] = useState<number>(85);
  const [neuralTemp, setNeuralTemp] = useState<number>(0.2);
  const [airgapShield, setAirgapShield] = useState<boolean>(true);
  const [autoRedaction, setAutoRedaction] = useState<boolean>(true);
  const [gpuAcceleration, setGpuAcceleration] = useState<boolean>(true);

  const handleResetDefaults = () => {
    soundFx.playClick();
    setMicSensitivity(85);
    setNeuralTemp(0.2);
    setAirgapShield(true);
    setAutoRedaction(true);
    setGpuAcceleration(true);
    ultronVoice.applyProfile('ULTRON_PRIME');
    ultronVoice.setVolume(0.9);
  };

  return (
    <div
      id="system-control-page"
      className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono text-zinc-100"
    >
      {/* 1. Header & Quick View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(220,38,38,0.4)] rounded-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-100 tracking-wider">
                SYSTEM CONTROL & TELEMETRY MATRIX
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-red-950/80 border border-red-600/50 text-red-400 font-mono">
                SOVEREIGN KERNEL
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ElevenLabs Neural Voice Calibration • 3D GLB Hand Gestures Engine • Sovereign Hardware Registers
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Selector Filters */}
          <div className="flex items-center bg-zinc-950/90 border border-zinc-800 rounded-xs p-1 gap-1 text-xs">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('all');
              }}
              className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ALL MODULES
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('voice');
              }}
              className={`px-3 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'voice'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>VOICE (ELEVENLABS)</span>
            </button>
            <button
              id="tab-normalization-debugger-btn"
              onClick={() => {
                soundFx.playClick();
                setActiveTab('normalization');
              }}
              className={`px-3 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'normalization'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>NORMALIZATION DEBUGGER</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('hardware');
              }}
              className={`px-3 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'hardware'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>HARDWARE</span>
            </button>
          </div>

          {/* Reset Defaults */}
          <button
            id="reset-all-system-defaults-btn"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 bg-[#08090e] border border-zinc-800 hover:border-red-900 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer rounded-xs"
            title="Reset all system registers to nominal defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>RESET DEFAULTS</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6 my-6">
        {/* Module 1: Ultron Neural Voice Synthesis & ElevenLabs Parameters */}
        {(activeTab === 'all' || activeTab === 'voice') && (
          <section id="section-ultron-voice-settings" className="space-y-2">
            <UltronVoiceSettingsCard />
          </section>
        )}

        {/* Module 2: Text Normalization Pipeline Debugger (Phase 3 Voice Fix Inspector) */}
        {activeTab === 'normalization' && (
          <section id="section-text-normalization-debugger" className="space-y-2">
            <TextNormalizationDebugger />
          </section>
        )}

        {/* Module 3: Sovereign Hardware & Inference Telemetry */}
        {(activeTab === 'all' || activeTab === 'hardware') && (
          <section id="section-hardware-switches" className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
              <Shield className="w-4 h-4 text-red-500" />
              SOVEREIGN AIRGAP REGISTERS & INFERENCE CORES
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Audio & Inference Sliders */}
              <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-4 rounded-xs">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Cpu className="w-4 h-4" />
                  AUDIO INFERENCE GAIN & TEMPERATURE
                </h3>

                {/* Microphone Sensitivity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-red-400" />
                      Acoustic Mic Threshold
                    </span>
                    <span className="text-red-400 font-bold">{micSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={micSensitivity}
                    onChange={(e) => setMicSensitivity(Number(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer bg-zinc-900 h-1.5 rounded-xs"
                  />
                  <span className="text-[10px] text-zinc-400">
                    Threshold filter for ambient noise rejection during voice directive input.
                  </span>
                </div>

                {/* Neural Inference Temperature */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      Inference Creativity (Temperature)
                    </span>
                    <span className="text-orange-400 font-bold">{neuralTemp.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={neuralTemp}
                    onChange={(e) => setNeuralTemp(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer bg-zinc-900 h-1.5 rounded-xs"
                  />
                  <span className="text-[10px] text-zinc-400">
                    Deterministic calculation (0.05) vs. autonomous conversational extrapolation (1.0).
                  </span>
                </div>
              </div>

              {/* Hardware Switches */}
              <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-3.5 rounded-xs">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Lock className="w-4 h-4" />
                  AIRGAP SECURITY & HARDWARE PIPELINES
                </h3>

                {/* Airgap Switch */}
                <div className="flex items-center justify-between p-2.5 bg-[#050608] border border-zinc-800 rounded-xs">
                  <div>
                    <p className="text-xs font-bold text-zinc-100">Local-First Airgap Barrier</p>
                    <p className="text-[10px] text-zinc-400">Enforces zero external telemetry leaks</p>
                  </div>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setAirgapShield(!airgapShield);
                    }}
                    className={`w-11 h-5 rounded-xs transition-colors relative cursor-pointer ${
                      airgapShield ? 'bg-red-600' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-xs transition-transform ${
                        airgapShield ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto Redaction Switch */}
                <div className="flex items-center justify-between p-2.5 bg-[#050608] border border-zinc-800 rounded-xs">
                  <div>
                    <p className="text-xs font-bold text-zinc-100">Sensitive Token Redaction</p>
                    <p className="text-[10px] text-zinc-400">Masks passwords, OTPs, and private keys</p>
                  </div>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setAutoRedaction(!autoRedaction);
                    }}
                    className={`w-11 h-5 rounded-xs transition-colors relative cursor-pointer ${
                      autoRedaction ? 'bg-red-600' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-xs transition-transform ${
                        autoRedaction ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* GPU WebGL Acceleration */}
                <div className="flex items-center justify-between p-2.5 bg-[#050608] border border-zinc-800 rounded-xs">
                  <div>
                    <p className="text-xs font-bold text-zinc-100">WebGL Hardware 3D Pipeline</p>
                    <p className="text-[10px] text-zinc-400">60 FPS GLB rendering, kinematic physics, PBR shaders</p>
                  </div>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setGpuAcceleration(!gpuAcceleration);
                    }}
                    className={`w-11 h-5 rounded-xs transition-colors relative cursor-pointer ${
                      gpuAcceleration ? 'bg-red-600' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-xs transition-transform ${
                        gpuAcceleration ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Ultron CRT Scanlines Overlay Engine */}
                <div className="flex flex-col gap-2 p-2.5 bg-[#050608] border border-zinc-800 rounded-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 text-red-400" />
                        <span>Ultron Viewport CRT Scanlines</span>
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        CSS-driven cathode raster synced to AI state (peaks during THINKING / EXECUTING)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {(['CINEMA', 'OVERDRIVE', 'SUBTLE', 'OFF'] as ScanlineIntensity[]).map((mode) => {
                      const currentSaved = localStorage.getItem('ultron_scanline_mode') || 'CINEMA';
                      const isSel = currentSaved === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => {
                            soundFx.playClick();
                            localStorage.setItem('ultron_scanline_mode', mode);
                            window.dispatchEvent(new Event('storage'));
                            // Trigger re-render
                            window.location.reload();
                          }}
                          className={`py-1.5 px-2 text-[10px] font-bold rounded-xs border transition-all cursor-pointer text-center ${
                            isSel
                              ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                              : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
