/**
 * Stage 2 — Segment. Composes predicate from approved features, fetches live
 * audience count from query-svc, scans for existing-segment match, surfaces
 * threshold slider on the headline numeric feature, and offers 3 decisions.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../../theme';
import { PredicateBlocks } from './predicate-blocks';
import { AudienceCountCard } from './audience-count-card';
import { ThresholdSlider } from './threshold-slider';
import { ExistingSegmentMatch } from './existing-segment-match';
import { buildPredicate } from '../_state/predicate-builder';
import { fetchAudienceCount } from '../_state/audience-fetch';
import { matchSegment } from '../_state/segment-matcher';
import { allSegments } from '../../../../data/catalog/segments';
import { getPlaybookById } from '../../../../data/catalog/agents/compose-playbooks';
import type { ComposeSession } from '../_state/compose-types';
import type { HermesFeature } from '@hermes/contracts';

interface Props {
  session: ComposeSession;
  features: readonly HermesFeature[];
  onDecision: (decision: 'new-draft' | 'use-existing' | 'manual-edit', existingId?: string | null) => void;
  onThresholdChange: (rowId: string, value: number) => void;
  onAdvance: () => void;
  onReopenFeatures: () => void;
}

export const StageSegment: React.FC<Props> = ({
  session, onDecision, onThresholdChange, onAdvance, onReopenFeatures,
}) => {
  const navigate = useNavigate();
  const seg = session.stages.segment;
  const approved = session.stages.features.approved;

  const [count, setCount] = React.useState<number | null>(null);
  const [duration, setDuration] = React.useState<number | undefined>();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const predicate = React.useMemo(() => buildPredicate(approved), [approved]);
  const predicateKey = predicate ? JSON.stringify(predicate) : null;

  React.useEffect(() => {
    if (!predicate) return;
    setPending(true);
    setError(null);
    let cancelled = false;
    fetchAudienceCount(predicate)
      .then((res) => {
        if (cancelled) return;
        setCount(res.count);
        setDuration(res.durationMs);
        setPending(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'fetch failed');
        setPending(false);
      });
    return () => { cancelled = true; };
  }, [predicateKey]);

  const heuristicMatch = React.useMemo(
    () => matchSegment(approved.map((r) => r.featureId), allSegments, 0.6),
    [approved],
  );

  const playbookHintId = session.matchedPlaybook
    ? getPlaybookById(session.matchedPlaybook)?.segmentMatch.existingId ?? null
    : null;
  const playbookHintSegment = playbookHintId
    ? allSegments.find((s) => s.id === playbookHintId)
    : undefined;
  const effectiveMatch = heuristicMatch ?? (playbookHintSegment
    ? { segment: playbookHintSegment, jaccard: 0.95 }
    : null);

  const headlineRow = approved.find((r) => r.isHeadline) ?? approved[0];

  const handleManualEdit = () => {
    onDecision('manual-edit');
    navigate(`/segments/new?from=compose-${session.id}`);
  };

  if (approved.length === 0) {
    return (
      <div style={{ padding: 16, fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
        Approve at least one feature in Stage 1 to compose the segment.
      </div>
    );
  }

  const isStale = seg.status === 'stale';
  const decisionMade = seg.decision != null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {isStale && (
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: '#fffbeb', border: `1px solid #fde68a`, color: '#92400e',
          fontFamily: T.fSans, fontSize: 12,
        }}>
          ⚠ Predicate changed · re-validating audience…
        </div>
      )}
      <PredicateBlocks rows={approved} onEditFeatures={onReopenFeatures} />
      <AudienceCountCard
        status={pending ? 'computing' : seg.status}
        count={count}
        durationMs={duration}
        error={error}
      />
      {headlineRow && typeof headlineRow.threshold.value === 'number' && (
        <ThresholdSlider
          row={headlineRow}
          pending={pending}
          onChange={(v) => onThresholdChange(headlineRow.id, v)}
        />
      )}
      {effectiveMatch && (
        <ExistingSegmentMatch
          segment={effectiveMatch.segment}
          jaccard={effectiveMatch.jaccard}
          selected={seg.decision === 'use-existing'}
          onUseExisting={() => onDecision('use-existing', effectiveMatch.segment.id)}
        />
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          onClick={handleManualEdit}
          style={{
            padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
            background: '#fff', color: T.n700, border: `1px solid ${T.n200}`,
            fontFamily: T.fSans, fontSize: 12,
          }}
        >
          Open in /segments/new ↗
        </button>
        <button
          onClick={() => {
            if (!decisionMade) onDecision('new-draft');
            onAdvance();
          }}
          disabled={count == null && !decisionMade}
          style={{
            padding: '8px 16px', borderRadius: 8,
            cursor: count != null || decisionMade ? 'pointer' : 'not-allowed',
            background: count != null || decisionMade ? T.brand : T.n200,
            color: count != null || decisionMade ? '#fff' : T.n500,
            border: 0, fontFamily: T.fSans, fontSize: 13, fontWeight: 600,
          }}
        >
          {seg.decision === 'use-existing' ? 'Continue with existing →' : 'Approve as new draft →'}
        </button>
      </div>
    </div>
  );
};
