/**
 * Hook for managing chat messages, conversations, streaming states, and assistant interactions (Phase 2).
 */

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, Conversation, MessageState } from '../types/index.ts';
import { apiService } from '../services/api.ts';

export function useAssistant(isOfflineMode: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messageState, setMessageState] = useState<MessageState>('COMPLETED');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');

  // Load conversation list on mount
  const loadConversations = useCallback(async () => {
    try {
      const list = await apiService.listConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    } catch (e: any) {
      console.error('Failed to load conversations:', e);
    }
  }, [activeConversationId]);

  // Load messages whenever active conversation changes
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const msgs = await apiService.getMessages(convId);
      setMessages(
        msgs.map((m) => ({
          ...m,
          state: 'COMPLETED',
        }))
      );
    } catch (e: any) {
      console.error('Failed to load messages for conversation:', e);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setLastUserPrompt(text);
    setIsLoading(true);
    setMessageState('SENDING');
    setErrorMessage(null);

    const tempUserMsgId = `user-${Date.now()}`;
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      conversation_id: activeConversationId || 'new',
      sender: 'user',
      content: text,
      created_at: new Date().toISOString(),
      state: 'COMPLETED',
    };

    const tempAssistantMsgId = `assistant-${Date.now()}`;
    const tempAssistantMsg: ChatMessage = {
      id: tempAssistantMsgId,
      conversation_id: activeConversationId || 'new',
      sender: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      state: 'STREAMING',
    };

    // Append both messages
    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

    try {
      let accumulatedText = '';
      setMessageState('STREAMING');

      await apiService.streamMessage(
        text,
        activeConversationId || undefined,
        isOfflineMode,
        (token) => {
          accumulatedText += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId
                ? { ...msg, content: accumulatedText, state: 'STREAMING' }
                : msg
            )
          );
        },
        (meta) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId
                ? {
                    ...msg,
                    content: accumulatedText,
                    conversation_id: meta.conversationId || msg.conversation_id,
                    provider: meta.provider,
                    model: meta.model,
                    isOffline: meta.isOffline,
                    warnings: meta.warnings,
                    intent: meta.intent,
                    state: 'COMPLETED',
                  }
                : msg
            )
          );
          if (meta.conversationId && meta.conversationId !== activeConversationId) {
            setActiveConversationId(meta.conversationId);
            loadConversations();
          }
          setMessageState('COMPLETED');
        },
        (streamErr) => {
          console.warn('Stream chunk error:', streamErr);
        }
      );
    } catch (err: any) {
      console.error('Stream failure, attempting fallback unary POST /api/chat:', err);

      // Fallback to unary sendMessage if streaming endpoint had connection issue
      try {
        const fallbackResult = await apiService.sendMessage(
          text,
          activeConversationId || undefined,
          isOfflineMode
        );

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMsgId
              ? {
                  ...msg,
                  content: fallbackResult.response,
                  conversation_id: fallbackResult.conversationId,
                  provider: fallbackResult.provider,
                  model: fallbackResult.model,
                  isOffline: fallbackResult.isOffline,
                  warnings: fallbackResult.warnings,
                  intent: fallbackResult.intent,
                  state: 'COMPLETED',
                }
              : msg
          )
        );

        if (fallbackResult.conversationId !== activeConversationId) {
          setActiveConversationId(fallbackResult.conversationId);
          loadConversations();
        }
        setMessageState('COMPLETED');
      } catch (unaryErr: any) {
        const friendlyError = 'Response nahi aa paya. Retry karo.';
        setErrorMessage(unaryErr.message || friendlyError);
        setMessageState('FAILED');

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMsgId
              ? {
                  ...msg,
                  content: friendlyError,
                  state: 'FAILED',
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = () => {
    if (lastUserPrompt) {
      // Remove failed assistant message from display before re-sending
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].state === 'FAILED') {
          return prev.slice(0, prev.length - 2); // remove failed user and assistant pair to retry cleanly
        }
        return prev;
      });
      sendMessage(lastUserPrompt);
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setMessageState('COMPLETED');
  };

  const deleteConversation = async (id: string) => {
    try {
      await apiService.deleteConversation(id);
      if (activeConversationId === id) {
        startNewConversation();
      }
      loadConversations();
    } catch (err: any) {
      console.error('Delete conversation error:', err);
    }
  };

  const clearAllHistory = async () => {
    try {
      await apiService.clearHistory();
      startNewConversation();
      loadConversations();
    } catch (err: any) {
      console.error('Clear history error:', err);
    }
  };

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    isLoading,
    messageState,
    errorMessage,
    sendMessage,
    retryLastMessage,
    startNewConversation,
    deleteConversation,
    clearAllHistory,
    refreshConversations: loadConversations,
  };
}
