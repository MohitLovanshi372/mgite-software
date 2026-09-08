/**
 * Offline & Local Fallback AI Provider (Phase 2)
 * Active when internet is unavailable, offline mode is enabled, or GEMINI_API_KEY is not configured.
 * Responds to local commands, memory queries, and clearly informs when cloud AI is required.
 * Fully supports Hindi, Hinglish, and English without fabricating web data.
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  ProviderAvailability,
} from './types.ts';
import { memoryEngine } from '../memory/memoryEngine.ts';

export class OfflineFallbackProvider extends AIProvider {
  readonly id = 'offline';
  readonly name = 'Local Offline Engine';

  async checkAvailability(): Promise<ProviderAvailability> {
    return { available: true };
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const prompt = request.prompt;
    const query = prompt.toLowerCase().trim();

    // 1. Honesty check for future tools / reminders
    if (query.includes('reminder') || query.includes('alarm') || query.includes('yaad dila')) {
      return {
        text: 'Reminder feature abhi Phase 2 mein available nahi hai. Ye next phase mein add hoga.',
        provider: this.id,
        model: 'local-rules-engine',
        isOffline: true,
      };
    }

    if (query.includes('whatsapp') || query.includes('email') || query.includes('call')) {
      return {
        text: 'External app communication (WhatsApp, Email, Calls) abhi implemented nahi hai. Ye future updates mein add hoga.',
        provider: this.id,
        model: 'local-rules-engine',
        isOffline: true,
      };
    }

    // 2. Check if user is asking about status or local system info
    if (query.includes('status') || query.includes('kaise ho') || query.includes('halat')) {
      const stats = memoryEngine.getStats();
      return {
        text: `JARVIS Local System Status (Offline Mode):
• Database: SQLite active (${stats.conversations} conversations, ${stats.messages} messages, ${stats.memoryItems} stored memory items)
• Network: Local-only / Offline
• Privacy: All data is retained strictly on this local device.

Aapka local assistant tayyar hai. Cloud AI ya web research ke liye internet connection ki zaroorat hogi.`,
        provider: this.id,
        model: 'local-rules-engine',
        isOffline: true,
      };
    }

    // 3. Memory queries
    if (query.includes('memory') || query.includes('yaad') || query.includes('kya jante ho')) {
      const items = memoryEngine.listMemoryItems();
      if (items.length === 0) {
        return {
          text: 'Mere local memory mein abhi koi saved facts nahi hain. Aap Settings > Memory Inspector mein dekh sakte hain.',
          provider: this.id,
          model: 'local-rules-engine',
          isOffline: true,
        };
      }
      const summary = items.slice(0, 5).map((m) => `• [${m.category}] ${m.key}: ${m.value}`).join('\n');
      return {
        text: `Local SQLite Memory se mili jankari:\n${summary}\n\n(Total ${items.length} memory items stored locally).`,
        provider: this.id,
        model: 'local-rules-engine',
        isOffline: true,
      };
    }

    // 4. Greetings in English, Hindi, and Hinglish
    if (/^(hi|hello|hey|namaste|pranam|namashkar|kya hal hai|kaise ho)\b/i.test(query)) {
      return {
        text: `Namaste! Main JARVIS hoon, aapka personal assistant.
Abhi main Offline Mode mein chal raha hoon. Local memory aur settings active hain.
Internet ke bina abhi main full AI response generate nahi kar sakta, lekin aap status aur memory inspect kar sakte hain.`,
        provider: this.id,
        model: 'local-rules-engine',
        isOffline: true,
      };
    }

    // 5. Questions asking for real-time web info or current news
    if (
      query.includes('news') ||
      query.includes('samachar') ||
      query.includes('weather') ||
      query.includes('mausam') ||
      query.includes('today') ||
      query.includes('aaj')
    ) {
      return {
        text: 'Internet ke bina abhi main full AI response generate nahi kar sakta. Live web search ya weather ke liye active internet connection ki zaroorat hogi.',
        provider: this.id,
        model: 'local-rules-engine',
        isOffline: true,
      };
    }

    // 6. Default honest offline fallback
    return {
      text: `Internet ke bina abhi main full AI response generate nahi kar sakta.
Aapka message receive ho gaya hai: "${prompt}".
Full AI generation ke liye internet connection aur active Gemini service ki zaroorat hogi.`,
      provider: this.id,
      model: 'local-rules-engine',
      isOffline: true,
    };
  }

  async *generateStream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const res = await this.generateResponse(request);
    // Yield in small chunks for natural feel
    const words = res.text.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const slice = words.slice(i, i + 3).join(' ') + ' ';
      yield {
        textChunk: slice,
        isDone: false,
      };
    }
    yield {
      textChunk: '',
      isDone: true,
    };
  }
}

export const offlineProvider = new OfflineFallbackProvider();
