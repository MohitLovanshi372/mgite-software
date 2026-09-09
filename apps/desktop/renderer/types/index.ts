/**
 * Shared Type Definitions for Desktop Renderer
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type SensitivityLevel = 'PUBLIC' | 'NORMAL' | 'PRIVATE' | 'SENSITIVE';
export type MemoryType =
  | 'PREFERENCE'
  | 'FACT'
  | 'PROJECT'
  | 'TASK_CONTEXT'
  | 'CONVERSATION_CONTEXT';
export type MemorySource =
  | 'USER_EXPLICIT'
  | 'USER_CONVERSATION'
  | 'SYSTEM'
  | 'IMPORTED_DOCUMENT';
export type MessageState = 'SENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  language?: string;
  tokens_used?: number;
  created_at: string;
  isOffline?: boolean;
  provider?: string;
  model?: string;
  warnings?: string[];
  state?: MessageState;
  intent?: {
    intent: string;
    confidence: number;
    riskLevel: string;
    responseStrategy: string;
    requiresAction: boolean;
  };
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SystemStatus {
  status: 'online' | 'offline';
  assistant_name: string;
  version: string;
  active_provider: string;
  model: string;
  offline_mode_enforced: boolean;
  cloud_ai_available: boolean;
  database: {
    type: string;
    status: string;
    conversations: number;
    messages?: number;
    memory_items?: number;
    memoryItems?: number;
  };
  modules: Record<string, { status: 'active' | 'placeholder'; phase: number }>;
}

export interface MemoryItem {
  id: string;
  type?: MemoryType;
  content?: string;
  category: string;
  key: string;
  value: string;
  sensitivity: SensitivityLevel;
  confidence?: number;
  source?: MemorySource;
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: Record<string, any>;
}

export interface AppConfig {
  assistant_name: string;
  version: string;
  theme: string;
  preferred_language: string;
  default_provider: string;
  model: string;
  max_context_messages?: number;
  temperature: number;
  offline_mode: boolean;
  memory: {
    enabled: boolean;
    default_sensitivity: SensitivityLevel;
    retention_days: number;
  };
  security: {
    redact_sensitive_inputs: boolean;
    strict_tool_allowlist: boolean;
    max_prompt_chars: number;
  };
  voice?: {
    enabled: boolean;
    auto_speak: boolean;
    preferred_language: string;
    voice_id: string;
    speech_rate: number;
    speech_volume: number;
    interrupt_speech: boolean;
    stt_provider: string;
    tts_provider: string;
  };
  notification?: {
    enabled: boolean;
    read_important_notifications: boolean;
    read_normal_notifications: boolean;
    sensitive_notifications_enabled: false;
    priority_apps: string[];
    priority_contacts: string[];
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
    cooldown_seconds: number;
  };
  modules: Record<string, { status: 'active' | 'placeholder'; phase: number }>;
}
