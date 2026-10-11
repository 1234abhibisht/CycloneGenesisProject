// Cyclone AI Design System - Advanced Card Component
import { forwardRef, useState, type HTMLAttributes } from 'react';
import { cn } from '../ThemeProvider';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass' | 'glass-dark';
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  interactive?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'elevated', elevation = 2, interactive = false, selected = false, onSelect, className, style, onClick, ...props }, ref) => {
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);

    const baseStyles = {
      borderRadius: 'var(--radius-card, 16px)',
      overflow: 'hidden',
      transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
      position: 'relative',
    } as React.CSSProperties;

    const variantStyles: Record<string, React.CSSProperties> = {
      elevated: {
        backgroundColor: 'var(--color-surface)',
        boxShadow: `var(--elevation-level${elevation})`,
        border: 'none',
      },
      outlined: {
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-outline-variant)',
        boxShadow: 'none',
      },
      filled: {
        backgroundColor: 'var(--color-surface-variant)',
        border: 'none',
        boxShadow: 'none',
      },
      glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: 'var(--elevation-glass)',
      },
      'glass-dark': {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'var(--elevation-glass-dark)',
      },
    };

    const interactiveStyles: React.CSSProperties = interactive ? {
      cursor: 'pointer',
      userSelect: 'none',
    } : {};

    const hoverStyles: React.CSSProperties = (hovered || focused) && interactive ? {
      transform: 'translateY(-4px)',
      boxShadow: variant === 'elevated' ? `var(--elevation-level${Math.min(elevation + 2, 5)})` : 'var(--elevation-level3)',
    } : {};

    const selectedStyles: React.CSSProperties = selected ? {
      borderColor: 'var(--color-primary)',
      boxShadow: 'var(--elevation-primary)',
    } : {};

    const focusStyles: React.CSSProperties = focused ? {
      outline: 'none',
      boxShadow: `${variantStyles[variant].boxShadow || ''}, var(--focus-ring)`,
    } : {};

    return (
      <div
        ref={ref}
        className={cn('cyclone-card', className)}
        style={{ ...baseStyles, ...variantStyles[variant], ...interactiveStyles, ...hoverStyles, ...selectedStyles, ...focusStyles, ...style }}
        onClick={interactive ? (e => { onSelect?.(); onClick?.(e); }) : onClick}
        onMouseEnter={() => interactive && setHovered(true)}
        onMouseLeave={() => interactive && setHovered(false)}
        onFocus={() => interactive && setFocused(true)}
        onBlur={() => interactive && setFocused(false)}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        aria-pressed={interactive ? selected : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, style, ...props }, ref) => (
    <div ref={ref} className={cn('cyclone-card-header', className)} style={{ padding: 'var(--spacing-xl)', ...style }} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, style, ...props }, ref) => (
    <h3 ref={ref} className={cn('cyclone-card-title', className)} style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0, ...style }} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardSubtitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className, style, ...props }, ref) => (
    <p ref={ref} className={cn('cyclone-card-subtitle', className)} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-on-surface-variant)', margin: '4px 0 0', ...style }} {...props}>
      {children}
    </p>
  )
);
CardSubtitle.displayName = 'CardSubtitle';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, style, ...props }, ref) => (
    <div ref={ref} className={cn('cyclone-card-content', className)} style={{ padding: 'var(--spacing-xl)', ...style }} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className, style, ...props }, ref) => (
    <div ref={ref} className={cn('cyclone-card-actions', className)} style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-lg) var(--spacing-xl)', borderTop: '1px solid var(--color-outline-variant)', ...style }} {...props}>
      {children}
    </div>
  )
);
CardActions.displayName = 'CardActions';

export const CardMedia = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { aspectRatio?: string }>(
  ({ children, className, style, aspectRatio = '16/9', ...props }, ref) => (
    <div ref={ref} className={cn('cyclone-card-media', className)} style={{ aspectRatio, overflow: 'hidden', ...style }} {...props}>
      {children}
    </div>
  )
);
CardMedia.displayName = 'CardMedia';

export default Card;