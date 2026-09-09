/**
 * Notification Classifier (Phase 4 - Modular Structure)
 * Deterministic local-first importance and category classifier.
 */

import { ImportanceClassifier, ClassificationContext } from './importanceClassifier.ts';
import { NotificationImportance } from './types.ts';
import { NotificationPriority, NotificationCategory } from './notificationPriority.ts';

export class NotificationClassifier {
  public static classifyLocally(ctx: ClassificationContext): {
    importance: NotificationImportance;
    reason: string;
    category: NotificationCategory;
  } {
    const res = ImportanceClassifier.classifyLocally(ctx);
    const category = NotificationPriority.inferCategory(ctx.appName, ctx.title, ctx.content);
    return {
      importance: res.importance,
      reason: res.reason,
      category,
    };
  }
}
