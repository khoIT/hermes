/**
 * 10 — Campaign Canvas · Real-time (cmp_canvas_realtime)
 * Centerpiece variant. Composes all blocks. Shows dual-substrate bottom bar.
 * Supports:
 *   ?seedSegment=<id>  — "Use in campaign" flow from P-7
 *   ?from=draft-<id>   — Agent draft review mode (Agentic §5.4)
 */
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { T } from '../../../theme';
import { AgentAttribution } from '../../../components/agent-attribution';
import { TriggerTypeControl } from './_blocks/trigger-type-control';
import { Goal4R }             from './_blocks/goal-4r';
import type { Goal4R as Goal4RType } from './_blocks/goal-4r';
import { IntentBlock }        from './_blocks/intent-block';
import { AudienceBlock }      from './_blocks/audience-block';
import { ScheduleBlock }      from './_blocks/schedule-block';
import { EventTriggerBlock }  from './_blocks/event-trigger-block';
import { ActionBlock }        from './_blocks/action-block';
import { HoldoutBlock }       from './_blocks/holdout-block';
import { ForecastBlock }      from './_blocks/forecast-block';
import { CampaignMaterialsShelf } from './_blocks/materials-shelf';
import { CampaignHandoffModal } from '../handoff-modal';
import type { EventSource } from './_blocks/event-source-picker';

interface SelectedSegment { id: string; name: string; reach: number }

