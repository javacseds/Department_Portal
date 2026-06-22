import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  darkMode: boolean;
  currentPageTitle: string;
  breadcrumbs: { label: string; href?: string }[];
}

const initialState: UIState = {
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  darkMode: false,
  currentPageTitle: 'Dashboard',
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarMobileOpen(state, action: PayloadAction<boolean>) {
      state.sidebarMobileOpen = action.payload;
    },
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', state.darkMode);
      }
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.darkMode = action.payload;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', action.payload);
      }
    },
    setPageTitle(state, action: PayloadAction<string>) {
      state.currentPageTitle = action.payload;
    },
    setBreadcrumbs(state, action: PayloadAction<{ label: string; href?: string }[]>) {
      state.breadcrumbs = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarMobileOpen,
  toggleDarkMode,
  setDarkMode,
  setPageTitle,
  setBreadcrumbs,
} = uiSlice.actions;
export default uiSlice.reducer;
