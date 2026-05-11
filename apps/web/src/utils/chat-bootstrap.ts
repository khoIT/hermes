/**
 * On boot, ensure the chat-store contains the canonical demo thread set so
 * sidebar "All Chats" matches the 4 scripted prompts shown on the landing
 * page.
 *
 * History:
 *   - v1 (initial): thread-001..004
 *   - v2 (plan 260510-1519): thread-003 removed; thread-005..008 added
 *
 * Strategy: a one-time reset gate per BOOTSTRAP_VERSION. When the persisted
 * version differs from the current code's version we wipe **all** ad-hoc
 * threads (anything outside the canonical id set) plus their recent-items
 * entries — this clears duplicates created by prior-version prompt clicks
 * (e.g. an ad-hoc "Compare PT-6..." stub that mirrors canonical thread-005)
 * — then seed the canonical set fresh. From v2 onward, ad-hoc threads
 * created by the user accumulate normally; the next version bump is the
 * only point where they get cleared.
 */
import {
  putThread, deleteThread, listThreads, type Conversation,
} from './chat-store';
import { thread001 } from '../data/chat/threads/thread-001-cpi-ltv';
import { thread002 } from '../data/chat/threads/thread-002-d7-facebook';
import { thread004 } from '../data/chat/threads/thread-004-create-segment';
import { thread005 } from '../data/chat/threads/thread-005-pt6-gem-burn-research';
import { thread006 } from '../data/chat/threads/thread-006-cfm-tier-roi-research';
import { thread007 } from '../data/chat/threads/thread-007-cfm-loss-streak-multi';
import { thread008 } from '../data/chat/threads/thread-008-pt-whale-recall';
import { threadDemoLivops2026 } from '../data/chat/threads/thread-demo-livops-2026';
import { threadDemoAgentLivops2026 } from '../data/chat/threads/thread-demo-agent-livops-2026';
import { threadDemoAgentD7FbCohort2026 } from '../data/chat/threads/thread-demo-agent-d7-fb-cohort-2026';
import { threadDemoAgentWhaleRecall2026 } from '../data/chat/threads/thread-demo-agent-whale-recall-2026';
import { pushRecent, clearRecent, getRecent } from './recent-items-store';

const BOOTSTRAP_VERSION = 'v13-260511-1145';
const VERSION_KEY = 'hermes.chat.bootstrap.version';

// Stale segment-recent IDs to scrub on each bootstrap version bump.
// Catalog-api once minted ids in `s_${Date.now()}` form; those rows are
// no longer reachable from the static catalog, but the sidebar Recent
// list still surfaces them. Drop on boot.
const STALE_SEGMENT_ID_RE = /^s_\d+$/;

/** Canonical fixture set — order matters: insertion order drives recent-items.
 *  threadDemoLivops2026 is last in the array so it is pushed FIRST to recents
 *  (reverse-insert logic below) and appears at the top of the sidebar. */
const THREADS: Conversation[] = [
  thread001, thread002, thread004,
  thread005, thread006, thread007, thread008,
  threadDemoLivops2026,
];

/** Hidden threads — saved to chat-store so /chat/<id> resolves, but NOT
 *  pushed into "Recent threads" / sidebar All-Chats. Surface for these is the
 *  HermesNoticedPanel on /welcome (agent-first demo path). */
const HIDDEN_THREADS: Conversation[] = [
  threadDemoAgentLivops2026,
  threadDemoAgentD7FbCohort2026,
  threadDemoAgentWhaleRecall2026,
];

const CANONICAL_IDS = new Set([
  ...THREADS.map(t => t.id),
  ...HIDDEN_THREADS.map(t => t.id),
]);

let bootstrapped = false;

export function bootstrapChatThreads(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  const stored = readVersion();
  if (stored === BOOTSTRAP_VERSION) {
    // Already on current canonical set — still upsert to pick up any fixture
    // content edits without disturbing user-created threads or recents order.
    for (const t of THREADS) putThread(t);
    for (const t of HIDDEN_THREADS) putThread(t);
    return;
  }

  // Version changed (or first boot): hard-reset to the canonical set.
  // 1. Delete every thread NOT in the canonical id set (retired ids,
  //    ad-hoc duplicates from previous prompt clicks, "New conversation"
  //    stubs, etc.). This is the only path that removes user data; it runs
  //    once per BOOTSTRAP_VERSION bump.
  for (const entry of listThreads()) {
    if (!CANONICAL_IDS.has(entry.id)) deleteThread(entry.id);
  }
  // 2. Wipe the chats recents list so the sidebar reflects the canonical
  //    order exactly.
  clearRecent('chats');
  // 3. Seed canonical set in reverse so thread-001 lands at top of recents.
  for (const t of [...THREADS].reverse()) {
    putThread(t);
    pushRecent('chats', { id: t.id, title: t.title, updatedAt: t.updatedAt });
  }

  // 3b. Seed hidden threads (agent-first demo path). Saved to chat-store so
  //     /chat/<id> resolves, but NOT pushed to recents — they surface via the
  //     HermesNoticedPanel on /welcome instead.
  for (const t of HIDDEN_THREADS) putThread(t);

  // 4. Prune stale segment-recent entries (legacy `s_<timestamp>` ids).
  pruneStaleSegmentRecents();

  writeVersion(BOOTSTRAP_VERSION);
}

function pruneStaleSegmentRecents(): void {
  try {
    const cur = getRecent('segments');
    const next = cur.filter(item => !STALE_SEGMENT_ID_RE.test(item.id));
    if (next.length === cur.length) return;
    localStorage.setItem('hermes.recent.v1.segments', JSON.stringify(next));
  } catch {
    /* no-op — localStorage unavailable */
  }
}

function readVersion(): string | null {
  try { return localStorage.getItem(VERSION_KEY); } catch { return null; }
}

function writeVersion(v: string): void {
  try { localStorage.setItem(VERSION_KEY, v); } catch { /* no-op */ }
}
