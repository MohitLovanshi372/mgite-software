declare module 'electron' {
  export interface BrowserWindow {
    loadURL(url: string): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): void;
    minimize(): void;
    maximize(): void;
    unmaximize(): void;
    isMaximized(): boolean;
    close(): void;
  }

  export const BrowserWindow: {
    new (options?: any): BrowserWindow;
    getAllWindows(): BrowserWindow[];
  };

  export const app: {
    whenReady(): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): void;
    quit(): void;
  };

  export const ipcMain: {
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  };

  export const ipcRenderer: {
    send(channel: string, ...args: any[]): void;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  };

  export const contextBridge: {
    exposeInMainWorld(apiKey: string, api: any): void;
  };
}
