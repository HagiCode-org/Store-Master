import {
  normalizeSupportedMsStoreLanguage,
  type SupportedMsStoreLanguage,
} from './ms-store-data.js';

export const supportedMarkets = ['Steam', 'MS Store'] as const;
export const supportedMarketKeys = ['steam', 'msStore'] as const;

export type SupportedMarket = (typeof supportedMarkets)[number];
export type SupportedMarketKey = (typeof supportedMarketKeys)[number];

export interface ProductMarketSettings {
  enabled: boolean;
  defaultLanguage: SupportedMsStoreLanguage;
}

export interface ProductRelatedMarkets {
  steam: ProductMarketSettings;
  msStore: ProductMarketSettings;
}

export interface ProductRecord {
  id: string;
  productStorageId: string;
  name: string;
  description: string;
  folderName: string;
  relatedMarkets: ProductRelatedMarkets;
  updatedAt: string;
}

const productStorageIdPattern = /^prd-[a-f0-9-]{16,}$/;
const defaultMarketLanguage: SupportedMsStoreLanguage = 'en-US';
const marketKeyByLabel: Record<SupportedMarket, SupportedMarketKey> = {
  Steam: 'steam',
  'MS Store': 'msStore',
};
const marketLabelByKey: Record<SupportedMarketKey, SupportedMarket> = {
  steam: 'Steam',
  msStore: 'MS Store',
};

function fallbackUuid(): string {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function generateProductStorageId(): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? fallbackUuid();
  return `prd-${uuid.toLowerCase()}`;
}

export function isProductStorageId(value: unknown): value is string {
  return typeof value === 'string' && productStorageIdPattern.test(value);
}

export function isSupportedMarket(value: unknown): value is SupportedMarket {
  return typeof value === 'string' && supportedMarkets.includes(value as SupportedMarket);
}

export function isSupportedMarketKey(value: unknown): value is SupportedMarketKey {
  return typeof value === 'string' && supportedMarketKeys.includes(value as SupportedMarketKey);
}

export function createDefaultProductRelatedMarkets(): ProductRelatedMarkets {
  return {
    steam: {
      enabled: false,
      defaultLanguage: defaultMarketLanguage,
    },
    msStore: {
      enabled: false,
      defaultLanguage: defaultMarketLanguage,
    },
  };
}

function normalizeProductMarketSettings(input: unknown): ProductMarketSettings | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const defaultLanguage = normalizeSupportedMsStoreLanguage(candidate.defaultLanguage as string);

  if (typeof candidate.enabled !== 'boolean' || !defaultLanguage) {
    return null;
  }

  return {
    enabled: candidate.enabled,
    defaultLanguage,
  };
}

export function normalizeProductRelatedMarkets(input: unknown): ProductRelatedMarkets | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const steam = normalizeProductMarketSettings(candidate.steam);
  const msStore = normalizeProductMarketSettings(candidate.msStore);

  if (!steam || !msStore) {
    return null;
  }

  return {
    steam,
    msStore,
  };
}

export function cloneProductRelatedMarkets(relatedMarkets: ProductRelatedMarkets): ProductRelatedMarkets {
  return {
    steam: { ...relatedMarkets.steam },
    msStore: { ...relatedMarkets.msStore },
  };
}

export function getProductMarketKey(market: SupportedMarket): SupportedMarketKey {
  return marketKeyByLabel[market];
}

export function getProductMarketLabel(market: SupportedMarketKey | SupportedMarket): SupportedMarket {
  return isSupportedMarket(market) ? market : marketLabelByKey[market];
}

export function getProductMarketSettings(
  relatedMarkets: ProductRelatedMarkets,
  market: SupportedMarketKey | SupportedMarket,
): ProductMarketSettings {
  return relatedMarkets[isSupportedMarket(market) ? getProductMarketKey(market) : market];
}

export function getEnabledProductMarkets(relatedMarkets: ProductRelatedMarkets): SupportedMarket[] {
  return supportedMarkets.filter((market) => getProductMarketSettings(relatedMarkets, market).enabled);
}

export function normalizeProductRecord(input: unknown): ProductRecord | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const relatedMarkets = normalizeProductRelatedMarkets(candidate.relatedMarkets);

  if (
    typeof candidate.id !== 'string'
    || typeof candidate.name !== 'string'
    || typeof candidate.description !== 'string'
    || typeof candidate.folderName !== 'string'
    || !relatedMarkets
    || typeof candidate.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    productStorageId: isProductStorageId(candidate.productStorageId) ? candidate.productStorageId : generateProductStorageId(),
    name: candidate.name,
    description: candidate.description,
    folderName: candidate.folderName,
    relatedMarkets,
    updatedAt: candidate.updatedAt,
  };
}

export function normalizeProductRecords(input: unknown): ProductRecord[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const products = input.map((item) => normalizeProductRecord(item));
  return products.every((item): item is ProductRecord => item !== null) ? products : null;
}

export function isProductRecord(input: unknown): input is ProductRecord {
  return normalizeProductRecord(input) !== null;
}

export function isProductRecordArray(input: unknown): input is ProductRecord[] {
  return normalizeProductRecords(input) !== null;
}

export function resolveProductStorageDirectory(productStorageId: string): string {
  if (!isProductStorageId(productStorageId)) {
    throw new Error(`Invalid product storage id: ${productStorageId}`);
  }

  return `products/${productStorageId}`;
}

export function resolveProductScopedFileName(productStorageId: string, fileName: 'product.json' | 'ms-store-data.json'): string {
  return `${resolveProductStorageDirectory(productStorageId)}/${fileName}`;
}
