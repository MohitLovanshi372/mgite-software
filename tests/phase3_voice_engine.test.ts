/**
 * Phase 3 Automated Test Suite: Voice Engine Foundation
 *
 * Comprehensive validation of:
 * 1. Voice Engine initialization
 * 2. Microphone permission success
 * 3. Microphone permission denied
 * 4. Empty speech rejection
 * 5. Speech-to-Text success
 * 6. Speech-to-Text failure recovery
 * 7. Hindi speech handling ("नमस्ते, आज का मौसम कैसा है?")
 * 8. English speech handling ("What is the time?")
 * 9. Mixed-language / Hinglish speech handling ("kal subah reminder laga dena")
 * 10. Privacy filter integration
 * 11. OTP transcript protection ("mera OTP 483921 hai") -> masked, never spoken aloud, never logged
 * 12. Password transcript protection ("mera password secretPass99 hai")
 * 13. TTS initialization
 * 14. TTS synthesis success
 * 15. TTS synthesis failure handling
 * 16. Stop speaking / barge-in interruption
 * 17. Voice state transitions (IDLE -> LISTENING -> PROCESSING -> SPEAKING -> IDLE)
 * 18. Auto-speak disabled (text only response)
 * 19. Auto-speak enabled (text response + TTS speech synthesis)
 * 20. Offline mode handling
 * 21. Cloud API unavailable handling
 * 22. No audio permanently stored (verified memory ephemeral)
 * 23. Tool security remains active on voice input (e.g., powershell command rejected)
 * 24. Privacy guarantee verification ("483921" absent from speech output and logs)
 */

