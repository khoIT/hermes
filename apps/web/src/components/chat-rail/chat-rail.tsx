/**
 * ChatRail — 400px contextual chat surface anchored on detail pages.
 *
 * Replaces <AskHermesPanel>. Mounted by App.tsx in the right gutter when
 * the route is not in the hidden list. Manages its own active-thread state
 * but delegates open/closed to the parent (App) so the FAB toggle and route
 * defaults can drive it.
 *
 * Layout: header (44px) → body (flex-1, scrollable) → input (auto height).
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import {
  appendMessage, createThread, getThread, listThreads,
} from '../../utils/chat-store';
import { respondToText } from '../../utils/chat-respond';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../sidebar/recent-items';
import { resolvePageContext, type ContextGetters, type PageContext } from '../../utils/page-context-resolver';
import { allFeatures, getFeatureByName } from '../../data/catalog/features';
import { allSegments } from '../../data/catalog/segments';
import { allCampaigns } from '../../data/catalog/campaigns';
import { listBoards, type Board } from '../../api/boards-client';
import { ChatInputBox } from '../chat/chat-input-box';
import { ChatRailHeader } from './chat-rail-header';
import { ChatRailEmpty } from './chat-rail-empty';
import { CompactThreadView } from './compact-thread-view';
import { RecentThreadsSection } from './recent-threads-section';
import { ScriptedPromptsSection } from './scripted-prompts-section';
import {
  getStoredWidth, setStoredWidth, clampWidth,
} from '../../utils/chat-rail-store';
import type { MessageArtifact } from '../../utils/chat-store';

interface ChatRailProps {
  open: boolean;
  onClose: () => void;
}

const segmentMap = new Map(allSegments.map(s => [s.id, s]));
const campaignMap = new Map(allCampaigns.map(c => [c.id, c]));
const boardCache = new Map<string, Board>();
let boardsHydrated = false;
function hydrateBoardsOnce() {
  if (boardsHydrated) return;
  boardsHydrated = true;
  listBoards()
    .then(bs => bs.forEach(b => boardCache.set(b.id, b)))
    .catch(() => { boardsHydrated = false; });
}

const GETTERS: ContextGetters = {
  getFeature: name => getFeatureByName(name) ?? allFeatures.find(f => f.name === name),
  getSegment: id => segmentMap.get(id),
  getCampaign: id => campaignMap.get(id),
  getBoard: id => boardCache.get(id),
};

export function ChatRail({ open, onClose }: ChatRailProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  /** Set when the user clicked "+ New" so auto-resume doesn't re-fill the rail. */
  const userClearedRef = React.useRef(false);

  // Drag-to-resize. Width is local state (read once from storage); persisted
  // on pointerUp to avoid thrashing localStorage during the drag.
  const [width, setWidth] = React.useState<number>(() => getStoredWidth());
  const dragRef = React.useRef<{ startX: number; startW: number } | null>(null);

  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startW: width };
    e.preventDefault();
  };
  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragRef.current;
    if (!s) return;
    // Dragging the LEFT edge of the rail: moving cursor leftward (clientX
    // decreases) grows the rail. Inverse delta from start.
    const next = clampWidth(s.startW + (s.startX - e.clientX));
    setWidth(next);
  };
  const onHandleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setStoredWidth(width);
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
  };

  React.useEffect(() => { hydrateBoardsOnce(); }, []);

  const ctx: PageContext | null = React.useMemo(
    () => resolvePageContext(pathname, GETTERS),
    [pathname]
  );

  // Auto-resume most recent thread the first time the rail opens without an
  // active thread. After "+ New" or explicit clear, stay in empty state.
  React.useEffect(() => {
    if (!open) return;
    if (activeThreadId) return;
    if (userClearedRef.current) return;
    const idx = listThreads();
    if (idx[0]) setActiveThreadId(idx[0].id);
  }, [open, activeThreadId]);

  // If the active thread was removed from storage, drop it.
  React.useEffect(() => {
    if (activeThreadId && !getThread(activeThreadId)) setActiveThreadId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, tick]);

  const conversation = activeThreadId ? getThread(activeThreadId) : null;
  const headerTitle = conversation?.title ?? 'Chat';
  const headerSubtitle = ctx?.label;

  const refresh = () => setTick(t => t + 1);

  const onNew = () => {
    userClearedRef.current = true;
    setActiveThreadId(null);
    refresh();
  };

  const submit = (text: string) => {
    let activeId = activeThreadId;
    const artifact: MessageArtifact | undefined = ctx
      ? { kind: ctx.kind, label: ctx.label, entityId: ctx.entityId }
      : undefined;

    if (!activeId) {
      activeId = createThread(text, artifact);
      userClearedRef.current = false;
      setActiveThreadId(activeId);
      pushRecent('chats', { id: activeId, title: text, updatedAt: new Date().toISOString() });
    } else {
      appendMessage(activeId, { role: 'user', text, ...(artifact ? { artifact } : {}) });
    }
    appendMessage(activeId, respondToText(text, activeId));
    notifyRecentChanged();
    refresh();
  };

  const onTitleClick = () => {
    if (!conversation) return;
    onClose();
    navigate(`/chat/${conversation.id}`);
  };

  const onOpenRecent = (threadId: string) => {
    userClearedRef.current = false;
    setActiveThreadId(threadId);
    refresh();
  };

  /**
   * Picking a scripted prompt routes to the canonical pre-seeded thread when
   * one exists (avoids duplicate `t-XXXXX` clones in the sidebar). Falls back
   * to the legacy create+respond path for prompts without a seeded fixture.
   * The follow-up chips on T1 then play through multi-turn-registry.
   */
  const onPickScriptedPrompt = (prompt: { text: string; threadId?: string }) => {
    const seeded = prompt.threadId ? getThread(prompt.threadId) : null;
    if (seeded) {
      pushRecent('chats', { id: seeded.id, title: seeded.title, updatedAt: seeded.updatedAt });
      notifyRecentChanged();
      userClearedRef.current = false;
      setActiveThreadId(seeded.id);
      refresh();
      return;
    }
    const id = createThread(prompt.text);
    appendMessage(id, respondToText(prompt.text, id));
    pushRecent('chats', { id, title: prompt.text, updatedAt: new Date().toISOString() });
    notifyRecentChanged();
    userClearedRef.current = false;
    setActiveThreadId(id);
    refresh();
  };

  if (!open) return null;

  return (
    <aside
      style={{
        width, flexShrink: 0,
        background: '#F9F6F2',
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        height: '100%',
        position: 'relative',
        zIndex: 15,
      }}
      aria-label="Chat rail"
    >
      <div
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat rail"
        title="Drag to resize"
        style={{
          position: 'absolute',
          left: -3, top: 0, bottom: 0,
          width: 8,
          cursor: 'col-resize',
          zIndex: 16,
          touchAction: 'none',
        }}
      />
      <ChatRailHeader
        title={headerTitle}
        titleClickable={!!conversation}
        onTitleClick={onTitleClick}
        onNew={onNew}
        onClose={onClose}
        subtitle={headerSubtitle}
      />
      <div
        key={tick}
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#F9F6F2' }}
      >
        {!conversation
          ? (
            <ChatRailEmpty
              recentThreadsSlot={<RecentThreadsSection onOpen={onOpenRecent} />}
              scriptedPromptsSlot={<ScriptedPromptsSection onPick={onPickScriptedPrompt} />}
            />
          )
          : <CompactThreadView conversation={conversation} onFollowUp={submit} />}
      </div>
      <div style={{
        padding: 10, background: '#fff',
        borderTop: `1px solid ${T.n200}`,
      }}>
        <ChatInputBox
          onSubmit={submit}
          compact
          placeholder="Ask Hermes..."
          showDeepResearch={false}
        />
      </div>
    </aside>
  );
}
