/**
 * Node.js API Middleware Router
 * Mounts the Personal AI Assistant API endpoints on the local dev/production server.
 * Handles /health and /api/* using the core orchestrator, memory engine, and logger.
 */

import express, { Request, Response } from 'express';
import { orchestrator } from '../core/orchestrator/orchestrator.ts';
import { memoryEngine, SensitivityLevel } from '../core/memory/memoryEngine.ts';
import { logger, LogLevel } from '../core/logger.ts';
import { getConfig, updateConfig } from '../config/settings.ts';
import { GeminiProvider } from '../core/ai/geminiProvider.ts';
import { PrivacyFilter } from '../core/security/privacyFilter.ts';
import { IntentDetector } from '../core/intent/intentDetector.ts';
import { ProactivePolicy } from '../core/intent/proactivePolicy.ts';
import { ProactiveEvent } from '../core/intent/types.ts';

export const apiRouter = express();

apiRouter.use(express.json({ limit: '10mb' }));
apiRouter.use(express.urlencoded({ extended: true }));

// 1. Health Endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'personal-ai-assistant',
    version: '0.1.0',
  });
});

// 2. Status Endpoint
apiRouter.get('/api/status', async (_req: Request, res: Response) => {
  const config = getConfig();
  const gemini = new GeminiProvider();
  const availability = await gemini.checkAvailability();
  const stats = memoryEngine.getStats();

  res.json({
    status: availability.available && !config.offline_mode ? 'online' : 'offline',
    assistant_name: config.assistant_name,
    version: config.version,
    active_provider: config.default_provider,
    model: config.model,
    offline_mode_enforced: config.offline_mode,
    cloud_ai_available: availability.available,
    database: {
      type: 'SQLite (Node 22 DatabaseSync)',
      status: 'active',
      ...stats,
    },
    modules: config.modules,
  });
});

// 3. Chat Endpoint (Complete Response)
apiRouter.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversation_id, is_offline_mode } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message text is required and cannot be empty.' });
      return;
    }

    const output = await orchestrator.processMessage({
      message: message.trim(),
      conversationId: conversation_id,
      isOfflineMode: is_offline_mode,
    });

    res.json(output);
  } catch (err: any) {
    logger.error('API', `Chat endpoint error: ${err.message}`);
    res.status(500).json({
      error: 'An internal error occurred while processing your message.',
    });
  }
});

