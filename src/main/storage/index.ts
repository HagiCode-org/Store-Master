export { readStore, writeStore, writeAtomically } from './json-store.js';
export { resolveDataRoot, resolveStorePath, ensureBaseDirectories } from './runtime-data-paths.js';
export * as storageRegistry from './storage-registry.js';
export { initialize as bootstrapStorage } from './storage-bootstrap.js';

import type { ReadResult, StoreDefinition } from '../../shared/storage.js';
import { readStore, writeStore } from './json-store.js';
import { resolveStorePath } from './runtime-data-paths.js';
import * as storageRegistry from './storage-registry.js';

export function createStoreHandle<T>(definition: StoreDefinition<T>): {
  read: () => Promise<ReadResult<T>>;
  write: (data: T) => Promise<void>;
  definition: StoreDefinition<T>;
  filePath: string;
} {
  storageRegistry.register(definition);
  const filePath = resolveStorePath(definition.fileName);

  return {
    read: () => readStore(filePath, definition),
    write: (data: T) => writeStore(filePath, definition, data),
    definition,
    filePath,
  };
}

export type { ReadResult, StoreDefinition } from '../../shared/storage.js';
