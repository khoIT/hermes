/**
 * 04 — Segment Authoring Canvas (seg_canvas) — DEMO CENTERPIECE
 * Visual port from design-reference/Hermes/src/segments.jsx SegmentCanvas.
 *
 * Layout (matches reference image 2):
 *   Left main (1fr):
 *     · Breadcrumb row ← Segments + draft slug + Open monitoring + editing chip
 *     · Serif italic title (large)
 *     · INTENT collapsible (card, expanded by default)
 *     · AUDIENCE block — huge count in accent, percentages, cascade chart
 *     · PREDICATE section — group blocks + Plain-English toggle
 *     · Sticky bottom action bar
 *   Right rail (304px):
 *     · FEATURES IN USE card
 *     · SUGGESTED NEXT · AI card
 *     · PATTERN REFERENCE card
 *
 * Data wiring: @hermes/contracts, canvas-reducer, audience-lookup — all preserved.
 *
 * URL params:
 *   ?seedFeature=<name>   — pre-populate row 1 with that feature
 *   ?from=draft-<id>      — agent draft review mode
 *   /:id                  — edit existing segment
 */
import React from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Eye, ChevronDown, ChevronRight,
  Bookmark, Clock, MoreHorizontal, ArrowRight,
} from 'lucide-react';
import { T } from '../../theme';
import { HandoffModal } from '../../components/handoff-modal';
import { AgentAttribution } from '../../components/agent-attribution';
import { PredicateComposer } from './_composer/predicate-composer';
import { FeaturesInUse } from './_components/features-in-use';
import { SuggestedNext } from './_components/suggested-next';
import { PredicateCascade, buildCascadeSteps } from './_components/predicate-cascade';
import { canvasReducer, initialState } from './_state/canvas-reducer';
import { allSegments } from '../../data/catalog/segments';
import { lookupAudience } from './_state/audience-lookup';
import type { Predicate } from './_state/predicate-types';

// ── Constants ──────────────────────────────────────────────────────────────
const ACCENT = '#f05a22';
const MAU_BASE = 1_250_000;
const CFM_RANKED_ACTIVE = 290_000;

// Default anchor segment for demo
const ANCHOR_ID = 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9';
const ANCHOR_TITLE = 'CFM ranked loss streak · non-paying';
const ANCHOR_SLUG = 'draft · seg-cfm-loss-streak-non-paying-2026';

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function buildDefaultState(seedFeature: string | null, draftId: string | null, segId: string | null) {
  // Edit existing segment
  if (segId) {
    const seg = allSegments.find(s => s.id === segId);
    if (seg) {
      const groups = seg.predicate.groups.map(g => ({
        id: Math.random().toString(36).slice(2, 9),
        rows: g.conditions.map(c => ({
          id: Math.random().toString(36).slice(2, 9),
          feature: c.feature,
          operator: c.op as never,
          value: c.value,
        })),
      }));
      const exclusions = seg.predicate.exclusions?.map(c => ({
        id: Math.random().toString(36).slice(2, 9),
        feature: c.feature,
        operator: c.op as never,
        value: c.value,
      })) ?? [];
      return initialState({ draftPredicate: { groups, exclusions } });
    }
  }

  if (draftId) {
    const seg = allSegments.find(s => s.id.includes('loss-streak'));
    if (seg) {
      const groups = seg.predicate.groups.map(g => ({
        id: Math.random().toString(36).slice(2, 9),
        rows: g.conditions.map(c => ({
          id: Math.random().toString(36).slice(2, 9),
          feature: c.feature,
          operator: c.op as never,
          value: c.value,
        })),
      }));
      const exclusions = seg.predicate.exclusions?.map(c => ({
        id: Math.random().toString(36).slice(2, 9),
        feature: c.feature,
        operator: c.op as never,
        value: c.value,
      })) ?? [];
      return initialState({ draftPredicate: { groups, exclusions }, fromDraft: true, draftId });
    }
  }

  if (seedFeature) {
    return initialState({ seedFeature, seedFeatureType: 'int' });
  }

  // Default: loss-streak anchor predicate
  const seg = allSegments.find(s => s.id.includes('loss-streak'));
  if (seg) {
    const groups = seg.predicate.groups.map(g => ({
      id: Math.random().toString(36).slice(2, 9),
      rows: g.conditions.map(c => ({
        id: Math.random().toString(36).slice(2, 9),
        feature: c.feature,
        operator: c.op as never,
        value: c.value,
      })),
    }));
    const exclusions = seg.predicate.exclusions?.map(c => ({
      id: Math.random().toString(36).slice(2, 9),
      feature: c.feature,
      operator: c.op as never,
      value: c.value,
    })) ?? [];
    return initialState({ draftPredicate: { groups, exclusions } });
  }

  return initialState();
}

