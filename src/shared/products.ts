export const supportedMarkets = ['Steam', 'MS Store'] as const;

export type SupportedMarket = (typeof supportedMarkets)[number];

export interface ProductRecord {
  id: string;
  productStorageId: string;
  name: string;
  description: string;
  folderName: string;
  relatedMarkets: SupportedMarket[];
  updatedAt: string;
}

const productStorageIdPattern = /^prd-[a-f0-9-]{16,}$/;

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

export function normalizeProductRecord(input: unknown): ProductRecord | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string'
    || typeof candidate.name !== 'string'
    || typeof candidate.description !== 'string'
    || typeof candidate.folderName !== 'string'
    || !Array.isArray(candidate.relatedMarkets)
    || !candidate.relatedMarkets.every(isSupportedMarket)
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
    relatedMarkets: [...candidate.relatedMarkets],
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
