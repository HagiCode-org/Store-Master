export type ProductFolderNameValidationError =
  | 'validation.productFolderNameRequired'
  | 'validation.productFolderNameLength'
  | 'validation.productFolderNameStart'
  | 'validation.productFolderNameCharacters'
  | 'validation.productFolderNameTrailingHyphen';

const productFolderNamePattern = /^[a-z][a-z0-9-]*$/;

export function validateProductFolderName(value: string): ProductFolderNameValidationError | null {
  if (value.length === 0) {
    return 'validation.productFolderNameRequired';
  }

  if (value.length < 2 || value.length > 64) {
    return 'validation.productFolderNameLength';
  }

  if (!/^[a-z]/.test(value)) {
    return 'validation.productFolderNameStart';
  }

  if (!productFolderNamePattern.test(value)) {
    return 'validation.productFolderNameCharacters';
  }

  if (value.endsWith('-')) {
    return 'validation.productFolderNameTrailingHyphen';
  }

  return null;
}

export function isValidProductFolderName(value: string): boolean {
  return validateProductFolderName(value) === null;
}
