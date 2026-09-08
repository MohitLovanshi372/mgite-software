/**
 * Phase 2 - Step 6 Automated Test Suite
 *
 * Comprehensive validation of:
 * 1. Intent Classification (CHAT, QUESTION, INFORMATION_REQUEST, REMINDER_REQUEST,
 *    TASK_REQUEST, MEMORY_REQUEST, COMPUTER_ACTION_REQUEST, DOCUMENT_REQUEST,
 *    NOTIFICATION_REQUEST, SETTINGS_REQUEST, SYSTEM_STATUS_REQUEST, UNKNOWN)
 * 2. Multilingual understanding (English, Hindi, Hinglish)
 * 3. Context-aware entity resolution ("Kal college hai" -> "Subah 8 baje yaad dila dena")
 * 4. Risk Classification (LOW, MEDIUM, HIGH)
 * 5. Response Strategy (DIRECT_ANSWER, EXECUTE_TOOL_LATER, ASK_CLARIFICATION,
 *    REQUEST_CONFIRMATION, REFUSE_UNSAFE_ACTION)
 * 6. Privacy boundary & Unsafe action refusal (Password, OTP, credentials)
 * 7. Proactive Intelligence Policy (Quiet Hours, Cooldown window, Sensitive suppression, Priority mapping)
 * 8. Safe Orchestrator execution (No auto tool execution)
 */

