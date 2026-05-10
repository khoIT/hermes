/**
 * ResponseActionBar — 6 icons across the bottom of an assistant response:
 *   Download · Copy · Slack · ⚡credits · 👍 · 👎
 *
 * Most actions toast "Demo only"; Copy uses navigator.clipboard.writeText().
 * Thumbs are local state with toast acknowledgement.
 */
import React from 'react';
import {
  Download, Copy, Hash, Zap, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { T, Icon } from '../../theme';
import { toast } from '../ui/toast';

interface ResponseActionBarProps {
  /** Plain-text fallback used by Copy. */
  copyText: string;
  /** Display credits used by this response. */
  credits?: number;
}

export function ResponseActionBar({ copyText, credits }: ResponseActionBarProps) {
  const [thumbs, setThumbs] = React.useState<'up' | 'down' | null>(null);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      toast('Copied to clipboard', { tone: 'success' });
    } catch {
      toast('Copy failed', { tone: 'error' });
    }
  };

  const Btn = ({ icon, label, onClick, active }: {
    icon: any; label: string; onClick: () => void; active?: boolean;
  }) => (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 6,
        background: active ? T.brandSoft : 'transparent',
        border: 'none', cursor: 'pointer',
        fontFamily: T.fSans, fontSize: 11, color: active ? T.brand : T.n600,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.n100; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon icon={icon} size={13} color="currentColor" />
    </button>
  );

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: '6px 4px',
      borderTop: `1px solid ${T.n100}`, marginTop: 12, maxWidth: 820, width: '100%',
    }}>
      <Btn icon={Download} label="Download" onClick={() => toast('Download — demo only')} />
      <Btn icon={Copy} label="Copy" onClick={onCopy} />
      <Btn icon={Hash} label="Share to Slack" onClick={() => toast('Slack share — demo only')} />
      <span style={{ flex: 1 }} />
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontFamily: T.fMono, fontSize: 11, color: T.n500,
        padding: '0 6px',
      }} title="Demo metric, no billing in v1">
        <Icon icon={Zap} size={11} color={T.amber500} />
        {credits ?? 0}
      </span>
      <Btn icon={ThumbsUp} label="Helpful" onClick={() => {
        setThumbs('up'); toast('Marked helpful', { tone: 'success' });
      }} active={thumbs === 'up'} />
      <Btn icon={ThumbsDown} label="Not helpful" onClick={() => {
        setThumbs('down'); toast('Feedback recorded');
      }} active={thumbs === 'down'} />
    </div>
  );
}
