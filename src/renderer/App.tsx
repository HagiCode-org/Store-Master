import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Boxes, FileStack, Languages, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppHeader } from '@/components/navigation/AppHeader';
import { PrimarySidebar } from '@/components/navigation/PrimarySidebar';
import { LanguagesPage } from '@/components/products/LanguagesPage';
import { ProductProfilePage } from '@/components/products/ProductProfilePage';
import { ProductsPage } from '@/components/products/ProductsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { cn } from '@/lib/utils';
import { normalizeSupportedMsStoreLanguage } from '../shared/ms-store-data';
import { cloneProductRelatedMarkets, getEnabledProductMarkets } from '../shared/products';
import {
  changeAppLanguage,
  getLanguageShortLabel,
  languageStorageKey,
  resolveSupportedLanguage,
} from '@/locales';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveSection, toggleSidebarCollapsed } from '@/store/slices/navigationSlice';
import {
  clearMsStoreMessages,
  deleteSelectedMsStoreEntry,
  exportMsStoreData,
  importMsStoreData,
  resetMsStoreDraft,
  saveMsStoreDraft,
  selectMsStoreEntry,
  startNewMsStoreEntry,
  updateMsStoreDraftField,
  updateMsStoreDraftInventoryField,
} from '@/store/slices/msStoreDataSlice';
import {
  updateDraftMarketDefaultLanguage,
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
  const loadError = useAppSelector((state) => state.productManagement.loadError);
  const loadStatus = useAppSelector((state) => state.productManagement.loadStatus);
  const supportedMarkets = useAppSelector((state) => state.productManagement.supportedMarkets);
  const msStoreDraft = useAppSelector((state) => state.msStoreData.draft);
  const msStoreEntries = useAppSelector((state) => state.msStoreData.entries);
  const msStoreFieldErrors = useAppSelector((state) => state.msStoreData.fieldErrors);
  const msStoreLoadStatus = useAppSelector((state) => state.msStoreData.loadStatus);
  const msStoreLoadError = useAppSelector((state) => state.msStoreData.loadError);
  const msStoreImportStatus = useAppSelector((state) => state.msStoreData.importStatus);
  const msStoreImportError = useAppSelector((state) => state.msStoreData.importError);
  const msStoreImportErrors = useAppSelector((state) => state.msStoreData.importErrors);
  const msStoreExportStatus = useAppSelector((state) => state.msStoreData.exportStatus);
  const msStoreExportError = useAppSelector((state) => state.msStoreData.exportError);
  const msStoreExportPath = useAppSelector((state) => state.msStoreData.exportPath);
  const msStoreSaveFeedback = useAppSelector((state) => state.msStoreData.saveFeedback);
  const currentLanguage = resolveSupportedLanguage(i18n.language);
  const [searchValue, setSearchValue] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);
  const handledMsStoreSaveFeedbackRef = useRef(0);

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

  useEffect(() => {
    if (msStoreSaveFeedback.nonce === 0 || msStoreSaveFeedback.nonce === handledMsStoreSaveFeedbackRef.current) {
      return;
    }

    handledMsStoreSaveFeedbackRef.current = msStoreSaveFeedback.nonce;

    if (msStoreSaveFeedback.status === 'succeeded') {
      toast.success(t('msStore.saveSuccess'), {
        description: t('msStore.saveSuccessDescription'),
      });
      return;
    }

    if (msStoreSaveFeedback.status === 'failed') {
      toast.error(t('msStore.saveFailed'), {
        description: t('msStore.saveFailedDescription'),
      });
    }
  }, [msStoreSaveFeedback, t]);

  const filteredProducts = products.filter((product) => {
    const keyword = deferredSearchValue.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return [
      product.name,
      product.folderName,
      product.description,
      getEnabledProductMarkets(product.relatedMarkets)
        .map((market) => `${market} ${product.relatedMarkets[market === 'Steam' ? 'steam' : 'msStore'].defaultLanguage}`)
        .join(' '),
    ]
      .some((field) => field.toLowerCase().includes(keyword));
  }, [deferredSearchValue, products]);

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const currentProduct = selectedProduct
    ? {
        ...selectedProduct,
        ...draft,
        relatedMarkets: cloneProductRelatedMarkets(draft.relatedMarkets),
      }
    : null;

  const navigationItems = [
    { id: 'products' as const, icon: Boxes, label: t('navigation.products') },
    { id: 'languages' as const, icon: Languages, label: t('navigation.languages') },
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
      loadError={loadError}
      loadStatus={loadStatus}
      onAddProduct={handleAddProduct}
      onDraftFieldChange={(field, value) => dispatch(updateDraftField({ field, value }))}
      onDraftMarketDefaultLanguageChange={(market, value) => {
        const normalizedLanguage = normalizeSupportedMsStoreLanguage(value);

        if (!normalizedLanguage) {
          return;
        }

        dispatch(updateDraftMarketDefaultLanguage({ market, value: normalizedLanguage }));
      }}
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
        draft={msStoreDraft}
        entries={msStoreEntries}
        exportError={msStoreExportError}
        exportPath={msStoreExportPath}
        exportStatus={msStoreExportStatus}
        fieldErrors={msStoreFieldErrors}
        importError={msStoreImportError}
        importErrors={msStoreImportErrors}
        importStatus={msStoreImportStatus}
        loadError={msStoreLoadError}
        loadStatus={msStoreLoadStatus}
        onClearMessages={() => dispatch(clearMsStoreMessages())}
        onDraftFieldChange={(field, value) => dispatch(updateMsStoreDraftField({ field, value }))}
        onDraftInventoryFieldChange={(fieldId, value) => dispatch(updateMsStoreDraftInventoryField({ fieldId, value }))}
        onExport={() => {
          if (!currentProduct) {
            return;
          }

          void dispatch(exportMsStoreData({
            productStorageId: currentProduct.productStorageId,
            defaultLocale: currentProduct.relatedMarkets.msStore.defaultLanguage,
            dataset: {
              productStorageId: currentProduct.productStorageId,
              version: 3,
              entries: msStoreEntries,
            },
          }));
        }}
        onImport={() => {
          if (!currentProduct) {
            return;
          }

          void dispatch(importMsStoreData({
            productStorageId: currentProduct.productStorageId,
            defaultLocale: currentProduct.relatedMarkets.msStore.defaultLanguage,
          }));
        }}
        onOpenProducts={() => dispatch(setActiveSection('products'))}
        onResetDraft={() => dispatch(resetMsStoreDraft())}
        onSaveDraft={() => dispatch(saveMsStoreDraft())}
        onSelectEntry={(entryId) => dispatch(selectMsStoreEntry(entryId))}
        onSelectProduct={(productId) => dispatch(selectProduct(productId))}
        products={products}
        selectedProductId={selectedProductId}
      />
    );
  }

  if (activeSection === 'languages') {
    content = (
      <LanguagesPage
        currentProduct={currentProduct}
        draft={msStoreDraft}
        entries={msStoreEntries}
        loadError={msStoreLoadError}
        loadStatus={msStoreLoadStatus}
        onCreateLanguage={(locale) => {
          const normalizedLocale = locale.trim();

          if (!normalizedLocale) {
            return;
          }

          if (msStoreDraft?.locale.trim() === normalizedLocale && (!msStoreDraft.id || !msStoreEntries.some((entry) => entry.id === msStoreDraft.id))) {
            dispatch(setActiveSection('product-profile'));
            return;
          }

          dispatch(startNewMsStoreEntry());
          dispatch(updateMsStoreDraftField({ field: 'locale', value: normalizedLocale }));
          dispatch(setActiveSection('product-profile'));
        }}
        onDeleteEntry={(entryId) => {
          dispatch(selectMsStoreEntry(entryId));
          dispatch(deleteSelectedMsStoreEntry());
        }}
        onEditEntry={(entryId) => {
          dispatch(selectMsStoreEntry(entryId));
          dispatch(setActiveSection('product-profile'));
        }}
        onOpenProducts={() => dispatch(setActiveSection('products'))}
        onSelectProduct={(productId) => dispatch(selectProduct(productId))}
        products={products}
        selectedProductId={selectedProductId}
      />
    );
  }

  if (activeSection === 'settings') {
    content = <SettingsPage onThemeChange={(theme) => dispatch(setTheme(theme))} theme={currentTheme} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <AppHeader
        currentLanguageLabel={getLanguageShortLabel(currentLanguage)}
        onAddProduct={handleAddProduct}
        onSearchChange={setSearchValue}
        onToggleLanguage={handleToggleLanguage}
        searchValue={searchValue}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)]">
        <PrimarySidebar
          activeSection={activeSection}
          collapsed={sidebarCollapsed}
          currentProduct={currentProduct}
          navigationItems={navigationItems}
          onSectionChange={(section) => dispatch(setActiveSection(section))}
          onToggleCollapsed={() => dispatch(toggleSidebarCollapsed())}
          productCount={products.length}
        />

        <main className="min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(89,130,255,0.08),transparent_24%),linear-gradient(180deg,transparent_0%,rgba(15,23,42,0.04)_100%)] p-4 lg:p-6">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[112rem] flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t('shell.activeSectionLabel')}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {navigationItems.find((item) => item.id === activeSection)?.label}
              </h2>
            </div>

            <div
              className={cn(
                'min-h-0 flex-1',
                activeSection === 'product-profile' ? 'overflow-hidden' : 'overflow-auto',
              )}
            >
              {content}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
