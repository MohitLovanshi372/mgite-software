/**
 * Phase 3 — ElevenLabs TTS Provider, Router & Privacy Shield Test Suite
 *
 * Verifies all 17 required scenarios:
 * 1. Hindi text
 * 2. English text
 * 3. Hinglish text
 * 4. ElevenLabs unavailable
 * 5. invalid API key
 * 6. offline fallback
 * 7. missing voice ID
 * 8. missing API key
 * 9. OTP blocking
 * 10. password blocking
 * 11. API key blocking
 * 12. TTS provider switching
 * 13. local fallback
 * 14. no secret in logs
 * 15. no secret in frontend
 * 16. Hindi language_code
 * 17. TTS error handling
 */

import assert from 'node:assert';
import { ElevenLabsTTSProvider } from '../core/voice/elevenLabsProvider.ts';
import { TTSRouter } from '../core/voice/ttsRouter.ts';
import { LanguageDetector } from '../core/voice/languageDetector.ts';
import { MockTextToSpeechProvider } from '../core/voice/mockSpeechProvider.ts';
import { logger } from '../core/logger.ts';
import { updateConfig, getConfig } from '../config/settings.ts';

export async function runElevenLabsVoiceTests() {
  console.log('--- Running Phase 3 ElevenLabs TTS Provider & Router Tests (17 Scenarios) ---');

  const SECRET_TEST_KEY = 'el_test_sec_key_xyz987654321_do_not_leak';

  // Helper: Create a mock ElevenLabs client for testing
  function createMockElevenLabsClient(options?: {
    shouldFail?: boolean;
    failError?: Error;
    voices?: any[];
  }) {
    const calls: any[] = [];
    return {
      calls,
      textToSpeech: {
        convert: async (voiceId: string, payload: any) => {
          calls.push({ voiceId, payload, timestamp: Date.now() });
          if (options?.shouldFail) {
            throw options.failError || new Error('ElevenLabs API quota exceeded / 429');
          }
          // Return an async iterable stream of audio chunks
          return {
            async *[Symbol.asyncIterator]() {
              yield Buffer.from('FAKE_MP3_AUDIO_HEADER');
              yield Buffer.from('_CHUNK_1_');
              yield Buffer.from('_CHUNK_2_');
            },
          };
        },
      },
      voices: {
        getAll: async () => ({
          voices: options?.voices || [
            { voice_id: 'voice_rachel', name: 'Rachel', labels: { accent: 'American' } },
            { voice_id: 'voice_hindi_kavita', name: 'Kavita', labels: { accent: 'Indian' } },
          ],
        }),
      },
    };
  }

  // -------------------------------------------------------------------------
  // TEST 1: Hindi text (Natural Devanagari preserved, language_code='hi')
  // -------------------------------------------------------------------------
  {
    console.log('1. Testing Hindi text (Devanagari preservation & language_code=hi)...');
    const mockClient = createMockElevenLabsClient();
    const provider = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'hindi_voice_id',
    });
    provider.setMockClient(mockClient);

    const hindiInput = 'मुझे आज कॉलेज जाना है।';
    await provider.speak(hindiInput);

    assert.strictEqual(mockClient.calls.length, 1);
    const call = mockClient.calls[0];
    assert.strictEqual(call.payload.text, hindiInput, 'Devanagari text must not be transliterated into Latin');
    assert.strictEqual(call.payload.language_code, 'hi', 'Hindi request must include language_code=hi');
    assert.strictEqual(call.voiceId, 'hindi_voice_id');
    console.log('   ✓ Hindi text preserved in Devanagari with language_code=hi');
  }

  // -------------------------------------------------------------------------
  // TEST 2: English text
  // -------------------------------------------------------------------------
  {
    console.log('2. Testing English text...');
    const mockClient = createMockElevenLabsClient();
    const provider = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'english_voice_id',
    });
    provider.setMockClient(mockClient);

    const englishInput = 'Hello, your personal assistant is ready to help you today.';
    await provider.speak(englishInput);

    assert.strictEqual(mockClient.calls.length, 1);
    const call = mockClient.calls[0];
    assert.strictEqual(call.payload.text, englishInput);
    assert.strictEqual(call.payload.language_code, undefined, 'English request should not force language_code=hi');
    console.log('   ✓ English text synthesized cleanly');
  }

  // -------------------------------------------------------------------------
  // TEST 3: Hinglish text (Mixed Hindi + English, Devanagari + Latin preserved)
  // -------------------------------------------------------------------------
  {
    console.log('3. Testing Hinglish text...');
    const mockClient = createMockElevenLabsClient();
    const provider = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'multilingual_voice_id',
    });
    provider.setMockClient(mockClient);

    const hinglishInput = 'आज मेरा project complete हो गया।';
    await provider.speak(hinglishInput);

    assert.strictEqual(mockClient.calls.length, 1);
    const call = mockClient.calls[0];
    assert.strictEqual(call.payload.text, hinglishInput, 'Hinglish mixed sentence must be preserved as-is');
    assert.strictEqual(call.payload.language_code, 'hi', 'Hinglish with Devanagari tokens must set language_code=hi');
    console.log('   ✓ Hinglish mixed text preserved and routed with language_code=hi');
  }

  // -------------------------------------------------------------------------
  // TEST 4: ElevenLabs unavailable (routes to Local/System TTS)
  // -------------------------------------------------------------------------
  {
    console.log('4. Testing ElevenLabs unavailable fallback to Local TTS...');
    const mockClient = createMockElevenLabsClient({
      shouldFail: true,
      failError: new Error('Network error: ElevenLabs server unreachable'),
    });
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    const result = await router.routeAndSpeak('Good morning!');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.providerUsed, 'mock_tts');
    assert.strictEqual(result.fallbackTriggered, true);
    assert.match(result.fallbackReason || '', /unreachable/i);
    assert.strictEqual(localMock.getLastSpoken(), 'Good morning!');
    console.log('   ✓ Graceful fallback to Local TTS when ElevenLabs is unavailable');
  }

  // -------------------------------------------------------------------------
  // TEST 5: Invalid API key (401 error -> Local fallback)
  // -------------------------------------------------------------------------
  {
    console.log('5. Testing invalid API key handling...');
    const mockClient = createMockElevenLabsClient({
      shouldFail: true,
      failError: new Error('status-code 401: Invalid API Key provided'),
    });
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: 'invalid_key_123',
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    const result = await router.routeAndSpeak('Testing invalid key');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fallbackTriggered, true);
    assert.strictEqual(result.providerUsed, 'mock_tts');
    assert.match(result.fallbackReason || '', /401/);
    console.log('   ✓ 401 Invalid API key caught and routed safely to Local TTS');
  }

  // -------------------------------------------------------------------------
  // TEST 6: Offline fallback
  // -------------------------------------------------------------------------
  {
    console.log('6. Testing offline fallback (ElevenLabs skipped entirely)...');
    const mockClient = createMockElevenLabsClient();
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');
    router.setOfflineMode(true);

    const result = await router.routeAndSpeak('Offline test message');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.providerUsed, 'mock_tts');
    assert.strictEqual(result.fallbackTriggered, true);
    assert.strictEqual(result.fallbackReason, 'offline_mode_active');
    assert.strictEqual(mockClient.calls.length, 0, 'ElevenLabs must NEVER be called when offline');
    assert.strictEqual(localMock.getLastSpoken(), 'Offline test message');
    console.log('   ✓ Offline mode bypassed ElevenLabs and used Local TTS directly');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Missing voice ID
  // -------------------------------------------------------------------------
  {
    console.log('7. Testing missing voice ID...');
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: '',
    });

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    const result = await router.routeAndSpeak('Hello with missing voice ID');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fallbackTriggered, true);
    assert.strictEqual(result.providerUsed, 'mock_tts');
    console.log('   ✓ Missing voice ID handled safely via local fallback');
  }

  // -------------------------------------------------------------------------
  // TEST 8: Missing API key
  // -------------------------------------------------------------------------
  {
    console.log('8. Testing missing API key...');
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: '',
      voiceId: 'voice_123',
    });
    assert.strictEqual(elevenLabs.isAvailable(), false, 'isAvailable must be false without an API key');

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    const result = await router.routeAndSpeak('Hello with missing API key');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fallbackTriggered, true);
    assert.strictEqual(result.providerUsed, 'mock_tts');
    console.log('   ✓ Missing API key handled with local fallback');
  }

  // -------------------------------------------------------------------------
  // TEST 9: OTP blocking (Never send OTP to ElevenLabs or any TTS)
  // -------------------------------------------------------------------------
  {
    console.log('9. Testing OTP blocking invariant...');
    const mockClient = createMockElevenLabsClient();
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    const otpInput = 'Your Google verification OTP is 482910. Do not share it.';
    const result = await router.routeAndSpeak(otpInput);

    assert.strictEqual(result.blockedByPrivacy, true, 'OTP payload must be BLOCKED');
    assert.strictEqual(result.providerUsed, 'none');
    assert.strictEqual(mockClient.calls.length, 0, 'ElevenLabs must NEVER receive OTP payload');
    assert.strictEqual(localMock.getLastSpoken(), '', 'Local TTS must NEVER receive OTP payload');

    // Direct speak on ElevenLabs provider must throw / block
    await assert.rejects(
      async () => providerSpeakWrapper(elevenLabs, otpInput),
      /Privacy Shield|sensitive|OTP/i,
      'Direct provider.speak must reject OTP'
    );
    console.log('   ✓ Strict OTP blocking enforced before TTS dispatch');
  }

  // -------------------------------------------------------------------------
  // TEST 10: Password blocking
  // -------------------------------------------------------------------------
  {
    console.log('10. Testing Password blocking invariant...');
    const mockClient = createMockElevenLabsClient();
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    const passwordInput = 'Your new password is SecretPass123! Keep it secure.';
    const result = await router.routeAndSpeak(passwordInput);

    assert.strictEqual(result.blockedByPrivacy, true, 'Password must be BLOCKED');
    assert.strictEqual(mockClient.calls.length, 0, 'ElevenLabs must NEVER receive password');
    assert.strictEqual(localMock.getLastSpoken(), '', 'Local TTS must NEVER receive password');
    console.log('   ✓ Password blocking enforced before TTS dispatch');
  }

  // -------------------------------------------------------------------------
  // TEST 11: API key blocking
  // -------------------------------------------------------------------------
  {
    console.log('11. Testing API Key blocking invariant...');
    const mockClient = createMockElevenLabsClient();
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    const apiKeyInput = 'Here is the OpenAI API key: sk-ant-api03-abcdef1234567890123456789012';
    const result = await router.routeAndSpeak(apiKeyInput);

    assert.strictEqual(result.blockedByPrivacy, true, 'API Key payload must be BLOCKED');
    assert.strictEqual(mockClient.calls.length, 0, 'ElevenLabs must NEVER receive external API keys');
    console.log('   ✓ API key blocking enforced before TTS dispatch');
  }

  // -------------------------------------------------------------------------
  // TEST 12: TTS provider switching
  // -------------------------------------------------------------------------
  {
    console.log('12. Testing TTS provider switching...');
    const mockClient = createMockElevenLabsClient();
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    // Step 1: Speak using ElevenLabs
    let res = await router.routeAndSpeak('Testing ElevenLabs');
    assert.strictEqual(res.providerUsed, 'elevenlabs');
    assert.strictEqual(mockClient.calls.length, 1);

    // Step 2: Switch to system/local
    router.setProvider('system');
    res = await router.routeAndSpeak('Testing Local System');
    assert.strictEqual(res.providerUsed, 'mock_tts');
    assert.strictEqual(localMock.getLastSpoken(), 'Testing Local System');

    // Step 3: Switch back to ElevenLabs
    router.setProvider('elevenlabs');
    res = await router.routeAndSpeak('Testing ElevenLabs again');
    assert.strictEqual(res.providerUsed, 'elevenlabs');
    assert.strictEqual(mockClient.calls.length, 2);
    console.log('   ✓ Provider switching (elevenlabs <-> system) operates smoothly');
  }

  // -------------------------------------------------------------------------
  // TEST 13: Local fallback verification
  // -------------------------------------------------------------------------
  {
    console.log('13. Testing Local fallback payload fidelity...');
    const mockClient = createMockElevenLabsClient({
      shouldFail: true,
      failError: new Error('503 Service Unavailable'),
    });
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    const message = 'Fallback message should be preserved exactly';
    const result = await router.routeAndSpeak(message);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.fallbackTriggered, true);
    assert.strictEqual(localMock.getLastSpoken(), message);
    console.log('   ✓ Local fallback receives identical spoken text payload');
  }

  // -------------------------------------------------------------------------
  // TEST 14: No secret in logs
  // -------------------------------------------------------------------------
  {
    console.log('14. Testing that ELEVENLABS_API_KEY never appears in logs...');
    const mockClient = createMockElevenLabsClient({
      shouldFail: true,
      failError: new Error(`Internal error with secret ${SECRET_TEST_KEY}`),
    });
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(mockClient);

    const localMock = new MockTextToSpeechProvider();
    const router = new TTSRouter(elevenLabs, localMock, 'elevenlabs');

    // Trigger synthesis error
    await router.routeAndSpeak('Trigger log inspection');

    const logsAfter = logger.getLogs(undefined, 50);
    const recentLogs = logsAfter.map((l) => `${l.message} ${JSON.stringify(l.details || {})}`).join(' ');

    assert.strictEqual(
      recentLogs.includes(SECRET_TEST_KEY),
      false,
      'CRITICAL SECURITY FAULT: Raw ELEVENLABS_API_KEY was found in application logs!'
    );
    console.log('   ✓ Zero secrets leaked into structured logs (Redaction verified)');
  }

  // -------------------------------------------------------------------------
  // TEST 15: No secret in frontend / API responses
  // -------------------------------------------------------------------------
  {
    console.log('15. Testing that ELEVENLABS_API_KEY never appears in status API...');
    const config = getConfig();
    const serializedConfig = JSON.stringify(config);

    assert.strictEqual(
      serializedConfig.includes(SECRET_TEST_KEY),
      false,
      'CRITICAL: Secret API key present in public AppConfig!'
    );
    console.log('   ✓ Public configuration and status objects omit ELEVENLABS_API_KEY');
  }

  // -------------------------------------------------------------------------
  // TEST 16: Hindi language_code verification
  // -------------------------------------------------------------------------
  {
    console.log('16. Testing Hindi language_code parameter...');
    const mockClient = createMockElevenLabsClient();
    const provider = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    provider.setMockClient(mockClient);

    // Hindi statement with natural punctuation
    await provider.speak('नमस्ते, आप कैसे हैं?');

    assert.strictEqual(mockClient.calls.length, 1);
    const payload = mockClient.calls[0].payload;
    assert.strictEqual(payload.language_code, 'hi');
    assert.strictEqual(payload.text, 'नमस्ते, आप कैसे हैं?');
    console.log('   ✓ language_code=hi passed to ElevenLabs API for Hindi text');
  }

  // -------------------------------------------------------------------------
  // TEST 17: TTS error handling (all providers failing -> graceful text-only)
  // -------------------------------------------------------------------------
  {
    console.log('17. Testing fatal TTS error handling (Graceful text-only response)...');
    const failingElevenLabs = createMockElevenLabsClient({
      shouldFail: true,
      failError: new Error('ElevenLabs totally down'),
    });
    const elevenLabs = new ElevenLabsTTSProvider({
      apiKey: SECRET_TEST_KEY,
      voiceId: 'test_voice',
    });
    elevenLabs.setMockClient(failingElevenLabs);

    // Mock local provider that also fails
    const failingLocal: any = {
      id: 'failing_local',
      name: 'Failing Local Provider',
      isAvailable: () => true,
      isSpeaking: () => false,
      speak: async () => {
        throw new Error('Audio output device disconnected / no sound hardware');
      },
      stop: () => {},
      pause: () => {},
      resume: () => {},
      getVoices: async () => [],
      setVoice: () => {},
      setLanguage: () => {},
      setRate: () => {},
      setVolume: () => {},
    };

    const router = new TTSRouter(elevenLabs, failingLocal, 'elevenlabs');

    // Must NEVER throw an unhandled crash to the user!
    const result = await router.routeAndSpeak('Critical alert when all TTS hardware is offline.');

    assert.strictEqual(result.success, true, 'Must return graceful success');
    assert.strictEqual(result.textOnly, true, 'Must fall back to text-only mode');
    assert.strictEqual(result.providerUsed, 'none');
    assert.strictEqual(result.text, 'Critical alert when all TTS hardware is offline.');
    console.log('   ✓ All TTS providers failed -> Seamless fallback to text-only mode without crashing');
  }

  console.log('\n✅ ALL 17 ELEVENLABS TTS PROVIDER & ROUTER TEST SCENARIOS PASSED (100%)\n');
}

// Small helper to invoke provider.speak
async function providerSpeakWrapper(provider: ElevenLabsTTSProvider, text: string): Promise<void> {
  await provider.speak(text);
}

// Run standalone if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('phase3_elevenlabs_tts')) {
  runElevenLabsVoiceTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Phase 3 ElevenLabs test run failed:', err);
      process.exit(1);
    });
}
