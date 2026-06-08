import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStore, writeAtomically, writeStore } from '../json-store.js';
import { ensureBaseDirectories, resolveDataRoot, resolveStorePath } from '../runtime-data-paths.js';
import {
  exportProductMsStoreDataToFile,
  importProductMsStoreDataFromFile,
  readProductMsStoreData,
  readProducts,
  resolveProductStorePath,
  writeProductMsStoreData,
} from '../stores.js';
import * as storageRegistry from '../storage-registry.js';
import type { StoreDefinition } from '../../../shared/storage.js';

const electronMockState = vi.hoisted(() => ({
  userDataPath: '',
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name !== 'userData') {
        throw new Error(`Unexpected app path request: ${name}`);
      }

      return electronMockState.userDataPath;
    }),
  },
}));

let tmpDir = '';

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'store-master-storage-'));
  electronMockState.userDataPath = path.join(tmpDir, 'electron-user-data');
  delete process.env.STORE_MASTER_DATA_DIR;
  resolveDataRoot({ reset: true });
  storageRegistry.clear();
});

afterEach(async () => {
  delete process.env.STORE_MASTER_DATA_DIR;
  resolveDataRoot({ reset: true });
  storageRegistry.clear();
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  vi.restoreAllMocks();
});

describe('resolveDataRoot', () => {
  it('uses STORE_MASTER_DATA_DIR when provided', () => {
    process.env.STORE_MASTER_DATA_DIR = path.join(tmpDir, 'override-root');
    resolveDataRoot({ reset: true });

    expect(resolveDataRoot()).toBe(path.join(tmpDir, 'override-root'));
  });

  it('derives the managed root from Electron userData', () => {
    expect(resolveDataRoot()).toBe(path.join(electronMockState.userDataPath, 'store'));
  });

  it('returns the cached path until reset', () => {
    const firstRoot = resolveDataRoot();
    electronMockState.userDataPath = path.join(tmpDir, 'changed-user-data');

    expect(resolveDataRoot()).toBe(firstRoot);
    expect(resolveDataRoot({ reset: true })).toBe(path.join(electronMockState.userDataPath, 'store'));
  });
});

describe('resolveStorePath', () => {
  it('resolves store files under the managed root', () => {
    expect(resolveStorePath('products.json')).toBe(path.join(resolveDataRoot(), 'products.json'));
  });

  it('rejects absolute paths', () => {
    expect(() => resolveStorePath('/etc/passwd')).toThrow(/must be relative/);
  });

  it('rejects path traversal', () => {
    expect(() => resolveStorePath('../escape.json')).toThrow(/escapes managed root/);
    expect(() => resolveStorePath('nested/../../escape.json')).toThrow(/escapes managed root/);
  });
});

describe('ensureBaseDirectories', () => {
  it('creates the managed data directory', async () => {
    const root = await ensureBaseDirectories();
    const stat = await fs.stat(root);

    expect(stat.isDirectory()).toBe(true);
  });
});

describe('storage registry', () => {
  const definition: StoreDefinition<{ value: string }> = {
    key: 'test',
    fileName: 'test.json',
    version: 1,
    defaultData: { value: 'default' },
  };

  it('registers and returns store definitions', () => {
    storageRegistry.register(definition);

    expect(storageRegistry.get('test')).toEqual(definition);
    expect(storageRegistry.has('test')).toBe(true);
  });

  it('rejects duplicate keys', () => {
    storageRegistry.register(definition);

    expect(() => storageRegistry.register(definition)).toThrow(/Duplicate store key/);
  });

  it('lists registered stores', () => {
    storageRegistry.register(definition);
    storageRegistry.register({ ...definition, key: 'test-2', fileName: 'test-2.json' });

    expect(storageRegistry.list()).toHaveLength(2);
  });
});

