/**
 * ChatContextMenu — three-dot menu trigger for sidebar chat rows.
 *   · Add to folder (stub)
 *   · Convert to playbook (stub)
 *   · Delete chat (working)
 *
 * Wraps a small dropdown popup; click outside to dismiss.
 */
import React from 'react';
import { MoreHorizontal, FolderPlus, FileText, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { T, Icon } from '../../theme';
import { deleteThread } from '../../utils/chat-store';
import { toast } from '../ui/toast';
import { notifyRecentChanged } from './recent-items';

interface ChatContextMenuProps {
  threadId: string;
  threadTitle: string;
}

export function ChatContextMenu({ threadId, threadTitle }: ChatContextMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const onDelete = () => {
    setOpen(false);
    if (!confirm(`Delete chat "${threadTitle}"?`)) return;
    deleteThread(threadId);
    notifyRecentChanged();
    toast('Chat deleted', { tone: 'success' });
    if (location.pathname === `/chat/${threadId}`) navigate('/');
  };

  const Item = ({ icon, label, onClick, danger }: {
    icon: any; label: string; onClick: () => void; danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', width: '100%', textAlign: 'left',
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontFamily: T.fSans, fontSize: 13,
        color: danger ? T.red600 : T.n800,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = T.n50; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon icon={icon} size={13} color={danger ? T.red600 : T.n600} />
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        aria-label="Chat options"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 4,
          background: 'transparent', border: 'none', cursor: 'pointer',
          opacity: open ? 1 : 0.6,
          transition: 'opacity .12s, background .12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.n100; e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = open ? '1' : '0.6'; }}
      >
        <Icon icon={MoreHorizontal} size={13} color={T.n500} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 8,
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          minWidth: 180, padding: '4px 0', zIndex: 200,
        }}>
          <Item icon={FolderPlus} label="Add to folder" onClick={() => {
            setOpen(false); toast('Folders — coming soon');
          }} />
          <Item icon={FileText} label="Convert to playbook" onClick={() => {
            setOpen(false); toast('Playbooks — coming soon');
          }} />
          <div style={{ height: 1, background: T.n100, margin: '4px 0' }} />
          <Item icon={Trash2} label="Delete chat" onClick={onDelete} danger />
        </div>
      )}
    </div>
  );
}
