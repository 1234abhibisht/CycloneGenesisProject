// Cyclone AI Design System - Border Radius, Breakpoints, Z-Index Tokens
export const borderRadiusTokens = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '32px',
  full: '9999px',

  // Component specific
  button: '12px',
  buttonSm: '8px',
  buttonLg: '16px',
  card: '16px',
  cardSm: '12px',
  cardLg: '24px',
  input: '8px',
  select: '8px',
  checkbox: '4px',
  radio: '9999px',
  switch: '9999px',
  tooltip: '8px',
  toast: '12px',
  dialog: '24px',
  bottomSheet: '24px',
  avatar: '9999px',
  badge: '9999px',
  chip: '9999px',
  tab: '8px',
  table: '8px',
  dropdown: '12px',
  popover: '12px',
  progress: '4px',
  slider: '4px',
} as const;

export type BorderRadiusToken = typeof borderRadiusTokens;

// Breakpoints (Material Design 3 + Custom)
export const breakpointTokens = {
  xs: '0px',
  sm: '600px',    // Mobile landscape / small tablet
  md: '905px',    // Tablet portrait
  lg: '1240px',   // Tablet landscape / small desktop
  xl: '1440px',   // Desktop
  '2xl': '1920px', // Large desktop

  // Custom breakpoints for cyclone dashboard
  dashboard: '1024px',
  mapView: '768px',
  sidebar: '900px',
  dataTable: '1100px',

  // Container queries (for component-level responsiveness)
  containerSm: '320px',
  containerMd: '480px',
  containerLg: '640px',
  containerXl: '800px',
} as const;

export type BreakpointToken = typeof breakpointTokens;

// Media Queries
export const mediaQueries = {
  xs: `@media (min-width: ${breakpointTokens.xs})`,
  sm: `@media (min-width: ${breakpointTokens.sm})`,
  md: `@media (min-width: ${breakpointTokens.md})`,
  lg: `@media (min-width: ${breakpointTokens.lg})`,
  xl: `@media (min-width: ${breakpointTokens.xl})`,
  '2xl': `@media (min-width: ${breakpointTokens['2xl']})`,

  // Max-width queries
  maxXs: `@media (max-width: ${breakpointTokens.sm})`,
  maxSm: `@media (max-width: ${breakpointTokens.md})`,
  maxMd: `@media (max-width: ${breakpointTokens.lg})`,
  maxLg: `@media (max-width: ${breakpointTokens.xl})`,
  maxXl: `@media (max-width: ${breakpointTokens['2xl']})`,

  // Hover/Pointer
  hover: '@media (hover: hover)',
  pointerFine: '@media (pointer: fine)',
  pointerCoarse: '@media (pointer: coarse)',

  // Reduced Motion
  reduceMotion: '@media (prefers-reduced-motion: reduce)',

  // Color Scheme
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',

  // High Contrast
  highContrast: '@media (prefers-contrast: high)',
  forcedColors: '@media (forced-colors: active)',

  // Print
  print: '@media print',
} as const;

export type MediaQueries = typeof mediaQueries;

// Z-Index Scale (Material Design 3)
export const zIndexTokens = {
  // Base layers
  base: 0,
  background: -1,

  // Component layers
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,

  // Special layers
  loader: 2000,
  debug: 9999,

  // Map layers (Leaflet)
  mapTile: 100,
  mapOverlay: 200,
  mapMarker: 300,
  mapPopup: 400,
  mapControl: 500,
} as const;

export type ZIndexToken = typeof zIndexTokens;