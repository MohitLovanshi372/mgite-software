/**
 * ChatView Component
 *
 * Dedicated Chat interface for JARVIS conversation history,
 * text normalization inspection, audio speech replay, and conversation stream.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, User, Bot, Sparkles, RefreshCw, Send } from 'lucide-react';
import { soundFx } from '../utils/audioEffects.ts';
import { SpeechTextNormalizer } from '../utils/speechTextNormalizer.ts';
import { ultronVoice } from '../utils/ultronVoice.ts';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  normalizedText?: string;
  timestamp: string;
}

interface ChatViewProps {
  onSendMessage: (msg: string) => void;
  lastAssistantMessage?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onSendMessage,
  lastAssistantMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'jarvis',
      text: 'Hello. I am JARVIS, your personal AI command center assistant. How can I help you today?',
      normalizedText: 'Hello. I am JARVIS, your personal AI command center assistant. How can I help you today?',
      timestamp: '14:28',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync latest assistant message when it changes
  useEffect(() => {
    if (lastAssistantMessage && lastAssistantMessage.trim()) {
      const norm = SpeechTextNormalizer.normalize(lastAssistantMessage);
      setMessages((prev) => {
        if (prev[prev.length - 1]?.text === lastAssistantMessage) return prev;
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: 'jarvis',
            text: lastAssistantMessage,
            normalizedText: norm.normalizedText,
            timestamp: timeStr,
          },
        ];
      });
    }
  }, [lastAssistantMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputVal.trim();
    if (!text) return;

    soundFx.playSend();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: timeStr,
      },
    ]);

    onSendMessage(text);
    setInputVal('');
  };

  const handleSpeak = (text: string) => {
    soundFx.playClick();
    ultronVoice.speak(text);
  };

  return (
    <div className="w-full h-full flex flex-col p-4 gap-3 bg-[#030712]/80 backdrop-blur-md rounded-2xl border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.04)] overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/15">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-[#FFD76A]" />
          <span className="text-sm font-sans font-bold text-[#E8EAF0] tracking-wide">
            JARVIS DIALOGUE STREAM
          </span>
        </div>
        <span className="text-xs font-mono text-[#FFD76A] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full">
          FISH AUDIO & GEMINI SYNCHRONIZED
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[80%] ${
              msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <div
              className={`p-3.5 rounded-2xl text-sm font-sans leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD76A] text-[#030712] font-medium rounded-tr-none shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'bg-[#060D1E]/90 text-slate-100 border border-[#D4AF37]/25 rounded-tl-none shadow-[0_0_15px_rgba(212,175,55,0.05)]'
              }`}
            >
              <p>{msg.text}</p>

              {/* Show Normalized Text inspection tag for JARVIS messages */}
              {msg.sender === 'jarvis' && msg.normalizedText && msg.normalizedText !== msg.text && (
                <div className="mt-2 pt-2 border-t border-[#D4AF37]/20 text-[11px] text-[#FFD76A] font-mono">
                  <span className="text-slate-400">TTS Spoken: </span>
                  {msg.normalizedText}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 font-mono">
              <span>{msg.timestamp}</span>
              {msg.sender === 'jarvis' && (
                <button
                  onClick={() => handleSpeak(msg.text)}
                  title="Replay Voice Speech"
                  className="hover:text-[#FFD76A] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3 text-[#D4AF37]" />
                  <span>Replay</span>
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-[#D4AF37]/15">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type message to JARVIS..."
          className="flex-1 bg-[#030712]/90 border border-[#D4AF37]/25 rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder:text-slate-500 focus:outline-none focus:border-[#FFD76A] focus:shadow-[0_0_15px_rgba(255,215,106,0.2)]"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FFD76A] text-[#030712] font-semibold text-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.4)] disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
