/**
 * 13 — Campaign Journey (cmp_journey)
 * Read-only multi-step orchestration graph using static SVG layout.
 * Nodes: Trigger/Segment seed → Step nodes (Condition/Wait/Split/Action) → Goal/Exit.
 * Each Split branch shows "Export this branch as a segment →" CTA.
 * Per PRD §9.7. No drag-drop — v1 read-only render.
 */
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { T } from '../../theme';
import { allCampaigns } from '../../data/catalog/campaigns';

// ── Node layout definitions ──────────────────────────────────────────────────
interface NodeDef {
  id: string;
  type: 'trigger' | 'action' | 'wait' | 'condition' | 'goal' | 'exit';
  label: string;
  x: number;
  y: number;
  branch?: 'yes' | 'no';
  branchLabel?: string;
}

interface EdgeDef {
  from: string;
  to: string;
  label?: string;
  isBranch?: boolean;
}

// Static layout for cmp-cfm-407 (Pass Stuck Rescue anchor campaign)
const CFM407_NODES: NodeDef[] = [
  { id: 'trigger',    type: 'trigger',   label: 'event_match_end\nloss streak ≥ 3',    x: 300, y: 40  },
  { id: 'action-ab',  type: 'action',    label: 'IAM A/B\nMMR Shield · XP Boost',       x: 300, y: 140 },
  { id: 'wait-24h',   type: 'wait',      label: 'Wait 24h',                              x: 300, y: 240 },
  { id: 'condition',  type: 'condition', label: 'event_match_end\noutcome = win?',        x: 300, y: 340 },
  { id: 'goal',       type: 'goal',      label: 'Goal: Recovered\nD1 retention +8.2%',   x: 180, y: 460 },
  { id: 'exit',       type: 'exit',      label: 'Exit: No recovery\nmeasure holdout',     x: 420, y: 460 },
];

const CFM407_EDGES: EdgeDef[] = [
  { from: 'trigger',   to: 'action-ab' },
  { from: 'action-ab', to: 'wait-24h'  },
  { from: 'wait-24h',  to: 'condition' },
  { from: 'condition', to: 'goal',     label: 'Yes', isBranch: true },
  { from: 'condition', to: 'exit',     label: 'No',  isBranch: true },
];

// Layout for cmp-tf-001 (hybrid journey)
const TF001_NODES: NodeDef[] = [
  { id: 'seed',   type: 'trigger',   label: 'Segment seed\nReturning coaches',          x: 300, y: 40  },
  { id: 'login',  type: 'trigger',   label: 'event_login\n14d cooldown',                x: 460, y: 40  },
  { id: 'iam0',   type: 'action',    label: 'IAM "Welcome back\ncoach"',                 x: 300, y: 140 },
  { id: 'w24',    type: 'wait',      label: 'Wait 24h',                                  x: 300, y: 220 },
  { id: 'c1',     type: 'condition', label: 'session_count_1d > 0?',                    x: 300, y: 300 },
  { id: 'push1',  type: 'action',    label: 'Push "Your team\'s\nwaiting"',              x: 460, y: 380 },
  { id: 'w48',    type: 'wait',      label: 'Wait 48h',                                  x: 300, y: 380 },
  { id: 'goal14', type: 'goal',      label: 'Day 14: ranked\nmatches ≥ 5 → Activated', x: 300, y: 460 },
];

const TF001_EDGES: EdgeDef[] = [
  { from: 'seed',  to: 'iam0'  },
  { from: 'login', to: 'iam0'  },
  { from: 'iam0',  to: 'w24'   },
  { from: 'w24',   to: 'c1'    },
  { from: 'c1',    to: 'w48',   label: 'Yes', isBranch: true },
  { from: 'c1',    to: 'push1', label: 'No',  isBranch: true },
  { from: 'push1', to: 'goal14' },
  { from: 'w48',   to: 'goal14' },
];

const NODE_TYPE_COLORS: Record<string, { bg: string; fg: string; border: string } | undefined> = {
  trigger:   { bg: T.brandSoft,  fg: T.brand,    border: T.brandBorder },
  action:    { bg: '#fff',       fg: T.n800,     border: T.n300        },
  wait:      { bg: T.n50,        fg: T.n600,     border: T.n200        },
  condition: { bg: T.amberSoft,  fg: '#92400e',  border: T.amber500    },
  goal:      { bg: T.greenSoft,  fg: T.green600, border: '#a7f3d0'     },
  exit:      { bg: T.n100,       fg: T.n500,     border: T.n300        },
};

const SVG_WIDTH  = 640;
const SVG_HEIGHT = 560;
const NODE_W = 160;
const NODE_H = 52;