// 3b. Chat Streaming Endpoint (Server-Sent Events)
apiRouter.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const { message, conversation_id, is_offline_mode } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message text is required and cannot be empty.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stream = orchestrator.processStream({
      message: message.trim(),
      conversationId: conversation_id,
      isOfflineMode: is_offline_mode,
    });

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err: any) {
    logger.error('API', `Chat stream error: ${err.message}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal streaming error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  }
});

// 4. Conversations & History Endpoints
apiRouter.get(['/api/conversations', '/api/chat/conversations'], (_req: Request, res: Response) => {
  const conversations = memoryEngine.listConversations();
  res.json(conversations);
});

apiRouter.get(['/api/conversations/:id/messages', '/api/chat/history/:id'], (req: Request, res: Response) => {
  const messages = memoryEngine.getMessages(req.params.id);
  res.json(messages);
});

apiRouter.delete(['/api/conversations/:id', '/api/chat/history/:id'], (req: Request, res: Response) => {
  const deleted = memoryEngine.deleteConversation(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json({ deleted: true, id: req.params.id });
});

apiRouter.delete('/api/chat/history', (_req: Request, res: Response) => {
  const count = memoryEngine.clearConversationHistory();
  logger.info('MemoryAPI', `Conversation chat history cleared (${count} messages). Stored memories preserved.`);
  res.json({ success: true, deletedMessages: count, message: 'Conversation history cleared. Long-term memories preserved.' });
});

// 5. Memory Items (List, Create, Delete individual, Clear all memories)
apiRouter.get(['/api/memory', '/api/memories'], (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const items = memoryEngine.listMemoryItems(category);
  res.json(items);
});

apiRouter.post(['/api/memory', '/api/memories'], (req: Request, res: Response) => {
  const { content, key, value, category, sensitivity, type, confidence, source } = req.body;
  const rawContent = (content || value || key || '').trim();

  if (!rawContent) {
    res.status(400).json({ error: 'Memory content, key, or value is required.' });
    return;
  }

  // Privacy check on direct API injection as well
  const pCheck = PrivacyFilter.filterInput(rawContent);
  if (pCheck.action === 'BLOCK' || pCheck.classification === 'OTP' || pCheck.classification === 'CREDENTIAL') {
    res.status(400).json({
      error: 'Security Policy: Sensitive authentication credentials, passwords, or OTPs cannot be saved to memory.',
      isBlocked: true,
    });
    return;
  }

  const validSensitivities: SensitivityLevel[] = ['PUBLIC', 'NORMAL', 'PRIVATE', 'SENSITIVE'];
  const sens: SensitivityLevel = validSensitivities.includes(sensitivity) ? sensitivity : 'NORMAL';

  const id = memoryEngine.storeMemoryItem({
    content: rawContent,
    key: key || (rawContent.length > 30 ? rawContent.slice(0, 30) + '...' : rawContent),
    value: value || rawContent,
    category: category || 'general',
    sensitivity: sens,
    type: type || 'PREFERENCE',
    confidence: typeof confidence === 'number' ? confidence : 1.0,
    source: source || 'USER_EXPLICIT',
  });

  logger.info('MemoryAPI', `Stored memory item: ${id} [${sens}]`);
  res.json({
    id,
    content: rawContent,
    category: category || 'general',
    sensitivity: sens,
    type: type || 'PREFERENCE',
    source: source || 'USER_EXPLICIT',
  });
});

apiRouter.delete(['/api/memory/:id', '/api/memories/:id'], (req: Request, res: Response) => {
  const deleted = memoryEngine.deleteMemoryItem(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Memory item not found' });
    return;
  }
  res.json({ deleted: true, id: req.params.id });
});

apiRouter.delete(['/api/memory', '/api/memories'], (_req: Request, res: Response) => {
  const count = memoryEngine.clearMemories();
  logger.info('MemoryAPI', `All long-term memories cleared (${count} items). Chat history preserved.`);
  res.json({ success: true, deletedCount: count, message: 'All memory items cleared successfully.' });
});

// 6. Structured Logs
apiRouter.get('/api/logs', (req: Request, res: Response) => {
  const level = req.query.level as LogLevel | undefined;
  const limit = req.query.limit ? Math.min(200, parseInt(req.query.limit as string, 10)) : 100;
  const logs = logger.getLogs(level, limit);
  res.json(logs);
});

apiRouter.post('/api/logs/clear', (_req: Request, res: Response) => {
  logger.clear();
  res.json({ success: true, message: 'Logs cleared.' });
});

// 7. Configuration Settings & Aliases
apiRouter.get(['/api/config', '/api/settings'], (_req: Request, res: Response) => {
  res.json(getConfig());
});

apiRouter.post(['/api/config', '/api/settings'], (req: Request, res: Response) => {
  const updated = updateConfig(req.body);
  logger.info('ConfigAPI', 'Application configuration updated.');
  res.json(updated);
});

// 8. Intent Detection Endpoint (Inspector & Testing)
apiRouter.post('/api/intent/detect', (req: Request, res: Response) => {
  const { text, history } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text field is required.' });
    return;
  }
  const result = IntentDetector.detectIntent(text, { history });
  res.json(result);
});

// 9. Proactive Intelligence Policy Endpoint
apiRouter.post('/api/proactive/evaluate', (req: Request, res: Response) => {
  const event = req.body as ProactiveEvent;
  if (!event || !event.trigger || !event.title) {
    res.status(400).json({ error: 'Valid ProactiveEvent (trigger, title, content) is required.' });
    return;
  }
  const decision = ProactivePolicy.evaluateEvent(event);
  res.json(decision);
});

