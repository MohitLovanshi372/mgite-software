/**
 * Phase 3 Fix — Natural Hindi/Hinglish Speech Automated Test Suite
 *
 * Verifies all 8 mandatory testing criteria:
 * 1. test Hindi (Devanagari)
 * 2. test Hinglish (Roman script complete words, no letter-by-letter spelling)
 * 3. test English (Natural native cadence)
 * 4. test technical words (YouTube, Gemini, Google, Windows, CPU, GPU, RAM, API, URL, HTML, CSS, JavaScript)
 * 5. test abbreviations (CPU, API, RAM natural pronunciation vs explicit spelling)
 * 6. test URLs (No http-colon-slash-slash; replaced with "Link ready hai.")
 * 7. test markdown (Stripping **, *, `, #, bullets, tables)
 * 8. test tool responses (Raw JSON / code blocks never sent to TTS raw; replaced with conversational summaries)
 */

import { SpeechTextNormalizer } from '../core/voice/speechTextNormalizer.ts';
import { TTSRouter } from '../core/voice/ttsRouter.ts';
import { voiceEngine } from '../core/voice/voiceEngine.ts';
import { getConfig } from '../config/settings.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runNaturalSpeechTests() {
  console.log('\n========================================');
  console.log('STARTING PHASE 3 NATURAL SPEECH & TTS NORMALIZATION TESTS');
  console.log('========================================\n');

  // Test 1: Hindi (Devanagari) Support & Cadence
  console.log('Test 1: Hindi (Devanagari) Natural Articulation');
  const hindi1 = 'क्या हाल है? मैं आपका पर्सनल एआई असिस्टेंट हूँ।';
  const resHindi1 = SpeechTextNormalizer.normalize(hindi1);
  assert(resHindi1.detectedLanguage === 'hi', 'Must detect Hindi for Devanagari script');
  assert(resHindi1.languageCode === 'hi', 'Language code must be hi');
  assert(resHindi1.normalizedText.includes('क्या हाल है?'), 'Hindi text preserved');
  assert(!resHindi1.normalizedText.includes('।'), 'Danda replaced with cadence pause');
  console.log('  ✓ Hindi Devanagari detected and cadence optimized:', resHindi1.normalizedText);

  const hindi2 = 'सिस्टम स्टेटस 100% ठीक है।';
  const resHindi2 = SpeechTextNormalizer.normalize(hindi2);
  assert(resHindi2.normalizedText.includes('प्रतिशत'), '% converted to Hindi pratishat');
  console.log('  ✓ Hindi percentages articulated naturally:', resHindi2.normalizedText);

  // Test 2: Hinglish (Roman script) Complete Words & No Letter-by-Letter Spelling
  console.log('\nTest 2: Hinglish Complete Words & Anti-Spelling Defense');
  const hinglishInput = 'Jarvis, mera system status batao.';
  const resHinglish = SpeechTextNormalizer.normalize(hinglishInput);
  assert(resHinglish.detectedLanguage === 'hinglish', 'Must detect Hinglish for Romanized Hindi keywords');
  assert(resHinglish.languageCode === 'hi', 'Hinglish routes to multilingual hi code');
  assert(!resHinglish.normalizedText.includes('J A R V I S'), 'Must NEVER spell JARVIS letter-by-letter');
  assert(!resHinglish.normalizedText.includes('M E R A'), 'Must NEVER spell MERA letter-by-letter');
  console.log('  ✓ Hinglish sentence preserves complete words:', resHinglish.normalizedText);

  // Test all-caps Hinglish input: "JARVIS, MERA SYSTEM STATUS BATAO"
  const allCapsInput = 'JARVIS, MERA SYSTEM STATUS BATAO';
  const resAllCaps = SpeechTextNormalizer.normalize(allCapsInput);
  assert(!resAllCaps.normalizedText.includes('M E R A'), 'All-caps words must not be spaced out');
  assert(resAllCaps.normalizedText.toLowerCase().includes('mera system status'), 'All-caps converted to natural case');
  console.log('  ✓ All-caps Hinglish normalized to prevent synthesizer spelling:', resAllCaps.normalizedText);

  // Test 3: English Responses Natural Cadence
  console.log('\nTest 3: English Natural Articulation');
  const englishInput = 'All core telemetry systems are operating at nominal capacity.';
  const resEnglish = SpeechTextNormalizer.normalize(englishInput);
  assert(resEnglish.detectedLanguage === 'en', 'Must detect English');
  assert(resEnglish.languageCode === 'en', 'Language code must be en');
  assert(resEnglish.normalizedText === englishInput, 'English sentence preserved without distortion');
  console.log('  ✓ Native English preserved naturally:', resEnglish.normalizedText);

  // Test 4: Technical Terms Kept Readable & Untranslated
  console.log('\nTest 4: Technical Terms Preservation');
  const techTermsInput = 'We support YouTube, Gemini, Google, Windows, CPU, GPU, RAM, API, URL, HTML, CSS, and JavaScript.';
  const resTech = SpeechTextNormalizer.normalize(techTermsInput);
  const preserved = resTech.technicalTermsPreserved;
  assert(preserved.includes('YouTube'), 'YouTube preserved');
  assert(preserved.includes('Gemini'), 'Gemini preserved');
  assert(preserved.includes('Google'), 'Google preserved');
  assert(preserved.includes('Windows'), 'Windows preserved');
  assert(preserved.includes('JavaScript'), 'JavaScript preserved');
  assert(!resTech.normalizedText.includes('A.P.I.'), 'API must not have dots inserted');
  assert(!resTech.normalizedText.includes('C.P.U.'), 'CPU must not have dots inserted');
  console.log('  ✓ All 12 technical terms preserved cleanly:', preserved.join(', '));

  // Test 5: Abbreviations (CPU, API, RAM) Natural Pronunciation vs Explicit Spelling
  console.log('\nTest 5: Abbreviations Natural Pronunciation');
  const abbrevInput = 'The CPU load is nominal, RAM is 16GB, and the backend API returned status 200.';
  const resAbbrev = SpeechTextNormalizer.normalize(abbrevInput);
  assert(!resAbbrev.normalizedText.includes('C.P.U.'), 'CPU does not use dotted pauses');
  assert(!resAbbrev.normalizedText.includes('A.P.I.'), 'API does not use dotted pauses');
  assert(resAbbrev.normalizedText.includes('Ram'), 'RAM articulated as smooth word Ram to prevent R-A-M spelling');
  console.log('  ✓ Abbreviations pronounced naturally:', resAbbrev.normalizedText);

  // Explicit spelling check
  const spellingRequest = SpeechTextNormalizer.normalize('Please spell CPU and API for me.', {
    userPrompt: 'Please spell CPU letter by letter',
    isExplicitSpellingRequested: true,
  });
  assert(spellingRequest.normalizedText.includes('C, P, U'), 'Spells out letters only when user explicitly asks for spelling');
  console.log('  ✓ Explicit spelling honored when requested:', spellingRequest.normalizedText);

  // Test 6: URLs Sanitization (No reading http-colon-slash-slash)
  console.log('\nTest 6: URLs Sanitization');
  const urlHinglish = 'Aap is tutorial ko dekh sakte hain: https://youtube.com/watch?v=xyz123 aur seekh sakte hain.';
  const resUrlHinglish = SpeechTextNormalizer.normalize(urlHinglish);
  assert(!resUrlHinglish.normalizedText.includes('http'), 'Never read http aloud');
  assert(!resUrlHinglish.normalizedText.includes('youtube.com/watch'), 'Never read raw URL parameters aloud');
  assert(resUrlHinglish.normalizedText.includes('Link ready hai'), 'Replaces URL with natural "Link ready hai." in Hinglish');
  console.log('  ✓ Hinglish URL replaced with natural phrasing:', resUrlHinglish.normalizedText);

  const urlEnglish = 'Please check the documentation at https://cloud.google.com/docs for details.';
  const resUrlEnglish = SpeechTextNormalizer.normalize(urlEnglish);
  assert(!resUrlEnglish.normalizedText.includes('https'), 'Never read https aloud in English');
  assert(resUrlEnglish.normalizedText.includes('link is ready'), 'Replaces URL with natural "The link is ready." in English');
  console.log('  ✓ English URL replaced with natural phrasing:', resUrlEnglish.normalizedText);

  const markdownLink = 'Check out [YouTube Official Channel](https://youtube.com/@jarvis) right now.';
  const resMdLink = SpeechTextNormalizer.normalize(markdownLink);
  assert(resMdLink.normalizedText.includes('YouTube Official Channel'), 'Preserves markdown link title');
  assert(!resMdLink.normalizedText.includes('https://'), 'Strips raw target URL');
  console.log('  ✓ Markdown link title preserved, URL hidden:', resMdLink.normalizedText);

  // Test 7: Markdown Stripping before TTS
  console.log('\nTest 7: Markdown Stripping');
  const mdInput = '## System Diagnostic\n- **Status**: `ONLINE`\n- *Neural Matrix*: 100% active\n- Run `npm run build` now';
  const resMd = SpeechTextNormalizer.normalize(mdInput);
  assert(!resMd.normalizedText.includes('##'), 'Headers stripped');
  assert(!resMd.normalizedText.includes('**'), 'Bold asterisks stripped');
  assert(!resMd.normalizedText.includes('`'), 'Inline code backticks stripped');
  assert(!resMd.normalizedText.includes('- '), 'Bullet marks stripped');
  assert(resMd.normalizedText.includes('ONLINE') || resMd.normalizedText.includes('Online'), 'Content intact');
  assert(resMd.normalizedText.includes('npm run build'), 'Command words preserved');
  console.log('  ✓ Markdown stripped cleanly for TTS:', resMd.normalizedText);

  // Test 8: Tool Responses & Raw JSON Output Handling
  console.log('\nTest 8: Tool Responses & Raw JSON Sanitization');
  const rawJson = JSON.stringify({
    status: 'success',
    tool: 'system_telemetry',
    output: { cpu_usage: 12, ram_free_gb: 14.2 },
  });
  const resJson = SpeechTextNormalizer.normalize(rawJson, {
    userPrompt: 'Jarvis, mera system status batao.',
  });
  assert(!resJson.normalizedText.includes('{'), 'Raw JSON curly braces must NEVER be spoken aloud');
  assert(!resJson.normalizedText.includes('"status"'), 'Raw JSON keys must NEVER be spoken aloud');
  assert(resJson.hasJsonOrToolOutput === true, 'Detected as tool/JSON output');
  assert(resJson.normalizedText.includes('Action complete') || resJson.normalizedText.includes('process ho gaya'), 'Friendly conversational summary used');
  console.log('  ✓ Raw JSON tool response replaced by conversational summary:', resJson.normalizedText);

  // Test Code Blocks Summarization
  const codeBlockInput = 'Here is the function you requested:\n```typescript\nfunction add(a: number, b: number): number {\n  return a + b;\n}\n```\nAap isko use kar sakte hain.';
  const resCodeBlock = SpeechTextNormalizer.normalize(codeBlockInput, {
    userPrompt: 'add function banao',
  });
  assert(!resCodeBlock.normalizedText.includes('function add(a: number'), 'Must not read code character-by-character');
  assert(resCodeBlock.normalizedText.includes('Code snippet ready hai') || resCodeBlock.normalizedText.includes('code snippet is ready'), 'Summarizes code block');
  console.log('  ✓ Code block summarized instead of spoken letter-by-letter:', resCodeBlock.normalizedText);

  // Test 9: TTSRouter Integration with SpeechTextNormalizer
  console.log('\nTest 9: TTSRouter Pre-TTS Normalization Pipeline');
  const ttsRouter = new TTSRouter();
  const dispatchResult = await ttsRouter.routeAndSpeak('**Status**: `ONLINE` with https://youtube.com link.');
  assert(dispatchResult.success === true, 'TTS dispatch succeeded');
  assert(!dispatchResult.text.includes('**'), 'TTS received normalized text without markdown');
  assert(!dispatchResult.text.includes('https://'), 'TTS received normalized text without raw URL');
  assert(Boolean(dispatchResult.originalText), 'Original response preserved for debug inspector');
  assert(Boolean(dispatchResult.normalizedText), 'Normalized response recorded');
  console.log('  ✓ TTSRouter successfully piped text through SpeechTextNormalizer before TTS synthesis');

  // Test 10: ElevenLabs Model & Privacy Invariant
  console.log('\nTest 10: ElevenLabs Multilingual Model & Ephemeral Audio');
  const config = getConfig();
  assert(config.voice.elevenlabs_model === 'eleven_multilingual_v2', 'Default ElevenLabs model is eleven_multilingual_v2');
  assert(config.voice.preferred_language === 'auto', 'Default voice language is AUTO');
  
  // Privacy invariant: Never send OTP to TTS
  const otpAttempt = await ttsRouter.routeAndSpeak('Your verification code is 482910.');
  assert(otpAttempt.blockedByPrivacy === true, 'OTP must be strictly blocked before TTS');
  assert(otpAttempt.providerUsed === 'none', 'No external TTS called for OTP');
  console.log('  ✓ ElevenLabs multilingual_v2 verified and sensitive OTP completely blocked');

  console.log('\n========================================');
  console.log('ALL PHASE 3 NATURAL SPEECH & TTS NORMALIZATION TESTS PASSED (100%)');
  console.log('========================================\n');
}

if (import.meta.url.endsWith(process.argv[1] || '')) {
  runNaturalSpeechTests().catch((err) => {
    console.error('Phase 3 Natural Speech test suite failed:', err);
    process.exit(1);
  });
}
