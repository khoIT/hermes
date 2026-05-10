/**
 * chat-respond — given user text (and optional active thread id), produce an
 * assistant message ready to append.
 *
 * Order of resolution:
 *   1. Multi-turn registry (active thread + scripted follow-up text)
 *   2. Intent matcher (initial-prompt keyword scoring)
 *   3. Soft-hint fallback (mid-flow free-text)
 */
import { matchIntent } from './chat-intent-matcher';
import { CANNED_RESPONSES } from '../data/chat/canned-responses';
import { thread001 } from '../data/chat/threads/thread-001-cpi-ltv';
import { thread002 } from '../data/chat/threads/thread-002-d7-facebook';
import { thread004 } from '../data/chat/threads/thread-004-create-segment';
import { thread005 } from '../data/chat/threads/thread-005-pt6-gem-burn-research';
import { thread006 } from '../data/chat/threads/thread-006-cfm-tier-roi-research';
import { thread007 } from '../data/chat/threads/thread-007-cfm-loss-streak-multi';
import { thread008 } from '../data/chat/threads/thread-008-pt-whale-recall';
import { lookupNextTurn } from '../data/chat/multi-turn-registry';
import type { ChatMessage } from './chat-store';

const THREAD_LOOKUP: Record<string, ChatMessage | undefined> = {
  'thread-001': thread001.messages[1],
  'thread-002': thread002.messages[1],
  'thread-004': thread004.messages[1],
  'thread-005': thread005.messages[1],
  'thread-006': thread006.messages[1],
  'thread-007': thread007.messages[1],
  'thread-008': thread008.messages[1],
};

const SOFT_HINT_TEXT = "Try one of the follow-ups above — I'm running pre-scripted demos for now.";

/** Build an assistant response. `threadId` enables multi-turn registry routing. */
export function respondToText(
  userText: string,
  threadId?: string,
): Omit<ChatMessage, 'id' | 'createdAt'> {
  // 1. Multi-turn registry — active thread + exact follow-up match
  if (threadId) {
    const next = lookupNextTurn(threadId, userText);
    if (next) {
      const { id: _id, createdAt: _ca, ...rest } = next.assistantMsg;
      return rest;
    }
  }

  // 2. Intent matcher (handles initial prompts: legacy + thread-005..008 entries)
  const intent = matchIntent(userText);
  if (intent) {
    const fromThread = THREAD_LOOKUP[intent.responseId];
    if (fromThread && fromThread.role === 'assistant') {
      const { id: _id, createdAt: _ca, ...rest } = fromThread;
      return { ...rest, credits: intent.credits ?? rest.credits };
    }
    const canned = CANNED_RESPONSES[intent.responseId];
    if (canned) return { ...canned, credits: intent.credits ?? canned.credits };
  }

  // 3. Soft-hint fallback when mid-flow free-text doesn't match
  if (threadId) {
    return {
      role: 'assistant',
      sections: [{ type: 'soft_hint', payload: { text: SOFT_HINT_TEXT } }],
    };
  }

  return CANNED_RESPONSES.fallback!;
}
