/**
 * 18 — Agents Inbox (ag_inbox) — Module 05 landing
 * 4 tabs: Opportunities · Drafts · Recommendations · Activity
 * Header stat strip per PRD_Hermes_Agentic.md §5.2
 *
 * Approve flow:
 *   - If Authoring Agent has matching draft → route to canvas review mode
 *   - Else → "drafting…" toast then route to /agents/drafts
 * Reject flow:
 *   - Opens RejectModal → on confirm → status = dismissed, removed from list
 *
 * State is local (useState) — not persisted across sessions per approved decision.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Badge } from '../../theme';
import { OpportunityCard } from '../../components/opportunity-card';
import { TabsStrip, type InboxTab } from './_components/tabs-strip';
import { FilterRail, type OpportunityFilters } from './_components/filter-rail';
import { RejectModal, type RejectReason } from './_components/reject-modal';
import { DraftRow } from './_components/draft-row';
import { ActivityRow } from './_components/activity-row';
import { allOpportunities } from '../../data/catalog/agents/opportunities';
import { allDrafts } from '../../data/catalog/agents/drafts';
import { allRecommendations } from '../../data/catalog/agents/recommendations';
import { allActivity } from '../../data/catalog/agents/activity';
import type { Opportunity } from '@hermes/contracts';

// ── Window urgency sort ─────────────────────────────────────────────────────
function windowTier(w: string): number {
  if (w.includes('today'))      return 0;
  if (w.includes('this week'))  return 1;
  if (w.includes('this month')) return 2;
  return 3; // evergreen
}

function sortOpportunities(ops: Opportunity[]): Opportunity[] {
  return [...ops].sort((a, b) => {
    const wDiff = windowTier(a.window) - windowTier(b.window);
    return wDiff !== 0 ? wDiff : b.confidence - a.confidence;
  });
}

// ── Filter helpers ──────────────────────────────────────────────────────────
function applyFilters(ops: Opportunity[], f: OpportunityFilters): Opportunity[] {
  return ops.filter(op => {
    if (f.agent !== 'all'  && op.agent   !== f.agent)   return false;
    if (f.goal4r !== 'all' && op.goal4r  !== f.goal4r)  return false;
    if (f.game !== 'all'   && op.game    !== f.game)     return false;
    if (f.confidence === '0.8' && op.confidence < 0.8)  return false;
    if (f.confidence === '0.6' && op.confidence < 0.6)  return false;
    if (f.window !== 'all') {
      const tier = windowTier(op.window);
      if (f.window === 'today'      && tier !== 0) return false;
      if (f.window === 'this-week'  && tier !== 1) return false;
      if (f.window === 'this-month' && tier !== 2) return false;
      if (f.window === 'evergreen'  && tier !== 3) return false;
    }
    return true;
  });
}

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: T.n900, color: '#fff',
      fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
      padding: '10px 20px', borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      opacity: visible ? 1 : 0, transition: 'opacity .2s',
      pointerEvents: 'none', zIndex: 2000, whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
const DEFAULT_FILTERS: OpportunityFilters = {
  agent: 'all', goal4r: 'all', game: 'all', window: 'all', confidence: 'all',
};

export default function AgentsInboxPage() {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = React.useState<InboxTab>('opportunities');

  // Opportunity dismiss state (local only)
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = React.useState<string | null>(null);

  // Draft approval state (local only)
  const [approvedDrafts, setApprovedDrafts] = React.useState<Set<string>>(new Set());
  const [rejectedDrafts, setRejectedDrafts] = React.useState<Set<string>>(new Set());

  // Filters
  const [filters, setFilters] = React.useState<OpportunityFilters>(DEFAULT_FILTERS);

  // Toast
  const [toast, setToast] = React.useState('');
  const [toastVisible, setToastVisible] = React.useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }

  // Live opportunity list (excluding dismissed)
  const liveOps = React.useMemo(() =>
    allOpportunities.filter(op => !dismissed.has(op.id)),
    [dismissed],
  );

  const filteredOps = React.useMemo(() =>
    sortOpportunities(applyFilters(liveOps, filters)),
    [liveOps, filters],
  );

  const liveDrafts = React.useMemo(() =>
    allDrafts.filter(d => !rejectedDrafts.has(d.id)),
    [rejectedDrafts],
  );

  const availableGames = React.useMemo(() =>
    [...new Set(allOpportunities.map(op => op.game))].sort(),
    [],
  );

  // ── Approve opportunity flow ──────────────────────────────────────────────
  function handleApprove(opId: string) {
    const draft = allDrafts.find(d => d.fromOpportunity === opId);
    if (draft) {
      const route = draft.type === 'segment'
        ? `/segments/new?from=draft-${draft.id}`
        : `/campaigns/new/realtime?from=draft-${draft.id}`;
      navigate(route);
    } else {
      showToast('Authoring Agent drafting…');
      setTimeout(() => navigate('/agents/drafts'), 1500);
    }
  }

  // ── Edit before drafting ──────────────────────────────────────────────────
  function handleEdit(opId: string) {
    const op = allOpportunities.find(o => o.id === opId);
    if (op?.proposed?.segment) {
      navigate(`/segments/new?seedFeature=${encodeURIComponent(op.proposed.segment)}`);
    } else {
      navigate('/campaigns/new/realtime');
    }
  }

  // ── Reject modal ──────────────────────────────────────────────────────────
  function handleDismiss(opId: string) {
    setRejectTarget(opId);
  }

  function handleRejectConfirm(opId: string, _reason: RejectReason | null) {
    setDismissed(prev => new Set(prev).add(opId));
    setRejectTarget(null);
  }

  // ── Draft actions ─────────────────────────────────────────────────────────
  function handleDraftApprove(draftId: string) {
    setApprovedDrafts(prev => new Set(prev).add(draftId));
    showToast('Draft approved');
  }

  function handleDraftReject(draftId: string) {
    setRejectedDrafts(prev => new Set(prev).add(draftId));
  }

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Page header */}
      <div style={{ padding: '28px 40px 0', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          05 · Agents
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 14 }}>
          Agents
        </div>

        {/* Stat strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Badge variant="brandSoft">{liveOps.length} opportunities</Badge>
          <Badge variant="warning">{liveDrafts.length} drafts pending review</Badge>
          <Badge variant="info">{allRecommendations.length} experiment recommendations</Badge>
          <Badge variant="secondary">31 actions this week</Badge>
        </div>

        {/* Tabs */}
        <TabsStrip
          active={activeTab}
          onChange={setActiveTab}
          counts={{
            opportunities:   liveOps.length,
            drafts:          liveDrafts.length,
            recommendations: allRecommendations.length,
          }}
        />
      </div>

      {/* Body */}
      <div style={{ padding: '20px 40px', maxWidth: 1100 }}>

        {/* ── Opportunities tab ── */}
        {activeTab === 'opportunities' && (
          <>
            <FilterRail
              filters={filters}
              onChange={setFilters}
              availableGames={availableGames}
            />
            {filteredOps.length === 0 ? (
              <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n400, textAlign: 'center', padding: '48px 0' }}>
                No opportunities match the current filters.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredOps.map(op => (
                  <div key={op.id} style={{ cursor: 'pointer' }}>
                    <OpportunityCard
                      opportunity={op}
                      mode="card"
                      onApprove={handleApprove}
                      onEdit={handleEdit}
                      onDismiss={handleDismiss}
                      onOpenThread={id => navigate(`/agents/op/${id.replace('ag-op-', '')}`)}
                      style={{ cursor: 'default' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Drafts tab ── */}
        {activeTab === 'drafts' && (
          <>
            {liveDrafts.length === 0 ? (
              <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, fontStyle: 'italic', padding: '48px 0', textAlign: 'center' }}>
                No drafts pending. The Authoring Agent waits for an approved opportunity or a typed intent.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {liveDrafts.map(draft => (
                  <DraftRow
                    key={draft.id}
                    draft={approvedDrafts.has(draft.id) ? { ...draft, status: 'approved' } : draft}
                    onApprove={handleDraftApprove}
                    onReject={handleDraftReject}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Recommendations tab ── */}
        {activeTab === 'recommendations' && (
          <>
            {allRecommendations.length === 0 ? (
              <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, fontStyle: 'italic', padding: '48px 0', textAlign: 'center' }}>
                No drafts pending. The Authoring Agent waits for an approved opportunity or a typed intent.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {allRecommendations.map(rec => {
                  // Construct a synthetic Opportunity shape for the embedded OpportunityCard
                  const syntheticOp: Opportunity = {
                    id: rec.id,
                    agent: 'experiment',
                    surfacedAt: rec.surfacedAt,
                    confidence: rec.type === 'scale' ? 0.92 : 0.61,
                    window: 'this week',
                    intent: rec.reason,
                    evidence: [{ label: rec.projection }],
                    proposed: { campaign: rec.campaignId },
                    whyNow: rec.projection,
                    game: rec.campaignId.startsWith('cmp-cfm') ? 'CFM' : 'NTH',
                    goal4r: 'retain',
                    status: rec.status === 'open' ? 'open' : rec.status === 'approved' ? 'approved' : 'dismissed',
                  };
                  return (
                    <OpportunityCard
                      key={rec.id}
                      opportunity={syntheticOp}
                      mode="embedded"
                      onApprove={() => showToast('Recommendation approved')}
                      onEdit={() => navigate(`/campaigns/${rec.campaignId}`)}
                      onDismiss={() => showToast('Recommendation dismissed')}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Activity tab ── */}
        {activeTab === 'activity' && (
          <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8 }}>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '140px 100px 90px 130px 1fr',
              gap: 12, padding: '8px 12px',
              fontFamily: T.fSans, fontSize: 10, fontWeight: 600,
              color: T.n400, textTransform: 'uppercase', letterSpacing: '0.07em',
              borderBottom: `1px solid ${T.n200}`,
            }}>
              <span>Timestamp</span>
              <span>Agent</span>
              <span>Action</span>
              <span>Outcome</span>
              <span>Description</span>
            </div>
            {allActivity.slice(0, 30).map(a => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      <RejectModal
        opportunityId={rejectTarget ?? ''}
        open={rejectTarget !== null}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />

      {/* Toast */}
      <Toast message={toast} visible={toastVisible} />
    </div>
  );
}
