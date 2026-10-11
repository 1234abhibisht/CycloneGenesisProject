// Cyclone AI Design System - Color Tokens (Material Design 3 Inspired)
export const colorTokens = {
  // Primary Palette - Cyclone Intelligence Teal/Cyan
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',  // Primary brand
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },

  // Secondary Palette - Warning Amber/Orange
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Secondary brand
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Tertiary Palette - Danger Red
  tertiary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Alert/Danger
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Success Palette - Safe Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Neutral Palette - Slate (Google Material 3)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Surface Palette (Light Theme)
  surface: {
    0: '#ffffff',
    1: '#f8fafc',
    2: '#f1f5f9',
    3: '#e2e8f0',
    4: '#e0e7ff',
  },

  // Surface Palette (Dark Theme)
  surfaceDark: {
    0: '#0f172a',
    1: '#1e293b',
    2: '#334155',
    3: '#475569',
    4: '#1e3a5f',
  },

  // Semantic Colors (Light)
  semanticLight: {
    background: '#f8fafd',
    onBackground: '#1a1c1e',
    surface: '#ffffff',
    onSurface: '#1a1c1e',
    surfaceVariant: '#f1f5f9',
    onSurfaceVariant: '#475569',
    outline: '#cbd5e1',
    outlineVariant: '#e2e8f0',
    primary: '#0d9488',
    onPrimary: '#ffffff',
    primaryContainer: '#ccfbf1',
    onPrimaryContainer: '#042f2e',
    secondary: '#b45309',
    onSecondary: '#ffffff',
    secondaryContainer: '#fef3c7',
    onSecondaryContainer: '#451a03',
    tertiary: '#c62828',
    onTertiary: '#ffffff',
    tertiaryContainer: '#fee2e2',
    onTertiaryContainer: '#450a0a',
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#fee2e2',
    onErrorContainer: '#410002',
    success: '#166534',
    onSuccess: '#ffffff',
    successContainer: '#dcfce7',
    onSuccessContainer: '#052e16',
    inverseSurface: '#334155',
    inverseOnSurface: '#f1f5f9',
    inversePrimary: '#5eead4',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },

  // Semantic Colors (Dark)
  semanticDark: {
    background: '#0f172a',
    onBackground: '#e6e1e5',
    surface: '#1e293b',
    onSurface: '#e6e1e5',
    surfaceVariant: '#334155',
    onSurfaceVariant: '#cbd5e1',
    outline: '#7c8b9d',
    outlineVariant: '#475569',
    primary: '#5eead4',
    onPrimary: '#042f2e',
    primaryContainer: '#0f766e',
    onPrimaryContainer: '#ccfbf1',
    secondary: '#fbbf24',
    onSecondary: '#451a03',
    secondaryContainer: '#b45309',
    onSecondaryContainer: '#fef3c7',
    tertiary: '#f87171',
    onTertiary: '#450a0a',
    tertiaryContainer: '#b91c1c',
    onTertiaryContainer: '#fee2e2',
    error: '#f87171',
    onError: '#410002',
    errorContainer: '#b91c1c',
    onErrorContainer: '#fee2e2',
    success: '#4ade80',
    onSuccess: '#052e16',
    successContainer: '#166534',
    onSuccessContainer: '#dcfce7',
    inverseSurface: '#e6e1e5',
    inverseOnSurface: '#334155',
    inversePrimary: '#0d9488',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0, 0, 0, 0.6)',
  },

  // Cyclone Category Colors (IMD Standard)
  cycloneCategory: {
    depression: '#3b82f6',       // Blue - Depression
    deepDepression: '#06b6d4',   // Cyan - Deep Depression
    cyclonicStorm: '#8b5cf6',    // Purple - Cyclonic Storm
    severeCyclonicStorm: '#f59e0b', // Amber - Severe Cyclonic Storm
    verySevereCyclonicStorm: '#f97316', // Orange - Very Severe
    extremelySevereCyclonicStorm: '#ef4444', // Red - Extremely Severe
    superCyclonicStorm: '#be185d', // Pink - Super Cyclonic
  },

  // Indian State/Region Colors for Maps
  indiaRegions: {
    north: '#3b82f6',
    south: '#10b981',
    east: '#f59e0b',
    west: '#ef4444',
    northeast: '#8b5cf6',
    central: '#ec4899',
    islands: '#06b6d4',
  },
} as const;

export type ColorToken = typeof colorTokens;