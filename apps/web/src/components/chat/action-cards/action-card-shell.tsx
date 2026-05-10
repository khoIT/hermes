/**
 * ActionCardShell — common scaffolding for segment / campaign / etc action cards.
 * Renders preview + Confirm/Refine/Cancel + pending/error/confirmed states.
 */
import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { T, Icon } from '../../../theme';

export type ActionCardStatus = 'preview' | 'pending' | 'error' | 'confirmed';

interface ActionCardShellProps {
  /** What kind of artifact, used in copy. e.g. "segment", "campaign". */
  kind: string;
  status: ActionCardStatus;
  /** Auto-derived preview name (or final name when confirmed). */
  name: string;
  /** Optional sub-line (e.g. predicate description). */
  subline?: string;
  /** Inline error message (when status === 'error'). */
  error?: string;
  /** When confirmed, deep-link to the new artifact's detail page. */
  viewHref?: string;
  /** Optional inline content rendered between subline and CTA row (e.g. feature pills). */
  inlineExtras?: React.ReactNode;
  onConfirm?: () => void;
  onRefine?: () => void;
  onCancel?: () => void;
  onView?: () => void;
}

export function ActionCardShell(props: ActionCardShellProps) {
  const {
    kind, status, name, subline, error, inlineExtras,
    viewHref, onConfirm, onRefine, onCancel, onView,
  } = props;

  if (status === 'confirmed') {
    return (
      <div style={{
        ...box,
        border: `1px solid ${T.green600}`,
        background: T.greenSoft,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 9999, background: T.green600,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon icon={Check} size={13} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n900 }}>
              {capitalize(kind)} created — {name}
            </div>
            {subline && (
              <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n500, marginTop: 2 }}>{subline}</div>
            )}
          </div>
          {(viewHref || onView) && (
            <button onClick={onView} style={viewBtn}>
              View <Icon icon={ExternalLink} size={11} color={T.brand} />
            </button>
          )}
        </div>
        {inlineExtras && <div style={{ marginTop: 10 }}>{inlineExtras}</div>}
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={{ marginBottom: 10 }}>
        <div style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500,
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
        }}>
          New {kind}
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 14, fontWeight: 600, color: T.n900 }}>
          {name}
        </div>
        {subline && (
          <div style={{ fontFamily: T.fMono, fontSize: 12, color: T.n600, marginTop: 4, lineHeight: 1.4 }}>
            {subline}
          </div>
        )}
        {inlineExtras && <div style={{ marginTop: 10 }}>{inlineExtras}</div>}
      </div>

      {status === 'error' && error && (
        <div style={{
          marginBottom: 10, padding: '6px 10px',
          background: T.redSoft, color: T.red600, borderRadius: 6,
          fontFamily: T.fSans, fontSize: 12,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onConfirm}
          disabled={status === 'pending'}
          style={{
            ...primaryBtn,
            opacity: status === 'pending' ? 0.6 : 1,
            cursor: status === 'pending' ? 'wait' : 'pointer',
          }}
        >
          {status === 'pending' ? 'Creating...' : 'Confirm'}
        </button>
        {onRefine && <button onClick={onRefine} style={ghostBtn}>Refine</button>}
        {onCancel && <button onClick={onCancel} style={ghostBtn}>Cancel</button>}
      </div>
    </div>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const box: React.CSSProperties = {
  border: `1px solid ${T.brandBorder}`,
  background: T.brandSoft,
  borderRadius: 10, padding: 14,
  margin: '12px 0', maxWidth: 820,
};

const primaryBtn: React.CSSProperties = {
  background: T.brand, color: '#fff', border: 'none',
  padding: '6px 14px', borderRadius: 7,
  fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  background: 'transparent', color: T.n700,
  border: `1px solid ${T.n200}`,
  padding: '6px 12px', borderRadius: 7,
  fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
  cursor: 'pointer',
};

const viewBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: T.surface, color: T.brand,
  border: `1px solid ${T.brandBorder}`,
  padding: '4px 10px', borderRadius: 6,
  fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
  cursor: 'pointer',
};
