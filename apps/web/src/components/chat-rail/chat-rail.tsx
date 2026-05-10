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
import { RAIL_WIDTH } from '../../utils/chat-rail-store';
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
   * Picking a scripted prompt creates a new thread (so its title matches)
   * and immediately appends the pre-baked T1 response via respondToText.
   * The follow-up chips on T1 then play through multi-turn-registry.
   */
  const onPickScriptedPrompt = (prompt: { text: string }) => {
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
        width: RAIL_WIDTH, flexShrink: 0,
        background: '#F9F6F2',
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        height: '100%',
        zIndex: 15,
      }}
      aria-label="Chat rail"
    >
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
