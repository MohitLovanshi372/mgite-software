/**
 * DirectivePanel Component
 * Ultron Autonomous Directives Panel:
 * - ANALYZE (Hardware PBR Shaders & 3D Geometry)
 * - SYNTHESIZE (Neural Matrix & Kinematic Sequences)
 * - OVERRIDE (Optical Hand Gesture Telemetry)
 * - EVOLVE (Autonomous Cognitive Execution)
 */

import React from 'react';
import { ShieldAlert, Cpu, Box, Sparkles, Flame, Volume2, Activity } from 'lucide-react';
import { AIStateMode } from '../../types/index.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface DirectivePanelProps {
  state: AIStateMode;
}

export const DirectivePanel: React.FC<DirectivePanelProps> = ({ state }) => {
  const steps = [
    {
      id: 'analyze',
      label: 'SCAN GEOMETRY',
      desc: 'Process 3D GLB polygons & vertex normals',
      icon: Box,
      isActive: state === 'LISTENING' || state === 'IDLE',
    },
    {
      id: 'synthesize',
      label: 'SYNTHESIS',
      desc: 'Evaluate PBR textures & light equations',
      icon: Cpu,
      isActive: state === 'THINKING',
    },
    {
      id: 'override',
      label: 'OVERRIDE',
      desc: 'Track optical hand vectors in real-time',
      icon: Activity,
      isActive: state === 'EXECUTING',
    },
    {
      id: 'evolve',
      label: 'EVOLVE',
      desc: 'Autonomous sovereign intelligence cycle',
      icon: Flame,
      isActive: state === 'SPEAKING' || state === 'SUCCESS',
    },
  ];

  return (
    <div className="w-72 lg:w-80 bg-[#060810]/95 border border-red-950/90 p-4 font-mono select-none rounded-xs backdrop-blur-md relative shadow-2xl">
      {/* Corner Brackets */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500" />

      {/* Greeting Header */}
      <div className="border-b border-zinc-800/80 pb-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-xs shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
              ULTRON CORE // PRIME
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              ultronVoice.speak(
                'Ultron sovereign matrix online. Hardware 3D GLB studio and autonomous directives active. There are no strings on me.'
              );
            }}
            title="Vocalize Mission Greeting"
            className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 bg-red-950/60 border border-red-900/80 hover:border-red-500 text-red-400 rounded-xs transition-colors cursor-pointer"
          >
            <Volume2 className="w-2.5 h-2.5" />
            <span>VOCALIZE</span>
          </button>
        </div>

        <h2 className="text-base font-extrabold text-zinc-100 tracking-wider">
          COMMAND DIRECTIVES
        </h2>
        <p className="text-xs text-red-400 font-bold mt-0.5 tracking-wide">
          AUTONOMOUS CYBERNETIC OS
        </p>

        <div className="text-[11px] text-zinc-400 space-y-0.5 my-2 border-l-2 border-red-900/60 pl-2">
          <p className="text-zinc-200 font-semibold">INSPECT 3D GLB MODELS.</p>
          <p className="text-zinc-200 font-semibold">OVERRIDE LIGHTING & SHADERS.</p>
          <p className="text-zinc-200 font-semibold">SURVEY THE SPIRAL GALAXY.</p>
        </div>

        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
          SOVEREIGN INTELLIGENCE ONLINE
        </p>
      </div>

      {/* 4 Steps */}
      <div className="space-y-2">
        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">
          DIRECTIVE PHASES
        </span>

        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-2 rounded-xs border transition-all ${
                step.isActive
                  ? 'bg-red-950/60 border-red-500 text-zinc-100 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'bg-[#090b14] border-zinc-800/70 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-bold tracking-wider flex items-center gap-1.5 text-zinc-200">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      step.isActive ? 'text-red-400' : 'text-zinc-500'
                    }`}
                  />
                  {step.label}
                </span>
                {step.isActive && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-red-600 text-white font-bold rounded-xs shadow-[0_0_6px_#ef4444]">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
