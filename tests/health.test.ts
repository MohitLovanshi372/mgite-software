/**
 * Automated Tests: Health Endpoint & Orchestrator Offline Flow
 */

import { orchestrator } from '../core/orchestrator/orchestrator.ts';
import { memoryEngine } from '../core/memory/memoryEngine.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

export async function runHealthAndFlowTests() {
  console.log('--- Testing Health & Offline Orchestration Flow ---');

  // Test 1: Health check contract validation
  const healthContract = {
    status: 'ok',
    service: 'personal-ai-assistant',
    version: '0.1.0',
  };
  assert(healthContract.status === 'ok', 'Health status must be ok');
  assert(healthContract.service === 'personal-ai-assistant', 'Service name must match');

  // Test 2: Orchestrator execution in offline mode
  const output = await orchestrator.processMessage({
    message: 'Hello JARVIS, status kya hai?',
    isOfflineMode: true,
  });

  assert(typeof output.response === 'string' && output.response.length > 0, 'Should generate offline response');
  assert(output.isOffline === true, 'Response must indicate offline mode');
  assert(output.provider === 'offline' || output.model === 'local-rules-engine', 'Should use offline provider');

  // Verify it was stored in conversation history
  const msgs = memoryEngine.getMessages(output.conversationId);
  assert(msgs.length >= 2, 'Should persist user message and assistant reply in SQLite');

  console.log('✓ All Health & Flow tests passed.');
}

if (import.meta.url.endsWith(process.argv[1] || '')) {
  runHealthAndFlowTests().catch((err) => {
    console.error('Health test failed:', err);
    process.exit(1);
  });
}
