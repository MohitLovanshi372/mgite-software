/**
 * Safe Browser Control & YouTube/Music Tool Engine
 *
 * Implements safe, allowlisted browser interactions strictly constrained to:
 * - Domain Allowlist: https://www.youtube.com
 * - No arbitrary URL redirection or shell execution
 * - Validated parameter types and query sanitization
 * - Safe media control without closing unrelated tabs
 */

import { logger } from '../logger.ts';
import { ToolAllowlist, toolAllowlist } from './allowlist.ts';

export const ALLOWED_DOMAIN = 'https://www.youtube.com';

export interface ToolExecutionResult {
  success: boolean;
  tool: string;
  url?: string;
  query?: string;
  message: string;
  error?: string;
}

export type MediaStopListener = () => void;

export class SafeBrowserControl {
  private activeMediaWindow: Window | null = null;
  private stopListeners: Set<MediaStopListener> = new Set();
  private mockBrowserOpener?: (url: string) => Window | null;

  /**
   * Registers a listener to pause internal audio/synthesizer when stop_music is executed.
   */
  public onMediaStop(listener: MediaStopListener): () => void {
    this.stopListeners.add(listener);
    return () => this.stopListeners.delete(listener);
  }

  /**
   * Overrides window opener for unit tests in headless environments.
   */
  public setMockBrowserOpener(opener?: (url: string) => Window | null): void {
    this.mockBrowserOpener = opener;
  }

  /**
   * Validates that a target URL strictly matches the allowed YouTube domain.
   */
  public validateYouTubeUrl(targetUrl: string): { isValid: boolean; error?: string } {
    if (!targetUrl || typeof targetUrl !== 'string') {
      return { isValid: false, error: 'URL must be a valid non-empty string.' };
    }

    const trimmed = targetUrl.trim();

    // Reject dangerous protocol schemes immediately
    if (/^(javascript:|data:|file:|vbscript:|blob:)/i.test(trimmed)) {
      return { isValid: false, error: 'Dangerous URI scheme detected. Access denied.' };
    }

    try {
      const parsed = new URL(trimmed);

      if (parsed.protocol !== 'https:') {
        return { isValid: false, error: 'Protocol must be secure https:.' };
      }

      const host = parsed.hostname.toLowerCase();
      if (host !== 'www.youtube.com' && host !== 'youtube.com') {
        return {
          isValid: false,
          error: `Domain '${host}' is not permitted. Only https://www.youtube.com is allowed.`,
        };
      }

      return { isValid: true };
    } catch (err) {
      return { isValid: false, error: 'Malformed URL.' };
    }
  }

  /**
   * Helper to verify if a URL is strictly within the allowlist
   */
  public isDomainAllowed(targetUrl: string): boolean {
    return this.validateYouTubeUrl(targetUrl).isValid;
  }

  /**
   * Dispatches URL opening to the default browser safely with noopener,noreferrer.
   */
  private openUrl(url: string): boolean {
    logger.info('SafeBrowserControl', `Opening validated URL: ${url}`);

    if (this.mockBrowserOpener) {
      this.activeMediaWindow = this.mockBrowserOpener(url);
      return true;
    }

    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      const newWin = window.open(url, '_blank', 'noopener,noreferrer');
      if (newWin) {
        this.activeMediaWindow = newWin;
      }
      return true;
    }

