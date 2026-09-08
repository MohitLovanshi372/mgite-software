/**
 * Electron Main Process
 * Creates the desktop assistant window with secure sandbox and local backend connectivity.
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 740,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless modern desktop window with custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  mainWindow.loadURL(devServerUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC handlers
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
