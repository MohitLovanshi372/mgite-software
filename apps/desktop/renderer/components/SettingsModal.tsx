/**
 * Settings Modal Component
 * Allows user to configure AI provider, connection status, memory settings,
 * and view privacy policies and version information.
 */

import React, { useState, useEffect } from 'react';
import { X, Sliders, Shield, Database, Cpu, Wifi, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { AppConfig, SystemStatus, MemoryItem } from '../types/index.ts';
import { apiService } from '../services/api.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: SystemStatus | null;
  onConfigChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  systemStatus,
  onConfigChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'privacy' | 'memory'>('general');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  const loadMemories = async () => {
    setLoadingMemories(true);
    try {
      const data = await apiService.listMemory();
      setMemories(data);
    } catch (e) {
      console.error('Failed to load memories:', e);
    } finally {
      setLoadingMemories(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      apiService.getConfig().then(setConfig).catch(console.error);
      if (activeTab === 'memory') {
        loadMemories();
      }
    }
  }, [isOpen, activeTab]);

  const handleDeleteMemory = async (id: string) => {
    try {
      await apiService.deleteMemory(id);
      await loadMemories();
      onConfigChanged();
    } catch (e) {
      console.error('Failed to delete memory:', e);
    }
  };

  const handleClearAllMemories = async () => {
    if (window.confirm('Are you sure you want to clear all stored memories? Your conversation chat history will remain intact.')) {
      try {
        await apiService.clearMemories();
        await loadMemories();
        onConfigChanged();
      } catch (e) {
        console.error('Failed to clear memories:', e);
      }
    }
  };

  if (!isOpen || !config) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.updateConfig(config);
      setSavedSuccess(true);
      onConfigChanged();
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        id="settings-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100">Settings & Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ai'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Service Layer
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy & Security
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'memory'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Memory & SQLite
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assistant Name
                </label>
                <input
                  type="text"
                  value={config.assistant_name}
                  onChange={(e) => setConfig({ ...config, assistant_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Preferred Language Mode
                </label>
                <select
                  value={config.preferred_language}
                  onChange={(e) => setConfig({ ...config, preferred_language: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                >
                  <option value="multilingual">Multilingual (English, Hindi, Hinglish)</option>
                  <option value="en">English Only</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Phase 1 Foundation Information:</div>
                <div>Application Version: <span className="text-cyan-400 font-mono">v{config.version}</span></div>
                <div>Architecture: <span className="text-slate-300">Modular Orchestrator + SQLite Memory</span></div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Configured Cloud AI Model
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder="e.g. gemini-2.5-flash"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Server-side Gemini model identifier. Change dynamically without restarting.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Max Context Window Messages ({config.max_context_messages || 20})
                </label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={config.max_context_messages || 20}
                  onChange={(e) => setConfig({ ...config, max_context_messages: parseInt(e.target.value, 10) || 20 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Recent conversation messages retained in short-term context for reference resolution.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Temperature ({config.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-medium text-slate-200 text-xs block">Enforce Offline Mode</span>
                  <span className="text-[11px] text-slate-400">
                    Skips cloud AI calls entirely and uses the local SQLite engine.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.offline_mode}
                  onChange={(e) => setConfig({ ...config, offline_mode: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-slate-300">Cloud AI Health Check:</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${systemStatus?.cloud_ai_available ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-slate-300">
                    {systemStatus?.cloud_ai_available
                      ? 'Server-side Gemini connection available'
                      : 'GEMINI_API_KEY unconfigured or network offline (safe fallback active)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Privacy First Guarantees</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>No secrets or credentials in frontend code.</li>
                  <li>No API keys in structured log files.</li>
                  <li>External content and responses strictly sanitized.</li>
                  <li>Arbitrary OS shell execution is strictly prohibited.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-200">Sensitive Data & OTP Shield:</div>
                <p className="text-slate-400 leading-relaxed">
                  The system actively scans prompts and incoming notifications for OTPs, CVVs, PINs, and passwords. When detected, execution immediately terminates to protect authentication credentials.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-medium text-slate-200 block">Redact Sensitive Inputs</span>
                  <span className="text-slate-400">Mask credentials before writing to conversation storage</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.security.redact_sensitive_inputs}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, redact_sensitive_inputs: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>SQLite Database Status</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Type: <span className="font-mono text-cyan-400">SQLite (Local)</span></div>
                  <div>Conversations: <span className="font-mono text-slate-200">{systemStatus?.database.conversations ?? 0}</span></div>
                  <div>Memory Items: <span className="font-mono text-slate-200">{systemStatus?.database.memory_items ?? systemStatus?.database.memoryItems ?? 0}</span></div>
                  <div>Storage Location: <span className="font-mono text-slate-400 text-[10px]">data/assistant.db</span></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-medium text-slate-200 block">Enable Memory Engine</span>
                  <span className="text-slate-400">Inject selective memory items into assistant prompts</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.memory.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      memory: { ...config.memory, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Default Sensitivity for New Memory Items
                </label>
                <select
                  value={config.memory.default_sensitivity}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      memory: { ...config.memory, default_sensitivity: e.target.value as any },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs"
                >
                  <option value="PUBLIC">PUBLIC (Safe for general context)</option>
                  <option value="NORMAL">NORMAL (Standard assistant memory)</option>
                  <option value="PRIVATE">PRIVATE (Restricted access)</option>
                  <option value="SENSITIVE">SENSITIVE (Highest confidentiality)</option>
                </select>
              </div>

              {/* Recent Memories & Actions */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Saved Memories ({memories.length})
                  </span>
                  {memories.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllMemories}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-0.5 rounded border border-red-900/50 hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {loadingMemories ? (
                  <div className="text-center py-4 text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading memories...</span>
                  </div>
                ) : memories.length === 0 ? (
                  <div className="text-center py-3 text-slate-500 text-xs">
                    No memories saved yet. Try saying: <span className="text-cyan-400 italic">"Yaad rakhna mujhe simple Hinglish mein explain karna."</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {memories.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 p-2 rounded-md bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                              {item.type || 'PREFERENCE'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.category}
                            </span>
                            <span className={`text-[9px] px-1 rounded ${
                              item.sensitivity === 'PUBLIC' ? 'text-emerald-400' :
                              item.sensitivity === 'PRIVATE' ? 'text-amber-400' :
                              item.sensitivity === 'SENSITIVE' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {item.sensitivity}
                            </span>
                          </div>
                          <p className="text-slate-200 text-xs break-words">
                            {item.content || item.value}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMemory(item.id)}
                          title="Delete this memory"
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            {savedSuccess && (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Settings saved successfully</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-settings"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer shadow-md shadow-cyan-900/20"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
