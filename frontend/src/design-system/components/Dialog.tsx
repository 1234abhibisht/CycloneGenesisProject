// Cyclone AI Design System - Advanced Dialog Component
import { forwardRef, useEffect, useRef, useId, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../ThemeProvider';
import { X } from 'lucide-react';

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'alert' | 'confirmation' | 'form' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      children,
      variant = 'default',
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      footer,
      className,
      style,
    },
    _ref
  ) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
      if (open) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
      } else {
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!open) return;
        if (e.key === 'Escape' && closeOnEscape) {
          onClose();
        }
        if (e.key === 'Tab') {
          const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements || focusableElements.length === 0) return;
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, closeOnEscape, onClose]);

    if (!open) return null;

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { maxWidth: '400px' },
      md: { maxWidth: '560px' },
      lg: { maxWidth: '720px' },
      xl: { maxWidth: '960px' },
      full: { maxWidth: 'calc(100vw - 48px)', width: 'calc(100vw - 48px)' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      alert: { borderLeft: '4px solid var(--color-error)' },
      confirmation: { borderLeft: '4px solid var(--color-primary)' },
      form: { borderLeft: '4px solid var(--color-success)' },
      fullscreen: { borderRadius: 0, maxWidth: 'none', width: '100vw', height: '100vh', maxHeight: '100vh' },
    };

    const overlayStyles: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 1050,
      animation: 'fadeIn 200ms cubic-bezier(0.2, 0, 0, 1)',
    };

    const dialogStyles: React.CSSProperties = {
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-dialog, 24px)',
      boxShadow: 'var(--elevation-modal)',
      maxHeight: 'calc(100vh - 48px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      ...sizeStyles[size],
      ...variantStyles[variant],
      animation: 'scaleIn 200ms cubic-bezier(0.2, 0, 0, 1)',
    };

    const headerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '16px',
      padding: '24px 24px 0',
    };

    const contentStyles: React.CSSProperties = {
      padding: '24px',
      overflow: 'auto',
      flex: 1,
    };

    const footerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '16px 24px 24px',
      borderTop: '1px solid var(--color-outline-variant)',
    };

    const dialogContent = (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn('cyclone-dialog', className)}
        style={{ ...dialogStyles, ...style }}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="cyclone-dialog-header" style={headerStyles}>
            <div>
              {title && (
                <h2 id={titleId} className="cyclone-dialog-title" style={{
                  margin: 0,
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                }}>
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="cyclone-dialog-description" style={{
                  margin: '8px 0 0',
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-on-surface-variant)',
                  lineHeight: 1.5,
                }}>
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="cyclone-dialog-close"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full, 9999px)',
                  backgroundColor: 'var(--color-surface-variant)',
                  border: 'none',
                  color: 'var(--color-on-surface-variant)',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-outline-variant)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-variant)'; }}
                aria-label="Close dialog"
              >
                <X size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div className="cyclone-dialog-content" style={contentStyles}>
          {children}
        </div>
        {footer && (
          <div className="cyclone-dialog-footer" style={footerStyles}>
            {footer}
          </div>
        )}
      </div>
    );

    return createPortal(
      <div
        className="cyclone-dialog-overlay"
        style={overlayStyles}
        onClick={(e) => { if (e.target === e.currentTarget && closeOnOverlayClick) onClose(); }}
        role="presentation"
      >
        {dialogContent}
      </div>,
      document.body
    );
  }
);

Dialog.displayName = 'Dialog';

export default Dialog;