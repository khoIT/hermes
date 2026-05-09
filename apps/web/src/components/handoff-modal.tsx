/**
 * HandoffModal — confirmation modal shown after Segment Build or Campaign Activate.
 * Cannot be dismissed by overlay click (per PRD §10 — modal is load-bearing artifact).
 * Shows verbatim mono substrate copy from handoff-modal-copy.ts.
 * Conditional AgentAttribution line when artifact was agent-drafted.
 * Per PRD §8.7 (segment) and §9.9 (campaign).
 */
import React from 'react';
import { T } from '../theme';
import { AgentAttribution } from './agent-attribution';
import {
  SEGMENT_STEPS, SEGMENT_SUBSTRATE_LINE, SEGMENT_CONSUMER_PATH,
  CAMPAIGN_STEPS, CAMPAIGN_SUBSTRATE_LINE, CAMPAIGN_TEE_NOTE, CAMPAIGN_CONSUMER_PATH,
  type HandoffStep,
} from './handoff-modal-copy';

export type HandoffIdType = 'segment' | 'campaign';
export type HandoffSubstrate = 'A' | 'B' | 'hybrid';

interface AgentAttributionData {
  agentLabel?: string;
  approvedBy?: string;
  threadId?: string;
}

interface HandoffModalProps {
  open: boolean;
  idType: HandoffIdType;
  /** The minted ID, e.g. seg-cfm-loss-streak-non-paying-2026-0508-a3f9 */
  id: string;
  substrate?: HandoffSubstrate;
  /** Override steps (defaults to PRD-verbatim per idType) */
  steps?: HandoffStep[];
  consumerPath?: string;
  agentAttribution?: AgentAttributionData;
  onOpenMonitoring?: () => void;
  onUseCampaign?: () => void;
  onDone: () => void;
}

function CheckIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke={T.green600} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} style={{
      fontFamily: T.fMono, fontSize: 10, color: copied ? T.green600 : T.n500,
      background: 'none', border: `1px solid ${T.n200}`,
      borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
      marginLeft: 8, flexShrink: 0,
    }}>
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

function StepList({ steps }: { steps: HandoffStep[] }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {steps.map((s, i) => (
        <li key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: 16, marginBottom: 6, alignItems: 'baseline',
        }}>
          <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n800 }}>
            {i + 1}.{'  '}{s.text}
          </span>
          <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400, whiteSpace: 'nowrap' }}>
            · {s.status}
          </span>
        </li>
      ))}
    </ol>
  );
}

export const HandoffModal = React.memo<HandoffModalProps>(({
  open, idType, id, substrate, steps: stepsProp,
  agentAttribution, onOpenMonitoring, onUseCampaign, onDone,
}) => {
  // Escape key → same as Done (intentional — not overlay click)
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onDone]);

  if (!open) return null;

  const isSegment = idType === 'segment';
  const isHybrid  = substrate === 'hybrid';

  const segSteps = stepsProp ?? (isSegment || isHybrid ? SEGMENT_STEPS : undefined);
  const cmpSteps = stepsProp ?? (!isSegment || isHybrid ? CAMPAIGN_STEPS : undefined);

  const idLabel = isSegment ? 'SegmentID' : 'CampaignID';
  const title   = isSegment ? 'Segment registered' : 'Campaign activated';

  return (
    /* Overlay — no onClick dismiss per PRD §10 */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(10,10,10,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12,
        width: 560, maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        padding: '28px 32px',
      }}>
        {/* Success header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <CheckIcon />
          <span style={{ fontFamily: T.fDisp, fontSize: 22, fontWeight: 400, textTransform: 'uppercase', color: T.green600, letterSpacing: '0.03em' }}>
            {title}
          </span>
        </div>

        {/* ID block */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {idLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: T.n50, border: `1px solid ${T.n200}`, borderRadius: 6, padding: '8px 12px' }}>
            <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.n800, wordBreak: 'break-all', flex: 1 }}>
              {id}
            </span>
            <CopyButton text={id} />
          </div>
        </div>

        {/* Agent attribution — conditional, above "What happens next" */}
        {agentAttribution && (
          <AgentAttribution
            agentLabel={agentAttribution.agentLabel}
            approvedBy={agentAttribution.approvedBy}
            threadId={agentAttribution.threadId}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* What happens next */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n500,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            borderTop: `1px solid ${T.n100}`, paddingTop: 14,
          }}>
            What happens next
          </div>

          {/* Segment steps */}
          {(isSegment || isHybrid) && segSteps && (
            <div style={{ marginBottom: isHybrid ? 16 : 0 }}>
              <StepList steps={segSteps} />
              <div style={{ marginTop: 10, fontFamily: T.fMono, fontSize: 11, color: T.n600 }}>
                {SEGMENT_SUBSTRATE_LINE}
              </div>
              <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, marginTop: 2 }}>
                {SEGMENT_CONSUMER_PATH}
              </div>
            </div>
          )}

          {/* Campaign steps */}
          {(!isSegment || isHybrid) && cmpSteps && (
            <div style={{ marginTop: isHybrid ? 12 : 0 }}>
              {isHybrid && <div style={{ height: 1, background: T.n100, margin: '12px 0' }} />}
              <StepList steps={cmpSteps} />
              <div style={{ marginTop: 10, fontFamily: T.fMono, fontSize: 11, color: T.n600 }}>
                {CAMPAIGN_SUBSTRATE_LINE}
              </div>
              <pre style={{
                fontFamily: T.fMono, fontSize: 11, color: T.n500,
                margin: '4px 0 0', whiteSpace: 'pre-wrap', background: 'none', padding: 0,
              }}>
                {CAMPAIGN_TEE_NOTE}
              </pre>
              <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, marginTop: 2 }}>
                {CAMPAIGN_CONSUMER_PATH}
              </div>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.n100}` }}>
          {onOpenMonitoring && (
            <button onClick={onOpenMonitoring} style={{
              fontFamily: T.fSans, fontSize: 13, color: T.n800,
              background: T.n50, border: `1px solid ${T.n200}`,
              borderRadius: 7, padding: '8px 14px', cursor: 'pointer',
            }}>
              Open in monitoring
            </button>
          )}
          {isSegment && onUseCampaign && (
            <button onClick={onUseCampaign} style={{
              fontFamily: T.fSans, fontSize: 13, color: T.n800,
              background: T.n50, border: `1px solid ${T.n200}`,
              borderRadius: 7, padding: '8px 14px', cursor: 'pointer',
            }}>
              Use in campaign
            </button>
          )}
          <button onClick={onDone} style={{
            fontFamily: T.fSans, fontSize: 13, color: '#fff',
            background: T.n900, border: 'none',
            borderRadius: 7, padding: '8px 18px', cursor: 'pointer',
            marginLeft: 'auto',
          }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
});
HandoffModal.displayName = 'HandoffModal';
