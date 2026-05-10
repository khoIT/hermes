/**
 * DeepResearchToggle — visual toggle persisted to localStorage. v1: cosmetic only.
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import { T, Icon } from '../../theme';

const KEY = 'hermes.chat.deepResearch';

export function useDeepResearch(): [boolean, (next: boolean) => void] {
  const [on, setOn] = React.useState(() => {
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  const set = React.useCallback((next: boolean) => {
    setOn(next);
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* no-op */ }
  }, []);
  return [on, set];
}

export function DeepResearchToggle() {
  const [on, setOn] = useDeepResearch();
  return (
    <button
      onClick={() => setOn(!on)}
      aria-pressed={on}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 9999,
        border: `1px solid ${on ? T.brand : T.n200}`,
        background: on ? T.brandSoft : '#fff',
        color: on ? T.brand : T.n600,
        fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', transition: 'all .12s',
      }}
    >
      <Icon icon={Sparkles} size={12} color={on ? T.brand : T.n500} />
      Deep Research
    </button>
  );
}
