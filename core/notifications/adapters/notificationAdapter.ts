/**
 * Notification Adapter Contract (Phase 4 - Section 22)
 * Common abstraction for desktop and mobile notification capture adapters.
 */

import { AppNotification } from '../types.ts';
import { DefaultDesktopNotificationProvider, DesktopNotificationProvider } from './desktopNotificationProvider.ts';
import { DefaultAndroidNotificationListener, AndroidNotificationListener } from './androidNotificationListener.ts';

export interface NotificationAdapter {
  readonly name: string;
  readonly status: string;
  isSupported(): boolean;
  start(): Promise<boolean>;
  stop(): Promise<void>;
  onNotification(callback: (notification: AppNotification) => void): void;
}

export class DesktopNotificationAdapter implements NotificationAdapter {
  public readonly name = 'DesktopNotificationAdapter';
  private provider: DesktopNotificationProvider;

  constructor(provider: DesktopNotificationProvider = new DefaultDesktopNotificationProvider()) {
    this.provider = provider;
  }

  public get status(): string {
    return this.provider.status;
  }

  public isSupported(): boolean {
    return this.provider.isSupported();
  }

  public async start(): Promise<boolean> {
    return this.isSupported();
  }

  public async stop(): Promise<void> {
    // No-op
  }

  public onNotification(callback: (notification: AppNotification) => void): void {
    this.provider.subscribe(callback);
  }
}

export class AndroidNotificationAdapter implements NotificationAdapter {
  public readonly name = 'AndroidNotificationAdapter';
  private listener: AndroidNotificationListener;

  constructor(listener: AndroidNotificationListener = new DefaultAndroidNotificationListener()) {
    this.listener = listener;
  }

  public get status(): string {
    return this.listener.status;
  }

  public isSupported(): boolean {
    return this.listener.isSupported();
  }

  public async start(): Promise<boolean> {
    return this.listener.startListening();
  }

  public async stop(): Promise<void> {
    await this.listener.stopListening();
  }

  public onNotification(callback: (notification: AppNotification) => void): void {
    this.listener.onNotificationPosted(callback);
  }
}
