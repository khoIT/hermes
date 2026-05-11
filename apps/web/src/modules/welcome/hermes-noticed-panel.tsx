/**
 * HermesNoticedPanel — agent-first inbox on /welcome.
 *
 * Three agent-detected anomaly cards, stacked. Each card routes to a sibling
 * agent-first chat thread (T1 auto-plays). Card timestamps are staggered to
 * imply continuous monitoring. Variant A · analyst observation-led voice
 * (locked in plan 260510-2300).
 *
 * Promoted to full-width row above ActiveCampaignsPanel (plan
 * 260511-1122) — see page.tsx for layout placement.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Activity } from 'lucide-react';
import { T, Icon } from '../../theme';
import { useT } from '../../i18n/i18n-provider';
import type { TranslationKey } from '../../i18n/dictionary';

interface NoticedCard {
  detectedAt: string;
  headlineKey: TranslationKey;
  bodyKey: TranslationKey;
  ctaKey: 'welcome.hermesNoticed.cta';
  threadId: string;
}

const CARDS: NoticedCard[] = [
  {
    detectedAt: '06:14 today',
    headlineKey: 'welcome.hermesNoticed.cardArpdauHeadline',
    bodyKey:     'welcome.hermesNoticed.cardArpdauBody',
    ctaKey:      'welcome.hermesNoticed.cta',
    threadId:    'thread-demo-agent-livops-2026',
  },
  {
    detectedAt: 'yesterday 14:20',
    headlineKey: 'welcome.hermesNoticed.cardD7Headline',
    bodyKey:     'welcome.hermesNoticed.cardD7Body',
    ctaKey:      'welcome.hermesNoticed.cta',
    threadId:    'thread-demo-agent-d7-fb-cohort-2026',
  },
  {
    detectedAt: '2d ago, ongoing',
    headlineKey: 'welcome.hermesNoticed.cardWhaleHeadline',
    bodyKey:     'welcome.hermesNoticed.cardWhaleBody',
    ctaKey:      'welcome.hermesNoticed.cta',
    threadId:    'thread-demo-agent-whale-recall-2026',
  },
];

export function HermesNoticedPanel() {
  const navigate = useNavigate();
  const t = useT();
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
          {t('welcome.hermesNoticed.title')}
        </h2>
        <span style={{
          fontFamily: T.fMono, fontSize: 10, color: T.n500,
          background: T.n50, padding: '2px 8px', borderRadius: 4,
          marginLeft: 4, letterSpacing: '0.04em',
        }}>
          {t('welcome.hermesNoticed.tag')}
        </span>
      </div>

      {CARDS.map((c) => (
        <NoticedRow
          key={c.threadId}
          card={c}
          headline={t(c.headlineKey)}
          body={t(c.bodyKey)}
          cta={t(c.ctaKey)}
          onClick={() => navigate(`/chat/${c.threadId}`)}
        />
      ))}
    </div>
  );
}

function NoticedRow({
  card, headline, body, cta, onClick,
}: { card: NoticedCard; headline: string; body: string; cta: string; onClick: () => void }) {
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
        padding: '10px 12px',
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
        {headline}
      </div>
      <div style={{
        fontSize: 12.5, color: T.n600, lineHeight: 1.55,
        marginBottom: 8,
      }}>
        {body}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 12, fontWeight: 500,
        color: hover ? T.brand : T.n700,
      }}>
        {cta}
        <Icon icon={ChevronRight} size={13} color={hover ? T.brand : T.n500} />
      </div>
    </button>
  );
}
