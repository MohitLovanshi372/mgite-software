/**
 * Research Page
 * Autonomous scientific briefs, kinetic kinematics research, and cryptography analysis.
 */

import React, { useState } from 'react';
import { Search, BookOpen, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';
import { initialResearchBriefs } from '../data/mockData.ts';

export const ResearchPage: React.FC = () => {
  const [briefs, setBriefs] = useState(initialResearchBriefs);
  const [topic, setTopic] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleSynthesize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSynthesizing(true);
    setTimeout(() => {
      const newBrief = {
        id: `res-${Date.now()}`,
        title: topic.trim(),
        source: 'Autonomous Mechanical Synthesis Core',
        confidence: '99.1%',
        summary: `Analysis for "${topic.trim()}" finalized. Hardware registers nominal. Zero telemetry exfiltration verified under sovereign clearance.`,
        timestamp: 'Just now',
        classification: 'RESTRICTED',
      };
      setBriefs([newBrief, ...briefs]);
      setTopic('');
      setIsSynthesizing(false);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              DEEP RESEARCH & SYNTHESIS
            </h2>
            <p className="text-xs text-zinc-400">
              Autonomous kinetic kinematics • Lattice cryptography • High-density vectors
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-400 font-bold uppercase">
          CLASSIFICATION: SOVEREIGN
        </span>
      </div>

      {/* Synthesis Query Bar */}
      <form onSubmit={handleSynthesize} className="my-5 p-2.5 bg-[#08090e] border border-zinc-800 flex gap-2">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Command deep research synthesis (e.g., Kinematic Actuators, Quantum Lattice, Sovereign AI)..."
          className="flex-1 bg-[#030406] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={isSynthesizing || !topic.trim()}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSynthesizing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>SYNTHESIZING...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>ANALYZE</span>
            </>
          )}
        </button>
      </form>

      {/* Briefs */}
      <div className="space-y-4 pb-6">
        {briefs.map((b) => (
          <div
            key={b.id}
            className="p-4 bg-[#08090f] border border-zinc-800 hover:border-red-900/60 rounded-xs transition-colors space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-zinc-100">{b.title}</h3>
              <div className="flex items-center gap-2 text-[10px] shrink-0">
                <span className="px-2 py-0.5 bg-red-950 border border-red-500/50 text-red-400 font-bold uppercase">
                  {b.classification}
                </span>
                <span className="text-zinc-500">{b.timestamp}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">{b.summary}</p>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1 text-red-400">
                <BookOpen className="w-3.5 h-3.5" />
                SOURCE: {b.source}
              </span>
              <span className="text-emerald-400 font-bold">CONFIDENCE: {b.confidence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
