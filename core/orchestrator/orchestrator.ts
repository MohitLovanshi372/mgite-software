/**
 * Core Assistant Orchestrator (Phase 2 Step 2: Backend AI Architecture)
 *
 * Implements the canonical pipeline:
 * Chat Request
 * → Orchestrator
 * → Context Manager
 * → Privacy Filter
 * → AI Router
 * → AI Provider
 * → Response Validator
 * → Chat Response
 *
 * Supports standard complete responses and real-time streaming tokens.
 */

import { ContextManager } from '../conversation/contextManager.ts';
import { MemoryPolicy } from '../memory/memoryPolicy.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';
import { aiRouter } from '../ai/router.ts';
import { AIRequest } from '../ai/types.ts';
import { ResponseValidator } from '../security/validator.ts';
import { memoryEngine } from '../memory/memoryEngine.ts';
import { logger } from '../logger.ts';
import { getConfig } from '../../config/settings.ts';
import { IntentDetector } from '../intent/intentDetector.ts';
import { IntentResult } from '../intent/types.ts';
import { AvatarInstruction, AvatarEmotion, AvatarGesture, AvatarStateName } from '../ai/types.ts';
import { AvatarInstructionValidator } from '../avatar/avatarInstruction.ts';

export interface OrchestratorInput {
  message: string;
  conversationId?: string;
  isOfflineMode?: boolean;
}

export interface OrchestratorOutput {
  conversationId: string;
  response: string;
  provider: string;
  model: string;
  isOffline: boolean;
  intent?: IntentResult;
  warnings?: string[];
  tokensUsed?: number;
  timestamp: string;
  avatar?: AvatarInstruction;
  emotion?: AvatarEmotion;
  gesture?: AvatarGesture;
  state?: AvatarStateName;
}

export type OrchestratorStreamEvent =
  | { type: 'token'; token: string }
  | {
      type: 'done';
      conversationId: string;
      model: string;
      provider: string;
      isOffline: boolean;
      intent?: IntentResult;
      warnings?: string[];
      timestamp: string;
      avatar?: AvatarInstruction;
      emotion?: AvatarEmotion;
      gesture?: AvatarGesture;
      state?: AvatarStateName;
    }
  | { type: 'error'; error: string };

export class AssistantOrchestrator {
  /**
   * Processes a user chat request with unified parameter object (supporting input_mode and legacy signatures).
   */
  public async processUserMessage(options: {
    conversation_id?: string;
    user_message: string;
    input_mode?: 'text' | 'voice';
    isOfflineMode?: boolean;
    enforce_offline?: boolean;
  }): Promise<{
    conversation_id: string;
    content: string;
    intent?: IntentResult;
    isOffline: boolean;
    state: 'COMPLETED' | 'ERROR';
    provider: string;
    model: string;
    warnings?: string[];
  }> {
    const isOffline = options.enforce_offline ?? options.isOfflineMode;
    const result = await this.processMessage({
      message: options.user_message,
      conversationId: options.conversation_id,
      isOfflineMode: isOffline,
    });
    return {
      conversation_id: result.conversationId,
      content: result.response,
      intent: result.intent,
      isOffline: result.isOffline,
      state: 'COMPLETED',
      provider: result.provider,
      model: result.model,
      warnings: result.warnings,
    };
  }

