/**
 * Board detail — `/canvas/:boardId`. Renders pinned widget cards via the
 * existing chat Widget component. Supports unpin (X on hover) + delete board.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, X } from 'lucide-react';
import { T, Icon } from '../../theme';
import {
  getBoard, deleteBoard, unpinCard, type Board,
} from '../../api/boards-client';
import { Widget } from '../../components/chat/widgets/widget';
import { SourceThreadPill } from '../../components/chat-rail/source-thread-pill';
import { ContinueInChatPill } from '../../components/chat-rail/continue-in-chat-pill';
import { toast } from '../../components/ui/toast';
import { ComingSoon } from '../../components/empty-state/coming-soon';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../../components/sidebar/recent-items';

export default function CanvasDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = React.useState<Board | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!boardId) return;
    let cancelled = false;
    void getBoard(boardId).then(b => { if (!cancelled) { setBoard(b); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [boardId, tick]);

  // Track recent: log a visit once the board resolves.
  React.useEffect(() => {
    if (!board) return;
    pushRecent('boards', {
      id: board.id,
      title: board.name,
      updatedAt: new Date().toISOString(),
      href: `/canvas/${board.id}`,
    });
    notifyRecentChanged();
  }, [board?.id]);

  const refresh = () => setTick(t => t + 1);

  if (!boardId) {
    return <ComingSoon title="Missing board id" body="Return to /canvas." />;
  }
  if (loaded && !board) {
    return <ComingSoon title="Board not found" body="It may have been deleted." />;
  }
  if (!board) {
    return <ComingSoon title="Loading board…" body="" />;
  }

  const onDelete = async () => {
    if (!confirm(`Delete board "${board.name}"?`)) return;
    await deleteBoard(board.id);
    toast(`Deleted "${board.name}"`, { tone: 'neutral' });
    navigate('/canvas');
  };

  const onUnpin = async (cardId: string) => {
    await unpinCard(board.id, cardId);
    refresh();
    toast('Card unpinned');
  };

  // Derive board-level sourceThreadId from first card that has one.
  const boardSourceThreadId = board.sections
    .flatMap(s => s.cards)
    .find(c => c.sourceThreadId)?.sourceThreadId ?? null;

  return (
    <div style={{ padding: '32px 48px 48px', maxWidth: 1100, margin: '0 auto', fontFamily: T.fSans }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <button onClick={() => navigate('/canvas')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: T.n500, fontSize: 12, fontFamily: T.fSans, padding: 0,
        }}>← All boards</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: T.n950, margin: 0, letterSpacing: '-0.01em' }}>
          {board.name}
        </h1>
        <span style={{ flex: 1 }} />
        <button onClick={onDelete} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'transparent', color: T.red600,
          border: `1px solid ${T.n200}`, borderRadius: 7,
          padding: '6px 10px', fontFamily: T.fSans, fontSize: 12,
          cursor: 'pointer',
        }}>
          <Icon icon={Trash2} size={12} color={T.red600} />
          Delete board
        </button>
      </div>

      <ContinueInChatPill threadId={boardSourceThreadId} />
      {board.sections.map(sec => (
        <section key={sec.id} style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: T.n500,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
          }}>{sec.title}</div>
          {sec.cards.length === 0 ? (
            <div style={{
              padding: 32, textAlign: 'center', color: T.n500, fontSize: 13,
              border: `1px dashed ${T.n200}`, borderRadius: 10, background: '#fff',
            }}>
              Pin a widget from chat to see it here.
            </div>
          ) : (
            sec.cards.map(c => (
              <div key={c.id} style={{ position: 'relative' }}>
                <Widget widget={c.widget} />
                {/* Reverse-link pill — bottom-left to avoid top-right unpin button */}
                <SourceThreadPill
                  threadId={c.sourceThreadId}
                  variant="card-overlay"
                  prefix="💬 from"
                />
                <button
                  onClick={() => onUnpin(c.id)}
                  aria-label="Unpin"
                  style={{
                    position: 'absolute', top: 12, right: -36,
                    width: 24, height: 24, borderRadius: 9999,
                    background: '#fff', border: `1px solid ${T.n200}`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon icon={X} size={12} color={T.n600} />
                </button>
              </div>
            ))
          )}
        </section>
      ))}
    </div>
  );
}
