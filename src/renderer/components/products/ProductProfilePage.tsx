import { memo, useDeferredValue, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  FileUp,
  FileWarning,
  Languages,
  LayoutList,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card';
import { Input } from '@/components/input';
import { SearchableSelect } from '@/components/searchable-select';
import { cn } from '@/lib/utils';
import {
  type MsStoreDataImportError,
  type MsStoreDataValidationErrors,
  getMsStoreEntryCoreFieldValue,
  getMsStoreLanguageLabel,
  isBooleanMsStoreField,
  isLongTextMsStoreField,
  msStoreCoreFieldIds,
  msStoreFieldRegistry,
  supportedMsStoreLanguages,
  type MsStoreDataEntry,
  type MsStoreFieldDefinition,
} from '../../../shared/ms-store-data';
import type { MsStoreDataDraft } from '@/store/slices/msStoreDataSlice';
import type { ProductRecord } from '@/store/slices/productManagementSlice';

interface ProductProfilePageProps {
  currentProduct: ProductRecord | null;
  defaultValues: Record<string, string>;
  draft: MsStoreDataDraft | null;
  entries: MsStoreDataEntry[];
  exportError: string | null;
  exportPath: string | null;
  exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  fieldErrors: MsStoreDataValidationErrors;
  importError: string | null;
  importErrors: MsStoreDataImportError[];
  importStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  loadError: string | null;
  loadStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  onAddEntry: () => void;
  onClearMessages: () => void;
  onDefaultFieldChange: (fieldId: string, value: string) => void;
  onDeleteEntry: () => void;
  onDraftFieldChange: (field: keyof Pick<MsStoreDataDraft, 'locale' | 'market' | 'storeId' | 'title' | 'subtitle' | 'shortDescription' | 'description' | 'keywordsText'>, value: string) => void;
  onDraftInventoryFieldChange: (fieldId: string, value: string) => void;
  onExport: () => void;
  onImport: () => void;
  onOpenProducts: () => void;
  onResetDraft: () => void;
  onSaveDraft: () => void;
  onSelectEntry: (entryId: string) => void;
  onSelectProduct: (productId: string) => void;
  products: ProductRecord[];
  selectedEntryId: string;
  selectedProductId: string;
}

type InventoryFilter = 'all' | 'empty' | 'changed' | 'assets' | 'longText';
type LocaleGroupStatus = 'ready' | 'needsReview' | 'new';
type CoreDraftFieldKey = 'title' | 'subtitle' | 'shortDescription' | 'description';

interface LocaleGroup {
  entries: MsStoreDataEntry[];
  key: string;
  latestUpdatedAt: string;
  locale: string;
  marketCount: number;
  missingRequiredCount: number;
  previewTitle: string;
  status: LocaleGroupStatus;
}

const coreFieldIdSet = new Set(Object.values(msStoreCoreFieldIds));
const requiredFieldIds = [
  msStoreCoreFieldIds.title,
  msStoreCoreFieldIds.shortDescription,
  msStoreCoreFieldIds.description,
] as const;

function normalizeLocaleKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeMarketKey(value: string): string {
  return value.trim().toLowerCase();
}

function sortLocaleValues(values: string[]): string[] {
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

function translateMaybe(t: ReturnType<typeof useTranslation>['t'], value: string): string {
  const translated = t(value);
  return translated === value ? value : translated;
}

function renderImportErrorLabel(t: ReturnType<typeof useTranslation>['t'], error: MsStoreDataImportError): string {
  if (error.index === null) {
    return t(error.messageKey);
  }

  return `${t('msStore.importErrorPrefix', { index: error.index + 1 })}: ${t(error.messageKey)}`;
}

function getEntryMissingRequiredCount(entry: MsStoreDataEntry): number {
  let missingCount = entry.storeId.trim().length === 0 ? 1 : 0;

  requiredFieldIds.forEach((fieldId) => {
    if ((entry.fieldValues[fieldId] ?? '').trim().length === 0) {
      missingCount += 1;
    }
  });

  return missingCount;
}

function buildLocaleGroups(entries: MsStoreDataEntry[], untitledEntryLabel: string): LocaleGroup[] {
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
    const uniqueMarkets = new Set(localeEntries.map((entry) => entry.market.trim()).filter(Boolean));

    return {
      entries: localeEntries,
      key,
      latestUpdatedAt: latestEntry?.updatedAt ?? '-',
      locale,
      marketCount: uniqueMarkets.size,
      missingRequiredCount,
      previewTitle,
      status: missingRequiredCount > 0 ? 'needsReview' : 'ready',
    } satisfies LocaleGroup;
  });
}

