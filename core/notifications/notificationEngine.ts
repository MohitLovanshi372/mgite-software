/**
 * Notification Intelligence Engine (Phase 4)
 *
 * Privacy-first notification pipeline:
 * OS Notification -> Listener -> Temporary In-Memory Buffer -> Sensitive Data Detector ->
 * Privacy Policy -> Importance Classifier -> Notification Policy -> Action
 *
 * Guaranteed Privacy & Security Invariants:
 * 1. OTP / Credential notifications are IMMEDIATELY BLOCKED.
 * 2. Raw notification content is NEVER permanently stored in SQLite or filesystem.
 * 3. 0 Gemini calls on sensitive data.
 * 4. 0 TTS calls on sensitive data.
 * 5. 0 Memory writes on notifications (no automatic long-term memory creation).
 * 6. 0 Automatic application opening (strictly decoupled from tool execution).
 * 7. 0 Secret leaks in system logs.
 * 8. Non-bypassable OTP protection: cannot be disabled by user settings or quiet hours.
 */

import {
  AppNotification,
  NotificationAction,
  NotificationBufferItem,
  NotificationConfig,
  NotificationEvent,
  NotificationImportance,
  NotificationProcessingResult,
  NotificationSensitivity,
  NotificationState,
  SafeNotificationAudit,
} from './types.ts';
import { NotificationPrivacy } from './notificationPrivacy.ts';
import { NotificationBuffer, notificationBuffer } from './notificationBuffer.ts';
import { NotificationDeduplicator, notificationDeduplicator } from './notificationDeduplicator.ts';
import { NotificationClassifier } from './notificationClassifier.ts';
import { NotificationPolicy } from './notificationPolicy.ts';
import { NotificationSettings, DEFAULT_NOTIFICATION_CONFIG } from './notificationSettings.ts';
import { NotificationPriority } from './notificationPriority.ts';
import { Redactor } from '../security/redactor.ts';
import { voiceEngine } from '../voice/voiceEngine.ts';
import { logger } from '../logger.ts';

export class NotificationEngine {
  private static instance: NotificationEngine | null = null;

  // In-memory temporary buffer: raw content is discarded immediately after processing
  private temporaryBuffer: Map<string, NotificationBufferItem> = new Map();
  private bufferManager: NotificationBuffer = notificationBuffer;

  // Deduplication & Anti-Spam engine
  private deduplicationCache: Map<string, number> = new Map();
  private deduplicator: NotificationDeduplicator = notificationDeduplicator;

  // Safe audit history: stores only sanitized metadata (max 100 entries)
  private safeAuditLogs: SafeNotificationAudit[] = [];
  private readonly maxAuditLogs = 100;

  // Telemetry counters for verifying security invariants in tests and metrics
  public telemetry = {
    totalReceived: 0,
    totalBlocked: 0,
    totalIgnored: 0,
    totalSpoken: 0,
    totalSilent: 0,
    totalShow: 0,
    geminiCallsCount: 0,
    ttsCallsCount: 0,
    memoryWritesCount: 0,
    rawStorageCount: 0,
    appOpeningAttemptsCount: 0, // strictly 0
    suppressedDuplicatesCount: 0,
  };

  // Notification configuration with non-bypassable defaults
  private config: NotificationConfig = { ...DEFAULT_NOTIFICATION_CONFIG };

  private constructor() {}

  public static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  /**
   * Resets internal caches and telemetry for test isolation.
   */
  public resetState(): void {
    this.temporaryBuffer.clear();
    this.bufferManager.clear();
    this.deduplicationCache.clear();
    this.deduplicator.reset();
    this.safeAuditLogs = [];
    this.telemetry = {
      totalReceived: 0,
      totalBlocked: 0,
      totalIgnored: 0,
      totalSpoken: 0,
      totalSilent: 0,
      totalShow: 0,
      geminiCallsCount: 0,
      ttsCallsCount: 0,
      memoryWritesCount: 0,
      rawStorageCount: 0,
      appOpeningAttemptsCount: 0,
      suppressedDuplicatesCount: 0,
    };
  }

