/**
 * Message Input Bar
 * Handles user typing, Enter-to-send shortcut, character limiting,
 * and indicates Phase 2 voice placeholder cleanly.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, MicOff, AlertCircle } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isOffline: boolean;
  maxChars?: number;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  isOffline,
  maxChars = 8000,
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
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-900/90 border border-slate-700/70 focus-within:border-cyan-500/80 rounded-xl p-2 transition-all shadow-inner">
          {/* Phase 2 Voice Placeholder Button */}
          <button
            type="button"
            disabled
            className="p-2 text-slate-500 hover:text-slate-400 rounded-lg cursor-not-allowed transition-colors"
            title="Voice Engine: Scheduled for Phase 2 (Continuous listening & Wake word intentionally not implemented in Phase 1)"
          >
            <MicOff className="w-4 h-4" />
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
              isOffline
                ? 'Type a message... (Offline mode: SQLite memory & local responses active)'
                : 'Ask JARVIS in English, Hindi, or Hinglish (Enter to send)...'
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
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 mt-2">
          <span>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-slate-400">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-slate-400">Shift+Enter</kbd> for newline</span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            SQLite Memory Active
          </span>
        </div>
      </div>
    </footer>
  );
};
