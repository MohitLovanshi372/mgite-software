import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { UltronVoiceEngine } from '../src/utils/ultronVoice.ts';

const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalAudio = Object.getOwnPropertyDescriptor(globalThis, 'Audio');
const requests: Array<{ signal: AbortSignal; resolve: (value: any) => void }> = [];
const audios: FakeAudio[] = [];
let rejectPlayback = false;
class FakeAudio {
  volume = 1;
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  paused = false;
  constructor(public src: string) { audios.push(this); }
  async play() {
    if (rejectPlayback) {
      this.onerror?.();
      throw new Error('Playback unavailable');
    }
  }
  pause() { this.paused = true; }
}
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const response = () => ({ ok: true, json: async () => ({ audioBase64: 'YXVkaW8=' }) });
let engine: UltronVoiceEngine;
let fallbacks: string[];
beforeEach(() => {
  engine?.stop();
  requests.length = 0;
  audios.length = 0;
  rejectPlayback = false;
  fallbacks = [];
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { protocol: 'http:', host: '' } } });
  Object.defineProperty(globalThis, 'Audio', { configurable: true, value: FakeAudio });
  globalThis.fetch = ((_url: any, options: any) => new Promise(resolve => {
    // Deliberately ignore abort to simulate responses already in flight.
    requests.push({ signal: options.signal, resolve });
  })) as typeof fetch;
  engine = new UltronVoiceEngine();
  engine.speakViaWebSpeech = (text) => { fallbacks.push(text); };
});
after(() => {
  engine.stop();
  globalThis.fetch = originalFetch;
  for (const [key, descriptor] of [['window', originalWindow], ['Audio', originalAudio]] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

test('stop aborts pending synthesis and ignores late audio without fallback', async () => {
  engine.speak('Hello');
  engine.stop();
  assert.equal(requests[0].signal.aborted, true);
  requests[0].resolve(response());
  await flush();
  assert.equal(audios.length, 0);
  assert.deepEqual(fallbacks, []);
  assert.equal(engine.getSpeakingStatus(), false);
});

test('a newer reply supersedes an older response arriving last', async () => {
  engine.speak('Old reply');
  engine.speak('New reply');
  requests[1].resolve(response());
  await flush();
  requests[0].resolve(response());
  await flush();
  assert.equal(audios.length, 1);
  assert.equal(engine.getSpeakingStatus(), true);
  assert.deepEqual(fallbacks, []);
});

test('stop during JSON decoding prevents playback', async () => {
  let finishJson!: (value: any) => void;
  engine.speak('Hello');
  requests[0].resolve({ ok: true, json: () => new Promise(resolve => { finishJson = resolve; }) });
  await flush();
  engine.stop();
  finishJson({ audioBase64: 'YXVkaW8=' });
  await flush();
  assert.equal(audios.length, 0);
  assert.deepEqual(fallbacks, []);
});

test('replacing active playback pauses old audio and ignores its late end callback', async () => {
  let oldEnds = 0;
  engine.speak('Old reply', { onEnd: () => oldEnds++ });
  requests[0].resolve(response());
  await flush();
  const oldEnd = audios[0].onended!;
  engine.speak('New reply');
  requests[1].resolve(response());
  await flush();
  oldEnd();
  assert.equal(audios[0].paused, true);
  assert.equal(oldEnds, 0);
  assert.equal(engine.getSpeakingStatus(), true);
});

test('audio error plus play rejection dispatches fallback exactly once', async () => {
  rejectPlayback = true;
  let starts = 0;
  engine.speak('Hello', { onStart: () => starts++ });
  requests[0].resolve(response());
  await flush();
  assert.deepEqual(fallbacks, ['Hello']);
  assert.equal(starts, 0);
  assert.equal(audios[0].paused, true);
  assert.equal(engine.getSpeakingStatus(), false);
});

test('unavailable provider uses browser fallback', async () => {
  engine.speak('Offline hello');
  requests[0].resolve({ ok: false });
  await flush();
  assert.deepEqual(fallbacks, ['Offline hello']);
});

test('successful playback announces start and end once', async () => {
  let starts = 0;
  let ends = 0;
  engine.speak('Hello', { onStart: () => starts++, onEnd: () => ends++ });
  requests[0].resolve(response());
  await flush();
  assert.equal(starts, 1);
  const end = audios[0].onended!;
  end();
  end();
  assert.equal(ends, 1);
  assert.equal(engine.getSpeakingStatus(), false);
});

test('muting cancels pending speech without browser fallback', async () => {
  engine.speak('Hello');
  engine.setMuted(true);
  requests[0].resolve(response());
  await flush();
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(audios.length, 0);
  assert.deepEqual(fallbacks, []);
});

test('browser callbacks from replaced speech cannot reset the new reply', async () => {
  const utterances: any[] = [];
  const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance');
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: class { constructor(public text: string) {} } });
  (window as any).speechSynthesis = { getVoices: () => [], cancel: () => {}, speak: (utterance: any) => utterances.push(utterance) };
  const browserEngine = new UltronVoiceEngine();
  try {
    let oldEnds = 0;
    browserEngine.speakViaWebSpeech('Hello', { onEnd: () => oldEnds++ });
    utterances[0].onstart();
    browserEngine.speakViaWebSpeech('Welcome');
    utterances[1].onstart();
    utterances[0].onend();
    utterances[0].onerror();
    assert.equal(oldEnds, 0);
    assert.equal(browserEngine.getSpeakingStatus(), true);
    browserEngine.stop();
    utterances[1].onstart();
    assert.equal(browserEngine.getSpeakingStatus(), false);
  } finally {
    browserEngine.stop();
    if (originalUtterance) Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', originalUtterance);
    else Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance');
  }
});

test('muted speech completion is suppressed after stop', async () => {
  engine.setMuted(true);
  let ends = 0;
  engine.speak('Hello', { onEnd: () => ends++ });
  engine.stop();
  await new Promise(resolve => setTimeout(resolve, 1050));
  assert.equal(ends, 0);
  assert.equal(requests.length, 0);
});
