/**
 * JarvisCommandBar Component (Golden Space Theme)
 *
 * Bottom Command Bar matching:
 * - Circular glowing golden microphone button
 * - Sleek glassmorphism command bar: "Ask JARVIS anything in English or Hindi..."
 * - Golden send button
 * - 5 clean suggestion prompt chips
 */

import React, { useState, useRef } from 'react';
import { Mic, Send, Square } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects.ts';

interface JarvisCommandBarProps {
  onExecute: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  onStop?: () => void;
  isSpeaking?: boolean;
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
  onStop,
  isSpeaking = false,
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
    <div className="w-full flex flex-col gap-2 select-none z-20">
      {/* Top Row: Microphone + Input Bar + Stop Button */}
      <div className="flex items-center gap-2.5 w-full">
        {/* Glowing Golden Microphone Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onToggleListening();
          }}
          title={isListening ? 'Stop listening' : 'Start voice recognition'}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer ${
            isListening
              ? 'bg-gradient-to-tr from-[#D4AF37] to-[#FFD76A] text-[#030712] shadow-[0_0_25px_rgba(255,215,106,0.7)] scale-105'
              : 'bg-[#030712] hover:bg-[#070E20] border border-[#D4AF37]/50 text-[#FFD76A] hover:border-[#FFD76A] shadow-[0_0_15px_rgba(212,175,55,0.15)]'
          }`}
        >
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-[#FFD76A] animate-ping opacity-60" />
              <span className="absolute -inset-1 rounded-full border border-[#D4AF37]/50 animate-pulse" />
            </>
          )}
          <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
        </button>

        {/* Command Input Field with Golden Glassmorphism */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 relative flex items-center gap-2 rounded-xl bg-[#030712]/85 backdrop-blur-md border border-[#D4AF37]/25 shadow-[0_0_20px_rgba(212,175,55,0.05)] focus-within:border-[#FFD76A] focus-within:shadow-[0_0_20px_rgba(255,215,106,0.2)] transition-all duration-300 px-4 py-1.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask JARVIS anything in English or Hindi..."
            className="flex-1 bg-transparent text-sm font-sans text-[#E8EAF0] placeholder:text-slate-500 focus:outline-none py-1"
          />

          {/* Golden Stop / Interrupt Button */}
          {(isSpeaking || isListening) && onStop && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onStop();
              }}
              title="Interrupt and stop speaking"
              className="w-8 h-8 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-[#FFD76A] flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* Golden Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            title="Send directive"
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
              inputText.trim()
                ? 'bg-gradient-to-tr from-[#D4AF37] to-[#FFD76A] text-[#030712] shadow-[0_0_12px_rgba(212,175,55,0.5)] hover:scale-105'
                : 'text-slate-600 bg-transparent cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Suggested Command Chips (Clean, Minimal Golden Space Style) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]/70 shrink-0 hidden sm:inline">
          DIRECTIVES:
        </span>
        {SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSuggestionClick(item)}
            className="px-2.5 py-0.8 rounded-full text-[11px] font-sans text-slate-300 hover:text-[#FFD76A] bg-[#030712]/75 hover:bg-[#D4AF37]/15 border border-[#D4AF37]/20 hover:border-[#FFD76A]/40 transition-all duration-200 shrink-0 whitespace-nowrap cursor-pointer"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
