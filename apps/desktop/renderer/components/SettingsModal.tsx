/**
 * Settings Modal Component
 * Allows user to configure AI provider, connection status, memory settings,
 * and view privacy policies and version information.
 */

import React, { useState, useEffect } from 'react';
import { X, Sliders, Shield, Database, Cpu, Wifi, Check, AlertCircle, RefreshCw, Trash2, Mic, Bell, User, Sparkles } from 'lucide-react';
import { AppConfig, SystemStatus, MemoryItem } from '../types/index.ts';
import { apiService } from '../services/api.ts';
import { avatarSettings } from '../../../../src/avatar/AvatarSettings.ts';
import type { AvatarQuality, AvatarSettingsConfig } from '../../../../src/avatar/types.ts';

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
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'voice' | 'notifications' | 'avatar' | 'privacy' | 'memory'>('general');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarSettingsConfig>(() => avatarSettings.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Notification simulation tester state
  const [testNotifApp, setTestNotifApp] = useState('Bank');
  const [testNotifTitle, setTestNotifTitle] = useState('Security Alert');
  const [testNotifContent, setTestNotifContent] = useState('Your OTP is 483921');
  const [testNotifResult, setTestNotifResult] = useState<any>(null);
  const [testingNotif, setTestingNotif] = useState(false);

  const handleTestNotification = async () => {
    setTestingNotif(true);
    try {
      const res = await apiService.processNotification({
        appName: testNotifApp,
        title: testNotifTitle,
        content: testNotifContent,
      });
      setTestNotifResult(res);
    } catch (err: any) {
      setTestNotifResult({ error: err.message });
    } finally {
      setTestingNotif(false);
    }
  };

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
      avatarSettings.updateSettings(avatarConfig);
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
            onClick={() => setActiveTab('voice')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'voice'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Voice Engine
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'avatar'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            3D Avatar
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

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200 text-xs">Enable Voice Engine</div>
                  <div className="text-[11px] text-slate-400">Microphone input (STT) and voice speech synthesis (TTS).</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.voice?.enabled ?? true}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      voice: {
                        ...(config.voice || {
                          enabled: true,
                          auto_speak: false,
                          preferred_language: 'auto',
                          voice_id: '21m00Tcm4TlvDq8ikWAM',
                          speech_rate: 1.0,
                          speech_volume: 1.0,
                          interrupt_speech: true,
                          stt_provider: 'system',
                          tts_provider: 'elevenlabs',
                        }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200 text-xs">Auto Speak Responses</div>
                  <div className="text-[11px] text-slate-400">Automatically read aloud answers generated by JARVIS.</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.voice?.auto_speak ?? false}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      voice: {
                        ...(config.voice || {
                          enabled: true,
                          auto_speak: false,
                          preferred_language: 'auto',
                          voice_id: '21m00Tcm4TlvDq8ikWAM',
                          speech_rate: 1.0,
                          speech_volume: 1.0,
                          interrupt_speech: true,
                          stt_provider: 'system',
                          tts_provider: 'elevenlabs',
                        }),
                        auto_speak: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200 text-xs">Interrupt Speech (Barge-in)</div>
                  <div className="text-[11px] text-slate-400">Immediately stops speech when you speak into the microphone.</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.voice?.interrupt_speech ?? true}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      voice: {
                        ...(config.voice || {
                          enabled: true,
                          auto_speak: false,
                          preferred_language: 'auto',
                          voice_id: '21m00Tcm4TlvDq8ikWAM',
                          speech_rate: 1.0,
                          speech_volume: 1.0,
                          interrupt_speech: true,
                          stt_provider: 'system',
                          tts_provider: 'elevenlabs',
                        }),
                        interrupt_speech: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              {/* TTS Provider Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  TTS Provider
                </label>
                <select
                  value={config.voice?.tts_provider || 'elevenlabs'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      voice: {
                        ...(config.voice || {
                          enabled: true,
                          auto_speak: false,
                          preferred_language: 'auto',
                          voice_id: '21m00Tcm4TlvDq8ikWAM',
                          speech_rate: 1.0,
                          speech_volume: 1.0,
                          interrupt_speech: true,
                          stt_provider: 'system',
                          tts_provider: 'elevenlabs',
                        }),
                        tts_provider: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="elevenlabs">ElevenLabs (Primary with Local Fallback)</option>
                  <option value="system">Local / System Speech Synthesis</option>
                  <option value="mock">Mock Speech (Testing / Sandbox)</option>
                </select>
                <div className="text-[11px] text-slate-400 mt-1">
                  Fail-safe TTS Router: Automatically falls back to Local/System TTS if ElevenLabs is unavailable, quota exceeded, or offline.
                </div>
              </div>

              {/* Voice Configuration (Voice ID) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Voice (Voice ID)
                </label>
                <input
                  type="text"
                  value={config.voice?.voice_id || '21m00Tcm4TlvDq8ikWAM'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      voice: {
                        ...(config.voice || {
                          enabled: true,
                          auto_speak: false,
                          preferred_language: 'auto',
                          voice_id: '21m00Tcm4TlvDq8ikWAM',
                          speech_rate: 1.0,
                          speech_volume: 1.0,
                          interrupt_speech: true,
                          stt_provider: 'system',
                          tts_provider: 'elevenlabs',
                        }),
                        voice_id: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. 21m00Tcm4TlvDq8ikWAM or custom ElevenLabs voice ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        voice: { ...(config.voice as any), voice_id: '21m00Tcm4TlvDq8ikWAM' },
                      })
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Rachel (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        voice: { ...(config.voice as any), voice_id: 'EXAVITQu4vr4xnSDxMaL' },
                      })
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Bella (Multilingual)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        voice: { ...(config.voice as any), voice_id: 'custom_elevenlabs_hindi' },
                      })
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Hindi / Indian Voice
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Preferred Speech Language
                </label>
                <select
                  value={config.voice?.preferred_language || 'auto'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      voice: {
                        ...(config.voice || {
                          enabled: true,
                          auto_speak: false,
                          preferred_language: 'auto',
                          voice_id: '21m00Tcm4TlvDq8ikWAM',
                          speech_rate: 1.0,
                          speech_volume: 1.0,
                          interrupt_speech: true,
                          stt_provider: 'system',
                          tts_provider: 'elevenlabs',
                        }),
                        preferred_language: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="auto">Auto Detect (Hindi / Hinglish / English)</option>
                  <option value="hi-IN">Hindi (hi-IN) - Devanagari Preserved</option>
                  <option value="en-IN">Indian English (en-IN)</option>
                  <option value="en-US">US English (en-US)</option>
                </select>
              </div>

              {/* Speech Speed (Rate) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Speech Speed ({config.voice?.speech_rate ?? 1.0}x)</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.voice?.speech_rate ?? 1.0}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      voice: {
                        ...(config.voice || {
                          enabled: true,
                          auto_speak: false,
                          preferred_language: 'auto',
                          voice_id: '21m00Tcm4TlvDq8ikWAM',
                          speech_rate: 1.0,
                          speech_volume: 1.0,
                          interrupt_speech: true,
                          stt_provider: 'system',
                          tts_provider: 'elevenlabs',
                        }),
                        speech_rate: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Volume */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Volume ({Math.round((config.voice?.speech_volume ?? 1.0) * 100)}%)</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={config.voice?.speech_volume ?? 1.0}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      voice: {
                        ...(config.voice || {
                          enabled: true,
                          auto_speak: false,
                          preferred_language: 'auto',
                          voice_id: '21m00Tcm4TlvDq8ikWAM',
                          speech_rate: 1.0,
                          speech_volume: 1.0,
                          interrupt_speech: true,
                          stt_provider: 'system',
                          tts_provider: 'elevenlabs',
                        }),
                        speech_volume: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-xl text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-cyan-400">Deterministic Voice Privacy Safeguard</div>
                <p className="text-[11px] text-slate-400">
                  Microphone audio is ephemeral: it is processed strictly in temporary memory and never written to disk or recorded.
                  All transcribed speech passes through the Phase 2 Privacy Filter. OTPs, passwords, and sensitive credentials are
                  masked, and the TTS engine will never pronounce private secrets out loud.
                </p>
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

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      Notification Intelligence
                    </h3>
                    <p className="text-xs text-slate-400">
                      Evaluates incoming OS and app notifications for importance, priority, and privacy.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notification?.enabled ?? true}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notification: {
                            ...(config.notification || ({} as any)),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                <div className="border-t border-slate-800/80 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-200">Read Important Notifications Aloud</span>
                      <p className="text-[11px] text-slate-400">Speaks calendar reminders, priority apps, and urgent alerts.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.notification?.read_important_notifications ?? true}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notification: {
                            ...(config.notification || ({} as any)),
                            read_important_notifications: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-200">Read Normal Notifications Aloud</span>
                      <p className="text-[11px] text-slate-400">Speaks standard personal chat messages (disabled by default).</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.notification?.read_normal_notifications ?? false}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notification: {
                            ...(config.notification || ({} as any)),
                            read_normal_notifications: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-red-950/20 border border-red-900/40 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-red-300">Sensitive Notifications Protection</span>
                        <p className="text-[11px] text-red-400/80">
                          OTPs, passwords, PINs, CVVs, and security codes are strictly blocked from speech, logs, and external AI.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-900/50 text-red-200 border border-red-800">
                      Always Blocked (Non-Bypassable)
                    </span>
                  </div>
                </div>
              </div>

              {/* Priorities & Quiet Hours */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Priority Routing & Schedules</h4>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority Apps (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(config.notification?.priority_apps || []).join(', ')}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        notification: {
                          ...(config.notification || ({} as any)),
                          priority_apps: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="calendar, slack, work, emergency"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority Contacts (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(config.notification?.priority_contacts || []).join(', ')}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        notification: {
                          ...(config.notification || ({} as any)),
                          priority_contacts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="boss, manager, mom, doctor"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Quiet Hours</label>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          notification: {
                            ...(config.notification || ({} as any)),
                            quiet_hours_enabled: !(config.notification?.quiet_hours_enabled ?? true),
                          },
                        })
                      }
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        config.notification?.quiet_hours_enabled ?? true
                          ? 'bg-cyan-950/40 border-cyan-700 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {config.notification?.quiet_hours_enabled ?? true ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Start (24h)</label>
                    <input
                      type="text"
                      value={config.notification?.quiet_hours_start || '22:00'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notification: {
                            ...(config.notification || ({} as any)),
                            quiet_hours_start: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">End (24h)</label>
                    <input
                      type="text"
                      value={config.notification?.quiet_hours_end || '07:00'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notification: {
                            ...(config.notification || ({} as any)),
                            quiet_hours_end: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Simulator Tester */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Live Notification Privacy Shield Sandbox
                </h4>
                <p className="text-[11px] text-slate-400">
                  Simulate an incoming notification to inspect the deterministic privacy filter and importance classifier.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">App Identifier</label>
                    <input
                      type="text"
                      value={testNotifApp}
                      onChange={(e) => setTestNotifApp(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Title</label>
                    <input
                      type="text"
                      value={testNotifTitle}
                      onChange={(e) => setTestNotifTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Notification Body Content</label>
                  <input
                    type="text"
                    value={testNotifContent}
                    onChange={(e) => setTestNotifContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={testingNotif}
                    className="px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {testingNotif ? 'Evaluating...' : 'Test Ingestion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestNotifApp('Bank');
                      setTestNotifTitle('Security Alert');
                      setTestNotifContent('Your OTP is 483921');
                      setTestNotifResult(null);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    Preset: OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestNotifApp('Calendar');
                      setTestNotifTitle('Reminder');
                      setTestNotifContent('Project meeting at 5 PM');
                      setTestNotifResult(null);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    Preset: Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestNotifApp('WhatsApp');
                      setTestNotifTitle('Rahul');
                      setTestNotifContent('Kal college aa raha hai?');
                      setTestNotifResult(null);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    Preset: WhatsApp
                  </button>
                </div>

                {testNotifResult && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Classification:</span>
                      <span className={`font-bold ${testNotifResult.classification === 'OTP' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {testNotifResult.classification}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Action:</span>
                      <span className={`font-bold ${testNotifResult.action === 'BLOCK' ? 'text-red-400' : 'text-cyan-400'}`}>
                        {testNotifResult.action}
                      </span>
                      <span className="text-slate-500 font-sans text-[11px]">| Importance: {testNotifResult.importance}</span>
                    </div>
                    <div className="text-slate-400">
                      Reason: <span className="text-slate-200 font-sans">{testNotifResult.reason}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex gap-3">
                      <span>Gemini Calls: {testNotifResult.geminiCalled ? '1' : '0'}</span>
                      <span>TTS Calls: {testNotifResult.ttsCalled ? '1' : '0'}</span>
                      <span>Memory Writes: {testNotifResult.memoryWritten ? '1' : '0'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      3D AI Digital Human Avatar
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time interactive 3D humanoid avatar with procedural animations and facial expressions.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avatarConfig.enabled}
                      onChange={(e) =>
                        setAvatarConfig({ ...avatarConfig, enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                <div className="border-t border-slate-800/80 pt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Custom 3D Model Path (GLB / GLTF)
                    </label>
                    <input
                      type="text"
                      value={avatarConfig.modelPath || ''}
                      onChange={(e) =>
                        setAvatarConfig({ ...avatarConfig, modelPath: e.target.value })
                      }
                      placeholder="/models/avatar.glb (Leave empty for procedural digital human)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Supports standard humanoid GLB/GLTF models with morph targets or bones.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Rendering Quality
                      </label>
                      <select
                        value={avatarConfig.quality}
                        onChange={(e) =>
                          setAvatarConfig({
                            ...avatarConfig,
                            quality: e.target.value as AvatarQuality,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="LOW">Low (Battery Saver, 30fps throttle)</option>
                        <option value="MEDIUM">Medium (Balanced, 45fps throttle)</option>
                        <option value="HIGH">High (Full 60fps & Smooth Shading)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Avatar Scale: {avatarConfig.scale.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={avatarConfig.scale}
                        onChange={(e) =>
                          setAvatarConfig({
                            ...avatarConfig,
                            scale: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-500 mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavior & Animation Switches */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Natural Animation Subsystems
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={avatarConfig.animationEnabled}
                      onChange={(e) =>
                        setAvatarConfig({ ...avatarConfig, animationEnabled: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Idle Breathing & Sway</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={avatarConfig.naturalBlinkingEnabled}
                      onChange={(e) =>
                        setAvatarConfig({ ...avatarConfig, naturalBlinkingEnabled: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Natural Eye Blinking</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={avatarConfig.eyeMovementEnabled}
                      onChange={(e) =>
                        setAvatarConfig({ ...avatarConfig, eyeMovementEnabled: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Eye Saccades & Tracking</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={avatarConfig.lipSyncEnabled}
                      onChange={(e) =>
                        setAvatarConfig({ ...avatarConfig, lipSyncEnabled: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Real-time Lip-Sync</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={avatarConfig.gesturesEnabled}
                      onChange={(e) =>
                        setAvatarConfig({ ...avatarConfig, gesturesEnabled: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Head Gestures & Nods</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={avatarConfig.emotionReactionsEnabled}
                      onChange={(e) =>
                        setAvatarConfig({
                          ...avatarConfig,
                          emotionReactionsEnabled: e.target.checked,
                        })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Emotion Reactions</span>
                  </label>
                </div>
              </div>

              {/* Accessibility */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-200">Reduced Motion Mode</span>
                    <p className="text-[11px] text-slate-400">
                      Disables camera movements and dampens rapid oscillations for vestibular comfort.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={avatarConfig.reducedMotion}
                    onChange={(e) =>
                      setAvatarConfig({ ...avatarConfig, reducedMotion: e.target.checked })
                    }
                    className="accent-cyan-500 rounded"
                  />
                </div>
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
