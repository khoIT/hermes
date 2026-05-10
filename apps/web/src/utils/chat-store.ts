/**
 * Chat thread store — localStorage-backed CRUD for conversations + messages.
 * Schema versioned via key prefix `hermes.chat.v1.*`. Phase 4 bootstraps
 * pre-seeded threads if `threads` index is empty.
 */

const VERSION = 'v1';
const INDEX_KEY = `hermes.chat.${VERSION}.threads`;
const threadKey = (id: string) => `hermes.chat.${VERSION}.thread.${id}`;

export type ChatRole = 'user' | 'assistant';

/** A discriminated union of body sections for assistant messages. Phase 3 widgets land here. */
export interface ResponseSection {
  type:
    | 'narrative'
    | 'h2'
    | 'widget'
    | 'insights'
    | 'action_card_segment'
    | 'action_card_campaign'
    | 'follow_ups'
    // Phase 2 (260510-1519): scripted multi-turn extensions
    | 'feature_chip'
    | 'pin_to_board'
    | 'soft_hint';
  /** Free-form payload — concrete schemas defined in data/chat/response-types.ts. */
  payload?: unknown;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Plain text — used by user messages and as fallback for assistant. */
  text?: string;
  /** Structured assistant body (Phase 3+). */
  sections?: ResponseSection[];
  /** Suggested follow-up sentences for assistant messages. */
  followUps?: string[];
  /** Cosmetic credits counter (PRD §6). */
  credits?: number;
  /**
   * Phase 4 demo flag — when true, Phase 3's universal-CTA row is hidden so
   * the demo's curated follow-up chips are the singular forward path.
   * Non-breaking optional field; ignored by all non-Phase-3 renderers.
   */
  suppressUniversalCtas?: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ThreadIndexEntry {
  id: string;
  title: string;
  updatedAt: string;
}

function readIndex(): ThreadIndexEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: ThreadIndexEntry[]) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
  } catch {
    /* no-op */
  }
}

function upsertIndex(entry: ThreadIndexEntry) {
  const idx = readIndex().filter(e => e.id !== entry.id);
  idx.unshift(entry);
  writeIndex(idx);
}

function uid() {
  // Short readable id; collision risk acceptable at demo scale.
  return Math.random().toString(36).slice(2, 10);
}

function deriveTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 64) return trimmed;
  return trimmed.slice(0, 61) + '...';
}

/** Create a new thread seeded with a single user message. Returns thread id. */
export function createThread(initialMessage: string): string {
  const id = `t-${uid()}`;
  const now = new Date().toISOString();
  const conv: Conversation = {
    id,
    title: deriveTitle(initialMessage),
    messages: [{
      id: `m-${uid()}`,
      role: 'user',
      text: initialMessage,
      createdAt: now,
    }],
    createdAt: now,
    updatedAt: now,
  };
  try {
    localStorage.setItem(threadKey(id), JSON.stringify(conv));
  } catch {
    /* no-op */
  }
  upsertIndex({ id, title: conv.title, updatedAt: now });
  return id;
}

export function getThread(id: string): Conversation | null {
  try {
    const raw = localStorage.getItem(threadKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as Conversation;
  } catch {
    return null;
  }
}

export function appendMessage(
  threadId: string,
  msg: Omit<ChatMessage, 'id' | 'createdAt'> & Partial<Pick<ChatMessage, 'id' | 'createdAt'>>,
): ChatMessage | null {
  const conv = getThread(threadId);
  if (!conv) return null;
  const stamped: ChatMessage = {
    id: msg.id ?? `m-${uid()}`,
    createdAt: msg.createdAt ?? new Date().toISOString(),
    ...msg,
  };
  conv.messages.push(stamped);
  conv.updatedAt = stamped.createdAt;
  try {
    localStorage.setItem(threadKey(threadId), JSON.stringify(conv));
  } catch {
    /* no-op */
  }
  upsertIndex({ id: conv.id, title: conv.title, updatedAt: conv.updatedAt });
  return stamped;
}

export function listThreads(): ThreadIndexEntry[] {
  return readIndex();
}

export function deleteThread(id: string) {
  try {
    localStorage.removeItem(threadKey(id));
  } catch {
    /* no-op */
  }
  writeIndex(readIndex().filter(e => e.id !== id));
}

/** True iff no threads exist — used by chat-bootstrap (Phase 4). */
export function isStoreEmpty(): boolean {
  return readIndex().length === 0;
}

/** Insert a fully-formed thread (used by Phase 4 bootstrap). */
export function putThread(conv: Conversation) {
  try {
    localStorage.setItem(threadKey(conv.id), JSON.stringify(conv));
  } catch {
    /* no-op */
  }
  upsertIndex({ id: conv.id, title: conv.title, updatedAt: conv.updatedAt });
}
