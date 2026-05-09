/**
 * 04 — Segment Authoring Canvas (seg_canvas)
 * Placeholder — wired in Phase 7.
 * Smoke: renders AudienceBand + HandoffModal CTA for P-5 success criteria.
 */
import React from 'react';
import { T } from '../../theme';
import { AudienceBand } from '../../components/audience-band';
import { HandoffModal } from '../../components/handoff-modal';

export default function SegmentsCanvasPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>03 · Segments · New</div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 16 }}>New Segment</div>

      <AudienceBand
        uids={23890}
        percentMau={1.9}
        percentSubpop={8.2}
        subpopLabel="CFM ranked active"
        breakdown={{
          lifecycle: [
            { label: 'NRU', fraction: 0.05 },
            { label: 'Mid', fraction: 0.42 },
            { label: 'Veteran', fraction: 0.53 },
          ],
          spendTier: [
            { label: 'Free', fraction: 0.61 },
            { label: 'Low', fraction: 0.21 },
            { label: 'Mid', fraction: 0.12 },
            { label: 'High', fraction: 0.05 },
            { label: 'Whale', fraction: 0.01 },
          ],
        }}
        style={{ marginBottom: 24 }}
      />

      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 16 }}>
        Screen 04 · seg_canvas · Predicate composer wired in Phase 7.
      </p>

      <button
        onClick={() => setModalOpen(true)}
        style={{
          fontFamily: T.fSans, fontSize: 13, fontWeight: 500, color: '#fff',
          background: T.n900, border: 'none', borderRadius: 7, padding: '8px 18px', cursor: 'pointer',
        }}
      >
        Build segment → (opens handoff modal)
      </button>

      <HandoffModal
        open={modalOpen}
        idType="segment"
        id="seg-cfm-loss-streak-non-paying-2026-0508-a3f9"
        substrate="B"
        onDone={() => setModalOpen(false)}
      />
    </div>
  );
}
