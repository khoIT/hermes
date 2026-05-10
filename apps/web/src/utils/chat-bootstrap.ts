/**
 * On first boot, seed the chat-store with the 4 demo threads so sidebar
 * "All Chats" is populated. Idempotent via stable thread ids — re-running
 * is harmless because putThread overwrites by id.
 */
import { isStoreEmpty, putThread } from './chat-store';
import { thread001 } from '../data/chat/threads/thread-001-cpi-ltv';
import { thread002 } from '../data/chat/threads/thread-002-d7-facebook';
import { thread003 } from '../data/chat/threads/thread-003-loss-streak';
import { thread004 } from '../data/chat/threads/thread-004-create-segment';
import { pushRecent } from './recent-items-store';

const THREADS = [thread001, thread002, thread003, thread004];

let bootstrapped = false;

export function bootstrapChatThreads(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  if (!isStoreEmpty()) return;
  // Insert in reverse so thread-001 lands at top of recent.
  for (const t of [...THREADS].reverse()) {
    putThread(t);
    pushRecent('chats', { id: t.id, title: t.title, updatedAt: t.updatedAt });
  }
}
