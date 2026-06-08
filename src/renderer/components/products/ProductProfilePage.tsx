import { useDeferredValue, useState } from 'react';
import { ArrowLeft, FileDown, FileUp, FileWarning, Plus, RotateCcw, Save, Search, Trash2 } from 'lucide-react';
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

const coreFieldIdSet = new Set(Object.values(msStoreCoreFieldIds));

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

function ValueEditor({
  fieldDefinition,
  label,
  value,
  onChange,
}: {
  fieldDefinition: MsStoreFieldDefinition;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const editorId = `${fieldDefinition.id}-${label.replace(/\s+/g, '-').toLowerCase()}`;

  if (isBooleanMsStoreField(fieldDefinition)) {
    return (
      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15"
          id={editorId}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option value="">-</option>
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
      </label>
    );
  }

  if (isLongTextMsStoreField(fieldDefinition)) {
    return (
      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <textarea
          className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15"
          id={editorId}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </label>
    );
  }

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Input id={editorId} onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

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
  const [selectedInventoryFieldId, setSelectedInventoryFieldId] = useState('700');
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

  const normalizedQuery = deferredFieldQuery.trim().toLowerCase();
  const inventoryFields = msStoreFieldRegistry.filter((fieldDefinition) => {
    if (coreFieldIdSet.has(fieldDefinition.id)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [fieldDefinition.field, fieldDefinition.id, fieldDefinition.type]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  const productOptions = products.map((product) => ({
    value: product.id,
    label: product.name || t('products.untitledProduct'),
    description: product.folderName || t('sidebar.folderFallback'),
  }));

  const statusBadge = loadStatus === 'loading'
    ? t('msStore.loading')
    : loadStatus === 'failed'
      ? t('msStore.loadFailed')
      : null;

  const currentLocaleLabel = draft?.locale
    ? getMsStoreLanguageLabel(draft.locale)
    : t('msStore.inventory.noLocaleSelected');

  const selectedInventoryField = inventoryFields.find((fieldDefinition) => fieldDefinition.id === selectedInventoryFieldId)
    ?? inventoryFields[0]
    ?? null;

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(28rem,1.05fr)]">
      <Card className="min-h-0 overflow-hidden">
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-4">
          <div className="grid gap-4 rounded-2xl border border-border/70 bg-[color:var(--surface-panel-muted)] p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('msStore.activeContextLabel')}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">{currentProduct.name || t('products.untitledProduct')}</p>
              <p className="mt-2 text-sm text-muted-foreground">{currentProduct.description || t('msStore.noDescription')}</p>
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
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
              {t('msStore.exportPathLabel')}: <span className="font-mono text-xs">{exportPath}</span>
            </div>
          ) : null}

          <div className="min-h-0 overflow-auto rounded-2xl border border-border/70">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[color:var(--surface-panel-muted)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t('msStore.table.locale')}</th>
                  <th className="px-4 py-3">{t('msStore.table.market')}</th>
                  <th className="px-4 py-3">{t('msStore.table.title')}</th>
                  <th className="px-4 py-3">{t('msStore.table.storeId')}</th>
                  <th className="px-4 py-3 text-right">{t('msStore.table.updated')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.length > 0 ? entries.map((entry) => {
                  const isSelected = entry.id === selectedEntryId;

                  return (
                    <tr
                      aria-selected={isSelected}
                      className={cn(
                        'cursor-pointer border-t border-border/70 transition-colors hover:bg-accent/55',
                        isSelected && 'bg-primary/10',
                      )}
                      key={entry.id}
                      onClick={() => onSelectEntry(entry.id)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{entry.locale ? getMsStoreLanguageLabel(entry.locale) : '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.market || '-'}</td>
                      <td className="px-4 py-3 text-foreground">{getMsStoreEntryCoreFieldValue(entry, 'title') || t('msStore.untitledEntry')}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{entry.storeId || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono text-[13px] text-muted-foreground">{entry.updatedAt}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={5}>
                      {loadStatus === 'loading' ? t('msStore.loading') : t('msStore.noEntries')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-0 overflow-hidden">
        <CardHeader className="border-b border-border/80 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{t('msStore.editorTitle')}</CardTitle>
              <CardDescription>{t('msStore.editorDescription')}</CardDescription>
            </div>
            <Badge variant={selectedEntryId ? 'secondary' : 'default'}>
              {selectedEntryId ? t('msStore.editingExisting') : t('msStore.creatingNew')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid min-h-0 gap-4 overflow-auto pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">{t('msStore.form.localeLabel')}</span>
              <Input
                aria-label={t('msStore.form.localeLabel')}
                aria-invalid={fieldErrors.locale ? 'true' : 'false'}
                onChange={(event) => onDraftFieldChange('locale', event.target.value)}
                placeholder={t('msStore.form.localePlaceholder')}
                value={draft?.locale ?? ''}
              />
              <p className="text-xs text-muted-foreground">
                {t('msStore.form.localeHint', { languages: supportedMsStoreLanguages.join(', ') })}
              </p>
              {fieldErrors.locale ? <span className="text-sm text-destructive">{t(fieldErrors.locale)}</span> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">{t('msStore.form.marketLabel')}</span>
              <Input
                aria-label={t('msStore.form.marketLabel')}
                aria-invalid={fieldErrors.market ? 'true' : 'false'}
                onChange={(event) => onDraftFieldChange('market', event.target.value)}
                placeholder={t('msStore.form.marketPlaceholder')}
                value={draft?.market ?? ''}
              />
              {fieldErrors.market ? <span className="text-sm text-destructive">{t(fieldErrors.market)}</span> : null}
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">{t('msStore.form.storeIdLabel')}</span>
            <Input
              aria-label={t('msStore.form.storeIdLabel')}
              aria-invalid={fieldErrors.storeId ? 'true' : 'false'}
              className="font-mono"
              onChange={(event) => onDraftFieldChange('storeId', event.target.value)}
              placeholder={t('msStore.form.storeIdPlaceholder')}
              value={draft?.storeId ?? ''}
            />
            {fieldErrors.storeId ? <span className="text-sm text-destructive">{t(fieldErrors.storeId)}</span> : null}
          </label>

          <div className="rounded-2xl border border-border/70 bg-[color:var(--surface-panel-muted)] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.coreFieldsLabel')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('msStore.coreFieldsDescription', { locale: currentLocaleLabel })}</p>
              </div>
              <Badge variant="secondary">{currentLocaleLabel}</Badge>
            </div>

            <div className="grid gap-4">
              {[
                {
                  error: fieldErrors.title,
                  fieldId: msStoreCoreFieldIds.title,
                  key: 'title' as const,
                  label: t('msStore.form.titleLabel'),
                },
                {
                  error: undefined,
                  fieldId: msStoreCoreFieldIds.subtitle,
                  key: 'subtitle' as const,
                  label: t('msStore.form.subtitleLabel'),
                },
                {
                  error: fieldErrors.shortDescription,
                  fieldId: msStoreCoreFieldIds.shortDescription,
                  key: 'shortDescription' as const,
                  label: t('msStore.form.shortDescriptionLabel'),
                },
                {
                  error: fieldErrors.description,
                  fieldId: msStoreCoreFieldIds.description,
                  key: 'description' as const,
                  label: t('msStore.form.descriptionLabel'),
                },
              ].map((coreField) => {
                const fieldDefinition = msStoreFieldRegistry.find((candidate) => candidate.id === coreField.fieldId);

                if (!fieldDefinition) {
                  return null;
                }

                return (
                  <div className="grid gap-3 rounded-xl border border-border/70 bg-background p-4" key={coreField.fieldId}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{coreField.label}</h3>
                      <Badge variant="outline">{fieldDefinition.field}</Badge>
                      <Badge variant="outline">ID {fieldDefinition.id}</Badge>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <ValueEditor
                        fieldDefinition={fieldDefinition}
                        label={`${coreField.label} (${t('msStore.defaultColumnLabel')})`}
                        onChange={(value) => onDefaultFieldChange(coreField.fieldId, value)}
                        value={defaultValues[coreField.fieldId] ?? ''}
                      />
                      <ValueEditor
                        fieldDefinition={fieldDefinition}
                        label={coreField.label}
                        onChange={(value) => onDraftFieldChange(coreField.key, value)}
                        value={draft?.[coreField.key] ?? ''}
                      />
                    </div>
                    {coreField.error ? <span className="text-sm text-destructive">{t(coreField.error)}</span> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">{t('msStore.form.keywordsLabel')}</span>
            <Input
              aria-label={t('msStore.form.keywordsLabel')}
              aria-invalid={fieldErrors.keywords ? 'true' : 'false'}
              onChange={(event) => onDraftFieldChange('keywordsText', event.target.value)}
              placeholder={t('msStore.form.keywordsPlaceholder')}
              value={draft?.keywordsText ?? ''}
            />
            <p className="text-xs text-muted-foreground">{t('msStore.form.keywordsHint')}</p>
            {fieldErrors.keywords ? <span className="text-sm text-destructive">{t(fieldErrors.keywords)}</span> : null}
          </label>

          <div className="rounded-2xl border border-border/70 bg-[color:var(--surface-panel-muted)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('msStore.inventory.title')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('msStore.inventory.description', { locale: currentLocaleLabel })}</p>
              </div>
              <Badge variant="secondary">{t('msStore.inventory.countLabel', { count: inventoryFields.length })}</Badge>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">{t('msStore.inventory.searchLabel')}</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    onChange={(event) => setFieldQuery(event.target.value)}
                    placeholder={t('msStore.inventory.searchPlaceholder')}
                    value={fieldQuery}
                  />
                </div>
              </label>

              <div className="grid gap-3">
                {inventoryFields.length > 0 && selectedInventoryField ? (
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <div className="max-h-[26rem] overflow-auto rounded-xl border border-border/70 bg-background p-2">
                      <div className="grid gap-1">
                        {inventoryFields.map((fieldDefinition) => {
                          const isSelected = fieldDefinition.id === selectedInventoryField.id;

                          return (
                            <button
                              className={cn(
                                'grid gap-1 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/55',
                                isSelected && 'bg-primary/10',
                              )}
                              key={fieldDefinition.id}
                              onClick={() => setSelectedInventoryFieldId(fieldDefinition.id)}
                              type="button"
                            >
                              <span className="text-sm font-medium text-foreground">{fieldDefinition.field}</span>
                              <span className="text-xs text-muted-foreground">ID {fieldDefinition.id} · {fieldDefinition.type}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-xl border border-border/70 bg-background p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{selectedInventoryField.field}</h3>
                        <Badge variant="outline">ID {selectedInventoryField.id}</Badge>
                        <Badge variant="outline">{selectedInventoryField.type}</Badge>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <ValueEditor
                          fieldDefinition={selectedInventoryField}
                          label={`${selectedInventoryField.field} (${t('msStore.defaultColumnLabel')})`}
                          onChange={(value) => onDefaultFieldChange(selectedInventoryField.id, value)}
                          value={defaultValues[selectedInventoryField.id] ?? ''}
                        />
                        <ValueEditor
                          fieldDefinition={selectedInventoryField}
                          label={`${selectedInventoryField.field} (${currentLocaleLabel})`}
                          onChange={(value) => onDraftInventoryFieldChange(selectedInventoryField.id, value)}
                          value={draft?.fieldValues[selectedInventoryField.id] ?? ''}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                    {t('msStore.inventory.empty')}
                  </div>
                )}
              </div>
            </div>
          </div>

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
  );
}
