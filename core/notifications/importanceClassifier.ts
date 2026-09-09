/**
 * Importance Classifier (Phase 4 - Step 2)
 * Deterministic, local-first classification of notification importance.
 *
 * Classifications:
 * - CRITICAL: Device warnings, emergency alerts, critical system failures
 * - IMPORTANT: Calendar meetings, priority apps, priority contacts, urgent work
 * - NORMAL: Standard chats, personal messages without urgency
 * - LOW: Promotional deals, game updates, marketing spam
 *
 * Local rules execute BEFORE any optional external AI query.
 * SENSITIVE content is NEVER passed to external AI.
 */

import { NotificationImportance } from './types.ts';
import { logger } from '../logger.ts';

const CRITICAL_KEYWORDS = [
  'critical battery',
  'battery critically low',
  'device overheating',
  'emergency alert',
  'disaster alert',
  'severe weather warning',
  'earthquake alert',
  'fire alarm',
  'system failure',
  'unauthorized access',
];

const IMPORTANT_KEYWORDS = [
  'meeting at',
  'project meeting',
  'calendar reminder',
  'reminder:',
  'doctor appointment',
  'flight boarding',
  'urgent:',
  'urgent',
  'call me urgent',
  'interview schedule',
  'interview at',
  'server down',
  'deadline today',
];

const LOW_KEYWORDS = [
  '50% off',
  'sale ends',
  'mega discount',
  'flat off',
  'deal of the day',
  'coins earned',
  'game update',
  'daily reward',
  'daily streak',
  'like this post',
  'subscribe now',
  'new follower',
  'trending now',
  'promotional offer',
];

export interface ClassificationContext {
  appName: string;
  title: string;
  content: string;
  sender?: string;
  priorityApps?: string[];
  priorityContacts?: string[];
}

export class ImportanceClassifier {
  /**
   * Deterministically evaluates importance based on local rules, priorities, and keywords.
   */
  public static classifyLocally(ctx: ClassificationContext): {
    importance: NotificationImportance;
    reason: string;
  } {
    const app = (ctx.appName || '').toLowerCase();
    const title = (ctx.title || '').toLowerCase();
    const content = (ctx.content || '').toLowerCase();
    const sender = (ctx.sender || '').toLowerCase();
    const combined = `${app} ${title} ${content} ${sender}`;

    const priorityApps = (ctx.priorityApps || []).map((a) => a.toLowerCase().trim());
    const priorityContacts = (ctx.priorityContacts || []).map((c) => c.toLowerCase().trim());

    // 1. Check CRITICAL cues
    for (const kw of CRITICAL_KEYWORDS) {
      if (combined.includes(kw)) {
        return {
          importance: 'CRITICAL',
          reason: `Matched critical system warning keyword: "${kw}"`,
        };
      }
    }

    // 2. Check Priority App match (e.g. Calendar, Work, Slack)
    for (const pApp of priorityApps) {
      if (pApp && (app.includes(pApp) || title.includes(pApp))) {
        return {
          importance: 'IMPORTANT',
          reason: `App matched user configured priority app: "${pApp}"`,
        };
      }
    }

    // 3. Check Priority Contact match
    for (const pContact of priorityContacts) {
      if (pContact && (sender.includes(pContact) || title.includes(pContact))) {
        return {
          importance: 'IMPORTANT',
          reason: `Sender matched user configured priority contact: "${pContact}"`,
        };
      }
    }

    // 4. Check IMPORTANT keywords (e.g. "Calendar: Project meeting at 5 PM", "urgent")
    for (const kw of IMPORTANT_KEYWORDS) {
      if (combined.includes(kw)) {
        return {
          importance: 'IMPORTANT',
          reason: `Matched important event keyword: "${kw}"`,
        };
      }
    }

    // 5. Check LOW priority keywords (promotions, games, spam)
    for (const kw of LOW_KEYWORDS) {
      if (combined.includes(kw)) {
        return {
          importance: 'LOW',
          reason: `Matched low-priority promotional keyword: "${kw}"`,
        };
      }
    }

    // 6. Default to NORMAL (standard messages, personal chats)
    return {
      importance: 'NORMAL',
      reason: 'Standard notification with normal priority',
    };
  }
}
