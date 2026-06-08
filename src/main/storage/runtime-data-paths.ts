import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';

const ENV_OVERRIDE_KEY = 'STORE_MASTER_DATA_DIR';
const DATA_ROOT_DIR_NAME = 'store';

let cachedDataRoot: string | null = null;

function normalizePath(input: string): string {
  return path.resolve(input);
}

export function resolveDataRoot(options?: { reset?: boolean }): string {
  if (options?.reset) {
    cachedDataRoot = null;
  }

  if (cachedDataRoot) {
    return cachedDataRoot;
  }

  const envOverride = process.env[ENV_OVERRIDE_KEY]?.trim();
  if (envOverride) {
    cachedDataRoot = normalizePath(envOverride);
    return cachedDataRoot;
  }

  cachedDataRoot = normalizePath(path.join(app.getPath('userData'), DATA_ROOT_DIR_NAME));
  return cachedDataRoot;
}

export function resolveStorePath(fileName: string): string {
  const root = resolveDataRoot();
  const normalizedFileName = path.normalize(fileName);

  if (path.isAbsolute(normalizedFileName)) {
    throw new Error(`Store file name must be relative, got absolute path: ${fileName}`);
  }

  const resolvedPath = path.resolve(root, normalizedFileName);
  if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Store file name escapes managed root: ${fileName}`);
  }

  return resolvedPath;
}

export async function ensureBaseDirectories(): Promise<string> {
  const root = resolveDataRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}
