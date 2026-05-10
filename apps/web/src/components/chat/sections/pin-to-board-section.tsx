/**
 * PinToBoardSection — terminal artifact for the research scripted flows.
 *
 * Renders a "Pin to {boardName} →" CTA. On click, finds-or-creates the named
 * board, pins the upstream widget snapshot, and swaps to "Saved to {boardName}"
 * with a link to /canvas/:boardId. Idempotent — clicking after pinned does
 * nothing.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Pin, Check } from 'lucide-react';
import { T, Icon } from '../../../theme';
import {
  listBoards, createBoard, pinCard, type Board,
} from '../../../api/boards-client';
import { pushRecent } from '../../../utils/recent-items-store';
import { notifyRecentChanged } from '../../sidebar/recent-items';
import { toast } from '../../ui/toast';
import { useActiveThreadId } from '../../../utils/active-thread-context';
import type { ChatMessage } from '../../../utils/chat-store';
import type {
  PinToBoardPayload, WidgetPayload,
} from '../../../data/chat/response-types';

interface PinToBoardSectionProps {
  payload: PinToBoardPayload;
  /** The current message — used to look up the upstream widget snapshot. */
  message: ChatMessage;
  /** All messages in the thread, in order — searched for snapshot id. */
  threadMessages?: ChatMessage[];
  /**
   * Optional override: supply the widget directly instead of resolving it by
   * widgetSnapshotId. Used by UniversalCtaRow which already holds the widget
   * from extractPrefillContext.
   */
  forceWidget?: import('../../../data/chat/response-types').DataWidget;
}

export function PinToBoardSection({
  payload, message, threadMessages, forceWidget,
}: PinToBoardSectionProps) {
  const [pinned, setPinned] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [boardId, setBoardId] = React.useState<string | null>(null);
  const activeThreadId = useActiveThreadId();

  const widget = React.useMemo(
    () => forceWidget ?? findWidgetSnapshot(payload.widgetSnapshotId, message, threadMessages),
    [forceWidget, payload.widgetSnapshotId, message, threadMessages]
  );

  const onPin = async () => {
    if (busy || pinned || !widget) return;
    setBusy(true);
    try {
      const all = await listBoards();
      let board: Board | undefined = all.find(
        b => b.name.toLowerCase() === payload.boardName.toLowerCase()
      );
      if (!board) {
        board = await createBoard(payload.boardName);
      }
      // Pass activeThreadId so board cards track their source thread →
      // enables SourceThreadPill and ContinueInChatPill on /canvas/:id.
      await pinCard(board.id, widget, activeThreadId ?? undefined);
      pushRecent('boards', {
        id: board.id, title: board.name, updatedAt: new Date().toISOString(),
      });
      notifyRecentChanged();
      setBoardId(board.id);
      setPinned(true);
      toast(`Saved to ${board.name}`, { tone: 'success' });
    } catch (err) {
      toast(`Pin failed — ${err instanceof Error ? err.message : 'unknown error'}`,
        { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  if (pinned && boardId) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 8,
        background: T.brandSoft, color: T.brand,
        border: `1px solid ${T.brandBorder}`,
        margin: '10px 0', maxWidth: 820,
        fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
      }}>
        <Icon icon={Check} size={14} color={T.brand} />
        <span>Saved to{' '}
          <Link
            to={`/canvas/${boardId}`}
            style={{
              color: T.brand, textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            {payload.boardName}
          </Link>
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onPin}
      disabled={busy || !widget}
      title={!widget ? 'No widget to pin' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 8,
        background: T.brand, color: '#fff',
        border: 'none', cursor: busy || !widget ? 'not-allowed' : 'pointer',
        opacity: busy || !widget ? 0.6 : 1,
        margin: '10px 0',
        fontFamily: T.fSans, fontSize: 13, fontWeight: 600,
        transition: 'background .12s',
      }}
      onMouseEnter={e => {
        if (!busy && widget) e.currentTarget.style.background = T.brandHover;
      }}
      onMouseLeave={e => {
        if (!busy && widget) e.currentTarget.style.background = T.brand;
      }}
    >
      <Icon icon={Pin} size={13} color="#fff" />
      Pin to {payload.boardName}
      <span style={{ fontWeight: 400 }}>→</span>
    </button>
  );
}

function findWidgetSnapshot(
  snapshotId: string,
  current: ChatMessage,
  threadMessages?: ChatMessage[],
) {
  const haystack = threadMessages ?? [current];
  for (const m of haystack) {
    for (const s of m.sections ?? []) {
      if (s.type !== 'widget') continue;
      const w = (s.payload as WidgetPayload).widget;
      if (w?.id === snapshotId) return w;
    }
  }
  return null;
}
