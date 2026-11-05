import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sampleSpeechAnimation } from '../src/avatar/speechAnimation.ts';
import { HumanBoyRig } from '../src/avatar/HumanBoyRig.ts';

test('idle and stopped speech close the mouth regardless of audio energy', () => {
  assert.deepEqual(sampleSpeechAnimation({ speaking: false, elapsed: 1, text: 'hello', amplitude: 1 }), { speaking: false, mouthOpen: 0, mouthWidth: 1, source: 'idle' });
});
test('audio silence closes the mouth and audible amplitude opens it', () => {
  const input = { speaking: true, elapsed: .3, text: 'hello' };
  assert.equal(sampleSpeechAnimation({ ...input, amplitude: 0 }).mouthOpen, 0);
  assert.ok(sampleSpeechAnimation({ ...input, amplitude: .08 }).mouthOpen > .4);
  assert.equal(sampleSpeechAnimation({ ...input, amplitude: 10 }).mouthOpen, 1);
  assert.equal(sampleSpeechAnimation({ ...input, amplitude: -1 }).mouthOpen, 0);
});
test('browser fallback follows speech timing and closes on pauses and lip consonants', () => {
  for (const text of [' ', '.', 'm', 'b', 'p']) assert.equal(sampleSpeechAnimation({ speaking: true, elapsed: .2, text }).mouthOpen, 0);
  assert.ok(sampleSpeechAnimation({ speaking: true, elapsed: .2, text: 'a' }).mouthOpen > 0);
  assert.equal(sampleSpeechAnimation({ speaking: true, elapsed: .2, text: 'hello' }).source, 'timing');
});
test('round and wide vowels produce distinct mouth shapes, including Hindi', () => {
  const rounded = sampleSpeechAnimation({ speaking: true, elapsed: 0, text: 'ो', amplitude: .1 });
  const wide = sampleSpeechAnimation({ speaking: true, elapsed: 0, text: 'ई', amplitude: .1 });
  assert.ok(rounded.mouthWidth < wide.mouthWidth);
});
test('avatar mouth settles closed after cancellation, including with reduced motion', () => {
  const rig = new HumanBoyRig();
  const speaking = sampleSpeechAnimation({ speaking: true, elapsed: 0, text: 'a', amplitude: .15 });
  let opening = 0;
  for (let i = 0; i < 30; i++) opening = rig.update(1 / 60, i / 60, speaking, { x: 0, y: 0 }, true);
  assert.ok(opening > .8);
  const idle = sampleSpeechAnimation({ speaking: false, elapsed: 0, text: '' });
  for (let i = 0; i < 30; i++) opening = rig.update(1 / 60, i / 60, idle, { x: 0, y: 0 }, true);
  assert.ok(opening < .001);
  rig.dispose();
});
