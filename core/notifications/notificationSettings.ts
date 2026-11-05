/**
 * Notification Settings Manager (Phase 4 - Section 9 & 22)
 *
 * Enforces:
 * - Immutable security invariant: sensitive_notifications_enabled is ALWAYS false.
 * - Loading defaults and environment variables safely.
 */

import { NotificationConfig } from './types.ts';
import { DEFAULT_PRIORITY_APPS, DEFAULT_PRIORITY_CONTACTS } from './notificationPriority.ts';

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  read_important_notifications: true,
  read_normal_notifications: false,
  sensitive_notifications_enabled: false, // MANDATORY: OTP protection is never bypassable
  priority_apps: [...DEFAULT_PRIORITY_APPS],
  priority_contacts: [...DEFAULT_PRIORITY_CONTACTS],
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  cooldown_seconds: 30,
};

export class NotificationSettings {
  /**
   * Validates and applies configuration updates safely.
   */
  public static sanitizeUpdate(
    current: NotificationConfig,
    patch: Partial<NotificationConfig>
  ): NotificationConfig {
    return {
      ...current,
      ...patch,
      // MANDATORY SECURITY INVARIANT: Cannot be overridden under any circumstances
      sensitive_notifications_enabled: false,
      priority_apps: Array.isArray(patch.priority_apps)
        ? patch.priority_apps.map((s) => String(s).trim()).filter(Boolean)
        : current.priority_apps,
      priority_contacts: Array.isArray(patch.priority_contacts)
        ? patch.priority_contacts.map((s) => String(s).trim()).filter(Boolean)
        : current.priority_contacts,
      cooldown_seconds: typeof patch.cooldown_seconds === 'number'
        ? Math.max(1, patch.cooldown_seconds)
        : current.cooldown_seconds,
    };
  }
}
