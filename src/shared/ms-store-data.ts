import { msStoreFieldRegistrySource } from './ms-store-field-registry.js';

export const supportedMsStoreCsvLanguages = [
  'en-us',
  'zh-cn',
  'zh-hant',
  'ja-jp',
  'ko-kr',
  'de-de',
  'fr-fr',
  'es-es',
  'pt-br',
  'ru-ru',
] as const;

export type SupportedMsStoreCsvLanguage = (typeof supportedMsStoreCsvLanguages)[number];

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

const csvLanguageToUiLanguage: Record<SupportedMsStoreCsvLanguage, SupportedMsStoreLanguage> = {
  'en-us': 'en-US',
  'zh-cn': 'zh-CN',
  'zh-hant': 'zh-Hant',
  'ja-jp': 'ja-JP',
  'ko-kr': 'ko-KR',
  'de-de': 'de-DE',
  'fr-fr': 'fr-FR',
  'es-es': 'es-ES',
  'pt-br': 'pt-BR',
  'ru-ru': 'ru-RU',
};

const uiLanguageToCsvLanguage = Object.fromEntries(
  Object.entries(csvLanguageToUiLanguage).map(([csvLanguage, uiLanguage]) => [uiLanguage, csvLanguage]),
) as Record<SupportedMsStoreLanguage, SupportedMsStoreCsvLanguage>;

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

export const msStoreCsvHeader = [
  'Field',
  'ID',
  'Type (Type)',
  'default',
  ...supportedMsStoreCsvLanguages,
] as const;

export type MsStoreFieldStorageKind = 'markdown' | 'inline';

export interface MsStoreFieldDefinition {
  field: string;
  id: string;
  type: string;
  storageKind: MsStoreFieldStorageKind;
}

function storageKindForType(type: string): MsStoreFieldStorageKind {
  return type === 'Text' ? 'markdown' : 'inline';
}

export const msStoreFieldRegistry: readonly MsStoreFieldDefinition[] = msStoreFieldRegistrySource
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [field, id, type] = line.split('\t');
    return {
      field,
      id,
      type,
      storageKind: storageKindForType(type),
    } satisfies MsStoreFieldDefinition;
  });

const msStoreFieldRegistryById = new Map(msStoreFieldRegistry.map((fieldDefinition) => [fieldDefinition.id, fieldDefinition]));
const msStoreFieldRegistryByField = new Map(msStoreFieldRegistry.map((fieldDefinition) => [fieldDefinition.field, fieldDefinition]));

function getRequiredFieldId(field: string): string {
  const fieldDefinition = msStoreFieldRegistryByField.get(field);

  if (!fieldDefinition) {
    throw new Error(`Missing required MS Store field definition: ${field}`);
  }

  return fieldDefinition.id;
}

export const msStoreCoreFieldIds = {
  description: getRequiredFieldId('Description'),
  title: getRequiredFieldId('Title'),
  subtitle: getRequiredFieldId('ShortTitle'),
  shortDescription: getRequiredFieldId('ShortDescription'),
} as const;

export type MsStoreCoreFieldKey = keyof typeof msStoreCoreFieldIds;

export const msStoreCoreFieldOrder: readonly MsStoreCoreFieldKey[] = [
  'title',
  'subtitle',
  'shortDescription',
  'description',
];

export interface MsStoreDataEntry {
  id: string;
  productStorageId: string;
  locale: string;
  keywords: string[];
  fieldValues: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface MsStoreDataDataset {
  productStorageId: string;
  version: 3;
  entries: MsStoreDataEntry[];
}

export interface MsStoreDataValidationErrors {
  locale?: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  keywords?: string;
}

export interface MsStoreDataImportError {
  field: keyof MsStoreDataEntry | 'dataset' | 'csv';
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

interface NormalizedFieldRecordResult {
  hasUnknownKeys: boolean;
  values: Record<string, string>;
}

interface ParsedMsStoreCsvRow {
  defaultValue: string;
  definition: MsStoreFieldDefinition;
  index: number;
  values: Record<SupportedMsStoreCsvLanguage, string>;
}

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
  }).format(date);
}

export function generateMsStoreEntryId(): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? fallbackUuid();
  return `ms-${uuid.toLowerCase()}`;
}

export function getMsStoreFieldDefinitionById(id: string): MsStoreFieldDefinition | null {
  return msStoreFieldRegistryById.get(id) ?? null;
}

export function getMsStoreFieldDefinitionByField(field: string): MsStoreFieldDefinition | null {
  return msStoreFieldRegistryByField.get(field) ?? null;
}

