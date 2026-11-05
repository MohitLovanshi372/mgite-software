/**
 * Notification Privacy Shield (Phase 4 - Sections 6 & 7)
 *
 * Requirements:
 * - Detects and immediately blocks sensitive notification data:
 *   OTP, verification code, password, PIN, UPI PIN, CVV, card security code,
 *   bank security code, authentication code, access token, API key, recovery code,
 *   login credentials, payment authorization code.
 * - Reuses existing security modules (SensitiveDataDetector, OtpLock, Redactor, PrivacyPolicy).
 * - Mixed content protection: If notification has mixed content with secrets (e.g. "Your OTP is 123456 for Netflix"),
 *   blocks the entire notification.
 * - Non-bypassable: Never speaks, never sends to Gemini, never writes to memory.
 * - If uncertain, defaults to safer action: BLOCK or SILENT.
 */

import { NotificationPayload, NotificationPrivacyResult } from '../security/types.ts';
import { NotificationPrivacyProcessor } from '../security/notificationPrivacyProcessor.ts';
import { NotificationAction, NotificationSensitivity } from './types.ts';
import { logger } from '../logger.ts';

export interface PrivacyShieldEvaluation {
  isSensitive: boolean;
  classification: string;
  action: NotificationAction;
  safeTitle: string;
  safeContent: string;
  sensitivity: NotificationSensitivity;
  reason: string;
  detectedTypes: string[];
}

export class NotificationPrivacy {
  /**
   * Additional regex patterns for Phase 4 specific sensitive codes
   */
  private static readonly ADDITIONAL_SENSITIVE_PATTERNS = [
    /\b(?:upi\s*pin|mpin|atm\s*pin)\b/i,
    /\b(?:recovery\s*code|backup\s*code)\b/i,
    /\b(?:card\s*security\s*code|cvv|cvc)\b/i,
    /\b(?:payment\s*approval|payment\s*authorization)\b.*\b\d{4,8}\b/i,
    /\b(?:login\s*verification\s*code|access\s*code|authorization\s*code)\b.*\b\d{4,8}\b/i,
  ];

  /**
   * Evaluates a notification payload through the Privacy Shield.
   */
  public static evaluate(payload: NotificationPayload | null | undefined): PrivacyShieldEvaluation {
    if (!payload || typeof payload !== 'object') {
      return {
        isSensitive: false,
        classification: 'NORMAL',
        action: 'SILENT',
        safeTitle: '',
        safeContent: '',
        sensitivity: 'NORMAL',
        reason: 'Empty notification',
        detectedTypes: [],
      };
    }

    const title = typeof payload.title === 'string' ? payload.title : '';
    const content = typeof payload.content === 'string' ? payload.content : '';
    const combined = `${title} ${content}`.trim();

    // 1. Run through base deterministic NotificationPrivacyProcessor (reusing core security)
    const baseResult = NotificationPrivacyProcessor.process(payload);

    // 2. Run additional Phase 4 checks for edge cases
    let hasAdditionalMatch = false;
    for (const pattern of this.ADDITIONAL_SENSITIVE_PATTERNS) {
      if (pattern.test(combined)) {
        hasAdditionalMatch = true;
        break;
      }
    }

    const isSensitive = baseResult.action === 'BLOCK' || baseResult.classification === 'OTP' || hasAdditionalMatch;

    if (isSensitive) {
      const classification = baseResult.classification === 'OTP' || /otp|verification|2fa/i.test(combined)
        ? 'OTP'
        : baseResult.classification !== 'NORMAL' ? baseResult.classification : 'SENSITIVE';

      return {
        isSensitive: true,
        classification,
        action: 'BLOCK',
        safeTitle: baseResult.title || title,
        safeContent: baseResult.safeContent && !baseResult.safeContent.includes('OTP')
          ? baseResult.safeContent
          : '[SENSITIVE CONTENT BLOCKED]',
        sensitivity: 'CRITICAL',
        reason: baseResult.reason || 'Sensitive credential or authorization code detected',
        detectedTypes: baseResult.detectedTypes.length > 0 ? baseResult.detectedTypes : ['SENSITIVE_DATA'],
      };
    }

    // 3. Normal / Non-sensitive content
    const sensitivity: NotificationSensitivity = baseResult.classification === 'NORMAL' ? 'NORMAL' : 'PUBLIC';
    const action: NotificationAction = baseResult.action === 'BLOCK'
      ? 'BLOCK'
      : baseResult.action === 'REDACT'
      ? 'SHOW'
      : baseResult.action === 'SILENT'
      ? 'SILENT'
      : 'SHOW';

    return {
      isSensitive: false,
      classification: baseResult.classification,
      action,
      safeTitle: baseResult.title || title,
      safeContent: baseResult.safeContent || content,
      sensitivity,
      reason: baseResult.reason || 'Safe notification passed privacy shield',
      detectedTypes: baseResult.detectedTypes,
    };
  }
}
