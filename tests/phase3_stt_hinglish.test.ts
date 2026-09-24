/**
 * STT Hindi & Hinglish Speech Recognition & Intent Integration Tests
 *
 * Validates:
 * 1. Phonetic normalization of Indian bilingual code-switching phrases
 * 2. "Jarvis, light chalao" & variants ("light shallow", "light jalao", "लाइट चलाओ")
 * 3. "Jarvis, system status dikhao" & variants ("system status the cow", "status dikhao", "सिस्टम स्टेटस दिखाओ")
 * 4. Wake-word tolerance and intent routing to COMPUTER_ACTION_REQUEST & SYSTEM_STATUS_REQUEST
 * 5. Extraction of device: 'light', action: 'turn_on' / 'turn_off', and target: 'system_status'
 */

import {
  speechRecognitionService,
  normalizeHinglishTranscript,
  parseHinglishCommand,
  isHinglishOrHindi,
} from '../src/utils/speechRecognitionService.ts';
import {
  HINGLISH_VERB_DICTIONARY,
  HINGLISH_DEVICE_DICTIONARY,
} from '../src/utils/languageModel.ts';
import { normalizeMixedLanguageTranscript } from '../core/voice/webSpeechProvider.ts';
import { IntentDetector } from '../core/intent/intentDetector.ts';
import { EntityExtractor } from '../core/intent/entityExtractor.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runSttHinglishTests(): Promise<void> {
  console.log('--- Running STT Hindi/Hinglish Speech & Intent Tests ---');

  // Test 1: "Jarvis, light chalao" acoustic correction
  {
    const corrected1 = normalizeHinglishTranscript('Jarvis, light shallow');
    assert(
      corrected1.toLowerCase().includes('light chalao'),
      `Expected "light chalao", got "${corrected1}"`
    );

    const corrected2 = normalizeMixedLanguageTranscript('light chalo');
    assert(
      corrected2.toLowerCase().includes('light chalao'),
      `Expected "light chalao", got "${corrected2}"`
    );

    console.log('  ✓ 1. "Jarvis, light chalao" acoustic normalization validated');
  }

  // Test 2: "Jarvis, system status dikhao" acoustic correction
  {
    const corrected1 = normalizeHinglishTranscript('Jarvis, system status the cow');
    assert(
      corrected1.toLowerCase().includes('status dikhao'),
      `Expected "status dikhao", got "${corrected1}"`
    );

    const corrected2 = normalizeMixedLanguageTranscript('status decal');
    assert(
      corrected2.toLowerCase().includes('status dikhao'),
      `Expected "status dikhao", got "${corrected2}"`
    );

    console.log('  ✓ 2. "Jarvis, system status dikhao" acoustic normalization validated');
  }

  // Test 3: Intent Detection for "Jarvis, light chalao"
  {
    const intentResult = IntentDetector.detectIntent('Jarvis, light chalao');
    assert(
      intentResult.intent === 'COMPUTER_ACTION_REQUEST',
      `Expected COMPUTER_ACTION_REQUEST for "Jarvis, light chalao", got ${intentResult.intent}`
    );
    assert(
      intentResult.entities.device === 'light',
      `Expected device 'light', got ${intentResult.entities.device}`
    );
    assert(
      intentResult.entities.action === 'turn_on',
      `Expected action 'turn_on', got ${intentResult.entities.action}`
    );
    console.log('  ✓ 3. "Jarvis, light chalao" intent classified as COMPUTER_ACTION_REQUEST (device: light, action: turn_on)');
  }

  // Test 4: Intent Detection for "Jarvis, light band karo"
  {
    const intentResult = IntentDetector.detectIntent('Jarvis, light band karo');
    assert(
      intentResult.intent === 'COMPUTER_ACTION_REQUEST',
      `Expected COMPUTER_ACTION_REQUEST for "Jarvis, light band karo", got ${intentResult.intent}`
    );
    assert(
      intentResult.entities.device === 'light',
      `Expected device 'light', got ${intentResult.entities.device}`
    );
    assert(
      intentResult.entities.action === 'turn_off',
      `Expected action 'turn_off', got ${intentResult.entities.action}`
    );
    console.log('  ✓ 4. "Jarvis, light band karo" intent classified with action turn_off');
  }

  // Test 5: Intent Detection for "Jarvis, system status dikhao"
  {
    const intentResult = IntentDetector.detectIntent('Jarvis, system status dikhao');
    assert(
      intentResult.intent === 'SYSTEM_STATUS_REQUEST',
      `Expected SYSTEM_STATUS_REQUEST for "Jarvis, system status dikhao", got ${intentResult.intent}`
    );
    assert(
      intentResult.entities.target === 'system_status',
      `Expected target 'system_status', got ${intentResult.entities.target}`
    );
    console.log('  ✓ 5. "Jarvis, system status dikhao" intent classified as SYSTEM_STATUS_REQUEST');
  }

  // Test 6: Devanagari Hindi support ("जार्विस, लाइट चलाओ" and "सिस्टम स्टेटस दिखाओ")
  {
    const intentResult1 = IntentDetector.detectIntent('जार्विस, लाइट चलाओ');
    assert(
      intentResult1.intent === 'COMPUTER_ACTION_REQUEST',
      `Expected COMPUTER_ACTION_REQUEST for Devanagari "जार्विस, लाइट चलाओ", got ${intentResult1.intent}`
    );

    const intentResult2 = IntentDetector.detectIntent('सिस्टम स्टेटस दिखाओ');
    assert(
      intentResult2.intent === 'SYSTEM_STATUS_REQUEST',
      `Expected SYSTEM_STATUS_REQUEST for Devanagari "सिस्टम स्टेटस दिखाओ", got ${intentResult2.intent}`
    );
    console.log('  ✓ 6. Pure Devanagari Hindi commands recognized accurately');
  }

  // Test 7: Alternatives parsing when Web Speech returns multiple hypotheses
  {
    const alternatives = ['Jarvis light shallot', 'Jarvis light chalao'];
    const result = normalizeHinglishTranscript('Jarvis light shallot', alternatives);
    assert(
      result.toLowerCase().includes('light chalao'),
      `Expected alternative to be selected for "light chalao", got "${result}"`
    );
    console.log('  ✓ 7. Multi-hypothesis alternative selection verified');
  }

  // Test 8: Dictionary Mapping Utility in languageModel.ts
  {
    assert(Boolean(HINGLISH_VERB_DICTIONARY['chalao']), 'Verb dictionary must have "chalao"');
    assert(HINGLISH_VERB_DICTIONARY['chalao'].action === 'turn_on', '"chalao" must map to "turn_on"');
    assert(HINGLISH_VERB_DICTIONARY['band karo'].action === 'turn_off', '"band karo" must map to "turn_off"');
    assert(HINGLISH_VERB_DICTIONARY['dikhao'].action === 'status', '"dikhao" must map to "status"');
    assert(Boolean(HINGLISH_DEVICE_DICTIONARY['light']), 'Device dictionary must have "light"');
    assert(HINGLISH_DEVICE_DICTIONARY['light'].target === 'light', '"light" must map to "light"');
    assert(Boolean(HINGLISH_DEVICE_DICTIONARY['batti']), 'Device dictionary must have "batti"');
    assert(HINGLISH_DEVICE_DICTIONARY['batti'].target === 'light', '"batti" must map to "light"');

    console.log('  ✓ 8. Hinglish dictionary mappings verified for verbs and devices');
  }

  // Test 9: Structured Command Parsing via parseHinglishCommand
  {
    const parsedLightOn = parseHinglishCommand('Jarvis, light chalao');
    assert(parsedLightOn.action === 'turn_on', `Expected action 'turn_on', got ${parsedLightOn.action}`);
    assert(parsedLightOn.target === 'light', `Expected target 'light', got ${parsedLightOn.target}`);
    assert(parsedLightOn.wakeWordDetected === true, 'Wake word should be detected');
    assert(parsedLightOn.canonicalEnglish === 'turn on lights', `Expected 'turn on lights', got ${parsedLightOn.canonicalEnglish}`);
    assert(parsedLightOn.isHinglishOrHindi === true, 'Should be flagged as Hinglish/Hindi');

    const parsedLightOff = parseHinglishCommand('Jarvis, light band karo');
    assert(parsedLightOff.action === 'turn_off', `Expected action 'turn_off', got ${parsedLightOff.action}`);
    assert(parsedLightOff.target === 'light', `Expected target 'light', got ${parsedLightOff.target}`);
    assert(parsedLightOff.canonicalEnglish === 'turn off lights', `Expected 'turn off lights', got ${parsedLightOff.canonicalEnglish}`);

    const parsedStatus = parseHinglishCommand('Jarvis, system status dikhao');
    assert(parsedStatus.action === 'status', `Expected action 'status', got ${parsedStatus.action}`);
    assert(parsedStatus.target === 'system_status', `Expected target 'system_status', got ${parsedStatus.target}`);
    assert(parsedStatus.canonicalEnglish === 'show system status', `Expected 'show system status', got ${parsedStatus.canonicalEnglish}`);

    console.log('  ✓ 9. Structured Hinglish command parsing & canonical translation validated');
  }

  // Test 10: SpeechRecognitionService Engine Priority ('hi-IN' and 'en-IN' mixed language detection)
  {
    const defaultPriority = speechRecognitionService.getEnginePriority();
    assert(
      defaultPriority[0] === 'en-IN' && defaultPriority[1] === 'hi-IN',
      `Expected default engine priority ['en-IN', 'hi-IN', ...], got: ${JSON.stringify(defaultPriority)}`
    );

    // Switch preferred language to Hindi
    speechRecognitionService.setPreferredLanguage('hi');
    assert(
      speechRecognitionService.getActiveEngine() === 'hi-IN',
      `Expected active engine 'hi-IN', got ${speechRecognitionService.getActiveEngine()}`
    );
    const hindiPriority = speechRecognitionService.getEnginePriority();
    assert(hindiPriority[0] === 'hi-IN', `Expected 'hi-IN' at index 0, got ${hindiPriority[0]}`);

    // Switch preferred language back to auto / mixed
    speechRecognitionService.setPreferredLanguage('auto');
    assert(
      speechRecognitionService.getActiveEngine() === 'en-IN',
      `Expected active engine 'en-IN', got ${speechRecognitionService.getActiveEngine()}`
    );

    // Custom priority configuration
    speechRecognitionService.setEnginePriority(['hi-IN', 'en-IN', 'en-US']);
    const updatedPriority = speechRecognitionService.getEnginePriority();
    assert(
      updatedPriority[0] === 'hi-IN' && updatedPriority[1] === 'en-IN',
      `Expected priority ['hi-IN', 'en-IN', 'en-US'], got ${JSON.stringify(updatedPriority)}`
    );

    // Restore standard mixed priority
    speechRecognitionService.setEnginePriority(['en-IN', 'hi-IN', 'en-US']);
    console.log("  ✓ 10. SpeechRecognitionService prioritizes 'hi-IN' and 'en-IN' mixed language engines");
  }

  // Test 11: Phonetic correction via dictionary in parseHinglishCommand
  {
    const parsedPhonetic = parseHinglishCommand('Jarvis, light shallow');
    assert(
      parsedPhonetic.normalizedText.toLowerCase().includes('light chalao'),
      `Expected 'light chalao' after phonetic correction, got ${parsedPhonetic.normalizedText}`
    );
    assert(parsedPhonetic.action === 'turn_on', 'Action should be turn_on');
    assert(parsedPhonetic.target === 'light', 'Target should be light');

    console.log('  ✓ 11. Phonetic misrecognition dictionary mapping confirmed');
  }

  console.log('--- ALL STT HINDI & HINGLISH TESTS PASSED (100%) ---');
}