// ── Component ────────────────────────────────────────────────────────────────
export default function CampaignJourneyPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exportPanel, setExportPanel] = React.useState<string | null>(null);

  const campaign = allCampaigns.find(c => c.id === id);
  const isHybrid = campaign?.triggerType === 'hybrid';
  const nodes    = isHybrid ? TF001_NODES : CFM407_NODES;
  const edges    = isHybrid ? TF001_EDGES : CFM407_EDGES;

  // Build node lookup for edge rendering
  const nodeMap = React.useMemo(
    () => new Map(nodes.map(n => [n.id, n])),
    [nodes]
  );

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Header */}
      <div style={{ padding: '24px 40px', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          04 · Campaign · Journey
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: T.fDisp, fontSize: 32, textTransform: 'uppercase', color: T.n950, lineHeight: 1 }}>
            {campaign?.displayName ?? id} — Journey
          </div>
          <span style={{
            fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
            background: T.n100, border: `1px solid ${T.n200}`, borderRadius: 5,
            padding: '3px 10px',
          }}>
            Read-only · v1
          </span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <Link
            to={`/campaigns/${id}`}
            style={{ fontFamily: T.fSans, fontSize: 12, color: T.blue600, textDecoration: 'none' }}
          >
            ← Back to monitoring
          </Link>
        </div>
      </div>

      {/* Journey SVG canvas */}
      <div style={{ padding: '32px 40px' }}>
        <div style={{
          background: '#fff', border: `1px solid ${T.n200}`,
          borderRadius: 12, padding: 24, display: 'inline-block',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ overflow: 'visible' }}>
            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodeMap.get(e.from);
              const to   = nodeMap.get(e.to);
              if (!from || !to) return null;
              const x1 = from.x + NODE_W / 2;
              const y1 = from.y + NODE_H;
              const x2 = to.x   + NODE_W / 2;
              const y2 = to.y;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              return (
                <g key={i}>
                  <path
                    d={`M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`}
                    fill="none"
                    stroke={e.isBranch ? T.amber500 : T.n300}
                    strokeWidth={e.isBranch ? 1.5 : 1.5}
                    strokeDasharray={e.isBranch ? '4 3' : undefined}
                    markerEnd="url(#arrow)"
                  />
                  {e.label && (
                    <text x={mx} y={my - 4}
                      textAnchor="middle"
                      style={{ fontFamily: T.fSans, fontSize: 10, fill: T.amber500, fontWeight: 700 }}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Arrow marker */}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={T.n400} />
              </marker>
            </defs>

            {/* Nodes */}
            {nodes.map(n => {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const c = (NODE_TYPE_COLORS[n.type] ?? NODE_TYPE_COLORS.action)!;
              const lines = n.label.split('\n');
              const isCondition = n.type === 'condition';
              return (
                <g key={n.id}>
                  <rect
                    x={n.x} y={n.y}
                    width={NODE_W} height={NODE_H}
                    rx={isCondition ? 8 : 8}
                    fill={c.bg}
                    stroke={c.border}
                    strokeWidth={1.5}
                  />
                  {/* Type label */}
                  <text x={n.x + 8} y={n.y + 13}
                    style={{ fontFamily: T.fSans, fontSize: 9, fill: c.fg, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                  >
                    {n.type}
                  </text>
                  {/* Main label */}
                  {lines.map((line, li) => (
                    <text key={li}
                      x={n.x + NODE_W / 2} y={n.y + 26 + li * 13}
                      textAnchor="middle"
                      style={{ fontFamily: T.fSans, fontSize: 10, fill: c.fg }}
                    >
                      {line}
                    </text>
                  ))}
                  {/* Per-node lifecycle indicators */}
                  <g transform={`translate(${n.x + NODE_W - 44}, ${n.y + 4})`}>
                    {(['✏', '⎘', '⏸'] as const).map((icon, ii) => (
                      <text key={ii} x={ii * 14} y={10}
                        style={{ fontSize: 9, fill: T.n400, cursor: 'pointer' }}
                      >
                        <title>{(['Edit', 'Copy', 'Pause'] as const)[ii]}</title>
                        {icon}
                      </text>
                    ))}
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Branch export CTAs */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setExportPanel('yes-branch')}
              style={{
                fontFamily: T.fSans, fontSize: 12, color: T.green600,
                background: T.greenSoft, border: `1px solid #a7f3d0`,
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              }}
            >
              Export "Yes" branch as a segment →
            </button>
            <button
              onClick={() => setExportPanel('no-branch')}
              style={{
                fontFamily: T.fSans, fontSize: 12, color: T.n600,
                background: T.n100, border: `1px solid ${T.n200}`,
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              }}
            >
              Export "No" branch as a segment →
            </button>
          </div>
        </div>
      </div>

      {/* Export branch panel */}
      {exportPanel && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'flex-end',
        }} onClick={() => setExportPanel(null)}>
          <div style={{
            width: 380, height: '100%', background: '#fff',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            padding: '28px 24px',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: T.fDisp, fontSize: 22, textTransform: 'uppercase', color: T.n950, marginBottom: 8 }}>
              Export Branch as Segment
            </div>
            <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 20 }}>
              Export the "{exportPanel === 'yes-branch' ? 'Yes (Recovered)' : 'No (Not recovered)'}" branch
              as a reusable segment in your segment library.
            </div>
            <div style={{
              background: T.n50, border: `1px solid ${T.n200}`, borderRadius: 8,
              padding: '12px 14px', marginBottom: 16,
              fontFamily: T.fMono, fontSize: 12, color: T.n700,
            }}>
              {exportPanel === 'yes-branch'
                ? 'seg-cfm-pass-stuck-recovered-{date}'
                : 'seg-cfm-pass-stuck-not-recovered-{date}'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setExportPanel(null); navigate('/segments'); }}
                style={{
                  fontFamily: T.fSans, fontSize: 13, fontWeight: 600,
                  background: T.brand, color: '#fff', border: 'none',
                  borderRadius: 7, padding: '9px 18px', cursor: 'pointer',
                }}
              >
                Register segment
              </button>
              <button
                onClick={() => setExportPanel(null)}
                style={{
                  fontFamily: T.fSans, fontSize: 13, color: T.n700,
                  background: T.n100, border: 'none', borderRadius: 7,
                  padding: '9px 14px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
