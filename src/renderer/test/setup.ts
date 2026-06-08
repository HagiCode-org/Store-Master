import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

const defaultProducts = [
  {
    id: 'product-1',
    productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
    name: 'Signal Desk',
    description: 'Desktop release workspace for managing store metadata snapshots before publication.',
    folderName: 'signal-desk',
    relatedMarkets: ['Steam', 'MS Store'],
    updatedAt: '2026-06-07 10:40',
  },
  {
    id: 'product-2',
    productStorageId: 'prd-22222222-2222-4222-8222-222222222222',
    name: 'Patch Harbor',
    description: 'Release engineering console for patch coordination and submission readiness checks.',
    folderName: 'patch-harbor',
    relatedMarkets: ['Steam'],
    updatedAt: '2026-06-07 09:10',
  },
];

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
  document.documentElement.lang = 'en-US';

  Object.defineProperty(window, 'storeMaster', {
    configurable: true,
    writable: true,
    value: {
      readProducts: vi.fn().mockResolvedValue(structuredClone(defaultProducts)),
      writeProducts: vi.fn().mockResolvedValue(true),
      readMsStoreData: vi.fn().mockImplementation(async (productStorageId: string) => ({
        productStorageId,
        entries: [],
      })),
      writeMsStoreData: vi.fn().mockResolvedValue(true),
      importMsStoreData: vi.fn().mockResolvedValue({ success: false, cancelled: true, errors: [] }),
      exportMsStoreData: vi.fn().mockResolvedValue({ success: false, cancelled: true, entryCount: 0 }),
    },
  });

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});
