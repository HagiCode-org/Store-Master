import { createAction, type TypedStartListening } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '@/store';
import { listenerMiddleware } from './listenerMiddleware';
import { loadManagedWorkflows, refreshManagedWorkflows, resetActionManagement } from './slices/actionManagementSlice';
import { fetchAccounts } from './slices/githubAccountsSlice';
import { fetchRepos, clearRepos } from './slices/githubReposSlice';
import { fetchAppInfo } from './slices/hubSlice';
import {
  clearMsStoreWorkspace,
  deleteSelectedMsStoreEntry,
  importMsStoreData,
  loadMsStoreData,
  saveMsStoreDraft,
} from './slices/msStoreDataSlice';
import { setActiveSection } from './slices/navigationSlice';
import {
  createProduct,
  loadProducts,
  saveDraft,
  selectProduct,
} from './slices/productManagementSlice';

export const appStarted = createAction('app/started');

type AppStartListening = TypedStartListening<RootState, AppDispatch>;

const startAppListening = listenerMiddleware.startListening as AppStartListening;

let listenersRegistered = false;

function syncReposForActiveAccount(dispatch: AppDispatch, state: RootState): void {
  const accountId = state.githubAccounts.activeAccountId;

  if (!accountId) {
    dispatch(clearRepos());
    return;
  }

  const { activeAccountId, fetchStatus } = state.githubRepos;
  const hasFreshRepos = activeAccountId === accountId && (fetchStatus === 'loading' || fetchStatus === 'succeeded');

  if (!hasFreshRepos) {
    void dispatch(fetchRepos({ accountId }));
  }
}

function syncManagedActionsForActiveAccount(dispatch: AppDispatch, state: RootState): void {
  const accountId = state.githubAccounts.activeAccountId;

  if (!accountId) {
    dispatch(resetActionManagement());
    return;
  }

  const { activeAccountId, loadStatus } = state.actionManagement;
  const hasFreshActions = activeAccountId === accountId && (loadStatus === 'loading' || loadStatus === 'succeeded');

  if (!hasFreshActions) {
    void dispatch(loadManagedWorkflows(accountId));
  }
}

function syncSectionData(dispatch: AppDispatch, state: RootState): void {
  const activeSection = state.navigation.activeSection as string;

  if (activeSection === 'repos') {
    syncReposForActiveAccount(dispatch, state);
    return;
  }

  if (activeSection === 'actions') {
    syncReposForActiveAccount(dispatch, state);
    syncManagedActionsForActiveAccount(dispatch, state);
  }
}

function resolveActiveProductStorageId(state: RootState): string {
  const selectedProduct = state.productManagement.products.find(
    (product) => product.id === state.productManagement.selectedProductId,
  );

  return selectedProduct?.productStorageId ?? '';
}

function syncMsStoreDataForActiveProduct(dispatch: AppDispatch, state: RootState): void {
  const productStorageId = resolveActiveProductStorageId(state);

  if (!productStorageId) {
    dispatch(clearMsStoreWorkspace());
    return;
  }

  const alreadyLoaded = state.msStoreData.activeProductStorageId === productStorageId
    && (state.msStoreData.loadStatus === 'loading' || state.msStoreData.loadStatus === 'succeeded');

  if (!alreadyLoaded) {
    void dispatch(loadMsStoreData(productStorageId));
  }
}

export function registerStoreListeners(): void {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  startAppListening({
    actionCreator: appStarted,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState();

      if (state.hub.loadStatus === 'idle') {
        void listenerApi.dispatch(fetchAppInfo());
      }

      if (state.githubAccounts.fetchStatus === 'idle') {
        void listenerApi.dispatch(fetchAccounts());
      }

      if (state.productManagement.loadStatus === 'idle') {
        void listenerApi.dispatch(loadProducts());
      }
    },
  });

  startAppListening({
    actionCreator: setActiveSection,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState();

      syncSectionData(listenerApi.dispatch, state);

      if (state.navigation.activeSection === 'product-profile') {
        syncMsStoreDataForActiveProduct(listenerApi.dispatch, state);
      }
    },
  });

  startAppListening({
    predicate: (_, currentState, previousState) => (
      previousState.githubAccounts.activeAccountId !== currentState.githubAccounts.activeAccountId
    ),
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState();

      if (!state.githubAccounts.activeAccountId) {
        listenerApi.dispatch(clearRepos());
        listenerApi.dispatch(resetActionManagement());
        return;
      }

      syncSectionData(listenerApi.dispatch, state);
    },
  });

  startAppListening({
    predicate: (action, currentState, previousState) => (
      saveDraft.match(action)
      && previousState.productManagement.products !== currentState.productManagement.products
    ),
    effect: async (_, listenerApi) => {
      try {
        await window.storeMaster.writeProducts(listenerApi.getState().productManagement.products);
      } catch (error) {
        console.error('[store-master] Failed to persist products after saveDraft.', error);
      }
    },
  });

  startAppListening({
    predicate: (action) => (
      selectProduct.match(action)
      || createProduct.match(action)
      || loadProducts.fulfilled.match(action)
    ),
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState();

      if (state.navigation.activeSection !== 'product-profile') {
        return;
      }

      syncMsStoreDataForActiveProduct(listenerApi.dispatch, state);
    },
  });

  startAppListening({
    predicate: (action, currentState, previousState) => {
      if (!currentState.msStoreData.activeProductStorageId) {
        return false;
      }

      const entriesChanged = previousState.msStoreData.entries !== currentState.msStoreData.entries;
      return entriesChanged && (
        saveMsStoreDraft.match(action)
        || deleteSelectedMsStoreEntry.match(action)
        || (importMsStoreData.fulfilled.match(action) && action.payload.success)
      );
    },
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState();

      try {
        await window.storeMaster.writeMsStoreData(state.msStoreData.activeProductStorageId, {
          productStorageId: state.msStoreData.activeProductStorageId,
          entries: state.msStoreData.entries,
        });
      } catch (error) {
        console.error('[store-master] Failed to persist MS Store data after dataset change.', error);
      }
    },
  });

  startAppListening({
    actionCreator: loadManagedWorkflows.fulfilled,
    effect: async (action, listenerApi) => {
      if (action.payload.result.workflows.length === 0) {
        return;
      }

      const state = listenerApi.getState();

      if (state.githubAccounts.activeAccountId !== action.payload.accountId) {
        return;
      }

      void listenerApi.dispatch(refreshManagedWorkflows({
        accountId: action.payload.accountId,
        workflows: action.payload.result.workflows,
      }));
    },
  });
}
