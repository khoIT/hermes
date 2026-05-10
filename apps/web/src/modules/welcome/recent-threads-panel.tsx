/**
 * Recent threads panel — last 5 chat threads sorted by updatedAt desc.
 * Replaces the reference's 'Anomalies' panel (we have no anomaly module).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { T, Icon } from '../../theme';
import { listThreads } from '../../utils/chat-store';
import { useT } from '../../i18n/i18n-provider';

interface ThreadEntry {
  id: string;
  title: string;
  updatedAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 60 * 60_000) return `${Math.round(diffMs / 60_000)}m ago`;
  if (diffMs < DAY_MS) return `${Math.round(diffMs / 3_600_000)}h ago`;
  if (diffMs < 2 * DAY_MS) return 'yesterday';
  if (diffMs < 7 * DAY_MS) return `${Math.round(diffMs / DAY_MS)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function RecentThreadsPanel() {
  const navigate = useNavigate();
  const t = useT();
  const [threads, setThreads] = React.useState<ThreadEntry[]>([]);

  React.useEffect(() => {
    const all = listThreads()
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);
    setThreads(all);
  }, []);

  return (
    <div
      data-hermes-surface="card"
      style={{
        background: T.surface,
        border: `1px solid ${T.n200}`,
        borderRadius: 10,
        padding: '20px 20px 14px',
      }}
    >
      <h2 style={{
        fontFamily: T.fSans,
        fontSize: 16,
        fontWeight: 600,
        color: T.n950,
        margin: '0 0 12px',
      }}>
        {t('welcome.recentThreads.title')}
      </h2>
      {threads.length === 0 ? (
        <div style={{
          padding: '20px 8px',
          color: T.n500,
          fontSize: 13,
          fontFamily: T.fSans,
        }}>
          {t('welcome.recentThreads.empty')}
        </div>
      ) : (
        threads.map(t => (
          <Row key={t.id} thread={t} onClick={() => navigate(`/chat/${t.id}`)} />
        ))
      )}
    </div>
  );
}

function Row({ thread, onClick }: { thread: ThreadEntry; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 8px',
        background: hover ? T.n50 : 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: T.fSans,
      }}
    >
      <Icon icon={MessageSquare} size={14} color={T.n500} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block',
          fontSize: 13, fontWeight: 500, color: T.n900,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 1,
        }}>
          {thread.title}
        </span>
        <span style={{
          display: 'block',
          fontSize: 11, color: T.n500,
        }}>
          {relativeTime(thread.updatedAt)}
        </span>
      </span>
      <Icon icon={ChevronRight} size={13} color={T.n400} />
    </button>
  );
}
