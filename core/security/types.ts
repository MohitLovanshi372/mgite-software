/**
 * Security & Privacy Types (Phase 2 - Step 4)
 * Defines central classifications, policy actions, and data structures for
 * deterministic, local-first sensitive data protection and OTP shielding.
 */

export type SecurityClassification =
  | 'NORMAL'
  | 'PRIVATE'
  | 'SENSITIVE'
  | 'OTP'
  | 'CREDENTIAL'
  | 'FINANCIAL'
  | 'SECURITY_CODE';

export type PrivacyAction = 'ALLOW' | 'REDACT' | 'BLOCK' | 'SILENT';

export interface DetectionMatch {
  type: string;
  category: SecurityClassification;
  value: string;
  index: number;
  length: number;
  confidence: number;
}

export interface SensitiveDetectionResult {
  isSensitive: boolean;
  classification: SecurityClassification;
  detectedTypes: string[];
  matches: DetectionMatch[];
  shouldAbortPipeline: boolean;
  suppressAudio: boolean;
  suppressStorage: boolean;
  reason?: string;
}

export interface PrivacyFilterResult {
  cleanText: string;
  safeContent: string;
  classification: SecurityClassification;
  action: PrivacyAction;
  hadSensitiveData: boolean;
  detectedTypes: string[];
  shouldAbortExternalCall: boolean;
  abortCategory?: 'OTP' | 'AUTH_CODE' | 'PIN' | 'CREDENTIAL' | 'FINANCIAL' | 'SECURITY_CODE';
  userNotice?: string;
  reason?: string;
}

export interface NotificationPayload {
  appName?: string;
  title?: string;
  content: string;
  timestamp?: number | string;
}

export interface NotificationPrivacyResult {
  classification: SecurityClassification;
  action: PrivacyAction;
  safeContent: string;
  reason?: string;
  detectedTypes: string[];
  appName?: string;
  title?: string;
  timestamp?: number | string;
}
