// Cyclone AI Design System - Advanced Button Component
import { forwardRef, useState, useEffect, useCallback, type ButtonHTMLAttributes } from 'react';
import { cn } from '../ThemeProvider';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'filled-tonal' | 'outlined' | 'text' | 'elevated' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'error' | 'neutral';
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  ripple?: boolean;
  'aria-label'?: string;
}

interface VariantStyle {
  bg: string;
  text: string;
  hoverBg?: string;
  hoverText?: string;
  activeBg?: string;
  border?: string;
  shadow?: { boxShadow: string };
  backdropFilter?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'filled',
      size = 'md',
      color = 'primary',
      loading = false,
      startIcon,
      endIcon,
      fullWidth = false,
      ripple = true,
      disabled,
      className,
      style,
      onClick,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const [rippleState, setRippleState] = useState<{ x: number; y: number; active: boolean } | null>(null);
    const [focusVisible, setFocusVisible] = useState(false);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        setFocusVisible(true);
      }
    }, []);

    const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        setFocusVisible(false);
      }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || disabled || loading) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setRippleState({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      });
    }, [ripple, disabled, loading]);

    const handleMouseUp = useCallback(() => {
      if (rippleState) {
        setRippleState(prev => prev ? { ...prev, active: false } : null);
      }
    }, [rippleState]);

    const handleMouseLeave = useCallback(() => {
      if (rippleState) {
        setRippleState(prev => prev ? { ...prev, active: false } : null);
      }
    }, [rippleState]);

    useEffect(() => {
      if (rippleState && !rippleState.active) {
        const timer = setTimeout(() => setRippleState(null), 300);
        return () => clearTimeout(timer);
      }
    }, [rippleState]);

    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'var(--font-sans, inherit)',
      fontWeight: 500,
      border: 'none',
      borderRadius: 'var(--radius-button, 12px)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 150ms cubic-bezier(0.2, 0, 0, 1)',
      position: 'relative',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      textDecoration: 'none',
      width: fullWidth ? '100%' : 'auto',
    } as React.CSSProperties;

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '6px 16px', fontSize: '0.8125rem', height: '36px', minWidth: '36px', borderRadius: 'var(--radius-button-sm, 8px)' },
      md: { padding: '10px 24px', fontSize: '0.875rem', height: '44px', minWidth: '44px', borderRadius: 'var(--radius-button, 12px)' },
      lg: { padding: '14px 32px', fontSize: '1rem', height: '52px', minWidth: '52px', borderRadius: 'var(--radius-button-lg, 16px)' },
      icon: { padding: '0', width: '44px', height: '44px', borderRadius: 'var(--radius-full, 9999px)' },
    };

    const variantColors: Record<string, Record<string, Record<string, VariantStyle>>> = {
      light: {
        primary: {
          filled: { bg: 'var(--color-primary)', text: 'var(--color-on-primary)', hoverBg: 'var(--color-primary-container)', activeBg: 'var(--color-primary-container)' },
          'filled-tonal': { bg: 'var(--color-primary-container)', text: 'var(--color-on-primary-container)', hoverBg: 'var(--color-primary)', hoverText: 'var(--color-on-primary)', activeBg: 'var(--color-primary)' },
          outlined: { bg: 'transparent', text: 'var(--color-primary)', border: '1px solid var(--color-primary)', hoverBg: 'var(--color-primary-container)' },
          text: { bg: 'transparent', text: 'var(--color-primary)', hoverBg: 'var(--color-primary-container)' },
          elevated: { bg: 'var(--color-primary)', text: 'var(--color-on-primary)', shadow: { boxShadow: 'var(--elevation-primary)' } },
          glass: { bg: 'rgba(255,255,255,0.1)', text: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' },
        },
        secondary: {
          filled: { bg: 'var(--color-secondary)', text: 'var(--color-on-secondary)', hoverBg: 'var(--color-secondary-container)', activeBg: 'var(--color-secondary-container)' },
          'filled-tonal': { bg: 'var(--color-secondary-container)', text: 'var(--color-on-secondary-container)', hoverBg: 'var(--color-secondary)', hoverText: 'var(--color-on-secondary)', activeBg: 'var(--color-secondary)' },
          outlined: { bg: 'transparent', text: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', hoverBg: 'var(--color-secondary-container)' },
          text: { bg: 'transparent', text: 'var(--color-secondary)', hoverBg: 'var(--color-secondary-container)' },
          elevated: { bg: 'var(--color-secondary)', text: 'var(--color-on-secondary)', shadow: { boxShadow: 'var(--elevation-secondary)' } },
          glass: { bg: 'rgba(255,255,255,0.1)', text: 'var(--color-secondary)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' },
        },
        tertiary: {
          filled: { bg: 'var(--color-tertiary)', text: 'var(--color-on-tertiary)', hoverBg: 'var(--color-tertiary-container)', activeBg: 'var(--color-tertiary-container)' },
          'filled-tonal': { bg: 'var(--color-tertiary-container)', text: 'var(--color-on-tertiary-container)', hoverBg: 'var(--color-tertiary)', hoverText: 'var(--color-on-tertiary)', activeBg: 'var(--color-tertiary)' },
          outlined: { bg: 'transparent', text: 'var(--color-tertiary)', border: '1px solid var(--color-tertiary)', hoverBg: 'var(--color-tertiary-container)' },
          text: { bg: 'transparent', text: 'var(--color-tertiary)', hoverBg: 'var(--color-tertiary-container)' },
          elevated: { bg: 'var(--color-tertiary)', text: 'var(--color-on-tertiary)', shadow: { boxShadow: 'var(--elevation-tertiary)' } },
          glass: { bg: 'rgba(255,255,255,0.1)', text: 'var(--color-tertiary)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' },
        },
        success: {
          filled: { bg: 'var(--color-success)', text: 'var(--color-on-success)', hoverBg: 'var(--color-success-container)', activeBg: 'var(--color-success-container)' },
          'filled-tonal': { bg: 'var(--color-success-container)', text: 'var(--color-on-success-container)', hoverBg: 'var(--color-success)', hoverText: 'var(--color-on-success)', activeBg: 'var(--color-success)' },
          outlined: { bg: 'transparent', text: 'var(--color-success)', border: '1px solid var(--color-success)', hoverBg: 'var(--color-success-container)' },
          text: { bg: 'transparent', text: 'var(--color-success)', hoverBg: 'var(--color-success-container)' },
          elevated: { bg: 'var(--color-success)', text: 'var(--color-on-success)', shadow: { boxShadow: 'var(--elevation-success)' } },
          glass: { bg: 'rgba(255,255,255,0.1)', text: 'var(--color-success)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' },
        },
        error: {
          filled: { bg: 'var(--color-error)', text: 'var(--color-on-error)', hoverBg: 'var(--color-error-container)', activeBg: 'var(--color-error-container)' },
          'filled-tonal': { bg: 'var(--color-error-container)', text: 'var(--color-on-error-container)', hoverBg: 'var(--color-error)', hoverText: 'var(--color-on-error)', activeBg: 'var(--color-error)' },
          outlined: { bg: 'transparent', text: 'var(--color-error)', border: '1px solid var(--color-error)', hoverBg: 'var(--color-error-container)' },
          text: { bg: 'transparent', text: 'var(--color-error)', hoverBg: 'var(--color-error-container)' },
          elevated: { bg: 'var(--color-error)', text: 'var(--color-on-error)', shadow: { boxShadow: 'var(--elevation-tertiary)' } },
          glass: { bg: 'rgba(255,255,255,0.1)', text: 'var(--color-error)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' },
        },
        neutral: {
          filled: { bg: 'var(--color-surface-variant)', text: 'var(--color-on-surface-variant)', hoverBg: 'var(--color-outline-variant)', activeBg: 'var(--color-outline)' },
          'filled-tonal': { bg: 'var(--color-surface-variant)', text: 'var(--color-on-surface-variant)', hoverBg: 'var(--color-outline-variant)', activeBg: 'var(--color-outline)' },
          outlined: { bg: 'transparent', text: 'var(--color-on-surface)', border: '1px solid var(--color-outline)', hoverBg: 'var(--color-surface-variant)' },
          text: { bg: 'transparent', text: 'var(--color-on-surface)', hoverBg: 'var(--color-surface-variant)' },
          elevated: { bg: 'var(--color-surface)', text: 'var(--color-on-surface)', shadow: { boxShadow: 'var(--elevation-level3)' } },
          glass: { bg: 'rgba(255,255,255,0.1)', text: 'var(--color-on-surface)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' },
        },
      },
      dark: {
        primary: {
          filled: { bg: 'var(--color-primary)', text: 'var(--color-on-primary)', hoverBg: 'var(--color-primary-container)', activeBg: 'var(--color-primary-container)' },
          'filled-tonal': { bg: 'var(--color-primary-container)', text: 'var(--color-on-primary-container)', hoverBg: 'var(--color-primary)', hoverText: 'var(--color-on-primary)', activeBg: 'var(--color-primary)' },
          outlined: { bg: 'transparent', text: 'var(--color-primary)', border: '1px solid var(--color-primary)', hoverBg: 'var(--color-primary-container)' },
          text: { bg: 'transparent', text: 'var(--color-primary)', hoverBg: 'var(--color-primary-container)' },
          elevated: { bg: 'var(--color-primary)', text: 'var(--color-on-primary)', shadow: { boxShadow: 'var(--elevation-primary)' } },
          glass: { bg: 'rgba(255,255,255,0.08)', text: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' },
        },
        secondary: {
          filled: { bg: 'var(--color-secondary)', text: 'var(--color-on-secondary)', hoverBg: 'var(--color-secondary-container)', activeBg: 'var(--color-secondary-container)' },
          'filled-tonal': { bg: 'var(--color-secondary-container)', text: 'var(--color-on-secondary-container)', hoverBg: 'var(--color-secondary)', hoverText: 'var(--color-on-secondary)', activeBg: 'var(--color-secondary)' },
          outlined: { bg: 'transparent', text: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', hoverBg: 'var(--color-secondary-container)' },
          text: { bg: 'transparent', text: 'var(--color-secondary)', hoverBg: 'var(--color-secondary-container)' },
          elevated: { bg: 'var(--color-secondary)', text: 'var(--color-on-secondary)', shadow: { boxShadow: 'var(--elevation-secondary)' } },
          glass: { bg: 'rgba(255,255,255,0.08)', text: 'var(--color-secondary)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' },
        },
        tertiary: {
          filled: { bg: 'var(--color-tertiary)', text: 'var(--color-on-tertiary)', hoverBg: 'var(--color-tertiary-container)', activeBg: 'var(--color-tertiary-container)' },
          'filled-tonal': { bg: 'var(--color-tertiary-container)', text: 'var(--color-on-tertiary-container)', hoverBg: 'var(--color-tertiary)', hoverText: 'var(--color-on-tertiary)', activeBg: 'var(--color-tertiary)' },
          outlined: { bg: 'transparent', text: 'var(--color-tertiary)', border: '1px solid var(--color-tertiary)', hoverBg: 'var(--color-tertiary-container)' },
          text: { bg: 'transparent', text: 'var(--color-tertiary)', hoverBg: 'var(--color-tertiary-container)' },
          elevated: { bg: 'var(--color-tertiary)', text: 'var(--color-on-tertiary)', shadow: { boxShadow: 'var(--elevation-tertiary)' } },
          glass: { bg: 'rgba(255,255,255,0.08)', text: 'var(--color-tertiary)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' },
        },
        success: {
          filled: { bg: 'var(--color-success)', text: 'var(--color-on-success)', hoverBg: 'var(--color-success-container)', activeBg: 'var(--color-success-container)' },
          'filled-tonal': { bg: 'var(--color-success-container)', text: 'var(--color-on-success-container)', hoverBg: 'var(--color-success)', hoverText: 'var(--color-on-success)', activeBg: 'var(--color-success)' },
          outlined: { bg: 'transparent', text: 'var(--color-success)', border: '1px solid var(--color-success)', hoverBg: 'var(--color-success-container)' },
          text: { bg: 'transparent', text: 'var(--color-success)', hoverBg: 'var(--color-success-container)' },
          elevated: { bg: 'var(--color-success)', text: 'var(--color-on-success)', shadow: { boxShadow: 'var(--elevation-success)' } },
          glass: { bg: 'rgba(255,255,255,0.08)', text: 'var(--color-success)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' },
        },
        error: {
          filled: { bg: 'var(--color-error)', text: 'var(--color-on-error)', hoverBg: 'var(--color-error-container)', activeBg: 'var(--color-error-container)' },
          'filled-tonal': { bg: 'var(--color-error-container)', text: 'var(--color-on-error-container)', hoverBg: 'var(--color-error)', hoverText: 'var(--color-on-error)', activeBg: 'var(--color-error)' },
          outlined: { bg: 'transparent', text: 'var(--color-error)', border: '1px solid var(--color-error)', hoverBg: 'var(--color-error-container)' },
          text: { bg: 'transparent', text: 'var(--color-error)', hoverBg: 'var(--color-error-container)' },
          elevated: { bg: 'var(--color-error)', text: 'var(--color-on-error)', shadow: { boxShadow: 'var(--elevation-tertiary)' } },
          glass: { bg: 'rgba(255,255,255,0.08)', text: 'var(--color-error)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' },
        },
        neutral: {
          filled: { bg: 'var(--color-surface-variant)', text: 'var(--color-on-surface-variant)', hoverBg: 'var(--color-outline-variant)', activeBg: 'var(--color-outline)' },
          'filled-tonal': { bg: 'var(--color-surface-variant)', text: 'var(--color-on-surface-variant)', hoverBg: 'var(--color-outline-variant)', activeBg: 'var(--color-outline)' },
          outlined: { bg: 'transparent', text: 'var(--color-on-surface)', border: '1px solid var(--color-outline)', hoverBg: 'var(--color-surface-variant)' },
          text: { bg: 'transparent', text: 'var(--color-on-surface)', hoverBg: 'var(--color-surface-variant)' },
          elevated: { bg: 'var(--color-surface)', text: 'var(--color-on-surface)', shadow: { boxShadow: 'var(--elevation-level3-dark)' } },
          glass: { bg: 'rgba(255,255,255,0.08)', text: 'var(--color-on-surface)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' },
        },
      },
    };

    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const colors = variantColors[theme][color][variant];

    const computedStyle: React.CSSProperties = {
      ...baseStyles,
      ...sizeStyles[size],
      backgroundColor: colors.bg,
      color: colors.text,
      border: colors.border || 'none',
      boxShadow: colors.shadow?.boxShadow || (variant === 'elevated' ? 'var(--elevation-level3)' : 'none'),
      backdropFilter: colors.backdropFilter,
      WebkitBackdropFilter: colors.backdropFilter,
      opacity: disabled || loading ? 0.6 : 1,
    };

    if (focusVisible) {
      computedStyle.boxShadow = `${computedStyle.boxShadow}, var(--focus-ring)`;
    }

    const rippleStyle: React.CSSProperties = rippleState ? {
      position: 'absolute',
      left: rippleState.x,
      top: rippleState.y,
      width: '24px',
      height: '24px',
      marginLeft: '-12px',
      marginTop: '-12px',
      borderRadius: '50%',
      backgroundColor: 'currentColor',
      opacity: rippleState.active ? 0.15 : 0,
      transform: rippleState.active ? 'scale(1)' : 'scale(15)',
      transition: 'transform 400ms cubic-bezier(0.2, 0, 0, 1), opacity 300ms cubic-bezier(0.2, 0, 0, 1)',
      pointerEvents: 'none',
    } : {};

    return (
      <button
        ref={ref}
        className={cn('cyclone-button', className)}
        style={{ ...computedStyle, ...style }}
        disabled={disabled || loading}
        onClick={onClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onFocus={() => setFocusVisible(true)}
        onBlur={() => setFocusVisible(false)}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        type={props.type || 'button'}
        {...props}
      >
        {ripple && rippleState && <span className="cyclone-button-ripple" style={rippleStyle} />}
        {loading && (
          <svg className="cyclone-button-spinner" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }} />
          </svg>
        )}
        {!loading && startIcon && <span className="cyclone-button-start-icon" aria-hidden="true">{startIcon}</span>}
        <span className="cyclone-button-content">{children}</span>
        {!loading && endIcon && <span className="cyclone-button-end-icon" aria-hidden="true">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;