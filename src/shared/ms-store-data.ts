export const supportedMsStoreLanguages = [
  'en-US',
  'zh-CN',
  'zh-Hant',
  'ja-JP',
  'ko-KR',
  'de-DE',
  'fr-FR',
  'es-ES',
  'pt-BR',
  'ru-RU',
] as const;

export type SupportedMsStoreLanguage = (typeof supportedMsStoreLanguages)[number];

export const supportedMsStoreLanguageLabels: Record<SupportedMsStoreLanguage, string> = {
  'en-US': 'English (United States)',
  'zh-CN': 'Chinese (Simplified)',
  'zh-Hant': 'Chinese (Traditional)',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'de-DE': 'German',
  'fr-FR': 'French',
  'es-ES': 'Spanish',
  'pt-BR': 'Portuguese (Brazil)',
  'ru-RU': 'Russian',
};

export interface MsStoreDataEntry {
  id: string;
  productStorageId: string;
  locale: string;
  market: string;
  storeId: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MsStoreDataDataset {
  productStorageId: string;
  entries: MsStoreDataEntry[];
}

export interface MsStoreDataValidationErrors {
  locale?: string;
  market?: string;
  storeId?: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  keywords?: string;
}

export interface MsStoreDataImportError {
  field: keyof MsStoreDataEntry | 'dataset';
  index: number | null;
  messageKey: string;
}

export type MsStoreDataImportResult =
  | {
      cancelled: true;
      errors: [];
      success: false;
    }
  | {
      cancelled?: false;
      dataset: MsStoreDataDataset;
      errors: [];
      filePath: string;
      success: true;
    }
  | {
      cancelled?: false;
      errors: MsStoreDataImportError[];
      filePath?: string;
      success: false;
    };

export type MsStoreDataExportResult =
  | {
      cancelled: true;
      entryCount: number;
      filePath?: undefined;
      success: false;
    }
  | {
      cancelled?: false;
      entryCount: number;
      filePath: string;
      success: true;
    }
  | {
      cancelled?: false;
      entryCount: number;
      error: string;
      filePath?: undefined;
      success: false;
    };

const storeIdPattern = /^[A-Za-z0-9-]{3,64}$/;

function fallbackUuid(): string {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function createTimestampLabel(date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(' ', ' ');
}

export function generateMsStoreEntryId(): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? fallbackUuid();
  return `ms-${uuid.toLowerCase()}`;
}

export function createEmptyMsStoreDataEntry(productStorageId: string): MsStoreDataEntry {
  const timestamp = createTimestampLabel();

  return {
    id: generateMsStoreEntryId(),
    productStorageId,
    locale: '',
    market: '',
    storeId: '',
    title: '',
    subtitle: '',
    shortDescription: '',
    description: '',
    keywords: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createEmptyMsStoreDataDataset(productStorageId: string): MsStoreDataDataset {
  return {
    productStorageId,
    entries: [],
  };
}

export function normalizeKeywords(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function isSupportedMsStoreLanguage(value: unknown): value is SupportedMsStoreLanguage {
  return typeof value === 'string' && supportedMsStoreLanguages.includes(value as SupportedMsStoreLanguage);
}

export function getMsStoreLanguageLabel(value: string): string {
  return supportedMsStoreLanguageLabels[value as SupportedMsStoreLanguage] ?? value;
}

export function validateMsStoreDataEntry(
  entry: Pick<MsStoreDataEntry, 'locale' | 'market' | 'storeId' | 'title' | 'shortDescription' | 'description' | 'keywords'>,
): MsStoreDataValidationErrors {
  const errors: MsStoreDataValidationErrors = {};

  if (entry.locale.trim().length === 0) {
    errors.locale = 'validation.msStore.localeRequired';
  } else if (!isSupportedMsStoreLanguage(entry.locale.trim())) {
    errors.locale = 'validation.msStore.localeUnsupported';
  }

  if (entry.market.trim().length === 0) {
    errors.market = 'validation.msStore.marketRequired';
  }

  if (entry.storeId.trim().length === 0) {
    errors.storeId = 'validation.msStore.storeIdRequired';
  } else if (!storeIdPattern.test(entry.storeId.trim())) {
    errors.storeId = 'validation.msStore.storeIdFormat';
  }

  if (entry.title.trim().length === 0) {
    errors.title = 'validation.msStore.titleRequired';
  }

  if (entry.shortDescription.trim().length === 0) {
    errors.shortDescription = 'validation.msStore.shortDescriptionRequired';
  }

  if (entry.description.trim().length === 0) {
    errors.description = 'validation.msStore.descriptionRequired';
  }

  if (entry.keywords.some((keyword) => keyword.trim().length === 0)) {
    errors.keywords = 'validation.msStore.keywordsInvalid';
  }

  return errors;
}

function normalizeMsStoreDataEntry(input: unknown, productStorageId: string): MsStoreDataEntry | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const normalizedDescription = typeof candidate.description === 'string' ? candidate.description.trim() : '';
  const normalizedSubtitle = typeof candidate.subtitle === 'string' ? candidate.subtitle.trim() : '';
  const normalizedShortDescription = typeof candidate.shortDescription === 'string' && candidate.shortDescription.trim().length > 0
    ? candidate.shortDescription.trim()
    : normalizedSubtitle || normalizedDescription.slice(0, 160).trim();

  const normalized: MsStoreDataEntry = {
    id: typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : generateMsStoreEntryId(),
    productStorageId,
    locale: typeof candidate.locale === 'string' ? candidate.locale.trim() : '',
    market: typeof candidate.market === 'string' ? candidate.market.trim() : '',
    storeId: typeof candidate.storeId === 'string' ? candidate.storeId.trim() : '',
    title: typeof candidate.title === 'string' ? candidate.title.trim() : '',
    subtitle: normalizedSubtitle,
    shortDescription: normalizedShortDescription,
    description: normalizedDescription,
    keywords: normalizeKeywords(candidate.keywords),
    createdAt: typeof candidate.createdAt === 'string' && candidate.createdAt.trim().length > 0 ? candidate.createdAt : createTimestampLabel(),
    updatedAt: typeof candidate.updatedAt === 'string' && candidate.updatedAt.trim().length > 0 ? candidate.updatedAt : createTimestampLabel(),
  };

  return normalized;
}

function createDuplicateKey(entry: Pick<MsStoreDataEntry, 'locale' | 'market'>): string {
  return `${entry.locale.trim().toLowerCase()}::${entry.market.trim().toLowerCase()}`;
}

export function validateMsStoreDataDataset(dataset: MsStoreDataDataset): MsStoreDataImportError[] {
  const errors: MsStoreDataImportError[] = [];
  const seenKeys = new Set<string>();

  dataset.entries.forEach((entry, index) => {
    const fieldErrors = validateMsStoreDataEntry(entry);

    Object.entries(fieldErrors).forEach(([field, messageKey]) => {
      if (!messageKey) {
        return;
      }

      errors.push({
        field: field as keyof MsStoreDataEntry,
        index,
        messageKey,
      });
    });

    if (entry.productStorageId !== dataset.productStorageId) {
      errors.push({
        field: 'dataset',
        index,
        messageKey: 'validation.msStore.productMismatch',
      });
    }

    const duplicateKey = createDuplicateKey(entry);
    if (seenKeys.has(duplicateKey)) {
      errors.push({
        field: 'dataset',
        index,
        messageKey: 'validation.msStore.duplicateLocaleMarket',
      });
      return;
    }

    seenKeys.add(duplicateKey);
  });

  return errors;
}

export function normalizeMsStoreDataDataset(input: unknown, productStorageId: string): MsStoreDataDataset | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  if (!Array.isArray(candidate.entries)) {
    return null;
  }

  if (typeof candidate.productStorageId === 'string' && candidate.productStorageId.trim().length > 0 && candidate.productStorageId !== productStorageId) {
    return null;
  }

  const entries = candidate.entries.map((entry) => normalizeMsStoreDataEntry(entry, productStorageId));
  if (!entries.every((entry): entry is MsStoreDataEntry => entry !== null)) {
    return null;
  }

  return {
    productStorageId,
    entries,
  };
}

export function isMsStoreDataDataset(input: unknown): input is MsStoreDataDataset {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  const candidate = input as Record<string, unknown>;
  if (typeof candidate.productStorageId !== 'string') {
    return false;
  }

  const dataset = normalizeMsStoreDataDataset(input, candidate.productStorageId);
  if (!dataset) {
    return false;
  }

  return validateMsStoreDataDataset(dataset).length === 0;
}

export function createMsStoreDataImportResult(input: unknown, productStorageId: string, filePath: string): MsStoreDataImportResult {
  const dataset = normalizeMsStoreDataDataset(input, productStorageId);

  if (!dataset) {
    return {
      success: false,
      filePath,
      errors: [{
        field: 'dataset',
        index: null,
        messageKey: 'validation.msStore.importInvalidJson',
      }],
    };
  }

  const errors = validateMsStoreDataDataset(dataset);
  if (errors.length > 0) {
    return {
      success: false,
      filePath,
      errors,
    };
  }

  return {
    success: true,
    filePath,
    dataset,
    errors: [],
  };
}
