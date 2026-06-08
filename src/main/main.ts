import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootstrapStorage } from './storage/index.js';
import {
  exportProductMsStoreDataToFile,
  importProductMsStoreDataFromFile,
  readProducts,
  readProductMsStoreData,
  writeProducts,
  writeProductMsStoreData,
} from './storage/stores.js';
import type { AppInfo, ExternalOpenResult, PlatformId } from '../shared/api.js';
import type {
  MsStoreDataDataset,
  MsStoreDataExportResult,
  MsStoreDataImportResult,
  SupportedMsStoreLanguage,
} from '../shared/ms-store-data.js';
import type { ProductRecord } from '../shared/products.js';

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

app.whenReady().then(async () => {
  await bootstrapStorage();
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
ipcMain.handle('store-master:read-products', async () => {
  return readProducts();
});
ipcMain.handle('store-master:write-products', async (_event, products: ProductRecord[]) => {
  await writeProducts(products);
  return true;
});
ipcMain.handle('store-master:read-ms-store-data', async (_event, productStorageId: string) => {
  return readProductMsStoreData(productStorageId);
});
ipcMain.handle('store-master:write-ms-store-data', async (_event, productStorageId: string, dataset: MsStoreDataDataset) => {
  await writeProductMsStoreData(productStorageId, dataset);
  return true;
});
ipcMain.handle('store-master:import-ms-store-data', async (
  _event,
  productStorageId: string,
  defaultLocale: SupportedMsStoreLanguage,
): Promise<MsStoreDataImportResult> => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow;
  const selection = window ? await dialog.showOpenDialog(window, {
    properties: ['openFile'],
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  }) : await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });

  const filePath = selection.filePaths[0];
  if (selection.canceled || !filePath) {
    return {
      success: false,
      cancelled: true,
      errors: [],
    };
  }

  return importProductMsStoreDataFromFile(productStorageId, filePath, defaultLocale);
});
ipcMain.handle('store-master:export-ms-store-data', async (
  _event,
  productStorageId: string,
  defaultLocale: SupportedMsStoreLanguage,
  dataset: MsStoreDataDataset,
): Promise<MsStoreDataExportResult> => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow;
  const selection = window ? await dialog.showSaveDialog(window, {
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    defaultPath: 'win_store.csv',
  }) : await dialog.showSaveDialog({
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    defaultPath: 'win_store.csv',
  });

  if (selection.canceled || !selection.filePath) {
    return {
      success: false,
      cancelled: true,
      entryCount: dataset.entries.length,
    };
  }

  return exportProductMsStoreDataToFile(selection.filePath, dataset, defaultLocale);
});

ipcMain.handle('store-master:export-ms-store-data-to-path', async (
  _event,
  filePath: string,
  defaultLocale: SupportedMsStoreLanguage,
  dataset: MsStoreDataDataset,
): Promise<MsStoreDataExportResult> => {
  return exportProductMsStoreDataToFile(filePath, dataset, defaultLocale);
});
ipcMain.handle('store-master:import-ms-store-data-from-path', async (
  _event,
  productStorageId: string,
  filePath: string,
  defaultLocale: SupportedMsStoreLanguage,
): Promise<MsStoreDataImportResult> => {
  return importProductMsStoreDataFromFile(productStorageId, filePath, defaultLocale);
});
