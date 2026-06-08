import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import i18n from '@/locales';
import { validateProductFolderName } from '@/lib/productFolderName';
import {
  cloneProductRelatedMarkets,
  createDefaultProductRelatedMarkets,
  getEnabledProductMarkets,
} from '../../../shared/products';
import { createTimestampLabel } from '../../../shared/ms-store-data';
import {
  generateProductStorageId,
  normalizeProductRecords,
  supportedMarkets,
  type ProductRelatedMarkets,
  type ProductRecord,
  type SupportedMarket,
  type SupportedMarketKey,
} from '../../../shared/products';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProductDraft {
  name: string;
  description: string;
  folderName: string;
  relatedMarkets: ProductRelatedMarkets;
}

export interface ProductFieldErrors {
  name?: string;
  folderName?: string;
  relatedMarkets?: string;
}

interface ProductManagementState {
  products: ProductRecord[];
  selectedProductId: string;
  draft: ProductDraft;
  fieldErrors: ProductFieldErrors;
  supportedMarkets: readonly SupportedMarket[];
  loadStatus: LoadStatus;
  loadError: string | null;
}

function createEmptyDraft(): ProductDraft {
  return {
    name: '',
    description: '',
    folderName: '',
    relatedMarkets: createDefaultProductRelatedMarkets(),
  };
}

function createDraft(product: ProductRecord): ProductDraft {
  return {
    name: product.name,
    description: product.description,
    folderName: product.folderName,
    relatedMarkets: cloneProductRelatedMarkets(product.relatedMarkets),
  };
}

function nextProductId(products: ProductRecord[]): string {
  const highestId = products.reduce((maxId, product) => {
    const numericId = Number.parseInt(product.id.replace('product-', ''), 10);
    return Number.isNaN(numericId) ? maxId : Math.max(maxId, numericId);
  }, 0);

  return `product-${highestId + 1}`;
}

export function validateProductDraft(draft: ProductDraft): ProductFieldErrors {
  const errors: ProductFieldErrors = {};

  if (draft.name.trim().length === 0) {
    errors.name = 'validation.productNameRequired';
  }

  const folderNameError = validateProductFolderName(draft.folderName.trim());

  if (folderNameError) {
    errors.folderName = folderNameError;
  }

  if (getEnabledProductMarkets(draft.relatedMarkets).length === 0) {
    errors.relatedMarkets = 'validation.relatedMarketsRequired';
  }

  return errors;
}

export const loadProducts = createAsyncThunk<ProductRecord[], void, { rejectValue: string }>(
  'productManagement/loadProducts',
  async (_, { rejectWithValue }) => {
    try {
      return await window.storeMaster.readProducts();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : i18n.t('products.loadFailed'),
      );
    }
  },
);

const initialState: ProductManagementState = {
  products: [],
  selectedProductId: '',
  draft: createEmptyDraft(),
  fieldErrors: {},
  supportedMarkets,
  loadStatus: 'idle',
  loadError: null,
};

const productManagementSlice = createSlice({
  name: 'productManagement',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<string>) {
      const selectedProduct = state.products.find((product) => product.id === action.payload);

      if (!selectedProduct) {
        return;
      }

      state.selectedProductId = selectedProduct.id;
      state.draft = createDraft(selectedProduct);
      state.fieldErrors = {};
    },
    createProduct(state) {
      const product: ProductRecord = {
        id: nextProductId(state.products),
        productStorageId: generateProductStorageId(),
        name: '',
        description: '',
        folderName: '',
        relatedMarkets: createDefaultProductRelatedMarkets(),
        updatedAt: 'Draft',
      };

      state.products = [product, ...state.products];
      state.selectedProductId = product.id;
      state.draft = createDraft(product);
      state.fieldErrors = {};
    },
    updateDraftField(state, action: PayloadAction<{ field: keyof Pick<ProductDraft, 'name' | 'description' | 'folderName'>; value: string }>) {
      state.draft[action.payload.field] = action.payload.value;

      if (action.payload.field === 'name') {
        delete state.fieldErrors.name;
      }

      if (action.payload.field === 'folderName') {
        delete state.fieldErrors.folderName;
      }
    },
    toggleDraftMarket(state, action: PayloadAction<SupportedMarketKey>) {
      const market = action.payload;

      state.draft.relatedMarkets[market].enabled = !state.draft.relatedMarkets[market].enabled;
      state.draft.relatedMarkets = cloneProductRelatedMarkets(state.draft.relatedMarkets);

      delete state.fieldErrors.relatedMarkets;
    },
    updateDraftMarketDefaultLanguage(
      state,
      action: PayloadAction<{ market: SupportedMarketKey; value: ProductRelatedMarkets[SupportedMarketKey]['defaultLanguage'] }>,
    ) {
      state.draft.relatedMarkets[action.payload.market].defaultLanguage = action.payload.value;
      state.draft.relatedMarkets = cloneProductRelatedMarkets(state.draft.relatedMarkets);
      delete state.fieldErrors.relatedMarkets;
    },
    resetDraft(state) {
      const selectedProduct = state.products.find((product) => product.id === state.selectedProductId);

      if (!selectedProduct) {
        state.draft = createEmptyDraft();
        state.fieldErrors = {};
        return;
      }

      state.draft = createDraft(selectedProduct);
      state.fieldErrors = {};
    },
    saveDraft(state) {
      const normalizedDraft: ProductDraft = {
        name: state.draft.name.trim(),
        description: state.draft.description.trim(),
        folderName: state.draft.folderName.trim(),
        relatedMarkets: cloneProductRelatedMarkets(state.draft.relatedMarkets),
      };

      const errors = validateProductDraft(normalizedDraft);

      state.fieldErrors = errors;

      if (Object.keys(errors).length > 0) {
        return;
      }

      state.products = state.products.map((product) => (
        product.id === state.selectedProductId
          ? {
              ...product,
              ...normalizedDraft,
              updatedAt: createTimestampLabel(),
            }
          : product
      ));
      state.draft = normalizedDraft;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProducts.pending, (state) => {
        state.loadStatus = 'loading';
        state.loadError = null;
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.products = normalizeProductRecords(action.payload) ?? [];
        state.loadStatus = 'succeeded';
        state.loadError = null;
        state.fieldErrors = {};

        const firstProduct = state.products[0];
        if (!firstProduct) {
          state.selectedProductId = '';
          state.draft = createEmptyDraft();
          return;
        }

        state.selectedProductId = firstProduct.id;
        state.draft = createDraft(firstProduct);
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.products = [];
        state.selectedProductId = '';
        state.draft = createEmptyDraft();
        state.loadStatus = 'failed';
        state.loadError = action.payload ?? i18n.t('products.loadFailed');
      });
  },
});

export const {
  selectProduct,
  createProduct,
  updateDraftField,
  toggleDraftMarket,
  updateDraftMarketDefaultLanguage,
  resetDraft,
  saveDraft,
} = productManagementSlice.actions;

export type { ProductRecord, ProductRelatedMarkets, SupportedMarket, SupportedMarketKey } from '../../../shared/products';

export default productManagementSlice.reducer;
