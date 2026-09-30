// Cyclone AI Design System - Theme Provider & CSS Variables Generator
import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { colorTokens, semanticSpacing, typographyTokens, elevationTokens, motionTokens, borderRadiusTokens, breakpointTokens, zIndexTokens } from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  colors: typeof colorTokens.semanticLight | typeof colorTokens.semanticDark;
  spacing: typeof semanticSpacing;
  typography: typeof typographyTokens.styles;
  elevation: typeof elevationTokens;
  motion: typeof motionTokens;
  borderRadius: typeof borderRadiusTokens;
  breakpoints: typeof breakpointTokens;
  zIndex: typeof zIndexTokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export function ThemeProvider({ children, defaultMode = 'system', storageKey = 'cyclone-ai-theme' }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as ThemeMode) || defaultMode;
    }
    return defaultMode;
  });

  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const updateResolvedMode = () => {
      if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedMode(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedMode(mode);
      }
    };

    updateResolvedMode();

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedMode);
      return () => mediaQuery.removeEventListener('change', updateResolvedMode);
    }
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = resolvedMode === 'dark' ? colorTokens.semanticDark : colorTokens.semanticLight;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });

    root.setAttribute('data-theme', resolvedMode);
    root.setAttribute('data-theme-mode', mode);

    localStorage.setItem(storageKey, mode);
  }, [mode, resolvedMode, storageKey]);

  const toggleTheme = () => {
    setMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const contextValue = useMemo(() => ({
    mode,
    resolvedMode,
    toggleTheme,
    setTheme,
    colors: resolvedMode === 'dark' ? colorTokens.semanticDark : colorTokens.semanticLight,
    spacing: semanticSpacing,
    typography: typographyTokens.styles,
    elevation: elevationTokens,
    motion: motionTokens,
    borderRadius: borderRadiusTokens,
    breakpoints: breakpointTokens,
    zIndex: zIndexTokens,
  }), [mode, resolvedMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function generateCSSVariables(mode: 'light' | 'dark' = 'dark'): string {
  const colors = mode === 'dark' ? colorTokens.semanticDark : colorTokens.semanticLight;
  let css = ':root {\n';

  Object.entries(colors).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    css += `  --color-${cssKey}: ${value};\n`;
  });

  Object.entries(semanticSpacing).forEach(([key, value]) => {
    if (typeof value === 'string' && (value.endsWith('px') || value.endsWith('rem') || value.endsWith('%'))) {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      css += `  --spacing-${cssKey}: ${value};\n`;
    }
  });

  Object.entries(borderRadiusTokens).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    css += `  --radius-${cssKey}: ${value};\n`;
  });

  Object.entries(zIndexTokens).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    css += `  --z-${cssKey}: ${value};\n`;
  });

  css += '}\n';
  return css;
}

export function cn(...classes: (string | boolean | undefined | null | Record<string, boolean>)[]): string {
  return classes
    .flatMap(cls => {
      if (!cls) return [];
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object') return Object.entries(cls).filter(([, v]) => v).map(([k]) => k);
      return [];
    })
    .join(' ');
}

export type ResponsiveValue<T> = T | { base?: T; sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T };

export function getResponsiveValue<T>(value: ResponsiveValue<T>, breakpoint: 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'base'): T {
  if (typeof value !== 'object' || value === null) return value;
  const breakpoints: ('base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpoints.indexOf(breakpoint);
  const obj = value as Record<string, T | undefined>;
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpoints[i];
    if (bp in obj && obj[bp] !== undefined) return obj[bp]!;
  }
  return obj.base as T;
}

export function fluidType(min: number, max: number, minViewport = 320, maxViewport = 1440): string {
  const slope = (max - min) / (maxViewport - minViewport);
  const intercept = min - slope * minViewport;
  return `clamp(${min}px, ${intercept.toFixed(2)}px + ${(slope * 100).toFixed(2)}vw, ${max}px)`;
}

export type { ThemeMode };