/**
 * Proactive Policy Engine (Phase 2 - Step 6)
 *
 * Coordinates proactive intelligence decisions, respecting:
 * 1. Global Proactive Feature Flag (PROACTIVE_ENABLED)
 * 2. Strict Privacy Filtering (No OTPs, passwords, PINs, CVVs, financial secrets in proactive output)
 * 3. Quiet Hours Policy (e.g. 22:00 to 07:00)
 * 4. Anti-Spam Cooldown Window (PROACTIVE_COOLDOWN_MINUTES)
 * 5. Event Priority Mapping (LOW -> SILENT, NORMAL -> UI, IMPORTANT -> OPTIONAL_SPEECH, CRITICAL -> EXPLICIT_ALERT)
 *
 * Phase 2 creates the policy & trigger interface only (no background hardware listeners).
 */

import {
  ProactiveEvent,
  ProactiveDecision,
  EventPriority,
} from './types.ts';
import { getConfig } from '../../config/settings.ts';
import { PrivacyFilter } from '../security/privacyFilter.ts';
import { logger } from '../logger.ts';

export class ProactivePolicy {
  private static lastNotificationTime: number = 0;
  private static notificationHistory: Array<{ id: string; timestamp: number; trigger: string }> = [];

  /**
   * Resets the cooldown clock (useful for tests or user interaction resets).
   */
  public static resetCooldown(): void {
    this.lastNotificationTime = 0;
    this.notificationHistory = [];
  }

  /**
   * Evaluates whether a proactive event may be dispatched to the user.
   */
  public static evaluateEvent(
    event: ProactiveEvent,
    now: Date = new Date()
  ): ProactiveDecision {
    const config = getConfig().proactive;

    // 1. Check Global Feature Switch
    if (!config.enabled) {
      return {
        shouldNotify: false,
        reason: 'Proactive intelligence is globally disabled in configuration.',
        deliveryMethod: 'SILENT',
        isSuppressed: true,
        suppressionReason: 'DISABLED',
      };
    }

    // 2. Strict Privacy Safety Boundary (Never mention OTP, passwords, PINs, CVV, financial secrets)
    const combinedText = `${event.title} ${event.content}`;
    const privacyResult = PrivacyFilter.filterInput(combinedText);

    if (
      privacyResult.hadSensitiveData ||
      privacyResult.shouldAbortExternalCall ||
      privacyResult.classification === 'OTP' ||
      privacyResult.classification === 'CREDENTIAL' ||
      privacyResult.classification === 'FINANCIAL' ||
      privacyResult.classification === 'SECURITY_CODE' ||
      /(otp|password|passcode|cvv|pin|private\s+message|secret\s+key)/i.test(combinedText)
    ) {
      logger.warn('ProactivePolicy', `Proactive event ${event.id} suppressed: sensitive privacy policy triggered.`);
      return {
        shouldNotify: false,
        reason: 'Proactive notification suppressed: Contains sensitive authentication/financial data.',
        deliveryMethod: 'SILENT',
        isSuppressed: true,
        suppressionReason: 'SENSITIVE_PRIVACY',
      };
    }

    // 3. Check Quiet Hours (CRITICAL alerts may override quiet hours if configured)
    if (config.quiet_hours_enabled) {
      const inQuietHours = this.isInQuietHours(now, config.quiet_hours_start, config.quiet_hours_end);
      if (inQuietHours && event.priority !== 'CRITICAL') {
        logger.info('ProactivePolicy', `Proactive event ${event.id} suppressed: Quiet hours active (${config.quiet_hours_start} - ${config.quiet_hours_end}).`);
        return {
          shouldNotify: false,
          reason: `Quiet hours active (${config.quiet_hours_start} to ${config.quiet_hours_end}). Non-critical alert suppressed.`,
          deliveryMethod: 'SILENT',
          isSuppressed: true,
          suppressionReason: 'QUIET_HOURS',
        };
      }
    }

    // 4. Anti-Spam Cooldown Check
    // Critical events bypass cooldown; all others must respect cooldown period
    const cooldownMs = config.cooldown_minutes * 60 * 1000;
    const timeSinceLast = now.getTime() - this.lastNotificationTime;

    if (this.lastNotificationTime > 0 && timeSinceLast < cooldownMs && event.priority !== 'CRITICAL') {
      const remainingMin = Math.ceil((cooldownMs - timeSinceLast) / (60 * 1000));
      logger.info('ProactivePolicy', `Proactive event ${event.id} suppressed: Cooldown active (${remainingMin}m remaining).`);
      return {
        shouldNotify: false,
        reason: `Proactive cooldown active. Next proactive notification allowed in ${remainingMin} minutes.`,
        deliveryMethod: 'SILENT',
        isSuppressed: true,
        suppressionReason: 'COOLDOWN',
      };
    }

    // 5. Determine Delivery Method based on Priority
    const deliveryMethod = this.mapPriorityToDelivery(event.priority);

    // If LOW priority, usually silent
    if (event.priority === 'LOW') {
      return {
        shouldNotify: false,
        reason: 'LOW priority event kept silent.',
        deliveryMethod: 'SILENT',
        isSuppressed: true,
        safeContent: privacyResult.cleanText,
      };
    }

    return {
      shouldNotify: true,
      reason: `Event approved for dispatch via ${deliveryMethod}.`,
      deliveryMethod,
      isSuppressed: false,
      safeContent: privacyResult.cleanText,
    };
  }

  /**
   * Records a successfully dispatched proactive notification to update the cooldown timestamp.
   */
  public static recordNotification(event: ProactiveEvent, now: Date = new Date()): void {
    this.lastNotificationTime = now.getTime();
    this.notificationHistory.push({
      id: event.id,
      timestamp: now.getTime(),
      trigger: event.trigger,
    });
  }

  /**
   * Evaluates if a given time is within quiet hours (supports crossing midnight).
   */
  public static isInQuietHours(date: Date, startStr: string, endStr: string): boolean {
    const [startH, startM] = (startStr || '22:00').split(':').map(Number);
    const [endH, endM] = (endStr || '07:00').split(':').map(Number);

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = (isNaN(startH) ? 22 : startH) * 60 + (isNaN(startM) ? 0 : startM);
    const endMinutes = (isNaN(endH) ? 7 : endH) * 60 + (isNaN(endM) ? 0 : endM);

    if (startMinutes > endMinutes) {
      // Crosses midnight: e.g. 22:00 (1320) to 07:00 (420)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Same day: e.g. 01:00 to 06:00
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  }

  /**
   * Maps Event Priority to Delivery Channel.
   */
  private static mapPriorityToDelivery(
    priority: EventPriority
  ): 'SILENT' | 'UI_NOTIFICATION' | 'OPTIONAL_SPEECH' | 'EXPLICIT_ALERT' {
    switch (priority) {
      case 'CRITICAL':
        return 'EXPLICIT_ALERT';
      case 'IMPORTANT':
        return 'OPTIONAL_SPEECH';
      case 'NORMAL':
        return 'UI_NOTIFICATION';
      case 'LOW':
      default:
        return 'SILENT';
    }
  }
}
