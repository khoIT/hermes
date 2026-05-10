/**
 * CmdKModal — global search modal triggered by Cmd/Ctrl+K.
 * Searches over chat threads, grouped by Today/Yesterday/Last 7d/Older.
 * Keyboard nav: ↑↓ moves focus, Enter opens, Esc closes.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { T, Icon } from '../../theme';
import { listThreads } from '../../utils/chat-store';
import { bucketByDate, BUCKET_LABELS, type DateBucket } from '../../utils/date-buckets';

interface CmdKModalProps {
  open: boolean;
  onClose: () => void;
}

interface ThreadRow {
  id: string;
  title: string;
  updatedAt: string;
}

const ORDERED_BUCKETS: DateBucket[] = ['today', 'yesterday', 'last7Days', 'older'];

export function CmdKModal({ open, onClose }: CmdKModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [focused, setFocused] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const threads = React.useMemo(() => listThreads() as ThreadRow[], [open, query]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.toLowerCase();
    return threads.filter(t => t.title.toLowerCase().includes(q));
  }, [threads, query]);

  const grouped = React.useMemo(() => bucketByDate(filtered, t => t.updatedAt), [filtered]);
  const flat = React.useMemo(
    () => ORDERED_BUCKETS.flatMap(b => grouped[b]),
    [grouped],
  );

  React.useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    setQuery('');
    setFocused(0);
  }, [open]);

  React.useEffect(() => { setFocused(0); }, [query]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (!flat.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused(i => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const t = flat[focused];
      if (t) { navigate(`/chat/${t.id}`); onClose(); }
    }
  };

  let runningIndex = 0;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{
          width: 600, maxWidth: '92vw', maxHeight: 500,
          background: '#fff', borderRadius: 12,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column',
          fontFamily: T.fSans,
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', borderBottom: `1px solid ${T.n200}`,
        }}>
          <Icon icon={Search} size={16} color={T.n500} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search chats..."
            style={{
              flex: 1, border: 0, outline: 0,
              fontFamily: T.fSans, fontSize: 15, color: T.n900,
              background: 'transparent',
            }}
          />
          <kbd style={{
            fontFamily: T.fMono, fontSize: 11, color: T.n500,
            background: T.n100, borderRadius: 4, padding: '2px 6px',
          }}>esc</kbd>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {flat.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: T.n500, fontSize: 13 }}>
              No chats found{query ? ` for “${query}”` : ''}.
            </div>
          ) : (
            ORDERED_BUCKETS.map(bucket => {
              const items = grouped[bucket];
              if (!items.length) return null;
              return (
                <div key={bucket}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: T.n500,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '10px 16px 4px',
                  }}>{BUCKET_LABELS[bucket]}</div>
                  {items.map(t => {
                    const i = runningIndex++;
                    const isActive = i === focused;
                    return (
                      <div
                        key={t.id}
                        onMouseMove={() => setFocused(i)}
                        onClick={() => { navigate(`/chat/${t.id}`); onClose(); }}
                        style={{
                          padding: '8px 16px',
                          background: isActive ? T.brandSoft : 'transparent',
                          color: isActive ? T.brand : T.n900,
                          cursor: 'pointer',
                          fontSize: 13,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderLeft: `3px solid ${isActive ? T.brand : 'transparent'}`,
                        }}
                      >
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
