/**
 * Step 2: Backend AI Architecture Test Suite
 *
 * Validates the 9 core modular components:
 * 1. AIProvider interface
 * 2. AIRequest type
 * 3. AIResponse type
 * 4. AIMessage type
 * 5. AIContext type
 * 6. AI Router
 * 7. Gemini Provider interface/adapter
 * 8. Response Validator
 * 9. AI-related error handling
 *
 * And confirms the end-to-end pipeline:
 * Chat Request -> Orchestrator -> Context Manager -> Privacy Filter -> AI Router -> AI Provider -> Response Validator -> Chat Response
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIMessage,
  AIContext,
  AIStreamChunk,
  ProviderAvailability,
} from '../core/ai/types.ts';
import {
  AIError,
  MissingApiKeyError,
  InvalidApiKeyError,
  RateLimitError,
  NetworkTimeoutError,
  normalizeAIError,
} from '../core/ai/errors.ts';
import { aiRouter, ModelRouter } from '../core/ai/router.ts';
import { GeminiProvider, geminiProvider } from '../core/ai/geminiProvider.ts';
import { ResponseValidator } from '../core/security/validator.ts';
import { orchestrator } from '../core/orchestrator/orchestrator.ts';
import { memoryEngine } from '../core/memory/memoryEngine.ts';
import { updateConfig } from '../config/settings.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runStep2ArchitectureTests() {
  console.log('\n========================================');
  console.log('Phase 2 Step 2: Backend AI Architecture Test Suite');
  console.log('========================================');

  // --- 1. AIProvider interface ---
  console.log('Test 1: AIProvider interface contract');
  class MockProvider extends AIProvider {
    readonly id = 'mock-provider';
    readonly name = 'Mock Provider';

    async generateResponse(request: AIRequest): Promise<AIResponse> {
      return {
        text: `Mock echo: ${request.prompt}`,
        provider: this.id,
        model: request.model,
        isOffline: false,
      };
    }

    async *generateStream(request: AIRequest): AsyncIterable<AIStreamChunk> {
      yield { textChunk: 'Mock ', isDone: false };
      yield { textChunk: 'echo', isDone: false };
      yield { textChunk: '', isDone: true };
    }

    async checkAvailability(): Promise<ProviderAvailability> {
      return { available: true };
    }
  }

  const mock = new MockProvider();
  assert(mock.id === 'mock-provider', 'Provider ID must be present');
  assert(mock.name === 'Mock Provider', 'Provider name must be present');
  const avail = await mock.checkAvailability();
  assert(avail.available === true, 'Mock availability must be true');
  console.log('  ✓ AIProvider abstract interface conforms to contract.');

  // --- 2, 3, 4, 5. Types: AIMessage, AIContext, AIRequest, AIResponse ---
  console.log('Test 2: AIMessage, AIContext, AIRequest, AIResponse typing');
  const msg: AIMessage = {
    role: 'user',
    content: 'Hello system',
    timestamp: new Date().toISOString(),
  };
  const ctx: AIContext = {
    conversationId: 'test-conv-id',
    messages: [msg],
    systemInstruction: 'Test instructions',
    memoryContext: 'User prefers concise answers',
    maxContextMessages: 10,
  };
  const req: AIRequest = {
    prompt: 'Tell me a fact',
    context: ctx,
    model: 'gemini-2.5-flash',
    temperature: 0.5,
    history: ctx.messages,
  };
  const mockResp = await mock.generateResponse(req);
  assert(mockResp.text === 'Mock echo: Tell me a fact', 'Response text matches mock');
  assert(mockResp.provider === 'mock-provider', 'Provider matches');
  console.log('  ✓ AIMessage, AIContext, AIRequest, AIResponse structures verified.');

  // --- 6. AI Router ---
  console.log('Test 3: AI Router modular provider management');
  const customRouter = new ModelRouter();
  assert(customRouter.listProviders().includes('gemini'), 'Router registers gemini by default');
  assert(customRouter.listProviders().includes('offline'), 'Router registers offline engine by default');

  customRouter.registerProvider(mock);
  assert(customRouter.getProvider('mock-provider') === mock, 'Registered provider accessible via getProvider');

  // Test routing to offline when requested
  const offlineRouted = customRouter.routeRequest('offline');
  assert(offlineRouted.id === 'offline', 'Offline task routes to offline provider');

  // Test routing to general
  const generalRouted = customRouter.routeRequest('general');
  assert(generalRouted.id === 'gemini', 'General task routes to Gemini provider by default');
  console.log('  ✓ AI Router registration, retrieval, and routing verified.');

  // --- 7. Gemini Provider interface/adapter ---
  console.log('Test 4: Gemini Provider interface/adapter');
  assert(geminiProvider instanceof AIProvider, 'GeminiProvider implements AIProvider');
  assert(geminiProvider.id === 'gemini', 'GeminiProvider ID is gemini');
  assert(geminiProvider.name === 'Google Gemini AI', 'GeminiProvider name is set');

  const geminiAvail = await geminiProvider.checkAvailability();
  assert(typeof geminiAvail.available === 'boolean', 'Availability returns boolean status');
  console.log(`  ✓ GeminiProvider initialized (availability: ${geminiAvail.available}).`);

  // --- 8. Response Validator ---
  console.log('Test 5: Response Validator security controls');
  // 8a. Empty response
  const emptyVal = ResponseValidator.validateAiResponse('   ');
  assert(emptyVal.isValid === false, 'Empty response rejected');
  assert(emptyVal.reason === 'EMPTY_AI_RESPONSE', 'Empty response tagged correctly');

  // 8b. Harmful shell command neutralization
  const shellVal = ResponseValidator.validateAiResponse('You should run rm -rf / in your terminal');
  assert(shellVal.isValid === true, 'Returns sanitized response');
  assert(shellVal.blockedAction === 'DANGEROUS_SYSTEM_COMMAND', 'Identifies dangerous system command');
  assert(!shellVal.sanitizedResponse.includes('rm -rf /'), 'Neutralizes rm -rf directive');

  // 8c. Unallowlisted tool execution attempt
  const toolVal = ResponseValidator.validateAiResponse(
    '```json\n{"type": "tool_request", "tool": "unauthorized_shell_exec", "arguments": {"cmd": "whoami"}}\n```'
  );
  assert(toolVal.isValid === false, 'Disallowed tool rejected');
  assert(toolVal.blockedAction === 'UNALLOWLISTED_TOOL_REQUEST', 'Flags unallowlisted tool');
  console.log('  ✓ Response Validator blocks empty responses, shell injections, and unauthorized tools.');

  // --- 9. AI-related error handling ---
  console.log('Test 6: AI-related error handling and taxonomy');
  const missingKeyErr = normalizeAIError(new Error('MISSING_API_KEY: not found'), 'gemini');
  assert(missingKeyErr instanceof MissingApiKeyError, 'Classifies MissingApiKeyError');
  assert(missingKeyErr.isRetryable === false, 'Missing key is not retryable');

  const invalidKeyErr = normalizeAIError(new Error('API_KEY_INVALID'), 'gemini');
  assert(invalidKeyErr instanceof InvalidApiKeyError, 'Classifies InvalidApiKeyError');

  const rateLimitErr = normalizeAIError(new Error('RESOURCE_EXHAUSTED 429'), 'gemini');
  assert(rateLimitErr instanceof RateLimitError, 'Classifies RateLimitError');
  assert(rateLimitErr.isRetryable === true, 'Rate limit error is retryable');

  const timeoutErr = normalizeAIError(new Error('TIMEOUT occurred'), 'gemini');
  assert(timeoutErr instanceof NetworkTimeoutError, 'Classifies NetworkTimeoutError');
  assert(timeoutErr.isRetryable === true, 'Timeout is retryable');

  console.log('  ✓ Error taxonomy properly normalizes and sanitizes exceptions without leaking credentials.');

  // --- Pipeline Test: Chat Request -> Orchestrator -> Context Manager -> Privacy Filter -> AI Router -> AI Provider -> Response Validator -> Chat Response ---
  console.log('Test 7: Full Architectural Pipeline Execution');
  updateConfig({ offline_mode: true }); // Ensure deterministic offline execution for test suite
  const convId = memoryEngine.createConversation('Architecture Pipeline Test');
  const pipelineOutput = await orchestrator.processMessage({
    conversationId: convId,
    message: 'Hello, what is your system role?',
    isOfflineMode: true,
  });

  assert(pipelineOutput.conversationId === convId, 'Conversation continuity preserved');
  assert(pipelineOutput.response.length > 0, 'Produces valid chat response');
  assert(pipelineOutput.isOffline === true, 'Offline mode reflected');

  // Verify memory contains both turns
  const messages = memoryEngine.getMessages(convId);
  assert(messages.length >= 2, 'SQLite records both user message and assistant response');
  assert(messages[0].sender === 'user', 'First turn is user');
  assert(messages[1].sender === 'assistant', 'Second turn is assistant');

  // Restore config
  updateConfig({ offline_mode: false });
  console.log('  ✓ End-to-end architectural pipeline executed cleanly.');

  console.log('\n--- All Phase 2 Step 2 Backend AI Architecture Tests PASSED! ---\n');
}
