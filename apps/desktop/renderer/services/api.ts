/**
 * API Service Client
 * Handles communication with local backend endpoints.
 * Never stores or transmits API keys from the browser.
 */

import { ChatMessage, Conversation, SystemStatus, MemoryItem, LogEntry, AppConfig, SensitivityLevel } from '../types/index.ts';

const BASE_URL = ''; // Relative path leverages current server on port 3000

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 120) || 'Unknown error'}`);
    }
    throw new Error(`Expected JSON but server returned ${contentType || 'HTML'}`);
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as any).error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const apiService = {
  async getHealth(): Promise<{ status: string; service: string; version: string }> {
    return fetchJson<{ status: string; service: string; version: string }>(`${BASE_URL}/health`);
  },

  async getStatus(): Promise<SystemStatus> {
    return fetchJson<SystemStatus>(`${BASE_URL}/api/status`);
  },

  async sendMessage(
    message: string,
    conversationId?: string,
    isOfflineMode?: boolean
  ): Promise<{
    conversationId: string;
    response: string;
    provider: string;
    model: string;
    isOffline: boolean;
    intent?: any;
    warnings?: string[];
    timestamp: string;
  }> {
    return fetchJson<{
      conversationId: string;
      response: string;
      provider: string;
      model: string;
      isOffline: boolean;
      intent?: any;
      warnings?: string[];
      timestamp: string;
    }>(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        is_offline_mode: isOfflineMode,
      }),
    });
  },

  async listConversations(): Promise<Conversation[]> {
    return fetchJson<Conversation[]>(`${BASE_URL}/api/conversations`);
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return fetchJson<ChatMessage[]>(`${BASE_URL}/api/conversations/${conversationId}/messages`);
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  async listMemory(category?: string): Promise<MemoryItem[]> {
    const url = category ? `${BASE_URL}/api/memory?category=${encodeURIComponent(category)}` : `${BASE_URL}/api/memory`;
    return fetchJson<MemoryItem[]>(url);
  },

  async createMemory(
    key: string,
    value: string,
    category: string = 'general',
    sensitivity: SensitivityLevel = 'NORMAL'
  ): Promise<MemoryItem> {
    return fetchJson<MemoryItem>(`${BASE_URL}/api/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, category, sensitivity }),
    });
  },

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/memory/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete memory item');
  },

  async clearMemories(): Promise<{ success: boolean; deletedCount: number }> {
    return fetchJson<{ success: boolean; deletedCount: number }>(`${BASE_URL}/api/memories`, {
      method: 'DELETE',
    });
  },

  async getLogs(level?: string, limit: number = 100): Promise<LogEntry[]> {
    const url = level ? `${BASE_URL}/api/logs?level=${level}&limit=${limit}` : `${BASE_URL}/api/logs?limit=${limit}`;
    return fetchJson<LogEntry[]>(url);
  },

  async clearLogs(): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/logs/clear`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear logs');
  },

  async clearHistory(): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/chat/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear history');
  },

  async streamMessage(
    message: string,
    conversationId: string | undefined,
    isOfflineMode: boolean | undefined,
    onToken: (token: string) => void,
    onDone: (meta: any) => void,
    onError: (err: string) => void
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        is_offline_mode: isOfflineMode,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'token') {
            onToken(parsed.token);
          } else if (parsed.type === 'done') {
            onDone(parsed);
          } else if (parsed.type === 'error') {
            onError(parsed.error);
          }
        } catch {
          // ignore
        }
      }
    }
  },

  async getConfig(): Promise<AppConfig> {
    return fetchJson<AppConfig>(`${BASE_URL}/api/config`);
  },

  async updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
    return fetchJson<AppConfig>(`${BASE_URL}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
  },
};
