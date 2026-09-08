/**
 * Privacy Policy Decision Engine (Phase 2 - Step 4)
 * Translates sensitive data classifications into deterministic policy decisions:
 * ALLOW, REDACT, BLOCK, SILENT.
 *
 * Enforces immediate abort for OTP and high-risk security codes.
 */

import { SecurityClassification, PrivacyAction, SensitiveDetectionResult } from './types.ts';

export interface PolicyDecision {
  action: PrivacyAction;
  shouldAbortPipeline: boolean;
  suppressAudio: boolean;
  suppressStorage: boolean;
  suppressExternalAI: boolean;
  userNotice?: string;
  reason: string;
}

export class PrivacyPolicy {
  /**
   * Evaluates classification and detection details to issue a strict policy decision.
   */
  public static evaluate(detection: SensitiveDetectionResult, rawInput: string): PolicyDecision {
    switch (detection.classification) {
      case 'OTP':
        return {
          action: 'BLOCK',
          shouldAbortPipeline: true,
          suppressAudio: true,
          suppressStorage: true,
          suppressExternalAI: true,
          userNotice:
            '[Privacy Shield Activated] Aapke message mein One-Time Password (OTP) detect hua hai. Suraksha ke mutabiq yeh data kisi AI model ko send nahi kiya jayega.',
          reason: 'OTP detected. High-priority security policy blocked all external processing and permanent storage.',
        };

      case 'SECURITY_CODE':
        return {
          action: 'BLOCK',
          shouldAbortPipeline: true,
          suppressAudio: true,
          suppressStorage: true,
          suppressExternalAI: true,
          userNotice:
            '[Privacy Shield Activated] Banking ya payment security code detect hua hai. Suraksha ke mutabiq processing block kar di gayi hai.',
          reason: 'Banking or payment authorization security code detected. External transmission blocked.',
        };

      case 'FINANCIAL': {
        const isPinOrCvv =
          detection.detectedTypes.includes('UPI_PIN') ||
          detection.detectedTypes.includes('PIN') ||
          detection.detectedTypes.includes('CVV');

        if (isPinOrCvv) {
          return {
            action: 'BLOCK',
            shouldAbortPipeline: true,
            suppressAudio: true,
            suppressStorage: true,
            suppressExternalAI: true,
            userNotice:
              '[Privacy Shield Activated] UPI/ATM PIN ya CVV detect hua hai. Suraksha ke mutabiq yeh data share nahi kiya ja sakta.',
            reason: 'High-risk financial credential (PIN/CVV) detected. Pipeline blocked.',
          };
        }

        return {
          action: 'REDACT',
          shouldAbortPipeline: false,
          suppressAudio: false,
          suppressStorage: false,
          suppressExternalAI: false,
          userNotice: 'Financial information detected and masked for privacy.',
          reason: 'Financial card/data redacted before external processing.',
        };
      }

      case 'CREDENTIAL': {
        // If message contains a raw password, block it
        if (detection.detectedTypes.includes('PASSWORD')) {
          return {
            action: 'BLOCK',
            shouldAbortPipeline: true,
            suppressAudio: true,
            suppressStorage: true,
            suppressExternalAI: true,
            userNotice:
              '[Privacy Shield Activated] Password detect hua hai. Suraksha ke mutabiq password AI ko send nahi kiya jayega.',
            reason: 'Password detected. Transmission blocked.',
          };
        }

        // For API keys / tokens in queries: redact them so prompt can safely continue
        return {
          action: 'REDACT',
          shouldAbortPipeline: false,
          suppressAudio: false,
          suppressStorage: false,
          suppressExternalAI: false,
          userNotice: 'Sensitive API key or credential masked for privacy.',
          reason: 'Credential masked with [REDACTED]. Safe to proceed.',
        };
      }

      case 'SENSITIVE':
        return {
          action: 'REDACT',
          shouldAbortPipeline: false,
          suppressAudio: false,
          suppressStorage: false,
          suppressExternalAI: false,
          reason: 'Sensitive data redacted.',
        };

      case 'PRIVATE':
        return {
          action: 'REDACT',
          shouldAbortPipeline: false,
          suppressAudio: false,
          suppressStorage: false,
          suppressExternalAI: false,
          reason: 'Private personal information masked.',
        };

      case 'NORMAL':
      default:
        return {
          action: 'ALLOW',
          shouldAbortPipeline: false,
          suppressAudio: false,
          suppressStorage: false,
          suppressExternalAI: false,
          reason: 'Standard non-sensitive content. Allowed.',
        };
    }
  }
}
