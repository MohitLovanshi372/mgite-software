/**
 * Notification Intelligence & Privacy Shield Module (Phase 4)
 * Single entry point exporting modular architecture components.
 */

export * from './types.ts';
export * from './notificationEngine.ts';
export * from './notificationPolicy.ts';
export * from './importanceClassifier.ts';
export * from './notificationClassifier.ts';
export * from './notificationBuffer.ts';
export * from './notificationDeduplicator.ts';
export * from './notificationPrivacy.ts';
export * from './notificationPriority.ts';
export * from './notificationSettings.ts';
export * from './adapters/notificationAdapter.ts';
export * from './adapters/desktopNotificationProvider.ts';
export * from './adapters/androidNotificationListener.ts';
