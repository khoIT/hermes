/**
 * 11 — Campaign Canvas · Scheduled (cmp_canvas_scheduled)
 * Audience required. Event trigger block hidden. Cadence + start/end schedule.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../../theme';
import { TriggerTypeControl } from './_blocks/trigger-type-control';
import { Goal4R }             from './_blocks/goal-4r';
import { IntentBlock }        from './_blocks/intent-block';
import { AudienceBlock }      from './_blocks/audience-block';
import { ScheduleBlock }      from './_blocks/schedule-block';
import { ActionBlock }        from './_blocks/action-block';
import { HoldoutBlock }       from './_blocks/holdout-block';
import { ForecastBlock }      from './_blocks/forecast-block';
import { CampaignMaterialsShelf } from './_blocks/materials-shelf';
import { CampaignHandoffModal } from '../handoff-modal';
import type { Goal4R as Goal4RType } from './_blocks/goal-4r';

interface SelectedSegment { id: string; name: string; reach: number }

export default function CampaignCanvasScheduledPage() {
  const navigate                       = useNavigate();
  const [goal, setGoal]                = React.useState<Goal4RType>('revenue');
  const [intent, setIntent]            = React.useState('');
  const [segment, setSegment]          = React.useState<SelectedSegment | null>(null);
  const [handoffOpen, setHandoffOpen]  = React.useState(false);

  function handleTriggerType(v: 'real-time' | 'scheduled' | 'one-time') {
    if (v === 'real-time') { navigate('/campaigns/new/realtime'); return; }
    if (v === 'one-time')  { navigate('/campaigns/new/onetime');  return; }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      <div style={{ padding: '24px 40px 0', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          04 · Campaign · New
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16 }}>
          <div style={{ fontFamily: T.fDisp, fontSize: 32, textTransform: 'uppercase', color: T.n950, lineHeight: 1 }}>
            New Campaign
          </div>
          <TriggerTypeControl value="scheduled" onChange={handleTriggerType} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ padding: '24px 32px 120px', borderRight: `1px solid ${T.n200}` }}>
          <CanvasSection label="Goal">
            <Goal4R value={goal} onChange={setGoal} />
          </CanvasSection>
          <CanvasSection label="Intent">
            <IntentBlock value={intent} onChange={setIntent} />
          </CanvasSection>
          <CanvasSection>
            <AudienceBlock required selected={segment} onSelect={setSegment} onClear={() => setSegment(null)} />
          </CanvasSection>
          <CanvasSection>
            <ScheduleBlock triggerType="scheduled" />
          </CanvasSection>
          <CanvasSection>
            <ActionBlock />
          </CanvasSection>
          <CanvasSection>
            <HoldoutBlock defaultHoldout={0.05} />
          </CanvasSection>
          <CanvasSection>
            <ForecastBlock />
          </CanvasSection>
        </div>
        <div style={{ padding: '24px 16px 120px' }}>
          <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Materials
          </div>
          <CampaignMaterialsShelf segment={segment} />
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#fff', borderTop: `1px solid ${T.n200}`,
        padding: '12px 40px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, marginBottom: 2 }}>Compiles to:</div>
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>Substrate B · Hatchet + Trino + Iceberg</div>
        </div>
        <button style={{ ...btnStyle, background: T.n100, color: T.n700, border: `1px solid ${T.n200}` }}>Save draft</button>
        <button style={{ ...btnStyle, background: T.n100, color: T.n700, border: `1px solid ${T.n200}` }}>Backtest 30d</button>
        <button style={{ ...btnStyle, background: T.n100, color: T.n700, border: `1px solid ${T.n200}` }}>Pre-launch</button>
        <button
          onClick={() => setHandoffOpen(true)}
          style={{ ...btnStyle, background: T.brand, color: '#fff', border: 'none', fontWeight: 700 }}
        >
          Activate
        </button>
      </div>

      {handoffOpen && (
        <CampaignHandoffModal
          open={handoffOpen}
          campaignId="cmp-cfm-411"
          segmentId={segment?.id}
          isHybrid={false}
          isAgentDrafted={false}
          onDone={() => setHandoffOpen(false)}
        />
      )}
    </div>
  );
}

function CanvasSection({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10, padding: '16px 20px', marginBottom: 12 }}>
      {label && (
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
};
