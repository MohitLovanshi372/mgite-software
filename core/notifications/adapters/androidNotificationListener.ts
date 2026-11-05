/**
 * Android Notification Listener Adapter (Phase 4 - Step 5)
 * Defines the service boundary and contract for the Android Companion app.
 *
 * STATUS: INTERFACE_DEFINED | NATIVE_IMPLEMENTATION_PENDING
 *
 * In production Android devices, this relies on:
 * `android.service.notification.NotificationListenerService`
 * with explicit user-granted `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`.
 *
 * Network packet sniffing or unauthorized interception is STRICTLY FORBIDDEN.
 * In the current container environment, native Android APK services cannot execute.
 * This file declares the interface contract and marks execution as pending.
 */

import { AppNotification } from '../types.ts';

export type AndroidListenerStatus = 'PENDING' | 'CONNECTED' | 'DISCONNECTED' | 'PERMISSION_DENIED';

export interface AndroidNotificationEvent {
  packageName: string;
  notificationId: number;
  title?: string;
  text?: string;
  postTime: number;
  category?: string;
  isClearable?: boolean;
}

export interface AndroidNotificationListener {
  readonly status: AndroidListenerStatus;
  isSupported(): boolean;
  onNotificationPosted(callback: (notification: AppNotification) => void): void;
  startListening(): Promise<boolean>;
  stopListening(): Promise<void>;
}

export class DefaultAndroidNotificationListener implements AndroidNotificationListener {
  public readonly status: AndroidListenerStatus = 'PENDING';

  /**
   * Honest check: Android notification listener requires a native Android runtime.
   * Returns false inside Node.js/browser environments.
   */
  public isSupported(): boolean {
    return false;
  }

  public onNotificationPosted(_callback: (notification: AppNotification) => void): void {
    // Registered when Android companion connects via WebSocket/IPC bridge
  }

  public async startListening(): Promise<boolean> {
    // Native Android runtime required
    return false;
  }

  public async stopListening(): Promise<void> {
    // No-op in non-Android environment
  }
}

export const androidNotificationListener = new DefaultAndroidNotificationListener();
