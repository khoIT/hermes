/**
 * QuickCampaignDialog — lightweight modal for creating a campaign from a chat response.
 * Pre-fills name from narrative first sentence; type picker; seed segment dropdown.
 * Escape hatch: "Open full composer" → /campaigns/new/:type?from=chat
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Megaphone } from 'lucide-react';
import { T, Button, Input, Icon } from '../../theme';
import { createCampaign, type CreateCampaignPayload } from '../../api/campaigns-client';
import { useActiveThreadId } from '../../utils/active-thread-context';
import { toast } from '../ui/toast';
import type { PrefillContext } from '../../utils/response-prefill';

interface Props {
  prefill: PrefillContext;
  onClose: () => void;
}

type CampaignType = CreateCampaignPayload['type'];

const TYPE_OPTIONS: { value: CampaignType; label: string; desc: string }[] = [
  { value: 'realtime',  label: 'Realtime',  desc: 'Triggered on event' },
  { value: 'scheduled', label: 'Scheduled', desc: 'Runs on a schedule' },
  { value: 'onetime',   label: 'One-time',  desc: 'Single send' },
];

export function QuickCampaignDialog({ prefill, onClose }: Props) {
  const navigate = useNavigate();
  const threadId = useActiveThreadId();

  const defaultName = React.useMemo(() => {
    const clean = prefill.narrative.replace(/\*\*/g, '').replace(/`[^`]*`/g, '').trim();
    const first = (clean.split(/[.!?]/)[0] ?? '').trim();
    return first.slice(0, 60) || 'New campaign';
  }, [prefill.narrative]);

  const [name, setName] = React.useState(defaultName);
  const [type, setType] = React.useState<CampaignType>('realtime');
  const [segmentId, setSegmentId] = React.useState<string>(prefill.hintedSegmentId ?? '');
  const [busy, setBusy] = React.useState(false);

  const fullComposerHref = `/campaigns/new/${type}?from=chat`;

  const onSave = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const result = await createCampaign({
        name: name.trim(),
        type,
        segmentId: segmentId.trim() || undefined,
        sourceThreadId: threadId ?? undefined,
      });
      toast(
        result.live
          ? `Campaign "${result.name}" created`
          : `Campaign "${result.name}" created (stub)`,
        { tone: 'success' },
      );
      onClose();
      navigate(`/campaigns/${result.id}`);
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
            <Icon icon={Megaphone} size={15} color={T.brand} />
            <span style={{ fontSize: 14, fontWeight: 600, color: T.n900 }}>Build campaign</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.n500, padding: 4, borderRadius: 6, lineHeight: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = T.n100; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <Icon icon={X} size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.n600, marginBottom: 6 }}>Campaign name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Loss streak intervention" style={{ width: '100%' }} />
          </div>

          {/* Type picker */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.n600, marginBottom: 6 }}>Type</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  title={opt.desc}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', textAlign: 'center',
                    border: `1px solid ${type === opt.value ? T.brand : T.n200}`,
                    background: type === opt.value ? T.brandSoft : '#fff',
                    color: type === opt.value ? T.brand : T.n700,
                    transition: 'all .12s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seed segment */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.n600, marginBottom: 6 }}>
              Segment ID <span style={{ fontWeight: 400, color: T.n400 }}>(optional)</span>
            </label>
            <Input
              value={segmentId}
              onChange={e => setSegmentId(e.target.value)}
              placeholder={prefill.hintedSegmentId ?? 'seg-…'}
              style={{ width: '100%', fontFamily: T.fMono, fontSize: 12 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px', borderTop: `1px solid ${T.n100}` }}>
          <a
            href={fullComposerHref}
            onClick={e => { e.preventDefault(); onClose(); navigate(fullComposerHref); }}
            style={{ fontSize: 12, color: T.n500, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Open full composer
          </a>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={onSave} disabled={busy || !name.trim()}>
              {busy ? 'Saving…' : 'Build campaign'}
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
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
