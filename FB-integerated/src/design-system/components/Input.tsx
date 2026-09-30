// Cyclone AI Design System - Advanced Input Component
import { forwardRef, useState, useId, useEffect, type InputHTMLAttributes } from 'react';
import { cn } from '../ThemeProvider';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: 'filled' | 'outlined' | 'standard';
  fullWidth?: boolean;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      startIcon,
      endIcon,
      variant = 'outlined',
      fullWidth = false,
      required = false,
      disabled,
      readOnly,
      className,
      style,
      id: providedId,
      onFocus,
      onBlur,
      onChange,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const [focused, setFocused] = useState(false);
    const [filled, setFilled] = useState(false);

    useEffect(() => {
      setFilled(!!(props as InputHTMLAttributes<HTMLInputElement>).value || !!(props as InputHTMLAttributes<HTMLInputElement>).defaultValue);
    }, [(props as InputHTMLAttributes<HTMLInputElement>).value, (props as InputHTMLAttributes<HTMLInputElement>).defaultValue]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setFilled(!!e.currentTarget.value);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilled(!!e.target.value);
      onChange?.(e);
    };

    const baseStyles = {
      width: fullWidth ? '100%' : 'auto',
      minWidth: '200px',
      fontFamily: 'inherit',
      fontSize: 'var(--font-size-base)',
      lineHeight: '1.5',
      color: 'var(--color-on-surface)',
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      borderRadius: 'var(--radius-input, 8px)',
      transition: 'all 150ms cubic-bezier(0.2, 0, 0, 1)',
    } as React.CSSProperties;

    const variantStyles: Record<string, React.CSSProperties> = {
      outlined: {
        padding: '12px 16px',
        border: focused ? '2px solid var(--color-primary)' : error ? '1px solid var(--color-error)' : '1px solid var(--color-outline)',
        backgroundColor: 'var(--color-surface)',
      },
      filled: {
        padding: '12px 16px',
        borderBottom: focused ? '2px solid var(--color-primary)' : error ? '2px solid var(--color-error)' : '1px solid var(--color-outline)',
        borderRadius: 'var(--radius-input, 8px) var(--radius-input, 8px) 0 0',
        backgroundColor: focused || filled ? 'var(--color-surface-variant)' : 'transparent',
      },
      standard: {
        padding: '12px 0',
        borderBottom: focused ? '2px solid var(--color-primary)' : error ? '2px solid var(--color-error)' : '1px solid var(--color-outline)',
        borderRadius: 0,
        backgroundColor: 'transparent',
      },
    };

    const containerStyles: React.CSSProperties = {
      display: 'inline-flex',
      flexDirection: 'column',
      gap: '6px',
      width: fullWidth ? '100%' : 'auto',
      position: 'relative',
    };

    const labelStyles: React.CSSProperties = {
      fontSize: 'var(--font-size-sm)',
      fontWeight: 500,
      color: focused ? 'var(--color-primary)' : error ? 'var(--color-error)' : 'var(--color-on-surface-variant)',
      transition: 'color 150ms cubic-bezier(0.2, 0, 0, 1)',
    };

    const inputWrapperStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      ...variantStyles[variant],
    };

    const iconStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-on-surface-variant)',
      pointerEvents: 'none',
    };

    const describedBy = [error && errorId, hint && hintId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('cyclone-input-container', className)} style={containerStyles}>
        {label && (
          <label htmlFor={id} className="cyclone-input-label" style={labelStyles}>
            {label}
            {required && <span style={{ color: 'var(--color-error)', marginLeft: '4px' }} aria-hidden="true">*</span>}
          </label>
        )}
        <div className="cyclone-input-wrapper" style={inputWrapperStyles}>
          {startIcon && <span className="cyclone-input-start-icon" style={{ ...iconStyles, marginRight: '12px' }} aria-hidden="true">{startIcon}</span>}
          <input
            ref={ref}
            id={id}
            className="cyclone-input"
            style={{
              ...baseStyles,
              flex: 1,
              paddingLeft: startIcon ? 0 : undefined,
              paddingRight: endIcon ? 0 : undefined,
            }}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            {...props}
          />
          {endIcon && !error && <span className="cyclone-input-end-icon" style={{ ...iconStyles, marginLeft: '12px' }} aria-hidden="true">{endIcon}</span>}
          {error && <span className="cyclone-input-error-icon" style={{ ...iconStyles, marginLeft: '12px', color: 'var(--color-error)' }} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </span>}
        </div>
        {(error || hint) && (
          <div className="cyclone-input-helper" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', minHeight: '20px' }}>
            {error && <span id={errorId} className="cyclone-input-error" style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }} aria-live="polite">{error}</span>}
            {hint && !error && <span id={hintId} className="cyclone-input-hint" style={{ color: 'var(--color-on-surface-variant)' }}>{hint}</span>}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;