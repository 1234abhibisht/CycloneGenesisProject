// Cyclone AI Design System - Spacing Tokens (8px base grid)
export const spacingTokens = {
  // Base unit: 4px
  0: '0',
  1: '4px',    // 4px
  2: '8px',    // 8px
  3: '12px',   // 12px
  4: '16px',   // 16px
  5: '20px',   // 20px
  6: '24px',   // 24px
  7: '28px',   // 28px
  8: '32px',   // 32px
  9: '36px',   // 36px
  10: '40px',  // 40px
  11: '44px',  // 44px
  12: '48px',  // 48px
  13: '52px',  // 52px
  14: '56px',  // 56px
  15: '60px',  // 60px
  16: '64px',  // 64px
  18: '72px',  // 72px
  20: '80px',  // 80px
  24: '96px',  // 96px
  28: '112px', // 112px
  32: '128px', // 128px
  36: '144px', // 144px
  40: '160px', // 160px
  44: '176px', // 176px
  48: '192px', // 192px
  52: '208px', // 208px
  56: '224px', // 224px
  60: '240px', // 240px
  64: '256px', // 256px
  72: '288px', // 288px
  80: '320px', // 320px
  88: '352px', // 352px
  96: '384px', // 384px
} as const;

// Semantic spacing
export const semanticSpacing = {
  // Component internal spacing
  xs: spacingTokens[1],    // 4px
  sm: spacingTokens[2],    // 8px
  md: spacingTokens[3],    // 12px
  lg: spacingTokens[4],    // 16px
  xl: spacingTokens[6],    // 24px
  '2xl': spacingTokens[8], // 32px
  '3xl': spacingTokens[12], // 48px
  '4xl': spacingTokens[16], // 64px

  // Layout spacing
  pagePadding: spacingTokens[6],      // 24px
  pagePaddingSm: spacingTokens[4],    // 16px
  pagePaddingLg: spacingTokens[8],    // 32px
  sectionGap: spacingTokens[16],      // 64px
  sectionGapSm: spacingTokens[10],    // 40px
  sectionGapLg: spacingTokens[20],    // 80px
  componentGap: spacingTokens[4],     // 16px
  componentGapSm: spacingTokens[2],   // 8px
  componentGapLg: spacingTokens[6],   // 24px
  groupGap: spacingTokens[6],         // 24px
  groupGapSm: spacingTokens[3],       // 12px

  // Container max widths
  containerSm: '640px',
  containerMd: '768px',
  containerLg: '1024px',
  containerXl: '1280px',
  container2xl: '1536px',
  containerFull: '100%',
} as const;

export type SpacingToken = typeof spacingTokens;
export type SemanticSpacing = typeof semanticSpacing;