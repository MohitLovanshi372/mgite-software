/**
 * Automated Tests: Memory Operations (Add, Retrieve, Delete)
 */

import { memoryEngine } from '../core/memory/memoryEngine.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

export async function runMemoryTests() {
  console.log('--- Testing SQLite Memory Engine ---');

  // Test 1: Create Conversation
  const convId = memoryEngine.createConversation('Test Discussion');
  assert(typeof convId === 'string' && convId.length > 0, 'Should return conversation ID');

  // Test 2: Add and retrieve messages
  memoryEngine.addMessage(convId, 'user', 'Hello assistant');
  memoryEngine.addMessage(convId, 'assistant', 'Namaste, I am ready.');

  const messages = memoryEngine.getMessages(convId);
  assert(messages.length === 2, 'Should have stored 2 messages');
  assert(messages[0].sender === 'user', 'First message should be user');
  assert(messages[1].sender === 'assistant', 'Second message should be assistant');

  // Test 3: Store memory item with sensitivity
  const memId = memoryEngine.storeMemoryItem('user_nickname', 'DevPro', 'profile', 'NORMAL');
  assert(typeof memId === 'string' && memId.length > 0, 'Should return memory item ID');

  // Test 4: Retrieve memory item
  const memItems = memoryEngine.listMemoryItems('profile');
  const found = memItems.find((m) => m.id === memId);
  assert(found !== undefined, 'Should retrieve stored memory item');
  assert(found?.key === 'user_nickname', 'Key should match');
  assert(found?.value === 'DevPro', 'Value should match');
  assert(found?.sensitivity === 'NORMAL', 'Sensitivity should match');

  // Test 5: Delete memory item
  const deleted = memoryEngine.deleteMemoryItem(memId);
  assert(deleted === true, 'Should successfully delete memory item');

  const afterDelete = memoryEngine.listMemoryItems('profile');
  assert(!afterDelete.some((m) => m.id === memId), 'Deleted memory should not exist');

  // Test 6: Delete conversation
  const convDeleted = memoryEngine.deleteConversation(convId);
  assert(convDeleted === true, 'Should delete conversation');

  console.log('✓ All Memory Engine tests passed.');
}

if (import.meta.url.endsWith(process.argv[1] || '')) {
  runMemoryTests().catch((err) => {
    console.error('Memory test failed:', err);
    process.exit(1);
  });
}
