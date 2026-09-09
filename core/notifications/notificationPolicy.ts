/**
 * Notification Policy Engine (Phase 4 - Step 3)
 * Enforces the strict 6-stage security and priority pipeline:
 * 1. Security (OTP / Code detection -> BLOCK)
 * 2. Privacy (Credentials / Financial -> BLOCK / REDACT)
 * 3. User Permissions (Intelligence enabled/disabled)
 * 4. Risk & Quiet Hours Policy
 * 5. Importance Assessment
 * 6. Final Action (BLOCK, IGNORE, SILENT, SHOW, SPEAK)
 *
 * Security and privacy ALWAYS override user priority apps, contacts, and settings.
 */

import { NotificationAction, NotificationConfig, NotificationImportance } from './types.ts';
import { SecurityClassification } from '../security/types.ts';

export interface PolicyEvaluationInput {
  classification: SecurityClassification;
  importance: NotificationImportance;
  config: NotificationConfig;
  isQuietHours: boolean;
  isCooldownSuppressed: boolean;
  voiceEnabled: boolean;
}

export interface PolicyDecision {
  action: NotificationAction;
  canSpeak: boolean;
  canShow: boolean;
  reason: string;
}

export class NotificationPolicy {
  /**
   * Evaluates the policy in strict priority order.
   */
  public static evaluate(input: PolicyEvaluationInput): PolicyDecision {
    const {
      classification,
      importance,
      config,
      isQuietHours,
      isCooldownSuppressed,
      voiceEnabled,
    } = input;

    // 1. Stage 1: Security & OTP Lockout
    // MANDATORY: If OTP or Security Code, IMMEDIATELY BLOCK.
    if (classification === 'OTP') {
      return {
        action: 'BLOCK',
        canSpeak: false,
        canShow: false,
        reason: 'Security Rule: OTP detected. Absolute lockout engaged.',
      };
    }

    if (classification === 'SECURITY_CODE') {
      return {
        action: 'BLOCK',
        canSpeak: false,
        canShow: false,
        reason: 'Security Rule: Security Code or Payment Authorization detected. Blocked.',
      };
    }

    // 2. Stage 2: Privacy Policy (Credentials, PINs, CVVs, Financials)
    if (classification === 'FINANCIAL' || classification === 'CREDENTIAL') {
      return {
        action: 'BLOCK',
        canSpeak: false,
        canShow: false,
        reason: `Privacy Rule: Sensitive ${classification} data detected. Blocked from audio and storage.`,
      };
    }

    // 3. Stage 3: User Permissions & Master Switch
    if (!config.enabled) {
      return {
        action: 'IGNORE',
        canSpeak: false,
        canShow: false,
        reason: 'Notification Intelligence is disabled by user configuration.',
      };
    }

    // 4. Stage 4: Risk, Quiet Hours, and Cooldown Policy
    // Cooldown suppression: prevent duplicate speech
    if (isCooldownSuppressed) {
      return {
        action: 'SILENT',
        canSpeak: false,
        canShow: true,
        reason: 'Speech suppressed: Cooldown active for recent identical notification.',
      };
    }

    // Quiet Hours suppression
    if (isQuietHours) {
      if (importance === 'CRITICAL') {
        // Critical alerts still show on UI, optional audio if permitted
        return {
          action: voiceEnabled ? 'SPEAK' : 'SHOW',
          canSpeak: voiceEnabled,
          canShow: true,
          reason: 'Quiet Hours active: Critical emergency alert permitted.',
        };
      }
      // Normal and Important notifications are muted during quiet hours
      return {
        action: 'SILENT',
        canSpeak: false,
        canShow: true,
        reason: 'Quiet Hours active: Audio speech muted according to quiet hours policy.',
      };
    }

    // 5. Stage 5: Importance Assessment & TTS Policy
    switch (importance) {
      case 'CRITICAL': {
        const speak = voiceEnabled;
        return {
          action: speak ? 'SPEAK' : 'SHOW',
          canSpeak: speak,
          canShow: true,
          reason: 'Critical notification: High-priority delivery.',
        };
      }

      case 'IMPORTANT': {
        const shouldSpeak = voiceEnabled && config.read_important_notifications;
        return {
          action: shouldSpeak ? 'SPEAK' : 'SILENT',
          canSpeak: shouldSpeak,
          canShow: true,
          reason: shouldSpeak
            ? 'Important notification: Speaking according to user preferences.'
            : 'Important notification: Displaying silently without audio.',
        };
      }

      case 'NORMAL': {
        const shouldSpeak = voiceEnabled && config.read_normal_notifications;
        return {
          action: shouldSpeak ? 'SPEAK' : 'SILENT',
          canSpeak: shouldSpeak,
          canShow: true,
          reason: shouldSpeak
            ? 'Normal notification: Speaking according to user preferences.'
            : 'Normal notification: Displaying silently without audio.',
        };
      }

      case 'LOW':
      default:
        return {
          action: 'IGNORE',
          canSpeak: false,
          canShow: false,
          reason: 'Low priority or promotional notification ignored.',
        };
    }
  }

  /**
   * Checks if current time is within configured quiet hours window.
   */
  public static isWithinQuietHours(
    enabled: boolean,
    startStr: string,
    endStr: string,
    now: Date = new Date()
  ): boolean {
    if (!enabled) return false;

    try {
      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);

      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        return false;
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Handle overnight quiet hours (e.g. 22:00 to 07:00)
      if (startMinutes > endMinutes) {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }

      // Same-day quiet hours (e.g. 13:00 to 15:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } catch {
      return false;
    }
  }
}
