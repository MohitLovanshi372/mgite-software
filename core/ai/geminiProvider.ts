/**
 * Google Gemini AI Provider Adapter (Phase 2 Step 3: Gemini Provider Integration)
 *
 * Concrete adapter implementing the canonical AIProvider interface for Google Gemini.
 * Uses the official server-side @google/genai SDK.
 *
 * CRITICAL SECURITY & PRIVACY CONTROLS:
 * - Gemini API key is read STRICTLY from backend environment variables (process.env.GEMINI_API_KEY).
 * - NEVER exposed to React, Electron renderer, browser, frontend API responses, logs, or database.
 * - API keys are strictly redacted by logger and error normalizers.
 * - Model identifier is dynamically resolved from AI_MODEL / settings.
 * - Robust error, timeout, rate-limit, empty response, and streaming handling.
 * - Never fabricates a response if Gemini is unavailable: returns safe application-level notices.
 * - Raw provider errors/stack traces are never surfaced to the user.
 */

import { GoogleGenAI } from '@google/genai';
import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  ProviderAvailability,
} from './types.ts';
import { normalizeAIError, AIError } from './errors.ts';
import { logger } from '../logger.ts';
import { redactSecretsForLogs } from '../security/sanitizer.ts';
import { buildSystemInstruction } from './prompts.ts';
import { getConfig } from '../../config/settings.ts';

export class GeminiProvider extends AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini AI';

  private client: GoogleGenAI | null = null;
  private cachedKey: string | null = null;

  /**
   * Resolves the target model identifier without hard-coding.
   * Priority:
   * 1. Explicit request model
   * 2. process.env.AI_MODEL
   * 3. Configured model in settings.ts
   * Normalizes shorthand aliases (e.g., 'gemini-3.8' -> 'gemini-3.8-flash')
   * to exact identifiers supported by the Gemini API.
   */
  public resolveModelName(modelName?: string): string {
    const configured = modelName || process.env.AI_MODEL || getConfig().model;
    if (!configured) return 'gemini-3.8-flash';

    const clean = configured.trim();
    const lower = clean.toLowerCase();

    // Map family shorthand strings to supported API endpoints
    if (
      lower === 'gemini-3.8' ||
      lower === 'gemini-3.8-flash' ||
      lower === 'gemini-3.6' ||
      lower === 'gemini-2.5' ||
      lower === 'gemini-2.5-flash' ||
      lower === 'gemini-2.0-flash' ||
      lower === 'gemini-1.5-flash'
    ) {
      return 'gemini-3.6-flash';
    }

    return clean;
  }

  /**
   * Injects a mock client for isolated testing without network access or real keys.
   */
  public setMockClient(mockClient: any | null): void {
    this.client = mockClient;
    this.cachedKey = mockClient ? 'MOCK_KEY_FOR_TEST' : null;
  }

  /**
   * Lazily initializes and returns the GoogleGenAI client.
   * Reads GEMINI_API_KEY strictly from backend environment.
   * Guarantees that missing keys do not crash server boot.
   */
  private getClient(): GoogleGenAI {
    if (this.client && this.cachedKey === 'MOCK_KEY_FOR_TEST') {
      return this.client;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('MISSING_API_KEY: GEMINI_API_KEY is not configured on the server.');
    }

    if (!this.client || this.cachedKey !== apiKey) {
      this.cachedKey = apiKey;
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'personal-ai-assistant/0.2.0',
          },
        },
      });
    }

    return this.client;
  }

  /**
   * Performs a non-throwing availability check.
   */
  public async checkAvailability(): Promise<ProviderAvailability> {
    if (this.client && this.cachedKey === 'MOCK_KEY_FOR_TEST') {
      return { available: true };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return {
        available: false,
        reason: 'GEMINI_API_KEY is not configured in server environment.',
      };
    }
    return { available: true };
  }

  /**
   * Formats the AIRequest history and prompt into Gemini SDK contents format.
   * Enforces alternating user/model turns as required by the Gemini API.
   */
  public buildContents(request: AIRequest): Array<{ role: string; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // 1. Process prior history turns if provided
    if (request.history && request.history.length > 0) {
      for (const msg of request.history) {
        if (msg.role === 'system') continue;
        const role = msg.role === 'assistant' ? 'model' : 'user';

        // Merge adjacent turns of the same role if any
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${msg.content}`;
        } else {
          contents.push({
            role,
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    // 2. Append the active prompt as the latest user turn
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      if (!contents[contents.length - 1].parts[0].text.includes(request.prompt)) {
        contents[contents.length - 1].parts[0].text += `\n${request.prompt}`;
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: request.prompt }],
      });
    }

    return contents;
  }

  /**
   * Generates a complete conversational response with timeout and safety guarantees.
   */
  public async generateResponse(request: AIRequest): Promise<AIResponse> {
    const config = getConfig();
    const model = this.resolveModelName(request.model || config.model);
    const timeoutMs = config.ai_timeout_ms || 25000;
    const systemInstruction = request.systemInstruction || buildSystemInstruction(request.context?.memoryContext);

    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const ai = this.getClient();
      const contents = this.buildContents(request);

      logger.info('GeminiProvider', `Dispatching AI request to Gemini (${model})`);

      const responsePromise = ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: request.temperature ?? config.temperature ?? 0.7,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`TIMEOUT: Request to Gemini timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      const replyText = response?.text?.trim() || '';

      // Validate non-empty response
      if (!replyText) {
        throw new Error('EMPTY_RESPONSE: Gemini returned an empty response.');
      }

      logger.info('GeminiProvider', `Successfully received ${replyText.length} chars from ${model}`);

      return {
        text: replyText,
        provider: this.id,
        model,
        isOffline: false,
      };
    } catch (err: unknown) {
      return this.handleError(err, model);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Generates a streaming conversational response via AsyncIterable.
   */
  public async *generateStream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const config = getConfig();
    const model = this.resolveModelName(request.model || config.model);
    const systemInstruction = request.systemInstruction || buildSystemInstruction(request.context?.memoryContext);

    try {
      const ai = this.getClient();
      const contents = this.buildContents(request);

      logger.info('GeminiProvider', `Starting streaming AI request to Gemini (${model})`);

      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: request.temperature ?? config.temperature ?? 0.7,
        },
      });

      let emittedAnyText = false;

      for await (const chunk of responseStream) {
        const text = chunk?.text || '';
        if (text.trim()) {
          emittedAnyText = true;
          yield {
            textChunk: text,
            isDone: false,
          };
        }
      }

      if (!emittedAnyText) {
        throw new Error('EMPTY_RESPONSE: Gemini stream returned no content.');
      }

      yield {
        textChunk: '',
        isDone: true,
      };
    } catch (err: unknown) {
      const errorResponse = this.handleError(err, model);
      yield {
        textChunk: errorResponse.text,
        isDone: true,
        error: errorResponse.warnings?.[0],
      };
    }
  }

  /**
   * Transforms raw API, network, or SDK errors into sanitized, honest, user-friendly AIResponse objects.
   * Leverages structured AIError taxonomy and NEVER outputs raw keys or stack traces.
   */
  private handleError(err: unknown, model: string): AIResponse {
    const aiErr: AIError = normalizeAIError(err, this.name);
    logger.error('GeminiProvider', `AI Error [${aiErr.code}]: ${aiErr.message}`);

    return {
      text: aiErr.userMessage,
      provider: this.id,
      model,
      isOffline: true,
      warnings: [`${aiErr.code}: ${redactSecretsForLogs(aiErr.message)}`],
    };
  }
}

export const geminiProvider = new GeminiProvider();
