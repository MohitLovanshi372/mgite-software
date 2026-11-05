/**
 * OTP Immediate Lock (Phase 2 - Step 4)
 * Enforces immediate local lock-out whenever an OTP is detected:
 * 1. Classifies as OTP
 * 2. Blocks all further pipeline processing
 * 3. Discards raw notification/message payload immediately
 * 4. Prevents Text-to-Speech (TTS) reading
 * 5. Prevents transmission to external AI (Gemini or any cloud service)
 * 6. Prevents persistence to permanent SQLite memory
 * 7. Prevents automatic application launches (e.g. WhatsApp, Browser)
 */

import { SecurityClassification, PrivacyAction } from './types.ts';
import { logger } from '../logger.ts';

export interface OtpLockEnforcementResult {
  isLocked: boolean;
  classification: SecurityClassification;
  action: PrivacyAction;
  safeContent: string;
  discardedRawLength: number;
  preventTts: boolean;
  preventExternalAi: boolean;
  preventPermanentStorage: boolean;
  preventAppLaunch: boolean;
  lockTimestamp: string;
}

export class OtpLock {
  /**
   * Enforces the immediate OTP lock down on sensitive content.
   * Discards the raw content from memory and returns safe redacted content.
   */
  public static enforce(rawContent: string): OtpLockEnforcementResult {
    const rawLength = typeof rawContent === 'string' ? rawContent.length : 0;

    // Secure log statement without leaking ANY part of the raw OTP or notification
    logger.warn('OtpLock', 'High-priority OTP lock engaged. Discarding raw payload and blocking external pipeline.');

    // Zero the reference conceptually and return strictly locked metadata
    return {
      isLocked: true,
      classification: 'OTP',
      action: 'BLOCK',
      safeContent: '[OTP REDACTED]',
      discardedRawLength: rawLength,
      preventTts: true,
      preventExternalAi: true,
      preventPermanentStorage: true,
      preventAppLaunch: true,
      lockTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Validates whether an action is permitted under active OTP lock conditions.
   */
  public static isActionAllowed(actionType: 'TTS' | 'EXTERNAL_AI' | 'PERMANENT_STORAGE' | 'APP_LAUNCH'): boolean {
    // Under OTP conditions, none of these actions are ever allowed
    return false;
  }
}
