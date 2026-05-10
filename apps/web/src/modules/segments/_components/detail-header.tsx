/**
 * SegmentDetailHeader — hero header for /segments/:id pages.
 * Renders breadcrumb · hero name · status row (count, last build, drift pill,
 * source thread pill) · right-aligned ActionBar (Pin · SQL · Send campaign ·
 * Rebuild · ⋯).
 *
 * Pin/SQL/Duplicate/Archive/Export ship disabled with "Coming soon" tooltips —
 * placeholder behaviour would read worse than absent on demo machines.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pin, Code2, Megaphone, RotateCcw, MoreHorizontal,
} from 'lucide-react';
import { T } from '../../../theme';
import type { HermesSegment } from '@hermes/contracts';
import { SourceThreadPill } from '../../../components/chat-rail/source-thread-pill';
import { toast } from '../../../components/ui/toast';

interface Props { segment: HermesSegment }

const HAIRLINE = 'rgba(0,0,0,0.08)';

function fmtBuild(iso?: string): string {
  if (!iso) return 'Not synced yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `Last build ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function SegmentDetailHeader({ segment }: Props) {
  const navigate = useNavigate();
  return (
    <div style={{
      padding: '20px 32px 16px',
      borderBottom: `1px solid ${HAIRLINE}`,
      background: '#fff',
    }}>
      {/* Breadcrumb */}
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
        color: T.n500, letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        <Link to="/segments" style={{ color: T.n500, textDecoration: 'none' }}>
          Segments
        </Link>
        <span style={{ margin: '0 6px', color: T.n300 }}>/</span>
        <span style={{ color: T.brand }}>{segment.displayName}</span>
      </div>

      {/* Hero row + action bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 460px', minWidth: 0 }}>
          <h1 style={{
            margin: 0,
            fontFamily: T.fDisp, fontSize: 32, fontWeight: 400,
            color: T.n950, lineHeight: 1, letterSpacing: '0.005em',
            textTransform: 'uppercase',
          }}>
            {segment.displayName}
          </h1>
          <div style={{
            marginTop: 4, fontFamily: T.fMono, fontSize: 11, color: T.n500,
          }}>
            {segment.id}
          </div>

          {/* Status row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            marginTop: 12,
          }}>
            <span style={{
              fontFamily: T.fSans, fontSize: 14, color: T.n900,
            }}>
              <strong style={{ fontFamily: T.fMono, fontSize: 16, fontWeight: 600 }}>
                {(segment.audienceSize ?? 0).toLocaleString()}
              </strong>
              {' users'}
            </span>
            <span style={{ fontSize: 11, color: T.n300 }}>·</span>
            <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600 }}>
              {fmtBuild(segment.lastBuildAt)}
            </span>
            {segment.drift && (
              <>
                <span style={{ fontSize: 11, color: T.n300 }}>·</span>
                <span style={{
                  fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
                  color: '#92400e', background: T.amberSoft,
                  border: `1px solid ${T.amber500}`, borderRadius: 999,
                  padding: '2px 10px', letterSpacing: '0.02em',
                }}>
                  ⚠ Drift detected
                </span>
              </>
            )}
            {segment.sourceThreadId && (
              <SourceThreadPill
                threadId={segment.sourceThreadId}
                variant="header"
                prefix="💬 Last asked"
              />
            )}
          </div>
        </div>

        <ActionBar
          segmentId={segment.id}
          onSendCampaign={() => navigate(`/campaigns/new/realtime?seedSegmentId=${segment.id}`)}
          onRebuild={() => toast('Rebuild scheduled', { tone: 'success' })}
        />
      </div>
    </div>
  );
}

interface ActionBarProps {
  segmentId: string;
  onSendCampaign: () => void;
  onRebuild: () => void;
}

function ActionBar({ onSendCampaign, onRebuild }: ActionBarProps) {
  const [overflowOpen, setOverflowOpen] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
      <DisabledButton icon={<Pin size={14} />} label="Pin to board" />
      <DisabledButton icon={<Code2 size={14} />} label="SQL" />
      <ToolbarButton
        icon={<Megaphone size={14} />}
        label="Send campaign"
        primary
        onClick={onSendCampaign}
      />
      <ToolbarButton
        icon={<RotateCcw size={14} />}
        label="Rebuild"
        onClick={onRebuild}
      />
      <button
        onClick={() => setOverflowOpen(o => !o)}
        aria-label="More actions"
        style={{
          fontFamily: T.fSans, color: T.n700, background: '#fff',
          border: `1px solid ${T.n200}`, borderRadius: 7,
          width: 30, height: 30, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <MoreHorizontal size={14} />
      </button>
      {overflowOpen && (
        <div
          onMouseLeave={() => setOverflowOpen(false)}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0,
            zIndex: 30, minWidth: 160, padding: 4,
            background: '#fff', border: `1px solid ${T.n200}`,
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          {['Duplicate', 'Archive', 'Export'].map(x => (
            <div
              key={x}
              title="Coming soon"
              style={{
                fontFamily: T.fSans, fontSize: 12, color: T.n400,
                padding: '6px 10px', cursor: 'not-allowed',
              }}
            >
              {x}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  onClick: () => void;
}

function ToolbarButton({ icon, label, primary, onClick }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: T.fSans, fontSize: 12, fontWeight: primary ? 600 : 500,
        color: primary ? '#fff' : T.n700,
        background: primary ? T.brand : '#fff',
        border: `1px solid ${primary ? T.brand : T.n200}`,
        borderRadius: 7, padding: '7px 12px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function DisabledButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      disabled
      title="Coming soon"
      style={{
        fontFamily: T.fSans, fontSize: 12, fontWeight: 500, color: T.n400,
        background: T.n50, border: `1px solid ${T.n200}`,
        borderRadius: 7, padding: '7px 12px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'not-allowed',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
