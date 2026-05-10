/**
 * QuickSegmentDialog — lightweight modal for creating a segment from a chat response.
 * Pre-fills name, feature hint, and 4R goal from extractPrefillContext.
 * Escape hatch: "Open full composer" → /segments/new?seedFeature=…&from=chat
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Target } from 'lucide-react';
import { T, Button, Input, Icon } from '../../theme';
import { createSegment } from '../../api/segments-client';
import { useActiveThreadId } from '../../utils/active-thread-context';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../sidebar/recent-items';
import { toast } from '../ui/toast';
import { type Goal4R } from '../../utils/four-r-inference';
import type { PrefillContext } from '../../utils/response-prefill';

interface Props {
  prefill: PrefillContext;
  onClose: () => void;
}

const GOAL_LABELS: Record<Goal4R, string> = {
  retain: 'Retain',
  revenue: 'Revenue',
  reactivate: 'Reactivate',
  recruit: 'Recruit',
};

const GOALS: Goal4R[] = ['retain', 'revenue', 'reactivate', 'recruit'];

export function QuickSegmentDialog({ prefill, onClose }: Props) {
  const navigate = useNavigate();
  const threadId = useActiveThreadId();

  // Derive default name from first sentence of narrative
  const defaultName = React.useMemo(() => {
    const clean = prefill.narrative.replace(/\*\*/g, '').replace(/`[^`]*`/g, '').trim();
    const first = (clean.split(/[.!?]/)[0] ?? '').trim();
    return first.slice(0, 60) || 'New segment';
  }, [prefill.narrative]);

  const [name, setName] = React.useState(defaultName);
  const [goal, setGoal] = React.useState<Goal4R | null>(prefill.goal4r ?? null);
  const [busy, setBusy] = React.useState(false);

  const seedFeature = prefill.features[0] ?? '';
  const fullComposerHref = `/segments/new?${seedFeature ? `seedFeature=${encodeURIComponent(seedFeature)}&` : ''}from=chat`;

  const onSave = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const result = await createSegment({
        name: name.trim(),
        description: prefill.features.length
          ? `Features: ${prefill.features.join(', ')}`
          : undefined,
        predicate: prefill.features.length
          ? { features: prefill.features, goal4r: goal ?? undefined }
          : undefined,
        sourceThreadId: threadId ?? undefined,
      });
      pushRecent('segments', {
        id: result.id,
        title: result.name,
        updatedAt: new Date().toISOString(),
        href: `/segments/${result.id}`,
      });
      notifyRecentChanged();
      toast(result.live ? `Segment "${result.name}" created` : `Segment "${result.name}" created (stub)`, { tone: 'success' });
      onClose();
      navigate(`/segments/${result.id}`);
    } catch (e) {
      toast(`Failed: ${e instanceof Error ? e.message : 'unknown error'}`, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 420, background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: T.fSans }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: `1px solid ${T.n100}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon icon={Target} size={15} color={T.brand} />
            <span style={{ fontSize: 14, fontWeight: 600, color: T.n900 }}>Save as segment</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.n500, padding: 4, borderRadius: 6, lineHeight: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
            <Icon icon={X} size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.n600, marginBottom: 6 }}>Segment name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Churned VIP players" style={{ width: '100%' }} />
          </div>

          {/* Feature hint */}
          {seedFeature && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.n600, marginBottom: 6 }}>Seed feature</label>
              <div style={{ fontSize: 12, color: T.n700, background: T.n50, border: `1px solid ${T.n200}`, borderRadius: 6, padding: '6px 10px', fontFamily: T.fMono }}>
                {seedFeature}
              </div>
            </div>
          )}

          {/* 4R Goal chips */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.n600, marginBottom: 6 }}>4R goal <span style={{ fontWeight: 400, color: T.n400 }}>(optional)</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {GOALS.map(g => (
                <button key={g} onClick={() => setGoal(goal === g ? null : g)}
                  style={{
                    padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    border: `1px solid ${goal === g ? T.brand : T.n200}`,
                    background: goal === g ? T.brandSoft : '#fff',
                    color: goal === g ? T.brand : T.n700,
                    transition: 'all .12s',
                  }}>
                  {GOAL_LABELS[g]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px', borderTop: `1px solid ${T.n100}` }}>
          <a href={fullComposerHref} onClick={e => { e.preventDefault(); onClose(); navigate(fullComposerHref); }}
            style={{ fontSize: 12, color: T.n500, textDecoration: 'underline', cursor: 'pointer' }}>
            Open full composer
          </a>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={onSave} disabled={busy || !name.trim()}>
              {busy ? 'Saving…' : 'Save segment'}
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Close on backdrop click
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}
