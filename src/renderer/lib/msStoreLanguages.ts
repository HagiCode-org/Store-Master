import {
  getMsStoreEntryCoreFieldValue,
  supportedMsStoreLanguages,
  type MsStoreDataEntry,
} from '../../shared/ms-store-data';

export type LocaleGroupStatus = 'ready' | 'needsReview' | 'new';

export interface LocaleGroup {
  entries: MsStoreDataEntry[];
  key: string;
  latestUpdatedAt: string;
  locale: string;
  missingRequiredCount: number;
  previewTitle: string;
  status: LocaleGroupStatus;
}

const requiredFieldIds = ['title', 'shortDescription', 'description'] as const;

export function normalizeLocaleKey(value: string): string {
  return value.trim().toLowerCase();
}

export function sortLocaleValues(values: string[]): string[] {
  return [...values].sort((left, right) => {
    const leftIndex = supportedMsStoreLanguages.findIndex((language) => normalizeLocaleKey(language) === normalizeLocaleKey(left));
    const rightIndex = supportedMsStoreLanguages.findIndex((language) => normalizeLocaleKey(language) === normalizeLocaleKey(right));

    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    }

    return left.localeCompare(right);
  });
}

export function getEntryMissingRequiredCount(entry: MsStoreDataEntry): number {
  let missingCount = 0;

  requiredFieldIds.forEach((fieldId) => {
    if (getMsStoreEntryCoreFieldValue(entry, fieldId).trim().length === 0) {
      missingCount += 1;
    }
  });

  return missingCount;
}

export function buildLocaleGroups(entries: MsStoreDataEntry[], untitledEntryLabel: string): LocaleGroup[] {
  const groupedEntries = new Map<string, MsStoreDataEntry[]>();

  entries.forEach((entry) => {
    const key = normalizeLocaleKey(entry.locale);
    const group = groupedEntries.get(key) ?? [];
    group.push(entry);
    groupedEntries.set(key, group);
  });

  return sortLocaleValues(Array.from(groupedEntries.values()).map((group) => group[0]?.locale ?? '')).map((locale) => {
    const key = normalizeLocaleKey(locale);
    const localeEntries = (groupedEntries.get(key) ?? []).slice().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const latestEntry = localeEntries[0] ?? null;
    const previewTitle = localeEntries
      .map((entry) => getMsStoreEntryCoreFieldValue(entry, 'title').trim())
      .find((title) => title.length > 0) ?? untitledEntryLabel;
    const missingRequiredCount = localeEntries.reduce((count, entry) => count + (getEntryMissingRequiredCount(entry) > 0 ? 1 : 0), 0);

    return {
      entries: localeEntries,
      key,
      latestUpdatedAt: latestEntry?.updatedAt ?? '-',
      locale,
      missingRequiredCount,
      previewTitle,
      status: missingRequiredCount > 0 ? 'needsReview' : 'ready',
    } satisfies LocaleGroup;
  });
}

export function createDraftLocaleGroup(locale: string, previewTitle: string): LocaleGroup {
  return {
    entries: [],
    key: normalizeLocaleKey(locale),
    latestUpdatedAt: '-',
    locale,
    missingRequiredCount: 0,
    previewTitle,
    status: 'new',
  };
}