// ── Animated count display ─────────────────────────────────────────────────
function AnimatedCount({ target }: { target: number }) {
  const [displayed, setDisplayed] = React.useState(target);
  const prevRef = React.useRef(target);

  React.useEffect(() => {
    const from = prevRef.current;
    const to = target;
    if (from === to) return;
    prevRef.current = to;
    const dur = 380;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <>{fmtNum(displayed)}</>;
}

// ── AUDIENCE block ─────────────────────────────────────────────────────────
interface AudienceBlockProps {
  count: number;
  predicate: Predicate;
}

// Synthetic breakdown — VN-dominant since cfm_vn schema. Stable across renders.
// Real breakdowns come from crawled/audience-counts.json[predicateId].breakdownAtCanonical
// when available; this is the fallback for arbitrary predicate combinations.
function deriveBreakdowns(audience: typeof DEFAULT_BREAKDOWN) {
  return audience;
}
const DEFAULT_BREAKDOWN = {
  lifecycle: [
    { label: 'NRU',     fraction: 0.12 },
    { label: 'Mid',     fraction: 0.41 },
    { label: 'Veteran', fraction: 0.35 },
    { label: 'Lapsed',  fraction: 0.12 },
  ],
  country: [
    { label: 'VN',    fraction: 0.68 },
    { label: 'TH',    fraction: 0.14 },
    { label: 'ID',    fraction: 0.10 },
    { label: 'Other', fraction: 0.08 },
  ],
  spendTier: [
    { label: 'Free', fraction: 1.00 },
    { label: 'Low',  fraction: 0.00 },
    { label: 'Mid',  fraction: 0.00 },
    { label: 'High', fraction: 0.00 },
  ],
};

function BreakdownColumn({ title, bars }: { title: string; bars: Array<{ label: string; fraction: number }> }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: T.fMono, fontSize: 10, fontWeight: 700,
        color: T.n500, textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 10,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {bars.map(b => (
          <div key={b.label} style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 36px',
            alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.n700 }}>{b.label}</span>
            <div style={{
              height: 6, borderRadius: 3, background: T.n100,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.max(b.fraction * 100, 0)}%`,
                height: '100%', background: ACCENT, borderRadius: 3,
                transition: 'width 240ms ease',
              }} />
            </div>
            <span style={{
              fontFamily: T.fMono, fontSize: 11, color: T.n600, textAlign: 'right',
            }}>
              {Math.round(b.fraction * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AudienceBlock({ count, predicate }: AudienceBlockProps) {
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const breakdown = React.useMemo(() => deriveBreakdowns(DEFAULT_BREAKDOWN), [predicate]);

  // Build cascade model from predicate groups
  const cascadeModel = React.useMemo(() => {
    if (!predicate.groups.length) return null;
    // Compute per-group cumulative counts using independence approximation
    const groupCounts: number[] = [];
    let cumP = 1.0;
    for (const group of predicate.groups) {
      // Simple OR selectivity within group (union)
      let groupP = 0;
      for (const row of group.rows) {
        const singlePred: Predicate = { groups: [{ id: group.id, rows: [row] }], exclusions: [] };
        const result = lookupAudience(singlePred);
        groupP = Math.max(groupP, result.count / MAU_BASE);
      }
      cumP *= Math.max(0.001, groupP);
      groupCounts.push(Math.round(MAU_BASE * cumP));
    }
    const afterExcl = predicate.exclusions.length
      ? Math.round(count * 0.995) // ~0.5% drop for test account exclusion
      : count;
    return {
      base: MAU_BASE,
      groupCounts,
      afterExcl,
      hasExclusions: predicate.exclusions.length > 0,
    };
  }, [predicate, count]);

  const cascadeSteps = cascadeModel ? buildCascadeSteps(cascadeModel) : [];

  const pctMau = ((count / MAU_BASE) * 100).toFixed(2);
  const pctSubpop = ((count / CFM_RANKED_ACTIVE) * 100).toFixed(1);

  return (
    <div style={{
      background: '#fff', border: `1px solid #e8e5de`,
      borderRadius: 8, padding: '14px 18px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 12,
    }}>
      {/* Top row: AUDIENCE label + big count + percentages + show breakdown */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
        {/* Left: label + huge number */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 1 }}>
          <span style={{
            fontFamily: T.fMono, fontSize: 10, fontWeight: 700,
            color: T.n500, textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Audience
          </span>
          <span style={{
            fontFamily: T.fMono, fontSize: 36, fontWeight: 500,
            color: ACCENT, lineHeight: 1, letterSpacing: '-0.02em',
          }}>
            <AnimatedCount target={count} />
          </span>
          <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>UIDs</span>
        </div>

        {/* Right: percentages stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: T.n500 }}>
          <span>
            <span style={{ fontFamily: T.fMono, color: T.n700 }}>≈ {pctMau}%</span>
            {' '}of MAU
          </span>
          <span>
            <span style={{ fontFamily: T.fMono, color: T.n700 }}>≈ {pctSubpop}%</span>
            {' '}of CFM ranked active
          </span>
        </div>

        <button
          onClick={() => setShowBreakdown(s => !s)}
          aria-expanded={showBreakdown}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: T.fSans, fontSize: 12.5, color: T.n700,
            background: T.n50, border: `1px solid ${T.n200}`,
            borderRadius: 6, padding: '5px 11px', cursor: 'pointer',
            whiteSpace: 'nowrap', transition: 'border-color 120ms ease, background 120ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.n400; e.currentTarget.style.background = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.n200; e.currentTarget.style.background = T.n50; }}
        >
          {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
          {showBreakdown
            ? <ChevronDown size={13} strokeWidth={2} />
            : <ChevronRight size={13} strokeWidth={2} />}
        </button>
      </div>

      {/* Predicate cascade chart */}
      {cascadeModel && cascadeSteps.length > 0 && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
          <PredicateCascade
            mauBase={cascadeModel.base}
            steps={cascadeSteps}
          />
        </div>
      )}

      {/* Breakdown panel — 3 columns: lifecycle / country / spend tier */}
      {showBreakdown && (
        <div style={{
          borderTop: '1px solid #eee', marginTop: 14, paddingTop: 16,
          display: 'flex', gap: 36,
        }}>
          <BreakdownColumn title="Lifecycle" bars={breakdown.lifecycle} />
          <BreakdownColumn title="Country"   bars={breakdown.country} />
          <BreakdownColumn title="Spend Tier" bars={breakdown.spendTier} />
        </div>
      )}
    </div>
  );
}

// ── Right rail ─────────────────────────────────────────────────────────────
function RailCard({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid #e8e5de`,
      borderRadius: 8, marginBottom: 12, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid #eee',
        fontFamily: T.fMono, fontSize: 10, fontWeight: 700,
        color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {title}
      </div>
      <div style={{ padding: '10px 14px' }}>
        {children}
      </div>
    </div>
  );
}

function PatternReferenceCard() {
  return (
    <RailCard title="Pattern reference">
      <div style={{ padding: '8px 10px', background: '#faf8f3', borderRadius: 6 }}>
        <div style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic', fontSize: 14, color: T.n800, marginBottom: 4,
        }}>
          Loss Streak Audience
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, lineHeight: 1.4 }}>
          Seeded on May 7. Average lift across portfolio: +6.4%.
        </div>
      </div>
    </RailCard>
  );
}

