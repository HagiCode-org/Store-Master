import { ArrowLeft, Compass, FileStack } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card';
import type { ProductRecord } from '@/store/slices/productManagementSlice';

interface ProductProfilePageProps {
  currentProduct: ProductRecord | null;
  onContinueBrowsing: () => void;
  onOpenProducts: () => void;
}

export function ProductProfilePage({ currentProduct, onContinueBrowsing, onOpenProducts }: ProductProfilePageProps) {
  const { t } = useTranslation();

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader className="border-b border-border/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <FileStack className="size-5" />
          </div>
          <div>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 pt-6">
        <div className="rounded-xl border border-dashed border-border bg-[color:var(--surface-panel-muted)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('profile.currentProductLabel')}
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {currentProduct?.name || t('products.untitledProduct')}
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('profile.emptyBody')}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onOpenProducts} type="button">
            <ArrowLeft className="size-4" />
            {t('profile.backToProducts')}
          </Button>
          <Button onClick={onContinueBrowsing} type="button" variant="outline">
            <Compass className="size-4" />
            {t('profile.continueBrowsing')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
