/**
 * SystemControl Page
 * Low-level hardware parameters, acoustic sliders, and security airgap switches.
 */

import React, { useState } from 'react';
import { Sliders, Cpu, Mic, Volume2, Shield, Flame, RotateCcw } from 'lucide-react';
import { HUDFrame } from '../components/HUD/HUDFrame.tsx';

export const SystemControlPage: React.FC = () => {
  const [micSensitivity, setMicSensitivity] = useState(85);
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [neuralTemp, setNeuralTemp] = useState(0.2);
  const [airgapShield, setAirgapShield] = useState(true);
  const [autoRedaction, setAutoRedaction] = useState(true);
  const [gpuAcceleration, setGpuAcceleration] = useState(true);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              SYSTEM CONTROL & HARDWARE TELEMETRY
            </h2>
            <p className="text-xs text-zinc-400">
              Low-level servo parameters • Acoustic synthesis • Airgap hardware registers
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMicSensitivity(85);
            setVoiceVolume(80);
            setNeuralTemp(0.2);
            setAirgapShield(true);
            setAutoRedaction(true);
            setGpuAcceleration(true);
          }}
          className="px-3 py-1.5 bg-[#08090e] border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
          <span>RESET DEFAULTS</span>
        </button>
      </div>

      {/* Grid: Sliders & Switches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Sliders Column */}
        <div className="p-5 bg-[#08090f] border border-zinc-800 space-y-5 rounded-xs">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            ACOUSTIC & INFERENCE SLIDERS
          </h3>

          {/* Microphone */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-red-400" />
                Mic Acoustic Gain
              </span>
              <span className="text-red-400 font-bold">{micSensitivity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={micSensitivity}
              onChange={(e) => setMicSensitivity(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer bg-zinc-900 h-2 rounded-xs"
            />
          </div>

          {/* Voice Volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-red-400" />
                Synthetic Voice Volume
              </span>
              <span className="text-red-400 font-bold">{voiceVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={voiceVolume}
              onChange={(e) => setVoiceVolume(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer bg-zinc-900 h-2 rounded-xs"
            />
          </div>

          {/* Neural Temp */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Neural Precision (Temperature)
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
              className="w-full accent-orange-500 cursor-pointer bg-zinc-900 h-2 rounded-xs"
            />
          </div>
        </div>

        {/* Switches Column */}
        <div className="p-5 bg-[#08090f] border border-zinc-800 space-y-4 rounded-xs">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-4 h-4" />
            SOVEREIGN HARDWARE SWITCHES
          </h3>

          {/* Airgap Switch */}
          <div className="flex items-center justify-between p-3 bg-[#050608] border border-zinc-800">
            <div>
              <p className="text-xs font-bold text-zinc-100">Local-First Airgap Barrier</p>
              <p className="text-[10px] text-zinc-400">Enforces zero external telemetry leaks</p>
            </div>
            <button
              onClick={() => setAirgapShield(!airgapShield)}
              className={`w-12 h-6 rounded-xs transition-colors relative cursor-pointer ${
                airgapShield ? 'bg-red-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-xs transition-transform ${
                  airgapShield ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Redaction Switch */}
          <div className="flex items-center justify-between p-3 bg-[#050608] border border-zinc-800">
            <div>
              <p className="text-xs font-bold text-zinc-100">Sensitive Token Redaction</p>
              <p className="text-[10px] text-zinc-400">Masks passwords, OTPs, and private keys</p>
            </div>
            <button
              onClick={() => setAutoRedaction(!autoRedaction)}
              className={`w-12 h-6 rounded-xs transition-colors relative cursor-pointer ${
                autoRedaction ? 'bg-red-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-xs transition-transform ${
                  autoRedaction ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* GPU Acceleration */}
          <div className="flex items-center justify-between p-3 bg-[#050608] border border-zinc-800">
            <div>
              <p className="text-xs font-bold text-zinc-100">Hardware WebGL 3D Acceleration</p>
              <p className="text-[10px] text-zinc-400">60 FPS robotic core rendering & vector shaders</p>
            </div>
            <button
              onClick={() => setGpuAcceleration(!gpuAcceleration)}
              className={`w-12 h-6 rounded-xs transition-colors relative cursor-pointer ${
                gpuAcceleration ? 'bg-red-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-xs transition-transform ${
                  gpuAcceleration ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