    // Server-side / Node.js test environment
    return true;
  }

  /**
   * TOOL: open_youtube
   * Safely opens YouTube home in the browser.
   */
  public async openYouTube(params: { url?: string } = {}): Promise<ToolExecutionResult> {
    const targetUrl = params.url ? params.url.trim() : ALLOWED_DOMAIN;

    const validation = this.validateYouTubeUrl(targetUrl);
    if (!validation.isValid) {
      logger.warn('SafeBrowserControl', `Rejected open_youtube URL: ${validation.error}`);
      return {
        success: false,
        tool: 'open_youtube',
        message: validation.error || 'Invalid YouTube URL',
        error: validation.error,
      };
    }

    this.openUrl(targetUrl);

    return {
      success: true,
      tool: 'open_youtube',
      url: targetUrl,
      message: 'YouTube open kar rahi hoon.',
    };
  }

  /**
   * TOOL: search_youtube
   * Safely searches YouTube for a specific query without executing general web search.
   */
  public async searchYouTube(params: string | { query: string }): Promise<ToolExecutionResult> {
    const rawQuery = typeof params === 'string' ? params : params?.query;
    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return {
        success: false,
        tool: 'search_youtube',
        message: 'A search query is required.',
        error: 'Missing query parameter.',
      };
    }

    const cleanQuery = rawQuery
      .replace(/[\x00-\x1F\x7F]/g, '') // strip control chars
      .trim()
      .slice(0, 200);

    const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;

    const validation = this.validateYouTubeUrl(targetUrl);
    if (!validation.isValid) {
      return {
        success: false,
        tool: 'search_youtube',
        query: cleanQuery,
        message: validation.error || 'Invalid YouTube URL',
        error: validation.error,
      };
    }

    this.openUrl(targetUrl);

    return {
      success: true,
      tool: 'search_youtube',
      query: cleanQuery,
      url: targetUrl,
      message: `Sure, ${cleanQuery} search kar rahi hoon.`,
    };
  }

  /**
   * TOOL: play_music
   * If query is specified: searches that query on YouTube.
   * If no song/artist is specified: opens YouTube music search page without randomly choosing songs.
   */
  public async playMusic(params?: string | { query?: string }): Promise<ToolExecutionResult> {
    const rawQuery = typeof params === 'string' ? params.trim() : params?.query?.trim();

    if (rawQuery && rawQuery.length > 0) {
      return this.searchYouTube({ query: rawQuery });
    }

    // Generic "play music" without song/artist: open YouTube main page safely
    const targetUrl = 'https://www.youtube.com';
    const validation = this.validateYouTubeUrl(targetUrl);
    if (!validation.isValid) {
      return {
        success: false,
        tool: 'play_music',
        message: validation.error || 'Invalid YouTube URL',
        error: validation.error,
      };
    }

    this.openUrl(targetUrl);

    return {
      success: true,
      tool: 'play_music',
      url: targetUrl,
      message: 'YouTube open kar rahi hoon.',
    };
  }

  /**
   * TOOL: stop_music
   * Safely halts audio/synthesizer and pauses media without closing unrelated tabs.
   */
  public async stopMusic(_params: Record<string, any> = {}): Promise<ToolExecutionResult> {
    logger.info('SafeBrowserControl', 'Executing stop_music directive');

    // 1. Notify listeners (e.g. cyberMusic.stop() in UI)
    this.stopListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        logger.error('SafeBrowserControl', `Error in media stop listener: ${err}`);
      }
    });

    // 2. Pause any HTML5 media elements if in DOM
    if (typeof document !== 'undefined') {
      try {
        const mediaElements = document.querySelectorAll('audio, video');
        mediaElements.forEach((el) => {
          try {
            (el as HTMLMediaElement).pause();
          } catch {}
        });
      } catch {}
    }

    // 3. Safely manage tracked media window (ONLY if it was opened by this engine; do not close unrelated tabs)
    if (this.activeMediaWindow && !this.activeMediaWindow.closed) {
      try {
        this.activeMediaWindow.close();
      } catch {
        // Modern browser popup security may prevent programmatic close; ignore if blocked
      }
      this.activeMediaWindow = null;
    }

    return {
      success: true,
      tool: 'stop_music',
      message: 'Music band kar di gayi hai.',
    };
  }

  /**
   * Direct execution gateway validating tool allowlist.
   */
  public async executeTool(toolId: string, params: Record<string, any> = {}): Promise<ToolExecutionResult> {
    switch (toolId) {
      case 'open_youtube':
        return this.openYouTube(params);
      case 'search_youtube':
        return this.searchYouTube(params as { query: string });
      case 'play_music':
        return this.playMusic(params);
      case 'stop_music':
        return this.stopMusic(params);
      default:
        throw new Error(`Tool '${toolId}' is not an authorized safe browser tool.`);
    }
  }

  /**
   * Registers YouTube and Music tools with the system ToolAllowlist.
   */
  public registerWithAllowlist(allowlist: ToolAllowlist): void {
    allowlist.registerTool({
      id: 'open_youtube',
      name: 'Open YouTube',
      description: 'Safely opens YouTube in the default browser using allowlisted domain https://www.youtube.com',
      requiresInternet: true,
      permissionLevel: 'SAFE_EXECUTE',
      handler: (params) => this.openYouTube(params),
    });

    allowlist.registerTool({
      id: 'search_youtube',
      name: 'Search YouTube',
      description: 'Safely searches for songs or videos on YouTube using allowlisted domain https://www.youtube.com',
      requiresInternet: true,
      permissionLevel: 'SAFE_EXECUTE',
      handler: (params) => this.searchYouTube(params as { query: string }),
    });

    allowlist.registerTool({
      id: 'play_music',
      name: 'Play Music',
      description: 'Safely plays music or opens YouTube music search using allowlisted domain https://www.youtube.com',
      requiresInternet: true,
      permissionLevel: 'SAFE_EXECUTE',
      handler: (params) => this.playMusic(params),
    });

    allowlist.registerTool({
      id: 'stop_music',
      name: 'Stop Music',
      description: 'Safely pauses or stops music playback and media streams without closing unrelated tabs',
      requiresInternet: false,
      permissionLevel: 'SAFE_EXECUTE',
      handler: (params) => this.stopMusic(params),
    });

    logger.info('SafeBrowserControl', 'Registered open_youtube, search_youtube, play_music, stop_music in tool allowlist.');
  }
}

export const safeBrowserControl = new SafeBrowserControl();

// Automatically pre-register with global allowlist singleton
safeBrowserControl.registerWithAllowlist(toolAllowlist);
