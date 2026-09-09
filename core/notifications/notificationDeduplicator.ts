/**
 * Notification Deduplication & Anti-Spam Manager (Phase 4 - Section 10)
 *
 * Implements:
 * - Duplicate detection
 * - Per-app and per-content cooldown enforcement
 * - Burst rate-limiting (e.g. 20 notifications within a short window from WhatsApp/Slack)
 * - Notification grouping & repeated notification suppression
 */

import { logger } from '../logger.ts';

export interface DeduplicationResult {
  isDuplicate: boolean;
  isCooldownSuppressed: boolean;
  isRateLimited: boolean;
  isGrouped: boolean;
  burstCount: number;
  reason?: string;
}

export class NotificationDeduplicator {
  // Key -> timestamp of last occurrence
  private dedupCache: Map<string, number> = new Map();

  // AppName -> array of recent notification timestamps (within rolling window)
  private appBurstTracker: Map<string, number[]> = new Map();

  // Maximum notifications from the same app within the rolling window before burst grouping kicks in
  private readonly MAX_BURST_PER_APP = 3;
  private readonly ROLLING_WINDOW_MS = 60 * 1000; // 60 seconds

  public suppressedCount = 0;

  /**
   * Generates a deterministic, collision-resistant deduplication key.
   */
  public generateDedupKey(appName: string, title: string, content: string): string {
    const normApp = (appName || 'unknown').toLowerCase().trim();
    const normTitle = (title || '').toLowerCase().trim();
    const normContent = (content || '').toLowerCase().trim();
    return `${normApp}:::${normTitle}:::${normContent}`;
  }

  /**
   * Evaluates if a notification is a duplicate, in cooldown, or burst rate-limited.
   */
  public evaluate(
    appName: string,
    title: string,
    content: string,
    cooldownSeconds: number = 30
  ): DeduplicationResult {
    const now = Date.now();
    const key = this.generateDedupKey(appName, title, content);
    const lastSeen = this.dedupCache.get(key);
    const cooldownMs = Math.max(1, cooldownSeconds) * 1000;

    // 1. Exact Duplicate / Cooldown Check
    const isCooldownSuppressed = !!lastSeen && now - lastSeen < cooldownMs;

    // 2. Track per-app rolling burst rate
    const normApp = (appName || 'unknown').toLowerCase().trim();
    const timestamps = this.appBurstTracker.get(normApp) || [];
    const activeTimestamps = timestamps.filter((t) => now - t < this.ROLLING_WINDOW_MS);
    activeTimestamps.push(now);
    this.appBurstTracker.set(normApp, activeTimestamps);

    const burstCount = activeTimestamps.length;
    const isRateLimited = burstCount > this.MAX_BURST_PER_APP;
    const isGrouped = burstCount > this.MAX_BURST_PER_APP;

    if (isCooldownSuppressed || isRateLimited) {
      this.suppressedCount++;
    }

    // Always record/refresh last occurrence timestamp
    this.dedupCache.set(key, now);

    return {
      isDuplicate: isCooldownSuppressed,
      isCooldownSuppressed,
      isRateLimited,
      isGrouped,
      burstCount,
      reason: isCooldownSuppressed
        ? `Suppressed duplicate within ${cooldownSeconds}s cooldown`
        : isRateLimited
        ? `App ${appName} exceeded burst limit (${burstCount} notifications in 60s); grouped`
        : undefined,
    };
  }

  /**
   * Resets all caches and counters (used between test runs and resets).
   */
  public reset(): void {
    this.dedupCache.clear();
    this.appBurstTracker.clear();
    this.suppressedCount = 0;
  }
}

export const notificationDeduplicator = new NotificationDeduplicator();