  public getConfig(): NotificationConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<NotificationConfig>): NotificationConfig {
    this.config = NotificationSettings.sanitizeUpdate(this.config, partial);
    logger.info('NotificationEngine', 'Notification configuration updated');
    return this.getConfig();
  }

  public getSafeAuditLogs(): SafeNotificationAudit[] {
    return [...this.safeAuditLogs];
  }

  /**
   * Generates a safe one-way hash of non-sensitive notification metadata for deduplication.
   */
  private generateSafeDedupKey(appName: string, safeTitle: string, safeContent: string): string {
    return this.deduplicator.generateDedupKey(appName, safeTitle, safeContent);
  }

  /**
   * Converts a processing result and notification into a strongly typed NotificationEvent (Section 3)
   */
  public toNotificationEvent(
    res: NotificationProcessingResult,
    notification?: AppNotification | null
  ): NotificationEvent {
    const appName = notification?.appName || notification?.sourceApp || 'Unknown App';
    const category = NotificationPriority.inferCategory(appName, res.safeTitle, res.safeContent);
    const sensitivity: NotificationSensitivity =
      res.classification === 'OTP' || res.action === 'BLOCK'
        ? 'CRITICAL'
        : res.classification === 'SENSITIVE'
        ? 'SENSITIVE'
        : 'NORMAL';

    return {
      id: res.id,
      sourceApp: appName,
      title: res.safeTitle,
      text: res.safeContent,
      timestamp: Date.now(),
      category,
      priority: res.importance,
      sensitivity,
      action: res.action,
      confidence: 1.0,
    };
  }

  /**
   * Processes an incoming notification through the complete privacy-first pipeline.
   */
  public async processNotification(
    notification: AppNotification | null | undefined,
    options?: { speakAudio?: boolean }
  ): Promise<NotificationProcessingResult> {
    this.telemetry.totalReceived++;

    // Generate unique event ID
    const eventId = notification?.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const appName = notification?.appName || notification?.sourceApp || 'Unknown App';
    const rawTitle = notification?.title || '';
    const rawContent = notification?.content || '';
    const sender = notification?.sender;
    const timestamp =
      typeof notification?.timestamp === 'number'
        ? notification.timestamp
        : Date.now();

    // 1. Ingest into temporary in-memory buffer (state: RECEIVED)
    const bufferItem: NotificationBufferItem = {
      id: eventId,
      appName,
      title: rawTitle,
      content: rawContent,
      sender,
      timestamp,
      state: 'RECEIVED',
    };
    this.temporaryBuffer.set(eventId, bufferItem);
    this.bufferManager.ingest(bufferItem);

    // 2. Transition state to FILTERING
    bufferItem.state = 'FILTERING';
    this.bufferManager.updateState(eventId, 'FILTERING');

    // Handle empty notification
    if (!rawTitle.trim() && !rawContent.trim()) {
      this.temporaryBuffer.delete(eventId); // Discard immediately
      this.bufferManager.discard(eventId);
      return this.finalizeResult({
        id: eventId,
        classification: 'NORMAL',
        action: 'SILENT',
        importance: 'LOW',
        state: 'DISCARDED',
        safeTitle: '',
        safeContent: '',
        reason: 'Empty notification content received.',
        geminiCalled: false,
        ttsCalled: false,
        memoryWritten: false,
        rawStorageUsed: false,
        wasSpoken: false,
      });
    }

    // 3. Sensitive Data Detection (Deterministic, local-first via NotificationPrivacy)
    const privacyResult = NotificationPrivacy.evaluate({
      appName,
      title: rawTitle,
      content: rawContent,
      timestamp,
    });

    // 4. MANDATORY OTP & SENSITIVE DATA LOCKOUT
    // If OTP, PASSWORD, PIN, CVV, or Security Code is detected:
    // IMMEDIATELY BLOCK, PURGE FROM TEMPORARY BUFFER, NEVER CALL GEMINI / TTS / MEMORY
    if (privacyResult.isSensitive || privacyResult.action === 'BLOCK') {
      // Transition state to BLOCKED
      bufferItem.state = 'BLOCKED';

      // Discard raw content immediately from memory buffer
      this.temporaryBuffer.delete(eventId);
      this.bufferManager.discard(eventId);

      this.telemetry.totalBlocked++;

      // Log safe audit message without ANY secret value
      logger.info(
        'NotificationEngine',
        `Notification blocked by sensitive-data policy. Classification: ${privacyResult.classification}`
      );

      return this.finalizeResult({
        id: eventId,
        classification: privacyResult.classification === 'OTP' ? 'OTP' : (privacyResult.classification as any),
        action: 'BLOCK',
        importance: 'NORMAL',
        state: 'BLOCKED',
        safeTitle: Redactor.sanitizeString(rawTitle),
        safeContent: '[REDACTED SENSITIVE DATA]',
        reason: `Sensitive data protection enforced: ${privacyResult.classification} detected. Raw notification purged.`,
        geminiCalled: false,
        ttsCalled: false,
        memoryWritten: false,
        rawStorageUsed: false,
        wasSpoken: false,
      });
    }

    // 5. If safe: evaluate Deduplication & Anti-Spam (Section 10)
    const safeTitle = privacyResult.safeTitle || rawTitle;
    const safeContent = privacyResult.safeContent || rawContent;
    const dedupResult = this.deduplicator.evaluate(
      appName,
      safeTitle,
      safeContent,
      this.config.cooldown_seconds || 30
    );
    const isCooldownSuppressed = dedupResult.isCooldownSuppressed;
    this.telemetry.suppressedDuplicatesCount = this.deduplicator.suppressedCount;

    // 6. Importance Classification (Deterministic, local-first)
    bufferItem.state = 'CLASSIFIED';
    this.bufferManager.updateState(eventId, 'CLASSIFIED');
    const classificationCtx = {
      appName,
      title: safeTitle,
      content: safeContent,
      sender,
      priorityApps: this.config.priority_apps,
      priorityContacts: this.config.priority_contacts,
    };
    const { importance, reason: importanceReason } = NotificationClassifier.classifyLocally(classificationCtx);

    // 7. Check Quiet Hours
    const isQuietHours = NotificationPolicy.isWithinQuietHours(
      this.config.quiet_hours_enabled,
      this.config.quiet_hours_start,
      this.config.quiet_hours_end
    );

    // 8. Notification Policy Decision
    let policyDecision = NotificationPolicy.evaluate({
      classification: privacyResult.classification as any,
      importance,
      config: this.config,
      isQuietHours,
      isCooldownSuppressed,
      voiceEnabled: true,
    });

    // Anti-Spam burst grouping override: if same app exceeds rate limit (e.g. 20 notifications rapidly),
    // group notifications and suppress voice speaking to SILENT.
    if (dedupResult.isRateLimited && policyDecision.action === 'SPEAK') {
      policyDecision = {
        action: 'SILENT',
        canSpeak: false,
        canShow: true,
        reason: `Anti-spam: ${appName} burst rate limit exceeded (${dedupResult.burstCount} msgs). Spoken alert suppressed to SILENT.`,
      };
    }

    // 9. Execute Policy Action
    let finalState: NotificationState = 'DISCARDED';
    let wasSpoken = false;
    let spokenText: string | undefined;

    if (policyDecision.action === 'BLOCK') {
      finalState = 'BLOCKED';
      this.telemetry.totalBlocked++;
    } else if (policyDecision.action === 'IGNORE') {
      finalState = 'IGNORED';
      this.telemetry.totalIgnored++;
    } else if (policyDecision.action === 'SILENT') {
      finalState = 'QUEUED';
      this.telemetry.totalSilent++;
    } else if (policyDecision.action === 'SHOW') {
      finalState = 'QUEUED';
      this.telemetry.totalShow++;
    } else if (policyDecision.action === 'SPEAK') {
      finalState = 'SPOKEN';
      wasSpoken = true;
      this.telemetry.totalSpoken++;
      this.telemetry.ttsCallsCount++;

      // Construct spoken text safely from approved safe content
      const prefix = importance === 'CRITICAL' ? 'Critical alert' : 'Notification';
      spokenText = `${prefix} from ${appName}: ${safeTitle ? safeTitle + '. ' : ''}${safeContent}`;

      // Optionally dispatch to voiceEngine TTS if speech execution is requested
      if (options?.speakAudio) {
        voiceEngine.speak(spokenText).catch((err) => {
          logger.warn('NotificationEngine', `TTS speech output notice: ${err.message}`);
        });
      }
    }

    // Discard raw notification from in-memory temporary buffer
    this.temporaryBuffer.delete(eventId);
    this.bufferManager.discard(eventId);

    // 10. Record Safe Audit Log (No raw secret content ever saved)
    return this.finalizeResult({
      id: eventId,
      classification: privacyResult.classification as any,
      action: policyDecision.action,
      importance,
      state: finalState,
      spokenText,
      safeTitle,
      safeContent,
      reason: `${importanceReason}. ${policyDecision.reason}`,
      geminiCalled: false, // Zero Gemini call for notifications without explicit user intent
      ttsCalled: wasSpoken,
      memoryWritten: false, // Notifications NEVER automatically write to long-term memory
      rawStorageUsed: false, // Raw notifications are NEVER stored in SQLite or filesystem
      wasSpoken,
      suppressedByQuietHours: isQuietHours,
      suppressedByCooldown: isCooldownSuppressed,
    });
  }

  /**
   * Finalizes result, stores audit record, and returns safe response.
   */
  private finalizeResult(res: NotificationProcessingResult): NotificationProcessingResult {
    const auditRecord: SafeNotificationAudit = {
      id: res.id,
      appName: Redactor.sanitizeString(res.safeTitle || 'App'),
      title: Redactor.sanitizeString(res.safeTitle),
      timestamp: Date.now(),
      importance: res.importance,
      classification: res.classification,
      action: res.action,
      state: res.state,
      reason: res.reason,
      wasSpoken: res.wasSpoken,
      geminiCalled: res.geminiCalled,
      ttsCalled: res.ttsCalled,
      memoryWritten: res.memoryWritten,
      rawStorageUsed: res.rawStorageUsed,
    };

    this.safeAuditLogs.unshift(auditRecord);
    if (this.safeAuditLogs.length > this.maxAuditLogs) {
      this.safeAuditLogs.pop();
    }

    return res;
  }
}

export const notificationEngine = NotificationEngine.getInstance();
