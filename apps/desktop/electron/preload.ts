/**
 * Electron Preload Script
 * Safely exposes a restricted bridge API to the desktop renderer.
 * Never exposes raw Node APIs, shell execution, or remote credentials.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface DesktopBridge {
  platform: string;
  isDesktop: boolean;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  onSystemEvent: (channel: string, callback: (data: any) => void) => void;
}

contextBridge.exposeInMainWorld('desktopBridge', {
  platform: process.platform,
  isDesktop: true,
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  onSystemEvent: (channel: string, callback: (data: any) => void) => {
    const validChannels = ['system-status-changed', 'notification-received'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  },
});
