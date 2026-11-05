/**
 * Desktop Notification Provider Adapter (Phase 4 - Step 5)
 * Defines the interface for OS-level desktop notification capture (Electron / OS D-Bus / WinRT).
 *
 * STATUS: INTERFACE_DEFINED | NATIVE_IMPLEMENTATION_PENDING
 *
 * Native OS notification interception requires platform-specific native modules
 * (e.g. node-mac-notifier, Windows.UI.Notifications listener, or org.freedesktop.Notifications D-Bus monitor).
 * Inside this web container environment, native OS listener is marked as pending.
 * A safe event-emitter interface is provided for testing and API ingestion.
 */

import { AppNotification } from '../types.ts';

export type DesktopProviderStatus = 'READY' | 'PENDING' | 'UNSUPPORTED';

export interface DesktopNotificationProvider {
  readonly status: DesktopProviderStatus;
  isSupported(): boolean;
  subscribe(callback: (notification: AppNotification) => void): () => void;
  emitNotification(notification: AppNotification): void;
}

export class DefaultDesktopNotificationProvider implements DesktopNotificationProvider {
  private listeners: Array<(notification: AppNotification) => void> = [];
  public readonly status: DesktopProviderStatus = 'PENDING';

  public isSupported(): boolean {
    // Honest check: Native desktop D-Bus / WinRT monitoring requires OS hooks
    return false;
  }

  public subscribe(callback: (notification: AppNotification) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Safe manual/event dispatch for desktop notification simulation and testing.
   */
  public emitNotification(notification: AppNotification): void {
    for (const listener of this.listeners) {
      try {
        listener(notification);
      } catch (err) {
        // Defensive listener execution
      }
    }
  }
}

export const desktopNotificationProvider = new DefaultDesktopNotificationProvider();
