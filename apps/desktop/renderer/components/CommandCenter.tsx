/**
 * Premium AI Command Center Interface (Phase 5 - Section 15 & 16)
 *
 * Design:
 * - Dark futuristic aesthetic with subtle glassmorphism and refined typography
 * - Prominently features the central 3D Avatar with surrounding state aura
 * - Real-time Voice Visualizer reacting to SPEAKING, LISTENING, THINKING, IDLE
 * - Minimalist message input with keyboard, speech-to-text, and audio playback controls
 * - Quick navigation to Chat drawer, Autonomous Tasks, SQLite Memory/Files, and Settings
 * - Full accessibility: reduced-motion support and 3D toggle
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  Layers,
  Settings,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  Activity,
  Maximize2,
  Radio,
} from 'lucide-react';
import { AvatarScene } from '../../../../src/avatar/AvatarScene.tsx';
import { avatarController } from '../../../../src/avatar/AvatarController.ts';
import { avatarSettings } from '../../../../src/avatar/AvatarSettings.ts';
import { avatarEventBus } from '../../../../src/avatar/AvatarEventBus.ts';
import { AvatarState, AvatarSettingsConfig } from '../../../../src/avatar/types.ts';
import { useVoiceEngine } from '../hooks/useVoiceEngine.ts';

interface CommandCenterProps {
  assistantName: string;
  isOnline: boolean;
  isLoading: boolean;
  lastAssistantMessage?: string;
  onSendMessage: (text: string) => void;
  onOpenChat: () => void;
  onOpenTasks: () => void;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  assistantName,
  isOnline,
  isLoading,
  lastAssistantMessage,
  onSendMessage,
  onOpenChat,
  onOpenTasks,
  onOpenMemory,
  onOpenSettings,
}) => {
  const [inputText, setInputText] = useState('');
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [settings, setSettings] = useState<AvatarSettingsConfig>(() => avatarSettings.getSettings());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice Engine hook for STT / TTS
  const {
    voiceState,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceEngine({
    onTranscriptComplete: (text) => {
      if (text.trim()) {
        setInputText(text);
        onSendMessage(text);
        setInputText('');
      }
    },
  });

  // Keep avatar state synchronized with Voice Engine & Assistant loading
  useEffect(() => {
    if (isLoading) {
      avatarController.setState('THINKING');
      setAvatarState('THINKING');
    } else if (voiceState === 'LISTENING') {
      avatarController.setState('LISTENING');
      setAvatarState('LISTENING');
    } else if (voiceState === 'SPEAKING') {
      avatarController.setState('SPEAKING');
      setAvatarState('SPEAKING');
    } else {
      const curr = avatarController.stateManager.getState();
      setAvatarState(curr);
    }
  }, [isLoading, voiceState]);

  // Subscribe to Avatar Event Bus
  useEffect(() => {
    const unsub = avatarEventBus.onAny((event) => {
      if (event.payload?.state) {
        setAvatarState(event.payload.state);
      }
    });
    const unsubSettings = avatarSettings.subscribe(setSettings);
    return () => {
      unsub();
      unsubSettings();
    };
  }, []);

  // Speak assistant response when newly received and not muted
  useEffect(() => {
    if (lastAssistantMessage && !isAudioMuted && !isLoading && voiceState !== 'LISTENING') {
      speak(lastAssistantMessage);
    }
  }, [lastAssistantMessage, isAudioMuted]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    onSendMessage(text);
    setInputText('');
  };

  const toggleMic = () => {
    if (voiceState === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  };

  // State indicator styling
  const getStatusBadge = () => {
    if (isLoading || avatarState === 'THINKING') {
      return {
        label: 'Thinking & Processing',
        color: 'text-purple-400',
        bg: 'bg-purple-950/60 border-purple-800/80',
        dot: 'bg-purple-400 animate-ping',
      };
    }
    if (voiceState === 'LISTENING' || avatarState === 'LISTENING') {
      return {
        label: 'Listening to speech...',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/60 border-emerald-800/80',
        dot: 'bg-emerald-400 animate-pulse',
      };
    }
    if (voiceState === 'SPEAKING' || avatarState === 'SPEAKING') {
      return {
        label: 'Responding & Speaking',
        color: 'text-sky-400',
        bg: 'bg-sky-950/60 border-sky-800/80',
        dot: 'bg-sky-400 animate-pulse',
      };
    }
    if (avatarState === 'ERROR') {
      return {
        label: 'Security Intercept / Alert',
        color: 'text-red-400',
        bg: 'bg-red-950/60 border-red-800/80',
        dot: 'bg-red-400',
      };
    }
    return {
      label: 'Ready & Listening',
      color: 'text-cyan-400',
      bg: 'bg-slate-900/70 border-slate-800/80',
      dot: 'bg-cyan-400',
    };
  };

  const status = getStatusBadge();

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-b from-slate-950 via-[#0b1120] to-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* 1. Subtle Architectural Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* 2. Top Header Bar / AI Status */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-slate-800/70 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="font-mono text-xs font-semibold tracking-wider text-slate-200 uppercase">
            {assistantName} AI SYSTEM
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-slate-400">
            {isOnline ? 'ONLINE CLOUD READY' : 'LOCAL SECURE AIRGAP'}
          </span>
        </div>

        {/* Quick Accessibility & Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? 'Unmute Speech Output' : 'Mute Speech Output'}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              isAudioMuted
                ? 'bg-amber-950/50 border-amber-800 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => avatarSettings.updateSettings({ enabled: !settings.enabled })}
            title={settings.enabled ? 'Pause 3D Avatar (Save Battery)' : 'Enable 3D Avatar'}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              !settings.enabled
                ? 'bg-slate-900 border-slate-700 text-slate-500'
                : 'bg-cyan-950/40 border-cyan-800 text-cyan-300'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            title="System Settings"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Central Stage: Large 3D Avatar & Status Aura */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
        {/* State Capsule Pill */}
        <div className="mb-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono backdrop-blur-md transition-all ${status.bg} ${status.color}`}
          >
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span>{status.label}</span>
          </div>
        </div>

        {/* Central 3D Avatar Viewport */}
        <div className="relative w-full max-w-md h-72 sm:h-84 md:h-96 my-1">
          <AvatarScene className="w-full h-full" />
        </div>

        {/* Dynamic Contextual Prompt / Transcript */}
        <div className="w-full max-w-xl text-center px-4 mt-2">
          {interimTranscript ? (
            <p className="text-sm font-mono text-cyan-300 italic animate-pulse">
              "{interimTranscript}"
            </p>
          ) : lastAssistantMessage ? (
            <p className="text-sm text-slate-300 font-medium line-clamp-2 leading-relaxed bg-slate-900/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800/60 shadow-sm">
              "{lastAssistantMessage}"
            </p>
          ) : (
            <h2 className="text-base sm:text-lg font-medium text-slate-200 tracking-wide">
              "How can I help you today?"
            </h2>
          )}
        </div>

        {/* 4. Glassmorphism Message Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl mt-5 px-3"
        >
          <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 hover:border-cyan-500/60 focus-within:border-cyan-500 rounded-2xl p-1.5 shadow-xl transition-all">
            {/* Microphone STT Toggle */}
            <button
              type="button"
              onClick={toggleMic}
              title={voiceState === 'LISTENING' ? 'Stop Listening' : 'Start Voice Input'}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                voiceState === 'LISTENING'
                  ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
            >
              {voiceState === 'LISTENING' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message or ask anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                inputText.trim() && !isLoading
                  ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md font-semibold'
                  : 'text-slate-600 bg-slate-800/40 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => onSendMessage('What can you do?')}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              type="button"
              onClick={() => onSendMessage('Check system status and security invariants')}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
            >
              System Health
            </button>
            <button
              type="button"
              onClick={() => onSendMessage('Tell me a quick motivating thought')}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
            >
              Daily Focus
            </button>
          </div>
        </form>
      </main>

      {/* 5. Bottom Navigation Bar: Chat | Tasks | Files | Settings */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-around text-xs font-mono">
          <button
            onClick={onOpenChat}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors py-1 px-3 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>Chat</span>
          </button>

          <button
            onClick={onOpenTasks}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors py-1 px-3 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Tasks</span>
          </button>

          <button
            onClick={onOpenMemory}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors py-1 px-3 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Files & Memory</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors py-1 px-3 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
