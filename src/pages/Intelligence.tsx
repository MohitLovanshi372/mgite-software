/**
 * Intelligence Page
 * Frontier autonomous intelligence metrics, neural reasoning graphs, and cognitive parameters.
 */

import React, { useState } from 'react';
import { Brain, Cpu, Zap, Activity, ShieldCheck, Terminal, Layers } from 'lucide-react';
import { HUDFrame } from '../components/HUD/HUDFrame.tsx';

export const IntelligencePage: React.FC = () => {
  const [quantization, setQuantization] = useState('FP8_SOVEREIGN');
  const [activeLayer, setActiveLayer] = useState('TRANSFORMER_BLOCK_24');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              AUTONOMOUS INTELLIGENCE CORE
            </h2>
            <p className="text-xs text-zinc-400">
              Deterministic cognitive loop • Local vector quantization • Zero cloud egress
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-400 font-bold uppercase">
          MODEL: ULTRON-MARK-IX (SOVEREIGN)
        </span>
      </div>

      {/* Grid: Cognitive Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-6">
        {/* Layer 1: Neural Weights & Quantization */}
        <HUDFrame title="WEIGHT QUANTIZATION & BUS" badge="ONLINE" badgeColor="red">
          <div className="space-y-3 text-xs">
            <div className="p-2.5 bg-[#090a0f] border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase block">Active Precision</span>
              <p className="text-red-400 font-bold">{quantization}</p>
              <p className="text-[10px] text-zinc-400">Zero floating point loss. Hardware-accelerated NPU execution.</p>
            </div>

            <div className="p-2.5 bg-[#090a0f] border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase block">Inference Latency</span>
              <p className="text-zinc-100 font-bold">1.4ms (Tokens/Sec: 128)</p>
            </div>

            <div className="p-2.5 bg-[#090a0f] border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase block">Context Window</span>
              <p className="text-zinc-100 font-bold">1,048,576 Tokens (Airgap Ring Buffer)</p>
            </div>
          </div>
        </HUDFrame>

        {/* Layer 2: Reasoning Trace Inspector (2 cols) */}
        <div className="lg:col-span-2">
          <HUDFrame title="COGNITIVE REASONING TRACE" badge="LIVE" badgeColor="emerald">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#08090f] border border-zinc-800/80 rounded-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-red-400 font-bold">
                  <span>STEP 01: INTENT DECOMPOSITION</span>
                  <span>CONFIDENCE: 99.8%</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  User inputs parsed with zero ambiguity. Strict local-first security boundaries enforced. Redaction of sensitive credentials executed immediately.
                </p>
              </div>

              <div className="p-3 bg-[#08090f] border border-zinc-800/80 rounded-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-orange-400 font-bold">
                  <span>STEP 02: VECTOR RECALL & GRAPH TRAVERSAL</span>
                  <span>14 NODES MATCHED</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Scanned 384-dimensional cosine index across internal operating memory. Zero external network calls required.
                </p>
              </div>

              <div className="p-3 bg-[#08090f] border border-zinc-800/80 rounded-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                  <span>STEP 03: SYNTHESIS & MECHANICAL EXECUTION</span>
                  <span>EXECUTED (14ms)</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Audio synthesis buffer locked. Robotic jaw kinematics synchronized. Response payload prepared for human operator.
                </p>
              </div>
            </div>
          </HUDFrame>
        </div>
      </div>
    </div>
  );
};
