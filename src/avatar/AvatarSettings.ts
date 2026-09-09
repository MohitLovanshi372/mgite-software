/**
 * Avatar Settings Manager (Phase 5)
 *
 * Manages configuration, persistence, and accessibility flags:
 * - Avatar Enabled
 * - Avatar Model Path
 * - Quality (LOW, MEDIUM, HIGH)
 * - Scale
 * - Animation, Eye Movement, Blinking, Lip Sync, Gestures, Emotions
 * - Reduced Motion mode
 */

import { AvatarSettingsConfig, AvatarQuality } from './types.ts';

export const DEFAULT_AVATAR_SETTINGS: AvatarSettingsConfig = {
  enabled: true,
  modelPath: typeof process !== 'undefined' && process.env?.AVATAR_MODEL_PATH ? process.env.AVATAR_MODEL_PATH : '',
  quality: 'MEDIUM',
  scale: 1.0,
  animationEnabled: true,
  eyeMovementEnabled: true,
  naturalBlinkingEnabled: true,
  lipSyncEnabled: true,
  gesturesEnabled: true,
  emotionReactionsEnabled: true,
  reducedMotion: false,
};

const STORAGE_KEY = 'jarvis_avatar_settings_v1';

export class AvatarSettings {
  private static instance: AvatarSettings | null = null;
  private currentConfig: AvatarSettingsConfig;
  private listeners: Set<(config: AvatarSettingsConfig) => void> = new Set();

  private constructor() {
    this.currentConfig = this.loadFromStorage();
  }

  public static getInstance(): AvatarSettings {
    if (!AvatarSettings.instance) {
      AvatarSettings.instance = new AvatarSettings();
    }
    return AvatarSettings.instance;
  }

  private loadFromStorage(): AvatarSettingsConfig {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_AVATAR_SETTINGS };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_AVATAR_SETTINGS };

      const parsed = JSON.parse(stored);
      return this.sanitizeConfig(parsed);
    } catch {
      return { ...DEFAULT_AVATAR_SETTINGS };
    }
  }

  public sanitizeConfig(raw: Partial<AvatarSettingsConfig>): AvatarSettingsConfig {
    const validQualities: AvatarQuality[] = ['LOW', 'MEDIUM', 'HIGH'];
    const quality: AvatarQuality = validQualities.includes(raw.quality as AvatarQuality)
      ? (raw.quality as AvatarQuality)
      : 'MEDIUM';

    let scale = typeof raw.scale === 'number' && !isNaN(raw.scale) ? raw.scale : 1.0;
    if (scale < 0.5) scale = 0.5;
    if (scale > 2.0) scale = 2.0;

    return {
      enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_AVATAR_SETTINGS.enabled,
      modelPath: typeof raw.modelPath === 'string' ? raw.modelPath.trim() : DEFAULT_AVATAR_SETTINGS.modelPath,
      quality,
      scale,
      animationEnabled: typeof raw.animationEnabled === 'boolean' ? raw.animationEnabled : true,
      eyeMovementEnabled: typeof raw.eyeMovementEnabled === 'boolean' ? raw.eyeMovementEnabled : true,
      naturalBlinkingEnabled: typeof raw.naturalBlinkingEnabled === 'boolean' ? raw.naturalBlinkingEnabled : true,
      lipSyncEnabled: typeof raw.lipSyncEnabled === 'boolean' ? raw.lipSyncEnabled : true,
      gesturesEnabled: typeof raw.gesturesEnabled === 'boolean' ? raw.gesturesEnabled : true,
      emotionReactionsEnabled: typeof raw.emotionReactionsEnabled === 'boolean' ? raw.emotionReactionsEnabled : true,
      reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : false,
    };
  }

  public getSettings(): AvatarSettingsConfig {
    return { ...this.currentConfig };
  }

  public updateSettings(partial: Partial<AvatarSettingsConfig>): AvatarSettingsConfig {
    this.currentConfig = this.sanitizeConfig({
      ...this.currentConfig,
      ...partial,
    });

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentConfig));
      } catch (err) {
        console.warn('Failed to save avatar settings to localStorage:', err);
      }
    }

    this.notifyListeners();
    return this.getSettings();
  }

  public resetToDefaults(): AvatarSettingsConfig {
    this.currentConfig = { ...DEFAULT_AVATAR_SETTINGS };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    this.notifyListeners();
    return this.getSettings();
  }

  public subscribe(listener: (config: AvatarSettingsConfig) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const config = this.getSettings();
    this.listeners.forEach((listener) => {
      try {
        listener(config);
      } catch (err) {
        console.error('Error in AvatarSettings listener:', err);
      }
    });
  }
}

export const avatarSettings = AvatarSettings.getInstance();
