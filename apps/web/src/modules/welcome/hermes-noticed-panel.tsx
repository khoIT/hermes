/**
 * HermesNoticedPanel — agent-first demo entry on /welcome.
 *
 * Single observation card surfacing the agent-detected ARPDAU drift. Voice is
 * Variant A · analyst observation-led (locked in plan 260510-2300). Click
 * routes to the agent-first demo thread (thread-demo-agent-livops-2026), which
 * is sibling to the canonical analyst arc and lives on its own demo path.
 *
 * Sits above RecentThreadsPanel — additive surface, does not modify the
 * existing /welcome layout or panels.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Activity } from 'lucide-react';
import { T, Icon } from '../../theme';

const AGENT_THREAD_ID = 'thread-demo-agent-livops-2026';

interface NoticedCard {
  /** Agent timestamp — short, human ("06:14 today", "3h ago"). */
  detectedAt: string;
  /** First line of the observation — the lede. */
  headline: string;
  /** Two-sentence body, observation-led, hedged. Variant A voice. */
  body: string;
  /** CTA label, observation-framed. */
  cta: string;
  /** Route on click. */
  threadId: string;
}

const CARDS: NoticedCard[] = [
  {
    detectedAt: '06:14 today',
    headline: 'CFM ARPDAU is down 7% vs last 4 weeks.',
    body:
      'Traced to mid-skill ranked players hitting loss-streaks ≥ 5 — that bucket grew 3.2× this quarter. ' +
      'ARPPU is flat; this is a conversion problem, not a spend problem.',
    cta: 'Investigate →',
    threadId: AGENT_THREAD_ID,
  },
];

export function HermesNoticedPanel() {
  const navigate = useNavigate();
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${T.n200}`,
      borderRadius: 10,
      padding: '20px 20px 14px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 6,
          background: T.brandSoft, color: T.brand,
        }}>
          <Icon icon={Activity} size={12} />
        </span>
        <h2 style={{
          fontFamily: T.fSans,
          fontSize: 16,
          fontWeight: 600,
          color: T.n950,
          margin: 0,
          letterSpacing: '-0.005em',
        }}>
          Hermes noticed
        </h2>
        <span style={{
          fontFamily: T.fMono, fontSize: 10, color: T.n500,
          background: T.n50, padding: '2px 8px', borderRadius: 4,
          marginLeft: 4, letterSpacing: '0.04em',
        }}>
          AGENT-FIRST DEMO
        </span>
      </div>

      {CARDS.map((c, i) => (
        <NoticedRow key={i} card={c} onClick={() => navigate(`/chat/${c.threadId}`)} />
      ))}
    </div>
  );
}

function NoticedRow({ card, onClick }: { card: NoticedCard; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        display: 'block',
        textAlign: 'left',
        padding: '12px 12px',
        background: hover ? T.n50 : 'transparent',
        border: `1px solid ${hover ? T.brandBorder : T.n100}`,
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: T.fSans,
        transition: 'background .12s, border-color .12s',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        fontSize: 11, color: T.n500, marginBottom: 6,
      }}>
        <span style={{
          fontFamily: T.fMono, color: T.brand, fontWeight: 600,
        }}>
          Hermes
        </span>
        <span>·</span>
        <span>{card.detectedAt}</span>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 600, color: T.n900,
        marginBottom: 4, lineHeight: 1.4,
      }}>
        {card.headline}
      </div>
      <div style={{
        fontSize: 12.5, color: T.n600, lineHeight: 1.55,
        marginBottom: 8,
      }}>
        {card.body}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 12, fontWeight: 500,
        color: hover ? T.brand : T.n700,
      }}>
        {card.cta.replace(' →', '')}
        <Icon icon={ChevronRight} size={13} color={hover ? T.brand : T.n500} />
      </div>
    </button>
  );
}