export function isMarkdownMsStoreField(field: Pick<MsStoreFieldDefinition, 'type'> | string): boolean {
  return (typeof field === 'string' ? field : field.type) === 'Text';
}

export function isBooleanMsStoreField(field: Pick<MsStoreFieldDefinition, 'type'> | string): boolean {
  return (typeof field === 'string' ? field : field.type) === 'True/False';
}

export function isLongTextMsStoreField(field: Pick<MsStoreFieldDefinition, 'field' | 'type'>): boolean {
  return field.type === 'Text' && /description|notes|terms/i.test(field.field);
}

export function normalizeMsStoreCsvLanguageCode(value: string): SupportedMsStoreCsvLanguage | null {
  const normalized = value.trim().toLowerCase().replace(/_/g, '-');
  return supportedMsStoreCsvLanguages.find((language) => language === normalized) ?? null;
}

export function normalizeSupportedMsStoreLanguage(value: string): SupportedMsStoreLanguage | null {
  const normalizedCsvLanguage = normalizeMsStoreCsvLanguageCode(value);
  return normalizedCsvLanguage ? csvLanguageToUiLanguage[normalizedCsvLanguage] : null;
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
  return typeof value === 'string' && normalizeSupportedMsStoreLanguage(value) !== null;
}

export function getMsStoreLanguageLabel(value: string): string {
  const normalizedLanguage = normalizeSupportedMsStoreLanguage(value);
  return normalizedLanguage ? supportedMsStoreLanguageLabels[normalizedLanguage] : value;
}

function normalizeFieldRecord(input: unknown): NormalizedFieldRecordResult {
  if (typeof input !== 'object' || input === null) {
    return {
      hasUnknownKeys: false,
      values: {},
    };
  }

  const normalizedValues: Record<string, string> = {};
  let hasUnknownKeys = false;

  Object.entries(input as Record<string, unknown>).forEach(([fieldId, value]) => {
    if (!msStoreFieldRegistryById.has(fieldId) || typeof value !== 'string') {
      hasUnknownKeys = true;
      return;
    }

    if (value.length > 0) {
      normalizedValues[fieldId] = value;
    }
  });

  return {
    hasUnknownKeys,
    values: normalizedValues,
  };
}

function normalizeLocale(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return normalizeSupportedMsStoreLanguage(value) ?? value.trim();
}

function createLegacyFieldValues(candidate: Record<string, unknown>): Record<string, string> {
  const values: Record<string, string> = {};

  if (typeof candidate.title === 'string' && candidate.title.length > 0) {
    values[msStoreCoreFieldIds.title] = candidate.title;
  }

  if (typeof candidate.subtitle === 'string' && candidate.subtitle.length > 0) {
    values[msStoreCoreFieldIds.subtitle] = candidate.subtitle;
  }

  if (typeof candidate.shortDescription === 'string' && candidate.shortDescription.length > 0) {
    values[msStoreCoreFieldIds.shortDescription] = candidate.shortDescription;
  }

  if (typeof candidate.description === 'string' && candidate.description.length > 0) {
    values[msStoreCoreFieldIds.description] = candidate.description;
  }

  return values;
}

function setFieldRecordValue(record: Record<string, string>, fieldId: string, value: string): void {
  if (value.length === 0) {
    delete record[fieldId];
    return;
  }

  record[fieldId] = value;
}

