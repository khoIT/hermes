/**
 * ArchetypeCard — renders one intervention archetype for patterns screen (17).
 * Shows: name, origin game, lift band, portfolio uses, predicate + action template,
 * cross-game lineage timeline.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../theme';
import type { InterventionArchetype } from '../../../data/catalog/intervention-archetypes';

const GOAL_COLORS: Record<string, { bg: string; fg: string } | undefined> = {
  retain:     { bg: T.brandSoft,  fg: T.brand    },
  revenue:    { bg: T.greenSoft,  fg: T.green600 },
  reactivate: { bg: T.blueSoft,   fg: T.blue600  },
  recruit:    { bg: T.purpleSoft, fg: T.purple500 },
};

interface Props {
  archetype: InterventionArchetype;
}

export function ArchetypeCard({ archetype: a }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const gc = (GOAL_COLORS[a.goal4r] ?? GOAL_COLORS.retain)!;

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`,
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Card header */}
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.n100}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontFamily: T.fDisp, fontSize: 18, textTransform: 'uppercase', color: T.n900 }}>
                {a.name}
              </span>
              <span style={{
                fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
                background: gc.bg, color: gc.fg,
                borderRadius: 9999, padding: '2px 8px',
              }}>
                {a.goal4r}
              </span>
            </div>
            <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600, marginBottom: 6 }}>
              {a.description}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <StatPill label="Origin" value={a.originGame} />
              <StatPill label="Lift band" value={a.liftBand} color={T.green600} />
              <StatPill label="Portfolio uses" value={String(a.portfolioUses)} />
              {a.triggerEvent && <StatPill label="Trigger" value={a.triggerEvent} mono />}
            </div>
          </div>
          <button
            onClick={() => navigate(`/campaigns/new/realtime?archetype=${a.id}`)}
            style={{
              fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
              background: T.brand, color: '#fff',
              border: 'none', borderRadius: 7,
              padding: '7px 14px', cursor: 'pointer',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            Use in campaign
          </button>
        </div>
      </div>

      {/* Predicate + action template */}
      <div style={{ padding: '12px 18px', background: T.n50, borderBottom: `1px solid ${T.n100}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              Predicate template
            </div>
            <div style={{
              fontFamily: T.fMono, fontSize: 11, color: T.n800,
              background: '#fff', border: `1px solid ${T.n200}`,
              borderRadius: 6, padding: '6px 10px', lineHeight: 1.6,
            }}>
              {a.predicateTemplate}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              Action template
            </div>
            <div style={{
              fontFamily: T.fSans, fontSize: 12, color: T.n700,
              background: '#fff', border: `1px solid ${T.n200}`,
              borderRadius: 6, padding: '6px 10px', lineHeight: 1.6,
            }}>
              {a.actionTemplate}
            </div>
          </div>
        </div>
      </div>

      {/* Key features chips */}
      <div style={{ padding: '10px 18px', display: 'flex', flexWrap: 'wrap', gap: 6, borderBottom: `1px solid ${T.n100}` }}>
        <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, fontWeight: 600, alignSelf: 'center', marginRight: 4 }}>
          Key features:
        </span>
        {a.keyFeatures.map(f => (
          <span key={f} style={{
            fontFamily: T.fMono, fontSize: 11, color: T.n700,
            background: T.n100, border: `1px solid ${T.n200}`,
            borderRadius: 4, padding: '2px 7px',
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* Lineage timeline — collapsible */}
      <div style={{ padding: '10px 18px' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n600,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span>{expanded ? '▼' : '▶'}</span>
          Cross-game lineage ({a.lineage.length} campaigns)
        </button>

        {expanded && (
          <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: `2px solid ${T.n200}` }}>
            {a.lineage.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 9999,
                  background: T.green600, flexShrink: 0,
                  marginLeft: -17,
                }} />
                <span style={{
                  fontFamily: T.fMono, fontSize: 12, color: T.blue600, cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                  onClick={() => navigate(`/campaigns/${l.campaignId}`)}
                >
                  {l.campaignId}
                </span>
                <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>{l.game}</span>
                <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.green600, fontWeight: 600 }}>
                  {l.liftObserved}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontFamily: T.fSans, fontSize: 9, fontWeight: 700, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
      <span style={{
        fontFamily: mono ? T.fMono : T.fSans,
        fontSize: 12, fontWeight: 600,
        color: color ?? T.n800,
      }}>
        {value}
      </span>
    </div>
  );
}
