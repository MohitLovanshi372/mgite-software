/**
 * Message Bubble Component (Phase 2)
 * Renders user and assistant messages with streaming cursor, retry button on failure,
 * copy action, timestamp, and security warnings.
 */

import React, { useState } from 'react';
import { Bot, User, AlertTriangle, Check, Copy, WifiOff, Sparkles, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types/index.ts';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.sender === 'assistant';
  const isSystem = message.sender === 'system';
  const isStreaming = message.state === 'STREAMING';
  const isFailed = message.state === 'FAILED';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-3 px-4">
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 my-4 group ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble Card */}
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 transition-all ${
          isAssistant
            ? isFailed
              ? 'bg-rose-950/30 border border-rose-800/60 text-rose-200'
              : 'bg-slate-900/90 border border-slate-800/80 text-slate-100 shadow-md'
            : 'bg-cyan-900/40 border border-cyan-700/50 text-slate-100 shadow-sm'
        }`}
      >
        {/* Header Metadata for Assistant */}
        {isAssistant && (
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/60 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                JARVIS
              </span>
              {message.model && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                  {message.model}
                </span>
              )}
              {message.isOffline && (
                <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 text-[10px] flex items-center gap-1 border border-amber-800/50">
                  <WifiOff className="w-2.5 h-2.5" />
                  Offline
                </span>
              )}
              {message.intent?.intent && (
                <span
                  className="px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-400/90 text-[10px] border border-cyan-900/40 hidden sm:inline-flex"
                  title={`Strategy: ${message.intent.responseStrategy} | Risk: ${message.intent.riskLevel}`}
                >
                  Intent: {message.intent.intent}
                </span>
              )}
              {isStreaming && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] animate-pulse">
                  Streaming...
                </span>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Message Content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words text-slate-200">
          {isStreaming && !message.content ? (
            <span className="flex items-center gap-2 text-slate-400 italic">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              Generating response...
            </span>
          ) : (
            <>
              {message.content}
              {isStreaming && <span className="inline-block w-2 h-4 ml-0.5 bg-cyan-400 animate-pulse align-middle" />}
            </>
          )}
        </div>

        {/* Failed Response Retry Button */}
        {isFailed && onRetry && (
          <div className="mt-3 pt-2 border-t border-rose-900/60 flex items-center justify-between">
            <span className="text-xs text-rose-300">Response receive nahi ho paya.</span>
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 transition-colors border border-rose-700"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Security / Privacy Warnings if Present */}
        {message.warnings && message.warnings.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-0.5">
              {message.warnings.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
          </div>
        )}

        {/* Footer timestamp */}
        <div className="mt-2 text-[10px] text-slate-500 text-right">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
