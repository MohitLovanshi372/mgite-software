/**
 * SQLite Memory Inspector Component
 * Displays stored selective long-term memory items with sensitivity levels.
 * Allows adding, deleting, and auditing SQLite memory.
 */

import React, { useState, useEffect } from 'react';
import { X, Database, Plus, Trash2, Tag, Shield, RefreshCw } from 'lucide-react';
import { MemoryItem, SensitivityLevel } from '../types/index.ts';
import { apiService } from '../services/api.ts';

interface MemoryInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newSensitivity, setNewSensitivity] = useState<SensitivityLevel>('NORMAL');

  const loadMemory = async () => {
    setLoading(true);
    try {
      const data = await apiService.listMemory();
      setItems(data);
    } catch (e) {
      console.error('Failed to load memory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadMemory();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    try {
      await apiService.createMemory(newKey.trim(), newValue.trim(), newCategory.trim(), newSensitivity);
      setNewKey('');
      setNewValue('');
      setShowAddForm(false);
      loadMemory();
    } catch (e) {
      console.error('Failed to store memory item:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteMemory(id);
      loadMemory();
    } catch (e) {
      console.error('Failed to delete memory item:', e);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all stored memories? Conversation history will not be deleted.')) {
      try {
        await apiService.clearMemories();
        loadMemory();
      } catch (e) {
        console.error('Failed to clear memories:', e);
      }
    }
  };

  const getSensitivityBadge = (sens: SensitivityLevel) => {
    switch (sens) {
      case 'PUBLIC':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'NORMAL':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'PRIVATE':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'SENSITIVE':
        return 'bg-red-950/80 text-red-300 border-red-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        id="memory-inspector-modal"
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">Local SQLite Memory Inspector</h2>
              <span className="text-[11px] text-slate-400">
                Selective long-term facts stored in local SQLite database (assistant.db)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadMemory}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
              title="Refresh SQLite items"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {items.length} selective memory items stored
          </span>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-red-400 hover:text-red-300 border border-red-900/50 rounded-lg hover:bg-red-950/30 transition-colors font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/30 transition-colors font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel' : 'Add Memory Item'}</span>
            </button>
          </div>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-4 border-b border-slate-800 bg-slate-950/70 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Key / Subject</label>
                <input
                  type="text"
                  placeholder="e.g. user_name or preferred_ide"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. preferences, bio, project"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Sensitivity Policy</label>
                <select
                  value={newSensitivity}
                  onChange={(e) => setNewSensitivity(e.target.value as SensitivityLevel)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="SENSITIVE">SENSITIVE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Value / Fact</label>
              <textarea
                rows={2}
                placeholder="e.g. User is a senior developer working on a personal desktop assistant."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 resize-none"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-600 text-white rounded-md text-xs font-semibold hover:bg-cyan-500 cursor-pointer"
              >
                Store in SQLite
              </button>
            </div>
          </form>
        )}

        {/* Memory List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No memory items found. Add one above or let JARVIS remember context selectively.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3 group hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-cyan-300 font-mono">{item.key}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                      {item.type || 'PREFERENCE'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-mono ${getSensitivityBadge(
                        item.sensitivity
                      )}`}
                    >
                      {item.sensitivity}
                    </span>
                    {item.source && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                        {item.source}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed break-words">
                    {item.content || item.value}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Updated: {new Date(item.updated_at).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 rounded transition-opacity"
                  title="Delete memory item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
