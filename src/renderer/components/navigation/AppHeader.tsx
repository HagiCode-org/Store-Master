import { Languages, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button';
import { Input } from '@/components/input';

interface AppHeaderProps {
  currentLanguageLabel: string;
  onAddProduct: () => void;
  onSearchChange: (value: string) => void;
  onToggleLanguage: () => void;
  searchValue: string;
}

export function AppHeader({ currentLanguageLabel, onAddProduct, onSearchChange, onToggleLanguage, searchValue }: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/80 bg-[color:var(--surface-toolbar)]/92 backdrop-blur-sm">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('shell.workspaceLabel')}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">{t('shell.title')}</h1>
            <p className="max-w-3xl text-[13px] text-muted-foreground">{t('shell.subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="relative block min-w-[16rem] md:w-[18rem]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t('shell.searchPlaceholder')}
              className="h-8 pl-9"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t('shell.searchPlaceholder')}
              value={searchValue}
            />
          </label>

          <Button aria-label={t('language.switch')} onClick={onToggleLanguage} size="sm" type="button" variant="outline">
            <Languages className="size-4" />
            {currentLanguageLabel}
          </Button>

          <Button onClick={onAddProduct} size="sm" type="button">
            <Plus className="size-4" />
            {t('products.addProduct')}
          </Button>
        </div>
      </div>
    </header>
  );
}
