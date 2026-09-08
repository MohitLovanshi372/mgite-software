/**
 * Intent Detection & Proactive Intelligence Types (Phase 2 - Step 6)
 *
 * Defines core models for intent classification, entity extraction,
 * risk classification, response strategy, and proactive event policies.
 */

export type IntentType =
  | 'CHAT'
  | 'QUESTION'
  | 'INFORMATION_REQUEST'
  | 'REMINDER_REQUEST'
  | 'TASK_REQUEST'
  | 'MEMORY_REQUEST'
  | 'COMPUTER_ACTION_REQUEST'
  | 'DOCUMENT_REQUEST'
  | 'NOTIFICATION_REQUEST'
  | 'SETTINGS_REQUEST'
  | 'SYSTEM_STATUS_REQUEST'
  | 'UNKNOWN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ResponseStrategy =
  | 'DIRECT_ANSWER'
  | 'ASK_CLARIFICATION'
  | 'REQUEST_CONFIRMATION'
  | 'EXECUTE_TOOL_LATER'
  | 'REFUSE_UNSAFE_ACTION'
  | 'OFFLINE_RESPONSE';

export interface IntentEntities {
  title?: string;
  date?: string;
  time?: string;
  person?: string;
  app?: string;
  location?: string;
  query?: string;
  document?: string;
  priority?: 'LOW' | 'NORMAL' | 'IMPORTANT' | 'CRITICAL';
  custom?: Record<string, string>;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number; // Internal heuristic estimate (0.0 - 1.0)
  entities: IntentEntities;
  requiresAction: boolean;
  riskLevel: RiskLevel;
  responseStrategy: ResponseStrategy;
  clarificationQuestion?: string;
  reasoning?: string;
  rawInput: string;
}

export type ProactiveTrigger =
  | 'REMINDER_DUE'
  | 'CALENDAR_EVENT_SOON'
  | 'IMPORTANT_NOTIFICATION'
  | 'DEVICE_CONNECTED'
  | 'USER_IDLE'
  | 'DEADLINE_APPROACHING';

export type EventPriority = 'LOW' | 'NORMAL' | 'IMPORTANT' | 'CRITICAL';

export interface ProactiveEvent {
  id: string;
  trigger: ProactiveTrigger;
  priority: EventPriority;
  title: string;
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ProactiveDecision {
  shouldNotify: boolean;
  reason: string;
  deliveryMethod: 'SILENT' | 'UI_NOTIFICATION' | 'OPTIONAL_SPEECH' | 'EXPLICIT_ALERT';
  isSuppressed: boolean;
  suppressionReason?: 'QUIET_HOURS' | 'COOLDOWN' | 'SENSITIVE_PRIVACY' | 'DISABLED';
  safeContent?: string;
}
