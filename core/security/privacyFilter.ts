/**
 * Privacy Filter & Sensitive Data Engine (Phase 2 - Step 4)
 * Deterministic, local-first privacy pipeline coordinating:
 * Incoming Content -> Sensitive Data Detector -> Classification -> Policy Decision -> Safe Content / Block
 *
 * Guarantees:
 * - Deterministic local execution (zero AI or cloud dependency)
 * - OTPs and high-risk security codes immediately trigger BLOCK and abort external AI
 * - Raw secrets NEVER appear in safe outputs, logs, or permanent memory
 * - AI model is NEVER allowed to override the privacy filter
 */

import { SecurityClassification, PrivacyAction, PrivacyFilterResult } from './types.ts';
import { SensitiveDataDetector } from './sensitiveDataDetector.ts';
import { PrivacyPolicy } from './privacyPolicy.ts';
import { Redactor } from './redactor.ts';
import { OtpLock } from './otpLock.ts';
import { logger } from '../logger.ts';

export class PrivacyFilter {
  /**
   * Main privacy pipeline entry point.
   * Evaluates input text, classifies sensitivity, applies policy, and returns safe content.
   */
  public static filterInput(rawInput: string): PrivacyFilterResult {
    if (!rawInput || typeof rawInput !== 'string') {
      return {
        cleanText: '',
        safeContent: '',
        classification: 'NORMAL',
        action: 'ALLOW',
        hadSensitiveData: false,
        detectedTypes: [],
        shouldAbortExternalCall: false,
      };
    }

    const text = rawInput.trim();
    if (!text) {
      return {
        cleanText: '',
        safeContent: '',
        classification: 'NORMAL',
        action: 'ALLOW',
        hadSensitiveData: false,
        detectedTypes: [],
        shouldAbortExternalCall: false,
      };
    }

    // Step 1: Detect sensitive data locally & deterministically
    const detection = SensitiveDataDetector.detect(text);

    // Step 2: Policy Decision
    const policy = PrivacyPolicy.evaluate(detection, text);

    // Step 3: Handle High-Priority OTP Lock
    if (detection.classification === 'OTP' || (policy.action === 'BLOCK' && detection.detectedTypes.includes('OTP'))) {
      const lockResult = OtpLock.enforce(text);
      logger.info('PrivacyFilter', 'Sensitive content blocked: OTP detected');
      return {
        cleanText: lockResult.safeContent,
        safeContent: lockResult.safeContent,
        classification: 'OTP',
        action: 'BLOCK',
        hadSensitiveData: true,
        detectedTypes: detection.detectedTypes,
        shouldAbortExternalCall: true,
        abortCategory: 'OTP',
        userNotice:
          policy.userNotice ||
          '[Privacy Shield Activated] Aapke message mein One-Time Password (OTP) detect hua hai. Suraksha ke mutabiq yeh data kisi AI model ko send nahi kiya jayega.',
        reason: policy.reason,
      };
    }

    // Step 4: Handle Other Block Actions (Banking codes, PIN, CVV, Passwords)
    if (policy.action === 'BLOCK') {
      logger.info('PrivacyFilter', `Sensitive content blocked: ${detection.classification}`);
      const redacted = Redactor.redact(text, detection.matches, detection.classification);
      let abortCategory: PrivacyFilterResult['abortCategory'] = 'CREDENTIAL';
      if (detection.classification === 'FINANCIAL') abortCategory = 'PIN';
      else if (detection.classification === 'SECURITY_CODE') abortCategory = 'SECURITY_CODE';

      return {
        cleanText: redacted,
        safeContent: redacted,
        classification: detection.classification,
        action: 'BLOCK',
        hadSensitiveData: true,
        detectedTypes: detection.detectedTypes,
        shouldAbortExternalCall: true,
        abortCategory,
        userNotice: policy.userNotice || "I can't send sensitive security information to the AI service.",
        reason: policy.reason,
      };
    }

    // Step 5: Handle Redaction Actions (API keys, Access Tokens, Card numbers in queries)
    if (policy.action === 'REDACT') {
      const redacted = Redactor.redact(text, detection.matches, detection.classification);
      logger.info('PrivacyFilter', `Sensitive content masked: ${detection.detectedTypes.join(', ')}`);
      return {
        cleanText: redacted,
        safeContent: redacted,
        classification: detection.classification,
        action: 'REDACT',
        hadSensitiveData: true,
        detectedTypes: detection.detectedTypes,
        shouldAbortExternalCall: false,
        userNotice: policy.userNotice,
        reason: policy.reason,
      };
    }

    // Step 6: Normal Non-Sensitive Content
    return {
      cleanText: text,
      safeContent: text,
      classification: 'NORMAL',
      action: 'ALLOW',
      hadSensitiveData: false,
      detectedTypes: [],
      shouldAbortExternalCall: false,
      reason: 'Allowed non-sensitive content',
    };
  }

  /**
   * Alias method for explicit pipeline invocation.
   */
  public static evaluate(input: string): PrivacyFilterResult {
    return this.filterInput(input);
  }

  /**
   * Convenience filter method returning standard flags and findings.
   */
  public static filter(input: string): {
    blocked: boolean;
    redactedText: string;
    findings: Array<{ type: string; value: string }>;
    result: PrivacyFilterResult;
  } {
    const res = this.filterInput(input);
    return {
      blocked: res.action === 'BLOCK',
      redactedText: res.safeContent || res.cleanText,
      findings: res.detectedTypes.map((t) => ({ type: t, value: '' })),
      result: res,
    };
  }
}
