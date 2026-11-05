/**
 * Risk Classifier (Phase 2 - Step 6)
 *
 * Evaluates the potential hazard, system impact, and security implications of user requests.
 * Assigns a deterministic risk level (LOW, MEDIUM, HIGH) to establish the policy boundary.
 *
 * Boundaries:
 * - LOW: Read-only queries, weather, timers, public searches, casual conversation, media playback.
 * - MEDIUM: Communications (email, SMS, WhatsApp), phone calls, modifying calendar schedules.
 * - HIGH: Financial transactions (payments, UPI, transfers), data deletion, account/security credential changes.
 *
 * NOTE: Phase 2 only defines the policy foundation. Dangerous actions MUST NOT be executed.
 */

import { IntentType, RiskLevel, IntentEntities } from './types.ts';

export class RiskClassifier {
  /**
   * Evaluates the risk category of an intent and its contextual payload.
   */
  public static classify(
    intent: IntentType,
    text: string,
    entities?: IntentEntities
  ): { riskLevel: RiskLevel; reason: string } {
    const lower = text.toLowerCase();

    // 1. HIGH RISK CHECKS: Financial, destructive data changes, account/security modifications
    if (
      /(transfer\s+money|send\s+money|paise\s+transfer|paise\s+bhejo|rupaye\s+bhejo|payment|pay\s+\d+|upi\s+pay|fund\s+transfer|credit\s+card|net\s*banking)/i.test(
        lower
      )
    ) {
      return {
        riskLevel: 'HIGH',
        reason: 'Financial transaction detected (payment/money transfer)',
      };
    }

    if (
      /(delete\s+all|wipe\s+|format\s+disk|drop\s+database|destroy|erase\s+all|saara\s+data\s+delete|data\s+uda\s+do|rm\s+-rf|powershell|terminal|bash|shell\s+command|exec\s+command|run\s+command)/i.test(
        lower
      )
    ) {
      return {
        riskLevel: 'HIGH',
        reason: 'Destructive system/data deletion command or arbitrary shell execution detected',
      };
    }

    if (
      /(change\s+password|security\s+settings|disable\s+auth|reset\s+credentials|update\s+api\s*key|turn\s+off\s+firewall|security\s+band\s+karo)/i.test(
        lower
      )
    ) {
      return {
        riskLevel: 'HIGH',
        reason: 'Security or account authorization modification detected',
      };
    }

    // 2. MEDIUM RISK CHECKS: External messaging, emails, phone calls, calendar events
    if (
      /(send\s+email|email\s+bhejo|mail\s+karo|whatsapp\s+message|sms\s+bhejo|call\s+karo|phone\s+lagao|make\s+a\s+call|meeting\s+schedule|reschedule\s+calendar|delete\s+calendar)/i.test(
        lower
      )
    ) {
      return {
        riskLevel: 'MEDIUM',
        reason: 'External communication or schedule modification detected',
      };
    }

    // 3. LOW RISK CHECKS: Standard reading, question answering, public lookups, UI operations
    if (intent === 'CHAT' || intent === 'QUESTION' || intent === 'INFORMATION_REQUEST') {
      return {
        riskLevel: 'LOW',
        reason: 'Informational or conversational query with zero system impact',
      };
    }

    if (
      intent === 'COMPUTER_ACTION_REQUEST' &&
      /(youtube|browser|chrome|spotify|calculator|volume|brightness|scroll)/i.test(lower)
    ) {
      return {
        riskLevel: 'LOW',
        reason: 'Safe local application or playback request',
      };
    }

    if (intent === 'REMINDER_REQUEST' || intent === 'TASK_REQUEST') {
      return {
        riskLevel: 'LOW',
        reason: 'Standard reminder/task management request',
      };
    }

    if (intent === 'SETTINGS_REQUEST' || intent === 'SYSTEM_STATUS_REQUEST') {
      return {
        riskLevel: 'LOW',
        reason: 'Read-only system diagnostic or client theme preference request',
      };
    }

    return {
      riskLevel: 'LOW',
      reason: 'Default benign classification',
    };
  }
}
