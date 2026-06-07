import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppInfo, ExternalOpenResult, PlatformId } from '../shared/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_RENDERER_HOST = '127.0.0.1';
const DEV_RENDERER_PORT = 38659;
const DEV_RENDERER_URL = `http://${DEV_RENDERER_HOST}:${DEV_RENDERER_PORT}`;

let mainWindow: BrowserWindow | null = null;

function resolvePlatformId(platform: NodeJS.Platform, arch: string): PlatformId {
  if (platform === 'darwin') {
    return arch === 'arm64' ? 'osx-arm64' : 'osx-x64';
  }

  if (platform === 'win32') {
    return arch === 'arm64' ? 'win-arm64' : 'win-x64';
  }

  return arch === 'arm64' ? 'linux-arm64' : 'linux-x64';
}

function getDistRootPath(): string {
  return path.resolve(__dirname, '..');
}

function getRendererEntryPath(): string {
  return path.join(getDistRootPath(), 'renderer', 'index.html');
}

function getPreloadPath(): string {
  return path.join(getDistRootPath(), 'preload', 'index.mjs');
}

function getWindowIconPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.png');
  }

  return path.resolve(process.cwd(), 'resources', 'icon.png');
}

function isDevServerEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

function createAppInfo(): AppInfo {
  const platform = resolvePlatformId(process.platform, process.arch);

  return {
    appName: app.getName(),
    appVersion: app.getVersion(),
    platform,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    isPackaged: app.isPackaged,
    buildChannel: isDevServerEnabled() ? 'development' : 'production',
    name: app.getName(),
    version: app.getVersion(),
    arch: process.arch,
    platformId: platform,
    locale: app.getLocale(),
    appPath: app.getAppPath(),
  };
}

async function openExternal(url: string): Promise<ExternalOpenResult> {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: getWindowIconPath(),
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(DEV_RENDERER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(getRendererEntryPath());
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-app-info', (): AppInfo => createAppInfo());
ipcMain.handle('hagihub:get-app-info', (): AppInfo => createAppInfo());

ipcMain.handle('open-external', async (_event, url: string): Promise<ExternalOpenResult> => openExternal(url));
ipcMain.handle('hagihub:open-external', async (_event, url: string): Promise<ExternalOpenResult> => openExternal(url));
