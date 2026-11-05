/**
 * Abstract AI Provider Module
 * Re-exports canonical provider interfaces from core/ai/types.ts
 */

export { AIProvider } from './types.ts';
export type {
  AIMessage,
  AIContext,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  ProviderAvailability,
  AIModelRouter,
  FutureToolRequest,
} from './types.ts';
