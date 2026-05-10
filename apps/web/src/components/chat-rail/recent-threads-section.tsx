/**
 * RecentThreadsSection — top 3 chat threads from recent-items-store.
 * Click → opens that thread inline in the rail (caller wires onOpen).
 * Returns null when no recents exist; filters out items whose threadId no
 * longer resolves in the chat store.
 */
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { T, Icon } from '../../theme';
import { getRecent } from '../../utils/recent-items-store';
import { listThreads } from '../../utils/chat-store';
import { useI18n } from '../../i18n/i18n-provider';
import { localizedThreadTitleById } from '../../i18n/use-localized-names';

interface RecentThreadsSectionProps {
  onOpen: (threadId: string) => void;
}

export function RecentThreadsSection({ onOpen }: RecentThreadsSectionProps) {
  const { lang } = useI18n();
  const items = React.useMemo(() => {
    const validIds = new Set(listThreads().map(t => t.id));
    return getRecent('chats').filter(i => validIds.has(i.id)).slice(0, 3);
  }, []);

  if (items.length === 0) return null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <h6 style={subheaderStyle}>RECENT THREADS</h6>
      {items.map(item => {
        const label = localizedThreadTitleById(item.id, item.title, lang);
        return (
          <button
            key={item.id}
            onClick={() => onOpen(item.id)}
            title={label}
            style={rowStyle}
            onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon icon={MessageCircle} size={13} color={T.n500} />
            <span style={{
              flex: 1, minWidth: 0,
              fontFamily: T.fSans, fontSize: 12, color: T.n800,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {truncate(label, 48)}
            </span>
          </button>
        );
      })}
    </section>
  );
}

const subheaderStyle: React.CSSProperties = {
  margin: 0, padding: '0 4px 4px',
  fontFamily: T.fMono, fontSize: 9.5, fontWeight: 600,
  color: T.n400, letterSpacing: '0.04em', textTransform: 'uppercase',
};

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', height: 28, boxSizing: 'border-box',
  padding: '0 8px',
  background: 'transparent', border: 'none', borderRadius: 6,
  cursor: 'pointer', textAlign: 'left',
  transition: 'background .12s',
};

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