// SuggestedNext card using the existing component but wrapped in RailCard style
function SuggestedNextCard({ activeFeatures, onAddFeature }: { activeFeatures: string[]; onAddFeature: (feat: string, ftype: string) => void }) {
  // Hardcoded suggestions matching reference image exactly
  const SUGGESTIONS = [
    { name: 'tenure_days_total', hint: '+12% match coverage' },
    { name: 'gem_balance_current', hint: 'narrows 8%' },
    { name: 'mmr_drift_3d', hint: 'similar shape to mmr_drift_7d' },
  ].filter(s => !activeFeatures.includes(s.name));

  if (!SUGGESTIONS.length) return null;

  return (
    <RailCard title={<>Suggested next · <span style={{ color: ACCENT }}>AI</span></>}>
      <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, margin: '0 0 8px', lineHeight: 1.4 }}>
        Segments like yours often add:
      </p>
      {SUGGESTIONS.map(s => (
        <div key={s.name} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 8px', borderRadius: 6, marginBottom: 4,
          background: '#faf8f3',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n800 }}>{s.name}</div>
            <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n500, marginTop: 1 }}>{s.hint}</div>
          </div>
          <button
            onClick={() => onAddFeature(s.name, 'int')}
            style={{
              fontFamily: T.fSans, fontSize: 11, color: T.n700,
              background: 'none', border: `1px solid ${T.n300}`,
              borderRadius: 4, width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = ACCENT; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.n700; e.currentTarget.style.borderColor = T.n300; }}
          >
            +
          </button>
        </div>
      ))}
    </RailCard>
  );
}