describe('readStore', () => {
  const definition: StoreDefinition<{ value: string }> = {
    key: 'read-test',
    fileName: 'read-test.json',
    version: 1,
    defaultData: { value: 'default' },
    validate: (data): data is { value: string } => {
      return typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string';
    },
  };

  it('creates a missing store from defaults', async () => {
    const filePath = path.join(tmpDir, 'read-test.json');
    const result = await readStore(filePath, definition);

    expect(result).toEqual({
      data: { value: 'default' },
      source: 'default',
      version: 1,
    });

    const raw = JSON.parse(await fs.readFile(filePath, 'utf8')) as { version: number; data: { value: string } };
    expect(raw.version).toBe(1);
    expect(raw.data).toEqual({ value: 'default' });
  });

  it('reads a valid persisted envelope', async () => {
    const filePath = path.join(tmpDir, 'read-test.json');
    await fs.writeFile(filePath, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), data: { value: 'stored' } }));

    const result = await readStore(filePath, definition);

    expect(result.source).toBe('file');
    expect(result.data).toEqual({ value: 'stored' });
  });

  it('recovers from invalid JSON by backing up and restoring defaults', async () => {
    const filePath = path.join(tmpDir, 'read-test.json');
    await fs.writeFile(filePath, '{invalid json');

    const result = await readStore(filePath, definition);
    const files = await fs.readdir(tmpDir);

    expect(result.source).toBe('default');
    expect(files.some((file) => file.includes('.corrupt-'))).toBe(true);
  });

  it('recovers when validation fails', async () => {
    const filePath = path.join(tmpDir, 'read-test.json');
    await fs.writeFile(filePath, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), data: { wrong: true } }));

    const result = await readStore(filePath, definition);

    expect(result.source).toBe('default');
    expect(result.data).toEqual({ value: 'default' });
  });
});

describe('writeStore', () => {
  const definition: StoreDefinition<{ value: string }> = {
    key: 'write-test',
    fileName: 'write-test.json',
    version: 1,
    defaultData: { value: 'default' },
    validate: (data): data is { value: string } => {
      return typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string';
    },
  };

  it('writes a valid envelope', async () => {
    const filePath = path.join(tmpDir, 'write-test.json');
    await writeStore(filePath, definition, { value: 'written' });

    const raw = JSON.parse(await fs.readFile(filePath, 'utf8')) as { version: number; updatedAt: string; data: { value: string } };
    expect(raw.version).toBe(1);
    expect(raw.data).toEqual({ value: 'written' });
    expect(typeof raw.updatedAt).toBe('string');
  });

  it('overwrites existing data', async () => {
    const filePath = path.join(tmpDir, 'write-test.json');
    await writeStore(filePath, definition, { value: 'first' });
    await writeStore(filePath, definition, { value: 'second' });

    const raw = JSON.parse(await fs.readFile(filePath, 'utf8')) as { data: { value: string } };
    expect(raw.data).toEqual({ value: 'second' });
  });
});

describe('writeAtomically', () => {
  it('creates parent directories before writing', async () => {
    const filePath = path.join(tmpDir, 'nested', 'path', 'atomic.json');

    await writeAtomically(filePath, '{"ok":true}');

    expect(await fs.readFile(filePath, 'utf8')).toBe('{"ok":true}');
  });

  it('cleans up the temp file if rename fails', async () => {
    const filePath = path.join(tmpDir, 'atomic.json');
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('rename failed'));

    await expect(writeAtomically(filePath, '{"ok":true}')).rejects.toThrow('rename failed');

    const files = await fs.readdir(tmpDir);
    expect(files.filter((file) => file.includes('.tmp.'))).toHaveLength(0);
  });
});

describe('migration', () => {
  it('migrates older envelopes to the current version', async () => {
    const filePath = path.join(tmpDir, 'migrate.json');
    await fs.writeFile(filePath, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), data: { value: 'old' } }));

    const definition: StoreDefinition<{ value: string; migrated: boolean }> = {
      key: 'migrate',
      fileName: 'migrate.json',
      version: 2,
      defaultData: { value: 'default', migrated: false },
      validate: (data): data is { value: string; migrated: boolean } => {
        return typeof data === 'object'
          && data !== null
          && typeof (data as { value?: unknown }).value === 'string'
          && typeof (data as { migrated?: unknown }).migrated === 'boolean';
      },
      migrate: (_fromVersion, data) => ({
        value: (data as { value: string }).value,
        migrated: true,
      }),
    };

    const result = await readStore(filePath, definition);

    expect(result.source).toBe('migrated');
    expect(result.version).toBe(2);
    expect(result.data).toEqual({ value: 'old', migrated: true });

    const raw = JSON.parse(await fs.readFile(filePath, 'utf8')) as { version: number; data: { migrated: boolean } };
    expect(raw.version).toBe(2);
    expect(raw.data.migrated).toBe(true);
  });

  it('falls back to defaults when migrated data fails validation', async () => {
    const filePath = path.join(tmpDir, 'migrate-fail.json');
    await fs.writeFile(filePath, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), data: { value: 'old' } }));

    const definition: StoreDefinition<{ value: string }> = {
      key: 'migrate-fail',
      fileName: 'migrate-fail.json',
      version: 2,
      defaultData: { value: 'default' },
      validate: (data): data is { value: string } => {
        return typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string';
      },
      migrate: () => ({ wrong: true } as unknown as { value: string }),
    };

    const result = await readStore(filePath, definition);

    expect(result.source).toBe('default');
    expect(result.data).toEqual({ value: 'default' });
  });
});

