/**
 * CommandConsole Component
 * Large cinematic mechanical command console with glowing input, live voice waveform,
 * microphone trigger, file attachment, settings shortcut, and powerful EXECUTE button.
 */

import React, { useState } from 'react';
import {
  Mic,
  Paperclip,
  Settings,
  Zap,
  CornerDownLeft,
  Volume2,
  Sliders,
} from 'lucide-react';
import { QuickActions } from '../Dashboard/QuickActions.tsx';
import { NavigationPageId } from '../../types/index.ts';

interface CommandConsoleProps {
  onExecute: (commandText: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  onNavigate?: (pageId: NavigationPageId) => void;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({
  onExecute,
  isListening,
  onToggleListening,
  onNavigate,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onExecute(inputVal.trim());
    setInputVal('');
  };

  const handleQuickAction = (actionLabel: string) => {
    setInputVal(`Direct command: execute ${actionLabel} protocol`);
  };

  return (
    <div className="w-full bg-[#07080d]/95 border-t border-zinc-800/90 p-3 sm:p-4 font-mono select-none relative z-20">
      {/* Top Ambient Red Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

      {/* Main Console Box */}
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-[#0b0c13] border border-zinc-700/80 rounded-xs p-2 shadow-[0_0_20px_rgba(0,0,0,0.8)] focus-within:border-red-500/80 transition-all flex flex-col sm:flex-row items-center gap-2 relative"
      >
        {/* Corner Brackets */}
        <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-red-500" />
        <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-red-500" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-red-500" />
        <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-red-500" />

        {/* LEFT: Microphone Button */}
        <button
          type="button"
          onClick={onToggleListening}
          className={`px-3 py-2.5 rounded-xs border flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_15px_#ef4444] animate-pulse'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
          title="Toggle Voice Input"
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-red-400' : ''}`} />
          <span className="text-[11px] font-bold tracking-wider hidden md:inline">
            {isListening ? 'LISTENING' : 'VOICE'}
          </span>
        </button>

        {/* CENTER: Voice Waveform (Active when listening) + Input Field */}
        <div className="flex-1 w-full flex items-center gap-2.5 px-2">
          {/* Simulated Waveform Bar Animation */}
          {isListening && (
            <div className="flex items-center gap-0.5 h-6 px-1 border-r border-red-900/60 pr-2">
              {[4, 16, 8, 22, 14, 28, 10, 20, 6, 18].map((h, idx) => (
                <span
                  key={idx}
                  className="w-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_#ef4444]"
                  style={{
                    height: `${Math.max(4, (h * (idx % 2 === 0 ? 1 : 1.4)) % 24)}px`,
                    animationDelay: `${idx * 80}ms`,
                  }}
                />
              ))}
            </div>
          )}

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={isListening ? 'Acoustic input streaming...' : 'Command the system...'}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden tracking-wide font-mono"
          />
        </div>

        {/* RIGHT: Attach, Settings, Execute Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('documents')}
            className="p-2 rounded-xs bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Attach System Document"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('system_control')}
            className="p-2 rounded-xs bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
            title="System Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Heavy Mechanical EXECUTE Button */}
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs tracking-widest uppercase flex items-center gap-2 rounded-xs border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.7)] transition-all cursor-pointer active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>EXECUTE</span>
          </button>
        </div>
      </form>

      {/* Action Chips Below Console */}
      <QuickActions
        onSelectAction={handleQuickAction}
        onNavigate={onNavigate}
      />
    </div>
  );
};
