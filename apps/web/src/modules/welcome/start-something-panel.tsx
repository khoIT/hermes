/**
 * Start something panel — 3 CTA rows for users who don't want to chat.
 * Build a segment · Explore data via chat · Launch a campaign.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Send, MessageSquare, ChevronRight } from 'lucide-react';
import type { LucideIcon as LucideIconT } from 'lucide-react';
import { T, Icon } from '../../theme';

interface CtaRow {
  icon: LucideIconT;
  label: string;
  description: string;
  path: string;
}

const ROWS: CtaRow[] = [
  {
    icon: Database,
    label: 'Build a segment',
    description: 'Compose a population from features.',
    path: '/segments/new',
  },
  {
    icon: MessageSquare,
    label: 'Explore data via chat',
    description: 'Ask Hermes a question.',
    path: '/',
  },
  {
    icon: Send,
    label: 'Launch a campaign',
    description: 'Activate over a segment or live event.',
    path: '/campaigns',
  },
];

export function StartSomethingPanel() {
  const navigate = useNavigate();
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.n200}`,
      borderRadius: 10,
      padding: '20px 20px 14px',
    }}>
      <h2 style={{
        fontFamily: T.fSans,
        fontSize: 16,
        fontWeight: 600,
        color: T.n950,
        margin: '0 0 12px',
      }}>
        Start something
      </h2>
      {ROWS.map(r => (
        <Row key={r.path} row={r} onClick={() => navigate(r.path)} />
      ))}
    </div>
  );
}

function Row({ row, onClick }: { row: CtaRow; onClick: () => void }) {
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
        gap: 14,
        padding: '12px 8px',
        background: hover ? T.n50 : 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: T.fSans,
      }}
    >
      <span style={{
        width: 36, height: 36, borderRadius: 9,
        background: T.brandSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon icon={row.icon} size={16} color={T.brand} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block',
          fontSize: 14, fontWeight: 600, color: T.n950,
          marginBottom: 2,
        }}>
          {row.label}
        </span>
        <span style={{
          display: 'block',
          fontSize: 12, color: T.n500, lineHeight: 1.4,
        }}>
          {row.description}
        </span>
      </span>
      <Icon icon={ChevronRight} size={14} color={T.n400} />
    </button>
  );
}
