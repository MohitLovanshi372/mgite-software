/**
 * JarvisCommandBar Component
 *
 * Bottom Command Area matching the reference desktop AI interface:
 * - Round glowing microphone trigger button on left
 * - Wide sleek glassmorphism command bar: "Ask JARVIS anything..."
 * - Send button with paper plane icon
 * - 5 functional suggestion pills below:
 *    - "Kya haal hai?"
 *    - "Mera system status batao"
 *    - "YouTube kholo"
 *    - "Kal 10 baje yaad dilana"
 *    - "Aaj kya karna hai?"
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects.ts';

interface JarvisCommandBarProps {
  onExecute: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
}

const SUGGESTIONS = [
  'Kya haal hai?',
  'Mera system status batao',
  'YouTube kholo',
  'Kal 10 baje yaad dilana',
  'Aaj kya karna hai?',
];

export const JarvisCommandBar: React.FC<JarvisCommandBarProps> = ({
  onExecute,
  isListening,
  onToggleListening,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    soundFx.playSend();
    onExecute(trimmed);
    setInputText('');
  };

  const handleSuggestionClick = (query: string) => {
    soundFx.playClick();
    onExecute(query);
  };

  return (
    <div className="w-full flex flex-col gap-2.5 select-none z-20">
      {/* Top Row: Circular Mic Button + Command Input Bar */}
      <div className="flex items-center gap-3 w-full">
        {/* Large Glowing Microphone Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onToggleListening();
          }}
          title={isListening ? 'Stop listening' : 'Start voice recognition'}
          className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer ${
            isListening
              ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.8)] scale-105'
              : 'bg-[#091326] hover:bg-[#0f1f3d] border border-cyan-500/40 text-cyan-400 hover:text-white shadow-[0_0_18px_rgba(0,140,255,0.25)]'
          }`}
        >
          {/* Animated concentric pulse rings when listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-60" />
              <span className="absolute -inset-1.5 rounded-full border border-cyan-300/40 animate-pulse" />
            </>
          )}

          <Mic className={`w-5 h-5 sm:w-6 sm:h-6 ${isListening ? 'animate-pulse' : ''}`} />
        </button>

        {/* Command Input Field with Glassmorphism styling */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 relative flex items-center rounded-2xl bg-[#091122]/85 backdrop-blur-xl border border-blue-500/25 shadow-[0_0_20px_rgba(0,140,255,0.06)] focus-within:border-cyan-400 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-300 px-4 py-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask JARVIS anything..."
            className="flex-1 bg-transparent text-sm sm:text-base font-sans text-white placeholder:text-slate-500 focus:outline-none py-1.5"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            title="Send command"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${
              inputText.trim()
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_12px_rgba(0,140,255,0.6)] hover:scale-105'
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Suggested Command Pills */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs font-sans">
        <span className="text-[11px] text-slate-500 font-medium shrink-0 hidden md:inline">
          Suggestions:
        </span>
        {SUGGESTIONS.map((query) => (
          <button
            key={query}
            type="button"
            onClick={() => handleSuggestionClick(query)}
            className="px-3 py-1.5 rounded-full bg-[#091122]/70 hover:bg-[#102042] border border-blue-500/20 hover:border-cyan-400/60 text-slate-300 hover:text-white transition-all duration-200 shrink-0 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(0,140,255,0.04)] hover:shadow-[0_0_15px_rgba(0,140,255,0.25)] hover:scale-[1.02]"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};
