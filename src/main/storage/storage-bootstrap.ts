import type { BootstrapReport, BootstrapStoreResult } from '../../shared/storage.js';
import { readStore } from './json-store.js';
import { ensureBaseDirectories, resolveDataRoot, resolveStorePath } from './runtime-data-paths.js';
import * as storageRegistry from './storage-registry.js';

export async function initialize(): Promise<BootstrapReport> {
  await ensureBaseDirectories();

  const results: BootstrapStoreResult[] = [];

  for (const definition of storageRegistry.list()) {
    try {
      const result = await readStore(resolveStorePath(definition.fileName), definition);

      results.push({
        key: definition.key,
        status: result.source === 'default'
          ? 'initialized'
          : result.source === 'migrated'
            ? 'migrated'
            : 'unchanged',
      });
    } catch (error) {
      results.push({
        key: definition.key,
        status: 'corrupt-recovered',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const report: BootstrapReport = {
    results,
    success: results.every((result) => !result.error),
  };

  if (report.success) {
    console.info(`[store-master:storage-bootstrap] Initialized ${results.length} store(s) from ${resolveDataRoot()}`);
  } else {
    console.error('[store-master:storage-bootstrap] Storage bootstrap completed with errors.', report.results);
  }

  return report;
}
