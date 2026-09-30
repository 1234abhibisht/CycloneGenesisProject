// Cyclone AI Design System - Advanced Tooltip Component
import { forwardRef, useState, useRef, useEffect, useId, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../ThemeProvider';
import * as React from 'react';

export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
  delay?: number;
  hideDelay?: number;
  disabled?: boolean;
  interactive?: boolean;
  arrow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      position = 'top',
      delay = 200,
      hideDelay = 100,
      disabled = false,
      interactive = false,
      arrow = true,
      className,
      style,
    },
    _ref
  ) => {
    const [open, setOpen] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const contentId = useId();

    const showTooltip = () => {
      if (disabled) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setOpen(true);
        updatePosition();
      }, delay);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, hideDelay);
    };

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const arrowSize = 8;
      const gap = 8;

      let top = 0;
      let left = 0;

      const positions = position.split('-');
      const mainPos = positions[0];
      const align = positions[1] || 'center';

      switch (mainPos) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - gap - arrowSize;
          if (align === 'start') left = triggerRect.left;
          else if (align === 'end') left = triggerRect.right - tooltipRect.width;
          else left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + gap + arrowSize;
          if (align === 'start') left = triggerRect.left;
          else if (align === 'end') left = triggerRect.right - tooltipRect.width;
          else left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          left = triggerRect.left - tooltipRect.width - gap - arrowSize;
          if (align === 'start') top = triggerRect.top;
          else if (align === 'end') top = triggerRect.bottom - tooltipRect.height;
          else top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          break;
        case 'right':
          left = triggerRect.right + gap + arrowSize;
          if (align === 'start') top = triggerRect.top;
          else if (align === 'end') top = triggerRect.bottom - tooltipRect.height;
          else top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          break;
      }

      const padding = 16;
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      setTooltipPosition({ top, left });
    };

    useEffect(() => {
      if (open) {
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [open, position]);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      };
    }, []);

    if (!children) return null;

    const child = React.Children.only(children);
    const childProps = child.props as HTMLAttributes<HTMLElement>;

    const triggerEvents = {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { showTooltip(); childProps.onMouseEnter?.(e); },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { hideTooltip(); childProps.onMouseLeave?.(e); },
      onFocus: (e: React.FocusEvent<HTMLElement>) => { showTooltip(); childProps.onFocus?.(e); },
      onBlur: (e: React.FocusEvent<HTMLElement>) => { hideTooltip(); childProps.onBlur?.(e); },
      onClick: (e: React.MouseEvent<HTMLElement>) => { if (interactive) showTooltip(); childProps.onClick?.(e); },
      'aria-describedby': open ? contentId : undefined,
    };

    const tooltipStyles: React.CSSProperties = {
      position: 'fixed',
      top: tooltipPosition.top,
      left: tooltipPosition.left,
      zIndex: 1070,
      maxWidth: '320px',
      padding: '8px 12px',
      backgroundColor: 'var(--color-inverse-surface)',
      color: 'var(--color-inverse-on-surface)',
      borderRadius: 'var(--radius-tooltip, 8px)',
      fontSize: 'var(--font-size-sm)',
      lineHeight: 1.4,
      boxShadow: 'var(--elevation-tooltip)',
      pointerEvents: interactive ? 'auto' : 'none',
      opacity: open ? 1 : 0,
      transform: open ? 'scale(1)' : 'scale(0.9)',
      transition: 'opacity 150ms, transform 150ms',
      whiteSpace: 'normal',
    };

    const arrowStyles: React.CSSProperties = arrow ? {
      position: 'absolute',
      width: '12px',
      height: '12px',
      backgroundColor: 'inherit',
      transform: 'rotate(45deg)',
      pointerEvents: 'none',
    } : {};

    const tooltipContent = open && createPortal(
      <div
        ref={tooltipRef}
        id={contentId}
        role="tooltip"
        className={cn('cyclone-tooltip', className)}
        style={{ ...tooltipStyles, ...style }}
        onMouseEnter={interactive ? showTooltip : undefined}
        onMouseLeave={interactive ? hideTooltip : undefined}
      >
        {content}
        {arrow && (
          <div
            className="cyclone-tooltip-arrow"
            style={{
              ...arrowStyles,
              top: position.startsWith('bottom') ? '-6px' : undefined,
              bottom: position.startsWith('top') ? '-6px' : undefined,
              left: position.startsWith('right') ? '-6px' : undefined,
              right: position.startsWith('left') ? '-6px' : undefined,
            }}
            aria-hidden="true"
          />
        )}
      </div>,
      document.body
    );

    const childWithRef = React.cloneElement(child as React.ReactElement<any>, { ref: triggerRef, ...triggerEvents });

    return (
      <>
        {childWithRef}
        {tooltipContent}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;