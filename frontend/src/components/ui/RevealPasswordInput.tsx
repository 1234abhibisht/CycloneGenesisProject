import { useEffect, useRef, useState } from 'react';

/**
 * Password box that shows the last typed character for a moment before turning it into a dot,
 * like a phone keyboard, so the typist can see what was entered. Typing and deleting work at the end
 * of the text (normal for a password); pasting adds the pasted text.
 */
export function RevealPasswordInput({ value, onChange, onEnter, invalid, ariaLabel, placeholder, className }: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  invalid?: boolean;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  const [reveal, setReveal] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const shown = value.length === 0 ? '' : '•'.repeat(value.length - 1) + (reveal ? value.slice(-1) : '•');

  const handle = (typed: string) => {
    let next: string;
    if (typed.length > shown.length) {
      // characters added at the end: everything after the old (masked) text is new
      next = value + typed.slice(shown.length);
      setReveal(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setReveal(false), 900);
    } else {
      next = value.slice(0, typed.length);   // deleted from the end
      setReveal(false);
    }
    onChange(next);
  };

  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      placeholder={placeholder}
      value={shown}
      onChange={(e) => handle(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); } }}
      onSelect={(e) => {           // keep the caret at the end so edits always apply to the end
        const el = e.currentTarget;
        const end = el.value.length;
        if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end);
      }}
      className={className}
    />
  );
}