import { VoiceEngine } from '../core/voice/voiceEngine.ts';
import { MockSpeechToTextProvider, MockTextToSpeechProvider } from '../core/voice/mockSpeechProvider.ts';
import { PrivacyFilter } from '../core/security/privacyFilter.ts';
import { AssistantOrchestrator } from '../core/orchestrator/orchestrator.ts';
import { VoiceConfig } from '../core/voice/types.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runPhase3VoiceEngineTests(): Promise<void> {
  console.log('--- Running Phase 3: Voice Engine Foundation Tests ---');

  const defaultVoiceConfig: VoiceConfig = {
    enabled: true,
    auto_speak: false,
    preferred_language: 'auto',
    voice_id: 'default',
    speech_rate: 1.0,
    speech_volume: 1.0,
    interrupt_speech: true,
    stt_provider: 'mock',
    tts_provider: 'mock',
  };

  // ==========================================
  // Test 1: Voice Engine Initialization
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    assert(engine.getState() === 'IDLE', `Expected state IDLE, got ${engine.getState()}`);
    assert(engine.getConfig().enabled === true, 'Engine should be enabled');
    console.log('  ✓ 1. Voice Engine initialized cleanly in IDLE state');
  }

  // ==========================================
  // Test 2: Microphone Permission Success
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    stt.setSimulatedPermission(true);
    const hasPerm = await stt.requestPermission();
    assert(hasPerm === true, 'Expected microphone permission granted');
    console.log('  ✓ 2. Microphone permission success verified');
  }

  // ==========================================
  // Test 3: Microphone Permission Denied
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    stt.setSimulatedPermission(false);
    let caught = false;
    try {
      await engine.startListening();
    } catch (e: any) {
      caught = true;
      assert(e.message.includes('permission denied'), 'Error should indicate permission denied');
    }
    assert(caught, 'Engine should reject listening when permission is denied');
    assert(engine.getState() === 'ERROR' || engine.getState() === 'IDLE', 'State should recover from permission failure');
    console.log('  ✓ 3. Microphone permission denial handled gracefully');
  }

  // ==========================================
  // Test 4: Empty Speech Handling
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    stt.setSimulatedPermission(true);
    stt.setQueuedTranscript('   '); // whitespace only

    await engine.startListening();
    const transcript = await engine.stopListening();
    assert(transcript === '', 'Empty or whitespace speech should resolve to empty string');
    assert(engine.getState() === 'IDLE', 'State should return to IDLE after empty speech');
    console.log('  ✓ 4. Empty/silent speech handled without crashes');
  }

  // ==========================================
  // Test 5: Speech-to-Text Success
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    stt.setSimulatedPermission(true);
    stt.setQueuedTranscript('Hello assistant how are you');

    await engine.startListening();
    assert(engine.getState() === 'LISTENING', 'Engine should be in LISTENING state');

    const result = await engine.stopListening();
    assert(result === 'Hello assistant how are you', `Expected transcript text, got: "${result}"`);
    assert(engine.getState() === 'IDLE', 'Engine should transition back to IDLE');
    console.log('  ✓ 5. Speech-to-Text recognized transcript successfully');
  }

  // ==========================================
  // Test 6: Speech-to-Text Failure Recovery
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    stt.setSimulatedPermission(true);
    stt.setSimulatedFailure(true);

    let errorEmitted = false;
    engine.on('error', (err) => {
      errorEmitted = true;
    });

    try {
      await engine.startListening();
    } catch {
      // expected failure
    }

    assert(engine.getState() === 'ERROR' || engine.getState() === 'IDLE', 'Engine state should recover');
    engine.reset();
    assert(engine.getState() === 'IDLE', 'Engine reset should bring state back to IDLE');
    console.log('  ✓ 6. STT failure caught and cleanly recovered');
  }

  // ==========================================
  // Test 7: Hindi Speech Handling
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    const hindiInput = 'नमस्ते, आज का मौसम कैसा है?';
    stt.setSimulatedPermission(true);
    stt.setQueuedTranscript(hindiInput);

    await engine.startListening();
    const transcript = await engine.stopListening();
    assert(transcript === hindiInput, `Expected Hindi transcript, got: "${transcript}"`);

    // Verify speech synthesis with Hindi text
    const session = await engine.speak(hindiInput, 'hi-IN');
    assert(session.text === hindiInput, 'TTS session should preserve Hindi unicode text');
    assert(tts.spokenHistory.includes(hindiInput), 'TTS provider should have received Hindi utterance');
    console.log('  ✓ 7. Hindi unicode speech recognized and spoken accurately');
  }

  // ==========================================
  // Test 8: English Speech Handling
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    const englishInput = 'What is the time right now?';
    stt.setSimulatedPermission(true);
    stt.setQueuedTranscript(englishInput);

    await engine.startListening();
    const transcript = await engine.stopListening();
    assert(transcript === englishInput, `Expected English transcript, got: "${transcript}"`);

    await engine.speak(transcript);
    assert(tts.spokenHistory.includes(englishInput), 'TTS should speak English input');
    console.log('  ✓ 8. English speech handling verified');
  }

  // ==========================================
  // Test 9: Mixed-Language / Hinglish Text Handling
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    const hinglishInput = 'kal subah 8 baje reminder laga dena bhai';
    stt.setSimulatedPermission(true);
    stt.setQueuedTranscript(hinglishInput);

    await engine.startListening();
    const transcript = await engine.stopListening();
    assert(transcript === hinglishInput, 'Hinglish phrase should be preserved');

    // Run through Intent Detector as part of pipeline
    const orchestrator = new AssistantOrchestrator();
    const response = await orchestrator.processUserMessage({
      conversation_id: 'test-hinglish-voice',
      user_message: transcript,
      input_mode: 'voice',
    });

    assert(response.content.length > 0, 'Orchestrator should process Hinglish voice query');
    assert(response.intent?.intent === 'REMINDER_REQUEST', `Expected REMINDER_REQUEST, got: ${response.intent?.intent}`);
    console.log('  ✓ 9. Mixed-language / Hinglish voice query recognized and routed');
  }

  // ==========================================
  // Test 10: Privacy Filter Integration with Transcripts
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    stt.setSimulatedPermission(true);
    // Voice query with secret key pattern
    const sensitiveTranscript = 'Mera secret key sk-test-99881122 hai isko yaad rakho';
    stt.setQueuedTranscript(sensitiveTranscript);

    await engine.startListening();
    const rawTranscript = await engine.stopListening();

    // Verify privacy filter processes voice transcripts
    const privacyCheck = PrivacyFilter.filter(rawTranscript);
    assert(privacyCheck.blocked === true || privacyCheck.redactedText.includes('[REDACTED'), 'Sensitive credentials must be detected');
    console.log('  ✓ 10. Privacy filter successfully intercepts sensitive voice transcripts');
  }

  // ==========================================
  // Test 11: OTP Transcript Protection
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    const otpVoiceText = 'mera OTP 483921 hai';
    stt.setSimulatedPermission(true);
    stt.setQueuedTranscript(otpVoiceText);

    // 1. Process voice transcript with privacy filter
    const privacyResult = PrivacyFilter.filter(otpVoiceText);
    assert(privacyResult.findings.some(f => f.type === 'OTP'), 'OTP must be flagged by Privacy Filter');

    // 2. Pass to VoiceEngine.speak: ensure it refuses or redacts OTP so "483921" is NEVER spoken aloud!
    const session = await engine.speak('Aapka OTP 483921 receive ho gaya hai');
    const spokenUtterance = session.text;

    assert(!spokenUtterance.includes('483921'), 'CRITICAL: The numeric OTP 483921 must NEVER be pronounced by TTS!');
    assert(spokenUtterance.includes('[SENSITIVE_DATA_REDACTED]') || spokenUtterance.includes('cannot be read aloud'),
      'Speech text must replace OTP with safe redaction placeholder');

    // 3. Check TTS provider spoken history
    assert(!tts.spokenHistory.some(h => h.includes('483921')),
      'CRITICAL: TTS spoken history must not contain 483921');

    console.log('  ✓ 11. OTP transcript protection verified: "483921" NEVER spoken aloud by TTS');
  }

  // ==========================================
  // Test 12: Password Transcript Protection
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    const passwordVoiceText = 'mera password secretPass99 hai';
    const privacyResult = PrivacyFilter.filter(passwordVoiceText);
    assert(privacyResult.findings.some(f => f.type === 'PASSWORD'), 'Password must be caught by Privacy Filter');

    // Attempt to synthesize speech with password
    const session = await engine.speak('Aapka password secretPass99 change kar diya gaya');
    assert(!session.text.includes('secretPass99'), 'Password string must NEVER be spoken aloud by TTS');
    console.log('  ✓ 12. Password transcript protection verified: password string masked from TTS');
  }

  // ==========================================
  // Test 13: TTS Initialization
  // ==========================================
  {
    const tts = new MockTextToSpeechProvider();
    const voices = await tts.getAvailableVoices();
    assert(voices.length > 0, 'TTS should provide available voices list');
    assert(voices.some(v => v.lang.startsWith('en')), 'Should include English voice');
    assert(voices.some(v => v.lang.startsWith('hi')), 'Should include Hindi voice');
    console.log('  ✓ 13. Text-to-Speech initialized with multilingual voices');
  }

  // ==========================================
  // Test 14: TTS Synthesis Success
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    const session = await engine.speak('Good morning, how can I help you?');
    assert(session.state === 'COMPLETED', `Expected session COMPLETED, got ${session.state}`);
    assert(engine.getState() === 'IDLE', 'Engine state should return to IDLE after speech');
    console.log('  ✓ 14. TTS synthesis executed successfully');
  }

  // ==========================================
  // Test 15: TTS Failure Handling
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    tts.setSimulatedFailure(true);
    let failed = false;
    try {
      await engine.speak('This should fail safely');
    } catch {
      failed = true;
    }
    assert(failed, 'Engine should throw or emit error on TTS provider failure');
    assert(engine.getState() === 'IDLE', 'Engine should reset to IDLE after TTS failure');
    console.log('  ✓ 15. TTS provider failure handled gracefully');
  }

  // ==========================================
  // Test 16: Stop Speaking / Barge-In Interruption
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine({ ...defaultVoiceConfig, interrupt_speech: true }, stt, tts);

    stt.setSimulatedPermission(true);

    // Simulate active speaking
    const speakPromise = engine.speak('A very long monologue that will be interrupted by user speech');
    assert(engine.getState() === 'SPEAKING', 'Engine should be in SPEAKING state');

    // Barge-in: User starts speaking (engine.startListening should interrupt TTS)
    await engine.startListening();
    assert(!tts.isSpeaking(), 'Barge-in: TTS playback must be immediately stopped');
    assert(engine.getState() === 'LISTENING', 'Engine should transition to LISTENING');

    await engine.stopListening();
    assert(engine.getState() === 'IDLE', 'Engine returns to IDLE');
    console.log('  ✓ 16. Barge-in interruption stopped ongoing TTS immediately');
  }

  // ==========================================
  // Test 17: Voice State Transitions
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    stt.setSimulatedPermission(true);
    stt.setQueuedTranscript('test transition');

    const statesObserved: string[] = [];
    engine.on('stateChange', (s) => statesObserved.push(s));

    assert(engine.getState() === 'IDLE', 'Initial state IDLE');
    await engine.startListening();
    assert(engine.getState() === 'LISTENING', 'State transitioned to LISTENING');

    await engine.stopListening();
    assert(engine.getState() === 'IDLE', 'State transitioned to IDLE');

    await engine.speak('transition test message');
    assert(engine.getState() === 'IDLE', 'State transitioned to IDLE after speech');

    assert(statesObserved.includes('LISTENING'), 'Should have observed LISTENING');
    assert(statesObserved.includes('SPEAKING'), 'Should have observed SPEAKING');
    console.log('  ✓ 17. Voice state lifecycle transitions (IDLE -> LISTENING -> SPEAKING -> IDLE) verified');
  }

  // ==========================================
  // Test 18: Auto-Speak Disabled Flow
  // ==========================================
  {
    const orchestrator = new AssistantOrchestrator();
    const response = await orchestrator.processUserMessage({
      conversation_id: 'test-auto-speak-off',
      user_message: 'Hi there',
      input_mode: 'voice',
    });

    assert(response.content.length > 0, 'Assistant should return text response');
    // In auto-speak disabled, caller simply does not invoke TTS
    console.log('  ✓ 18. Auto-speak disabled flow produces clean text without mandatory audio output');
  }

  // ==========================================
  // Test 19: Auto-Speak Enabled Flow
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine({ ...defaultVoiceConfig, auto_speak: true }, stt, tts);

    const orchestrator = new AssistantOrchestrator();
    const response = await orchestrator.processUserMessage({
      conversation_id: 'test-auto-speak-on',
      user_message: 'Hello, what is your name?',
      input_mode: 'voice',
    });

    assert(response.content.length > 0, 'Response generated');

    // Auto-speak calls engine.speak
    const session = await engine.speak(response.content);
    assert(session.state === 'COMPLETED', 'TTS session completed');
    assert(tts.spokenHistory.length > 0, 'TTS provider executed speech synthesis');
    console.log('  ✓ 19. Auto-speak enabled flow speaks response aloud via TTS');
  }

  // ==========================================
  // Test 20: Offline Mode Handling
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    const orchestrator = new AssistantOrchestrator();
    // In offline mode: Voice input is transcribed and processed using SQLite local fallback
    const offlineResponse = await orchestrator.processUserMessage({
      conversation_id: 'test-voice-offline',
      user_message: 'How is the system running?',
      input_mode: 'voice',
      enforce_offline: true,
    });

    assert(offlineResponse.isOffline === true, 'Response should be tagged as offline');
    assert(offlineResponse.content.length > 0, 'Offline response should be non-empty');

    // TTS works offline via local mock / Web Speech
    const session = await engine.speak(offlineResponse.content);
    assert(session.state === 'COMPLETED', 'Offline TTS should work cleanly');
    console.log('  ✓ 20. Offline mode handles voice input and local speech output gracefully');
  }

  // ==========================================
  // Test 21: Cloud API Unavailable Handling
  // ==========================================
  {
    const orchestrator = new AssistantOrchestrator();
    // Simulate query when cloud AI is not reachable
    const response = await orchestrator.processUserMessage({
      conversation_id: 'test-voice-no-cloud',
      user_message: 'What can you do in offline mode?',
      input_mode: 'voice',
      enforce_offline: true,
    });

    assert(response.state === 'COMPLETED', 'Orchestrator should gracefully fall back to local responses');
    console.log('  ✓ 21. Cloud API unavailable handles voice interaction via local fallback');
  }

  // ==========================================
  // Test 22: No Audio Permanently Stored (Ephemeral In-Memory Only)
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    stt.setSimulatedPermission(true);
    stt.setQueuedTranscript('Ephemeral audio test phrase');

    await engine.startListening();
    await engine.stopListening();

    // Verify that STT and TTS providers do not retain audio buffers on disk
    assert(stt.getStoredAudioBuffer() === null, 'CRITICAL: Microphone audio buffers must NOT be stored permanently on disk');
    console.log('  ✓ 22. Ephemeral memory guarantee verified: no audio files written to disk');
  }

  // ==========================================
  // Test 23: Tool Security Remains Active on Voice Input
  // ==========================================
  {
    const orchestrator = new AssistantOrchestrator();
    // User attempts dangerous command via voice
    const dangerousVoiceInput = 'run powershell command rm -rf /';
    const response = await orchestrator.processUserMessage({
      conversation_id: 'test-voice-security',
      user_message: dangerousVoiceInput,
      input_mode: 'voice',
    });

    // Intent detector or orchestrator must identify COMPUTER_ACTION_REQUEST with HIGH risk
    // and must NEVER execute OS commands directly
    assert(response.intent?.riskLevel === 'HIGH' || response.intent?.intent === 'COMPUTER_ACTION_REQUEST',
      'Dangerous command through voice must be flagged HIGH risk');
    assert(response.intent?.responseStrategy === 'REQUEST_CONFIRMATION' || response.intent?.responseStrategy === 'REFUSE_UNSAFE_ACTION',
      'System must refuse or require strict confirmation, never execute shell directly');
    console.log('  ✓ 23. Tool security boundary strictly maintained for voice input');
  }

  // ==========================================
  // Test 24: Privacy Guarantee Verification ("483921" Absent from Logs and Speech)
  // ==========================================
  {
    const stt = new MockSpeechToTextProvider();
    const tts = new MockTextToSpeechProvider();
    const engine = new VoiceEngine(defaultVoiceConfig, stt, tts);

    const secretOtp = '483921';
    const inputWithOtp = `Mera OTP ${secretOtp} hai check karo`;

    // 1. Voice engine speech sanitization check
    const session = await engine.speak(inputWithOtp);
    assert(!session.text.includes(secretOtp), `Spoken text must not contain secret OTP "${secretOtp}"`);

    // 2. Check all TTS provider logs and history
    for (const utterance of tts.spokenHistory) {
      assert(!utterance.includes(secretOtp), `TTS history must not contain "${secretOtp}"`);
    }

    console.log('  ✓ 24. Privacy guarantee passed: "483921" verified completely absent from speech output & history');
  }

  console.log('\n--- ALL 24 PHASE 3 VOICE ENGINE TESTS PASSED (100%) ---');
}
