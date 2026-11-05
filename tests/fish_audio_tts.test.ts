/**
 * Automated Test Suite: Fish Audio TTS Provider & Fallback Pipeline
 *
 * Verifies:
 * 1. FishAudioTTSProvider interface & default configuration (s2.1-pro-free, format=mp3)
 * 2. Fish Audio API endpoint POST https://api.fish.audio/v1/tts
 * 3. PrivacyFilter strict execution BEFORE any dispatch (blocks OTPs, passwords, PINs)
 * 4. SpeechTextNormalizer removes raw JSON, markdown, code, URLs
 * 5. Feminine Voice Persona preservation in Hindi/Hinglish ("karti hoon", "kar deti hoon", "kar dungi", "samajh gayi")
 * 6. Multi-tier Fallback Flow:
 *    - Fish Audio succeeds -> providerUsed = 'fish_audio'
 *    - Fish Audio fails -> try existing ElevenLabs provider
 *    - If both fail -> display text without audio
 * 7. Security: API keys are never leaked in logs, dispatch payloads, or error messages
 */

import { FishAudioTTSProvider } from '../core/voice/fishAudioProvider.ts';
import { ElevenLabsTTSProvider } from '../core/voice/elevenLabsProvider.ts';
import { TTSRouter } from '../core/voice/ttsRouter.ts';
import { MockTextToSpeechProvider } from '../core/voice/mockSpeechProvider.ts';
import { SpeechTextNormalizer } from '../core/voice/speechTextNormalizer.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runFishAudioVoiceTests(): Promise<void> {
  console.log('\n================================================================');
  console.log('STARTING FISH AUDIO TTS PROVIDER & FALLBACK TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;

  // -------------------------------------------------------------
  // Test 1: Fish Audio Provider Defaults & Config
  // -------------------------------------------------------------
  console.log('--- Test 1: Fish Audio Provider Defaults & Model Specification ---');
  const fishProvider = new FishAudioTTSProvider({
    apiKey: 'test_fish_key_12345',
    voiceId: 'jarvis_female_voice_id',
    model: 's2.1-pro-free',
  });

  assert((fishProvider.id as string) === 'fish_audio' || (fishProvider.id as string) === 'fishaudio', 'Provider ID must be "fish_audio" or "fishaudio"');
  assert(fishProvider.getModel() === 's2.1-pro-free', 'Default model must be "s2.1-pro-free"');
  assert(fishProvider.getVoiceId() === 'jarvis_female_voice_id', 'Voice ID must match configured value');
  assert(fishProvider.isAvailable() === true, 'Provider must be available when API key is set');
  passed += 4;
  console.log('  ✓ Verified Fish Audio provider defaults and s2.1-pro-free model.');

  // -------------------------------------------------------------
  // Test 2: Official Fish Audio API Dispatch Format
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Official Fish Audio API Dispatch Format (POST https://api.fish.audio/v1/tts) ---');
  let dispatchedPayload: any = null;
  fishProvider.setMockClient((payload: any) => {
    dispatchedPayload = payload;
  });

  await fishProvider.speak('Namaste! Main aapki personal AI assistant hoon, aur main aapki madad karti hoon.');
  assert(dispatchedPayload !== null, 'Mock client must receive dispatch payload');
  assert(dispatchedPayload.endpoint === 'https://api.fish.audio/v1/tts', 'Must target POST https://api.fish.audio/v1/tts');
  assert(dispatchedPayload.format === 'mp3', 'Format must be "mp3"');
  assert(dispatchedPayload.model === 's2.1-pro-free', 'Model must be "s2.1-pro-free"');
  assert(dispatchedPayload.reference_id === 'jarvis_female_voice_id', 'Must send reference_id');
  assert(!JSON.stringify(dispatchedPayload).includes('test_fish_key_12345'), 'API key must never be in dispatch payload');
  passed += 6;
  console.log('  ✓ Verified official Fish Audio API contract and secure payload without key leakage.');

  // -------------------------------------------------------------
  // Test 3: Privacy Filter Pre-TTS Execution
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Privacy Filter Pre-TTS Guard (OTPs & Credentials Blocked) ---');
  let privacyBlocked = false;
  try {
    await fishProvider.speak('Aapka OTP code 9482 hai. Kripya ise kisi ko na batayein.');
  } catch (err: any) {
    if (err.message.includes('Privacy Shield') || err.message.includes('OTP')) {
      privacyBlocked = true;
    }
  }
  assert(privacyBlocked === true, 'OTP must be blocked by Privacy Shield before hitting Fish Audio');
  passed++;
  console.log('  ✓ Verified OTP code blocked prior to Fish Audio dispatch.');

  // -------------------------------------------------------------
  // Test 4: SpeechTextNormalizer (No Raw Markdown / URLs / JSON)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Normalization Layer Sanitization ---');
  await fishProvider.speak('Check out **JARVIS Engine** at https://example.com/docs for details.');
  assert(dispatchedPayload !== null, 'Payload received');
  assert(!dispatchedPayload.text.includes('**'), 'Markdown bold tags must be stripped');
  assert(!dispatchedPayload.text.includes('https://example.com/docs'), 'Raw URL must be sanitized with natural phrasing');
  assert(dispatchedPayload.text.includes('Link ready hai') || dispatchedPayload.text.includes('The link is ready') || dispatchedPayload.text.includes('JARVIS Engine'), 'Natural phrasing preserved');
  passed += 4;
  console.log('  ✓ Verified raw markdown and URLs sanitized prior to Fish Audio synthesis.');

  // -------------------------------------------------------------
  // Test 5: Feminine Voice Persona Preservation
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Feminine Voice Persona Grammar Verification ---');
  const femininePhrases = [
    'Main aapka kaam karti hoon.',
    'Main settings update kar deti hoon.',
    'Main kal subah remind kar dungi.',
    'Main sab samajh gayi.',
  ];

  for (const phrase of femininePhrases) {
    const norm = SpeechTextNormalizer.normalize(phrase);
    assert(
      norm.normalizedText.includes('karti hoon') ||
      norm.normalizedText.includes('kar deti hoon') ||
      norm.normalizedText.includes('kar dungi') ||
      norm.normalizedText.includes('samajh gayi'),
      `Feminine phrasing must be preserved: ${phrase}`
    );
    passed++;
  }
  console.log(`  ✓ Verified all ${femininePhrases.length} feminine Hindi/Hinglish persona phrases preserved.`);

  // -------------------------------------------------------------
  // Test 6: TTSRouter Flow - Fish Audio Primary Success
  // -------------------------------------------------------------
  console.log('\n--- Test 6: TTSRouter Flow (Fish Audio Primary Success) ---');
  const mockFish = new FishAudioTTSProvider({ apiKey: 'valid_fish_key' });
  mockFish.setMockClient(() => Promise.resolve());

  const mockEleven = new ElevenLabsTTSProvider({ apiKey: 'valid_eleven_key' });
  mockEleven.setMockClient({ textToSpeech: { convert: () => Promise.resolve([]) } });

  const router = new TTSRouter(mockFish as any, mockEleven as any, new MockTextToSpeechProvider() as any, 'fish_audio' as any);
  const resultSuccess = await router.routeAndSpeak('Task complete ho gaya hai. Main ready hoon.');

  assert(resultSuccess.success === true, 'Dispatch must succeed');
  assert((resultSuccess.providerUsed as string) === 'fish_audio' || (resultSuccess.providerUsed as string) === 'fishaudio', 'Provider used must be "fish_audio" or "fishaudio"');
  assert(resultSuccess.fallbackTriggered === false, 'Fallback must not be triggered when Fish Audio succeeds');
  passed += 3;
  console.log('  ✓ Verified primary Fish Audio routing without fallback.');

  // -------------------------------------------------------------
  // Test 7: Fallback: Fish Audio Fails -> Try ElevenLabs
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Fallback: Fish Audio Fails -> ElevenLabs Provider ---');
  const failingFish = new FishAudioTTSProvider({ apiKey: 'failing_fish_key' });
  failingFish.setMockClient(() => Promise.reject(new Error('Fish Audio quota exceeded or timeout')));

  const fallbackRouter = new TTSRouter(failingFish as any, mockEleven as any, new MockTextToSpeechProvider() as any, 'fish_audio' as any);
  const resultFallback = await fallbackRouter.routeAndSpeak('Main status check kar leti hoon.');

  assert(resultFallback.success === true, 'Dispatch must succeed via ElevenLabs fallback');
  assert(resultFallback.providerUsed === 'elevenlabs', 'Provider used must fallback to "elevenlabs"');
  assert(resultFallback.fallbackTriggered === true, 'Fallback must be flagged as triggered');
  passed += 3;
  console.log('  ✓ Verified graceful fallback from Fish Audio to ElevenLabs on failure.');

  // -------------------------------------------------------------
  // Test 8: Fallback: Both Fish Audio and ElevenLabs Fail -> Text Without Audio
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Fallback: Both Providers Fail -> Display Text Without Audio ---');
  const failingEleven = new ElevenLabsTTSProvider({ apiKey: 'failing_eleven_key' });
  failingEleven.setMockClient({
    textToSpeech: {
      convert: () => Promise.reject(new Error('ElevenLabs 401 Unauthorized')),
    },
  });

  const bothFailingRouter = new TTSRouter(failingFish as any, failingEleven as any, new MockTextToSpeechProvider() as any, 'fish_audio' as any);
  const resultTextOnly = await bothFailingRouter.routeAndSpeak('Main ye system check kar rahi hoon.');

  assert(resultTextOnly.success === true, 'Must not crash when both remote providers fail');
  assert(resultTextOnly.textOnly === true, 'Must fallback to display text without audio');
  assert(resultTextOnly.providerUsed === 'none', 'Provider used must be "none"');
  assert(resultTextOnly.text.includes('Main ye system check kar rahi hoon'), 'Text must be preserved for display');
  passed += 4;
  console.log('  ✓ Verified text-only display without audio when both providers fail.');

  // -------------------------------------------------------------
  // Test 9: Security: Error Sanitization (API Key Never Leaked)
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Security Invariant: API Key Never Leaked in Errors ---');
  const secretKey = 'FISH_SECRET_KEY_999888777';
  const securedFish = new FishAudioTTSProvider({ apiKey: secretKey });
  securedFish.setMockClient(() => Promise.reject(new Error(`Failed with key ${secretKey} at server`)));

  let caughtError: string = '';
  try {
    await securedFish.speak('System test');
  } catch (err: any) {
    caughtError = err.message;
  }
  assert(!caughtError.includes(secretKey), 'API key must be redacted in error message');
  assert(caughtError.includes('[REDACTED_API_KEY]'), 'Error must contain [REDACTED_API_KEY]');
  passed += 2;
  console.log('  ✓ Verified API key redacted in errors.');

  console.log('\n================================================================');
  console.log(`ALL FISH AUDIO TTS & FALLBACK TESTS PASSED! (${passed} assertions verified)`);
  console.log('================================================================\n');
}

if (import.meta.url.endsWith(process.argv[1] || '')) {
  runFishAudioVoiceTests().catch((err) => {
    console.error('Fish Audio TTS Test Suite Failed:', err);
    process.exit(1);
  });
}
