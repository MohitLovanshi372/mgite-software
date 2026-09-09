/**
 * Master Test Runner
 * Executes all automated tests for Phase 1 Foundation:
 * - memory operations (add, retrieve, delete)
 * - input sanitization
 * - response validation
 * - settings loading
 * - health endpoint & offline flow
 */

import { runSecurityTests } from './security.test.ts';
import { runMemoryTests } from './memory.test.ts';
import { runSettingsTests } from './settings.test.ts';
import { runHealthAndFlowTests } from './health.test.ts';
import { runPhase2Tests } from './phase2_ai_brain.test.ts';
import { runStep2ArchitectureTests } from './step2_ai_architecture.test.ts';
import { runStep3GeminiProviderTests } from './step3_gemini_provider.test.ts';
import { runGeminiProviderUnitTests } from './gemini_provider.unit.test.ts';
import { runStep4PrivacyTests } from './step4_privacy_filter.test.ts';
import { runStep5MemoryTests } from './step5_memory_engine.test.ts';
import { runStep6IntentAndProactiveTests } from './step6_intent_and_proactive.test.ts';
import { runPhase3VoiceEngineTests } from './phase3_voice_engine.test.ts';
import { runElevenLabsVoiceTests } from './phase3_elevenlabs_tts.test.ts';
import { runPhase4NotificationTests } from './phase4_notification_intelligence.test.ts';

async function main() {
  console.log('========================================');
  console.log('Personal AI Assistant - Automated Test Suite');
  console.log('========================================\n');

  try {
    await runSecurityTests();
    console.log('');
    await runMemoryTests();
    console.log('');
    await runSettingsTests();
    console.log('');
    await runHealthAndFlowTests();
    console.log('');
    await runPhase2Tests();
    console.log('');
    await runStep2ArchitectureTests();
    console.log('');
    await runStep3GeminiProviderTests();
    console.log('');
    await runGeminiProviderUnitTests();
    console.log('');
    await runStep4PrivacyTests();
    console.log('');
    await runStep5MemoryTests();
    console.log('');
    await runStep6IntentAndProactiveTests();
    console.log('');
    await runPhase3VoiceEngineTests();
    console.log('');
    await runElevenLabsVoiceTests();
    console.log('');
    await runPhase4NotificationTests();
    console.log('\n========================================');
    console.log('ALL AUTOMATED TESTS (PHASE 1-3 ELEVENLABS & PHASE 4 NOTIFICATION INTELLIGENCE) PASSED (100%)');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

main();
