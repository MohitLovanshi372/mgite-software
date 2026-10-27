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
import { voiceEngine } from '../core/voice/voiceEngine.ts';
import { notificationEngine } from '../core/notifications/notificationEngine.ts';

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

// 10. Voice Engine Endpoints (Phase 3 Voice Engine & ElevenLabs TTS Router)
apiRouter.get('/api/voice/status', async (_req: Request, res: Response) => {
  try {
    const config = voiceEngine.getConfig();
    const state = voiceEngine.getState();
    const permissionState = voiceEngine.getPermissionState();
    const session = voiceEngine.getCurrentSession();
    const voices = await voiceEngine.getAvailableVoices();
    const ttsRouter = voiceEngine.getTTSRouter();
    const hasElevenLabsKey = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0 && !process.env.ELEVENLABS_API_KEY.includes('your_'));
    const isElevenLabsConfigured = hasElevenLabsKey && !(ttsRouter as any)?.getElevenLabsProvider?.()?.getHasAuthError?.();
    const hasFishAudioKey = Boolean(process.env.FISH_AUDIO_API_KEY && process.env.FISH_AUDIO_API_KEY.trim().length > 0 && !process.env.FISH_AUDIO_API_KEY.includes('your_'));
    const isFishAudioConfigured = hasFishAudioKey && !(ttsRouter as any)?.getFishAudioProvider?.()?.getHasAuthError?.();
    const elSettings = (ttsRouter as any)?.getElevenLabsSettings?.() || {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.65,
      pitch: 0.72,
    };
    const fishSettings = (ttsRouter as any)?.getFishAudioSettings?.() || {
      model: config.fishaudio_model || 's2.1-pro',
      reference_id: config.fishaudio_reference_id || (ttsRouter as any)?.getFishAudioProvider?.()?.getReferenceId?.() || '817eba7f1aea469f9802326568d427b9',
      latency: config.fishaudio_latency || 'normal',
      format: config.fishaudio_format || 'mp3',
    };

    res.json({
      enabled: config.enabled,
      state,
      permissionState,
      autoSpeak: config.auto_speak,
      preferredLanguage: config.preferred_language,
      voiceId: config.voice_id,
      speechRate: config.speech_rate,
      speechVolume: config.speech_volume,
      interruptSpeech: config.interrupt_speech,
      ttsProvider: 'fishaudio',
      elevenlabsModel: config.elevenlabs_model || 'eleven_multilingual_v2',
      elevenlabsConfigured: isElevenLabsConfigured, // Boolean only - ELEVENLABS_API_KEY is NEVER exposed
      elevenlabsAuthError: Boolean((ttsRouter as any)?.getElevenLabsProvider?.()?.getHasAuthError?.()),
      elevenlabsSettings: elSettings,
      fishaudioConfigured: isFishAudioConfigured, // Boolean only - FISH_AUDIO_API_KEY is NEVER exposed
      fishaudioKeyConfigured: hasFishAudioKey,
      fishaudioKeyMasked: hasFishAudioKey ? 'sk-fish-••••••••••••' : '',
      fishaudioAuthError: Boolean((ttsRouter as any)?.getFishAudioProvider?.()?.getHasAuthError?.()),
      fishaudioCreditError: Boolean((ttsRouter as any)?.getFishAudioProvider?.()?.getHasCreditError?.()),
      fishaudioModel: config.fishaudio_model || 's2.1-pro',
      fishaudioReferenceId: config.fishaudio_reference_id || (ttsRouter as any)?.getFishAudioProvider?.()?.getReferenceId?.() || '817eba7f1aea469f9802326568d427b9',
      fishaudioLatency: config.fishaudio_latency || 'normal',
      fishaudioFormat: config.fishaudio_format || 'mp3',
      fishaudioSettings: fishSettings,
      stability: elSettings.stability,
      style: elSettings.style,
      similarityBoost: elSettings.similarity_boost,
      pitch: elSettings.pitch,
      availableVoices: voices,
      activeSessionId: session?.id || null,
      lastDispatchResult: ttsRouter?.getLastDispatchResult() || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/voice/config', (req: Request, res: Response) => {
  try {
    const updated = voiceEngine.updateVoiceConfig(req.body);
    updateConfig({ voice: { ...getConfig().voice, ...req.body } });
    const ttsRouter = voiceEngine.getTTSRouter();
    if (ttsRouter) {
      if (req.body.tts_provider) ttsRouter.setProvider(req.body.tts_provider);
      if (req.body.voice_id) ttsRouter.setVoice(req.body.voice_id);
      if (req.body.speech_rate) ttsRouter.setRate(req.body.speech_rate);
      if (req.body.speech_volume) ttsRouter.setVolume(req.body.speech_volume);
      if (req.body.stability !== undefined && (ttsRouter as any).setStability) {
        (ttsRouter as any).setStability(Number(req.body.stability));
      }
      if (req.body.style !== undefined && (ttsRouter as any).setStyle) {
        (ttsRouter as any).setStyle(Number(req.body.style));
      }
      if (req.body.similarity_boost !== undefined && (ttsRouter as any).setSimilarityBoost) {
        (ttsRouter as any).setSimilarityBoost(Number(req.body.similarity_boost));
      }
      if (req.body.pitch !== undefined && (ttsRouter as any).setPitch) {
        (ttsRouter as any).setPitch(Number(req.body.pitch));
      }
      // Fish Audio parameters
      const fishProvider = (ttsRouter as any).getFishAudioProvider?.();
      if (fishProvider) {
        if (req.body.fishaudio_api_key !== undefined) {
          const rawKey = String(req.body.fishaudio_api_key || '').trim();
          if (rawKey) {
            fishProvider.setApiKey(rawKey);
            process.env.FISH_AUDIO_API_KEY = rawKey;
          }
        }
        if (req.body.fishaudio_model) fishProvider.setModel(req.body.fishaudio_model);
        if (req.body.fishaudio_reference_id) {
          fishProvider.setReferenceId(req.body.fishaudio_reference_id);
          process.env.FISH_AUDIO_REFERENCE_ID = req.body.fishaudio_reference_id;
        }
        if (req.body.fishaudio_latency) fishProvider.setLatency(req.body.fishaudio_latency);
        if (req.body.fishaudio_format) fishProvider.setFormat(req.body.fishaudio_format);
      }
    }
    logger.info('VoiceAPI', 'Voice configuration updated with Fish Audio parameters.');
    res.json({
      ...updated,
      elevenlabsSettings: (ttsRouter as any)?.getElevenLabsSettings?.() || null,
      fishaudioSettings: (ttsRouter as any)?.getFishAudioSettings?.() || null,
      fishaudioConfigured: Boolean((ttsRouter as any)?.getFishAudioProvider?.()?.isAvailable?.()),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated Fish Audio Connection & Key Verification Endpoint
apiRouter.post('/api/voice/verify-fishaudio', async (req: Request, res: Response) => {
  try {
    const ttsRouter = voiceEngine.getTTSRouter();
    const fishProvider = (ttsRouter as any)?.getFishAudioProvider?.();
    const keyToTest = req.body.apiKey ? String(req.body.apiKey).trim() : (fishProvider?.getCleanApiKey?.() || process.env.FISH_AUDIO_API_KEY || '').trim();
    const refToTest = req.body.referenceId ? String(req.body.referenceId).trim() : (fishProvider?.getReferenceId?.() || '817eba7f1aea469f9802326568d427b9');

    if (!keyToTest) {
      res.json({
        success: false,
        verified: false,
        error: 'No Fish Audio API key provided or configured.',
      });
      return;
    }

    // Clean key if combined
    let cleanKey = keyToTest;
    if (cleanKey.includes(' ')) {
      const parts = cleanKey.split(/\s+/);
      cleanKey = parts.find((p: string) => p.startsWith('sk-') || p.length > 40) || parts[0];
    }

    const testRes = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Voice matrix verification ping.',
        reference_id: refToTest,
      }),
    });

    if (testRes.status === 200) {
      if (req.body.apiKey && fishProvider) {
        fishProvider.setApiKey(cleanKey);
        process.env.FISH_AUDIO_API_KEY = cleanKey;
      }
      res.json({
        success: true,
        verified: true,
        authValid: true,
        creditAvailable: true,
        status: 200,
        message: 'Fish Audio API key verified and operational. Cloud neural streaming is active.',
      });
      return;
    }

    if (testRes.status === 402) {
      if (req.body.apiKey && fishProvider) {
        fishProvider.setApiKey(cleanKey);
        process.env.FISH_AUDIO_API_KEY = cleanKey;
      }
      res.json({
        success: true,
        verified: true,
        authValid: true,
        creditAvailable: false,
        status: 402,
        message: 'Fish Audio API key is authenticated. Account credit balance is 0.00 (402). Local Jarvis Hindi voice synthesis is operating seamlessly.',
      });
      return;
    }

    if (testRes.status === 401 || testRes.status === 403) {
      res.json({
        success: false,
        verified: false,
        authValid: false,
        status: testRes.status,
        error: 'Invalid API token (401 Unauthorized). Please check your fish.audio API key.',
      });
      return;
    }

    const errText = await testRes.text().catch(() => '');
    res.json({
      success: false,
      verified: false,
      status: testRes.status,
      error: `Fish Audio responded with status ${testRes.status}: ${errText.slice(0, 120)}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Verification connection failed' });
  }
});

// Dedicated TTS Audio Synthesis Endpoint (Fish Audio & ElevenLabs Direct Output)
apiRouter.post('/api/voice/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, provider, voice_id, reference_id, model, latency, format, rate, volume } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS synthesis.' });
      return;
    }

    const ttsRouter = voiceEngine.getTTSRouter();
    const effectiveProvider = (provider === 'system' || provider === 'local') ? provider : 'fishaudio';

    if (effectiveProvider === 'fishaudio') {
      const fishProvider = ttsRouter?.getFishAudioProvider();
      if (!fishProvider || !fishProvider.isAvailable()) {
        const isAuthError = Boolean(fishProvider?.getHasAuthError());
        const isCreditError = Boolean(fishProvider?.getHasCreditError());
        res.json({
          success: true,
          provider: 'local',
          fallbackTriggered: true,
          creditExhausted: isCreditError,
          fallbackReason: isCreditError
            ? 'Fish Audio API credit is exhausted (402). Operating seamlessly with Jarvis Hindi voice synthesis.'
            : isAuthError
            ? 'Fish Audio token is invalid (401). Operating seamlessly with Jarvis Hindi voice synthesis.'
            : 'Fish Audio is operating via Jarvis Hindi voice synthesis.',
          text,
        });
        return;
      }

      try {
        const result = await fishProvider.synthesize(text, {
          referenceId: reference_id || voice_id,
          model,
          latency,
          rate: rate ? Number(rate) : undefined,
          volume: volume ? Number(volume) : undefined,
        });

        res.json({
          success: true,
          provider: 'fishaudio',
          text: result.text,
          model: result.model,
          referenceId: result.referenceId,
          format: result.format,
          audioBase64: result.audioBase64,
          contentType: result.format === 'wav' ? 'audio/wav' : 'audio/mpeg',
        });
        return;
      } catch (fishErr: any) {
        logger.warn(
          'VoiceAPI',
          `Fish Audio synthesis unavailable (${fishErr.message}). Graceful local fallback active.`
        );

        res.json({
          success: true,
          provider: 'local',
          fallbackTriggered: true,
          creditExhausted: Boolean(fishProvider?.getHasCreditError()),
          fallbackReason: fishErr.message || 'Fish Audio cloud synthesis error',
          text,
        });
        return;
      }
    }

    // Default speak fallback
    const result = await voiceEngine.speak(text, {
      voiceId: voice_id || reference_id,
      rate,
      volume,
    });

    res.json({
      success: true,
      provider: effectiveProvider,
      text,
      spoken: result.text,
    });
  } catch (err: any) {
    logger.warn('VoiceAPI', `Synthesis request handled with local fallback: ${err.message}`);
    res.json({
      success: true,
      provider: 'local',
      fallbackTriggered: true,
      fallbackReason: err.message,
      text: req.body?.text || '',
    });
  }
});

apiRouter.post('/api/voice/speak', async (req: Request, res: Response) => {
  try {
    const { text, voice_id, rate, volume, lang, provider, stability, style, similarity_boost, pitch } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS synthesis.' });
      return;
    }

    const ttsRouter = voiceEngine.getTTSRouter();
    if (ttsRouter) {
      if (provider) ttsRouter.setProvider(provider);
      if (stability !== undefined && (ttsRouter as any).setStability) {
        (ttsRouter as any).setStability(Number(stability));
      }
      if (style !== undefined && (ttsRouter as any).setStyle) {
        (ttsRouter as any).setStyle(Number(style));
      }
      if (similarity_boost !== undefined && (ttsRouter as any).setSimilarityBoost) {
        (ttsRouter as any).setSimilarityBoost(Number(similarity_boost));
      }
      if (pitch !== undefined && (ttsRouter as any).setPitch) {
        (ttsRouter as any).setPitch(Number(pitch));
      }
    }

    const result = await voiceEngine.speak(text, {
      voiceId: voice_id,
      rate,
      volume,
      lang,
      stability: stability !== undefined ? Number(stability) : undefined,
      style: style !== undefined ? Number(style) : undefined,
      similarityBoost: similarity_boost !== undefined ? Number(similarity_boost) : undefined,
      pitch: pitch !== undefined ? Number(pitch) : undefined,
    });

    const lastDispatch = ttsRouter?.getLastDispatchResult();

    res.json({
      ...result,
      dispatch: lastDispatch || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/voice/stop', (_req: Request, res: Response) => {
  voiceEngine.stopSpeaking();
  voiceEngine.stopListening();
  res.json({ success: true, state: voiceEngine.getState() });
});

// ==========================================
// Phase 4: Notification Intelligence & Privacy Shield Endpoints
// ==========================================

apiRouter.post('/api/notifications/process', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const result = await notificationEngine.processNotification(payload);
    res.json(result);
  } catch (err: any) {
    logger.error('NotificationAPI', `Failed to process notification: ${err.message}`);
    res.status(500).json({ error: 'Internal notification error' });
  }
});

apiRouter.get('/api/notifications/status', (_req: Request, res: Response) => {
  try {
    res.json({
      config: notificationEngine.getConfig(),
      telemetry: notificationEngine.telemetry,
      safeAuditLogs: notificationEngine.getSafeAuditLogs(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/notifications/config', (req: Request, res: Response) => {
  try {
    const updated = notificationEngine.updateConfig(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Phase 5: Persistent Tasks & Reminders API
// ==========================================

apiRouter.get('/api/tasks', (_req: Request, res: Response) => {
  try {
    const tasks = memoryEngine.listTasks();
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/tasks', (req: Request, res: Response) => {
  try {
    const task = memoryEngine.createTask(req.body);
    logger.info('TasksAPI', `Created persistent task: ${task.title} (${task.id})`);
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/api/tasks/:id', (req: Request, res: Response) => {
  try {
    const updated = memoryEngine.updateTask(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/api/tasks/:id', (req: Request, res: Response) => {
  try {
    const updated = memoryEngine.updateTask(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/api/tasks/:id', (req: Request, res: Response) => {
  try {
    const deleted = memoryEngine.deleteTask(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/reminders', (_req: Request, res: Response) => {
  try {
    const reminders = memoryEngine.listReminders();
    res.json(reminders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/reminders', (req: Request, res: Response) => {
  try {
    const reminder = memoryEngine.createReminder(req.body);
    logger.info('RemindersAPI', `Created persistent reminder: ${reminder.title} (${reminder.id})`);
    res.json(reminder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/api/reminders/:id', (req: Request, res: Response) => {
  try {
    const updated = memoryEngine.updateReminder(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/api/reminders/:id', (req: Request, res: Response) => {
  try {
    const updated = memoryEngine.updateReminder(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/api/reminders/:id', (req: Request, res: Response) => {
  try {
    const deleted = memoryEngine.deleteReminder(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



