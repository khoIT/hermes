/**
 * Intent input — sticky textarea + starter chips at the bottom of the rail.
 * On submit, parent dispatches INTENT_SUBMIT (Phase 2) or CHAT_USER_REPLY.
 */
import React from 'react';
import { T } from '../../../../theme';

interface Props {
  onSubmit: (text: string) => void;
  /** Show starter chips only when conversation is empty (intent not yet given). */
  showStarters: boolean;
  placeholder?: string;
}

const STARTERS = [
  { label: 'losing streaks', text: 'Players losing 5+ ranked matches in a row are getting frustrated' },
  { label: 'whales gone dormant', text: 'High-spend whales haven\'t logged in for 14+ days' },
  { label: 'stuck on first match', text: 'New players are stuck on the tutorial / first match' },
  { label: '7-day non-payers', text: '7-day non-payers who play often but haven\'t bought yet' },
];

export const IntentInput: React.FC<Props> = ({ onSubmit, showStarters, placeholder }) => {
  const [text, setText] = React.useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setText('');
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };
  return (
    <div style={{ borderTop: `1px solid ${T.n200}`, background: '#fff', padding: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        border: `1px solid ${T.n300}`, borderRadius: 10, padding: '8px 10px',
        background: '#fff',
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={placeholder ?? 'What outcome do you want to drive?'}
          style={{
            flex: 1, border: 0, outline: 0, resize: 'none',
            fontFamily: T.fSans, fontSize: 13, color: T.n900,
            lineHeight: 1.5, background: 'transparent', minHeight: 36,
          }}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{
            padding: '6px 12px', borderRadius: 8, cursor: text.trim() ? 'pointer' : 'not-allowed',
            background: text.trim() ? T.brand : T.n200,
            color: text.trim() ? '#fff' : T.n500,
            border: 0, fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
          }}
        >
          Send →
        </button>
      </div>
      {showStarters && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
            color: T.n400, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Or try one of these
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STARTERS.map((s) => (
              <button
                key={s.label}
                onClick={() => setText(s.text)}
                style={{
                  padding: '4px 10px', borderRadius: 9999, cursor: 'pointer',
                  background: T.n50, border: `1px solid ${T.n200}`, color: T.n700,
                  fontFamily: T.fSans, fontSize: 11,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
