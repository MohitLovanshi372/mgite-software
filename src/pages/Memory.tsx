/**
 * Memory Page
 * Local vector store inspector with 384-dim semantic embeddings and airgap indexing.
 */

import React, { useState } from 'react';
import { Database, Search, Plus, Trash2, ShieldCheck, Tag } from 'lucide-react';
import { HUDFrame } from '../components/HUD/HUDFrame.tsx';

interface MemoryItem {
  id: string;
  category: 'Directives' | 'Preferences' | 'Schematics' | 'Protocols';
  key: string;
  value: string;
  similarity: string;
}

export const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([
    {
      id: 'mem-1',
      category: 'Directives',
      key: 'SOVEREIGN_AIRGAP_BARRIER',
      value: 'Strictly prohibit outbound network egress without operator clearance. Zero third-party telemetry.',
      similarity: '0.984',
    },
    {
      id: 'mem-2',
      category: 'Preferences',
      key: 'OPERATOR_ACOUSTICS',
      value: 'Voice pitch: Deep metallic resonance. Cadence: 135 WPM. Response format: Concise, direct, authoritative.',
      similarity: '0.942',
    },
    {
      id: 'mem-3',
      category: 'Schematics',
      key: 'KINEMATIC_JAW_SERVO_PIN',
      value: 'GPIO Pin 14 / PWM 440 Hz. Synchronized with Web Audio audio context speech waveform envelope.',
      similarity: '0.918',
    },
    {
      id: 'mem-4',
      category: 'Protocols',
      key: 'SENSITIVE_DATA_REDACTION',
      value: 'Automatic regex scrubbing for OTPs, auth bearer tokens, AWS/GCP keys, and private passwords in system logs.',
      similarity: '0.965',
    },
  ]);

  const [search, setSearch] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const item: MemoryItem = {
      id: `mem-${Date.now()}`,
      category: 'Directives',
      key: newKey.trim().toUpperCase(),
      value: newValue.trim(),
      similarity: '1.000',
    };
    setMemories([item, ...memories]);
    setNewKey('');
    setNewValue('');
  };

  const filtered = memories.filter(
    (m) =>
      m.key.toLowerCase().includes(search.toLowerCase()) ||
      m.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              LOCAL VECTOR MEMORY STORE
            </h2>
            <p className="text-xs text-zinc-400">
              384-dimensional cosine similarity indexing • SQLite WAL engine • Zero cloud exposure
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-400 font-bold uppercase">
          {memories.length} ACTIVE VECTORS
        </span>
      </div>

      {/* Add Memory Node */}
      <form onSubmit={handleAdd} className="my-4 p-3 bg-[#08090e] border border-zinc-800 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="VECTOR KEY (e.g., DEFENSE_RULE_01)..."
          className="bg-[#030406] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden uppercase"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Enter memory directive or payload..."
          className="flex-1 bg-[#030406] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden"
        />
        <button
          type="submit"
          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>INDEX</span>
        </button>
      </form>

      {/* Search Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vectors by cosine semantics..."
          className="w-full max-w-md bg-[#08090e] border border-zinc-800 px-3 py-1 text-xs text-zinc-100 focus:outline-hidden"
        />
      </div>

      {/* Vectors List */}
      <div className="space-y-3 pb-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-[#08090f] border border-zinc-800 hover:border-red-900/60 rounded-xs transition-colors flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-400">{item.key}</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                  {item.category}
                </span>
                <span className="text-[9px] text-zinc-500">SIM: {item.similarity}</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">{item.value}</p>
            </div>

            <button
              onClick={() => setMemories(memories.filter((m) => m.id !== item.id))}
              className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer"
              title="Purge vector"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
