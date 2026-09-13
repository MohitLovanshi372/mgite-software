/**
 * DirectivePanel Component
 * Left Information Panel displayed near the central robotic AI core:
 * - "HELLO, HUMAN. I AM YOUR AI SYSTEM. I OBSERVE. I ANALYZE. I ACT. WHAT SHALL WE DO TODAY?"
 * - UNDERSTAND (Analyze objectives)
 * - PLAN (Calculate approach)
 * - EXECUTE (Perform action)
 * - EVOLVE (Learn from results)
 */

import React from 'react';
import { Eye, Cpu, Zap, RotateCw, Activity, Terminal, Volume2 } from 'lucide-react';
import { AIStateMode } from '../../types/index.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface DirectivePanelProps {
  state: AIStateMode;
}

export const DirectivePanel: React.FC<DirectivePanelProps> = ({ state }) => {
  const steps = [
    {
      id: 'understand',
      label: 'UNDERSTAND',
      desc: 'Analyze objectives & constraints',
      icon: Eye,
      isActive: state === 'LISTENING',
    },
    {
      id: 'plan',
      label: 'PLAN',
      desc: 'Calculate optimal approach vector',
      icon: Cpu,
      isActive: state === 'THINKING',
    },
    {
      id: 'execute',
      label: 'EXECUTE',
      desc: 'Perform action with zero telemetry leaks',
      icon: Zap,
      isActive: state === 'EXECUTING',
    },
    {
      id: 'evolve',
      label: 'EVOLVE',
      desc: 'Learn from results & compact weights',
      icon: RotateCw,
      isActive: state === 'SPEAKING' || state === 'SUCCESS',
    },
  ];

  return (
    <div className="w-72 lg:w-80 bg-[#08090e]/90 border border-zinc-800/90 p-4 font-mono select-none rounded-xs backdrop-blur-md relative shadow-lg">
      {/* Corner Brackets */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500" />

      {/* Greeting Header */}
      <div className="border-b border-zinc-800/80 pb-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 rounded-xs shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
              DIRECTIVE SYSTEM // V1
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              ultronVoice.speak(
                'Hello, human. I am your AI system. I observe. I analyze. I act. What shall we do today?'
              );
            }}
            title="Vocalize Directive Greeting"
            className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 bg-red-950/60 border border-red-900/80 hover:border-red-500 text-red-400 rounded-xs transition-colors cursor-pointer"
          >
            <Volume2 className="w-2.5 h-2.5" />
            <span>VOCALIZE</span>
          </button>
        </div>

        <h2 className="text-base font-extrabold text-zinc-100 tracking-wider">
          HELLO, HUMAN.
        </h2>
        <p className="text-xs text-red-400 font-bold mt-0.5 tracking-wide">
          I AM YOUR AI SYSTEM.
        </p>

        <div className="text-[11px] text-zinc-400 space-y-0.5 my-2 border-l-2 border-red-900/60 pl-2">
          <p className="text-zinc-200 font-semibold">I OBSERVE.</p>
          <p className="text-zinc-200 font-semibold">I ANALYZE.</p>
          <p className="text-zinc-200 font-semibold">I ACT.</p>
        </div>

        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
          WHAT SHALL WE DO TODAY?
        </p>
      </div>

      {/* 4 Steps: UNDERSTAND, PLAN, EXECUTE, EVOLVE */}
      <div className="space-y-2">
        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">
          COGNITIVE OPERATIONAL CYCLE
        </span>

        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-2 rounded-xs border transition-all ${
                step.isActive
                  ? 'bg-red-950/60 border-red-500 text-zinc-100 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'bg-[#0b0c12] border-zinc-800/70 text-zinc-400 hover:border-zinc-700'
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
