/**
 * Main Chat Interface Component (Phase 2)
 * Contains conversation sidebar with clear history option, scrollable message history,
 * streaming support, multilingual suggestions, and retry capabilities.
 */

import React, { useRef, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, Sparkles, Shield, Trash } from 'lucide-react';
import { ChatMessage, Conversation } from '../types/index.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { MessageInput } from './MessageInput.tsx';

interface ChatInterfaceProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isOnline: boolean;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAllHistory?: () => void;
  onRetryMessage?: () => void;
  onSendMessage: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversations,
  activeConversationId,
  messages,
  isLoading,
  isOnline,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAllHistory,
  onRetryMessage,
  onSendMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const samplePrompts = [
    { label: 'Hinglish Question', text: 'bhai kal mera kya schedule hai?' },
    { label: 'Context Continuity', text: 'Mera naam Mohit hai. Mujhe ek portfolio banana hai.' },
    { label: 'Honesty Rule Test', text: 'Kal 10 baje reminder laga do.' },
    { label: 'System Memory', text: 'Show me my local SQLite status and remembered facts.' },
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950">
      {/* Sidebar: Conversation History */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 flex flex-col hidden sm:flex shrink-0">
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Conversations
          </span>
          <button
            id="btn-new-chat"
            onClick={onNewConversation}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors cursor-pointer"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No conversations yet. Send a message to get started!
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeConversationId === c.id
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-medium'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 mr-1">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{c.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Clear All History Button */}
        {conversations.length > 0 && onClearAllHistory && (
          <div className="p-2 border-t border-slate-800/80">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all conversation history from SQLite?')) {
                  onClearAllHistory();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors"
            >
              <Trash className="w-3 h-3" />
              <span>Clear All History</span>
            </button>
          </div>
        )}

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>SQLite Local Storage</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Phase 2</span>
        </div>
      </aside>

      {/* Main Chat Center Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="py-12 px-4 text-center max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-600/30 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-lg shadow-cyan-950/40">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
                  Personal AI Assistant
                </h1>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Phase 2 AI Brain with natural conversation in Hindi, Hinglish, and English.
                  Protected by deterministic Privacy Shield & Local SQLite Memory.
                </p>

                {/* Sample Prompt Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                  {samplePrompts.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onSendMessage(item.text)}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-xs text-slate-300 transition-all text-left group cursor-pointer"
                    >
                      <div className="text-[10px] uppercase font-mono text-cyan-400/80 mb-1">
                        {item.label}
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-cyan-300">
                        "{item.text}"
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onRetry={msg.state === 'FAILED' ? onRetryMessage : undefined}
                />
              ))
            )}
          </div>
        </div>

        {/* Input area */}
        <MessageInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          isOffline={!isOnline}
        />
      </main>
    </div>
  );
};
