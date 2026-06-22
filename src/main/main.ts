import { Notification, app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
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
import type {
  AppInfo,
  CommitFileResult,
  CreateGitHubRepoPayload,
  CreateGitHubRepoResult,
  CreatePullRequestPayload,
  DeviceFlowPollResult,
  DeviceFlowStartResult,
  ExternalOpenResult,
  FileContentResult,
  GitHubActionsResult,
  GitHubManagedWorkflow,
  GitHubManagedWorkflowReference,
  GitHubRepoActionsSummary,
  GitHubWorkflowDispatchRequest,
  GitHubWorkflowDispatchResponse,
  GitHubAccountsResult,
  ListGitHubRepoWorkflowsResult,
  ManagedActionsResult,
  OrgsResult,
  PlatformId,
  PullRequestResult,
  ReadmeBatchSubmissionResult,
  ReadmeWorkspaceResult,
  RefreshManagedActionsResult,
  ReposResult,
  SearchGitHubWorkflowsResult,
  SendNotificationParams,
  SendNotificationResult,
} from '../shared/api.js';
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

const HAGIHUB_UNAVAILABLE_MESSAGE = 'GitHub integration is not available in this Store Master build.';

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

function createUnavailableError(): Error {
  return new Error(HAGIHUB_UNAVAILABLE_MESSAGE);
}

function createEmptyAccountsResult(): GitHubAccountsResult {
  return {
    accounts: [],
    activeAccountId: null,
  };
}

function createUnavailableActionsSummary(repoFullName: string): GitHubRepoActionsSummary {
  return {
    repoFullName,
    workflowCount: 0,
    latestRun: null,
    state: 'error',
    scannedAt: new Date().toISOString(),
    error: HAGIHUB_UNAVAILABLE_MESSAGE,
  };
}

function createUnavailableManagedWorkflow(reference: GitHubManagedWorkflowReference): GitHubManagedWorkflow {
  return {
    ...reference,
    dispatchInputs: [],
    latestRun: null,
    latestRunState: 'unavailable',
    lastScannedAt: new Date().toISOString(),
    refreshError: HAGIHUB_UNAVAILABLE_MESSAGE,
  };
}

async function sendNotification(params: SendNotificationParams): Promise<SendNotificationResult> {
  if (!Notification.isSupported()) {
    return {
      success: false,
      error: 'Notifications are not supported on this platform.',
    };
  }

  const notificationId = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const notification = new Notification({
      title: params.title,
      body: params.body,
      silent: params.silent,
      urgency: params.level === 'error' ? 'critical' : 'normal',
      icon: params.icon,
    });

    notification.once('show', () => {
      mainWindow?.webContents.send('hagihub:notification-shown', notificationId);
    });

    notification.once('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }

        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('hagihub:notification-clicked', notificationId);
      }

      if (params.clickAction?.type === 'open-url') {
        void shell.openExternal(params.clickAction.url);
        return;
      }

      if (params.clickAction?.type === 'focus-window' && params.clickAction.section) {
        mainWindow?.webContents.send('hagihub:navigate-to-section', params.clickAction.section);
      }
    });

    notification.show();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function registerHagihubCompatHandlers(): void {
  ipcMain.handle('hagihub:start-device-flow', async (): Promise<DeviceFlowStartResult> => {
    throw createUnavailableError();
  });

  ipcMain.handle('hagihub:cancel-device-flow', (): DeviceFlowPollResult => ({
    flowId: '',
    status: 'cancelled',
  }));

  ipcMain.handle('hagihub:get-github-accounts', (): GitHubAccountsResult => createEmptyAccountsResult());
  ipcMain.handle('hagihub:remove-github-account', (): GitHubAccountsResult => createEmptyAccountsResult());
  ipcMain.handle('hagihub:switch-github-account', (): GitHubAccountsResult => createEmptyAccountsResult());
  ipcMain.handle('hagihub:invalidate-github-cache', async (): Promise<void> => {});

  ipcMain.handle('hagihub:fetch-github-repos', async (): Promise<ReposResult> => ({
    repos: [],
  }));

  ipcMain.handle('hagihub:fetch-github-orgs', async (): Promise<OrgsResult> => ({
    orgs: [],
  }));

  ipcMain.handle(
    'hagihub:create-github-repo',
    async (_event, _accountId: string, _payload: CreateGitHubRepoPayload): Promise<CreateGitHubRepoResult> => ({
      success: false,
      errorCode: 'unknown',
      errorMessage: HAGIHUB_UNAVAILABLE_MESSAGE,
    }),
  );

  ipcMain.handle(
    'hagihub:fetch-github-actions',
    async (_event, _accountId: string, repoFullNames: string[]): Promise<GitHubActionsResult> => ({
      summaries: repoFullNames.map(createUnavailableActionsSummary),
      failedCount: repoFullNames.length,
    }),
  );

  ipcMain.handle('hagihub:fetch-repo-details', async () => {
    throw createUnavailableError();
  });
  ipcMain.handle('hagihub:fetch-file-content', async () => {
    throw createUnavailableError();
  });

  ipcMain.handle('hagihub:fetch-readme-workspace', async (): Promise<ReadmeWorkspaceResult> => ({
    variants: [],
  }));

  ipcMain.handle(
    'hagihub:submit-readme-workspace',
    async (_event, _accountId: string, _owner: string, _repo: string, payload: { strategy: 'direct' | 'pull_request' }): Promise<ReadmeBatchSubmissionResult> => ({
      success: false,
      strategy: payload.strategy,
      files: [],
      error: HAGIHUB_UNAVAILABLE_MESSAGE,
    }),
  );

  ipcMain.handle('hagihub:commit-file', async (): Promise<CommitFileResult> => {
    throw createUnavailableError();
  });
  ipcMain.handle('hagihub:create-ref', async (): Promise<void> => {
    throw createUnavailableError();
  });
  ipcMain.handle('hagihub:create-pull-request', async (): Promise<PullRequestResult> => {
    throw createUnavailableError();
  });
  ipcMain.handle('hagihub:update-repo', async () => {
    throw createUnavailableError();
  });
  ipcMain.handle('hagihub:update-repo-topics', async () => {
    throw createUnavailableError();
  });

  ipcMain.handle(
    'hagihub:list-github-repo-workflows',
    async (_event, _accountId: string, repoFullName: string): Promise<ListGitHubRepoWorkflowsResult> => ({
      repoFullName,
      workflows: [],
    }),
  );

  ipcMain.handle('hagihub:search-github-workflows', async (): Promise<SearchGitHubWorkflowsResult> => ({
    workflows: [],
    scannedRepoCount: 0,
  }));

  ipcMain.handle('hagihub:get-managed-actions', async (): Promise<ManagedActionsResult> => ({
    workflows: [],
  }));

  ipcMain.handle(
    'hagihub:save-managed-actions',
    async (_event, _accountId: string, workflows: GitHubManagedWorkflowReference[]): Promise<ManagedActionsResult> => ({
      workflows,
    }),
  );

  ipcMain.handle(
    'hagihub:refresh-managed-action-runs',
    async (_event, _accountId: string, workflows: GitHubManagedWorkflowReference[]): Promise<RefreshManagedActionsResult> => ({
      workflows: workflows.map(createUnavailableManagedWorkflow),
      failedCount: workflows.length,
    }),
  );

  ipcMain.handle(
    'hagihub:dispatch-github-workflow',
    async (_event, _accountId: string, _request: GitHubWorkflowDispatchRequest): Promise<GitHubWorkflowDispatchResponse> => {
      throw createUnavailableError();
    },
  );

  ipcMain.handle(
    'hagihub:send-notification',
    async (_event, params: SendNotificationParams): Promise<SendNotificationResult> => sendNotification(params),
  );
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
registerHagihubCompatHandlers();
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
