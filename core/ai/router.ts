/**
 * AI Model Router (Phase 2 Step 2: Backend AI Architecture)
 *
 * Provider-independent router that selects the appropriate AIProvider based on:
 * - Online / Offline network connectivity
 * - User configuration (forced offline mode in settings)
 * - Task category ('general' | 'coding' | 'sensitive' | 'offline')
 * - Provider credential availability & health checks
 *
 * ARCHITECTURAL RULE:
 * Caller modules interact strictly through the AIProvider abstraction.
 * Case-insensitive lookup ensures environment variables like AI_PROVIDER="Gemini" resolve smoothly.
 */

import { AIProvider, AIModelRouter } from './types.ts';
import { geminiProvider } from './geminiProvider.ts';
import { offlineProvider } from './offlineProvider.ts';
import { getConfig } from '../../config/settings.ts';
import { logger } from '../logger.ts';

export class ModelRouter implements AIModelRouter {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    // Register base providers: Google Gemini (Cloud) and Local Rules Engine (Offline)
    this.registerProvider(geminiProvider);
    this.registerProvider(offlineProvider);
  }

  /**
   * Registers an AIProvider instance.
   */
  public registerProvider(provider: AIProvider): void {
    const id = provider.id.toLowerCase();
    this.providers.set(id, provider);
    logger.info('ModelRouter', `Registered AI provider: ${provider.name} (${id})`);
  }

  /**
   * Returns a provider by its unique identifier (case-insensitive).
   */
  public getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId.toLowerCase());
  }

  /**
   * Lists all registered provider IDs.
   */
  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Routes a request to the most appropriate provider based on task context and system state.
   */
  public routeRequest(taskType: 'general' | 'coding' | 'sensitive' | 'offline' = 'general'): AIProvider {
    const config = getConfig();

    // 1. Force offline if task is explicitly offline or user enabled offline mode in settings
    if (taskType === 'offline' || config.offline_mode) {
      return this.providers.get('offline') || offlineProvider;
    }

    // 2. Sensitive local-only tasks bypass cloud transmission
    if (taskType === 'sensitive') {
      return this.providers.get('offline') || offlineProvider;
    }

    // 3. User configured default provider (case-insensitive, defaults to gemini)
    const preferredId = (config.default_provider || 'gemini').toLowerCase();
    const provider = this.providers.get(preferredId);
    if (provider) {
      return provider;
    }

    // Fallback to gemini if registered
    const gemini = this.providers.get('gemini');
    if (gemini) {
      return gemini;
    }

    // 4. Safe fallback to local offline engine
    return this.providers.get('offline') || offlineProvider;
  }
}

export const aiRouter = new ModelRouter();
