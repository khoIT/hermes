/**
 * ChatInputBox — autosizing textarea + Deep Research toggle + Send button.
 * Submit on click or Cmd/Ctrl + Enter. Esc clears focus.
 */
import React from 'react';
import { T } from '../../theme';
import { DeepResearchToggle } from './deep-research-toggle';
import { SendButton } from './send-button';

interface ChatInputBoxProps {
  onSubmit: (text: string) => void;
  /** Show Deep Research toggle (landing only by default). */
  showDeepResearch?: boolean;
  placeholder?: string;
  /** Optional initial value (used after suggested-prompt click). */
  initialValue?: string;
  /** Compact width / paddings (FAB panel reuse). */
  compact?: boolean;
  /** Auto-focus textarea on mount. */
  autoFocus?: boolean;
}

export function ChatInputBox({
  onSubmit,
  showDeepResearch = true,
  placeholder = 'What do you want to know?',
  initialValue = '',
  compact,
  autoFocus,
}: ChatInputBoxProps) {
  const [value, setValue] = React.useState(initialValue);
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (initialValue && initialValue !== value) {
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  React.useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  // Autosize on input
  React.useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 240) + 'px';
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      taRef.current?.blur();
    }
  };

  const disabled = value.trim().length === 0;

  return (
    <div style={{
      width: '100%',
      maxWidth: compact ? '100%' : 820,
      margin: '0 auto',
      background: '#fff',
      border: `1px solid ${T.n200}`,
      borderRadius: 14,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      padding: compact ? '10px 12px 10px' : '14px 16px 12px',
      transition: 'border-color .12s, box-shadow .12s',
    }}>
      <textarea
        ref={taRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={1}
        style={{
          width: '100%', resize: 'none', border: 0, outline: 0,
          fontFamily: T.fSans, fontSize: compact ? 13 : 15,
          color: T.n900, lineHeight: 1.5, background: 'transparent',
          minHeight: 24, maxHeight: 240, overflow: 'auto',
        }}
      />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginTop: 8,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {showDeepResearch && <DeepResearchToggle />}
        </div>
        <SendButton onClick={submit} disabled={disabled} size={compact ? 28 : 32} />
      </div>
    </div>
  );
}
