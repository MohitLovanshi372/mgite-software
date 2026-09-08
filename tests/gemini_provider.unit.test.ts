/**
 * Unit Test Suite: GeminiProvider API Mocking, Missing Keys, Empty Responses & Log Redaction
 *
 * Specifically verifies:
 * 1. Mocking API responses (normal generation and streaming)
 * 2. Graceful handling of missing/empty API keys (no crashes, safe application-level errors)
 * 3. Graceful handling of empty or whitespace-only API responses
 * 4. Strict privacy enforcement: API keys and credentials are NEVER exposed in memory logs, disk logs, or responses
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { GeminiProvider } from '../core/ai/geminiProvider.ts';
import { logger } from '../core/logger.ts';
import { normalizeAIError } from '../core/ai/errors.ts';

export async function runGeminiProviderUnitTests(): Promise<void> {
  console.log('================================================================');
  console.log('GeminiProvider Unit Tests (Mocks, Missing Keys, Empty Responses & Logs)');
  console.log('================================================================\n');

  const originalEnvKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.AI_MODEL;

  try {
    const provider = new GeminiProvider();

    // =========================================================================
    // SECTION 1: Mocked API Responses
    // =========================================================================
    console.log('--- Section 1: Mocked API Responses ---');

    // 1.1 Standard successful mocked generation
    let capturedPayload: any = null;
    const mockSuccessClient = {
      models: {
        generateContent: async (args: any) => {
          capturedPayload = args;
          return {
            text: 'Hello! I am Gemini, assisting with privacy and high performance.',
          };
        },
        generateContentStream: async function* () {
          yield { text: 'Token 1 ' };
          yield { text: 'Token 2 ' };
          yield { text: 'Token 3' };
        },
      },
    };

    provider.setMockClient(mockSuccessClient);

    const response = await provider.generateResponse({
      prompt: 'Explain quantum computing in one sentence.',
      model: 'gemini-3.6-flash',
      temperature: 0.5,
      systemInstruction: 'You are a concise expert.',
      history: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello! How can I help?' },
      ],
    });

    assert.strictEqual(response.provider, 'gemini', 'Provider must be "gemini"');
    assert.strictEqual(response.isOffline, false, 'Standard response must not be flagged offline');
    assert.strictEqual(
      response.text,
      'Hello! I am Gemini, assisting with privacy and high performance.'
    );
    assert.ok(capturedPayload, 'Payload must be passed to generateContent');
    assert.strictEqual(capturedPayload.config.systemInstruction, 'You are a concise expert.');
    assert.strictEqual(capturedPayload.config.temperature, 0.5);
    assert.strictEqual(capturedPayload.contents.length, 3, 'History turns + current prompt');
    console.log('  ✓ Standard mocked response generates expected text and verifies structured payload.');

    // 1.2 Streaming mocked generation
    let streamedTokens = '';
    let chunkCount = 0;
    for await (const chunk of provider.generateStream({
      prompt: 'Stream test',
      model: 'gemini-3.6-flash',
    })) {
      if (!chunk.isDone) {
        streamedTokens += chunk.textChunk;
        chunkCount++;
      }
    }
    assert.strictEqual(streamedTokens, 'Token 1 Token 2 Token 3');
    assert.strictEqual(chunkCount, 3, 'Must receive all 3 stream chunks');
    console.log('  ✓ Mocked streaming yields all chunks accurately.');

    // =========================================================================
    // SECTION 2: Missing API Key Handling
    // =========================================================================
    console.log('\n--- Section 2: Missing & Empty API Key Handling ---');
    provider.setMockClient(null); // Reset mock client to test environment variable checks

    // 2.1 GEMINI_API_KEY is undefined/deleted
    delete process.env.GEMINI_API_KEY;

    const availUndefined = await provider.checkAvailability();
    assert.strictEqual(availUndefined.available, false);
    assert.ok(availUndefined.reason?.includes('not configured'));

    const respUndefined = await provider.generateResponse({
      prompt: 'Test when key is undefined',
      model: 'gemini-3.6-flash',
    });
    assert.strictEqual(respUndefined.isOffline, true);
    assert.ok(respUndefined.text.includes('AI service is currently unavailable'));
    assert.ok(respUndefined.warnings?.[0]?.includes('MISSING_API_KEY'));
    console.log('  ✓ Undefined GEMINI_API_KEY handled gracefully without crashing.');

    // 2.2 GEMINI_API_KEY is empty string ""
    process.env.GEMINI_API_KEY = '';
    const availEmpty = await provider.checkAvailability();
    assert.strictEqual(availEmpty.available, false);

    const respEmpty = await provider.generateResponse({
      prompt: 'Test when key is empty string',
      model: 'gemini-3.6-flash',
    });
    assert.strictEqual(respEmpty.isOffline, true);
    assert.ok(respEmpty.text.includes('AI service is currently unavailable'));
    console.log('  ✓ Empty string GEMINI_API_KEY handled gracefully.');

    // 2.3 GEMINI_API_KEY is whitespace only "   "
    process.env.GEMINI_API_KEY = '    ';
    const availWhitespace = await provider.checkAvailability();
    assert.strictEqual(availWhitespace.available, false);

    const respWhitespace = await provider.generateResponse({
      prompt: 'Test when key is whitespace only',
      model: 'gemini-3.6-flash',
    });
    assert.strictEqual(respWhitespace.isOffline, true);
    assert.ok(respWhitespace.text.includes('AI service is currently unavailable'));
    console.log('  ✓ Whitespace GEMINI_API_KEY handled gracefully.');

    // 2.4 Streaming with missing key
    delete process.env.GEMINI_API_KEY;
    const streamChunks: string[] = [];
    for await (const chunk of provider.generateStream({
      prompt: 'Streaming with missing key',
      model: 'gemini-3.6-flash',
    })) {
      if (chunk.textChunk) streamChunks.push(chunk.textChunk);
      if (chunk.isDone) {
        assert.ok(chunk.error?.includes('MISSING_API_KEY') || !chunk.error);
      }
    }
    assert.ok(
      streamChunks.some((s) => s.includes('AI service is currently unavailable')),
      'Stream must yield safe fallback notice when key is missing'
    );
    console.log('  ✓ Streaming with missing key completes gracefully with safe error message.');

    // =========================================================================
    // SECTION 3: Empty Response Handling
    // =========================================================================
    console.log('\n--- Section 3: Empty Response Handling ---');

    // 3.1 Empty string ""
    const mockEmptyStringClient = {
      models: {
        generateContent: async () => ({ text: '' }),
      },
    };
    provider.setMockClient(mockEmptyStringClient);

    const respEmptyStr = await provider.generateResponse({
      prompt: 'Expect empty string',
      model: 'gemini-3.6-flash',
    });
    assert.strictEqual(respEmptyStr.isOffline, true);
    assert.ok(respEmptyStr.text.includes('AI service is currently unavailable'));
    assert.ok(respEmptyStr.warnings?.[0]?.includes('EMPTY_RESPONSE'));
    console.log('  ✓ Empty string response caught and normalized to safe error.');

    // 3.2 Whitespace-only string "   \n\t  "
    const mockWhitespaceClient = {
      models: {
        generateContent: async () => ({ text: '   \n\t  ' }),
      },
    };
    provider.setMockClient(mockWhitespaceClient);

    const respWhitespaceResp = await provider.generateResponse({
      prompt: 'Expect whitespace text',
      model: 'gemini-3.6-flash',
    });
    assert.strictEqual(respWhitespaceResp.isOffline, true);
    assert.ok(respWhitespaceResp.text.includes('AI service is currently unavailable'));
    assert.ok(respWhitespaceResp.warnings?.[0]?.includes('EMPTY_RESPONSE'));
    console.log('  ✓ Whitespace-only response detected and rejected.');

    // 3.3 Null/undefined text property in response object
    const mockNullTextClient = {
      models: {
        generateContent: async () => ({ text: undefined }),
      },
    };
    provider.setMockClient(mockNullTextClient);

    const respNullText = await provider.generateResponse({
      prompt: 'Expect undefined text property',
      model: 'gemini-3.6-flash',
    });
    assert.strictEqual(respNullText.isOffline, true);
    assert.ok(respNullText.text.includes('AI service is currently unavailable'));
    assert.ok(respNullText.warnings?.[0]?.includes('EMPTY_RESPONSE'));
    console.log('  ✓ Undefined response text property caught safely.');

    // 3.4 Empty stream (yields no text chunks)
    const mockEmptyStreamClient = {
      models: {
        generateContentStream: async function* () {
          yield { text: '' };
          yield { text: '   ' };
        },
      },
    };
    provider.setMockClient(mockEmptyStreamClient);

    let emptyStreamErrorFound = false;
    for await (const chunk of provider.generateStream({
      prompt: 'Stream empty test',
      model: 'gemini-3.6-flash',
    })) {
      if (chunk.textChunk.includes('AI service is currently unavailable')) {
        emptyStreamErrorFound = true;
      }
    }
    assert.strictEqual(emptyStreamErrorFound, true, 'Empty stream must deliver safe error notice');
    console.log('  ✓ Empty stream handled gracefully with safe application error.');

    // =========================================================================
    // SECTION 4: Secret Protection in Logs & Outputs
    // =========================================================================
    console.log('\n--- Section 4: Secret Protection in Logs & Outputs ---');

    const runId = Date.now().toString();
    const fakeSecretKey = `AIzaSyMockKey_${runId}_sec9876543210`;
    const fakeBearerToken = `Bearer eyJhbGciOi_${runId}_token_fakepayload_fakesig`;

    // 4.1 Error containing API key is sanitized by normalizeAIError
    const rawError = new Error(`Request failed using key ${fakeSecretKey} with ${fakeBearerToken}`);
    const normalizedErr = normalizeAIError(rawError, 'gemini');

    // The userMessage must never contain the key or token
    assert.strictEqual(
      normalizedErr.userMessage.includes(fakeSecretKey),
      false,
      'userMessage must never contain API key'
    );
    assert.strictEqual(
      normalizedErr.userMessage.includes(fakeBearerToken),
      false,
      'userMessage must never contain bearer token'
    );
    console.log('  ✓ Error normalizer strips raw credentials from user messages.');

    // 4.2 Logging messages containing secrets must redact in memory buffer
    logger.error('GeminiProvider', `Failed connection with API_KEY=${fakeSecretKey}`);
    logger.warn('GeminiProvider', `Auth header rejected: ${fakeBearerToken}`);
    logger.info('GeminiProvider', `Debug key AIzaSyMockSecretKey9876543210zyxwvutsrq trace`);

    const inMemoryLogs = logger.getLogs();
    const memoryLeakFound = inMemoryLogs.some(
      (entry) =>
        entry.message.includes(fakeSecretKey) || entry.message.includes(fakeBearerToken)
    );
    assert.strictEqual(memoryLeakFound, false, 'No raw secrets in in-memory logs');

    const redactionPresent = inMemoryLogs.some(
      (entry) =>
        entry.message.includes('[REDACTED_GEMINI_KEY]') ||
        entry.message.includes('[REDACTED_LOG_SECRET]')
    );
    assert.strictEqual(redactionPresent, true, 'Redaction markers must be present in logs');
    console.log('  ✓ In-memory logs strictly redact API keys and bearer tokens.');

    // 4.3 Log file on disk must never contain the fake secret key
    const logFilePath = path.resolve(process.cwd(), 'logs', 'assistant.log');
    if (fs.existsSync(logFilePath)) {
      const diskContent = fs.readFileSync(logFilePath, 'utf8');
      assert.strictEqual(
        diskContent.includes(fakeSecretKey),
        false,
        'Disk logs must NEVER contain API keys'
      );
      assert.strictEqual(
        diskContent.includes(fakeBearerToken),
        false,
        'Disk logs must NEVER contain Bearer tokens'
      );
      console.log('  ✓ Disk logs verify 0 secret leakage.');
    }

    // 4.4 Provider handleError never returns raw key in response object
    provider.setMockClient({
      models: {
        generateContent: async () => {
          throw new Error(`Google API 403 Forbidden with ${fakeSecretKey}`);
        },
      },
    });

    const errorResp = await provider.generateResponse({
      prompt: 'Trigger error containing secret',
      model: 'gemini-3.6-flash',
    });

    assert.strictEqual(errorResp.text.includes(fakeSecretKey), false, 'Response text must not contain key');
    if (errorResp.warnings) {
      for (const warning of errorResp.warnings) {
        assert.strictEqual(warning.includes(fakeSecretKey), false, 'Warnings must not contain key');
      }
    }
    console.log('  ✓ Provider response and warning payloads contain 0 secret keys.');

  } finally {
    // Restore environment
    if (originalEnvKey !== undefined) {
      process.env.GEMINI_API_KEY = originalEnvKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    if (originalModel !== undefined) {
      process.env.AI_MODEL = originalModel;
    } else {
      delete process.env.AI_MODEL;
    }
  }

  console.log('\n================================================================');
  console.log('✓ All GeminiProvider Unit Tests Passed Successfully (100%)');
  console.log('================================================================\n');
}

// Support standalone execution via tsx: npx tsx tests/gemini_provider.unit.test.ts
const isDirectRun = process.argv[1]?.endsWith('gemini_provider.unit.test.ts');
if (isDirectRun) {
  runGeminiProviderUnitTests().catch((err) => {
    console.error('❌ Unit test suite failure:', err);
    process.exit(1);
  });
}
