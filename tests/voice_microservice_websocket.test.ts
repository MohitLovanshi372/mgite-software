/**
 * Python Voice Microservice & WebSocket Streaming Test Suite
 * Validates:
 * 1. IPC connection between Node.js and Python Voice Microservice
 * 2. Advanced text processing (phonetics, feminine grammar, currency/numbers expansion)
 * 3. Real-time audio waveform chunk streaming
 */

import { pythonVoiceBridge } from '../server/pythonVoiceBridge.ts';

export async function runVoiceMicroserviceTests() {
  console.log('--- Testing Python Voice Microservice & WebSocket Streaming ---');

  // Wait for service ready if needed
  let retries = 0;
  while (!pythonVoiceBridge.isServiceReady() && retries < 20) {
    await new Promise((r) => setTimeout(r, 200));
    retries++;
  }

  // 1. Test Advanced Text Processing
  console.log('1. Testing Advanced Text Processing in Python Microservice...');
  const textInput = 'Main aapka kaam turant check kar leti hoon. Balance ₹500 bacha hai.';
  const processed = await pythonVoiceBridge.processText(textInput);

  if (!processed.normalized_text.includes('500 rupaye')) {
    throw new Error(`Expected currency expansion '500 rupaye', got: ${processed.normalized_text}`);
  }
  if (!processed.normalized_text.includes('karti hoon') && !processed.normalized_text.includes('kar leti hoon')) {
    throw new Error(`Expected feminine grammar preservation, got: ${processed.normalized_text}`);
  }
  if (processed.phoneme_count <= 0) {
    throw new Error(`Expected phoneme breakdown, got: ${processed.phoneme_count}`);
  }
  console.log('   Normalized:', processed.normalized_text);
  console.log('   Language:', processed.detected_language);
  console.log('   Phonemes:', processed.phoneme_count, 'Duration:', processed.estimated_duration_ms, 'ms');
  console.log('   ✓ Advanced Text Processing verified');

  // 2. Test Audio Waveform Chunk Streaming
  console.log('2. Testing Audio Chunk Streaming via Python Synthesizer...');
  const streamEvents: any[] = [];
  await pythonVoiceBridge.synthesizeStream(
    'Systems online and operational.',
    { chunk_duration_ms: 100 },
    (evt) => {
      streamEvents.push(evt);
    }
  );

  const startEvt = streamEvents.find((e) => e.event === 'start');
  const chunkEvts = streamEvents.filter((e) => e.event === 'chunk');
  const endEvt = streamEvents.find((e) => e.event === 'end');

  if (!startEvt) {
    throw new Error('Missing stream "start" event');
  }
  if (chunkEvts.length === 0) {
    throw new Error('No audio chunks streamed');
  }
  if (!chunkEvts[0].audio_base64) {
    throw new Error('Audio chunk missing base64 audio payload');
  }
  if (!endEvt) {
    throw new Error('Missing stream "end" event');
  }

  console.log(`   Streamed ${chunkEvts.length} audio chunks. Sample rate: ${startEvt.sample_rate}Hz.`);
  console.log(`   First chunk length: ${chunkEvts[0].audio_base64.length} chars.`);
  console.log(`   Total duration: ${endEvt.total_duration_ms}ms.`);
  console.log('   ✓ Real-time Audio Chunk Streaming verified');

  console.log('--- Python Voice Microservice & WebSocket Streaming Tests Passed ---\n');
}

// Direct execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  runVoiceMicroserviceTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test failed:', err);
      process.exit(1);
    });
}
