import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight, Package2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { cn } from '@/lib/utils';
import type { NavigationSection } from '@/store/slices/navigationSlice';
import type { SupportedMarket } from '@/store/slices/productManagementSlice';

interface SidebarProductSummary {
  folderName: string;
  name: string;
  relatedMarkets: SupportedMarket[];
}

interface NavigationItem {
  id: NavigationSection;
  icon: LucideIcon;
  label: string;
}

interface PrimarySidebarProps {
  activeSection: NavigationSection;
  collapsed: boolean;
  currentProduct: SidebarProductSummary | null;
  navigationItems: NavigationItem[];
  onSectionChange: (section: NavigationSection) => void;
  onToggleCollapsed: () => void;
  productCount: number;
}

export function PrimarySidebar({
  activeSection,
  collapsed,
  currentProduct,
  navigationItems,
  onSectionChange,
  onToggleCollapsed,
  productCount,
}: PrimarySidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'flex min-h-0 flex-col border-r border-border bg-[color:var(--surface-sidebar)] px-3 py-4 transition-[width] duration-200 ease-out',
        collapsed ? 'w-[5.25rem]' : 'w-[18rem]',
      )}
      data-collapsed={collapsed}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className={cn('min-w-0', collapsed && 'sr-only')}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('app.name')}
          </p>
          <p className="mt-1 text-sm text-foreground">{t('sidebar.productCount', { count: productCount })}</p>
        </div>

        <Button
          aria-label={collapsed ? t('sidebar.expandLabel') : t('sidebar.collapseLabel')}
          onClick={onToggleCollapsed}
          size="icon"
          type="button"
          variant="ghost"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <nav aria-label={t('sidebar.navigationLabel')} className="mt-6 flex flex-col gap-1">
        {navigationItems.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center gap-3 rounded-lg border px-3 text-left text-sm font-medium transition-colors outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'border-primary/40 bg-primary/12 text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:bg-background/70 hover:text-foreground',
                collapsed && 'justify-center px-0',
              )}
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              type="button"
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <div className={cn('rounded-xl border border-border bg-card p-3', collapsed && 'px-2 py-3')}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Package2 className="size-4" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t('sidebar.currentProductLabel')}
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {currentProduct?.name || t('sidebar.noProduct')}
                </p>
              </div>
            ) : null}
          </div>

          {!collapsed ? (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t('sidebar.folderLabel')}
                </p>
                <p className="mt-1 font-mono text-[13px] text-foreground">
                  {currentProduct?.folderName || t('sidebar.folderFallback')}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t('sidebar.marketsLabel')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(currentProduct?.relatedMarkets.length ? currentProduct.relatedMarkets : [t('products.noMarketsSelected')]).map((market) => (
                    <Badge className="bg-background" key={market} variant="secondary">
                      {market}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
