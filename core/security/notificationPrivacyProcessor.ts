/**
 * Notification Privacy Processor (Phase 2 - Step 4)
 * Foundation for future Notification Intelligence.
 *
 * Intercepts notification payloads, executes deterministic offline privacy checks,
 * and outputs a safe policy action (ALLOW, REDACT, BLOCK, SILENT).
 *
 * When an OTP is detected:
 * - Returns classification: "OTP"
 * - Returns action: "BLOCK"
 * - Returns safeContent: "[OTP REDACTED]"
 * The real OTP NEVER appears in the returned safe object.
 */

import { NotificationPayload, NotificationPrivacyResult } from './types.ts';
import { SensitiveDataDetector } from './sensitiveDataDetector.ts';
import { PrivacyPolicy } from './privacyPolicy.ts';
import { Redactor } from './redactor.ts';
import { OtpLock } from './otpLock.ts';
import { logger } from '../logger.ts';

export class NotificationPrivacyProcessor {
  /**
   * Processes incoming notification payload through the privacy pipeline.
   * Handles empty or malformed notifications safely.
   */
  public static process(payload: NotificationPayload | null | undefined): NotificationPrivacyResult {
    // Handle null, undefined, or non-object payloads
    if (!payload || typeof payload !== 'object') {
      return {
        classification: 'NORMAL',
        action: 'SILENT',
        safeContent: '',
        reason: 'Empty or invalid notification payload',
        detectedTypes: [],
      };
    }

    const appName = typeof payload.appName === 'string' ? payload.appName : '';
    const title = typeof payload.title === 'string' ? payload.title : '';
    const content = typeof payload.content === 'string' ? payload.content : '';
    const timestamp = payload.timestamp || Date.now();

    // Check combined text for contextual sensitivity (e.g. title: "Bank Alert", content: "Your OTP is 123456")
    const combinedText = [title, content].filter(Boolean).join(' ');

    if (!combinedText.trim()) {
      return {
        classification: 'NORMAL',
        action: 'SILENT',
        safeContent: '',
        reason: 'Empty notification content',
        detectedTypes: [],
        appName,
        title,
        timestamp,
      };
    }

    // 1. Detect sensitive data offline
    const detection = SensitiveDataDetector.detect(combinedText);

    // 2. Evaluate policy decision
    const policy = PrivacyPolicy.evaluate(detection, combinedText);

    // 3. High-Priority OTP Handling
    if (detection.classification === 'OTP' || policy.action === 'BLOCK' && detection.detectedTypes.includes('OTP')) {
      OtpLock.enforce(content);
      logger.info('NotificationPrivacyProcessor', 'Sensitive notification blocked: OTP detected');
      return {
        classification: 'OTP',
        action: 'BLOCK',
        safeContent: '[OTP REDACTED]',
        reason: 'OTP detected. Immediate lock-out engaged.',
        detectedTypes: ['OTP'],
        appName,
        title: title ? Redactor.redact(title, detection.matches, 'OTP') : '',
        timestamp,
      };
    }

    // 4. Other Blocked Classifications (e.g. PIN, CVV, Banking Security Code)
    if (policy.action === 'BLOCK') {
      logger.info('NotificationPrivacyProcessor', `Sensitive notification blocked: ${detection.classification}`);
      return {
        classification: detection.classification,
        action: 'BLOCK',
        safeContent: Redactor.redact(content, detection.matches, detection.classification),
        reason: policy.reason,
        detectedTypes: detection.detectedTypes,
        appName,
        title: Redactor.redact(title, detection.matches, detection.classification),
        timestamp,
      };
    }

    // 5. Redaction Policy
    if (policy.action === 'REDACT') {
      logger.info('NotificationPrivacyProcessor', `Sensitive notification redacted: ${detection.detectedTypes.join(', ')}`);
      return {
        classification: detection.classification,
        action: 'REDACT',
        safeContent: Redactor.redact(content, detection.matches, detection.classification),
        reason: policy.reason,
        detectedTypes: detection.detectedTypes,
        appName,
        title: Redactor.redact(title, detection.matches, detection.classification),
        timestamp,
      };
    }

    // 6. Normal Policy
    return {
      classification: 'NORMAL',
      action: 'ALLOW',
      safeContent: content,
      reason: 'Normal notification without sensitive security markers',
      detectedTypes: [],
      appName,
      title,
      timestamp,
    };
  }
}
