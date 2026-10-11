// Cyclone AI Design System - Advanced Tabs Component
import { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '../ThemeProvider';

export interface TabProps {
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  count?: number;
  children: React.ReactNode;
}

export interface TabsProps {
  tabs: TabProps[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  variant?: 'primary' | 'secondary' | 'pills' | 'underline';
  fullWidth?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  style?: React.CSSProperties;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ tabs, defaultIndex = 0, onChange, variant = 'primary', fullWidth = false, orientation = 'horizontal', className, style }, ref) => {
    const [activeIndex, setActiveIndex] = useState(defaultIndex);
    const tabsRef = useRef<HTMLButtonElement[]>([]);
    const indicatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      updateIndicator();
    }, [activeIndex, tabs]);

    const updateIndicator = () => {
      if (variant !== 'underline' || !indicatorRef.current || tabsRef.current.length === 0) return;
      const activeTab = tabsRef.current[activeIndex];
      if (activeTab) {
        const rect = activeTab.getBoundingClientRect();
        const containerRect = activeTab.parentElement?.getBoundingClientRect();
        if (containerRect) {
          indicatorRef.current.style.width = `${rect.width}px`;
          indicatorRef.current.style.left = `${rect.left - containerRect.left}px`;
        }
      }
    };

    const handleTabClick = (index: number) => {
      if (tabs[index].disabled) return;
      setActiveIndex(index);
      onChange?.(index);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;
      if (orientation === 'horizontal') {
        if (e.key === 'ArrowRight') newIndex = (index + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') newIndex = (index - 1 + tabs.length) % tabs.length;
      } else {
        if (e.key === 'ArrowDown') newIndex = (index + 1) % tabs.length;
        else if (e.key === 'ArrowUp') newIndex = (index - 1 + tabs.length) % tabs.length;
      }
      if (e.key === 'Home') newIndex = 0;
      if (e.key === 'End') newIndex = tabs.length - 1;
      if (newIndex !== index && !tabs[newIndex].disabled) {
        e.preventDefault();
        handleTabClick(newIndex);
        tabsRef.current[newIndex]?.focus();
      }
    };

    const baseStyles = {
      display: 'flex',
      flexDirection: orientation === 'horizontal' ? 'column' : 'row',
      width: fullWidth ? '100%' : 'auto',
    } as React.CSSProperties;

    const tabListStyles: React.CSSProperties = {
      display: 'flex',
      gap: variant === 'pills' ? '4px' : 0,
      borderBottom: variant === 'underline' ? '1px solid var(--color-outline-variant)' : 'none',
      padding: variant === 'pills' ? '4px' : 0,
      backgroundColor: variant === 'pills' ? 'var(--color-surface-variant)' : 'transparent',
      borderRadius: variant === 'pills' ? 'var(--radius-card, 16px)' : 0,
      overflow: 'visible',
      position: 'relative',
    };

    const tabStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: variant === 'pills' ? '10px 20px' : '14px 24px',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 500,
      fontFamily: 'inherit',
      color: 'var(--color-on-surface-variant)',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: variant === 'pills' ? 'var(--radius-button, 12px)' : 0,
      cursor: 'pointer',
      transition: 'all 150ms cubic-bezier(0.2, 0, 0, 1)',
      whiteSpace: 'nowrap',
      position: 'relative',
      minWidth: variant === 'underline' ? 'auto' : undefined,
      flex: fullWidth && variant !== 'pills' ? 1 : undefined,
    };

    const activeTabStyles: React.CSSProperties = {
      color: variant === 'secondary' ? 'var(--color-secondary)' : 'var(--color-primary)',
      fontWeight: 600,
    };

    const indicatorStyles: React.CSSProperties = variant === 'underline' ? {
      position: 'absolute',
      bottom: '-1px',
      height: '3px',
      backgroundColor: 'var(--color-primary)',
      borderRadius: '3px 3px 0 0',
      transition: 'all 250ms cubic-bezier(0.2, 0, 0, 1)',
      pointerEvents: 'none',
    } : {};

    const panelStyles: React.CSSProperties = {
      paddingTop: 'var(--spacing-xl)',
      animation: 'fadeIn 200ms cubic-bezier(0.2, 0, 0, 1)',
    };

    return (
      <div ref={ref} className={cn('cyclone-tabs', className)} style={{ ...baseStyles, ...style }}>
        <div role="tablist" aria-orientation={orientation} className="cyclone-tabs-list" style={tabListStyles}>
          {variant === 'underline' && (
            <div ref={indicatorRef} className="cyclone-tabs-indicator" style={indicatorStyles} aria-hidden="true" />
          )}
          {tabs.map((tab, index) => (
            <button
              key={index}
              ref={(el) => { tabsRef.current[index] = el!; }}
              role="tab"
              id={`tab-${index}`}
              aria-selected={activeIndex === index}
              aria-controls={`panel-${index}`}
              aria-disabled={tab.disabled}
              tabIndex={activeIndex === index ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => handleTabClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn('cyclone-tab', activeIndex === index && 'cyclone-tab-active')}
              style={{
                ...tabStyles,
                ...(activeIndex === index ? activeTabStyles : {}),
                opacity: tab.disabled ? 0.5 : 1,
              }}
            >
              {tab.icon && <span style={{ display: 'flex' }} aria-hidden="true">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  backgroundColor: activeIndex === index
                    ? (variant === 'secondary' ? 'var(--color-secondary-container)' : 'var(--color-primary-container)')
                    : 'var(--color-surface-variant)',
                  color: activeIndex === index
                    ? (variant === 'secondary' ? 'var(--color-on-secondary-container)' : 'var(--color-on-primary-container)')
                    : 'var(--color-on-surface-variant)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full, 9999px)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  minWidth: '20px',
                  textAlign: 'center',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${activeIndex}`} aria-labelledby={`tab-${activeIndex}`} className="cyclone-tabs-panel" style={panelStyles}>
          {tabs[activeIndex]?.children}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export default Tabs;