export function createEmptyMsStoreDataEntry(productStorageId: string): MsStoreDataEntry {
  const timestamp = createTimestampLabel();

  return {
    id: generateMsStoreEntryId(),
    productStorageId,
    locale: '',
    keywords: [],
    fieldValues: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createEmptyMsStoreDataDataset(productStorageId: string): MsStoreDataDataset {
  return {
    productStorageId,
    version: 3,
    entries: [],
  };
}

export function getMsStoreEntryCoreFieldValue(entry: Pick<MsStoreDataEntry, 'fieldValues'>, fieldKey: MsStoreCoreFieldKey): string {
  return entry.fieldValues[msStoreCoreFieldIds[fieldKey]] ?? '';
}

export function validateMsStoreDataEntry(
  entry: Pick<MsStoreDataEntry, 'locale' | 'keywords' | 'fieldValues'>,
): MsStoreDataValidationErrors {
  const errors: MsStoreDataValidationErrors = {};

  if (entry.locale.trim().length === 0) {
    errors.locale = 'validation.msStore.localeRequired';
  } else if (!isSupportedMsStoreLanguage(entry.locale.trim())) {
    errors.locale = 'validation.msStore.localeUnsupported';
  }

  if (getMsStoreEntryCoreFieldValue(entry, 'title').trim().length === 0) {
    errors.title = 'validation.msStore.titleRequired';
  }

  if (getMsStoreEntryCoreFieldValue(entry, 'shortDescription').trim().length === 0) {
    errors.shortDescription = 'validation.msStore.shortDescriptionRequired';
  }

  if (getMsStoreEntryCoreFieldValue(entry, 'description').trim().length === 0) {
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
  const normalizedFieldValues = normalizeFieldRecord(candidate.fieldValues);

  if (candidate.fieldValues !== undefined && normalizedFieldValues.hasUnknownKeys) {
    return null;
  }

  const fieldValues = {
    ...createLegacyFieldValues(candidate),
    ...normalizedFieldValues.values,
  };

  const normalized: MsStoreDataEntry = {
    id: typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : generateMsStoreEntryId(),
    productStorageId,
    locale: normalizeLocale(candidate.locale),
    keywords: normalizeKeywords(candidate.keywords),
    fieldValues,
    createdAt: typeof candidate.createdAt === 'string' && candidate.createdAt.trim().length > 0 ? candidate.createdAt : createTimestampLabel(),
    updatedAt: typeof candidate.updatedAt === 'string' && candidate.updatedAt.trim().length > 0 ? candidate.updatedAt : createTimestampLabel(),
  };

  return normalized;
}

function createDuplicateKey(entry: Pick<MsStoreDataEntry, 'locale'>): string {
  return entry.locale.trim().toLowerCase();
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

    Object.keys(entry.fieldValues).forEach((fieldId) => {
      if (!msStoreFieldRegistryById.has(fieldId)) {
        errors.push({
          field: 'fieldValues',
          index,
          messageKey: 'validation.msStore.unsupportedFieldMetadata',
        });
      }
    });

    const duplicateKey = createDuplicateKey(entry);
    if (seenKeys.has(duplicateKey)) {
      errors.push({
        field: 'dataset',
        index,
        messageKey: 'validation.msStore.duplicateLocale',
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
    version: 3,
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

function parseCsvDocument(text: string): string[][] {
  const normalizedText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let index = 0;
  let inQuotes = false;

  while (index < normalizedText.length) {
    const character = normalizedText[index];

    if (inQuotes) {
      if (character === '"') {
        if (normalizedText[index + 1] === '"') {
          cell += '"';
          index += 2;
          continue;
        }

        inQuotes = false;
        index += 1;
        continue;
      }

      cell += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }

    if (character === ',') {
      row.push(cell);
      cell = '';
      index += 1;
      continue;
    }

    if (character === '\r' || character === '\n') {
      row.push(cell);
      cell = '';
      if (row.some((value) => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];

      if (character === '\r' && normalizedText[index + 1] === '\n') {
        index += 2;
      } else {
        index += 1;
      }

      continue;
    }

    cell += character;
    index += 1;
  }

  if (inQuotes) {
    throw new Error('Unterminated quoted field in CSV document.');
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export function validateMsStoreCsvHeader(header: readonly string[]): boolean {
  return header.length === msStoreCsvHeader.length
    && msStoreCsvHeader.every((value, index) => header[index] === value);
}

function parseMsStoreCsvRows(text: string): ParsedMsStoreCsvRow[] {
  const parsedRows = parseCsvDocument(text);
  if (parsedRows.length === 0) {
    throw new Error('CSV document is empty.');
  }

  const [header, ...dataRows] = parsedRows;
  if (!validateMsStoreCsvHeader(header)) {
    throw new Error('Unexpected CSV header.');
  }

  if (dataRows.length !== msStoreFieldRegistry.length) {
    throw new Error('Unexpected CSV field count.');
  }

  return dataRows.map((row, index) => {
    const definition = msStoreFieldRegistry[index];
    const normalizedRow = [...row];

    while (normalizedRow.length < msStoreCsvHeader.length) {
      normalizedRow.push('');
    }

    if (normalizedRow[0] !== definition.field || normalizedRow[1] !== definition.id || normalizedRow[2] !== definition.type) {
      throw new Error(`Unexpected CSV field metadata at row ${index}.`);
    }

    return {
      definition,
      index,
      defaultValue: normalizedRow[3] ?? '',
      values: Object.fromEntries(
        supportedMsStoreCsvLanguages.map((language, languageIndex) => [language, normalizedRow[4 + languageIndex] ?? '']),
      ) as Record<SupportedMsStoreCsvLanguage, string>,
    } satisfies ParsedMsStoreCsvRow;
  });
}

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function findMsStoreEntryByLocale(
  entries: readonly MsStoreDataEntry[],
  locale: string,
): MsStoreDataEntry | null {
  const normalizedLocale = normalizeSupportedMsStoreLanguage(locale) ?? locale.trim();

  return entries.find((entry) => {
    const entryLocale = normalizeSupportedMsStoreLanguage(entry.locale) ?? entry.locale.trim();
    return entryLocale === normalizedLocale;
  }) ?? null;
}

function createMsStoreCsvRows(dataset: MsStoreDataDataset, defaultLocale: SupportedMsStoreLanguage): string[][] | null {
  if (getMsStoreDataExportError(dataset, defaultLocale)) {
    return null;
  }

  const localeEntryMap = new Map<SupportedMsStoreCsvLanguage, MsStoreDataEntry>();
  const defaultCsvLanguage = uiLanguageToCsvLanguage[defaultLocale];
  const defaultEntry = findMsStoreEntryByLocale(dataset.entries, defaultLocale);

  if (!defaultEntry) {
    return null;
  }

  for (const entry of dataset.entries) {
    const csvLanguage = normalizeMsStoreCsvLanguageCode(entry.locale);

    if (!csvLanguage) {
      return null;
    }

    if (localeEntryMap.has(csvLanguage)) {
      return null;
    }

    localeEntryMap.set(csvLanguage, entry);
  }

  return [
    [...msStoreCsvHeader],
    ...msStoreFieldRegistry.map((definition) => [
      definition.field,
      definition.id,
      definition.type,
      defaultEntry.fieldValues[definition.id] ?? '',
      ...supportedMsStoreCsvLanguages.map((language) => (
        language === defaultCsvLanguage ? '' : localeEntryMap.get(language)?.fieldValues[definition.id] ?? ''
      )),
    ]),
  ];
}

export function getMsStoreDataExportError(dataset: MsStoreDataDataset, defaultLocale: string): string | null {
  const normalizedDefaultLocale = normalizeSupportedMsStoreLanguage(defaultLocale);
  const localeEntryMap = new Set<SupportedMsStoreCsvLanguage>();

  if (!normalizedDefaultLocale) {
    return 'validation.msStore.exportInvalidWorkspace';
  }

  if (!findMsStoreEntryByLocale(dataset.entries, normalizedDefaultLocale)) {
    return 'validation.msStore.defaultLanguageContentRequired';
  }

  for (const entry of dataset.entries) {
    const csvLanguage = normalizeMsStoreCsvLanguageCode(entry.locale);

    if (!csvLanguage) {
      return 'validation.msStore.exportInvalidWorkspace';
    }

    if (localeEntryMap.has(csvLanguage)) {
      return 'validation.msStore.exportAmbiguousLocale';
    }

    localeEntryMap.add(csvLanguage);
  }

  if (validateMsStoreDataDataset(dataset).length > 0) {
    return 'validation.msStore.exportInvalidWorkspace';
  }

  return null;
}

export function serializeMsStoreDataDatasetToCsv(dataset: MsStoreDataDataset, defaultLocale: SupportedMsStoreLanguage): string | null {
  const csvRows = createMsStoreCsvRows(dataset, defaultLocale);

  if (!csvRows) {
    return null;
  }

  return `\uFEFF${csvRows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\r\n')}\r\n`;
}

function collectPopulatedCsvLanguages(rows: readonly ParsedMsStoreCsvRow[]): Set<SupportedMsStoreCsvLanguage> {
  const populatedLanguages = new Set<SupportedMsStoreCsvLanguage>();

  rows.forEach((row) => {
    supportedMsStoreCsvLanguages.forEach((language) => {
      if (row.values[language].trim().length > 0) {
        populatedLanguages.add(language);
      }
    });
  });

  return populatedLanguages;
}

function hasPopulatedDefaultColumn(rows: readonly ParsedMsStoreCsvRow[]): boolean {
  return rows.some((row) => row.defaultValue.trim().length > 0);
}

export function createMsStoreDataImportResult(
  csvText: string,
  productStorageId: string,
  currentDataset: MsStoreDataDataset,
  filePath: string,
  defaultLocale: SupportedMsStoreLanguage,
): MsStoreDataImportResult {
  const dataset = normalizeMsStoreDataDataset(currentDataset, productStorageId);

  if (!dataset) {
    return {
      success: false,
      filePath,
      errors: [{
        field: 'dataset',
        index: null,
        messageKey: 'validation.msStore.importInvalidWorkspace',
      }],
    };
  }

  let parsedRows: ParsedMsStoreCsvRow[];

  try {
    parsedRows = parseMsStoreCsvRows(csvText);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const messageKey = message === 'Unexpected CSV header.'
      ? 'validation.msStore.importInvalidHeader'
      : message === 'Unexpected CSV field count.'
        ? 'validation.msStore.importUnexpectedFieldCount'
        : message.startsWith('Unexpected CSV field metadata at row')
          ? 'validation.msStore.unsupportedFieldMetadata'
          : 'validation.msStore.importInvalidCsv';

    return {
      success: false,
      filePath,
      errors: [{
        field: 'csv',
        index: null,
        messageKey,
      }],
    };
  }

  const defaultCsvLanguage = uiLanguageToCsvLanguage[defaultLocale];
  const localeEntryGroups = new Map<SupportedMsStoreCsvLanguage, MsStoreDataEntry[]>();

  dataset.entries.forEach((entry) => {
    const csvLanguage = normalizeMsStoreCsvLanguageCode(entry.locale);

    if (!csvLanguage) {
      return;
    }

    const group = localeEntryGroups.get(csvLanguage) ?? [];
    group.push(entry);
    localeEntryGroups.set(csvLanguage, group);
  });

  const populatedLanguages = collectPopulatedCsvLanguages(parsedRows);
  const hasDefaultColumnContent = hasPopulatedDefaultColumn(parsedRows);
  const hasDefaultLocaleColumnContent = parsedRows.some((row) => row.values[defaultCsvLanguage].trim().length > 0);
  const errors: MsStoreDataImportError[] = [];

  populatedLanguages.forEach((language) => {
    const matches = localeEntryGroups.get(language) ?? [];

    if (matches.length > 1) {
      errors.push({
        field: 'dataset',
        index: null,
        messageKey: 'validation.msStore.importLocaleDuplicateEntry',
      });
    }
  });

  if (errors.length > 0) {
    return {
      success: false,
      filePath,
      errors,
    };
  }

  const nextEntries = dataset.entries.map((entry) => ({ ...entry, fieldValues: { ...entry.fieldValues } }));
  const nextEntryMap = new Map<SupportedMsStoreCsvLanguage, MsStoreDataEntry>();

  nextEntries.forEach((entry) => {
    const csvLanguage = normalizeMsStoreCsvLanguageCode(entry.locale);

    if (!csvLanguage) {
      return;
    }

    nextEntryMap.set(csvLanguage, entry);
  });

  if ((hasDefaultColumnContent || hasDefaultLocaleColumnContent) && !nextEntryMap.has(defaultCsvLanguage)) {
    const nextEntry = createEmptyMsStoreDataEntry(productStorageId);
    nextEntry.locale = defaultLocale;
    nextEntries.push(nextEntry);
    nextEntryMap.set(defaultCsvLanguage, nextEntry);
  }

  populatedLanguages.forEach((language) => {
    if (language === defaultCsvLanguage) {
      return;
    }

    if (nextEntryMap.has(language)) {
      return;
    }

    const nextEntry = createEmptyMsStoreDataEntry(productStorageId);
    nextEntry.locale = csvLanguageToUiLanguage[language];
    nextEntries.push(nextEntry);
    nextEntryMap.set(language, nextEntry);
  });

  if (hasDefaultColumnContent || hasDefaultLocaleColumnContent) {
    const defaultEntry = nextEntryMap.get(defaultCsvLanguage);

    if (defaultEntry) {
      const nextFieldValues: Record<string, string> = {};
      parsedRows.forEach((row) => {
        const nextValue = row.values[defaultCsvLanguage].trim().length > 0
          ? row.values[defaultCsvLanguage]
          : row.defaultValue;

        setFieldRecordValue(nextFieldValues, row.definition.id, nextValue);
      });

      defaultEntry.fieldValues = nextFieldValues;
      defaultEntry.updatedAt = createTimestampLabel();
    }
  }

  populatedLanguages.forEach((language) => {
    if (language === defaultCsvLanguage) {
      return;
    }

    const nextEntry = nextEntryMap.get(language);

    if (!nextEntry) {
      return;
    }

    const nextFieldValues: Record<string, string> = {};
    parsedRows.forEach((row) => {
      setFieldRecordValue(nextFieldValues, row.definition.id, row.values[language]);
    });

    nextEntry.fieldValues = nextFieldValues;
    nextEntry.updatedAt = createTimestampLabel();
  });

  if (!findMsStoreEntryByLocale(nextEntries, defaultLocale)) {
    return {
      success: false,
      filePath,
      errors: [{
        field: 'dataset',
        index: null,
        messageKey: 'validation.msStore.defaultLanguageContentRequired',
      }],
    };
  }

  return {
    success: true,
    filePath,
    dataset: {
      productStorageId,
      version: 3,
      entries: nextEntries,
    },
    errors: [],
  };
}
