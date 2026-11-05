/**
 * Notification Priority & Category Manager (Phase 4 - Section 8 & 9)
 *
 * Provides priority presets, category resolution, and priority mappings.
 */

import { NotificationImportance } from './types.ts';

export type NotificationCategory =
  | 'CALENDAR'
  | 'MESSAGING'
  | 'SYSTEM'
  | 'SECURITY'
  | 'DELIVERY'
  | 'MARKETING'
  | 'OTHER';

export const DEFAULT_PRIORITY_APPS = ['calendar', 'slack', 'work', 'phone', 'dialer'];
export const DEFAULT_PRIORITY_CONTACTS = ['boss', 'manager', 'mom', 'doctor', 'emergency', 'family'];

export class NotificationPriority {
  /**
   * Infers standard category from app name and text
   */
  public static inferCategory(appName: string, title: string, text: string): NotificationCategory {
    const combined = `${appName} ${title} ${text}`.toLowerCase();

    if (/calendar|meeting|event|appointment|schedule/i.test(combined)) {
      return 'CALENDAR';
    }
    if (/whatsapp|telegram|signal|slack|teams|messages|sms|discord|chat/i.test(combined)) {
      return 'MESSAGING';
    }
    if (/battery|device|storage|system|os|crash|reboot|update/i.test(combined)) {
      return 'SYSTEM';
    }
    if (/security|alert|fraud|login|unauthorized|warning/i.test(combined)) {
      return 'SECURITY';
    }
    if (/delivery|courier|fedex|ups|amazon|dhl|order|shipped|arriving/i.test(combined)) {
      return 'DELIVERY';
    }
    if (/sale|discount|offer|promo|deal|win|subscribe|coins/i.test(combined)) {
      return 'MARKETING';
    }
    return 'OTHER';
  }

  /**
   * Checks if app is in priority apps list
   */
  public static isPriorityApp(appName: string, priorityApps: string[] = []): boolean {
    const norm = (appName || '').toLowerCase().trim();
    return priorityApps.some((p) => p && norm.includes(p.toLowerCase().trim()));
  }

  /**
   * Checks if contact or sender is in priority contacts list
   */
  public static isPriorityContact(senderOrTitle: string, priorityContacts: string[] = []): boolean {
    const norm = (senderOrTitle || '').toLowerCase().trim();
    return priorityContacts.some((c) => c && norm.includes(c.toLowerCase().trim()));
  }
}
