import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NavigationSection = 'products' | 'product-profile' | 'settings';

interface NavigationState {
  activeSection: NavigationSection;
  sidebarCollapsed: boolean;
}

const initialState: NavigationState = {
  activeSection: 'products',
  sidebarCollapsed: false,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveSection(state, action: PayloadAction<NavigationSection>) {
      state.activeSection = action.payload;
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setActiveSection, toggleSidebarCollapsed } = navigationSlice.actions;

export default navigationSlice.reducer;
