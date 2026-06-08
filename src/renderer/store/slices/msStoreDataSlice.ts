import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import i18n from '@/locales';
import type {
  MsStoreDataDataset,
  MsStoreDataEntry,
  MsStoreDataImportError,
  MsStoreDataValidationErrors,
} from '../../../shared/ms-store-data';
import {
  createEmptyMsStoreDataDataset,
  createEmptyMsStoreDataEntry,
  createTimestampLabel,
  normalizeKeywords,
  validateMsStoreDataEntry,
} from '../../../shared/ms-store-data';

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface MsStoreDataDraft {
  id: string;
  productStorageId: string;
  locale: string;
  market: string;
  storeId: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  keywordsText: string;
  createdAt: string;
  updatedAt: string;
}

interface MsStoreDataState {
  activeProductStorageId: string;
  entries: MsStoreDataEntry[];
  selectedEntryId: string;
  draft: MsStoreDataDraft | null;
  fieldErrors: MsStoreDataValidationErrors;
  loadStatus: AsyncStatus;
  loadError: string | null;
  importStatus: AsyncStatus;
  importError: string | null;
  importErrors: MsStoreDataImportError[];
  exportStatus: AsyncStatus;
  exportError: string | null;
  exportPath: string | null;
}

function createDraftFromEntry(entry: MsStoreDataEntry): MsStoreDataDraft {
  return {
    ...entry,
    keywordsText: entry.keywords.join(', '),
  };
}

function createDraftForProduct(productStorageId: string): MsStoreDataDraft {
  return createDraftFromEntry(createEmptyMsStoreDataEntry(productStorageId));
}

function createDatasetFromState(state: MsStoreDataState): MsStoreDataDataset {
  return {
    productStorageId: state.activeProductStorageId,
    entries: state.entries,
  };
}

function findEntry(entries: MsStoreDataEntry[], entryId: string): MsStoreDataEntry | null {
  return entries.find((entry) => entry.id === entryId) ?? null;
}

function hasDuplicateLocaleMarket(entries: MsStoreDataEntry[], entry: MsStoreDataEntry): boolean {
  return entries.some((item) => {
    if (item.id === entry.id) {
      return false;
    }

    return item.locale.trim().toLowerCase() === entry.locale.trim().toLowerCase()
      && item.market.trim().toLowerCase() === entry.market.trim().toLowerCase();
  });
}

function hydrateSelection(state: MsStoreDataState): void {
  const selectedEntry = state.selectedEntryId ? findEntry(state.entries, state.selectedEntryId) : null;

  if (selectedEntry) {
    state.draft = createDraftFromEntry(selectedEntry);
    return;
  }

  const firstEntry = state.entries[0];
  if (firstEntry) {
    state.selectedEntryId = firstEntry.id;
    state.draft = createDraftFromEntry(firstEntry);
    return;
  }

  state.selectedEntryId = '';
  state.draft = state.activeProductStorageId ? createDraftForProduct(state.activeProductStorageId) : null;
}

function normalizeDraft(draft: MsStoreDataDraft): MsStoreDataEntry {
  const timestamp = createTimestampLabel();

  return {
    id: draft.id,
    productStorageId: draft.productStorageId,
    locale: draft.locale.trim(),
    market: draft.market.trim(),
    storeId: draft.storeId.trim(),
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim(),
    shortDescription: draft.shortDescription.trim(),
    description: draft.description.trim(),
    keywords: normalizeKeywords(draft.keywordsText),
    createdAt: draft.createdAt,
    updatedAt: timestamp,
  };
}

export const loadMsStoreData = createAsyncThunk<MsStoreDataDataset, string, { rejectValue: string }>(
  'msStoreData/loadMsStoreData',
  async (productStorageId, { rejectWithValue }) => {
    try {
      return await window.storeMaster.readMsStoreData(productStorageId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : i18n.t('msStore.loadFailed'),
      );
    }
  },
);

export const importMsStoreData = createAsyncThunk<
  Awaited<ReturnType<typeof window.storeMaster.importMsStoreData>>,
  string,
  { rejectValue: string }
