import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'dark' | 'light';

export const themeStorageKey = 'storeMaster.theme';

interface ThemeState {
  currentTheme: ThemeMode;
}

export function resolveInitialThemePreference(storage?: Pick<Storage, 'getItem'>): ThemeMode {
  const storedPreference = storage?.getItem(themeStorageKey);

  if (storedPreference === 'light' || storedPreference === 'dark') {
    return storedPreference;
  }

  return 'dark';
}

export function persistThemePreference(theme: ThemeMode, storage?: Pick<Storage, 'setItem'>): void {
  storage?.setItem(themeStorageKey, theme);
}

export function applyThemePreference(theme: ThemeMode, documentElement?: HTMLElement): void {
  if (!documentElement) {
    return;
  }

  documentElement.dataset.theme = theme;
  documentElement.style.colorScheme = theme;
}

const initialState: ThemeState = {
  currentTheme: 'dark',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    initializeTheme(state, action: PayloadAction<ThemeMode>) {
      state.currentTheme = action.payload;
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.currentTheme = action.payload;
    },
  },
});

export const { initializeTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;
