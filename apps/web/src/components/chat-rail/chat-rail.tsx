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
  appendMessage, createThread, getThread, listThreads, putThread,
} from '../../utils/chat-store';
import { respondToText } from '../../utils/chat-respond';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../sidebar/recent-items';
import { threadDemoLivops2026Turns } from '../../data/chat/threads/thread-demo-livops-2026';
import { threadDemoAgentLivops2026Turns } from '../../data/chat/threads/thread-demo-agent-livops-2026';
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
  /** Thread id where an assistant turn is pending (typing dots showing). */
  const [pendingThreadId, setPendingThreadId] = React.useState<string | null>(null);
  /** Set when the user clicked "+ New" so auto-resume doesn't re-fill the rail. */
  const userClearedRef = React.useRef(false);
  /** Active timer for delayed-append; cleared on rail close / new chat. */
  const pendingTimerRef = React.useRef<number | null>(null);

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

  // Demo arc auto-play: when a demo thread becomes active and is in slim
  // shape (only the initial user prompt), schedule T1 with the typing-dot
  // delay. Covers both the canonical analyst arc and the agent-first arc.
  React.useEffect(() => {
    if (!activeThreadId) return;
    const t1 =
      activeThreadId === 'thread-demo-livops-2026'       ? threadDemoLivops2026Turns.t1 :
      activeThreadId === 'thread-demo-agent-livops-2026' ? threadDemoAgentLivops2026Turns.t1 :
      null;
    if (!t1) return;
    if (pendingThreadId === activeThreadId) return;
    const conv = getThread(activeThreadId);
    if (!conv || conv.messages.length !== 1) return;
    const { id: _id, createdAt: _ca, ...t1Rest } = t1;
    delayedAppend(activeThreadId, t1Rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, tick]);

  const conversation = activeThreadId ? getThread(activeThreadId) : null;
  const headerTitle = conversation?.title ?? 'Chat';
  const headerSubtitle = ctx?.label;

  const refresh = () => setTick(t => t + 1);

  /**
   * Append `msg` to `threadId` after `delayMs`, showing typing dots in between.
   * Cancels any prior pending timer so rapid clicks don't queue. Returns nothing.
   */
  const delayedAppend = React.useCallback((
    threadId: string,
    msg: Parameters<typeof appendMessage>[1],
    delayMs = 800,
  ) => {
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    setPendingThreadId(threadId);
    pendingTimerRef.current = window.setTimeout(() => {
      appendMessage(threadId, msg);
      pendingTimerRef.current = null;
      setPendingThreadId(null);
      notifyRecentChanged();
      refresh();
    }, delayMs);
  }, []);

  // Cancel any in-flight pending timer when the rail closes.
  React.useEffect(() => {
    if (!open && pendingTimerRef.current) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
      setPendingThreadId(null);
    }
  }, [open]);

  const onNew = () => {
    if (pendingTimerRef.current) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
      setPendingThreadId(null);
    }
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
    notifyRecentChanged();
    refresh();
    // Assistant response plays after typing-dot delay for a "loading" feel.
    delayedAppend(activeId, respondToText(text, activeId));
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
   *
   * The demo arc thread (thread-demo-livops-2026) gets special handling: each
   * click resets it to the slim `[user msg 1]` shape and auto-plays T1 after
   * the typing-dot delay. This makes the demo repeatable and gives the
   * "loading data → typed answer" feel on the very first turn.
   * Follow-ups (T1 → T2/alts, T2 → T3/alts) play through multi-turn-registry.
   */
  const onPickScriptedPrompt = (prompt: { text: string; threadId?: string }) => {
    const seeded = prompt.threadId ? getThread(prompt.threadId) : null;
    if (seeded) {
      // Demo thread: hard-reset to slim shape, then auto-play T1 with delay.
      if (prompt.threadId === 'thread-demo-livops-2026') {
        const slim = {
          ...seeded,
          messages: seeded.messages.filter(m => m.id === 'm-demo-u1'),
          updatedAt: seeded.createdAt,
        };
        putThread(slim);
        pushRecent('chats', { id: slim.id, title: slim.title, updatedAt: slim.updatedAt });
        notifyRecentChanged();
        userClearedRef.current = false;
        setActiveThreadId(slim.id);
        refresh();
        const { id: _id, createdAt: _ca, ...t1Rest } = threadDemoLivops2026Turns.t1;
        delayedAppend(slim.id, t1Rest);
        return;
      }
      pushRecent('chats', { id: seeded.id, title: seeded.title, updatedAt: seeded.updatedAt });
      notifyRecentChanged();
      userClearedRef.current = false;
      setActiveThreadId(seeded.id);
      refresh();
      return;
    }
    const id = createThread(prompt.text);
    pushRecent('chats', { id, title: prompt.text, updatedAt: new Date().toISOString() });
    notifyRecentChanged();
    userClearedRef.current = false;
    setActiveThreadId(id);
    refresh();
    delayedAppend(id, respondToText(prompt.text, id));
  };

  if (!open) return null;

  return (
    <aside
      style={{
        width, flexShrink: 0,
        background: T.sidebar,
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
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: T.sidebar }}
      >
        {!conversation
          ? (
            <ChatRailEmpty
              recentThreadsSlot={<RecentThreadsSection onOpen={onOpenRecent} />}
              scriptedPromptsSlot={<ScriptedPromptsSection onPick={onPickScriptedPrompt} />}
            />
          )
          : (
            <CompactThreadView
              conversation={conversation}
              onFollowUp={submit}
              pending={pendingThreadId === conversation.id}
            />
          )}
      </div>
      <div style={{
        padding: 10, background: T.surface,
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
