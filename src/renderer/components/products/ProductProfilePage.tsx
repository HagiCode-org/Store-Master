import { memo, useDeferredValue, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  FileUp,
  Plus,
  RotateCcw,
  Save,
  Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card';
import { Input } from '@/components/input';
import { SearchableSelect } from '@/components/searchable-select';
import { groupMsStoreInventoryFields, type MsStoreInventoryGroupId } from '@/lib/msStoreFieldGroups';
import {
  buildLocaleGroups,
  createDraftLocaleGroup,
  normalizeLocaleKey,
  sortLocaleValues,
  type LocaleGroupStatus,
} from '@/lib/msStoreLanguages';
import { cn } from '@/lib/utils';
import {
  findMsStoreEntryByLocale,
  type MsStoreDataImportError,
  type MsStoreDataValidationErrors,
  getMsStoreLanguageLabel,
  isBooleanMsStoreField,
  isLongTextMsStoreField,
  msStoreCoreFieldIds,
  msStoreFieldRegistry,
  type MsStoreDataEntry,
  type MsStoreFieldDefinition,
} from '../../../shared/ms-store-data';
import {
  getEnabledProductMarkets,
  getProductMarketSettings,
} from '../../../shared/products';
import type { MsStoreDataDraft } from '@/store/slices/msStoreDataSlice';
import type { ProductRecord } from '@/store/slices/productManagementSlice';

interface ProductProfilePageProps {
  currentProduct: ProductRecord | null;
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
  onClearMessages: () => void;
  onDraftFieldChange: (field: EditableDraftFieldKey, value: string) => void;
  onDraftInventoryFieldChange: (fieldId: string, value: string) => void;
  onExport: () => void;
  onImport: () => void;
  onOpenProducts: () => void;
  onResetDraft: () => void;
  onSaveDraft: () => void;
  onSelectEntry: (entryId: string) => void;
  onSelectProduct: (productId: string) => void;
  products: ProductRecord[];
  selectedProductId: string;
}

type InventoryFilter = 'all' | 'empty' | 'changed' | 'assets' | 'longText';
type CoreDraftFieldKey = 'title' | 'subtitle' | 'shortDescription' | 'description';
type EditableDraftFieldKey = keyof Pick<MsStoreDataDraft, 'title' | 'subtitle' | 'shortDescription' | 'description'>;
type EditorSectionId = 'core-fields' | `inventory-${MsStoreInventoryGroupId}`;

interface InventoryFieldGroupSummary {
  id: MsStoreInventoryGroupId;
  changedCount: number;
  emptyCount: number;
  fields: MsStoreFieldDefinition[];
}

const coreFieldIdSet = new Set(Object.values(msStoreCoreFieldIds));
const requiredFieldIds = [
  msStoreCoreFieldIds.title,
  msStoreCoreFieldIds.shortDescription,
  msStoreCoreFieldIds.description,
] as const;

function createInventorySectionId(groupId: MsStoreInventoryGroupId): EditorSectionId {
  return `inventory-${groupId}`;
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


function isAssetMsStoreField(fieldDefinition: MsStoreFieldDefinition): boolean {
  return /screenshot|icon|logo|trailer|hero|image/i.test(fieldDefinition.field);
}

function getInventoryFieldState(
  fieldDefinition: MsStoreFieldDefinition,
  draft: MsStoreDataDraft | null,
  baselineFieldValues: Record<string, string>,
): 'empty' | 'changed' | 'filled' {
  const defaultValue = (baselineFieldValues[fieldDefinition.id] ?? '').trim();
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
  disabled = false,
  fieldDefinition,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel: string;
  disabled?: boolean;
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
        disabled={disabled}
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
        disabled={disabled}
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
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

interface CoreFieldRowProps {
  baselineValue: string;
  error?: string;
  fieldDefinition: MsStoreFieldDefinition;
  fieldKey: CoreDraftFieldKey;
  label: string;
  localeValue: string;
  onDraftFieldChange: (field: CoreDraftFieldKey, value: string) => void;
  placeholder: string;
}

function CoreFieldRow({
  baselineValue,
  error,
  fieldDefinition,
  fieldKey,
  label,
  localeValue,
  onDraftFieldChange,
  placeholder,
}: CoreFieldRowProps) {
  return (
    <div className="border-t border-border/70 px-4 py-3">
      <div className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{fieldDefinition.field} · ID {fieldDefinition.id}</p>
        </div>
        <FieldEditorControl
          ariaLabel={`${label} baseline`}
          disabled
          fieldDefinition={fieldDefinition}
          onChange={() => {}}
          placeholder={placeholder}
          value={baselineValue}
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
}

interface InventoryFieldRowProps {
  baselineValue: string;
  fieldDefinition: MsStoreFieldDefinition;
  fieldStateLabel: string;
  localeLabel: string;
  localeValue: string;
  onDraftInventoryFieldChange: (fieldId: string, value: string) => void;
}

const InventoryFieldRow = memo(function InventoryFieldRow({
  baselineValue,
  fieldDefinition,
  fieldStateLabel,
  localeLabel,
  localeValue,
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
        ariaLabel={`${fieldDefinition.field} baseline`}
        disabled
        fieldDefinition={fieldDefinition}
        onChange={() => {}}
        value={baselineValue}
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
  prev.baselineValue === next.baselineValue
  && prev.fieldDefinition.id === next.fieldDefinition.id
  && prev.fieldStateLabel === next.fieldStateLabel
  && prev.localeLabel === next.localeLabel
  && prev.localeValue === next.localeValue
));

export function ProductProfilePage({
  currentProduct,
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
  onClearMessages,
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
  selectedProductId,
}: ProductProfilePageProps) {
  const { t } = useTranslation();
  const [fieldQuery, setFieldQuery] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all');
  const [activeNavigatorSection, setActiveNavigatorSection] = useState<EditorSectionId>('core-fields');
  const deferredFieldQuery = useDeferredValue(fieldQuery);
  const sectionRefs = useRef<Partial<Record<EditorSectionId, HTMLElement | null>>>({});

  const productOptions = useMemo(() => products.map((product) => ({
    value: product.id,
    label: product.name || t('products.untitledProduct'),
    description: product.folderName || t('sidebar.folderFallback'),
  })), [products, t]);

  const persistedEntryIds = useMemo(() => new Set(entries.map((entry) => entry.id)), [entries]);
  const activeSelectedEntryId = draft && persistedEntryIds.has(draft.id) ? draft.id : '';
  const localeGroups = useMemo(() => buildLocaleGroups(entries, t('msStore.untitledEntry')), [entries, t]);
  const draftLocale = draft?.locale.trim() ?? '';
  const defaultLocale = currentProduct?.relatedMarkets.msStore.defaultLanguage ?? '';
  const draftIsDefaultLocale = defaultLocale.length > 0 && draftLocale === defaultLocale;
  const defaultEntry = draftIsDefaultLocale
    ? {
        fieldValues: draft?.fieldValues ?? {},
      }
    : (defaultLocale ? findMsStoreEntryByLocale(entries, defaultLocale) : null);
  const defaultFieldValues = defaultEntry?.fieldValues ?? {};
  const draftLocaleKey = normalizeLocaleKey(draftLocale);
  const hasDraftLocaleGroup = draftLocaleKey.length > 0 && localeGroups.some((group) => group.key === draftLocaleKey);
  const visibleLocaleGroups = useMemo(() => (hasDraftLocaleGroup || draftLocale.length === 0
    ? localeGroups
    : sortLocaleValues([...localeGroups.map((group) => group.locale), draftLocale]).map((locale) => (
        localeGroups.find((group) => group.key === normalizeLocaleKey(locale))
        ?? createDraftLocaleGroup(locale, t('msStore.untitledEntry'))
      ))), [draftLocale, hasDraftLocaleGroup, localeGroups, t]);
  const activeLocale = draftLocale || (activeSelectedEntryId ? visibleLocaleGroups[0]?.locale ?? '' : '');
  const activeLocaleKey = normalizeLocaleKey(activeLocale);
  const currentLocaleLabel = activeLocale ? getMsStoreLanguageLabel(activeLocale) : t('msStore.inventory.noLocaleSelected');
  const defaultLocaleLabel = defaultLocale ? getMsStoreLanguageLabel(defaultLocale) : t('msStore.inventory.noLocaleSelected');
  const requiredFilledCount = requiredFieldIds
    .map((fieldId) => ((draft?.fieldValues[fieldId] ?? '').trim().length > 0 ? fieldId : null))
    .filter(Boolean).length;
  const localeOnlyCount = Object.entries(draft?.fieldValues ?? {}).filter(([fieldId, value]) => value.trim().length > 0 && (defaultFieldValues[fieldId] ?? '').trim().length === 0).length;
  const changedCount = Object.entries(draft?.fieldValues ?? {}).filter(([fieldId, value]) => value.trim().length > 0 && value.trim() !== (defaultFieldValues[fieldId] ?? '').trim()).length;
  const coreFields = useMemo(() => [
    { error: fieldErrors.title, fieldId: msStoreCoreFieldIds.title, key: 'title' as const, label: t('msStore.form.titleLabel'), placeholder: t('msStore.form.titlePlaceholder') },
    { error: undefined, fieldId: msStoreCoreFieldIds.subtitle, key: 'subtitle' as const, label: t('msStore.form.subtitleLabel'), placeholder: t('msStore.form.subtitlePlaceholder') },
    { error: fieldErrors.shortDescription, fieldId: msStoreCoreFieldIds.shortDescription, key: 'shortDescription' as const, label: t('msStore.form.shortDescriptionLabel'), placeholder: t('msStore.form.shortDescriptionPlaceholder') },
    { error: fieldErrors.description, fieldId: msStoreCoreFieldIds.description, key: 'description' as const, label: t('msStore.form.descriptionLabel'), placeholder: t('msStore.form.descriptionPlaceholder') },
  ], [fieldErrors.description, fieldErrors.shortDescription, fieldErrors.title, t]);

  const normalizedQuery = deferredFieldQuery.trim().toLowerCase();
  const inventoryFields = useMemo(() => msStoreFieldRegistry.filter((fieldDefinition) => {
    if (coreFieldIdSet.has(fieldDefinition.id)) {
      return false;
    }

    if (normalizedQuery.length > 0 && ![fieldDefinition.field, fieldDefinition.id, fieldDefinition.type].some((value) => value.toLowerCase().includes(normalizedQuery))) {
      return false;
    }

    if (inventoryFilter === 'empty') {
      return getInventoryFieldState(fieldDefinition, draft, defaultFieldValues) === 'empty';
    }

    if (inventoryFilter === 'changed') {
      return getInventoryFieldState(fieldDefinition, draft, defaultFieldValues) === 'changed';
    }

    if (inventoryFilter === 'assets') {
      return isAssetMsStoreField(fieldDefinition);
    }

    if (inventoryFilter === 'longText') {
      return isLongTextMsStoreField(fieldDefinition);
    }

    return true;
  }), [defaultFieldValues, draft, inventoryFilter, normalizedQuery]);
  const inventoryFieldGroups = useMemo<InventoryFieldGroupSummary[]>(() => groupMsStoreInventoryFields(inventoryFields).map((group) => {
    const summary = group.fields.reduce((counts, fieldDefinition) => {
      const fieldState = getInventoryFieldState(fieldDefinition, draft, defaultFieldValues);
      counts[fieldState] += 1;
      return counts;
    }, {
      empty: 0,
      changed: 0,
      filled: 0,
    });

    return {
      id: group.id,
      changedCount: summary.changed,
      emptyCount: summary.empty,
      fields: group.fields,
    };
  }), [defaultFieldValues, draft, inventoryFields]);
  const visibleInventoryGroups = inventoryFieldGroups;

  const statusBadge = loadStatus === 'loading'
    ? t('msStore.loading')
    : loadStatus === 'failed'
      ? t('msStore.loadFailed')
      : null;

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

    if (!group || group.entries.length === 0 || !draft) {
      return;
    }

    const preferredEntry = group.entries[0];
    onSelectEntry(preferredEntry.id);
  };

  const handleScrollToSection = (sectionId: EditorSectionId) => {
    setActiveNavigatorSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: 'auto',
      block: 'start',
    });
  };

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Card className="shrink-0 overflow-hidden">
        <CardHeader className="border-b border-border/80 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-1 min-w-0">
              <CardTitle className="text-base">{t('msStore.title')}</CardTitle>
              <CardDescription className="text-xs">{t('msStore.description')}</CardDescription>
            </div>

            <div className="min-w-[16rem] flex-1">
              <SearchableSelect
                emptyMessage={t('msStore.productSwitcherEmpty')}
                onChange={(value) => value && onSelectProduct(value)}
                options={productOptions}
                placeholder={t('msStore.productSwitcherPlaceholder')}
                searchPlaceholder={t('msStore.productSwitcherSearch')}
                value={selectedProductId}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onImport} size="sm" type="button" variant="outline">
                <FileUp className="size-4" />
                {t('msStore.importAction')}
              </Button>
              <Button onClick={onExport} size="sm" type="button" variant="outline">
                <FileDown className="size-4" />
                {t('msStore.exportAction')}
              </Button>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
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

        <CardContent className="grid gap-3 pt-3">
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-[color:var(--surface-panel-muted)] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">{currentProduct.name || t('products.untitledProduct')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{currentProduct.description || t('msStore.noDescription')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {getEnabledProductMarkets(currentProduct.relatedMarkets).map((market) => {
                const settings = getProductMarketSettings(currentProduct.relatedMarkets, market);

                return (
                  <Badge key={market} variant="secondary">
                    {market} · {getMsStoreLanguageLabel(settings.defaultLanguage)}
                  </Badge>
                );
              })}
            </div>
          </div>

          {!defaultEntry ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              {t('validation.msStore.defaultLanguageContentRequired')}
            </div>
          ) : null}

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

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(15rem,18rem)_minmax(16rem,19rem)_minmax(0,1fr)]">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="border-b border-border/80 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{t('msStore.languagePanelTitle')}</CardTitle>
                <CardDescription>{t('msStore.languagePanelDescription')}</CardDescription>
              </div>
              <Badge variant="secondary">{visibleLocaleGroups.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid min-h-0 flex-1 gap-4 overflow-auto pt-4">
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
                  <span className="font-medium text-foreground">{requiredFilledCount} / 3</span>
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

            {fieldErrors.locale ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t(fieldErrors.locale)}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="border-b border-border/80 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{t('msStore.inventory.groupByLabel')}</CardTitle>
                <CardDescription>{t('msStore.inventory.groupAllDescription')}</CardDescription>
              </div>
              <Badge variant="secondary">{visibleInventoryGroups.length + 1}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid min-h-0 flex-1 gap-3 overflow-auto pt-4">
            <button
              className={cn(
                'rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
                activeNavigatorSection === 'core-fields' ? 'border-primary/35 bg-primary/8' : 'border-border/70 bg-background hover:bg-accent/55',
              )}
              onClick={() => handleScrollToSection('core-fields')}
              type="button"
            >
              <span className="text-sm font-semibold text-foreground">{t('msStore.coreFieldsLabel')}</span>
            </button>

            {visibleInventoryGroups.length > 0 ? visibleInventoryGroups.map((group) => {
              const sectionId = createInventorySectionId(group.id);
              const isActive = activeNavigatorSection === sectionId;

              return (
                <button
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
                    isActive ? 'border-primary/35 bg-primary/8' : 'border-border/70 bg-background hover:bg-accent/55',
                  )}
                  key={group.id}
                  onClick={() => handleScrollToSection(sectionId)}
                  type="button"
                >
                  <span className="text-sm font-semibold text-foreground">{t(`msStore.inventory.groups.${group.id}.label`)}</span>
                </button>
              );
            }) : (
              <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                {t('msStore.inventory.empty')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="border-b border-border/80 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{t('msStore.editorTitle')}</CardTitle>
                <CardDescription className="text-xs">{t('msStore.editorDescription', { locale: currentLocaleLabel })}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={activeSelectedEntryId ? 'secondary' : 'default'}>
                  {activeSelectedEntryId ? t('msStore.editingExisting') : t('msStore.creatingNew')}
                </Badge>
                {draft?.updatedAt ? <Badge variant="outline">{draft.updatedAt}</Badge> : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden pt-4">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid gap-5 pb-2">
                <section
                  className="grid scroll-mt-4 gap-3"
                  ref={(element) => {
                    sectionRefs.current['core-fields'] = element;
                  }}
                >
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
                      <span>{t('msStore.inventory.columns.defaultLanguage', { locale: defaultLocaleLabel })}</span>
                      <span>{t('msStore.inventory.columns.locale', { locale: currentLocaleLabel })}</span>
                    </div>

                    {coreFields.map((coreField) => {
                      const fieldDefinition = msStoreFieldRegistry.find((candidate) => candidate.id === coreField.fieldId);

                      if (!fieldDefinition) {
                        return null;
                      }

                      return (
                        <CoreFieldRow
                          baselineValue={defaultFieldValues[coreField.fieldId] ?? ''}
                          error={coreField.error ? t(coreField.error) : undefined}
                          fieldDefinition={fieldDefinition}
                          fieldKey={coreField.key}
                          key={coreField.fieldId}
                          label={coreField.label}
                          localeValue={draft?.[coreField.key] ?? ''}
                          onDraftFieldChange={onDraftFieldChange}
                          placeholder={coreField.placeholder}
                        />
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.inventory.title')}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t('msStore.inventory.description', { locale: currentLocaleLabel })}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{t('msStore.inventory.countLabel', { count: inventoryFields.length })}</Badge>
                      <Badge variant="secondary">{t('msStore.inventory.groupCountLabel', { count: inventoryFieldGroups.length })}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-xl border border-border/70 bg-background p-4">
                    <div className="grid gap-3 rounded-xl border border-border/70 bg-[color:var(--surface-panel-muted)] px-4 py-3">
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

                    {visibleInventoryGroups.length > 0 ? (
                      <div className="grid gap-4">
                        {visibleInventoryGroups.map((group) => (
                          <div
                            className="overflow-hidden scroll-mt-4 rounded-xl border border-border/70 bg-background"
                            key={group.id}
                            ref={(element) => {
                              sectionRefs.current[createInventorySectionId(group.id)] = element;
                            }}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 bg-[color:var(--surface-panel-muted)] px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">{t(`msStore.inventory.groups.${group.id}.label`)}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{t(`msStore.inventory.groups.${group.id}.description`)}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{t('msStore.inventory.countLabel', { count: group.fields.length })}</Badge>
                                {group.changedCount > 0 ? (
                                  <Badge variant="outline">{t('msStore.inventory.groupState.changed', { count: group.changedCount })}</Badge>
                                ) : null}
                                {group.emptyCount > 0 ? (
                                  <Badge variant="outline">{t('msStore.inventory.groupState.empty', { count: group.emptyCount })}</Badge>
                                ) : null}
                              </div>
                            </div>

                            <div className="grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border/70 bg-background px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              <span>{t('msStore.inventory.columns.field')}</span>
                              <span>{t('msStore.inventory.columns.defaultLanguage', { locale: defaultLocaleLabel })}</span>
                              <span>{t('msStore.inventory.columns.locale', { locale: currentLocaleLabel })}</span>
                            </div>

                            {group.fields.map((fieldDefinition) => {
                              const fieldState = getInventoryFieldState(fieldDefinition, draft, defaultFieldValues);

                              return (
                                <InventoryFieldRow
                                  baselineValue={defaultFieldValues[fieldDefinition.id] ?? ''}
                                  fieldDefinition={fieldDefinition}
                                  fieldStateLabel={t(`msStore.inventory.fieldState.${fieldState}`)}
                                  key={fieldDefinition.id}
                                  localeLabel={currentLocaleLabel}
                                  localeValue={draft?.fieldValues[fieldDefinition.id] ?? ''}
                                  onDraftInventoryFieldChange={onDraftInventoryFieldChange}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-[color:var(--surface-panel-muted)] px-4 py-8 text-sm text-muted-foreground">
                        {t('msStore.inventory.empty')}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border/70 bg-card pt-4">
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
      </div>
    </div>
  );
}
