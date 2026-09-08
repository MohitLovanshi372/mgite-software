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
  };
  return activeConfig;
}
