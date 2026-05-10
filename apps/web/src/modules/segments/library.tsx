/**
 * 03 — Segments Library (seg_library)
 * Visual port from design-reference/Hermes/src/segments.jsx SegmentLibrary.
 * Left sidebar: GROUP BY / 4R GOAL / STATUS / HAS OPEN CAMPAIGNS.
 * Main column: stat strip prose, Start from pills, goal-grouped rows.
 * Row: serif name + mono id, goal badge, author chip, compact count,
 *       sparkline bars, avatar+timestamp, view/edit icons.
 *
 * Data wiring via @hermes/contracts allSegments — unchanged.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Bookmark, Layers, PenLine, Eye, Pencil, Plus } from 'lucide-react';
import { T } from '../../theme';
import { allSegments } from '../../data/catalog/segments';
import type { HermesSegment } from '@hermes/contracts';
import { useTopbarTrailing } from '../../utils/topbar-trailing-context';

// ── Design constants matching reference ─────────────────────────────────────
const ACCENT = '#f05a22';
const SURFACE = '#fafaf8';
const HAIRLINE = '#eeece6';

type Goal4r = 'retain' | 'revenue' | 'reactivate' | 'recruit' | 'all';
type GroupBy = 'goal' | 'owner' | 'type' | 'none';
type StatusFilter = 'Active' | 'Drift detected' | 'Stale' | 'Draft';
type CampaignFilter = 'Yes' | 'No' | 'Any';

// Goal badge colors from reference shared.jsx GoalBadge
const GOAL_MAP: Record<string, { bg: string; bd: string; fg: string }> = {
  retain:     { bg: '#eaf2ff', bd: '#c7d9f7', fg: '#1e63ce' },
  revenue:    { bg: '#fff2eb', bd: '#f8c9b0', fg: '#9a3412' },
  reactivate: { bg: '#fef6e0', bd: '#f0d896', fg: '#92580a' },
  recruit:    { bg: '#f3eefe', bd: '#d8c8fa', fg: '#5b21b6' },
};

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h = ms / 3_600_000;
  if (h < 2) return '2 hours ago';
  if (h < 24) return `${Math.floor(h)} hours ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)} days ago`;
  if (d < 14) return '1 week ago';
  return `${Math.floor(d / 7)} weeks ago`;
}

// ── GoalBadge ─────────────────────────────────────────────────────────────
function GoalBadge({ goal, size = 'md' }: { goal: string; size?: 'sm' | 'md' }) {
  const c = GOAL_MAP[goal] ?? { bg: '#f3f1ec', bd: '#e7e5e0', fg: '#525252' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: size === 'sm' ? '1px 6px' : '2px 8px',
      borderRadius: 4, border: `1px solid ${c.bd}`, background: c.bg, color: c.fg,
      fontFamily: T.fSans, fontSize: size === 'sm' ? 10 : 11, fontWeight: 600,
      letterSpacing: '0.03em', textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {goal}
    </span>
  );
}

// ── Mini avatar ───────────────────────────────────────────────────────────
const AVATAR_PALETTE = ['#f05a22', '#3f8dff', '#009689', '#7c3aed', '#92580a'];
function MiniAvatar({ name, size = 22 }: { name: string; size?: number }) {
  const initials = name.split(/[\s.@_-]/).map(s => s[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
  const bg = AVATAR_PALETTE[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_PALETTE.length]!;
  return (
    <span style={{
      width: size, height: size, borderRadius: 99, background: bg, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.fSans, fontSize: size * 0.40, fontWeight: 600, flexShrink: 0,
    }}>{initials}</span>
  );
}

// ── Mini sparkline bars ───────────────────────────────────────────────────
function SparkBars({ data, amber, width = 56 }: { data: number[]; amber?: boolean; width?: number }) {
  if (!data.length) return <span style={{ color: T.n400, fontSize: 11 }}>—</span>;
  const max = Math.max(...data, 1);
  const barColor = amber ? '#f59e0b' : ACCENT;
  const barW = Math.max(3, Math.floor((width - (data.length - 1) * 2) / data.length));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 22, width }}>
      {data.map((v, i) => (
        <div key={i} style={{
          width: barW, height: `${Math.max(10, (v / max) * 100)}%`,
          background: barColor, borderRadius: 1, opacity: 0.85,
        }} />
      ))}
    </div>
  );
}

// Synthetic sparkline data seeded from audienceSize
function synthSpark(seg: HermesSegment): number[] {
  const seed = seg.audienceSize ?? 1000;
  return Array.from({ length: 6 }, (_, i) => {
    const base = seed * (0.85 + 0.15 * Math.sin(i + (seed % 7)));
    return Math.max(1, Math.round(base + seed * 0.05 * (i % 3 - 1)));
  });
}

// ── Segment row ───────────────────────────────────────────────────────────
function SegmentRow({
  seg, onView, onEdit, last,
}: { seg: HermesSegment; onView: () => void; onEdit: () => void; last: boolean }) {
  const [hovered, setHovered] = React.useState(false);
  const spark = synthSpark(seg);
  const authorLabel =
    seg.author === 'agent-drafted' ? 'Agent-drafted' :
    seg.author === 'agent-edited' ? 'Agent-edited' :
    seg.type === 'derived-from-journey' ? 'Derived from journey...' :
    'Hand-built';

  return (
    <div
      onClick={onView}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,2fr) 90px 110px 72px 64px 110px 60px',
        gap: 12, alignItems: 'center',
        padding: '14px 18px',
        borderBottom: last ? 'none' : `1px solid ${HAIRLINE}`,
        cursor: 'pointer',
        background: hovered ? '#fafaf6' : 'transparent',
        transition: 'background .1s',
      }}
    >
      {/* Name + id */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic', fontSize: 15,
            color: T.n900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {seg.displayName}
          </span>
          {seg.drift && (
            <span style={{
              fontFamily: T.fSans, fontSize: 10, color: '#92580a',
              background: '#fef6e0', border: '1px solid #f0d896',
              borderRadius: 3, padding: '1px 5px', flexShrink: 0,
            }}>drift</span>
          )}
          {seg.status === 'draft' && (
            <span style={{
              fontFamily: T.fSans, fontSize: 10, color: T.n500,
              background: T.n100, border: `1px solid ${T.n300}`,
              borderRadius: 3, padding: '1px 5px', flexShrink: 0,
            }}>draft</span>
          )}
        </div>
        <span style={{
          fontFamily: T.fMono, fontSize: 10.5, color: T.n400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {seg.id}
        </span>
      </div>

      {/* Goal badge */}
      <GoalBadge goal={seg.goal4r} size="sm" />

      {/* Author chip */}
      <span style={{
        fontFamily: T.fSans, fontSize: 11, color: T.n600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {authorLabel}
      </span>

      {/* Count */}
      <span style={{ fontFamily: T.fMono, fontSize: 14, fontWeight: 500, color: T.n900 }}>
        {fmtNum(seg.audienceSize ?? 0)}
      </span>

      {/* Sparkline */}
      <SparkBars data={spark} amber={!!seg.drift} width={56} />

      {/* Owner + timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MiniAvatar name={seg.owner ?? 'User'} size={22} />
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, whiteSpace: 'nowrap' }}>
          {seg.lastBuildAt ? relativeTime(seg.lastBuildAt) : '—'}
        </span>
      </div>

      {/* Action icons */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          title="Open monitoring"
          onClick={onView}
          style={iconBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Eye size={12} strokeWidth={1.75} />
        </button>
        <button
          title="Edit predicate"
          onClick={onEdit}
          style={iconBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Pencil size={12} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 5, border: `1px solid ${HAIRLINE}`,
  background: 'transparent', cursor: 'pointer', color: T.n600,
  transition: 'background .1s',
};

// ── Sidebar section label ─────────────────────────────────────────────────
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'block', marginBottom: 8,
      fontFamily: T.fMono, fontSize: 10.5, fontWeight: 600,
      color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em',
    }}>
      {children}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function SegmentsLibraryPage() {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = React.useState<GroupBy>('goal');
  const [filterGoal, setFilterGoal] = React.useState<Goal4r>('all');
  const [statusFilters, setStatusFilters] = React.useState<Set<StatusFilter>>(new Set());
  const [campaignFilter, setCampaignFilter] = React.useState<CampaignFilter>('Any');

  // Hoist `+ New segment` CTA into the topbar trailing slot.
  useTopbarTrailing(
    <button
      onClick={() => navigate('/segments/new')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: '#fff',
        background: ACCENT, border: 'none',
        borderRadius: 7, padding: '8px 14px', cursor: 'pointer',
        height: 36,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#d94d1a'; }}
      onMouseLeave={e => { e.currentTarget.style.background = ACCENT; }}
    >
      <Plus size={13} strokeWidth={2} /> New segment
    </button>,
    [],
  );

  const filtered = React.useMemo(() => {
    let segs = allSegments as HermesSegment[];
    if (filterGoal !== 'all') segs = segs.filter(s => s.goal4r === filterGoal);
    return segs;
  }, [filterGoal]);

  const grouped = React.useMemo(() => {
    const groups: Record<string, HermesSegment[]> = {};
    filtered.forEach(s => {
      const k = groupBy === 'goal' ? s.goal4r ?? 'unknown'
        : groupBy === 'owner' ? (s.owner ?? 'unknown')
        : groupBy === 'type' ? (s.type ?? 'unknown')
        : 'All';
      (groups[k] ??= []).push(s);
    });
    return groups;
  }, [filtered, groupBy]);

  const active  = allSegments.filter(s => s.status === 'active').length;
  const draft   = allSegments.filter(s => s.status === 'draft').length;
  const derived = allSegments.filter(s => s.type === 'derived-from-journey').length;
  const drift   = allSegments.filter(s => (s as HermesSegment & { drift?: boolean }).drift).length;

  // Sidebar button style
  const sideBtn = (selected: boolean): React.CSSProperties => ({
    padding: '6px 8px', borderRadius: 5, textAlign: 'left', fontSize: 12.5,
    fontFamily: T.fSans, cursor: 'pointer', width: '100%',
    background: selected ? '#eeece6' : 'transparent',
    color: selected ? T.n900 : T.n500,
    fontWeight: selected ? 500 : 400,
    border: 'none',
    transition: 'background .1s, color .1s',
  });

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '224px 1fr',
      height: '100%', background: '#fff',
    }}>
      {/* Left sidebar */}
      <aside style={{
        background: SURFACE, borderRight: `1px solid #e8e5de`,
        padding: '20px 16px', overflowY: 'auto',
      }}>
        <SideLabel>Group by</SideLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {([['goal','4R goal'],['owner','Owner'],['type','Type'],['none','None']] as [GroupBy, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setGroupBy(k)} style={sideBtn(groupBy === k)}>{l}</button>
          ))}
        </div>

        <SideLabel>4R goal</SideLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {([['all','All'],['retain','Retain'],['revenue','Revenue'],['reactivate','Reactivate'],['recruit','Recruit']] as [Goal4r, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setFilterGoal(k)} style={sideBtn(filterGoal === k)}>{l}</button>
          ))}
        </div>

        <SideLabel>Status</SideLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {(['Active','Drift detected','Stale','Draft'] as StatusFilter[]).map(s => (
            <label key={s} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px', fontSize: 12.5, color: T.n500, cursor: 'pointer',
              fontFamily: T.fSans,
            }}>
              <input
                type="checkbox"
                checked={statusFilters.has(s)}
                onChange={e => {
                  const next = new Set(statusFilters);
                  e.target.checked ? next.add(s) : next.delete(s);
                  setStatusFilters(next);
                }}
                style={{ accentColor: T.n800 }}
              /> {s}
            </label>
          ))}
        </div>

        <SideLabel>Has open campaigns</SideLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(['Yes','No','Any'] as CampaignFilter[]).map(s => (
            <label key={s} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px', fontSize: 12.5, color: T.n500, cursor: 'pointer',
              fontFamily: T.fSans,
            }}>
              <input
                type="radio" name="oc"
                checked={campaignFilter === s}
                onChange={() => setCampaignFilter(s)}
                style={{ accentColor: T.n800 }}
              /> {s}
            </label>
          ))}
        </div>
      </aside>

      {/* Main column */}
      <div style={{ overflowY: 'auto' }}>
        {/* Header — H1 dropped (breadcrumb owns title); CTA hoisted to topbar */}
        <div style={{ padding: '16px 32px 8px', borderBottom: `1px solid ${HAIRLINE}` }}>
          {/* Stat strip prose — hairline */}
          <p style={{
            margin: '0 0 12px', maxWidth: 720,
            fontFamily: T.fSans, fontSize: 12, color: T.n500, lineHeight: 1.5,
          }}>
            {allSegments.length} segments · {active} active · {draft} in draft · {derived} derived from journey branches · {drift} with drift this week.{' '}
            Frozen UID lists materialised in <span style={{ fontFamily: T.fMono, fontSize: 11.5, background: T.n100, padding: '1px 4px', borderRadius: 3 }}>state_user_segments</span>, served to Apollo via the Activation API.
          </p>

          {/* Start from pills */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4, marginBottom: 4 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, marginRight: 4 }}>Start from:</span>
            {[
              { label: 'A goal', icon: <Target size={12} strokeWidth={1.75} />, action: () => navigate('/segments/new') },
              { label: 'Audience pattern', icon: <Bookmark size={12} strokeWidth={1.75} />, action: () => navigate('/segments/patterns') },
              { label: 'A feature', icon: <Layers size={12} strokeWidth={1.75} />, action: () => navigate('/feature-store') },
              { label: 'Continue draft', icon: <PenLine size={12} strokeWidth={1.75} />, action: () => navigate('/segments/new') },
            ].map(({ label, icon, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontFamily: T.fSans, fontSize: 12, color: T.n700,
                  background: '#fff', border: `1px solid ${T.n300}`,
                  borderRadius: 99, padding: '4px 12px', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.n300; e.currentTarget.style.color = T.n700; }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped segment lists */}
        <div style={{ padding: '8px 32px 40px' }}>
          {Object.entries(grouped).map(([gName, gSegs]) => (
            <div key={gName} style={{ marginTop: 24 }}>
              {/* Group header */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 10,
                padding: '8px 0',
              }}>
                {groupBy === 'goal' ? (
                  <GoalBadge goal={gName} />
                ) : (
                  <h2 style={{
                    margin: 0, fontSize: 16,
                    fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400,
                    textTransform: 'capitalize',
                  }}>
                    {gName}
                  </h2>
                )}
                <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>{gSegs.length}</span>
              </div>

              {/* Card */}
              <div style={{
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 8, background: '#fff',
                overflow: 'hidden',
              }}>
                {gSegs.map((s, i) => (
                  <SegmentRow
                    key={s.id}
                    seg={s}
                    last={i === gSegs.length - 1}
                    onView={() => navigate(`/segments/${s.id}`)}
                    onEdit={() => navigate(`/segments/${s.id}/predicate?edit=1`)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n400, textAlign: 'center', padding: '40px 0' }}>
              No segments match the current filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
