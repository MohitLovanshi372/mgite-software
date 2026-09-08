/**
 * Automated Test Suite: Step 3 — Gemini Provider Integration
 *
 * Verifies all 8 mandatory Step 3 requirements:
 * 1. GeminiProvider initialization
 * 2. Missing API key handling
 * 3. Invalid API key handling
 * 4. Successful mocked Gemini response (standard + streaming)
 * 5. Gemini timeout handling
 * 6. Rate limit handling
 * 7. Empty response handling
 * 8. API key is never written to logs (verified in memory and on disk)
 *
 * All tests use isolated mock/fake credentials.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { GeminiProvider } from '../core/ai/geminiProvider.ts';
import { logger } from '../core/logger.ts';
import { updateConfig } from '../config/settings.ts';

export async function runStep3GeminiProviderTests(): Promise<void> {
  console.log('--- Running Step 3 Gemini Provider Integration Tests ---');

  const originalEnvKey = process.env.GEMINI_API_KEY;
  const originalAiModel = process.env.AI_MODEL;

  try {
    // -------------------------------------------------------------
    // Test 1: GeminiProvider initialization
    // -------------------------------------------------------------
    console.log('Test 1: GeminiProvider initialization');
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();
    assert.strictEqual(provider.id, 'gemini', 'Provider id must be "gemini"');
    assert.strictEqual(provider.name, 'Google Gemini AI', 'Provider name must match');

    // Model name resolution checks
    const resolvedDefault = provider.resolveModelName();
    assert.ok(resolvedDefault.length > 0, 'Must resolve a valid default model');

    const resolved38 = provider.resolveModelName('gemini-3.8');
    assert.strictEqual(resolved38, 'gemini-3.6-flash', 'Must resolve gemini-3.8 to exact API identifier');

    const resolvedCustom = provider.resolveModelName('custom-enterprise-gemini');
    assert.strictEqual(resolvedCustom, 'custom-enterprise-gemini', 'Must support custom configured model');

    console.log('  ✓ GeminiProvider initializes without crashing when key is absent, resolves model dynamically.');

    // -------------------------------------------------------------
    // Test 2: Missing API key handling
    // -------------------------------------------------------------
    console.log('Test 2: Missing API key handling');
    delete process.env.GEMINI_API_KEY;
    provider.setMockClient(null);

    const availability = await provider.checkAvailability();
    assert.strictEqual(availability.available, false, 'Availability must be false when key is missing');
    assert.ok(availability.reason?.includes('not configured'), 'Reason must indicate key is not configured');

    const missingKeyResp = await provider.generateResponse({
      prompt: 'Hello testing missing key',
      model: 'gemini-3.8-flash',
    });
    assert.ok(
      missingKeyResp.text.includes('AI service is currently unavailable') ||
        missingKeyResp.text.includes('Gemini API key configure nahi hai'),
      'Must return safe application-level error'
    );
    assert.strictEqual(missingKeyResp.isOffline, true, 'Must flag response as offline fallback');
    assert.ok(missingKeyResp.warnings?.[0]?.includes('MISSING_API_KEY'), 'Warning must reference MISSING_API_KEY');

    console.log('  ✓ Missing API key returns safe application-level message without crashing.');

    // -------------------------------------------------------------
    // Test 3: Invalid API key handling
    // -------------------------------------------------------------
    console.log('Test 3: Invalid API key handling');
    const fakeMockClientInvalidKey = {
      models: {
        generateContent: async () => {
          throw new Error('API_KEY_INVALID: The provided API key is expired or invalid.');
        },
      },
    };
    provider.setMockClient(fakeMockClientInvalidKey);

    const invalidKeyResp = await provider.generateResponse({
      prompt: 'Test invalid key prompt',
      model: 'gemini-3.8-flash',
    });
    assert.ok(
      invalidKeyResp.text.includes('AI service is currently unavailable') ||
        invalidKeyResp.text.includes('invalid hai'),
      'Must return safe application-level error'
    );
    assert.strictEqual(invalidKeyResp.isOffline, true, 'Must mark response as offline fallback');
    assert.ok(invalidKeyResp.warnings?.[0]?.includes('INVALID_API_KEY'), 'Warning must indicate INVALID_API_KEY');

    console.log('  ✓ Invalid API key caught and sanitized into safe application error.');

    // -------------------------------------------------------------
    // Test 4: Successful mocked Gemini response
    // -------------------------------------------------------------
    console.log('Test 4: Successful mocked Gemini response (standard + streaming)');
    const fakeSuccessClient = {
      models: {
        generateContent: async (args: any) => {
          assert.ok(args.contents.length > 0, 'Must pass structured contents');
          return {
            text: 'I am JARVIS, fully operational and connected to Google Gemini.',
          };
        },
        generateContentStream: async function* () {
          yield { text: 'I am ' };
          yield { text: 'JARVIS ' };
          yield { text: 'streaming.' };
        },
      },
    };
    provider.setMockClient(fakeSuccessClient);

    const successResp = await provider.generateResponse({
      prompt: 'Who are you?',
      model: 'gemini-3.8-flash',
    });
    assert.strictEqual(
      successResp.text,
      'I am JARVIS, fully operational and connected to Google Gemini.',
      'Must return generated text accurately'
    );
    assert.strictEqual(successResp.provider, 'gemini');
    assert.strictEqual(successResp.isOffline, false);

    // Test streaming
    let streamedFullText = '';
    for await (const chunk of provider.generateStream({ prompt: 'Stream test', model: 'gemini-3.8-flash' })) {
      streamedFullText += chunk.textChunk;
    }
    assert.strictEqual(streamedFullText, 'I am JARVIS streaming.', 'Streaming chunks must concatenate accurately');

    console.log('  ✓ Successful mocked response and streaming executed cleanly.');

    // -------------------------------------------------------------
    // Test 5: Gemini timeout handling
    // -------------------------------------------------------------
    console.log('Test 5: Gemini timeout handling');
    // Configure a short timeout for deterministic testing
    updateConfig({ ai_timeout_ms: 50 });

    const fakeHangingClient = {
      models: {
        generateContent: async () => {
          // Intentionally delay longer than 50ms
          await new Promise((resolve) => setTimeout(resolve, 300));
          return { text: 'Late response that should not be returned' };
        },
      },
    };
    provider.setMockClient(fakeHangingClient);

    const timeoutResp = await provider.generateResponse({
      prompt: 'Long query causing timeout',
      model: 'gemini-3.8-flash',
    });
    assert.ok(
      timeoutResp.text.includes('AI service is currently unavailable') ||
        timeoutResp.text.includes('timed out'),
      'Must return safe application-level message on timeout'
    );
    assert.strictEqual(timeoutResp.isOffline, true);
    assert.ok(timeoutResp.warnings?.[0]?.includes('NETWORK_TIMEOUT'), 'Warning must indicate timeout code');

    // Restore standard timeout
    updateConfig({ ai_timeout_ms: 25000 });
    console.log('  ✓ Timeout safely caught and reported as safe application error.');

    // -------------------------------------------------------------
    // Test 6: Rate limit handling
    // -------------------------------------------------------------
    console.log('Test 6: Rate limit handling');
    const fakeRateLimitedClient = {
      models: {
        generateContent: async () => {
          throw new Error('RESOURCE_EXHAUSTED: Rate limit exceeded (HTTP 429). Quota exhausted.');
        },
      },
    };
    provider.setMockClient(fakeRateLimitedClient);

    const rateLimitResp = await provider.generateResponse({
      prompt: 'Query exceeding quota',
      model: 'gemini-3.8-flash',
    });
    assert.ok(
      rateLimitResp.text.includes('AI service is currently unavailable') ||
        rateLimitResp.text.includes('rate limit'),
      'Must return safe application-level message on rate limit'
    );
    assert.strictEqual(rateLimitResp.isOffline, true);
    assert.ok(rateLimitResp.warnings?.[0]?.includes('RATE_LIMIT_EXCEEDED'), 'Warning must indicate rate limit');

    console.log('  ✓ Rate limit safely handled with retryable diagnostic warning.');

    // -------------------------------------------------------------
    // Test 7: Empty response handling
    // -------------------------------------------------------------
    console.log('Test 7: Empty response handling');
    const fakeEmptyClient = {
      models: {
        generateContent: async () => {
          return { text: '   ' }; // Whitespace-only or empty response
        },
      },
    };
    provider.setMockClient(fakeEmptyClient);

    const emptyResp = await provider.generateResponse({
      prompt: 'Prompt returning empty',
      model: 'gemini-3.8-flash',
    });
    assert.ok(
      emptyResp.text.includes('AI service is currently unavailable') ||
        emptyResp.text.includes('Empty response'),
      'Must return safe application-level message on empty response'
    );
    assert.strictEqual(emptyResp.isOffline, true);
    assert.ok(emptyResp.warnings?.[0]?.includes('EMPTY_RESPONSE'), 'Warning must indicate EMPTY_RESPONSE');

    console.log('  ✓ Empty response detected and sanitized into safe application-level error.');

    // -------------------------------------------------------------
    // Test 8: API key is never written to logs
    // -------------------------------------------------------------
    console.log('Test 8: API key is never written to logs');
    const mockFakeApiKey = 'AIzaSyMockTestKey1234567890abcdefghij';

    // Attempt to log error and message containing the fake API key
    logger.error('GeminiProvider', `Failed with key ${mockFakeApiKey} in query`);
    logger.info('GeminiProvider', `API request header x-goog-api-key: ${mockFakeApiKey}`);

    // Inspect in-memory logs
    const memoryLogs = logger.getLogs();
    const leakedInMemory = memoryLogs.some((entry) => entry.message.includes(mockFakeApiKey));
    assert.strictEqual(leakedInMemory, false, 'Fake API key must NEVER appear in memory logs');

    const redactedFound = memoryLogs.some((entry) => entry.message.includes('[REDACTED_GEMINI_KEY]'));
    assert.strictEqual(redactedFound, true, 'Log messages must contain [REDACTED_GEMINI_KEY] masking');

    // Inspect on-disk log file
    const logPath = path.resolve(process.cwd(), 'logs', 'assistant.log');
    if (fs.existsSync(logPath)) {
      const diskContent = fs.readFileSync(logPath, 'utf8');
      assert.strictEqual(
        diskContent.includes(mockFakeApiKey),
        false,
        'Fake API key must NEVER appear in disk logs'
      );
    }

    console.log('  ✓ API keys are strictly redacted from memory and disk logs.');

  } finally {
    // Restore environment
    if (originalEnvKey !== undefined) {
      process.env.GEMINI_API_KEY = originalEnvKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    if (originalAiModel !== undefined) {
      process.env.AI_MODEL = originalAiModel;
    } else {
      delete process.env.AI_MODEL;
    }
  }

  console.log('✓ All Step 3 Gemini Provider Integration tests passed successfully!\n');
}
