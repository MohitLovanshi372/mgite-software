/**
 * JARVIS Bottom Command Bar Component
 *
 * Implements:
 * - Large premium command bar ("Ask JARVIS anything...")
 * - Microphone button with active listening aura
 * - Real-time voice activity waveform indicator
 * - Paperclip attachment button
 * - Futuristic Send button
 * - Keyboard shortcut hints
 * - Quick action chips BELOW command bar:
 *   News, Tasks, Research, Open App, Music, Summarize, System, More
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Paperclip,
  Newspaper,
  CheckSquare,
  Globe,
  Grid,
  Music,
  FileText,
  Terminal,
  MoreHorizontal,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer.tsx';

interface BottomCommandBarProps {
  onSendMessage: (text: string) => void;
  onToggleVoice: () => void;
  isListening: boolean;
  voiceState: string;
  isLoading: boolean;
  assistantName?: string;
  onOpenAttachment?: () => void;
}

export const BottomCommandBar: React.FC<BottomCommandBarProps> = ({
  onSendMessage,
  onToggleVoice,
  isListening,
  voiceState,
  isLoading,
  assistantName = 'JARVIS',
  onOpenAttachment,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus shortcut Ctrl+K / Cmd+K and Esc to stop listening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && isListening) {
        onToggleVoice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, onToggleVoice]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    let message = inputText.trim();
    if (attachedFileName) {
      message = `[Attached: ${attachedFileName}] ${message}`;
    }
    onSendMessage(message);
    setInputText('');
    setAttachedFileName(null);
  };

  const handleQuickAction = (promptText: string) => {
    if (isLoading) return;
    onSendMessage(promptText);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
    }
  };

  // 8 Quick Action chips strictly matching specification:
  // News, Tasks, Research, Open App, Music, Summarize, System, More
  const quickActions = [
    {
      id: 'news',
      label: 'News',
      icon: Newspaper,
      prompt: 'Provide a concise morning intelligence briefing on the latest technology and AI developments.',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      prompt: 'Review my active tasks, pending priorities, and upcoming deadlines.',
    },
    {
      id: 'research',
      label: 'Research',
      icon: Globe,
      prompt: 'Perform deep research synthesis on latest breakthroughs in quantum computing and machine learning.',
    },
    {
      id: 'open_app',
      label: 'Open App',
      icon: Grid,
      prompt: 'List available computer control integrations, system apps, and connected developer tools.',
    },
    {
      id: 'music',
      label: 'Music',
      icon: Music,
      prompt: 'Initiate ambient focus audio frequency stream for deep work.',
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: FileText,
      prompt: 'Summarize recent conversation highlights, findings, and actionable steps.',
    },
    {
      id: 'system',
      label: 'System',
      icon: Terminal,
      prompt: 'Run complete system diagnostic check, SQLite integrity verification, and invariant audit.',
    },
  ];

  const moreActions = [
    {
      id: 'vector_search',
      label: 'Vector Memory Search',
      prompt: 'Query long-term SQLite vector database for recent project architectures and decisions.',
    },
    {
      id: 'privacy_audit',
      label: 'Privacy Audit',
      prompt: 'Perform privacy and invariant security audit across all local storage modules.',
    },
    {
      id: 'voice_recalibrate',
      label: 'Recalibrate Acoustic Sensor',
      prompt: 'Recalibrate audio microphone input levels and acoustic background suppression.',
    },
  ];

  return (
    <div
      id="jarvis-bottom-command-bar"
      className="relative z-30 w-full bg-[#06080e]/95 backdrop-blur-2xl border-t border-cyan-500/15 p-3 sm:p-4 select-none"
    >
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Acoustic Sensor Active Indicator Banner */}
        {isListening && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold tracking-wider text-emerald-300">
                ACOUSTIC SENSOR STREAM ACTIVE:
              </span>
              <span className="text-emerald-400/80 hidden sm:inline">
                Listening to microphone input in real time
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleVoice}
              className="text-[11px] text-emerald-400 hover:text-emerald-200 underline cursor-pointer font-mono"
            >
              Stop [Esc]
            </button>
          </div>
        )}

        {/* Attachment Pill if a file is staged */}
        {attachedFileName && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono w-fit">
            <Paperclip className="w-3 h-3 text-cyan-400" />
            <span className="truncate max-w-xs">{attachedFileName}</span>
            <button
              onClick={() => setAttachedFileName(null)}
              className="p-0.5 text-slate-400 hover:text-red-400 cursor-pointer ml-1"
              title="Remove attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 1. Large Premium Command Bar */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-900/80 border border-cyan-500/25 focus-within:border-cyan-400 focus-within:shadow-[0_0_24px_rgba(6,182,212,0.25)] transition-all"
        >
          {/* Reactive Microphone Button */}
          <button
            type="button"
            onClick={onToggleVoice}
            disabled={isLoading}
            aria-label={isListening ? 'Stop Listening' : 'Start Voice Input'}
            title={isListening ? 'Acoustic Sensor Active (Click to Stop)' : 'Activate Voice (Microphone)'}
            className={`relative p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.5)] animate-pulse'
                : 'bg-slate-800/80 text-slate-300 hover:text-cyan-300 hover:bg-slate-700/80 border border-slate-700/80'
            }`}
          >
            {isListening && (
              <span className="absolute -inset-1 rounded-xl bg-emerald-400/30 animate-ping pointer-events-none" />
            )}
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Voice Activity Waveform Indicator */}
          <AudioWaveformVisualizer
            isListening={isListening}
            voiceState={voiceState}
            isLoading={isLoading}
            height={32}
            showControls={true}
            className="shrink-0"
          />

          {/* Hidden File Input for Attachment */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Main Input Text Field: "Ask JARVIS anything..." */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask ${assistantName} anything...`}
              disabled={isLoading}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 font-sans text-sm sm:text-base px-2 py-1 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAttachment) {
                onOpenAttachment();
              } else {
                fileInputRef.current?.click();
              }
            }}
            aria-label="Attach File"
            title="Attach File or Document"
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0 border border-transparent hover:border-slate-700"
          >
            <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            aria-label="Send Command"
            title="Execute Command (Enter)"
            className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              inputText.trim() && !isLoading
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>

        {/* 2. Keyboard Shortcut Hints & Status Telemetry */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-2">
          <div className="flex items-center gap-2">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                ↵
              </kbd>{' '}
              Execute
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                Ctrl+K
              </kbd>{' '}
              Focus Input
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                Esc
              </kbd>{' '}
              Cancel Voice
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-500/80">
            <Sparkles className="w-3 h-3" />
            <span>NEURAL INTERFACE STANDBY</span>
          </div>
        </div>

        {/* 3. Quick Action Chips (Below Command Bar): News, Tasks, Research, Open App, Music, Summarize, System, More */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar pb-1">
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest mr-1 shrink-0 hidden sm:inline">
              QUICK ACTIONS:
            </span>

            {/* 7 Standard Chips */}
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                  title={action.prompt}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-slate-300 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/40 hover:text-cyan-300 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                >
                  <Icon className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-[11px]">{action.label}</span>
                </button>
              );
            })}

            {/* 8th Chip: More */}
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer shrink-0 shadow-sm border ${
                showMoreActions
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:border-cyan-500/40 hover:text-slate-200'
              }`}
              title="More System Actions"
            >
              <MoreHorizontal className="w-3 h-3 text-cyan-400" />
              <span className="text-[11px]">More</span>
            </button>
          </div>

          {/* Expanded More Actions Drawer */}
          {showMoreActions && (
            <div className="mt-2 p-2 rounded-xl bg-slate-900/90 border border-cyan-500/20 grid grid-cols-1 sm:grid-cols-3 gap-1.5 animate-fadeIn">
              {moreActions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleQuickAction(item.prompt);
                    setShowMoreActions(false);
                  }}
                  className="p-2 rounded-lg bg-slate-950/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 text-left text-xs font-mono text-slate-300 transition-colors cursor-pointer"
                >
                  <span className="text-cyan-300 font-semibold block">{item.label}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{item.prompt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