  /**
   * Processes a user chat request through the full architectural pipeline.
   */
  public async processMessage(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const config = getConfig();
    const warnings: string[] = [];

    // Ensure conversation exists in SQLite
    let convId = input.conversationId;
    if (!convId) {
      const summary = input.message.length > 25 ? input.message.slice(0, 25) + '...' : input.message;
      convId = memoryEngine.createConversation(summary || 'New Conversation');
    }

    // Step 1: Privacy Filter (Deterministic local detection, masks credentials, checks OTP guard)
    const privacyResult = PrivacyFilter.filterInput(input.message);
    if (privacyResult.hadSensitiveData) {
      warnings.push(`Input contained sensitive data (${privacyResult.detectedTypes.join(', ')}), protected by Privacy Filter.`);
    }

    // Strict OTP & Sensitive Data Shield: Abort external transmission immediately
    if (privacyResult.shouldAbortExternalCall || privacyResult.action === 'BLOCK') {
      const notice =
        privacyResult.userNotice ||
        "I can't send sensitive security information to the AI service.";

      // For OTP: Delete temporary raw content, NEVER store real OTP in permanent memory
      if (privacyResult.classification === 'OTP') {
        memoryEngine.addMessage(convId, 'user', '[OTP REDACTED]');
        memoryEngine.addMessage(convId, 'assistant', notice);
      } else {
        memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
        memoryEngine.addMessage(convId, 'assistant', notice);
      }

      const otpIntent = IntentDetector.detectIntent(input.message);

      return {
        conversationId: convId,
        response: notice,
        provider: 'privacy-shield',
        model: 'local-security-boundary',
        isOffline: true,
        intent: otpIntent,
        warnings: ['Sensitive authentication data suppressed by Privacy Shield.'],
        timestamp: new Date().toISOString(),
      };
    }

    // Step 2: Context Manager (Loads recent history turns & active memory with character budget)
    const aiContext = ContextManager.buildContext(convId, privacyResult.cleanText);

    // Step 2.5: Intent Detection & Risk Classification (Phase 2 - Step 6)
    const intentResult = IntentDetector.detectIntent(privacyResult.cleanText, {
      history: aiContext.messages,
      isOfflineMode: input.isOfflineMode ?? config.offline_mode,
    });
    logger.info(
      'Orchestrator',
      `Detected intent: ${intentResult.intent} (confidence: ${intentResult.confidence}, strategy: ${intentResult.responseStrategy}, risk: ${intentResult.riskLevel})`
    );

    // Step 2.6: Evaluate Response Strategy
    if (intentResult.responseStrategy === 'REFUSE_UNSAFE_ACTION') {
      const refuseNotice = 'Main sensitive information jaise passwords, PIN ya OTPs process ya store nahi kar sakta.';
      memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
      memoryEngine.addMessage(convId, 'assistant', refuseNotice);

      return {
        conversationId: convId,
        response: refuseNotice,
        provider: 'privacy-policy',
        model: 'local-security-boundary',
        isOffline: true,
        intent: intentResult,
        warnings: ['Sensitive action refused by security policy.'],
        timestamp: new Date().toISOString(),
      };
    }

    if (intentResult.responseStrategy === 'ASK_CLARIFICATION') {
      const clarifyNotice = intentResult.clarificationQuestion || 'Kal kya karna hai? Kripya thoda detail batayein.';
      memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
      memoryEngine.addMessage(convId, 'assistant', clarifyNotice);

      return {
        conversationId: convId,
        response: clarifyNotice,
        provider: 'intent-clarification',
        model: 'local-rules-engine',
        isOffline: true,
        intent: intentResult,
        timestamp: new Date().toISOString(),
      };
    }

    if (intentResult.responseStrategy === 'REQUEST_CONFIRMATION') {
      const confirmNotice = `Yeh ek high-risk action hai (${intentResult.reasoning || 'Sensitive system operation'}). Kripya pehle confirm karein.`;
      memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
      memoryEngine.addMessage(convId, 'assistant', confirmNotice);

      return {
        conversationId: convId,
        response: confirmNotice,
        provider: 'risk-guard',
        model: 'local-policy-engine',
        isOffline: true,
        intent: intentResult,
        warnings: ['High-risk action requires confirmation before execution.'],
        timestamp: new Date().toISOString(),
      };
    }

    // Step 3: Memory Policy (Handles explicit memory save & deletion commands)
    const memoryPolicyResult = MemoryPolicy.evaluate(privacyResult.cleanText);
    if (memoryPolicyResult.isHandled) {
      const responseText = memoryPolicyResult.response || 'Action completed.';
      memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
      memoryEngine.addMessage(convId, 'assistant', responseText);

      return {
        conversationId: convId,
        response: responseText,
        provider: 'memory-engine',
        model: 'local-sqlite',
        isOffline: true,
        intent: intentResult,
        warnings: memoryPolicyResult.isBlocked
          ? ['Sensitive credential blocked from memory storage.']
          : undefined,
        timestamp: new Date().toISOString(),
      };
    }

    // Record sanitized user message in SQLite
    memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);

    // Step 4: AI Router (Selects provider based on task context and network mode)
    const isForcedOffline = input.isOfflineMode ?? config.offline_mode;
    let provider = aiRouter.routeRequest(isForcedOffline ? 'offline' : 'general');
    let isOffline = isForcedOffline || provider.id === 'offline';

    // Verify provider availability
    if (!isOffline) {
      const availability = await provider.checkAvailability();
      if (!availability.available) {
        logger.warn('Orchestrator', `Provider ${provider.id} unavailable: ${availability.reason}. Falling back to offline.`);
        warnings.push(`Cloud AI unavailable (${availability.reason || 'Missing credentials'}). Using offline engine.`);
        provider = aiRouter.routeRequest('offline');
        isOffline = true;
      }
    }

