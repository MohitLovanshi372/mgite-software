/**
 * Intelligence Page
 * Frontier autonomous intelligence metrics, neural reasoning graphs, and cognitive parameters.
 * Includes 'Gesture Calibration' sub-view for recording, mapping, and teaching hand kinematics.
 */

import React, { useState } from 'react';
import { Brain, Cpu, Zap, Activity, ShieldCheck, Terminal, Layers, Hand, Sparkles } from 'lucide-react';
import { HUDFrame } from '../components/HUD/HUDFrame.tsx';
import { GestureCalibrationSubView } from '../components/Gestures/GestureCalibrationSubView.tsx';
import { RealtimeGestureAccuracyChart } from '../components/Gestures/RealtimeGestureAccuracyChart.tsx';
import { AIStateMode } from '../types/index.ts';

interface IntelligencePageProps {
  currentAIState?: AIStateMode;
  onExecuteCommand?: (command: string, mappedState?: AIStateMode) => void;
}

export const IntelligencePage: React.FC<IntelligencePageProps> = ({
  currentAIState = 'IDLE',
  onExecuteCommand,
}) => {
  const [activeSubView, setActiveSubView] = useState<'cognitive_core' | 'gesture_calibration'>('gesture_calibration');
  const [quantization, setQuantization] = useState('FP8_SOVEREIGN');
  const [activeLayer, setActiveLayer] = useState('TRANSFORMER_BLOCK_24');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              AUTONOMOUS INTELLIGENCE CORE
            </h2>
            <p className="text-xs text-zinc-400">
              Deterministic cognitive loop • Local vector quantization • Kinetic gesture calibration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-view Navigation Switch */}
          <div className="flex items-center bg-[#090b12] border border-zinc-800 p-1 rounded-xs">
            <button
              type="button"
              onClick={() => setActiveSubView('cognitive_core')}
              className={`px-3 py-1.5 text-xs font-bold tracking-wider flex items-center gap-1.5 rounded-xs transition-all cursor-pointer ${
                activeSubView === 'cognitive_core'
                  ? 'bg-red-950/80 border border-red-500 text-red-300 shadow-[0_0_8px_#ef4444]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>COGNITIVE MATRIX</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('gesture_calibration')}
              className={`px-3 py-1.5 text-xs font-bold tracking-wider flex items-center gap-1.5 rounded-xs transition-all cursor-pointer ${
                activeSubView === 'gesture_calibration'
                  ? 'bg-red-950/80 border border-red-500 text-red-300 shadow-[0_0_8px_#ef4444]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Hand className="w-3.5 h-3.5 text-red-400" />
              <span>GESTURE CALIBRATION</span>
            </button>
          </div>

          <span className="text-[10px] px-2.5 py-1.5 bg-red-950/60 border border-red-500/40 text-red-400 font-bold uppercase hidden md:inline">
            MODEL: ULTRON-MARK-IX
          </span>
        </div>
      </div>

      {/* Sub-View Content */}
      {activeSubView === 'gesture_calibration' ? (
        <div className="my-6">
          <GestureCalibrationSubView
            currentAIState={currentAIState}
            onExecuteCommand={onExecuteCommand}
          />
        </div>
      ) : (
        /* Original Cognitive Matrix Grid */
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
                    Audio synthesis buffer locked. Planetary acoustic synthesizer synchronized. Response payload prepared for observatory operator.
                  </p>
                </div>
              </div>
            </HUDFrame>
          </div>

          {/* Layer 3: Real-Time Optical Gesture Accuracy & Clarity Telemetry */}
          <div className="lg:col-span-3">
            <RealtimeGestureAccuracyChart height={220} showControls={true} />
          </div>
        </div>
      )}
    </div>
  );
};

