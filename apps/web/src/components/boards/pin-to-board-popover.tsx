/**
 * PinToBoardPopover — anchored popup for picking an existing board or creating a new one.
 * Calls boards-client + fires a toast on success.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { T, Icon } from '../../theme';
import { listBoards, createBoard, pinCard, type Board } from '../../api/boards-client';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../sidebar/recent-items';
import { toast } from '../ui/toast';
import type { DataWidget } from '../../data/chat/response-types';

interface Props {
  widget: DataWidget;
  onClose: () => void;
}

export function PinToBoardPopover({ widget, onClose }: Props) {
  const navigate = useNavigate();
  const [boards, setBoards] = React.useState<Board[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    void listBoards().then(b => { if (!cancelled) setBoards(b); });
    return () => { cancelled = true; };
  }, []);

  const onPick = async (boardId: string, boardName: string) => {
    await pinCard(boardId, widget);
    pushRecent('boards', { id: boardId, title: boardName, updatedAt: new Date().toISOString() });
    notifyRecentChanged();
    toast(`Pinned to ${boardName}`, {
      tone: 'success',
      action: { label: 'View', onClick: () => navigate(`/canvas/${boardId}`) },
    });
    onClose();
  };

  const onCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const board = await createBoard(trimmed);
    await onPick(board.id, board.name);
  };

  return (
    <div style={{
      position: 'absolute', right: 0, top: '100%', marginTop: 6,
      width: 280, background: '#fff',
      border: `1px solid ${T.n200}`, borderRadius: 10,
      boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
      padding: 6, zIndex: 100,
      fontFamily: T.fSans,
    }}
      onClick={e => e.stopPropagation()}
    >
      {!creating && boards.length > 0 && (
        <div style={{
          fontSize: 11, color: T.n500, fontWeight: 600,
          padding: '6px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>Existing boards</div>
      )}
      {!creating && boards.map(b => (
        <button
          key={b.id}
          onClick={() => onPick(b.id, b.name)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 10px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderRadius: 6, fontSize: 13, color: T.n900, textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.n50; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon icon={Check} size={11} color="transparent" />
          <span style={{ flex: 1 }}>{b.name}</span>
          <span style={{ fontSize: 11, color: T.n500 }}>
            {b.cardCount ?? b.sections.reduce((n, s) => n + (s.cards?.length ?? 0), 0)} cards
          </span>
        </button>
      ))}

      {/* Divider */}
      {!creating && boards.length > 0 && (
        <div style={{ height: 1, background: T.n100, margin: '4px 0' }} />
      )}

      {creating ? (
        <div style={{ padding: 6, display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onCreate(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="Board name..."
            style={{
              flex: 1, border: `1px solid ${T.n200}`, borderRadius: 6,
              padding: '6px 10px', fontFamily: T.fSans, fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={onCreate}
            disabled={!name.trim()}
            style={{
              background: T.brand, color: '#fff', border: 'none',
              padding: '6px 12px', borderRadius: 6,
              fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              opacity: name.trim() ? 1 : 0.5,
            }}
          >Create</button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            width: '100%', padding: '8px 10px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderRadius: 6, fontSize: 13, color: T.brand, textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.brandSoft; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon icon={Plus} size={13} color={T.brand} />
          New board
        </button>
      )}
    </div>
  );
}
