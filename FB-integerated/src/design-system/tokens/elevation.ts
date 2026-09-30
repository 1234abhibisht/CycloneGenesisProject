// Cyclone AI Design System - Elevation & Shadow Tokens (Material Design 3)
export const elevationTokens = {
  // Elevation Levels (0-24dp)
  level0: {
    boxShadow: 'none',
  },
  level1: {
    boxShadow: '0 1px 2px rgba(60, 64, 67, 0.08), 0 1px 3px rgba(60, 64, 67, 0.12)',
  },
  level2: {
    boxShadow: '0 1px 2px rgba(60, 64, 67, 0.12), 0 2px 6px rgba(60, 64, 67, 0.16)',
  },
  level3: {
    boxShadow: '0 2px 4px rgba(60, 64, 67, 0.12), 0 4px 8px rgba(60, 64, 67, 0.16)',
  },
  level4: {
    boxShadow: '0 4px 8px rgba(60, 64, 67, 0.12), 0 8px 16px rgba(60, 64, 67, 0.16)',
  },
  level5: {
    boxShadow: '0 6px 12px rgba(60, 64, 67, 0.12), 0 12px 24px rgba(60, 64, 67, 0.16)',
  },
  level6: {
    boxShadow: '0 8px 16px rgba(60, 64, 67, 0.12), 0 16px 32px rgba(60, 64, 67, 0.16)',
  },
  level7: {
    boxShadow: '0 12px 24px rgba(60, 64, 67, 0.12), 0 24px 48px rgba(60, 64, 67, 0.16)',
  },
  level8: {
    boxShadow: '0 16px 32px rgba(60, 64, 67, 0.12), 0 32px 64px rgba(60, 64, 67, 0.16)',
  },

  // Dark Theme Elevations (higher contrast)
  level1Dark: {
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.24), 0 1px 3px rgba(0, 0, 0, 0.32)',
  },
  level2Dark: {
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.36)',
  },
  level3Dark: {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.28), 0 4px 8px rgba(0, 0, 0, 0.36)',
  },
  level4Dark: {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.28), 0 8px 16px rgba(0, 0, 0, 0.36)',
  },
  level5Dark: {
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.28), 0 12px 24px rgba(0, 0, 0, 0.36)',
  },

  // Colored Shadows (for brand elevation)
  primary: {
    boxShadow: '0 4px 16px rgba(20, 184, 166, 0.3), 0 8px 32px rgba(20, 184, 166, 0.2)',
  },
  primaryHover: {
    boxShadow: '0 6px 20px rgba(20, 184, 166, 0.4), 0 12px 40px rgba(20, 184, 166, 0.25)',
  },
  secondary: {
    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3), 0 8px 32px rgba(245, 158, 11, 0.2)',
  },
  tertiary: {
    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3), 0 8px 32px rgba(239, 68, 68, 0.2)',
  },
  success: {
    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3), 0 8px 32px rgba(34, 197, 94, 0.2)',
  },

  // Inset Shadows
  inset: {
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.08)',
  },
  insetDark: {
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.24)',
  },

  // Focus Rings
  focusRing: {
    boxShadow: '0 0 0 2px #ffffff, 0 0 0 4px rgba(20, 184, 166, 0.4)',
  },
  focusRingDark: {
    boxShadow: '0 0 0 2px #0f172a, 0 0 0 4px rgba(94, 234, 212, 0.4)',
  },

  // Glassmorphism
  glass: {
    backdropFilter: 'blur(20px)',
    webkitBackdropFilter: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  },
  glassDark: {
    backdropFilter: 'blur(20px)',
    webkitBackdropFilter: 'blur(20px)',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
  },
  glassLight: {
    backdropFilter: 'blur(20px)',
    webkitBackdropFilter: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },

  // Card Elevations
  card: {
    boxShadow: '0 1px 3px rgba(60, 64, 67, 0.08), 0 2px 6px rgba(60, 64, 67, 0.12)',
  },
  cardHover: {
    boxShadow: '0 4px 12px rgba(60, 64, 67, 0.12), 0 8px 24px rgba(60, 64, 67, 0.16)',
  },
  cardElevated: {
    boxShadow: '0 8px 24px rgba(60, 64, 67, 0.12), 0 16px 48px rgba(60, 64, 67, 0.16)',
  },

  // Modal/Dialog
  modal: {
    boxShadow: '0 12px 40px rgba(60, 64, 67, 0.16), 0 24px 80px rgba(60, 64, 67, 0.2)',
  },
  modalDark: {
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.32), 0 24px 80px rgba(0, 0, 0, 0.4)',
  },

  // Dropdown/Menu
  dropdown: {
    boxShadow: '0 4px 16px rgba(60, 64, 67, 0.12), 0 8px 24px rgba(60, 64, 67, 0.16)',
  },
  dropdownDark: {
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.24), 0 8px 24px rgba(0, 0, 0, 0.32)',
  },

  // Tooltip
  tooltip: {
    boxShadow: '0 4px 12px rgba(60, 64, 67, 0.16)',
  },
  tooltipDark: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.32)',
  },
} as const;

export type ElevationToken = typeof elevationTokens;