/**
 * Phase 4: Notification Intelligence + Privacy Shield Types
 * Strict privacy-first data structures and states.
 */

import { SecurityClassification } from '../security/types.ts';

export type NotificationState =
  | 'RECEIVED'
  | 'FILTERING'
  | 'BLOCKED'
  | 'IGNORED'
  | 'CLASSIFIED'
  | 'QUEUED'
  | 'SPOKEN'
  | 'DISCARDED'
  | 'ERROR';

export type NotificationImportance = 'LOW' | 'NORMAL' | 'IMPORTANT' | 'CRITICAL';

export type NotificationAction = 'IGNORE' | 'SHOW' | 'SPEAK' | 'BLOCK' | 'SILENT';

export type NotificationSensitivity = 'PUBLIC' | 'NORMAL' | 'SENSITIVE' | 'HIGHLY_SENSITIVE' | 'CRITICAL';

/**
 * Structured Notification Event Model (Phase 4 Specification)
 * Strictly bounded actions: IGNORE | SHOW | SPEAK | BLOCK | SILENT
 */
export interface NotificationEvent {
  id: string;
  sourceApp: string;
  title: string;
  text: string;
  timestamp: number;
  category?: string;
  priority: NotificationImportance;
  sensitivity: NotificationSensitivity;
  action: NotificationAction;
  confidence: number;
}

export interface AppNotification {
  id?: string;
  appName?: string;
  sourceApp?: string; // alias for appName
  title?: string;
  content?: string;
  sender?: string;
  timestamp?: number | string;
  category?: string;
}

export interface NotificationBufferItem {
  id: string;
  appName: string;
  title: string;
  content: string; // ONLY in temporary memory, discarded after processing
  sender?: string;
  timestamp: number;
  state: NotificationState;
}

export interface SafeNotificationAudit {
  id: string;
  appName: string;
  title: string; // sanitized title
  timestamp: number;
  importance: NotificationImportance;
  classification: SecurityClassification;
  action: NotificationAction;
  state: NotificationState;
  reason: string;
  wasSpoken: boolean;
  geminiCalled: boolean;
  ttsCalled: boolean;
  memoryWritten: boolean;
  rawStorageUsed: boolean;
}

export interface NotificationConfig {
  enabled: boolean;
  read_important_notifications: boolean;
  read_normal_notifications: boolean;
  sensitive_notifications_enabled: false; // MANDATORY: always false, non-bypassable
  priority_apps: string[];
  priority_contacts: string[];
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // e.g. "22:00"
  quiet_hours_end: string;   // e.g. "07:00"
  cooldown_seconds: number;
}

export interface NotificationProcessingResult {
  id: string;
  classification: SecurityClassification;
  action: NotificationAction;
  importance: NotificationImportance;
  state: NotificationState;
  spokenText?: string;
  safeTitle: string;
  safeContent: string;
  reason: string;
  geminiCalled: boolean;
  ttsCalled: boolean;
  memoryWritten: boolean;
  rawStorageUsed: boolean;
  wasSpoken: boolean;
  suppressedByQuietHours?: boolean;
  suppressedByCooldown?: boolean;
}
