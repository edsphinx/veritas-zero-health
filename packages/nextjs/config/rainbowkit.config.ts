/**
 * RainbowKit Configuration
 *
 * Custom theme based on Veritas Zero Health scientific color palette
 */

import { Theme } from '@rainbow-me/rainbowkit';

/**
 * Custom RainbowKit theme using our scientific color palette:
 * - Primary: Deep Blue (#0A2540) - Trust, authority, professionalism
 * - Secondary: Emerald Green (#008060) - Growth, health, wellbeing
 * - Accent: Vivid Orange (#F29F05) - Innovation, creativity, action
 */
export const veritasTheme: Theme = {
  blurs: {
    modalOverlay: 'blur(8px)',
  },
  colors: {
    accentColor: '#0a2540', // Deep Blue - primary action color
    accentColorForeground: '#ffffff',
    actionButtonBorder: 'rgba(10, 37, 64, 0.1)',
    actionButtonBorderMobile: 'rgba(10, 37, 64, 0.1)',
    actionButtonSecondaryBackground: '#f6f9fc', // Muted background
    closeButton: '#525f7f', // Muted foreground
    closeButtonBackground: '#ffffff',
    connectButtonBackground: '#ffffff',
    connectButtonBackgroundError: '#ef4444', // Destructive
    connectButtonInnerBackground: '#f6f9fc',
    connectButtonText: '#0a2540',
    connectButtonTextError: '#ef4444',
    connectionIndicator: '#008060', // Success green
    downloadBottomCardBackground: 'linear-gradient(180deg, #f6f9fc 0%, #ffffff 100%)',
    downloadTopCardBackground: 'linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%)',
    error: '#ef4444',
    generalBorder: '#e0e7ef',
    generalBorderDim: 'rgba(224, 231, 239, 0.5)',
    menuItemBackground: 'rgba(10, 37, 64, 0.05)',
    modalBackdrop: 'rgba(10, 37, 64, 0.4)',
    modalBackground: '#ffffff',
    modalBorder: '#e0e7ef',
    modalText: '#0a2540',
    modalTextDim: '#525f7f',
    modalTextSecondary: '#525f7f',
    profileAction: '#f6f9fc',
    profileActionHover: '#e0e7ef',
    profileForeground: '#ffffff',
    selectedOptionBorder: '#0a2540',
    standby: '#f29f05', // Warning orange
  },
  fonts: {
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  radii: {
    actionButton: '12px',
    connectButton: '12px',
    menuButton: '12px',
    modal: '16px',
    modalMobile: '16px',
  },
  shadows: {
    connectButton: '0 4px 12px rgba(10, 37, 64, 0.1)',
    dialog: '0 8px 32px rgba(10, 37, 64, 0.12)',
    profileDetailsAction: '0 2px 8px rgba(10, 37, 64, 0.08)',
    selectedOption: '0 2px 8px rgba(10, 37, 64, 0.1)',
    selectedWallet: '0 4px 16px rgba(10, 37, 64, 0.12)',
    walletLogo: '0 2px 8px rgba(10, 37, 64, 0.08)',
  },
};

/**
 * Dark mode theme (optional, for future use)
 */
export const veritasDarkTheme: Theme = {
  blurs: {
    modalOverlay: 'blur(8px)',
  },
  colors: {
    accentColor: '#00a884', // Brighter green for dark mode
    accentColorForeground: '#0d1b2a',
    actionButtonBorder: 'rgba(0, 168, 132, 0.2)',
    actionButtonBorderMobile: 'rgba(0, 168, 132, 0.2)',
    actionButtonSecondaryBackground: '#1f2937',
    closeButton: '#9ca3af',
    closeButtonBackground: '#1b2838',
    connectButtonBackground: '#1b2838',
    connectButtonBackgroundError: '#dc2626',
    connectButtonInnerBackground: '#1f2937',
    connectButtonText: '#fafafa',
    connectButtonTextError: '#dc2626',
    connectionIndicator: '#00997a',
    downloadBottomCardBackground: 'linear-gradient(180deg, #1f2937 0%, #1b2838 100%)',
    downloadTopCardBackground: 'linear-gradient(180deg, #1b2838 0%, #1f2937 100%)',
    error: '#dc2626',
    generalBorder: '#374151',
    generalBorderDim: 'rgba(55, 65, 81, 0.5)',
    menuItemBackground: 'rgba(0, 168, 132, 0.1)',
    modalBackdrop: 'rgba(13, 27, 42, 0.8)',
    modalBackground: '#1b2838',
    modalBorder: '#374151',
    modalText: '#fafafa',
    modalTextDim: '#9ca3af',
    modalTextSecondary: '#9ca3af',
    profileAction: '#1f2937',
    profileActionHover: '#374151',
    profileForeground: '#1b2838',
    selectedOptionBorder: '#00a884',
    standby: '#ffa726',
  },
  fonts: {
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  radii: {
    actionButton: '12px',
    connectButton: '12px',
    menuButton: '12px',
    modal: '16px',
    modalMobile: '16px',
  },
  shadows: {
    connectButton: '0 4px 12px rgba(0, 0, 0, 0.3)',
    dialog: '0 8px 32px rgba(0, 0, 0, 0.4)',
    profileDetailsAction: '0 2px 8px rgba(0, 0, 0, 0.2)',
    selectedOption: '0 2px 8px rgba(0, 0, 0, 0.3)',
    selectedWallet: '0 4px 16px rgba(0, 0, 0, 0.4)',
    walletLogo: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
};
