import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card';
import { Input } from '@/components/input';
import { cn } from '@/lib/utils';
import type { ProductDraft, ProductFieldErrors, ProductRecord, SupportedMarket } from '@/store/slices/productManagementSlice';

interface ProductsPageProps {
  currentProduct: ProductRecord | null;
  draft: ProductDraft;
  fieldErrors: ProductFieldErrors;
  loadError: string | null;
  loadStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  onAddProduct: () => void;
  onDraftFieldChange: (field: keyof Pick<ProductDraft, 'name' | 'description' | 'folderName'>, value: string) => void;
  onResetDraft: () => void;
  onSaveDraft: () => void;
  onSelectProduct: (productId: string) => void;
  onToggleMarket: (market: SupportedMarket) => void;
  products: ProductRecord[];
  selectedProductId: string;
  supportedMarkets: readonly SupportedMarket[];
}

function isProductReady(product: ProductDraft): boolean {
  return product.name.trim().length > 0 && product.folderName.trim().length > 0 && product.relatedMarkets.length > 0;
}

export function ProductsPage({
  currentProduct,
  draft,
  fieldErrors,
  loadError,
  loadStatus,
  onAddProduct,
  onDraftFieldChange,
  onResetDraft,
  onSaveDraft,
  onSelectProduct,
  onToggleMarket,
  products,
  selectedProductId,
  supportedMarkets,
}: ProductsPageProps) {
  const { t } = useTranslation();
  const currentSummary = currentProduct ?? {
    id: 'empty',
    name: '',
    description: '',
    folderName: '',
    relatedMarkets: [],
    updatedAt: '-',
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, productId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onSelectProduct(productId);
  };

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)]">
      <Card className="min-h-0 overflow-hidden">
        <CardHeader className="border-b border-border/80 pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>{t('products.registryTitle')}</CardTitle>
              <CardDescription>{t('products.registryDescription')}</CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {loadStatus === 'loading' ? <Badge variant="secondary">{t('products.loading')}</Badge> : null}
              {loadStatus === 'failed' ? <Badge variant="secondary">{t('products.loadFailed')}</Badge> : null}
              <Badge variant="secondary">{t('products.countLabel', { count: products.length })}</Badge>
              <Button onClick={onAddProduct} size="sm" type="button">
                {t('products.addProduct')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 overflow-auto p-0">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-[color:var(--surface-panel-muted)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('products.table.name')}</th>
                <th className="px-4 py-3">{t('products.table.folder')}</th>
                <th className="px-4 py-3">{t('products.table.markets')}</th>
                <th className="px-4 py-3 text-right">{t('products.table.updated')}</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map((product) => {
                const isSelected = product.id === selectedProductId;

                return (
                  <tr
                    aria-selected={isSelected}
                    className={cn(
                      'cursor-pointer border-t border-border/70 outline-none transition-colors',
                      'focus-visible:bg-accent/70 hover:bg-accent/55',
                      isSelected && 'bg-primary/10',
                    )}
                    key={product.id}
                    onClick={() => onSelectProduct(product.id)}
                    onKeyDown={(event) => handleRowKeyDown(event, product.id)}
                    tabIndex={0}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{product.name || t('products.untitledProduct')}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                      {product.folderName || t('sidebar.folderFallback')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.relatedMarkets.length > 0 ? product.relatedMarkets.join(', ') : t('products.noMarketsSelected')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-muted-foreground">{product.updatedAt}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td className="px-4 py-10 text-center text-muted-foreground" colSpan={4}>
                    {loadStatus === 'loading'
                      ? t('products.loading')
                      : loadStatus === 'failed'
                        ? t('products.loadFailed')
                        : t('products.noProducts')}
                    {loadStatus === 'failed' && loadError ? <p className="mt-2 text-xs">{loadError}</p> : null}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="border-b border-border/80 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{t('products.summaryTitle')}</CardTitle>
                <CardDescription>{t('products.summaryDescription')}</CardDescription>
              </div>
              <Badge variant={isProductReady(draft) ? 'default' : 'secondary'}>
                {isProductReady(draft) ? t('products.summaryReady') : t('products.summaryNeedsAttention')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('products.table.name')}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{draft.name || t('products.untitledProduct')}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('products.table.folder')}
              </p>
              <p className="mt-1 font-mono text-[13px] text-foreground">{draft.folderName || t('sidebar.folderFallback')}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('products.table.markets')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(draft.relatedMarkets.length > 0 ? draft.relatedMarkets : [t('products.noMarketsSelected')]).map((market) => (
                  <Badge className="bg-background" key={market} variant="secondary">
                    {market}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('products.table.updated')}
              </p>
              <p className="mt-1 font-mono text-[13px] text-foreground">{currentSummary.updatedAt}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/80 pb-3">
            <CardTitle>{t('products.formTitle')}</CardTitle>
            <CardDescription>{t('products.formDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">{t('products.form.nameLabel')}</span>
              <Input
                aria-label={t('products.form.nameLabel')}
                aria-invalid={fieldErrors.name ? 'true' : 'false'}
                onChange={(event) => onDraftFieldChange('name', event.target.value)}
                placeholder={t('products.form.namePlaceholder')}
                value={draft.name}
              />
              {fieldErrors.name ? <span className="text-sm text-destructive">{t(fieldErrors.name)}</span> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">{t('products.form.descriptionLabel')}</span>
              <textarea
                aria-label={t('products.form.descriptionLabel')}
                className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15"
                onChange={(event) => onDraftFieldChange('description', event.target.value)}
                placeholder={t('products.form.descriptionPlaceholder')}
                value={draft.description}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">{t('products.form.folderLabel')}</span>
              <Input
                aria-label={t('products.form.folderLabel')}
                aria-invalid={fieldErrors.folderName ? 'true' : 'false'}
                className="font-mono"
                onChange={(event) => onDraftFieldChange('folderName', event.target.value)}
                placeholder={t('products.form.folderPlaceholder')}
                value={draft.folderName}
              />
              <p className="text-xs text-muted-foreground">{t('products.form.folderHint')}</p>
              {fieldErrors.folderName ? <span className="text-sm text-destructive">{t(fieldErrors.folderName)}</span> : null}
            </label>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium text-foreground">{t('products.form.marketsLabel')}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {supportedMarkets.map((market) => {
                  const checked = draft.relatedMarkets.includes(market);

                  return (
                    <label
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors',
                        checked ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border bg-background text-muted-foreground',
                      )}
                      key={market}
                    >
                      <input aria-label={market} checked={checked} onChange={() => onToggleMarket(market)} type="checkbox" />
                      <span>{market}</span>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.relatedMarkets ? <span className="text-sm text-destructive">{t(fieldErrors.relatedMarkets)}</span> : null}
            </fieldset>

            <div className="flex justify-end gap-3">
              <Button onClick={onResetDraft} type="button" variant="outline">
                {t('button.cancel')}
              </Button>
              <Button onClick={onSaveDraft} type="button">
                {t('products.saveProduct')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
