/**
 * UI Store
 *
 * Manages global UI state and user preferences.
 * Persists to localStorage for consistent UX across sessions.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es';

interface UIStore {
  // Sidebar State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Language
  language: Language;
  setLanguage: (language: Language) => void;

  // Modals State
  modals: {
    passportVerification: boolean;
    walletConnection: boolean;
    studyFunding: boolean;
  };
  openModal: (modal: keyof UIStore['modals']) => void;
  closeModal: (modal: keyof UIStore['modals']) => void;
  closeAllModals: () => void;

  // Notifications Preferences
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  sidebarCollapsed: false,
  theme: 'light' as Theme,
  language: 'en' as Language,
  modals: {
    passportVerification: false,
    walletConnection: false,
    studyFunding: false,
  },
  notificationsEnabled: true,
};

// ============================================
// Store Implementation
// ============================================

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Sidebar Actions
        toggleSidebar: () => {
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
        },

        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed });
        },

        // Theme Actions
        setTheme: (theme) => {
          set({ theme });
          // Apply theme to document
          if (typeof window !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            if (theme !== 'system') {
              document.documentElement.classList.add(theme);
            } else {
              // Detect system preference
              const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.documentElement.classList.add(isDark ? 'dark' : 'light');
            }
          }
        },

        // Language Actions
        setLanguage: (language) => {
          set({ language });
        },

        // Modal Actions
        openModal: (modal) => {
          set((state) => ({
            modals: { ...state.modals, [modal]: true },
          }));
        },

        closeModal: (modal) => {
          set((state) => ({
            modals: { ...state.modals, [modal]: false },
          }));
        },

        closeAllModals: () => {
          set({
            modals: {
              passportVerification: false,
              walletConnection: false,
              studyFunding: false,
            },
          });
        },

        // Notifications Actions
        toggleNotifications: () => {
          set((state) => ({ notificationsEnabled: !state.notificationsEnabled }));
        },
      }),
      {
        name: 'ui-preferences-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          language: state.language,
          notificationsEnabled: state.notificationsEnabled,
          // Don't persist modals state
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// ============================================
// Selectors
// ============================================

export const selectSidebarCollapsed = (state: UIStore) => state.sidebarCollapsed;
export const selectTheme = (state: UIStore) => state.theme;
export const selectLanguage = (state: UIStore) => state.language;
export const selectModals = (state: UIStore) => state.modals;
export const selectNotificationsEnabled = (state: UIStore) => state.notificationsEnabled;
