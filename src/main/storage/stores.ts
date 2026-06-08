import fs from 'node:fs/promises';
import type {
  MsStoreDataDataset,
  MsStoreDataExportResult,
  MsStoreDataImportResult,
  SupportedMsStoreLanguage,
} from '../../shared/ms-store-data.js';
import {
  createMsStoreDataImportResult,
  createEmptyMsStoreDataDataset,
  getMsStoreDataExportError,
  isMsStoreDataDataset,
  normalizeMsStoreDataDataset,
  serializeMsStoreDataDatasetToCsv,
} from '../../shared/ms-store-data.js';
import {
  createDefaultProductRelatedMarkets,
  isProductRecord,
  isProductRecordArray,
  normalizeProductRecords,
  type ProductRecord,
  resolveProductScopedFileName,
} from '../../shared/products.js';
import type { StoreDefinition } from '../../shared/storage.js';
import { createStoreHandle } from './index.js';
import { readStore, writeAtomically, writeStore } from './json-store.js';
import { resolveStorePath } from './runtime-data-paths.js';

const defaultProducts: ProductRecord[] = [
  {
    id: 'product-1',
    productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
    name: 'Signal Desk',
    description: 'Desktop release workspace for managing store metadata snapshots before publication.',
    folderName: 'signal-desk',
    relatedMarkets: {
      ...createDefaultProductRelatedMarkets(),
      steam: {
        enabled: true,
        defaultLanguage: 'en-US',
      },
      msStore: {
        enabled: true,
        defaultLanguage: 'en-US',
      },
    },
    updatedAt: '2026-06-07 10:40',
  },
  {
    id: 'product-2',
    productStorageId: 'prd-22222222-2222-4222-8222-222222222222',
    name: 'Patch Harbor',
    description: 'Release engineering console for patch coordination and submission readiness checks.',
    folderName: 'patch-harbor',
    relatedMarkets: {
      ...createDefaultProductRelatedMarkets(),
      steam: {
        enabled: true,
        defaultLanguage: 'en-US',
      },
    },
    updatedAt: '2026-06-07 09:10',
  },
];

function createProductSnapshotDefinition(product: ProductRecord): StoreDefinition<ProductRecord> {
  return {
    key: `product-snapshot:${product.productStorageId}`,
    fileName: resolveProductScopedFileName(product.productStorageId, 'product.json'),
    version: 3,
    defaultData: product,
    validate: isProductRecord,
  };
}

function createMsStoreDataDefinition(productStorageId: string): StoreDefinition<MsStoreDataDataset> {
  return {
    key: `ms-store-data:${productStorageId}`,
    fileName: resolveProductScopedFileName(productStorageId, 'ms-store-data.json'),
    version: 3,
    defaultData: createEmptyMsStoreDataDataset(productStorageId),
    validate: (data): data is MsStoreDataDataset => {
      return isMsStoreDataDataset(data) && data.productStorageId === productStorageId;
    },
    migrate: (_fromVersion, data) => normalizeMsStoreDataDataset(data, productStorageId) ?? createEmptyMsStoreDataDataset(productStorageId),
  };
}

export const productsStore = createStoreHandle<ProductRecord[]>({
  key: 'products',
  fileName: 'products.json',
  version: 3,
  defaultData: defaultProducts,
  validate: isProductRecordArray,
  migrate: (_fromVersion, data) => normalizeProductRecords(data) ?? defaultProducts,
});

export function resolveProductStorePath(productStorageId: string, fileName: 'product.json' | 'ms-store-data.json'): string {
  return resolveStorePath(resolveProductScopedFileName(productStorageId, fileName));
}

export async function syncProductSnapshots(products: ProductRecord[]): Promise<void> {
  await Promise.all(products.map((product) => {
    const definition = createProductSnapshotDefinition(product);
    return writeStore(resolveStorePath(definition.fileName), definition, product);
  }));
}

export async function readProducts(): Promise<ProductRecord[]> {
  const result = await productsStore.read();
  await syncProductSnapshots(result.data);
  return result.data;
}

export async function writeProducts(products: ProductRecord[]): Promise<void> {
  const normalizedProducts = normalizeProductRecords(products);

  if (!normalizedProducts) {
    throw new Error('Refusing to write invalid products payload.');
  }

  await productsStore.write(normalizedProducts);
  await syncProductSnapshots(normalizedProducts);
}

export async function readProductMsStoreData(productStorageId: string): Promise<MsStoreDataDataset> {
  const definition = createMsStoreDataDefinition(productStorageId);
  const result = await readStore(resolveStorePath(definition.fileName), definition);
  return result.data;
}

export async function writeProductMsStoreData(productStorageId: string, dataset: MsStoreDataDataset): Promise<void> {
  const definition = createMsStoreDataDefinition(productStorageId);

  if (dataset.productStorageId !== productStorageId || !definition.validate?.(dataset)) {
    throw new Error(`Refusing to write invalid MS Store data for product ${productStorageId}`);
  }

  await writeStore(resolveStorePath(definition.fileName), definition, dataset);
}

export async function importProductMsStoreDataFromFile(
  productStorageId: string,
  filePath: string,
  defaultLocale: SupportedMsStoreLanguage,
): Promise<MsStoreDataImportResult> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const currentDataset = await readProductMsStoreData(productStorageId);
    return createMsStoreDataImportResult(raw, productStorageId, currentDataset, filePath, defaultLocale);
  } catch {
    return {
      success: false,
      filePath,
      errors: [{
        field: 'csv',
        index: null,
        messageKey: 'validation.msStore.importInvalidCsv',
      }],
    };
  }
}

export async function exportProductMsStoreDataToFile(
  filePath: string,
  dataset: MsStoreDataDataset,
  defaultLocale: SupportedMsStoreLanguage,
): Promise<MsStoreDataExportResult> {
  const normalizedDataset = normalizeMsStoreDataDataset(dataset, dataset.productStorageId);

  if (!normalizedDataset) {
    return {
      success: false,
      entryCount: dataset.entries.length,
      error: 'validation.msStore.exportInvalidWorkspace',
    };
  }

  const exportError = getMsStoreDataExportError(normalizedDataset, defaultLocale);
  if (exportError) {
    return {
      success: false,
      entryCount: normalizedDataset.entries.length,
      error: exportError,
    };
  }

  const csvDocument = serializeMsStoreDataDatasetToCsv(normalizedDataset, defaultLocale);
  if (!csvDocument) {
    return {
      success: false,
      entryCount: normalizedDataset.entries.length,
      error: 'validation.msStore.exportInvalidWorkspace',
    };
  }

  await writeAtomically(filePath, csvDocument);

  return {
    success: true,
    entryCount: normalizedDataset.entries.length,
    filePath,
  };
}

export type { ProductRecord } from '../../shared/products.js';
