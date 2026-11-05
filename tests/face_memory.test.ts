import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faceDistance, matchPerson, FaceTracker, spokenName, validDescriptor, PersonProfile } from '../src/people/faceMemory.ts';
const descriptor = (n: number) => Array.from({ length: 128 }, (_, i) => i === 0 ? n : .01);
const profile = (id: string, value: number): PersonProfile => ({ id, name: id, descriptor: descriptor(value), createdAt: '' });
const face = (n: number, x = 0) => ({ descriptor: descriptor(n), x, y: 0, width: .2, height: .3 });
test('rejects corrupt or missing descriptors', () => {
 assert.equal(validDescriptor([1]), false); assert.equal(faceDistance([], descriptor(0)), Infinity);
 assert.equal(validDescriptor(Array(128).fill(NaN)), false);
});
test('recognizes a close saved face and leaves strangers unknown', () => {
 const p = profile('A', 0);
 assert.equal(matchPerson(descriptor(.1), [p])?.id, 'A');
 assert.equal(matchPerson(descriptor(.8), [p]), null);
});
test('ambiguous faces are not assigned an identity', () => {
 assert.equal(matchPerson(descriptor(.1), [profile('A', 0), profile('B', .15)]), null);
});
test('multiple faces retain their IDs when positions and detector order change', () => {
 const tracker = new FaceTracker();
 const first = tracker.update([face(0, 0), face(1, .5)], [], 0);
 const next = tracker.update([face(1.01, 0), face(.01, .5)], [], 400);
 assert.equal(next[0].id, first[1].id); assert.equal(next[1].id, first[0].id);
 assert.equal(next[0].frames, 2);
});
test('lost faces cannot retain an enrollment ID after disappearance', () => {
 const tracker = new FaceTracker(); const first = tracker.update([face(0)], [], 0)[0];
 tracker.update([], [], 400);
 assert.notEqual(tracker.update([face(0)], [], 800)[0].id, first.id);
});
test('two detections never both receive the same saved identity', () => {
 const tracks = new FaceTracker().update([face(0), face(.1)], [profile('A', 0)], 0);
 assert.ok(tracks.every(track => track.person === null));
});
test('normalizes spoken introductions while preserving Unicode names', () => {
 assert.equal(spokenName('Mera naam Mohit hai'), 'Mohit');
 assert.equal(spokenName('मेरा नाम मोहित है।'), 'मोहित');
 assert.equal(spokenName('My name is Alex.'), 'Alex');
 assert.equal(spokenName('Aarav Singh'), 'Aarav Singh');
 assert.equal(spokenName('x'.repeat(100)).length, 60);
});
test('slow inference retains visible faces while an expired session gets a fresh ID', () => {
 const tracker = new FaceTracker(); const first = tracker.update([face(0)], [], 0)[0];
 const slow = tracker.update([face(.01)], [], 2500)[0];
 assert.equal(slow.id, first.id); assert.equal(slow.frames, 2);
 assert.notEqual(tracker.update([face(.01)], [], 15000)[0].id, first.id);
});
