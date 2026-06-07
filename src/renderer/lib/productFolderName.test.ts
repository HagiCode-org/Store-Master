import { describe, expect, it } from 'vitest';
import { validateProductFolderName } from './productFolderName';

describe('validateProductFolderName', () => {
  it('accepts a valid folder name', () => {
    expect(validateProductFolderName('signal-desk')).toBeNull();
  });

  it('rejects values outside the allowed length', () => {
    expect(validateProductFolderName('a')).toBe('validation.productFolderNameLength');
    expect(validateProductFolderName('a'.repeat(65))).toBe('validation.productFolderNameLength');
  });

  it('requires a lowercase starting letter', () => {
    expect(validateProductFolderName('Signal-desk')).toBe('validation.productFolderNameStart');
  });

  it('rejects invalid characters and trailing hyphens', () => {
    expect(validateProductFolderName('signal_desk')).toBe('validation.productFolderNameCharacters');
    expect(validateProductFolderName('signal-')).toBe('validation.productFolderNameTrailingHyphen');
  });
});