describe('product-scoped storage helpers', () => {
  it('resolves product-scoped paths under the managed root', () => {
    expect(resolveProductStorePath('prd-11111111-1111-4111-8111-111111111111', 'ms-store-data.json')).toBe(
      path.join(resolveDataRoot(), 'products', 'prd-11111111-1111-4111-8111-111111111111', 'ms-store-data.json'),
    );
  });

  it('writes and reads product-scoped MS Store datasets', async () => {
    const dataset = {
      productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
      entries: [
        {
          id: 'ms-1',
          productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
          locale: 'en-US',
          market: 'US',
          storeId: '9NTEST123',
          title: 'Signal Desk Deluxe',
          subtitle: 'Operator-ready',
          shortDescription: 'Localized Store summary.',
          description: 'Desktop release workspace for operators.',
          keywords: ['desktop', 'release'],
          createdAt: '2026-06-08 09:00',
          updatedAt: '2026-06-08 09:00',
        },
      ],
    };

    await writeProductMsStoreData(dataset.productStorageId, dataset);

    await expect(readProductMsStoreData(dataset.productStorageId)).resolves.toEqual(dataset);
  });

  it('exports and re-imports a validated MS Store dataset', async () => {
    const dataset = {
      productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
      entries: [
        {
          id: 'ms-1',
          productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
          locale: 'en-US',
          market: 'US',
          storeId: '9NTEST123',
          title: 'Signal Desk Deluxe',
          subtitle: '',
          shortDescription: 'Localized Store summary.',
          description: 'Desktop release workspace for operators.',
          keywords: ['desktop', 'release'],
          createdAt: '2026-06-08 09:00',
          updatedAt: '2026-06-08 09:00',
        },
      ],
    };
    const exportPath = path.join(tmpDir, 'ms-store-export.json');

    const exportResult = await exportProductMsStoreDataToFile(exportPath, dataset);
    const importResult = await importProductMsStoreDataFromFile(dataset.productStorageId, exportPath);

    expect(exportResult).toEqual({
      success: true,
      entryCount: 1,
      filePath: exportPath,
    });
    expect(importResult).toMatchObject({
      success: true,
      filePath: exportPath,
      dataset,
    });
  });

  it('reports validation errors for invalid imported MS Store data', async () => {
    const importPath = path.join(tmpDir, 'invalid-ms-store.json');
    await fs.writeFile(importPath, JSON.stringify({
      productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
      entries: [
        {
          id: 'ms-1',
          productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
          locale: 'en-US',
          market: 'US',
          storeId: '9NTEST123',
          title: '',
          subtitle: '',
          shortDescription: '',
          description: 'Desktop release workspace for operators.',
          keywords: ['desktop'],
          createdAt: '2026-06-08 09:00',
          updatedAt: '2026-06-08 09:00',
        },
      ],
    }));

    const result = await importProductMsStoreDataFromFile('prd-11111111-1111-4111-8111-111111111111', importPath);

    expect(result).toMatchObject({
      success: false,
      filePath: importPath,
      errors: [expect.objectContaining({ messageKey: 'validation.msStore.titleRequired' })],
    });
  });
});

describe('product storage id backfill', () => {
  it('migrates older product registries and writes product snapshots under the stable folder layout', async () => {
    const filePath = resolveStorePath('products.json');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      data: [{
        id: 'legacy-1',
        name: 'Legacy Desk',
        description: 'Legacy product without a storage id.',
        folderName: 'legacy-desk',
        relatedMarkets: ['Steam'],
        updatedAt: '2026-06-08 08:00',
      }],
    }));

    const products = await readProducts();
    const migratedProduct = products[0];

    expect(migratedProduct.productStorageId).toMatch(/^prd-/);

    const productSnapshotPath = resolveProductStorePath(migratedProduct.productStorageId, 'product.json');
    const productSnapshot = JSON.parse(await fs.readFile(productSnapshotPath, 'utf8')) as { data: { productStorageId: string } };
    expect(productSnapshot.data.productStorageId).toBe(migratedProduct.productStorageId);
  });
});
