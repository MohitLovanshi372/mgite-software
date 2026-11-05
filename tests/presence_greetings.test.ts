import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PresenceGreetings, greetingText } from '../src/people/presenceGreetings.ts';
import type { FaceTrack } from '../src/people/faceMemory.ts';
const face = (known = true): FaceTrack => ({ id: 1, frames: 4, lastSeen: 0, descriptor: Array(128).fill(.01), x: .4, y: .2, width: .2, height: .3, person: known ? { id: 'p1', name: 'Mohit', descriptor: Array(128).fill(.01), createdAt: '' } : null });
test('stable front-facing arrivals get a greeting', () => {
 const policy = new PresenceGreetings(), person = face(); policy.observe([person], 0);
 assert.equal(policy.next([person], 0, false)?.person?.name, 'Mohit');
 policy.mark(person, 0);
 for (let time = 1000; time < 180000; time += 1000) { policy.observe([person], time); assert.equal(policy.next([person], time, false), null); }
});
test('returning person is greeted after a real absence and cooldown', () => {
 const policy = new PresenceGreetings(), person = face(); policy.observe([person], 0); policy.mark(person, 0);
 policy.observe([], 20000); policy.observe([person], 30000);
 assert.equal(policy.next([person], 30000, false), null);
 policy.observe([], 45000); policy.observe([person], 65000);
 assert.equal(policy.next([person], 65000, false)?.id, person.id);
});
test('side faces, distant faces and unstable detections do not trigger an introduction', () => {
 const policy = new PresenceGreetings();
 for (const person of [{...face(),x:0,width:.15},{...face(),width:.05},{...face(),frames:2}]) {
  policy.observe([person], 0); assert.equal(policy.next([person], 0, false), null);
 }
});
test('busy conversations are not interrupted and can greet later', () => {
 const policy = new PresenceGreetings(), person = face(); policy.observe([person], 0);
 assert.equal(policy.next([person], 0, true), null); assert.equal(policy.next([person], 0, false)?.id, 1);
});
test('unknown faces are not repeatedly asked when tracking IDs change', () => {
 const policy = new PresenceGreetings(), person = face(false); policy.mark(person, 0);
 assert.equal(policy.next([{...person,id:5}], 20000, false), null);
 policy.observe([], 301000); assert.equal(policy.next([{...person,id:5}], 301000, false)?.id, 5);
});
test('one person is addressed at a time and greetings are paced', () => {
 const policy = new PresenceGreetings(), first = face(), second = {...face(), id:2, person:{...face().person!,id:'p2'}};
 policy.observe([first,second], 0); policy.mark(first, 0);
 assert.equal(policy.next([first,second], 1000, false), null);
 assert.equal(policy.next([first,second], 15000, false)?.id, 2);
});
test('greetings are friendly and never refer to a visible camera preview', () => {
 assert.match(greetingText('Mohit','en-IN'),/Mohit.*How are you/);
 assert.match(greetingText(null,'hi-IN'),/कैसे हो.*अच्छा लगा.*नाम/);
 assert.doesNotMatch(greetingText(null,'hi-IN'),/स्क्रीन/);
});
test('simple greeting replies work locally without consuming unrelated requests', async () => {
 const { smallTalkReply } = await import('../src/people/presenceGreetings.ts');
 assert.match(smallTalkReply('Main theek hoon','hi-IN')!, /अच्छा लगा/);
 assert.match(smallTalkReply('I am fine, thanks'.replace(',', ''),'en-IN')!, /lovely/);
 assert.match(smallTalkReply('मैं ठीक हूँ।','hi-IN')!, /अच्छा लगा/);
 assert.equal(smallTalkReply('Main theek hoon, set a reminder for tomorrow','hi-IN'), null);
});