function createDraftLocaleGroup(locale: string, previewTitle: string): LocaleGroup {
  return {
    entries: [],
    key: normalizeLocaleKey(locale),
    latestUpdatedAt: '-',
    locale,
    marketCount: 0,
    missingRequiredCount: 0,
    previewTitle,
    status: 'new',
  };
}

function isAssetMsStoreField(fieldDefinition: MsStoreFieldDefinition): boolean {
  return /screenshot|icon|logo|trailer|hero|image/i.test(fieldDefinition.field);
}

function getInventoryFieldState(
  fieldDefinition: MsStoreFieldDefinition,
  draft: MsStoreDataDraft | null,
  defaultValues: Record<string, string>,
): 'empty' | 'changed' | 'filled' {
  const defaultValue = (defaultValues[fieldDefinition.id] ?? '').trim();
  const localeValue = (draft?.fieldValues[fieldDefinition.id] ?? '').trim();

  if (localeValue.length === 0) {
    return 'empty';
  }

  if (localeValue !== defaultValue) {
    return 'changed';
  }

  return 'filled';
}

function StatusBadge({ status, t }: { status: LocaleGroupStatus; t: ReturnType<typeof useTranslation>['t'] }) {
  if (status === 'ready') {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" variant="outline">
        <CheckCircle2 className="size-3" />
        {t('msStore.languageStatusReady')}
      </Badge>
    );
  }

  if (status === 'new') {
    return (
      <Badge className="border-primary/20 bg-primary/10 text-primary" variant="outline">
        <Plus className="size-3" />
        {t('msStore.languageStatusNew')}
      </Badge>
    );
  }

  return (
    <Badge className="border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" variant="outline">
      <AlertCircle className="size-3" />
      {t('msStore.languageStatusNeedsReview')}
    </Badge>
  );
}

