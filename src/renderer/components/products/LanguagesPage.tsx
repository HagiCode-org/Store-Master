import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  Languages,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card';
import { SearchableSelect } from '@/components/searchable-select';
import {
  buildLocaleGroups,
  normalizeLocaleKey,
  sortLocaleValues,
  type LocaleGroupStatus,
} from '@/lib/msStoreLanguages';
import {
  getMsStoreLanguageLabel,
  supportedMsStoreLanguages,
  type MsStoreDataEntry,
} from '../../../shared/ms-store-data';
import type { MsStoreDataDraft } from '@/store/slices/msStoreDataSlice';
import type { ProductRecord } from '@/store/slices/productManagementSlice';

interface LanguagesPageProps {
  currentProduct: ProductRecord | null;
  draft: MsStoreDataDraft | null;
  entries: MsStoreDataEntry[];
  loadError: string | null;
  loadStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  onCreateLanguage: (locale: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entryId: string) => void;
  onOpenProducts: () => void;
  onSelectProduct: (productId: string) => void;
  products: ProductRecord[];
  selectedProductId: string;
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

  return (
    <Badge className="border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" variant="outline">
      <AlertCircle className="size-3" />
      {t('msStore.languageStatusNeedsReview')}
    </Badge>
  );
}

export function LanguagesPage({
  currentProduct,
  draft,
  entries,
  loadError,
  loadStatus,
  onCreateLanguage,
  onDeleteEntry,
  onEditEntry,
  onOpenProducts,
  onSelectProduct,
  products,
  selectedProductId,
}: LanguagesPageProps) {
  const { t } = useTranslation();
  const [newLocale, setNewLocale] = useState<string | null>(null);

  const productOptions = useMemo(() => products.map((product) => ({
    value: product.id,
    label: product.name || t('products.untitledProduct'),
    description: product.folderName || t('sidebar.folderFallback'),
  })), [products, t]);

  const localeGroups = useMemo(() => buildLocaleGroups(entries, t('msStore.untitledEntry')), [entries, t]);
  const persistedEntryIds = useMemo(() => new Set(entries.map((entry) => entry.id)), [entries]);
  const unsavedDraftLocale = draft && !persistedEntryIds.has(draft.id) ? draft.locale.trim() : '';
  const availableLocaleOptions = useMemo(() => {
    const usedLocaleKeys = new Set(localeGroups.map((group) => normalizeLocaleKey(group.locale)));

    if (unsavedDraftLocale) {
      usedLocaleKeys.add(normalizeLocaleKey(unsavedDraftLocale));
    }

    return sortLocaleValues(
      supportedMsStoreLanguages.filter((locale) => !usedLocaleKeys.has(normalizeLocaleKey(locale))),
    ).map((locale) => ({
      value: locale,
      label: getMsStoreLanguageLabel(locale),
    }));
  }, [localeGroups, unsavedDraftLocale]);

  const selectedNewLocale = newLocale && availableLocaleOptions.some((option) => option.value === newLocale)
    ? newLocale
    : availableLocaleOptions[0]?.value ?? null;

  const statusBadge = loadStatus === 'loading'
    ? t('msStore.loading')
    : loadStatus === 'failed'
      ? t('msStore.loadFailed')
      : null;

  if (!currentProduct || products.length === 0) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader className="border-b border-border/80 pb-3">
          <CardTitle>{t('msStore.languagesPage.emptyTitle')}</CardTitle>
          <CardDescription>{t('msStore.languagesPage.emptyDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-6">
          <div className="rounded-xl border border-dashed border-border bg-[color:var(--surface-panel-muted)] p-5 text-sm text-muted-foreground">
            {t('msStore.languagesPage.emptyBody')}
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
    <div className="grid min-h-0 gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/80 pb-3">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-3">
              <div>
                <CardTitle>{t('msStore.languagesPage.title')}</CardTitle>
                <CardDescription>{t('msStore.languagesPage.description')}</CardDescription>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)_auto] md:items-end">
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
                <div className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t('msStore.languagesPage.addLabel')}
                  </span>
                  <SearchableSelect
                    emptyMessage={t('msStore.languagesPage.noAvailableLocales')}
                    onChange={(value) => setNewLocale(value)}
                    options={availableLocaleOptions}
                    placeholder={t('msStore.languagesPage.addPlaceholder')}
                    searchPlaceholder={t('msStore.languagesPage.addSearch')}
                    value={selectedNewLocale}
                  />
                </div>
                <Button
                  disabled={!selectedNewLocale}
                  onClick={() => {
                    if (!selectedNewLocale) {
                      return;
                    }

                    onCreateLanguage(selectedNewLocale);
                    setNewLocale(null);
                  }}
                  type="button"
                >
                  <Plus className="size-4" />
                  {t('msStore.addEntry')}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {statusBadge ? <Badge variant="secondary">{statusBadge}</Badge> : null}
              <Badge variant="secondary">{t('msStore.localeCountLabel', { count: localeGroups.length })}</Badge>
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
              <p className="mt-1 text-base font-semibold text-foreground">{currentProduct.name || t('products.untitledProduct')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('msStore.languagesPage.contextDescription')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentProduct.relatedMarkets.map((market) => (
                <Badge key={market} variant="secondary">{market}</Badge>
              ))}
            </div>
          </div>

          {loadError ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{loadError}</div> : null}

          {unsavedDraftLocale ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
              <div className="flex items-start gap-3">
                <FileWarning className="mt-0.5 size-4 text-amber-700 dark:text-amber-300" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('msStore.languagesPage.unsavedDraftTitle')}</p>
                  <p className="text-sm text-muted-foreground">{t('msStore.languagesPage.unsavedDraftBody', { locale: getMsStoreLanguageLabel(unsavedDraftLocale) })}</p>
                </div>
              </div>
              <Button onClick={() => onCreateLanguage(unsavedDraftLocale)} type="button" variant="outline">
                <ArrowRight className="size-4" />
                {t('msStore.languagesPage.continueDraft')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="min-h-0 overflow-hidden">
        <CardHeader className="border-b border-border/80 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{t('msStore.languagePanelTitle')}</CardTitle>
              <CardDescription>{t('msStore.languagesPage.listDescription')}</CardDescription>
            </div>
            <Languages className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4">
          {localeGroups.length > 0 ? localeGroups.map((group) => {
            const entry = group.entries[0];

            return (
              <div
                className="grid gap-3 rounded-xl border border-border/70 bg-background px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                key={group.key}
              >
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{getMsStoreLanguageLabel(group.locale)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{group.previewTitle}</p>
                    </div>
                    <StatusBadge status={group.status} t={t} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{group.locale}</Badge>
                    <span>{t('msStore.table.updated')}: {group.latestUpdatedAt}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => entry && onEditEntry(entry.id)} type="button" variant="outline">
                    <ArrowRight className="size-4" />
                    {t('msStore.languagesPage.editAction')}
                  </Button>
                  <Button
                    onClick={() => entry && onDeleteEntry(entry.id)}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="size-4" />
                    {t('msStore.deleteAction')}
                  </Button>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-sm text-muted-foreground">
              {t('msStore.noEntries')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
