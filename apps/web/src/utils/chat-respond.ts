/**
 * chat-respond — given user text, find an intent and produce an assistant
 * message ready to append to the active thread. Pulls bodies from the
 * 4 demo threads and the supplementary canned responses.
 */
import { matchIntent } from './chat-intent-matcher';
import { CANNED_RESPONSES } from '../data/chat/canned-responses';
import { thread001 } from '../data/chat/threads/thread-001-cpi-ltv';
import { thread002 } from '../data/chat/threads/thread-002-d7-facebook';
import { thread003 } from '../data/chat/threads/thread-003-loss-streak';
import { thread004 } from '../data/chat/threads/thread-004-create-segment';
import type { ChatMessage } from './chat-store';

const THREAD_LOOKUP: Record<string, ChatMessage | undefined> = {
  'thread-001': thread001.messages[1],
  'thread-002': thread002.messages[1],
  'thread-003': thread003.messages[1],
  'thread-004': thread004.messages[1],
};

/** Build an assistant response payload from user text. Always returns a message. */
export function respondToText(userText: string): Omit<ChatMessage, 'id' | 'createdAt'> {
  const intent = matchIntent(userText);
  if (!intent) {
    return CANNED_RESPONSES.fallback!;
  }
  const fromThread = THREAD_LOOKUP[intent.responseId];
  if (fromThread && fromThread.role === 'assistant') {
    // Strip id/createdAt — caller stamps fresh ones via appendMessage.
    const { id: _id, createdAt: _ca, ...rest } = fromThread;
    return { ...rest, credits: intent.credits ?? rest.credits };
  }
  const canned = CANNED_RESPONSES[intent.responseId];
  if (canned) {
    return { ...canned, credits: intent.credits ?? canned.credits };
  }
  return CANNED_RESPONSES.fallback!;
}
