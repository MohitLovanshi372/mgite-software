/**
 * Configuration manager for Personal AI Assistant
 * Loads defaults and environment variables without exposing sensitive values.
 */

import defaultConfig from './default_config.json' with { type: 'json' };

export interface AppConfig {
  assistant_name: string;
  version: string;
  theme: string;
  preferred_language: string;
  default_provider: string;
  model: string;
  temperature: number;
  max_context_messages: number;
  ai_timeout_ms: number;
  offline_mode: boolean;
  memory: {
    enabled: boolean;
    default_sensitivity: 'PUBLIC' | 'NORMAL' | 'PRIVATE' | 'SENSITIVE';
    retention_days: number;
  };
  security: {
    redact_sensitive_inputs: boolean;
    strict_tool_allowlist: boolean;
    max_prompt_chars: number;
  };
  proactive: {
    enabled: boolean;
    cooldown_minutes: number;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
  };
  voice: {
    enabled: boolean;
    auto_speak: boolean;
    preferred_language: string;
    voice_id: string;
    speech_rate: number;
    speech_volume: number;
    interrupt_speech: boolean;
    stt_provider: string;
    tts_provider: string;
    elevenlabs_model?: string;
  };
  notification: {
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

let activeConfig: AppConfig = {
  ...defaultConfig,
  default_provider: process.env.AI_PROVIDER || defaultConfig.default_provider || 'gemini',
  model: process.env.AI_MODEL || defaultConfig.model || 'gemini-2.5-flash',
  max_context_messages: process.env.MAX_CONTEXT_MESSAGES
    ? parseInt(process.env.MAX_CONTEXT_MESSAGES, 10)
    : (defaultConfig as any).max_context_messages || 20,
  ai_timeout_ms: (defaultConfig as any).ai_timeout_ms || 25000,
  memory: {
    ...defaultConfig.memory,
    default_sensitivity: defaultConfig.memory.default_sensitivity as 'PUBLIC' | 'NORMAL' | 'PRIVATE' | 'SENSITIVE',
  },
  proactive: {
    enabled: process.env.PROACTIVE_ENABLED !== undefined
      ? process.env.PROACTIVE_ENABLED === 'true'
      : (defaultConfig as any).proactive?.enabled ?? true,
    cooldown_minutes: process.env.PROACTIVE_COOLDOWN_MINUTES
      ? parseInt(process.env.PROACTIVE_COOLDOWN_MINUTES, 10)
      : (defaultConfig as any).proactive?.cooldown_minutes ?? 15,
    quiet_hours_enabled: process.env.QUIET_HOURS_ENABLED !== undefined
      ? process.env.QUIET_HOURS_ENABLED === 'true'
      : (defaultConfig as any).proactive?.quiet_hours_enabled ?? true,
    quiet_hours_start: process.env.QUIET_HOURS_START || (defaultConfig as any).proactive?.quiet_hours_start || '22:00',
    quiet_hours_end: process.env.QUIET_HOURS_END || (defaultConfig as any).proactive?.quiet_hours_end || '07:00',
  },
  voice: {
    enabled: process.env.VOICE_ENABLED !== undefined
      ? process.env.VOICE_ENABLED === 'true'
      : (defaultConfig as any).voice?.enabled ?? true,
    auto_speak: process.env.AUTO_SPEAK !== undefined
      ? process.env.AUTO_SPEAK === 'true'
      : (defaultConfig as any).voice?.auto_speak ?? false,
    preferred_language: process.env.VOICE_LANGUAGE || (defaultConfig as any).voice?.preferred_language || 'auto',
    voice_id: process.env.ELEVENLABS_VOICE_ID || (defaultConfig as any).voice?.voice_id || '21m00Tcm4TlvDq8ikWAM',
    speech_rate: (defaultConfig as any).voice?.speech_rate ?? 1.0,
    speech_volume: (defaultConfig as any).voice?.speech_volume ?? 1.0,
    interrupt_speech: (defaultConfig as any).voice?.interrupt_speech ?? true,
    stt_provider: (defaultConfig as any).voice?.stt_provider || 'system',
    tts_provider: process.env.TTS_PROVIDER || (defaultConfig as any).voice?.tts_provider || 'elevenlabs',
    elevenlabs_model: process.env.ELEVENLABS_MODEL || (defaultConfig as any).voice?.elevenlabs_model || 'eleven_multilingual_v2',
  },
  notification: {
    enabled: process.env.NOTIFICATION_INTELLIGENCE_ENABLED !== undefined
      ? process.env.NOTIFICATION_INTELLIGENCE_ENABLED === 'true'
      : (defaultConfig as any).notification?.enabled ?? true,
    read_important_notifications: (process.env.IMPORTANT_NOTIFICATION_SPEECH !== undefined
      ? process.env.IMPORTANT_NOTIFICATION_SPEECH === 'true'
      : (process.env.READ_IMPORTANT_NOTIFICATIONS !== undefined
        ? process.env.READ_IMPORTANT_NOTIFICATIONS === 'true'
        : (defaultConfig as any).notification?.read_important_notifications ?? true)),
    read_normal_notifications: process.env.READ_NORMAL_NOTIFICATIONS !== undefined
      ? process.env.READ_NORMAL_NOTIFICATIONS === 'true'
      : (defaultConfig as any).notification?.read_normal_notifications ?? false,
    sensitive_notifications_enabled: false,
    priority_apps: process.env.PRIORITY_APPS
      ? process.env.PRIORITY_APPS.split(',').map((s) => s.trim()).filter(Boolean)
      : (defaultConfig as any).notification?.priority_apps || ['calendar', 'slack', 'work'],
    priority_contacts: process.env.PRIORITY_CONTACTS
      ? process.env.PRIORITY_CONTACTS.split(',').map((s) => s.trim()).filter(Boolean)
      : (defaultConfig as any).notification?.priority_contacts || ['boss', 'manager', 'mom'],
    quiet_hours_enabled: process.env.QUIET_HOURS_ENABLED !== undefined
      ? process.env.QUIET_HOURS_ENABLED === 'true'
      : (defaultConfig as any).notification?.quiet_hours_enabled ?? true,
    quiet_hours_start: process.env.QUIET_HOURS_START || (defaultConfig as any).notification?.quiet_hours_start || '22:00',
    quiet_hours_end: process.env.QUIET_HOURS_END || (defaultConfig as any).notification?.quiet_hours_end || '07:00',
    cooldown_seconds: process.env.NOTIFICATION_COOLDOWN_SECONDS
      ? parseInt(process.env.NOTIFICATION_COOLDOWN_SECONDS, 10)
      : (defaultConfig as any).notification?.cooldown_seconds ?? 30,
  },
  modules: defaultConfig.modules as Record<string, { status: 'active' | 'placeholder'; phase: number }>,
};

export function getConfig(): AppConfig {
  return { ...activeConfig };
}

export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  activeConfig = {
    ...activeConfig,
    ...partial,
    memory: {
      ...activeConfig.memory,
      ...(partial.memory || {}),
    },
    security: {
      ...activeConfig.security,
      ...(partial.security || {}),
    },
    proactive: {
      ...activeConfig.proactive,
      ...(partial.proactive || {}),
    },
    voice: {
      ...activeConfig.voice,
      ...(partial.voice || {}),
    },
    notification: {
      ...activeConfig.notification,
      ...(partial.notification || {}),
      sensitive_notifications_enabled: false, // MANDATORY: OTP protection is never bypassable
    },
  };
  return activeConfig;
}
