/**
 * JARVIS Greeting & Cognitive Flow Card (Left-Center HUD Component)
 *
 * Provides:
 * 1. Compact greeting & system operational status:
 *    - Time-adaptive greeting ("Good morning / afternoon / evening, Sir")
 *    - System health & Mark VII core readiness
 * 2. Visual Cognitive Pipeline:
 *    Understand → Plan → Execute → Learn
 *    - Step progression with dynamic glowing state reaction
 *    - Interactive hover & telemetry hints
 */

import React, { useMemo } from 'react';
import {
  Sparkles,
  Shield,
  Ear,
  Cpu,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { CenterStageState } from './CenterStageHUD.tsx';

interface JARVISGreetingCardProps {
  assistantName?: string;
  state: CenterStageState;
  isOnline: boolean;
  className?: string;
}

export const JARVISGreetingCard: React.FC<JARVISGreetingCardProps> = ({
  assistantName = 'JARVIS',
  state,
  isOnline,
  className = '',
}) => {
  // Time-adaptive greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Sir';
    if (hour < 18) return 'Good afternoon, Sir';
    return 'Good evening, Sir';
  }, []);

  // Determine which step of the cognitive flow is currently active
  const activeStepIndex = useMemo(() => {
    switch (state) {
      case 'LISTENING':
        return 0; // Understand
      case 'THINKING':
        return 1; // Plan
      case 'EXECUTING':
        return 2; // Execute
      case 'SPEAKING':
      case 'SUCCESS':
        return 3; // Learn
      default:
        return -1; // Idle / Ready
    }
  }, [state]);

  const pipelineSteps = [
    {
      id: 'understand',
      label: 'Understand',
      desc: 'Semantic & acoustic parsing',
      icon: Ear,
      color: 'text-emerald-400',
      activeBorder: 'border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      bgActive: 'bg-emerald-950/60',
    },
    {
      id: 'plan',
      label: 'Plan',
      desc: 'Contextual reasoning & routing',
      icon: Cpu,
      color: 'text-purple-400',
      activeBorder: 'border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
      bgActive: 'bg-purple-950/60',
    },
    {
      id: 'execute',
      label: 'Execute',
      desc: 'Tool invocation & automation',
      icon: Zap,
      color: 'text-amber-400',
      activeBorder: 'border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      bgActive: 'bg-amber-950/60',
    },
    {
      id: 'learn',
      label: 'Learn',
      desc: 'Memory synthesis & index',
      icon: BookOpen,
      color: 'text-cyan-400',
      activeBorder: 'border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
      bgActive: 'bg-cyan-950/60',
    },
  ];

  return (
    <div
      id="jarvis-greeting-flow-card"
      className={`rounded-2xl bg-[#06080e]/85 backdrop-blur-xl border border-cyan-500/20 p-3.5 sm:p-4 shadow-[0_0_24px_rgba(6,182,212,0.08)] transition-all ${className}`}
    >
      {/* 1. Header: Greeting & Status */}
      <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-800/80 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>{assistantName} MARK VII</span>
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
            <span className="text-slate-400 font-sans">{isOnline ? 'Online' : 'Airgap'}</span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-100 mt-0.5 tracking-tight">
            {greeting}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Systems operational. Neural interface standing by for commands.
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>INVARIANTS OK</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500 mt-1">PRIVACY SHIELDED</span>
        </div>
      </div>

      {/* 2. Visual Cognitive Pipeline: Understand → Plan → Execute → Learn */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-cyan-400" />
            Cognitive Pipeline
          </span>
          <span className="text-[10px] font-mono text-cyan-500/80">
            {activeStepIndex === -1 ? 'IDLE / READY' : pipelineSteps[activeStepIndex].label.toUpperCase()}
          </span>
        </div>

        {/* Steps Flow Grid */}
        <div className="grid grid-cols-4 gap-1.5 relative">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStepIndex === idx;
            const isPassed = activeStepIndex > idx;

            return (
              <div key={step.id} className="relative flex flex-col items-center text-center">
                {/* Connector Arrow for steps 0, 1, 2 */}
                {idx < 3 && (
                  <div className="hidden sm:block absolute top-3.5 -right-2 transform translate-x-1/2 z-10 pointer-events-none">
                    <ArrowRight className="w-2.5 h-2.5 text-slate-700" />
                  </div>
                )}

                {/* Step Box */}
                <div
                  className={`w-full p-2 rounded-xl border transition-all flex flex-col items-center gap-1 cursor-default ${
                    isActive
                      ? `${step.bgActive} ${step.activeBorder} scale-[1.03]`
                      : isPassed
                      ? 'bg-slate-900/50 border-cyan-500/30 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                  title={`${step.label}: ${step.desc}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? `${step.color} bg-white/10`
                        : isPassed
                        ? 'text-cyan-400 bg-cyan-950/40'
                        : 'text-slate-500 bg-slate-900/60'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-mono font-medium leading-none ${
                      isActive ? 'text-slate-100 font-bold' : isPassed ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>

                  <span className="hidden xl:inline text-[9px] text-slate-500 leading-tight truncate w-full text-center">
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