    // Step 4: AI Provider (Executes provider-independent request)
    const aiRequest: AIRequest = {
      prompt: privacyResult.cleanText,
      context: aiContext,
      model: config.model,
      temperature: config.temperature,
      systemInstruction: aiContext.systemInstruction,
      history: aiContext.messages,
    };

    let rawResponse = '';
    let usedProvider = provider.id;
    let usedModel = config.model;

    try {
      const result = await provider.generateResponse(aiRequest);
      rawResponse = result.text;
      usedProvider = result.provider;
      usedModel = result.model;
      isOffline = result.isOffline ?? isOffline;
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    } catch (err: unknown) {
      logger.error('Orchestrator', `AI Provider execution error: ${err}`);
      rawResponse = 'Abhi AI service available nahi hai. Main offline mode mein hoon.';
      usedProvider = 'offline';
      usedModel = 'fallback';
      isOffline = true;
      warnings.push('Error occurred during AI generation.');
    }

    // Step 5: Response Validator (Scans for unsafe shell directives, tool requests, size bounds)
    const validation = ResponseValidator.validateAiResponse(rawResponse);
    if (validation.blockedAction) {
      warnings.push(`Security notice: ${validation.reason}`);
    }

    // Persist Safe Assistant Response in SQLite
    memoryEngine.addMessage(convId, 'assistant', validation.sanitizedResponse);
    logger.info('Orchestrator', `Completed response for conversation ${convId}`);

    // Step 6: Chat Response
    const avatarInstruction = AvatarInstructionValidator.generateFromResponse(
      validation.sanitizedResponse,
      intentResult.intent
    );

