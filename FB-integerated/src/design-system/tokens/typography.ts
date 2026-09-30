// Cyclone AI Design System - Typography Tokens (Material Design 3 + Google Fonts)
export const typographyTokens = {
  // Font Families
  fontFamily: {
    sans: "'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', monospace",
    display: "'Google Sans Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    // Indian language support
    devanagari: "'Noto Sans Devanagari', 'Inter', sans-serif",
    bengali: "'Noto Sans Bengali', 'Inter', sans-serif",
    gujarati: "'Noto Sans Gujarati', 'Inter', sans-serif",
    kannada: "'Noto Sans Kannada', 'Inter', sans-serif",
    malayalam: "'Noto Sans Malayalam', 'Inter', sans-serif",
    oriya: "'Noto Sans Oriya', 'Inter', sans-serif",
    punjabi: "'Noto Sans Gurmukhi', 'Inter', sans-serif",
    tamil: "'Noto Sans Tamil', 'Inter', sans-serif",
    telugu: "'Noto Sans Telugu', 'Inter', sans-serif",
    urdu: "'Noto Nastaliq Urdu', 'Inter', sans-serif",
  },

  // Font Weights
  fontWeight: {
    thin: 100,
    extraLight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800,
    black: 900,
  },

  // Font Sizes (rem based, 1rem = 16px base)
  fontSize: {
    '2xs': '0.625rem',   // 10px
    xs: '0.75rem',       // 12px
    sm: '0.875rem',      // 14px
    base: '1rem',        // 16px
    lg: '1.125rem',      // 18px
    xl: '1.25rem',       // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
    '6xl': '3.75rem',    // 60px
    '7xl': '4.5rem',     // 72px
    '8xl': '6rem',       // 96px
    '9xl': '8rem',       // 128px
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text Styles (Material Design 3 Type Scale)
  styles: {
    // Display Styles
    displayLarge: {
      fontFamily: 'display',
      fontSize: '3.5rem',      // 56px
      fontWeight: 400,
      lineHeight: 1.12,
      letterSpacing: '-0.02em',
    },
    displayMedium: {
      fontFamily: 'display',
      fontSize: '2.8125rem',   // 45px
      fontWeight: 400,
      lineHeight: 1.16,
      letterSpacing: '0',
    },
    displaySmall: {
      fontFamily: 'display',
      fontSize: '2.25rem',     // 36px
      fontWeight: 400,
      lineHeight: 1.22,
      letterSpacing: '0',
    },

    // Headline Styles
    headlineLarge: {
      fontFamily: 'sans',
      fontSize: '2rem',        // 32px
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '0',
    },
    headlineMedium: {
      fontFamily: 'sans',
      fontSize: '1.75rem',     // 28px
      fontWeight: 600,
      lineHeight: 1.29,
      letterSpacing: '0',
    },
    headlineSmall: {
      fontFamily: 'sans',
      fontSize: '1.5rem',      // 24px
      fontWeight: 600,
      lineHeight: 1.33,
      letterSpacing: '0',
    },

    // Title Styles
    titleLarge: {
      fontFamily: 'sans',
      fontSize: '1.375rem',    // 22px
      fontWeight: 600,
      lineHeight: 1.27,
      letterSpacing: '0',
    },
    titleMedium: {
      fontFamily: 'sans',
      fontSize: '1.125rem',    // 18px
      fontWeight: 600,
      lineHeight: 1.33,
      letterSpacing: '0.01em',
    },
    titleSmall: {
      fontFamily: 'sans',
      fontSize: '1rem',        // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },

    // Body Styles
    bodyLarge: {
      fontFamily: 'sans',
      fontSize: '1rem',        // 16px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    bodyMedium: {
      fontFamily: 'sans',
      fontSize: '0.875rem',    // 14px
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.02em',
    },
    bodySmall: {
      fontFamily: 'sans',
      fontSize: '0.75rem',     // 12px
      fontWeight: 400,
      lineHeight: 1.33,
      letterSpacing: '0.04em',
    },

    // Label Styles
    labelLarge: {
      fontFamily: 'sans',
      fontSize: '0.875rem',    // 14px
      fontWeight: 500,
      lineHeight: 1.43,
      letterSpacing: '0.01em',
    },
    labelMedium: {
      fontFamily: 'sans',
      fontSize: '0.75rem',     // 12px
      fontWeight: 500,
      lineHeight: 1.33,
      letterSpacing: '0.05em',
    },
    labelSmall: {
      fontFamily: 'sans',
      fontSize: '0.6875rem',   // 11px
      fontWeight: 500,
      lineHeight: 1.45,
      letterSpacing: '0.05em',
    },

    // Code/Monospace Styles
    codeLarge: {
      fontFamily: 'mono',
      fontSize: '1rem',        // 16px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    codeMedium: {
      fontFamily: 'mono',
      fontSize: '0.875rem',    // 14px
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0',
    },
    codeSmall: {
      fontFamily: 'mono',
      fontSize: '0.75rem',     // 12px
      fontWeight: 400,
      lineHeight: 1.33,
      letterSpacing: '0',
    },

    // Data/Number Styles
    dataLarge: {
      fontFamily: 'mono',
      fontSize: '2.25rem',     // 36px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    dataMedium: {
      fontFamily: 'mono',
      fontSize: '1.5rem',      // 24px
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    dataSmall: {
      fontFamily: 'mono',
      fontSize: '1rem',        // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
  },
} as const;

export type TypographyToken = typeof typographyTokens;