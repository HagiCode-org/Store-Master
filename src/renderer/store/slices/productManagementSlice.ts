import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { validateProductFolderName } from '@/lib/productFolderName';

export const supportedMarkets = ['Steam', 'MS Store'] as const;

export type SupportedMarket = (typeof supportedMarkets)[number];

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  folderName: string;
  relatedMarkets: SupportedMarket[];
  updatedAt: string;
}

export interface ProductDraft {
  name: string;
  description: string;
  folderName: string;
  relatedMarkets: SupportedMarket[];
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
}

const initialProducts: ProductRecord[] = [
  {
    id: 'product-1',
    name: 'Signal Desk',
    description: 'Desktop release workspace for managing store metadata snapshots before publication.',
    folderName: 'signal-desk',
    relatedMarkets: ['Steam', 'MS Store'],
    updatedAt: '2026-06-07 10:40',
  },
  {
    id: 'product-2',
    name: 'Patch Harbor',
    description: 'Release engineering console for patch coordination and submission readiness checks.',
    folderName: 'patch-harbor',
    relatedMarkets: ['Steam'],
    updatedAt: '2026-06-07 09:10',
  },
];

function createDraft(product: ProductRecord): ProductDraft {
  return {
    name: product.name,
    description: product.description,
    folderName: product.folderName,
    relatedMarkets: [...product.relatedMarkets],
  };
}

function nextProductId(products: ProductRecord[]): string {
  const highestId = products.reduce((maxId, product) => {
    const numericId = Number.parseInt(product.id.replace('product-', ''), 10);
    return Number.isNaN(numericId) ? maxId : Math.max(maxId, numericId);
  }, 0);

  return `product-${highestId + 1}`;
}

function getTimestampLabel(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date()).replace(' ', ' ');
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

  if (draft.relatedMarkets.length === 0) {
    errors.relatedMarkets = 'validation.relatedMarketsRequired';
  }

  return errors;
}

const initialState: ProductManagementState = {
  products: initialProducts,
  selectedProductId: initialProducts[0].id,
  draft: createDraft(initialProducts[0]),
  fieldErrors: {},
  supportedMarkets,
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
        name: '',
        description: '',
        folderName: '',
        relatedMarkets: [],
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
    toggleDraftMarket(state, action: PayloadAction<SupportedMarket>) {
      const market = action.payload;

      if (state.draft.relatedMarkets.includes(market)) {
        state.draft.relatedMarkets = state.draft.relatedMarkets.filter((item) => item !== market);
      } else {
        state.draft.relatedMarkets = [...state.draft.relatedMarkets, market];
      }

      delete state.fieldErrors.relatedMarkets;
    },
    resetDraft(state) {
      const selectedProduct = state.products.find((product) => product.id === state.selectedProductId);

      if (!selectedProduct) {
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
        relatedMarkets: [...state.draft.relatedMarkets],
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
              updatedAt: getTimestampLabel(),
            }
          : product
      ));
      state.draft = normalizedDraft;
    },
  },
});

export const { selectProduct, createProduct, updateDraftField, toggleDraftMarket, resetDraft, saveDraft } = productManagementSlice.actions;

export default productManagementSlice.reducer;