>(
  'msStoreData/importMsStoreData',
  async (productStorageId, { rejectWithValue }) => {
    try {
      return await window.storeMaster.importMsStoreData(productStorageId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : i18n.t('msStore.importFailed'),
      );
    }
  },
);

export const exportMsStoreData = createAsyncThunk<
  Awaited<ReturnType<typeof window.storeMaster.exportMsStoreData>>,
  { productStorageId: string; dataset: MsStoreDataDataset },
  { rejectValue: string }
>(
  'msStoreData/exportMsStoreData',
  async ({ productStorageId, dataset }, { rejectWithValue }) => {
    try {
      return await window.storeMaster.exportMsStoreData(productStorageId, dataset);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : i18n.t('msStore.exportFailed'),
      );
    }
  },
);

const initialState: MsStoreDataState = {
  activeProductStorageId: '',
  entries: [],
  selectedEntryId: '',
  draft: null,
  fieldErrors: {},
  loadStatus: 'idle',
  loadError: null,
  importStatus: 'idle',
  importError: null,
  importErrors: [],
  exportStatus: 'idle',
  exportError: null,
  exportPath: null,
};

const msStoreDataSlice = createSlice({
  name: 'msStoreData',
  initialState,
  reducers: {
    clearMsStoreWorkspace(state) {
      state.activeProductStorageId = '';
      state.entries = [];
      state.selectedEntryId = '';
      state.draft = null;
      state.fieldErrors = {};
      state.loadStatus = 'idle';
      state.loadError = null;
      state.importStatus = 'idle';
      state.importError = null;
      state.importErrors = [];
      state.exportStatus = 'idle';
      state.exportError = null;
      state.exportPath = null;
    },
    selectMsStoreEntry(state, action: PayloadAction<string>) {
      const entry = findEntry(state.entries, action.payload);

      if (!entry) {
        return;
      }

      state.selectedEntryId = entry.id;
      state.draft = createDraftFromEntry(entry);
      state.fieldErrors = {};
    },
    startNewMsStoreEntry(state) {
      if (!state.activeProductStorageId) {
        return;
      }

      state.selectedEntryId = '';
      state.draft = createDraftForProduct(state.activeProductStorageId);
      state.fieldErrors = {};
    },
    updateMsStoreDraftField(
      state,
      action: PayloadAction<{ field: keyof Pick<MsStoreDataDraft, 'locale' | 'market' | 'storeId' | 'title' | 'subtitle' | 'shortDescription' | 'description' | 'keywordsText'>; value: string }>,
    ) {
      if (!state.draft) {
        return;
      }

      state.draft[action.payload.field] = action.payload.value;
      const errorField = action.payload.field === 'keywordsText'
        ? 'keywords'
        : action.payload.field === 'subtitle'
          ? null
          : action.payload.field;

      if (errorField) {
        delete state.fieldErrors[errorField];
      }
      state.importStatus = 'idle';
      state.importError = null;
      state.importErrors = [];
      state.exportStatus = 'idle';
      state.exportError = null;
    },
    resetMsStoreDraft(state) {
      hydrateSelection(state);
      state.fieldErrors = {};
    },
    saveMsStoreDraft(state) {
      if (!state.draft) {
        return;
      }

      const normalizedEntry = normalizeDraft(state.draft);
      const fieldErrors = validateMsStoreDataEntry(normalizedEntry);

      if (hasDuplicateLocaleMarket(state.entries, normalizedEntry)) {
        fieldErrors.market = 'validation.msStore.duplicateLocaleMarket';
      }

      state.fieldErrors = fieldErrors;
      if (Object.keys(fieldErrors).length > 0) {
        return;
      }

      const existingIndex = state.entries.findIndex((entry) => entry.id === normalizedEntry.id);

      if (existingIndex >= 0) {
        state.entries[existingIndex] = normalizedEntry;
      } else {
        state.entries = [normalizedEntry, ...state.entries];
      }

      state.selectedEntryId = normalizedEntry.id;
      state.draft = createDraftFromEntry(normalizedEntry);
      state.importStatus = 'idle';
      state.importError = null;
      state.importErrors = [];
      state.exportStatus = 'idle';
      state.exportError = null;
    },
    deleteSelectedMsStoreEntry(state) {
      const entryId = state.selectedEntryId || state.draft?.id;

      if (!entryId) {
        return;
      }

      state.entries = state.entries.filter((entry) => entry.id !== entryId);
      state.fieldErrors = {};
      state.importStatus = 'idle';
      state.importError = null;
      state.importErrors = [];
      hydrateSelection(state);
    },
    clearMsStoreMessages(state) {
      state.importStatus = 'idle';
      state.importError = null;
      state.importErrors = [];
      state.exportStatus = 'idle';
      state.exportError = null;
      state.exportPath = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMsStoreData.pending, (state, action) => {
        state.activeProductStorageId = action.meta.arg;
        state.loadStatus = 'loading';
        state.loadError = null;
        state.entries = [];
        state.selectedEntryId = '';
        state.draft = createDraftForProduct(action.meta.arg);
        state.fieldErrors = {};
      })
      .addCase(loadMsStoreData.fulfilled, (state, action) => {
        state.activeProductStorageId = action.payload.productStorageId;
        state.entries = action.payload.entries;
        state.loadStatus = 'succeeded';
        state.loadError = null;
        state.fieldErrors = {};
        state.importStatus = 'idle';
        state.importError = null;
        state.importErrors = [];
        hydrateSelection(state);
      })
      .addCase(loadMsStoreData.rejected, (state, action) => {
        state.entries = [];
        state.selectedEntryId = '';
        state.draft = state.activeProductStorageId ? createDraftForProduct(state.activeProductStorageId) : null;
        state.loadStatus = 'failed';
        state.loadError = action.payload ?? i18n.t('msStore.loadFailed');
      })
      .addCase(importMsStoreData.pending, (state) => {
        state.importStatus = 'loading';
        state.importError = null;
        state.importErrors = [];
      })
      .addCase(importMsStoreData.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.activeProductStorageId = action.payload.dataset.productStorageId;
          state.entries = action.payload.dataset.entries;
          state.selectedEntryId = '';
          state.fieldErrors = {};
          state.importStatus = 'succeeded';
          state.importError = null;
          state.importErrors = [];
          hydrateSelection(state);
          return;
        }

        state.importStatus = action.payload.cancelled ? 'idle' : 'failed';
        state.importError = action.payload.cancelled ? null : i18n.t('msStore.importRejected');
        state.importErrors = action.payload.cancelled ? [] : action.payload.errors;
      })
      .addCase(importMsStoreData.rejected, (state, action) => {
        state.importStatus = 'failed';
        state.importError = action.payload ?? i18n.t('msStore.importFailed');
        state.importErrors = [];
      })
      .addCase(exportMsStoreData.pending, (state) => {
        state.exportStatus = 'loading';
        state.exportError = null;
        state.exportPath = null;
      })
      .addCase(exportMsStoreData.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.exportStatus = 'succeeded';
          state.exportError = null;
          state.exportPath = action.payload.filePath;
          return;
        }

        state.exportStatus = action.payload.cancelled ? 'idle' : 'failed';
        state.exportError = action.payload.cancelled ? null : action.payload.error ?? i18n.t('msStore.exportFailed');
        state.exportPath = null;
      })
      .addCase(exportMsStoreData.rejected, (state, action) => {
        state.exportStatus = 'failed';
        state.exportError = action.payload ?? i18n.t('msStore.exportFailed');
        state.exportPath = null;
      });
  },
});

export const {
  clearMsStoreMessages,
  clearMsStoreWorkspace,
  deleteSelectedMsStoreEntry,
  resetMsStoreDraft,
  saveMsStoreDraft,
  selectMsStoreEntry,
  startNewMsStoreEntry,
  updateMsStoreDraftField,
} = msStoreDataSlice.actions;

export function selectMsStoreDataset(state: { msStoreData: MsStoreDataState }): MsStoreDataDataset {
  return createDatasetFromState(state.msStoreData);
}

export type { MsStoreDataDataset, MsStoreDataEntry, MsStoreDataImportError, MsStoreDataValidationErrors };

export default msStoreDataSlice.reducer;
