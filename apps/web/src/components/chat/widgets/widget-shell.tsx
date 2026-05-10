/**
 * WidgetShell — title bar + Pin to board + Data ▾ dropdown wrapping any widget body.
 * Pin button opens an inline PinToBoardPopover wired to boards-client.
 */
import React from 'react';
import { Pin, ChevronDown, Table, Download } from 'lucide-react';
import { T, Icon } from '../../../theme';
import { toast } from '../../ui/toast';
import { PinToBoardPopover } from '../../boards/pin-to-board-popover';
import type { DataWidget } from '../../../data/chat/response-types';

interface WidgetShellProps {
  title: string;
  /** When provided, Pin button opens a real popover. Otherwise it toasts. */
  widget?: DataWidget;
  /** Override pin click (Phase 6 wires real popover). */
  onPin?: () => void;
  children: React.ReactNode;
}

export function WidgetShell({ title, widget, onPin, children }: WidgetShellProps) {
  const [dataOpen, setDataOpen] = React.useState(false);
  const [pinOpen, setPinOpen] = React.useState(false);
  const dataRef = React.useRef<HTMLDivElement>(null);
  const pinRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dataOpen && dataRef.current && !dataRef.current.contains(e.target as Node)) setDataOpen(false);
      if (pinOpen && pinRef.current && !pinRef.current.contains(e.target as Node)) setPinOpen(false);
    };
    if (dataOpen || pinOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dataOpen, pinOpen]);

  const onPinClick = () => {
    if (onPin) { onPin(); return; }
    if (widget) { setPinOpen(true); return; }
    toast('Pin to board — coming soon');
  };

  return (
    <div style={{
      border: `1px solid ${T.n200}`, borderRadius: 10, background: '#fff',
      margin: '12px 0',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: `1px solid ${T.n100}`,
      }}>
        <span style={{
          fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n900,
        }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div ref={pinRef} style={{ position: 'relative' }}>
            <button onClick={onPinClick} aria-label="Pin to board" style={iconBtn}>
              <Icon icon={Pin} size={13} color={T.n600} />
              <span style={{ fontSize: 11, color: T.n700 }}>Pin to board</span>
            </button>
            {pinOpen && widget && (
              <PinToBoardPopover widget={widget} onClose={() => setPinOpen(false)} />
            )}
          </div>
          <div ref={dataRef} style={{ position: 'relative' }}>
            <button onClick={() => setDataOpen(o => !o)} style={iconBtn}>
              <span style={{ fontSize: 11, color: T.n700 }}>Data</span>
              <Icon icon={ChevronDown} size={11} color={T.n500} />
            </button>
            {dataOpen && (
              <div style={dropdown}>
                <DropItem icon={Table} label="View as table" onClick={() => {
                  setDataOpen(false);
                  toast('Data table view — demo only', { tone: 'neutral' });
                }} />
                <DropItem icon={Download} label="Export CSV" onClick={() => {
                  setDataOpen(false);
                  toast('CSV export — demo only', { tone: 'neutral' });
                }} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 8px', background: 'transparent',
  border: `1px solid transparent`, borderRadius: 6,
  cursor: 'pointer', fontFamily: T.fSans,
};

const dropdown: React.CSSProperties = {
  position: 'absolute', right: 0, top: '100%', marginTop: 4,
  background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8,
  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  minWidth: 180, padding: '4px 0', zIndex: 50,
};

function DropItem({ icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', width: '100%', textAlign: 'left',
      background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: T.fSans, fontSize: 12, color: T.n800,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = T.n50; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon icon={icon} size={13} color={T.n600} />
      {label}
    </button>
  );
}
