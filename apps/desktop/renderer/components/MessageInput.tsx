/**
 * Message Input Bar (Phase 3 Voice Capable)
 * Handles user typing, Enter-to-send shortcut, character limiting,
 * and integrates live microphone voice input with barge-in interruption.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Volume2, AlertCircle, Radio } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isOffline: boolean;
  maxChars?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  interimTranscript?: string;
  onToggleVoice?: () => void;
  onStopSpeaking?: () => void;
  voiceErrorMessage?: string | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  isOffline,
  maxChars = 8000,
  isListening = false,
  isSpeaking = false,
  interimTranscript = '',
  onToggleVoice,
  onStopSpeaking,
  voiceErrorMessage,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= maxChars) {
      setText(val);
      // Auto-resize up to 140px
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
      }
    }
  };

  return (
    <footer className="p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky bottom-0 z-20">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Live Voice State Banners */}
        {isListening && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300 animate-pulse">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-spin" />
              <span className="font-medium">Listening... Speak now in English or Hindi</span>
              {interimTranscript && (
                <span className="text-slate-300 italic">"{interimTranscript}"</span>
              )}
            </div>
            <button
              onClick={onToggleVoice}
              className="px-2 py-0.5 text-[11px] bg-red-900/60 hover:bg-red-800/80 text-white rounded border border-red-700/50 cursor-pointer"
            >
              Done / Stop
            </button>
          </div>
        )}

        {isSpeaking && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-300">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              <span>JARVIS is speaking... (Click stop or start typing to interrupt)</span>
            </div>
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-cyan-900/60 hover:bg-cyan-800/80 text-white rounded border border-cyan-700/50 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Speaking</span>
            </button>
          </div>
        )}

        {voiceErrorMessage && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{voiceErrorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-slate-900/90 border border-slate-700/70 focus-within:border-cyan-500/80 rounded-xl p-2 transition-all shadow-inner"
        >
          {/* Active Voice Engine Microphone Button */}
          <button
            id="chat-mic-button"
            type="button"
            onClick={isSpeaking ? onStopSpeaking : onToggleVoice}
            className={`p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              isListening
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40 animate-pulse'
                : isSpeaking
                ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
            title={
              isListening
                ? 'Click to stop listening'
                : isSpeaking
                ? 'Speaking... Click to interrupt'
                : 'Click to speak (Voice Engine Phase 3)'
            }
          >
            {isListening ? (
              <Square className="w-4 h-4 fill-current" />
            ) : isSpeaking ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text Area */}
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to microphone...'
                : isOffline
                ? 'Type a message... (Offline mode: SQLite memory & local responses active)'
                : 'Ask JARVIS or tap Mic to speak (English / Hindi / Hinglish)...'
            }
            className="flex-1 bg-transparent border-0 text-slate-100 text-sm focus:outline-none resize-none py-1.5 px-1 max-h-36 min-h-[36px] placeholder:text-slate-500"
          />

          {/* Right actions: Counter and Send Button */}
          <div className="flex items-center gap-2 pb-0.5">
            {text.length > 500 && (
              <span className="text-[10px] text-slate-500 font-mono">
                {text.length}/{maxChars}
              </span>
            )}

            <button
              id="chat-send-button"
              type="submit"
              disabled={!text.trim() || isLoading}
              className={`p-2 rounded-lg font-medium transition-all flex items-center justify-center ${
                !text.trim() || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/20 active:scale-95 cursor-pointer'
              }`}
              title="Send message (Enter)"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Footer Subtext */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
          <span>
            Press <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-slate-400">Enter</kbd> to send, or click <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-slate-400">Mic</kbd> to speak
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Voice Engine Phase 3
          </span>
        </div>
      </div>
    </footer>
  );
};
