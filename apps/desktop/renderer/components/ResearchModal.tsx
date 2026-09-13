/**
 * JARVIS Research Intelligence Modal
 * Provides deep research topic queries, knowledge synthesis, and web intelligence briefings.
 */

import React, { useState } from 'react';
import { X, Globe, Search, Sparkles, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteResearch?: (query: string) => void;
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  onExecuteResearch,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [history] = useState([
    {
      id: '1',
      topic: 'Neural Network Quantization Techniques for Edge Devices',
      date: 'Today',
      summary: 'Analysis of INT8 vs FP4 weights reduction with minimal loss on small language models.',
    },
    {
      id: '2',
      topic: 'Local-First Vector Database Architectures with SQLite VSS',
      date: 'Yesterday',
      summary: 'Benchmarking cosine similarity retrieval in airgapped environments without external cloud dependencies.',
    },
    {
      id: '3',
      topic: 'Voice Synthesis Latency Optimization with Web Audio API',
      date: '2 days ago',
      summary: 'Zero-latency streaming PCM buffer playback for real-time natural language interaction.',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (onExecuteResearch) {
      onExecuteResearch(`Perform deep web research on: ${query.trim()}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#06080e] border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col max-h-[85vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
                RESEARCH INTELLIGENCE
              </h2>
              <p className="text-xs text-slate-400">Autonomous web research, citations & knowledge extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {/* Query input form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              NEW RESEARCH QUERY
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter research topic, technology, or question..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Investigate</span>
              </button>
            </div>
          </form>

          {/* Past research briefings */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                RECENT SYNTHESIZED BRIEFS
              </span>
              <span className="text-xs font-mono text-slate-500">3 Saved</span>
            </div>

            <div className="space-y-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-semibold text-cyan-300">{item.topic}</h4>
                    <span className="text-[10px] font-mono text-slate-500">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
                  {onExecuteResearch && (
                    <button
                      onClick={() => {
                        onExecuteResearch(`Provide further deep dive on: ${item.topic}`);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline pt-1 cursor-pointer"
                    >
                      <span>Deepen Inquiry</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>COGNITIVE SYNTHESIS ENGINE</span>
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