export default function CampaignCanvasRealtimePage() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const seedSegmentId               = searchParams.get('seedSegment');
  const fromDraftParam              = searchParams.get('from');
  const draftId                     = fromDraftParam?.startsWith('draft-') ? fromDraftParam.slice(6) : null;

  const [triggerType, setTriggerType] = React.useState<'real-time' | 'scheduled' | 'one-time'>('real-time');
  const [goal, setGoal]             = React.useState<Goal4RType>('retain');
  const [intent, setIntent]         = React.useState('');
  const [segment, setSegment]       = React.useState<SelectedSegment | null>(null);
  const [eventSource, setEventSource] = React.useState<EventSource | null>(null);
  const [handoffOpen, setHandoffOpen] = React.useState(false);

  // Redirect if trigger type switched away from real-time
  function handleTriggerTypeChange(v: 'real-time' | 'scheduled' | 'one-time') {
    if (v === 'scheduled') { navigate('/campaigns/new/scheduled'); return; }
    if (v === 'one-time')  { navigate('/campaigns/new/onetime');   return; }
    setTriggerType(v);
  }

  const isHybrid = segment !== null && eventSource !== null;
  const substrateLabel = isHybrid
    ? 'Substrate A (Apollo TEE) + Substrate B (Hatchet)'
    : 'Substrate A (Apollo TEE) + Temporal';

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Page header */}
      <div style={{ padding: '24px 40px 0', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          04 · Campaign · New
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16 }}>
          <div style={{ fontFamily: T.fDisp, fontSize: 32, textTransform: 'uppercase', color: T.n950, lineHeight: 1 }}>
            New Campaign
          </div>
          <TriggerTypeControl value={triggerType} onChange={handleTriggerTypeChange} />
        </div>
      </div>

      {/* Agent draft review banner (Agentic §5.4) — shown when ?from=draft-{id} */}
      {draftId && (
        <div style={{
          background: T.brandSoft, borderBottom: `1px solid ${T.brandBorder}`,
          padding: '10px 40px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n800 }}>
            <strong>▸ Reviewing agent draft.</strong> Edit freely. Approving without edits keeps the 'Agent-drafted' badge; saving with edits adds your name as co-author.
          </span>
          <AgentAttribution
            agentLabel="Authoring Agent"
            threadId={`ag-${draftId}`}
            style={{ marginLeft: 'auto', flexShrink: 0 }}
          />
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 0, maxWidth: 1400, margin: '0 auto' }}>

        {/* Main canvas */}
        <div style={{ padding: '24px 32px 120px', borderRight: `1px solid ${T.n200}` }}>

          {/* Goal + Intent */}
          <CanvasSection label="Goal">
            <Goal4R value={goal} onChange={setGoal} />
          </CanvasSection>

          <CanvasSection label="Intent">
            <IntentBlock value={intent} onChange={setIntent} />
          </CanvasSection>

          {/* Audience (optional for real-time) */}
          <CanvasSection>
            <AudienceBlock
              required={false}
              selected={segment}
              onSelect={setSegment}
              onClear={() => setSegment(null)}
              seedSegmentId={seedSegmentId}
            />
          </CanvasSection>

          {/* Schedule */}
          <CanvasSection>
            <ScheduleBlock triggerType="real-time" />
          </CanvasSection>

          {/* Event trigger (real-time only) */}
          <CanvasSection>
            <EventTriggerBlock
              onEventSelected={setEventSource}
              defaultEventName="event_match_end"
            />
          </CanvasSection>

          {/* Action */}
          <CanvasSection>
            <ActionBlock />
          </CanvasSection>

          {/* Holdout */}
          <CanvasSection>
            <HoldoutBlock defaultHoldout={0.10} />
          </CanvasSection>

          {/* Forecast */}
          <CanvasSection>
            <ForecastBlock />
          </CanvasSection>
        </div>

        {/* Right rail */}
        <div style={{ padding: '24px 16px 120px' }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
          }}>
            Materials
          </div>
          <CampaignMaterialsShelf
            segment={segment}
            eventSource={eventSource}
            pattern={{
              id: 'ia-pass-stuck-rescue',
              name: 'Pass Stuck Rescue',
              liftBand: '+6–9% D1 retention',
              portfolioUses: 3,
            }}
          />
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#fff', borderTop: `1px solid ${T.n200}`,
        padding: '12px 40px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Substrate copy */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, marginBottom: 2 }}>Compiles to:</div>
          <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>{substrateLabel}</div>
        </div>

        <button style={{ ...btnStyle, background: T.n100, color: T.n700, border: `1px solid ${T.n200}` }}>
          Save draft
        </button>
        <button style={{ ...btnStyle, background: T.n100, color: T.n700, border: `1px solid ${T.n200}` }}>
          Backtest 30d
        </button>
        <button style={{ ...btnStyle, background: T.n100, color: T.n700, border: `1px solid ${T.n200}` }}>
          Test on 100
        </button>
        <button
          onClick={() => navigate('/campaigns/cmp-cfm-407/prelaunch')}
          style={{ ...btnStyle, background: T.n100, color: T.n700, border: `1px solid ${T.n200}` }}
        >
          Pre-launch
        </button>
        <button
          onClick={() => setHandoffOpen(true)}
          style={{ ...btnStyle, background: T.brand, color: '#fff', border: 'none', fontWeight: 700 }}
        >
          Activate
        </button>
        <button
          onClick={() => setHandoffOpen(true)}
          style={{ ...btnStyle, background: T.n900, color: '#fff', border: 'none' }}
        >
          5% rollout →
        </button>
      </div>

      {/* Handoff modal */}
      {handoffOpen && (
        <CampaignHandoffModal
          open={handoffOpen}
          campaignId="cmp-cfm-407"
          triggerId={eventSource ? 'trg-cfm-pass-stuck' : undefined}
          segmentId={segment?.id}
          isHybrid={isHybrid}
          isAgentDrafted={draftId !== null}
          onOpenMonitoring={() => navigate('/campaigns/cmp-cfm-407')}
          onDone={() => setHandoffOpen(false)}
        />
      )}
    </div>
  );
}

function CanvasSection({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.n200}`,
      borderRadius: 10, padding: '16px 20px', marginBottom: 12,
    }}>
      {label && (
        <div style={{
          fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  whiteSpace: 'nowrap',
};
