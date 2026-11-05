/**
 * AI Brain Core Interfaces & Types (Phase 2 Step 2: Backend AI Architecture)
 *
 * Provides strictly typed, provider-independent abstractions for:
 * 1. AIProvider interface
 * 2. AIRequest type
 * 3. AIResponse type
 * 4. AIMessage type
 * 5. AIContext type
 * 6. AI Router interface
 * 7. Provider availability & streaming abstractions
 *
 * Crucial security guarantees:
 * - Decouples LLM execution from specific vendors (Gemini, local models, etc.)
 * - Prevents raw API keys or internal credentials from leaking into request/response shapes
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  name?: string;
}

export interface AIContext {
  conversationId: string;
  messages: AIMessage[];
  systemInstruction: string;
  memoryContext?: string;
  memoryData?: string;
  maxContextMessages: number;
}

export interface AIRequest {
  prompt: string;
  context?: AIContext;
  model: string;
  temperature?: number;
  stream?: boolean;
  systemInstruction?: string;
  memoryData?: string;
  history?: AIMessage[];
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export type AvatarEmotion =
  | 'neutral'
  | 'friendly'
  | 'happy'
  | 'thinking'
  | 'confused'
  | 'serious'
  | 'surprised'
  | 'excited'
  | 'concerned'
  | 'sad';

export type AvatarGesture =
  | 'nod'
  | 'tilt'
  | 'wave'
  | 'hand_open'
  | 'thinking'
  | 'welcome'
  | 'acknowledgement'
  | 'none';

export type AvatarStateName =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'HAPPY'
  | 'SAD'
  | 'SURPRISED'
  | 'CONFUSED'
  | 'SERIOUS'
  | 'EXCITED'
  | 'ERROR';

export interface AvatarInstruction {
  emotion: AvatarEmotion;
  gesture: AvatarGesture;
  speaking: boolean;
  state: AvatarStateName;
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  finishReason?: string;
  tokensUsed?: number;
  isOffline?: boolean;
  warnings?: string[];
  toolRequests?: FutureToolRequest[];
  emotion?: AvatarEmotion;
  gesture?: AvatarGesture;
  speaking?: boolean;
  state?: AvatarStateName;
  avatar?: AvatarInstruction;
}

export interface AIStreamChunk {
  textChunk: string;
  isDone: boolean;
  finishReason?: string;
  error?: string;
}

export interface FutureToolRequest {
  type: 'tool_request';
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ProviderAvailability {
  available: boolean;
  reason?: string;
}

/**
 * 1. AIProvider Interface
 * Base contract that every LLM provider adapter must implement.
 */
export abstract class AIProvider {
  abstract readonly id: string;
  abstract readonly name: string;

  /**
   * Generates a complete conversational response.
   */
  abstract generateResponse(request: AIRequest): Promise<AIResponse>;

  /**
   * Generates a streaming conversational response via AsyncIterable.
   */
  abstract generateStream(request: AIRequest): AsyncIterable<AIStreamChunk>;

  /**
   * Checks whether the provider credentials and network connectivity are available.
   */
  abstract checkAvailability(): Promise<ProviderAvailability>;
}

/**
 * 6. AI Router Interface
 */
export interface AIModelRouter {
  routeRequest(taskType: 'general' | 'coding' | 'sensitive' | 'offline'): AIProvider;
  registerProvider(provider: AIProvider): void;
  getProvider(providerId: string): AIProvider | undefined;
  listProviders(): string[];
}

export * from './errors.ts';
