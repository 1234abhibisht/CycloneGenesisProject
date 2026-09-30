// Cyclone AI Design System - Advanced Select Component
import { forwardRef, useState, useId, useRef, useEffect, type SelectHTMLAttributes } from 'react';
import { cn } from '../ThemeProvider';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'filled' | 'outlined' | 'standard';
  fullWidth?: boolean;
  required?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  onChange?: (value: string | string[]) => void;
  renderOption?: (option: SelectOption, selected: boolean) => React.ReactNode;
  renderValue?: (options: SelectOption[]) => React.ReactNode;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      options,
      placeholder = 'Select an option',
      variant = 'outlined',
      fullWidth = false,
      required = false,
      searchable = false,
      multiple = false,
      disabled,
      onChange,
      renderOption,
      renderValue,
      className,
      style,
      id: providedId,
      'aria-describedby': ariaDescribedBy,
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const listboxId = `${id}-listbox`;
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const triggerRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement[]>([]);

    const filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTriggerClick = () => {
      if (!disabled) setOpen(!open);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            selectOption(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Tab':
          setOpen(false);
          break;
        default:
          if (searchable && e.key.length === 1) {
            setSearchQuery(prev => prev + e.key.toLowerCase());
          }
      }
    };

    const selectOption = (option: SelectOption) => {
      if (option.disabled) return;
      if (multiple) {
        const newValues = selectedValues.includes(option.value)
          ? selectedValues.filter(v => v !== option.value)
          : [...selectedValues, option.value];
        setSelectedValues(newValues);
        onChange?.(newValues);
      } else {
        setSelectedValues([option.value]);
        onChange?.(option.value);
        setOpen(false);
      }
      setSearchQuery('');
    };

    const removeValue = (value: string) => {
      const newValues = selectedValues.filter(v => v !== value);
      setSelectedValues(newValues);
      onChange?.(newValues);
    };

    const getSelectedOptions = () => options.filter(opt => selectedValues.includes(opt.value));

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
            listboxRef.current && !listboxRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (open && highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
        optionsRef.current[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex, open]);

    const baseStyles = {
      width: fullWidth ? '100%' : 'auto',
      minWidth: '200px',
      fontFamily: 'inherit',
      position: 'relative',
    } as React.CSSProperties;

    const variantStyles: Record<string, React.CSSProperties> = {
      outlined: {
        padding: '12px 16px',
        border: focused || open ? '2px solid var(--color-primary)' : error ? '1px solid var(--color-error)' : '1px solid var(--color-outline)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-input, 8px)',
      },
      filled: {
        padding: '12px 16px',
        borderBottom: focused || open ? '2px solid var(--color-primary)' : error ? '2px solid var(--color-error)' : '1px solid var(--color-outline)',
        borderRadius: 'var(--radius-input, 8px) var(--radius-input, 8px) 0 0',
        backgroundColor: 'var(--color-surface-variant)',
      },
      standard: {
        padding: '12px 0',
        borderBottom: focused || open ? '2px solid var(--color-primary)' : error ? '2px solid var(--color-error)' : '1px solid var(--color-outline)',
        borderRadius: 0,
        backgroundColor: 'transparent',
      },
    };

    const triggerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none',
      ...variantStyles[variant],
      transition: 'all 150ms cubic-bezier(0.2, 0, 0, 1)',
      minHeight: '48px',
    };

    const listboxStyles: React.CSSProperties = {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      right: 0,
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-outline-variant)',
      borderRadius: 'var(--radius-dropdown, 12px)',
      boxShadow: 'var(--elevation-dropdown)',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 200,
      animation: 'scaleIn 150ms cubic-bezier(0.2, 0, 0, 1)',
    };

    const optionStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'background-color 100ms',
    };

    const describedBy = [error && errorId, hint && hintId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

    const displayValue = renderValue
      ? renderValue(getSelectedOptions())
      : multiple
        ? getSelectedOptions().map(o => o.label).join(', ') || placeholder
        : getSelectedOptions()[0]?.label || placeholder;

    return (
      <div ref={ref} className={cn('cyclone-select-container', className)} style={{ ...baseStyles, ...style }}>
        {label && (
          <label htmlFor={id} className="cyclone-select-label" style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: focused || open ? 'var(--color-primary)' : error ? 'var(--color-error)' : 'var(--color-on-surface-variant)',
            transition: 'color 150ms',
          }}>
            {label}
            {required && <span style={{ color: 'var(--color-error)', marginLeft: '4px' }} aria-hidden="true">*</span>}
          </label>
        )}
        <div
          ref={triggerRef}
          className="cyclone-select-trigger"
          style={triggerStyles}
          onClick={handleTriggerClick}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (!open) setHighlightedIndex(-1); }}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-labelledby={label ? id : undefined}
          aria-describedby={describedBy}
          aria-required={required}
          aria-disabled={disabled}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            {multiple && getSelectedOptions().length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, minWidth: 0 }}>
                {getSelectedOptions().map(opt => (
                  <span key={opt.value} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    backgroundColor: 'var(--color-primary-container)',
                    color: 'var(--color-on-primary-container)',
                    borderRadius: 'var(--radius-full, 9999px)',
                    fontSize: 'var(--font-size-xs)',
                  }}>
                    {opt.label}
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeValue(opt.value); }} style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      lineHeight: 1,
                    }} aria-label={`Remove ${opt.label}`}>
                      <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            {!multiple && (
              <span style={{
                color: selectedValues.length > 0 ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayValue}
              </span>
            )}
            {multiple && getSelectedOptions().length === 0 && (
              <span style={{ color: 'var(--color-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {placeholder}
              </span>
            )}
          </div>
          <ChevronDown className="cyclone-select-chevron" style={{
            width: 20,
            height: 20,
            color: 'var(--color-on-surface-variant)',
            transition: 'transform 150ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            flexShrink: 0,
          }} aria-hidden="true" />
        </div>

        {open && (
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple}
            aria-labelledby={label ? id : undefined}
            className="cyclone-select-listbox"
            style={listboxStyles}
          >
            {searchable && (
              <div style={{ padding: '12px', borderBottom: '1px solid var(--color-outline-variant)', position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setHighlightedIndex(-1); }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--color-outline)',
                    borderRadius: 'var(--radius-input, 8px)',
                    backgroundColor: 'var(--color-surface-variant)',
                    color: 'var(--color-on-surface)',
                    fontSize: 'var(--font-size-sm)',
                    outline: 'none',
                  }}
                />
              </div>
            )}
            <div style={{ maxHeight: searchable ? '260px' : '300px', overflow: 'auto' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    ref={(el) => { optionsRef.current[index] = el!; }}
                    role="option"
                    aria-selected={selectedValues.includes(option.value)}
                    aria-disabled={option.disabled}
                    id={`${listboxId}-${option.value}`}
                    className="cyclone-select-option"
                    style={{
                      ...optionStyles,
                      backgroundColor: highlightedIndex === index ? 'var(--color-surface-variant)' : 'transparent',
                      opacity: option.disabled ? 0.5 : 1,
                    }}
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {option.icon && <span style={{ display: 'flex', color: 'var(--color-on-surface-variant)' }}>{option.icon}</span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: selectedValues.includes(option.value) ? 500 : 400, color: selectedValues.includes(option.value) ? 'var(--color-primary)' : 'var(--color-on-surface)' }}>
                        {renderOption ? renderOption(option, selectedValues.includes(option.value)) : option.label}
                      </span>
                      {option.description && (
                        <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                          {option.description}
                        </span>
                      )}
                    </div>
                    {(multiple && selectedValues.includes(option.value)) || (!multiple && selectedValues[0] === option.value) ? (
                      <Check className="cyclone-select-check" style={{ width: 20, height: 20, color: 'var(--color-primary)', flexShrink: 0 }} aria-hidden="true" />
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {(error || hint) && (
          <div className="cyclone-select-helper" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', minHeight: '20px' }}>
            {error && <span id={errorId} className="cyclone-select-error" style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }} aria-live="polite">{error}</span>}
            {hint && !error && <span id={hintId} className="cyclone-select-hint" style={{ color: 'var(--color-on-surface-variant)' }}>{hint}</span>}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;