// ── Canvas page ─────────────────────────────────────────────────────────────
export default function SegmentsCanvasPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();

  const seedFeature = params.get('seedFeature');
  const fromDraftParam = params.get('from');
  const draftId = fromDraftParam?.startsWith('draft-') ? fromDraftParam.slice(6) : null;
  const segId = routeId ?? null;

  // Find the edited segment metadata if in edit mode
  const editedSeg = segId ? allSegments.find(s => s.id === segId) ?? null : null;
  const isEditMode = !!editedSeg;

  const [state, dispatch] = React.useReducer(
    canvasReducer,
    undefined,
    () => buildDefaultState(seedFeature, draftId, segId),
  );

  const [explainerOn, setExplainerOn] = React.useState(false);

  const allActiveFeatures = React.useMemo(() =>
    state.predicate.groups.flatMap(g => g.rows.map(r => r.feature)),
  [state.predicate]);

  const handleAddSuggested = React.useCallback((feat: string, ftype: string) => {
    dispatch({ type: 'OPEN_PICKER', picker: 'condition' });
  }, []);

  const titleText = editedSeg?.displayName ?? ANCHOR_TITLE;
  const slugText = ANCHOR_SLUG;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 304px',
      height: '100%', background: '#fff',
    }}>
      {/* ── Left main column ── */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Agent draft banner */}
        {state.fromDraft && (
          <div style={{
            background: T.brandSoft, borderBottom: `1px solid ${T.brandBorder}`,
            padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n800 }}>
              <strong>▸ Reviewing agent draft.</strong> Edit freely. Approving without edits keeps the 'Agent-drafted' badge.
            </span>
            <AgentAttribution
              agentLabel="Authoring Agent"
              approvedBy={state.fromDraft ? undefined : 'Khoi'}
              threadId={draftId ? `ag-${draftId}` : undefined}
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            />
          </div>
        )}

        {/* Breadcrumb row */}
        <div style={{ padding: '12px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/segments')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: T.fSans, fontSize: 12.5, color: T.n600,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.n600; }}
          >
            <ChevronLeft size={13} strokeWidth={2} /> Segments
          </button>

          {/* Slug + chips right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: T.fMono, fontSize: 11, color: T.n500,
            }}>
              {slugText}
            </span>
            {isEditMode && (
              <>
                <button
                  onClick={() => navigate(`/segments/${segId}`)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontFamily: T.fSans, fontSize: 12, color: T.n700,
                    background: T.n50, border: `1px solid ${T.n200}`,
                    borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.n400; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.n200; }}
                >
                  <Eye size={12} strokeWidth={1.75} /> Open monitoring
                </button>
                <span style={{
                  fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
                  color: '#92580a', background: '#fef6e0', border: '1px solid #f0d896',
                  borderRadius: 4, padding: '2px 8px',
                }}>
                  editing
                </span>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: '8px 28px 14px' }}>
          <h1 style={{
            margin: 0,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic', fontSize: 26, fontWeight: 400, lineHeight: 1.2,
            color: T.n900,
          }}>
            {titleText}
          </h1>
        </div>

        {/* Region 1: AUDIENCE block (sticky) */}
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', padding: '8px 28px 4px' }}>
          <AudienceBlock
            count={state.audience.count}
            predicate={state.predicate}
          />
        </div>

        {/* Region 3: PREDICATE section */}
        <div style={{ padding: '4px 28px 12px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{
              fontFamily: T.fMono, fontSize: 10, fontWeight: 700,
              color: T.n500, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Predicate
            </span>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: T.fSans, fontSize: 12, color: T.n500, cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={explainerOn}
                onChange={e => setExplainerOn(e.target.checked)}
                style={{ accentColor: ACCENT }}
              />
              Plain-English explainer
            </label>
          </div>

          {explainerOn ? (
            <div style={{
              padding: 20, background: '#faf8f3',
              border: `1px solid #ece8de`, borderRadius: 8,
            }}>
              <p style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic', fontSize: 17, lineHeight: 1.5,
                color: T.n700, margin: 0,
              }}>
                A player matches when (their{' '}
                <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>consecutive ranked losses streak is at least {String(state.predicate.groups[0]?.rows[0]?.value ?? 5)}</span>
                {' '}or their{' '}
                <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>MMR has dropped more than 30 over the last 7 days</span>
                ), and they have{' '}
                <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>never paid us</span>
                , and their{' '}
                <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>account is at least 30 days old</span>
                {' '}— excluding any test accounts.
              </p>
            </div>
          ) : (
            <PredicateComposer
              predicate={state.predicate}
              activePlaygroundRowId={state.activePlaygroundRowId}
              activeSwapRowId={state.activeSwapRowId}
              openPicker={state.openPicker}
              pickerTargetGroupId={state.pickerTargetGroupId}
              dispatch={dispatch}
              onBrowseFeatureStore={() => navigate('/feature-store')}
            />
          )}
        </div>

        {/* Region 5: Sticky bottom action bar */}
        <div style={{
          position: 'sticky', bottom: 0, zIndex: 10,
          background: '#fff', borderTop: `1px solid ${T.n200}`,
          padding: '11px 28px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {/* Left actions */}
          <button
            style={actionBtnStyle}
            onMouseEnter={e => btnHover(e, true)}
            onMouseLeave={e => btnHover(e, false)}
          >
            <Bookmark size={12} strokeWidth={1.75} /> Save draft
          </button>
          <button
            style={actionBtnStyle}
            onMouseEnter={e => btnHover(e, true)}
            onMouseLeave={e => btnHover(e, false)}
          >
            <Clock size={12} strokeWidth={1.75} /> Backtest
          </button>
          <button
            style={actionBtnStyle}
            onMouseEnter={e => btnHover(e, true)}
            onMouseLeave={e => btnHover(e, false)}
          >
            <Eye size={12} strokeWidth={1.75} /> Preview UID list
          </button>

          <div style={{ flex: 1 }} />

          {/* Substrate copy */}
          <span style={{
            fontFamily: T.fMono, fontSize: 10.5, color: T.n500,
            textAlign: 'right', lineHeight: 1.5,
          }}>
            Compiles to Substrate B<br />Hatchet · BuildSegmentWorkflow
          </span>

          {/* Build CTA */}
          <button
            onClick={() => dispatch({ type: 'OPEN_HANDOFF' })}
            disabled={!state.predicate.groups.length}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: '#fff',
              background: state.predicate.groups.length ? ACCENT : T.n300,
              border: 'none', borderRadius: 7,
              padding: '8px 20px', cursor: state.predicate.groups.length ? 'pointer' : 'not-allowed',
              transition: 'background .12s',
            }}
            onMouseEnter={e => { if (state.predicate.groups.length) e.currentTarget.style.background = '#d94d1a'; }}
            onMouseLeave={e => { if (state.predicate.groups.length) e.currentTarget.style.background = ACCENT; }}
          >
            Build segment <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Right rail ── */}
      <aside style={{
        background: '#fafaf8', borderLeft: `1px solid #e8e5de`,
        overflowY: 'auto', padding: '20px 16px',
      }}>
        {/* Features in use */}
        <RailCard title={`Features in use · ${allActiveFeatures.length}`}>
          <FeaturesInUse
            featureNames={allActiveFeatures}
            onFeatureClick={name => navigate(`/feature-store/${name}`)}
          />
        </RailCard>

        {/* Suggested next */}
        {allActiveFeatures.length > 0 && (
          <SuggestedNextCard
            activeFeatures={allActiveFeatures}
            onAddFeature={handleAddSuggested}
          />
        )}

        {/* Pattern reference */}
        <PatternReferenceCard />
      </aside>

      {/* Handoff modal */}
      <HandoffModal
        open={state.handoffOpen}
        idType="segment"
        id={state.mintedSegmentId ?? 'seg-cfm-new-2026'}
        substrate="B"
        agentAttribution={state.fromDraft ? {
          agentLabel: 'Authoring Agent',
          approvedBy: 'Khoi',
          threadId: draftId ? `ag-${draftId}` : 'ag-op-1042',
        } : undefined}
        onOpenMonitoring={() => {
          dispatch({ type: 'CLOSE_HANDOFF' });
          navigate(`/segments/${state.mintedSegmentId ?? ANCHOR_ID}`);
        }}
        onUseCampaign={() => {
          dispatch({ type: 'CLOSE_HANDOFF' });
          navigate('/campaigns/new/realtime');
        }}
        onDone={() => dispatch({ type: 'CLOSE_HANDOFF' })}
      />
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────
const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontFamily: T.fSans, fontSize: 12, color: T.n700,
  background: 'none', border: `1px solid ${T.n200}`,
  borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
  transition: 'border-color .1s',
};

function btnHover(e: React.MouseEvent<HTMLButtonElement>, enter: boolean) {
  e.currentTarget.style.borderColor = enter ? T.n400 : T.n200;
}
