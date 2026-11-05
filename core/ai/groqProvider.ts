/**
 * Groq AI Provider Adapter
 *
 * Acts as a fast backup provider for transient Gemini quota/rate-limit issues.
 * Reads GROQ_API_KEY and GROQ_MODEL strictly from the backend .env file.
 * NEVER exposes API keys to frontend code, logs, or repo state.
 */

import {
    AIProvider,
    AIRequest,
    AIResponse,
    AIStreamChunk,
    ProviderAvailability,
} from './types.ts';
import { normalizeAIError } from './errors.ts';
import { logger } from '../logger.ts';
import { redactSecretsForLogs } from '../security/sanitizer.ts';
import { buildSystemInstruction } from './prompts.ts';
import { getConfig } from '../../config/settings.ts';

const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';

export class GroqProvider extends AIProvider {
    readonly id = 'groq';
    readonly name = 'Groq AI';

    public resolveModelName(modelName?: string): string {
        const configured = modelName || process.env.GROQ_MODEL || getConfig().model || DEFAULT_GROQ_MODEL;
        const clean = configured?.trim();
        if (!clean) {
            return DEFAULT_GROQ_MODEL;
        }

        const lower = clean.toLowerCase();
        if (lower.includes('llama-3.1-8b-instant') || lower.includes('llama-3.1-8b') || lower.includes('llama-3.1')) {
            return 'llama-3.1-8b-instant';
        }
        return clean;
    }

    public checkAvailability(): Promise<ProviderAvailability> {
        const apiKey = (process.env.GROQ_API_KEY || '').trim();
        if (!apiKey) {
            return Promise.resolve({
                available: false,
                reason: 'GROQ_API_KEY is not configured in server environment.',
            });
        }
        return Promise.resolve({ available: true });
    }

    public buildMessages(request: AIRequest): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

        if (request.context?.systemInstruction || request.systemInstruction) {
            messages.push({
                role: 'system',
                content: request.systemInstruction || request.context?.systemInstruction || buildSystemInstruction(request.context?.memoryContext),
            });
        }

        if (request.history && request.history.length > 0) {
            for (const item of request.history) {
                if (item.role === 'system') continue;
                messages.push({
                    role: item.role === 'assistant' ? 'assistant' : 'user',
                    content: item.content,
                });
            }
        }

        messages.push({ role: 'user', content: request.prompt });
        return messages;
    }

    public async generateResponse(request: AIRequest): Promise<AIResponse> {
        const config = getConfig();
        const model = this.resolveModelName(request.model || config.model);
        const apiKey = (process.env.GROQ_API_KEY || '').trim();
        const systemInstruction = request.systemInstruction || buildSystemInstruction(request.context?.memoryContext);

        if (!apiKey) {
            const err = new Error('MISSING_API_KEY: GROQ_API_KEY is not configured on the server.');
            return this.handleError(err, model);
        }

        try {
            const messages = this.buildMessages({
                ...request,
                systemInstruction,
            });

            logger.info('GroqProvider', `Dispatching AI request to Groq (${model})`);

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: request.temperature ?? config.temperature ?? 0.7,
                    max_tokens: request.maxTokens ?? 600,
                    stream: false,
                }),
            });

            let payload: any = null;

            try {
                if (typeof response?.text === 'function') {
                    const rawText = await response.text();
                    payload = rawText ? JSON.parse(rawText) : null;
                } else if (typeof response?.json === 'function') {
                    payload = await response.json();
                }
            } catch {
                payload = null;
            }

            if (!response.ok) {
                const errorMessage = payload?.error?.message || payload?.message || `Groq API responded with status ${response.status}`;
                throw new Error(`GROQ_HTTP_${response.status}: ${errorMessage}`);
            }

            const replyText = payload?.choices?.[0]?.message?.content?.trim();
            if (!replyText) {
                throw new Error('EMPTY_RESPONSE: Groq returned an empty response.');
            }

            logger.info('GroqProvider', `Successfully received ${replyText.length} chars from ${model}`);

            return {
                text: replyText,
                provider: this.id,
                model,
                isOffline: false,
                tokensUsed: payload?.usage?.total_tokens,
            };
        } catch (err: unknown) {
            return this.handleError(err, model);
        }
    }

    public async *generateStream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        const response = await this.generateResponse(request);
        const chunks = response.text.split(/(\s+)/).filter(Boolean);

        if (chunks.length === 0) {
            yield {
                textChunk: response.text || 'AI service is currently unavailable. Groq response empty.',
                isDone: true,
                error: response.warnings?.[0] || 'EMPTY_RESPONSE',
            };
            return;
        }

        for (const chunk of chunks) {
            yield {
                textChunk: chunk,
                isDone: false,
            };
        }

        yield {
            textChunk: '',
            isDone: true,
        };
    }

    private handleError(err: unknown, model: string): AIResponse {
        const aiErr = normalizeAIError(err, this.name);
        logger.error('GroqProvider', `AI Error [${aiErr.code}]: ${redactSecretsForLogs(aiErr.message)}`);

        return {
            text: aiErr.userMessage,
            provider: this.id,
            model,
            isOffline: true,
            warnings: [`${aiErr.code}: ${redactSecretsForLogs(aiErr.message)}`],
        };
    }
}

export const groqProvider = new GroqProvider();
