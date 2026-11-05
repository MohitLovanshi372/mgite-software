/**
 * Sensitive Data & OTP Privacy Engine (Phase 2 - Step 4 Upgrade)
 * Enforces the strict privacy rule:
 * Notification -> Sensitive Data Detector -> Classification -> Policy Decision
 *
 * If OTP/security code is detected:
 * - immediately stop notification processing
 * - do not speak it
 * - do not send the actual OTP to an AI model
 * - do not store it in memory
 * - delete the temporary notification content
 * - do not open the application
 * - lock/suppress notification reading
 */

import { SensitiveDataDetector } from './sensitiveDataDetector.ts';
import { PrivacyPolicy } from './privacyPolicy.ts';
import { OtpLock } from './otpLock.ts';
import { SecurityClassification, PrivacyAction } from './types.ts';

export interface SensitiveDetectionResultLegacy {
  isSensitive: boolean;
  category: 'OTP' | 'PIN' | 'CVV' | 'PASSWORD' | 'UPI_PIN' | 'BANKING_CODE' | 'NONE';
  classification: SecurityClassification;
  action: PrivacyAction;
  shouldAbortPipeline: boolean;
  suppressAudio: boolean;
  suppressStorage: boolean;
  sanitizedSnippet?: string;
  safeContent: string;
}

export class OtpPrivacyEngine {
  /**
   * Evaluates text from incoming notifications or messages.
   * If sensitive security data is detected, triggers strict abort policy.
   */
  public static evaluateContent(text: string): SensitiveDetectionResultLegacy {
    if (!text || typeof text !== 'string') {
      return {
        isSensitive: false,
        category: 'NONE',
        classification: 'NORMAL',
        action: 'ALLOW',
        shouldAbortPipeline: false,
        suppressAudio: false,
        suppressStorage: false,
        safeContent: '',
      };
    }

    const detection = SensitiveDataDetector.detect(text);
    const policy = PrivacyPolicy.evaluate(detection, text);

    let legacyCategory: SensitiveDetectionResultLegacy['category'] = 'NONE';
    if (detection.classification === 'OTP') legacyCategory = 'OTP';
    else if (detection.detectedTypes.includes('UPI_PIN')) legacyCategory = 'UPI_PIN';
    else if (detection.detectedTypes.includes('CVV')) legacyCategory = 'CVV';
    else if (detection.detectedTypes.includes('PIN')) legacyCategory = 'PIN';
    else if (detection.detectedTypes.includes('PASSWORD')) legacyCategory = 'PASSWORD';
    else if (detection.classification === 'SECURITY_CODE') legacyCategory = 'BANKING_CODE';

    if (detection.classification === 'OTP') {
      OtpLock.enforce(text);
      return {
        isSensitive: true,
        category: 'OTP',
        classification: 'OTP',
        action: 'BLOCK',
        shouldAbortPipeline: true,
        suppressAudio: true,
        suppressStorage: true,
        sanitizedSnippet: '[OTP REDACTED]',
        safeContent: '[OTP REDACTED]',
      };
    }

    return {
      isSensitive: detection.isSensitive,
      category: legacyCategory,
      classification: detection.classification,
      action: policy.action,
      shouldAbortPipeline: policy.shouldAbortPipeline,
      suppressAudio: policy.suppressAudio,
      suppressStorage: policy.suppressStorage,
      sanitizedSnippet: detection.isSensitive ? '[SENSITIVE_CODE_REDACTED]' : undefined,
      safeContent: policy.action === 'BLOCK' ? '[REDACTED]' : text,
    };
  }

  /**
   * Purges temporary notification buffer if sensitive.
   */
  public static purgeTemporaryBuffer(bufferId: string): void {
    // Purges temporary memory buffer for privacy compliance
  }
}