function FieldEditorControl({
  ariaLabel,
  fieldDefinition,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel: string;
  fieldDefinition: MsStoreFieldDefinition;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  if (isBooleanMsStoreField(fieldDefinition)) {
    return (
      <select
        aria-label={ariaLabel}
        className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">-</option>
        <option value="True">True</option>
        <option value="False">False</option>
      </select>
    );
  }

  if (isLongTextMsStoreField(fieldDefinition)) {
    return (
      <textarea
        aria-label={ariaLabel}
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    );
  }

  return (
    <Input
      aria-label={ariaLabel}
      className="h-8"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

interface CoreFieldRowProps {
  defaultValue: string;
  error?: string;
  fieldDefinition: MsStoreFieldDefinition;
  fieldId: string;
  fieldKey: CoreDraftFieldKey;
  label: string;
  localeValue: string;
  onDefaultFieldChange: (fieldId: string, value: string) => void;
  onDraftFieldChange: (field: CoreDraftFieldKey, value: string) => void;
  placeholder: string;
}

const CoreFieldRow = memo(function CoreFieldRow({
  defaultValue,
  error,
  fieldDefinition,
  fieldId,
  fieldKey,
  label,
  localeValue,
  onDefaultFieldChange,
  onDraftFieldChange,
  placeholder,
}: CoreFieldRowProps) {
  return (
    <div className="border-t border-border/70 px-4 py-3 [content-visibility:auto] [contain-intrinsic-size:120px]">
      <div className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{fieldDefinition.field} · ID {fieldDefinition.id}</p>
        </div>
        <FieldEditorControl
          ariaLabel={`${label} default`}
          fieldDefinition={fieldDefinition}
          onChange={(value) => onDefaultFieldChange(fieldId, value)}
          placeholder={placeholder}
          value={defaultValue}
        />
        <FieldEditorControl
          ariaLabel={label}
          fieldDefinition={fieldDefinition}
          onChange={(value) => onDraftFieldChange(fieldKey, value)}
          placeholder={placeholder}
          value={localeValue}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}, (prev, next) => (
  prev.defaultValue === next.defaultValue
  && prev.error === next.error
  && prev.fieldDefinition.id === next.fieldDefinition.id
  && prev.label === next.label
  && prev.localeValue === next.localeValue
  && prev.placeholder === next.placeholder
));

interface InventoryFieldRowProps {
  defaultValue: string;
  fieldDefinition: MsStoreFieldDefinition;
  fieldStateLabel: string;
  localeLabel: string;
  localeValue: string;
  onDefaultFieldChange: (fieldId: string, value: string) => void;
  onDraftInventoryFieldChange: (fieldId: string, value: string) => void;
}

const InventoryFieldRow = memo(function InventoryFieldRow({
  defaultValue,
  fieldDefinition,
  fieldStateLabel,
  localeLabel,
  localeValue,
  onDefaultFieldChange,
  onDraftInventoryFieldChange,
}: InventoryFieldRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border/60 px-4 py-3 [content-visibility:auto] [contain-intrinsic-size:96px]">
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{fieldDefinition.field}</p>
          <Badge variant="outline">ID {fieldDefinition.id}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{fieldDefinition.type}</span>
          <span>{fieldStateLabel}</span>
        </div>
      </div>
      <FieldEditorControl
        ariaLabel={`${fieldDefinition.field} default`}
        fieldDefinition={fieldDefinition}
        onChange={(value) => onDefaultFieldChange(fieldDefinition.id, value)}
        value={defaultValue}
      />
      <FieldEditorControl
        ariaLabel={`${fieldDefinition.field} ${localeLabel}`}
        fieldDefinition={fieldDefinition}
        onChange={(value) => onDraftInventoryFieldChange(fieldDefinition.id, value)}
        value={localeValue}
      />
    </div>
  );
}, (prev, next) => (
  prev.defaultValue === next.defaultValue
  && prev.fieldDefinition.id === next.fieldDefinition.id
  && prev.fieldStateLabel === next.fieldStateLabel
  && prev.localeLabel === next.localeLabel
  && prev.localeValue === next.localeValue
));

export function ProductProfilePage({
  currentProduct,
  defaultValues,
  draft,
  entries,
  exportError,
  exportPath,
  exportStatus,
  fieldErrors,
  importError,
  importErrors,
  importStatus,
  loadError,
  loadStatus,
  onAddEntry,
  onClearMessages,
  onDefaultFieldChange,
  onDeleteEntry,
  onDraftFieldChange,
  onDraftInventoryFieldChange,
  onExport,
  onImport,
  onOpenProducts,
  onResetDraft,
  onSaveDraft,
  onSelectEntry,
  onSelectProduct,
  products,
  selectedEntryId,
  selectedProductId,
}: ProductProfilePageProps) {
  const { t } = useTranslation();
  const [fieldQuery, setFieldQuery] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all');
  const deferredFieldQuery = useDeferredValue(fieldQuery);

  if (!currentProduct || products.length === 0) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader className="border-b border-border/80 pb-3">
          <CardTitle>{t('msStore.emptyTitle')}</CardTitle>
          <CardDescription>{t('msStore.emptyDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-6">
          <div className="rounded-xl border border-dashed border-border bg-[color:var(--surface-panel-muted)] p-5 text-sm text-muted-foreground">
            {t('msStore.emptyBody')}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onOpenProducts} type="button">
              <ArrowLeft className="size-4" />
              {t('msStore.backToProducts')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const productOptions = useMemo(() => products.map((product) => ({
    value: product.id,
    label: product.name || t('products.untitledProduct'),
    description: product.folderName || t('sidebar.folderFallback'),
  })), [products, t]);

  const localeGroups = useMemo(() => buildLocaleGroups(entries, t('msStore.untitledEntry')), [entries, t]);
  const draftLocale = draft?.locale.trim() ?? '';
  const draftLocaleKey = normalizeLocaleKey(draftLocale);
  const hasDraftLocaleGroup = draftLocaleKey.length > 0 && localeGroups.some((group) => group.key === draftLocaleKey);
  const visibleLocaleGroups = useMemo(() => (hasDraftLocaleGroup || draftLocale.length === 0
    ? localeGroups
    : sortLocaleValues([...localeGroups.map((group) => group.locale), draftLocale]).map((locale) => (
        localeGroups.find((group) => group.key === normalizeLocaleKey(locale))
        ?? createDraftLocaleGroup(locale, t('msStore.untitledEntry'))
      ))), [draftLocale, hasDraftLocaleGroup, localeGroups, t]);
  const activeLocale = draftLocale || visibleLocaleGroups[0]?.locale || '';
  const activeLocaleKey = normalizeLocaleKey(activeLocale);
  const activeLocaleGroup = visibleLocaleGroups.find((group) => group.key === activeLocaleKey) ?? null;
  const currentLocaleLabel = activeLocale ? getMsStoreLanguageLabel(activeLocale) : t('msStore.inventory.noLocaleSelected');
  const localeEntries = activeLocaleGroup?.entries ?? [];
  const localeRecordCount = localeEntries.length;
  const activeEntry = localeEntries.find((entry) => entry.id === selectedEntryId)
    ?? localeEntries.find((entry) => normalizeMarketKey(entry.market) === normalizeMarketKey(draft?.market ?? ''))
    ?? localeEntries[0]
    ?? null;
  const knownMarkets = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.market.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [entries],
  );
  const localeMarkets = useMemo(
    () => Array.from(new Set(localeEntries.map((entry) => entry.market.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [localeEntries],
  );
  const marketSuggestions = useMemo(() => Array.from(new Set([...localeMarkets, ...knownMarkets])), [knownMarkets, localeMarkets]);
  const requiredFilledCount = [
    draft?.storeId.trim().length ? 'storeId' : null,
    ...requiredFieldIds.map((fieldId) => ((draft?.fieldValues[fieldId] ?? '').trim().length > 0 ? fieldId : null)),
  ].filter(Boolean).length;
  const localeOnlyCount = Object.entries(draft?.fieldValues ?? {}).filter(([fieldId, value]) => value.trim().length > 0 && (defaultValues[fieldId] ?? '').trim().length === 0).length;
  const changedCount = Object.entries(draft?.fieldValues ?? {}).filter(([fieldId, value]) => value.trim().length > 0 && value.trim() !== (defaultValues[fieldId] ?? '').trim()).length;

  const normalizedQuery = deferredFieldQuery.trim().toLowerCase();
  const inventoryFields = useMemo(() => msStoreFieldRegistry.filter((fieldDefinition) => {
    if (coreFieldIdSet.has(fieldDefinition.id)) {
      return false;
    }

    if (normalizedQuery.length > 0 && ![fieldDefinition.field, fieldDefinition.id, fieldDefinition.type].some((value) => value.toLowerCase().includes(normalizedQuery))) {
      return false;
    }

    if (inventoryFilter === 'empty') {
      return getInventoryFieldState(fieldDefinition, draft, defaultValues) === 'empty';
    }

    if (inventoryFilter === 'changed') {
      return getInventoryFieldState(fieldDefinition, draft, defaultValues) === 'changed';
    }

    if (inventoryFilter === 'assets') {
      return isAssetMsStoreField(fieldDefinition);
    }

    if (inventoryFilter === 'longText') {
      return isLongTextMsStoreField(fieldDefinition);
    }

    return true;
  }), [defaultValues, draft, inventoryFilter, normalizedQuery]);

  const statusBadge = loadStatus === 'loading'
    ? t('msStore.loading')
    : loadStatus === 'failed'
      ? t('msStore.loadFailed')
      : null;

  const localeOptions = useMemo(() => supportedMsStoreLanguages.map((locale) => ({
    value: locale,
    label: getMsStoreLanguageLabel(locale),
  })), []);

  const inventoryFilters: Array<{ id: InventoryFilter; label: string }> = [
    { id: 'all', label: t('msStore.inventory.filters.all') },
    { id: 'empty', label: t('msStore.inventory.filters.empty') },
    { id: 'changed', label: t('msStore.inventory.filters.changed') },
    { id: 'assets', label: t('msStore.inventory.filters.assets') },
    { id: 'longText', label: t('msStore.inventory.filters.longText') },
  ];

  const handleSelectLocaleGroup = (locale: string) => {
    const localeKey = normalizeLocaleKey(locale);
    const group = visibleLocaleGroups.find((candidate) => candidate.key === localeKey);

    if (!group || group.entries.length === 0) {
      onAddEntry();
      onDraftFieldChange('locale', locale);
      return;
    }

    const preferredEntry = group.entries.find((entry) => normalizeMarketKey(entry.market) === normalizeMarketKey(draft?.market ?? '')) ?? group.entries[0];
    onSelectEntry(preferredEntry.id);
  };

  const handleUseMarket = (market: string) => {
    const normalizedLocale = activeLocale || draft?.locale || '';
    const existingEntry = entries.find((entry) => (
      normalizeLocaleKey(entry.locale) === normalizeLocaleKey(normalizedLocale)
      && normalizeMarketKey(entry.market) === normalizeMarketKey(market)
    ));

    if (existingEntry) {
      onSelectEntry(existingEntry.id);
      return;
    }

    if (!selectedEntryId) {
      onDraftFieldChange('market', market);
      return;
    }

    onAddEntry();
    if (normalizedLocale) {
      onDraftFieldChange('locale', normalizedLocale);
    }
    onDraftFieldChange('market', market);
  };

  return (
    <div className="grid min-h-0 gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/80 pb-3">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-3">
              <div>
                <CardTitle>{t('msStore.title')}</CardTitle>
                <CardDescription>{t('msStore.description')}</CardDescription>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-end">
                <div className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t('msStore.currentProductLabel')}
                  </span>
                  <SearchableSelect
                    emptyMessage={t('msStore.productSwitcherEmpty')}
                    onChange={(value) => value && onSelectProduct(value)}
                    options={productOptions}
                    placeholder={t('msStore.productSwitcherPlaceholder')}
                    searchPlaceholder={t('msStore.productSwitcherSearch')}
                    value={selectedProductId}
                  />
                </div>
                <Button onClick={onImport} type="button" variant="outline">
                  <FileUp className="size-4" />
                  {t('msStore.importAction')}
                </Button>
                <Button onClick={onExport} type="button" variant="outline">
                  <FileDown className="size-4" />
                  {t('msStore.exportAction')}
                </Button>
                <Button onClick={onAddEntry} type="button">
                  <Plus className="size-4" />
                  {t('msStore.addEntry')}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {statusBadge ? <Badge variant="secondary">{statusBadge}</Badge> : null}
              {importStatus === 'loading' ? <Badge variant="secondary">{t('msStore.importing')}</Badge> : null}
              {importStatus === 'succeeded' ? <Badge>{t('msStore.importSuccess')}</Badge> : null}
              {exportStatus === 'loading' ? <Badge variant="secondary">{t('msStore.exporting')}</Badge> : null}
              {exportStatus === 'succeeded' ? <Badge>{t('msStore.exportSuccess')}</Badge> : null}
              <Badge variant="secondary">{t('msStore.countLabel', { count: entries.length })}</Badge>
              <Badge variant="secondary">{t('msStore.localeCountLabel', { count: visibleLocaleGroups.length })}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-4">
          <div className="grid gap-4 rounded-2xl border border-border/70 bg-[color:var(--surface-panel-muted)] p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('msStore.activeContextLabel')}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">{currentProduct.name || t('products.untitledProduct')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{currentProduct.description || t('msStore.noDescription')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentProduct.relatedMarkets.map((market) => (
                <Badge key={market} variant="secondary">{market}</Badge>
              ))}
            </div>
          </div>

          {loadError ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{translateMaybe(t, loadError)}</div> : null}
          {importError ? (
            <div className="grid gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <div className="flex items-center justify-between gap-3">
                <span>{translateMaybe(t, importError)}</span>
                <Button onClick={onClearMessages} size="sm" type="button" variant="ghost">{t('msStore.dismissStatus')}</Button>
              </div>
              {importErrors.length > 0 ? (
                <ul className="grid gap-1 text-xs">
                  {importErrors.map((error, index) => (
                    <li key={`${error.field}-${error.index ?? 'root'}-${index}`}>{renderImportErrorLabel(t, error)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {exportError ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span>{translateMaybe(t, exportError)}</span>
              <Button onClick={onClearMessages} size="sm" type="button" variant="ghost">{t('msStore.dismissStatus')}</Button>
            </div>
          ) : null}
          {exportPath ? (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {t('msStore.exportPathLabel')}: <span className="font-mono text-xs">{exportPath}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)_minmax(16rem,20rem)]">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="border-b border-border/80 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{t('msStore.languagePanelTitle')}</CardTitle>
                <CardDescription>{t('msStore.languagePanelDescription')}</CardDescription>
              </div>
              <Badge variant="secondary">{visibleLocaleGroups.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid min-h-0 gap-4 overflow-auto pt-4">
            <div className="grid gap-2">
              {visibleLocaleGroups.length > 0 ? visibleLocaleGroups.map((group) => {
                const isSelected = group.key === activeLocaleKey;

                return (
                  <button
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
                      isSelected ? 'border-primary/35 bg-primary/8' : 'border-border/70 bg-background hover:bg-accent/55',
                    )}
                    key={group.key}
                    onClick={() => handleSelectLocaleGroup(group.locale)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{getMsStoreLanguageLabel(group.locale)}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{group.previewTitle}</p>
                      </div>
                      <StatusBadge status={group.status} t={t} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{t('msStore.localeRecordsLabel', { count: group.entries.length })}</span>
                      <span>{t('msStore.localeMarketsLabel', { count: group.marketCount })}</span>
                      <span className="font-mono">{group.latestUpdatedAt}</span>
                    </div>
                  </button>
                );
              }) : (
                <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                  {t('msStore.noEntries')}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-[color:var(--surface-panel-muted)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.coverageTitle')}</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('msStore.coverageRequired')}</span>
                  <span className="font-medium text-foreground">{requiredFilledCount} / 4</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('msStore.coverageChanged')}</span>
                  <span className="font-medium text-foreground">{changedCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('msStore.coverageLocaleOnly')}</span>
                  <span className="font-medium text-foreground">{localeOnlyCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="border-b border-border/80 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{t('msStore.editorTitle')}</CardTitle>
                <CardDescription>{t('msStore.editorDescription', { locale: currentLocaleLabel })}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selectedEntryId ? 'secondary' : 'default'}>
                  {selectedEntryId ? t('msStore.editingExisting') : t('msStore.creatingNew')}
                </Badge>
                {activeEntry ? <Badge variant="outline">{activeEntry.updatedAt}</Badge> : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid min-h-0 gap-5 overflow-auto pt-4">
            <section className="grid gap-4 rounded-xl border border-border/70 bg-[color:var(--surface-panel-muted)] p-4">
              <div className="grid gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.overviewTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('msStore.overviewDescription')}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,13rem)_minmax(0,1fr)]">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">{t('msStore.form.localeLabel')}</span>
                  <select
                    aria-invalid={fieldErrors.locale ? 'true' : 'false'}
                    aria-label={t('msStore.form.localeLabel')}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15"
                    onChange={(event) => onDraftFieldChange('locale', event.target.value)}
                    value={draft?.locale ?? ''}
                  >
                    <option value="">{t('msStore.form.localePlaceholder')}</option>
                    {localeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {fieldErrors.locale ? <span className="text-sm text-destructive">{t(fieldErrors.locale)}</span> : null}
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">{t('msStore.form.marketLabel')}</span>
                  <Input
                    aria-invalid={fieldErrors.market ? 'true' : 'false'}
                    aria-label={t('msStore.form.marketLabel')}
                    list="msstore-market-options"
                    onChange={(event) => onDraftFieldChange('market', event.target.value)}
                    placeholder={t('msStore.form.marketPlaceholder')}
                    value={draft?.market ?? ''}
                  />
                  {fieldErrors.market ? <span className="text-sm text-destructive">{t(fieldErrors.market)}</span> : null}
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">{t('msStore.form.storeIdLabel')}</span>
                  <Input
                    aria-invalid={fieldErrors.storeId ? 'true' : 'false'}
                    aria-label={t('msStore.form.storeIdLabel')}
                    className="font-mono"
                    onChange={(event) => onDraftFieldChange('storeId', event.target.value)}
                    placeholder={t('msStore.form.storeIdPlaceholder')}
                    value={draft?.storeId ?? ''}
                  />
                  {fieldErrors.storeId ? <span className="text-sm text-destructive">{t(fieldErrors.storeId)}</span> : null}
                </label>
              </div>

              <datalist id="msstore-market-options">
                {marketSuggestions.map((market) => (
                  <option key={market} value={market} />
                ))}
              </datalist>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">{t('msStore.marketRecordsTitle')}</span>
                <div className="flex flex-wrap gap-2">
                  {marketSuggestions.length > 0 ? marketSuggestions.map((market) => {
                    const marketEntry = localeEntries.find((entry) => normalizeMarketKey(entry.market) === normalizeMarketKey(market));
                    const isSelected = normalizeMarketKey(draft?.market ?? '') === normalizeMarketKey(market);

                    return (
                      <button
                        aria-label={`${t('msStore.form.marketLabel')} ${market}`}
                        className={cn(
                          'inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
                          isSelected ? 'border-primary/35 bg-primary/8 text-foreground' : 'border-border bg-background text-muted-foreground hover:bg-accent/55 hover:text-foreground',
                        )}
                        key={market}
                        onClick={() => handleUseMarket(market)}
                        type="button"
                      >
                        <span>{market}</span>
                        <Badge variant="outline">{marketEntry ? t('msStore.marketRecordExisting') : t('msStore.marketRecordNew')}</Badge>
                      </button>
                    );
                  }) : (
                    <p className="text-sm text-muted-foreground">{t('msStore.marketRecordsEmpty')}</p>
                  )}
                </div>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">{t('msStore.form.keywordsLabel')}</span>
                <Input
                  aria-invalid={fieldErrors.keywords ? 'true' : 'false'}
                  aria-label={t('msStore.form.keywordsLabel')}
                  onChange={(event) => onDraftFieldChange('keywordsText', event.target.value)}
                  placeholder={t('msStore.form.keywordsPlaceholder')}
                  value={draft?.keywordsText ?? ''}
                />
                <p className="text-xs text-muted-foreground">{t('msStore.form.keywordsHint')}</p>
                {fieldErrors.keywords ? <span className="text-sm text-destructive">{t(fieldErrors.keywords)}</span> : null}
              </label>
            </section>

            <section className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.coreFieldsLabel')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('msStore.coreFieldsDescription', { locale: currentLocaleLabel })}</p>
                </div>
                <Badge variant="secondary">{currentLocaleLabel}</Badge>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
                <div className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,1fr)] gap-3 bg-[color:var(--surface-panel-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <span>{t('msStore.inventory.columns.field')}</span>
                  <span>{t('msStore.inventory.columns.default')}</span>
                  <span>{t('msStore.inventory.columns.locale', { locale: currentLocaleLabel })}</span>
                </div>

                {[
                  { error: fieldErrors.title, fieldId: msStoreCoreFieldIds.title, key: 'title' as const, label: t('msStore.form.titleLabel'), placeholder: t('msStore.form.titlePlaceholder') },
                  { error: undefined, fieldId: msStoreCoreFieldIds.subtitle, key: 'subtitle' as const, label: t('msStore.form.subtitleLabel'), placeholder: t('msStore.form.subtitlePlaceholder') },
                  { error: fieldErrors.shortDescription, fieldId: msStoreCoreFieldIds.shortDescription, key: 'shortDescription' as const, label: t('msStore.form.shortDescriptionLabel'), placeholder: t('msStore.form.shortDescriptionPlaceholder') },
                  { error: fieldErrors.description, fieldId: msStoreCoreFieldIds.description, key: 'description' as const, label: t('msStore.form.descriptionLabel'), placeholder: t('msStore.form.descriptionPlaceholder') },
                ].map((coreField) => {
                  const fieldDefinition = msStoreFieldRegistry.find((candidate) => candidate.id === coreField.fieldId);

                  if (!fieldDefinition) {
                    return null;
                  }

                  return (
                    <CoreFieldRow
                      defaultValue={defaultValues[coreField.fieldId] ?? ''}
                      error={coreField.error ? t(coreField.error) : undefined}
                      fieldDefinition={fieldDefinition}
                      fieldId={coreField.fieldId}
                      fieldKey={coreField.key}
                      key={coreField.fieldId}
                      label={coreField.label}
                      localeValue={draft?.[coreField.key] ?? ''}
                      onDefaultFieldChange={onDefaultFieldChange}
                      onDraftFieldChange={onDraftFieldChange}
                      placeholder={coreField.placeholder}
                    />
                  );
                })}
              </div>
            </section>

            <section className="grid min-h-0 gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.inventory.title')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('msStore.inventory.description', { locale: currentLocaleLabel })}</p>
                </div>
                <Badge variant="secondary">{t('msStore.inventory.countLabel', { count: inventoryFields.length })}</Badge>
              </div>

              <div className="min-h-0 overflow-hidden rounded-xl border border-border/70 bg-background">
                <div className="grid gap-3 border-b border-border/70 bg-[color:var(--surface-panel-muted)] px-4 py-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      aria-label={t('msStore.inventory.searchLabel')}
                      className="pl-10"
                      onChange={(event) => setFieldQuery(event.target.value)}
                      placeholder={t('msStore.inventory.searchPlaceholder')}
                      value={fieldQuery}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inventoryFilters.map((filter) => (
                      <Button
                        key={filter.id}
                        onClick={() => setInventoryFilter(filter.id)}
                        size="sm"
                        type="button"
                        variant={inventoryFilter === filter.id ? 'secondary' : 'outline'}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {inventoryFields.length > 0 ? (
                  <div className="max-h-[34rem] overflow-auto">
                    <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border/70 bg-background px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <span>{t('msStore.inventory.columns.field')}</span>
                      <span>{t('msStore.inventory.columns.default')}</span>
                      <span>{t('msStore.inventory.columns.locale', { locale: currentLocaleLabel })}</span>
                    </div>

                    {inventoryFields.map((fieldDefinition) => {
                      const fieldState = getInventoryFieldState(fieldDefinition, draft, defaultValues);

                      return (
                        <InventoryFieldRow
                          defaultValue={defaultValues[fieldDefinition.id] ?? ''}
                          fieldDefinition={fieldDefinition}
                          fieldStateLabel={t(`msStore.inventory.fieldState.${fieldState}`)}
                          key={fieldDefinition.id}
                          localeLabel={currentLocaleLabel}
                          localeValue={draft?.fieldValues[fieldDefinition.id] ?? ''}
                          onDefaultFieldChange={onDefaultFieldChange}
                          onDraftInventoryFieldChange={onDraftInventoryFieldChange}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-sm text-muted-foreground">{t('msStore.inventory.empty')}</div>
                )}
              </div>
            </section>

            <div className="flex flex-wrap justify-end gap-3 border-t border-border/70 pt-4">
              <Button onClick={onDeleteEntry} type="button" variant="outline">
                <Trash2 className="size-4" />
                {t('msStore.deleteAction')}
              </Button>
              <Button onClick={onResetDraft} type="button" variant="outline">
                <RotateCcw className="size-4" />
                {t('msStore.resetAction')}
              </Button>
              <Button onClick={onSaveDraft} type="button">
                <Save className="size-4" />
                {t('msStore.saveAction')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="border-b border-border/80 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{t('msStore.toolsTitle')}</CardTitle>
                <CardDescription>{t('msStore.toolsDescription')}</CardDescription>
              </div>
              <LayoutList className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="grid min-h-0 gap-4 overflow-auto pt-4">
            <div className="rounded-xl border border-border/70 bg-[color:var(--surface-panel-muted)] px-4 py-3">
              <div className="flex items-center gap-2 text-foreground">
                <Languages className="size-4" />
                <span className="text-sm font-medium">{currentLocaleLabel}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('msStore.localeRecordsStat')}</span>
                  <span className="font-medium text-foreground">{localeRecordCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('msStore.localeMarketsStat')}</span>
                  <span className="font-medium text-foreground">{localeMarkets.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('msStore.localeMarketActive')}</span>
                  <span className="font-medium text-foreground">{draft?.market || '-'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.inventory.filtersLabel')}</p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                {inventoryFilters.map((filter) => (
                  <div className="flex items-center justify-between gap-3" key={filter.id}>
                    <span className={cn(inventoryFilter === filter.id && 'text-foreground')}>{filter.label}</span>
                    <span>{filter.id === inventoryFilter ? '●' : '○'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.marketRecordsTitle')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {localeMarkets.length > 0 ? localeMarkets.map((market) => (
                  <Badge key={market} variant={normalizeMarketKey(draft?.market ?? '') === normalizeMarketKey(market) ? 'default' : 'secondary'}>
                    {market}
                  </Badge>
                )) : <span className="text-sm text-muted-foreground">{t('msStore.marketRecordsEmpty')}</span>}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-[color:var(--surface-panel-muted)] px-4 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <FileWarning className="size-4" />
                <span className="font-medium">{t('msStore.scopeNoticeTitle')}</span>
              </div>
              <p className="mt-2">{t('msStore.scopeNoticeBody')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