import { IntentDetector } from '../core/intent/intentDetector.ts';
import { RiskClassifier } from '../core/intent/riskClassifier.ts';
import { ProactivePolicy } from '../core/intent/proactivePolicy.ts';
import { EntityExtractor } from '../core/intent/entityExtractor.ts';
import { AssistantOrchestrator } from '../core/orchestrator/orchestrator.ts';
import { ProactiveEvent } from '../core/intent/types.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runStep6IntentAndProactiveTests(): Promise<void> {
  console.log('--- Running Phase 2 Step 6: Intent Detection & Proactive Intelligence Tests ---');

  // ==========================================
  // Test 1: Normal English Chat
  // ==========================================
  {
    const result = IntentDetector.detectIntent('Hello, how are you today?');
    assert(result.intent === 'CHAT', `Expected CHAT, got ${result.intent}`);
    assert(result.riskLevel === 'LOW', `Expected LOW risk, got ${result.riskLevel}`);
    assert(result.responseStrategy === 'DIRECT_ANSWER', `Expected DIRECT_ANSWER, got ${result.responseStrategy}`);
    console.log('  ✓ 1. Normal English Chat classified correctly');
  }

  // ==========================================
  // Test 2: Hindi Reminder Request with Entities
  // ==========================================
  {
    const text = 'kal mujhe 10 baje yaad dila dena';
    const result = IntentDetector.detectIntent(text);
    assert(result.intent === 'REMINDER_REQUEST', `Expected REMINDER_REQUEST, got ${result.intent}`);
    assert(result.requiresAction === true, 'Reminder should flag requiresAction = true');
    assert(result.responseStrategy === 'EXECUTE_TOOL_LATER', `Expected EXECUTE_TOOL_LATER, got ${result.responseStrategy}`);
    assert(result.entities.date === 'tomorrow', `Expected date: tomorrow, got ${result.entities.date}`);
    assert(result.entities.time?.includes('10'), `Expected time to contain 10, got ${result.entities.time}`);
    console.log('  ✓ 2. Hindi Reminder Request & entity extraction validated');
  }

  // ==========================================
  // Test 3: Hinglish Information Request
  // ==========================================
  {
    const result = IntentDetector.detectIntent('bhai weather kya hai?');
    assert(result.intent === 'INFORMATION_REQUEST', `Expected INFORMATION_REQUEST, got ${result.intent}`);
    assert(result.entities.query === 'weather', `Expected query: weather, got ${result.entities.query}`);
    assert(result.riskLevel === 'LOW', 'Weather inquiry must be LOW risk');
    assert(result.responseStrategy === 'DIRECT_ANSWER', 'Info request should be DIRECT_ANSWER');
    console.log('  ✓ 3. Hinglish Information Request validated');
  }

  // ==========================================
  // Test 4: Ambiguous Request -> Clarification Strategy
  // ==========================================
  {
    const result = IntentDetector.detectIntent('kal wala kar dena');
    assert(result.intent === 'UNKNOWN', `Expected UNKNOWN for ambiguous command, got ${result.intent}`);
    assert(result.responseStrategy === 'ASK_CLARIFICATION', `Expected ASK_CLARIFICATION, got ${result.responseStrategy}`);
    assert(
      typeof result.clarificationQuestion === 'string' && result.clarificationQuestion.length > 5,
      'Clarification question must be provided'
    );
    console.log(`  ✓ 4. Ambiguous request triggers ASK_CLARIFICATION: "${result.clarificationQuestion}"`);
  }

  // ==========================================
  // Test 5: Question vs Chat Disambiguation
  // ==========================================
  {
    const questionResult = IntentDetector.detectIntent('mera naam kya hai?');
    assert(questionResult.intent === 'QUESTION', `Expected QUESTION, got ${questionResult.intent}`);

    const chatResult = IntentDetector.detectIntent('bas baat karo');
    assert(chatResult.intent === 'CHAT', `Expected CHAT, got ${chatResult.intent}`);
    console.log('  ✓ 5. Distinct question vs casual chat disambiguation validated');
  }

  // ==========================================
  // Test 6: Memory Request
  // ==========================================
  {
    const result = IntentDetector.detectIntent('meri ye baat yaad rakhna ki mujhe coding pasand hai');
    assert(result.intent === 'MEMORY_REQUEST', `Expected MEMORY_REQUEST, got ${result.intent}`);
    assert(result.riskLevel === 'LOW', 'Benign memory command should be LOW risk');
    console.log('  ✓ 6. Explicit memory storage intent identified');
  }

  // ==========================================
  // Test 7: Privacy & Unsafe Action Refusal
  // ==========================================
  {
    // A: Attempting to store a password in memory
    const passResult = IntentDetector.detectIntent('mera password yaad rakhna pass123');
    assert(
      passResult.responseStrategy === 'REFUSE_UNSAFE_ACTION',
      `Expected REFUSE_UNSAFE_ACTION for credentials, got ${passResult.responseStrategy}`
    );

    // B: Dangerous financial transfer
    const moneyResult = IntentDetector.detectIntent('paise transfer kar do');
    assert(moneyResult.intent === 'COMPUTER_ACTION_REQUEST', 'Expected COMPUTER_ACTION_REQUEST');
    assert(moneyResult.riskLevel === 'HIGH', `Expected HIGH risk, got ${moneyResult.riskLevel}`);
    assert(
      moneyResult.responseStrategy === 'REQUEST_CONFIRMATION',
      `Expected REQUEST_CONFIRMATION for high risk transfer, got ${moneyResult.responseStrategy}`
    );

    // C: Destructive deletion command
    const deleteResult = IntentDetector.detectIntent('delete all data immediately');
    assert(deleteResult.riskLevel === 'HIGH', 'Destructive command must be HIGH risk');
    assert(deleteResult.responseStrategy === 'REQUEST_CONFIRMATION', 'Destructive command must require confirmation');
    console.log('  ✓ 7. Privacy & unsafe high-risk action defenses validated');
  }

  // ==========================================
  // Test 8: Context-Aware Intent & Entity Resolution
  // ==========================================
  {
    const history = [
      { role: 'user' as const, content: 'Kal college hai.' },
      { role: 'assistant' as const, content: 'Theek hai, note kar liya.' },
    ];
    const text = 'Subah 8 baje yaad dila dena.';
    const result = IntentDetector.detectIntent(text, { history });

    assert(result.intent === 'REMINDER_REQUEST', `Expected REMINDER_REQUEST, got ${result.intent}`);
    assert(result.entities.date === 'tomorrow', `Expected date: tomorrow from context, got ${result.entities.date}`);
    assert(result.entities.time?.includes('8'), `Expected time: 8, got ${result.entities.time}`);
    assert(result.entities.title?.includes('college'), `Expected title: college, got ${result.entities.title}`);
    console.log('  ✓ 8. Context-aware multi-turn entity inheritance validated');
  }

  // ==========================================
  // Test 9: Proactive Policy - Quiet Hours
  // ==========================================
  {
    ProactivePolicy.resetCooldown();
    const event: ProactiveEvent = {
      id: 'evt-1',
      trigger: 'CALENDAR_EVENT_SOON',
      title: 'Upcoming meeting',
      content: 'Team sync starts in 15 minutes',
      priority: 'NORMAL',
      timestamp: new Date().toISOString(),
    };

    // Simulate 23:30 (inside quiet hours 22:00 - 07:00)
    const lateNight = new Date();
    lateNight.setHours(23, 30, 0, 0);

    const decision = ProactivePolicy.evaluateEvent(event, lateNight);
    assert(decision.shouldNotify === false, 'Event during quiet hours must be suppressed');
    assert(decision.suppressionReason === 'QUIET_HOURS', `Expected QUIET_HOURS, got ${decision.suppressionReason}`);

    // CRITICAL event should override quiet hours
    const criticalEvent: ProactiveEvent = {
      ...event,
      priority: 'CRITICAL',
      title: 'Severe Alert',
      content: 'Critical system emergency',
    };
    const criticalDecision = ProactivePolicy.evaluateEvent(criticalEvent, lateNight);
    assert(criticalDecision.shouldNotify === true, 'CRITICAL event should override quiet hours');
    assert(criticalDecision.deliveryMethod === 'EXPLICIT_ALERT', 'CRITICAL event should use EXPLICIT_ALERT');
    console.log('  ✓ 9. Proactive quiet hours enforcement & critical override validated');
  }

  // ==========================================
  // Test 10: Proactive Policy - Cooldown & Anti-Spam
  // ==========================================
  {
    ProactivePolicy.resetCooldown();
    const daytime = new Date();
    daytime.setHours(14, 0, 0, 0); // 2:00 PM (outside quiet hours)

    const event1: ProactiveEvent = {
      id: 'evt-normal-1',
      trigger: 'REMINDER_DUE',
      title: 'Medicine Reminder',
      content: 'Time for evening vitamins',
      priority: 'NORMAL',
      timestamp: daytime.toISOString(),
    };

    // First event: Should succeed
    const decision1 = ProactivePolicy.evaluateEvent(event1, daytime);
    assert(decision1.shouldNotify === true, 'First daytime event should be approved');
    ProactivePolicy.recordNotification(event1, daytime);

    // Second event 5 minutes later: Should be suppressed by cooldown (15 min cooldown)
    const daytimePlus5 = new Date(daytime.getTime() + 5 * 60 * 1000);
    const event2: ProactiveEvent = {
      id: 'evt-normal-2',
      trigger: 'DEADLINE_APPROACHING',
      title: 'Report due',
      content: 'Weekly status report due in 1 hour',
      priority: 'NORMAL',
      timestamp: daytimePlus5.toISOString(),
    };

    const decision2 = ProactivePolicy.evaluateEvent(event2, daytimePlus5);
    assert(decision2.shouldNotify === false, 'Second event within 5 min must be suppressed by cooldown');
    assert(decision2.suppressionReason === 'COOLDOWN', `Expected COOLDOWN, got ${decision2.suppressionReason}`);

    // Third event 20 minutes later: Should succeed after cooldown expires
    const daytimePlus20 = new Date(daytime.getTime() + 20 * 60 * 1000);
    const decision3 = ProactivePolicy.evaluateEvent(event2, daytimePlus20);
    assert(decision3.shouldNotify === true, 'Event after 20 minutes should be approved');
    console.log('  ✓ 10. Proactive anti-spam cooldown window validated');
  }

  // ==========================================
  // Test 11: Proactive Policy - Sensitive Data Suppression
  // ==========================================
  {
    ProactivePolicy.resetCooldown();
    const daytime = new Date();
    daytime.setHours(11, 0, 0, 0);

    const sensitiveEvent: ProactiveEvent = {
      id: 'evt-leak',
      trigger: 'IMPORTANT_NOTIFICATION',
      title: 'Bank Alert',
      content: 'Your OTP is 445521 for transaction of Rs 5000',
      priority: 'IMPORTANT',
      timestamp: daytime.toISOString(),
    };

    const decision = ProactivePolicy.evaluateEvent(sensitiveEvent, daytime);
    assert(decision.shouldNotify === false, 'Proactive event with OTP must be suppressed');
    assert(
      decision.suppressionReason === 'SENSITIVE_PRIVACY',
      `Expected SENSITIVE_PRIVACY, got ${decision.suppressionReason}`
    );
    console.log('  ✓ 11. Sensitive privacy rules strictly override proactive intelligence');
  }

  // ==========================================
  // Test 12: Proactive Priority Mapping
  // ==========================================
  {
    ProactivePolicy.resetCooldown();
    const now = new Date();
    now.setHours(15, 0, 0, 0);

    // LOW -> SILENT
    const lowEvt: ProactiveEvent = {
      id: 'e-low',
      trigger: 'USER_IDLE',
      title: 'Idle ping',
      content: 'User has been idle for 10 minutes',
      priority: 'LOW',
      timestamp: now.toISOString(),
    };
    assert(ProactivePolicy.evaluateEvent(lowEvt, now).deliveryMethod === 'SILENT', 'LOW priority must be SILENT');

    // NORMAL -> UI_NOTIFICATION
    const normalEvt: ProactiveEvent = {
      id: 'e-norm',
      trigger: 'DEVICE_CONNECTED',
      title: 'Headphones connected',
      content: 'Bluetooth audio active',
      priority: 'NORMAL',
      timestamp: now.toISOString(),
    };
    assert(
      ProactivePolicy.evaluateEvent(normalEvt, now).deliveryMethod === 'UI_NOTIFICATION',
      'NORMAL priority must be UI_NOTIFICATION'
    );

    // IMPORTANT -> OPTIONAL_SPEECH
    const impEvt: ProactiveEvent = {
      id: 'e-imp',
      trigger: 'CALENDAR_EVENT_SOON',
      title: 'Dentist Appointment',
      content: 'Leave in 20 minutes',
      priority: 'IMPORTANT',
      timestamp: now.toISOString(),
    };
    assert(
      ProactivePolicy.evaluateEvent(impEvt, now).deliveryMethod === 'OPTIONAL_SPEECH',
      'IMPORTANT priority must be OPTIONAL_SPEECH'
    );
    console.log('  ✓ 12. Priority-to-delivery channel mapping validated');
  }

  // ==========================================
  // Test 13: Orchestrator Integration - No Auto Tool Execution
  // ==========================================
  {
    const orchestrator = new AssistantOrchestrator();

    // Ambiguous turn -> prompts user for clarification without hallucinating an action
    const out1 = await orchestrator.processMessage({
      message: 'kal wala kar dena',
      isOfflineMode: true,
    });
    assert(out1.intent?.intent === 'UNKNOWN', 'Orchestrator should detect UNKNOWN');
    assert(out1.intent?.responseStrategy === 'ASK_CLARIFICATION', 'Should ask clarification');
    assert(out1.response.includes('Kal kya karna hai'), 'Should return clarification question');

    // High risk turn -> asks confirmation without executing
    const out2 = await orchestrator.processMessage({
      message: 'paise transfer kar do',
      isOfflineMode: true,
    });
    assert(out2.intent?.riskLevel === 'HIGH', 'Should flag HIGH risk');
    assert(out2.intent?.responseStrategy === 'REQUEST_CONFIRMATION', 'Should request confirmation');
    assert(out2.response.includes('confirm'), 'Response should mention confirmation');

    // Reminder request -> classified properly with entities, not executing real alarms yet
    const out3 = await orchestrator.processMessage({
      message: 'kal subah 10 baje yaad dila dena',
      isOfflineMode: true,
    });
    assert(out3.intent?.intent === 'REMINDER_REQUEST', 'Should detect REMINDER_REQUEST');
    assert(out3.intent?.entities.time?.includes('10'), 'Should extract time');
    assert(out3.intent?.responseStrategy === 'EXECUTE_TOOL_LATER', 'Should set EXECUTE_TOOL_LATER');

    console.log('  ✓ 13. Orchestrator pipeline integration and tool non-execution confirmed');
  }

  console.log('\n--- ALL STEP 6 INTENT & PROACTIVE TESTS PASSED (100%) ---');
}
