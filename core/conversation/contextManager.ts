/**
 * Conversation Context Manager (Phase 2 Step 5)
 * Manages short-term conversation context, configurable context window limits,
 * character/token budget safety, privacy sanitization, and passive memory formatting.
 * 
 * Pipeline order (Section 25):
 * User Input -> Privacy Filter -> Context Manager -> Memory Policy -> AI Router -> Gemini
 */

import { memoryEngine, MemoryItem } from '../memory/memoryEngine.ts';
import { MemoryPolicy } from '../memory/memoryPolicy.ts';
import { AIMessage, AIContext } from '../ai/types.ts';
import { buildSystemInstruction } from '../ai/prompts.ts';
import { getConfig } from '../../config/settings.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';

export interface BuildContextOptions {
  maxMessages?: number;
  maxCharacters?: number;
  currentQuery?: string;
}

export class ContextManager {
  private static readonly DEFAULT_MAX_CHARS = 12000; // Safe character budget (~3000 tokens)

  /**
   * Builds conversation context for a given conversation.
   * Loads recent messages up to MAX_CONTEXT_MESSAGES, enforces character budgets,
   * cleanses sensitive content via Privacy Filter, and formats passive long-term memories.
   */
  public static buildContext(
    conversationId: string,
    optionsOrQuery?: BuildContextOptions | string,
    maxCharactersArg?: number
  ): AIContext {
    const config = getConfig();

    let maxMessages = config.max_context_messages || 20;
    let maxCharacters = maxCharactersArg || this.DEFAULT_MAX_CHARS;
    let currentQuery: string | undefined;

    if (typeof optionsOrQuery === 'string') {
      currentQuery = optionsOrQuery;
    } else if (optionsOrQuery && typeof optionsOrQuery === 'object') {
      if (optionsOrQuery.maxMessages) maxMessages = optionsOrQuery.maxMessages;
      if (optionsOrQuery.maxCharacters) maxCharacters = optionsOrQuery.maxCharacters;
      if (optionsOrQuery.currentQuery) currentQuery = optionsOrQuery.currentQuery;
    }

    // 1. Fetch recent messages from SQLite ordered by creation time
    const rawMessages = memoryEngine.getMessages(conversationId, maxMessages);

    // 2. Privacy sanitization & ordering check
    // Ensure any sensitive remnants are sanitized before entering context
    const sanitizedMessages: AIMessage[] = [];
    for (const msg of rawMessages) {
      const pCheck = PrivacyFilter.filterInput(msg.content);
      // If message was classified as OTP or BLOCK, mask it in context
      const safeContent = pCheck.action === 'BLOCK' || pCheck.classification === 'OTP'
        ? '[SENSITIVE DATA REDACTED BY PRIVACY FILTER]'
        : pCheck.cleanText;

      sanitizedMessages.push({
        role: msg.sender,
        content: safeContent,
        timestamp: msg.created_at,
      });
    }

    // 3. Enforce character budget (prune oldest messages if needed, preserving most recent)
    const budgetedMessages = this.applyCharacterBudget(sanitizedMessages, maxCharacters);

    // 4. Load safe local memories (PUBLIC & NORMAL sensitivity only, with Data Minimization)
    let safeMemories: MemoryItem[] = [];
    if (config.memory.enabled) {
      const storedMemories = memoryEngine.listMemoryItems({ maxSensitivity: 'NORMAL' });

      // Secondary verification: Privacy Filter check on every memory item
      const verifiedMemories = storedMemories.filter((m) => {
        if (m.sensitivity !== 'PUBLIC' && m.sensitivity !== 'NORMAL') {
          return false;
        }
        const filterRes = PrivacyFilter.filterInput(m.content);
        return filterRes.action !== 'BLOCK' && filterRes.classification !== 'OTP';
      });

      // Data Minimization: Prioritize relevant memories if query exists, max 10 memories
      safeMemories = this.selectRelevantMemories(verifiedMemories, currentQuery, 10);
    }

    // 5. Section 12: Memory Injection Defense
    // Stored memories are strictly formatted as passive DATA, never merged into system instructions
    const memoryData = MemoryPolicy.formatMemoriesForContext(safeMemories);
    const memorySummary = safeMemories.map((m) => `• [${m.type}] ${m.content}`).join('; ');

    // 6. System instructions strictly separated from memories
    const systemInstruction = buildSystemInstruction(config.assistant_name);

    return {
      conversationId,
      messages: budgetedMessages,
      systemInstruction,
      memoryData: memoryData || undefined,
      memoryContext: memorySummary || undefined,
      maxContextMessages: maxMessages,
    };
  }

  /**
   * Applies character budget to prevent context overflow while keeping recent turns intact.
   */
  private static applyCharacterBudget(messages: AIMessage[], maxChars: number): AIMessage[] {
    if (messages.length === 0) return [];

    let totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalChars <= maxChars) {
      return messages;
    }

    // Truncate oldest messages while preserving at least the most recent turn
    const result = [...messages];
    while (result.length > 1 && totalChars > maxChars) {
      const removed = result.shift();
      if (removed) {
        totalChars -= removed.content.length;
      }
    }
    return result;
  }

  /**
   * Selects relevant memories based on keyword overlap or freshness up to maxCount.
   */
  public static selectRelevantMemories(
    memories: MemoryItem[],
    query?: string,
    maxCount: number = 10
  ): MemoryItem[] {
    if (!query || !query.trim()) {
      return memories.slice(0, maxCount);
    }

    const queryWords = new Set(
      query
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

    // Score memories by word overlap
    const scored = memories.map((m) => {
      const contentWords = m.content.toLowerCase().split(/\s+/);
      let matchCount = 0;
      for (const w of contentWords) {
        if (queryWords.has(w)) matchCount++;
      }
      return { memory: m, score: matchCount };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.memory).slice(0, maxCount);
  }

  /**
   * Helper to retrieve relevant memories directly from SQLite for a query.
   */
  public static getRelevantMemories(query: string, maxCount: number = 10): MemoryItem[] {
    const all = memoryEngine.listMemoryItems({ maxSensitivity: 'NORMAL' });
    return this.selectRelevantMemories(all, query, maxCount);
  }
}