    return {
      conversationId: convId,
      response: validation.sanitizedResponse,
      provider: usedProvider,
      model: usedModel,
      isOffline,
      intent: intentResult,
      warnings: warnings.length > 0 ? warnings : undefined,
      timestamp: new Date().toISOString(),
      avatar: avatarInstruction,
      emotion: avatarInstruction.emotion,
      gesture: avatarInstruction.gesture,
      state: avatarInstruction.state,
    };
  }

  /**
   * Processes a message through the pipeline and yields streaming events for real-time UI.
   */
  public async *processStream(input: OrchestratorInput): AsyncIterable<OrchestratorStreamEvent> {
    const config = getConfig();
    const warnings: string[] = [];

    // Ensure conversation exists
    let convId = input.conversationId;
    if (!convId) {
      const summary = input.message.length > 25 ? input.message.slice(0, 25) + '...' : input.message;
      convId = memoryEngine.createConversation(summary || 'New Conversation');
    }

    // Step 1: Privacy Filter (Deterministic local detection, masks credentials, checks OTP guard)
    const privacyResult = PrivacyFilter.filterInput(input.message);
    if (privacyResult.shouldAbortExternalCall || privacyResult.action === 'BLOCK') {
      const notice =
        privacyResult.userNotice ||
        "I can't send sensitive security information to the AI service.";

      // For OTP: Delete temporary raw content, NEVER store real OTP in permanent memory
      if (privacyResult.classification === 'OTP') {
        memoryEngine.addMessage(convId, 'user', '[OTP REDACTED]');
        memoryEngine.addMessage(convId, 'assistant', notice);
      } else {
        memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
        memoryEngine.addMessage(convId, 'assistant', notice);
      }

      const otpIntent = IntentDetector.detectIntent(input.message);

      yield { type: 'token', token: notice };
      yield {
        type: 'done',
        conversationId: convId,
        model: 'local-security-boundary',
        provider: 'privacy-shield',
        isOffline: true,
        intent: otpIntent,
        warnings: ['Sensitive authentication data suppressed by Privacy Shield.'],
        timestamp: new Date().toISOString(),
      };
      return;
    }

    // Step 2: Context Manager (Loads recent history turns & active memory with character budget)
    const aiContext = ContextManager.buildContext(convId, privacyResult.cleanText);

    // Step 2.5: Intent Detection & Risk Classification (Phase 2 - Step 6)
    const intentResult = IntentDetector.detectIntent(privacyResult.cleanText, {
      history: aiContext.messages,
      isOfflineMode: input.isOfflineMode ?? config.offline_mode,
    });

    if (intentResult.responseStrategy === 'REFUSE_UNSAFE_ACTION') {
      const refuseNotice = 'Main sensitive information jaise passwords, PIN ya OTPs process ya store nahi kar sakta.';
      memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
      memoryEngine.addMessage(convId, 'assistant', refuseNotice);

      yield { type: 'token', token: refuseNotice };
      yield {
        type: 'done',
        conversationId: convId,
        model: 'local-security-boundary',
        provider: 'privacy-policy',
        isOffline: true,
        intent: intentResult,
        warnings: ['Sensitive action refused by security policy.'],
        timestamp: new Date().toISOString(),
      };
      return;
    }

    if (intentResult.responseStrategy === 'ASK_CLARIFICATION') {
      const clarifyNotice = intentResult.clarificationQuestion || 'Kal kya karna hai? Kripya thoda detail batayein.';
      memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
      memoryEngine.addMessage(convId, 'assistant', clarifyNotice);

      yield { type: 'token', token: clarifyNotice };
      yield {
        type: 'done',
        conversationId: convId,
        model: 'local-rules-engine',
        provider: 'intent-clarification',
        isOffline: true,
        intent: intentResult,
        timestamp: new Date().toISOString(),
      };
      return;
    }

    if (intentResult.responseStrategy === 'REQUEST_CONFIRMATION') {
      const confirmNotice = `Yeh ek high-risk action hai (${intentResult.reasoning || 'Sensitive system operation'}). Kripya pehle confirm karein.`;
      memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
      memoryEngine.addMessage(convId, 'assistant', confirmNotice);

      yield { type: 'token', token: confirmNotice };
      yield {
        type: 'done',
        conversationId: convId,
        model: 'local-policy-engine',
        provider: 'risk-guard',
        isOffline: true,
        intent: intentResult,
        warnings: ['High-risk action requires confirmation before execution.'],
        timestamp: new Date().toISOString(),
      };
      return;
    }

    // Step 3: Memory Policy (Handles explicit memory save & deletion commands)
    const memoryPolicyResult = MemoryPolicy.evaluate(privacyResult.cleanText);
    if (memoryPolicyResult.isHandled) {
      const responseText = memoryPolicyResult.response || 'Action completed.';
      memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);
      memoryEngine.addMessage(convId, 'assistant', responseText);

      yield { type: 'token', token: responseText };
      yield {
        type: 'done',
        conversationId: convId,
        model: 'local-sqlite',
        provider: 'memory-engine',
        isOffline: true,
        intent: intentResult,
        warnings: memoryPolicyResult.isBlocked
          ? ['Sensitive credential blocked from memory storage.']
          : undefined,
        timestamp: new Date().toISOString(),
      };
      return;
    }

    // Record sanitized user message
    memoryEngine.addMessage(convId, 'user', privacyResult.cleanText);

    // Step 4: AI Router
    const isForcedOffline = input.isOfflineMode ?? config.offline_mode;
    let provider = aiRouter.routeRequest(isForcedOffline ? 'offline' : 'general');
    let isOffline = isForcedOffline || provider.id === 'offline';

    if (!isOffline) {
      const availability = await provider.checkAvailability();
      if (!availability.available) {
        warnings.push(`Cloud AI unavailable (${availability.reason || 'Missing credentials'}).`);
        provider = aiRouter.routeRequest('offline');
        isOffline = true;
      }
    }

    // Step 4: AI Provider (Streaming)
    const aiRequest: AIRequest = {
      prompt: privacyResult.cleanText,
      context: aiContext,
      model: config.model,
      temperature: config.temperature,
      systemInstruction: aiContext.systemInstruction,
      history: aiContext.messages,
      stream: true,
    };

    let accumulatedResponse = '';

    try {
      for await (const chunk of provider.generateStream(aiRequest)) {
        if (chunk.textChunk) {
          accumulatedResponse += chunk.textChunk;
          yield { type: 'token', token: chunk.textChunk };
        }
        if (chunk.error) {
          warnings.push(chunk.error);
        }
      }
    } catch (err: unknown) {
      const fallback = '\n\n[Abhi AI service available nahi hai. Main offline mode mein hoon.]';
      accumulatedResponse += fallback;
      yield { type: 'token', token: fallback };
    }

    // Step 5: Response Validator
    const validation = ResponseValidator.validateAiResponse(accumulatedResponse);
    memoryEngine.addMessage(convId, 'assistant', validation.sanitizedResponse);

    // Step 6: Final Done Event
    const avatarInstruction = AvatarInstructionValidator.generateFromResponse(
      validation.sanitizedResponse,
      intentResult.intent
    );

    yield {
      type: 'done',
      conversationId: convId,
      model: isOffline ? 'local-rules-engine' : config.model,
      provider: provider.id,
      isOffline,
      intent: intentResult,
      warnings: warnings.length > 0 ? warnings : undefined,
      timestamp: new Date().toISOString(),
      avatar: avatarInstruction,
      emotion: avatarInstruction.emotion,
      gesture: avatarInstruction.gesture,
      state: avatarInstruction.state,
    };
  }
}

export const orchestrator = new AssistantOrchestrator();
