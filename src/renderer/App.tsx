import { useDeferredValue, useEffect, useState } from 'react';
import { Boxes, FileStack, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/navigation/AppHeader';
import { PrimarySidebar } from '@/components/navigation/PrimarySidebar';
import { ProductProfilePage } from '@/components/products/ProductProfilePage';
import { ProductsPage } from '@/components/products/ProductsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import {
  changeAppLanguage,
  getLanguageShortLabel,
  languageStorageKey,
  resolveSupportedLanguage,
} from '@/locales';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveSection, toggleSidebarCollapsed } from '@/store/slices/navigationSlice';
import {
  createProduct,
  resetDraft,
  saveDraft,
  selectProduct,
  updateDraftField,
  toggleDraftMarket,
} from '@/store/slices/productManagementSlice';
import {
  applyThemePreference,
  initializeTheme,
  persistThemePreference,
  resolveInitialThemePreference,
  setTheme,
} from '@/store/slices/themeSlice';

export default function App() {
  const dispatch = useAppDispatch();
  const { i18n, t } = useTranslation();
  const activeSection = useAppSelector((state) => state.navigation.activeSection);
  const sidebarCollapsed = useAppSelector((state) => state.navigation.sidebarCollapsed);
  const currentTheme = useAppSelector((state) => state.theme.currentTheme);
  const products = useAppSelector((state) => state.productManagement.products);
  const selectedProductId = useAppSelector((state) => state.productManagement.selectedProductId);
  const draft = useAppSelector((state) => state.productManagement.draft);
  const fieldErrors = useAppSelector((state) => state.productManagement.fieldErrors);
  const supportedMarkets = useAppSelector((state) => state.productManagement.supportedMarkets);
  const currentLanguage = resolveSupportedLanguage(i18n.language);
  const [searchValue, setSearchValue] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    dispatch(initializeTheme(resolveInitialThemePreference(window.localStorage)));
  }, [dispatch]);

  useEffect(() => {
    applyThemePreference(currentTheme, document.documentElement);
    persistThemePreference(currentTheme, window.localStorage);
  }, [currentTheme]);

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const filteredProducts = products.filter((product) => {
    const keyword = deferredSearchValue.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return [product.name, product.folderName, product.description, product.relatedMarkets.join(' ')]
      .some((field) => field.toLowerCase().includes(keyword));
  });

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const currentProduct = selectedProduct
    ? {
        ...selectedProduct,
        ...draft,
        relatedMarkets: [...draft.relatedMarkets],
      }
    : null;

  const navigationItems = [
    { id: 'products' as const, icon: Boxes, label: t('navigation.products') },
    { id: 'product-profile' as const, icon: FileStack, label: t('navigation.productProfile') },
    { id: 'settings' as const, icon: Settings2, label: t('navigation.settings') },
  ];

  const handleToggleLanguage = () => {
    const nextLanguage = currentLanguage === 'zh-CN' ? 'en-US' : 'zh-CN';

    window.localStorage.setItem(languageStorageKey, nextLanguage);
    document.documentElement.lang = nextLanguage;
    void changeAppLanguage(nextLanguage);
  };

  const handleAddProduct = () => {
    setSearchValue('');
    dispatch(createProduct());
    dispatch(setActiveSection('products'));
  };

  let content = (
    <ProductsPage
      currentProduct={currentProduct}
      draft={draft}
      fieldErrors={fieldErrors}
      onAddProduct={handleAddProduct}
      onDraftFieldChange={(field, value) => dispatch(updateDraftField({ field, value }))}
      onResetDraft={() => dispatch(resetDraft())}
      onSaveDraft={() => dispatch(saveDraft())}
      onSelectProduct={(productId) => dispatch(selectProduct(productId))}
      onToggleMarket={(market) => dispatch(toggleDraftMarket(market))}
      products={filteredProducts}
      selectedProductId={selectedProductId}
      supportedMarkets={supportedMarkets}
    />
  );

  if (activeSection === 'product-profile') {
    content = (
      <ProductProfilePage
        currentProduct={currentProduct}
        onContinueBrowsing={() => dispatch(setActiveSection('settings'))}
        onOpenProducts={() => dispatch(setActiveSection('products'))}
      />
    );
  }

  if (activeSection === 'settings') {
    content = <SettingsPage onThemeChange={(theme) => dispatch(setTheme(theme))} theme={currentTheme} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        currentLanguageLabel={getLanguageShortLabel(currentLanguage)}
        onAddProduct={handleAddProduct}
        onSearchChange={setSearchValue}
        onToggleLanguage={handleToggleLanguage}
        searchValue={searchValue}
      />

      <div className="grid min-h-[calc(100vh-5.5rem)] grid-cols-[auto_minmax(0,1fr)]">
        <PrimarySidebar
          activeSection={activeSection}
          collapsed={sidebarCollapsed}
          currentProduct={currentProduct}
          navigationItems={navigationItems}
          onSectionChange={(section) => dispatch(setActiveSection(section))}
          onToggleCollapsed={() => dispatch(toggleSidebarCollapsed())}
          productCount={products.length}
        />

        <main className="min-h-0 overflow-auto bg-[radial-gradient(circle_at_top_right,rgba(89,130,255,0.08),transparent_24%),linear-gradient(180deg,transparent_0%,rgba(15,23,42,0.04)_100%)] p-4 lg:p-6">
          <div className="mx-auto flex min-h-full w-full max-w-[112rem] flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t('shell.activeSectionLabel')}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {navigationItems.find((item) => item.id === activeSection)?.label}
              </h2>
            </div>

            <div className="min-h-0 flex-1">{content}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
