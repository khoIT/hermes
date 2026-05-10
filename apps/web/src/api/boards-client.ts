/**
 * boards-client — live-first wrapper for /api/v1/boards with localStorage
 * fallback. Live POST/GET/DELETE is tried first; on network failure we
 * persist to localStorage so the demo still produces a navigable surface.
 *
 * Phase 6 of plan 260510-0151-chat-first-sidebar-ia. The backend module
 * (apps/catalog-api/src/boards/) implements a 1:1 controller for these
 * routes; the fallback exists only so the demo survives `pnpm dev` mid-run
 * restarts of catalog-api.
 */
import type { DataWidget } from '../data/chat/response-types';
import { authFetch } from './auth-fetch';

const API_BASE = '/api/v1';
const STORE_KEY = 'hermes.boards.v1';

export interface PinnedCard {
  id: string;
  widget: DataWidget;
  sourceThreadId?: string | null;
  pinnedAt: string;
}

export interface BoardSection {
  id: string;
  title: string;
  isExpanded: boolean;
  cards: PinnedCard[];
}

export interface Board {
  id: string;
  name: string;
  sections: BoardSection[];
  cardCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── localStorage fallback (used only on live failure) ─────────────
function readStub(): Board[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function writeStub(b: Board[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(b)); } catch { /* no-op */ }
}
function uid() { return Math.random().toString(36).slice(2, 10); }

async function tryFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(url, init);
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Live-first API surface ────────────────────────────────────────
export async function listBoards(): Promise<Board[]> {
  try {
    const data = await tryFetch<{ items: Board[] }>(`${API_BASE}/boards`);
    return data.items.map(b => ({ ...b, sections: b.sections ?? [] }));
  } catch (err) {
    console.warn('[boards-client] listBoards live failed, using stub:', err);
    return readStub().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export async function getBoard(id: string): Promise<Board | null> {
  try {
    return await tryFetch<Board>(`${API_BASE}/boards/${id}`);
  } catch (err) {
    console.warn('[boards-client] getBoard live failed, using stub:', err);
    return readStub().find(b => b.id === id) ?? null;
  }
}

export async function createBoard(name: string): Promise<Board> {
  try {
    return await tryFetch<Board>(`${API_BASE}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch (err) {
    console.warn('[boards-client] createBoard live failed, using stub:', err);
    const now = new Date().toISOString();
    const board: Board = {
      id: `bd-${uid()}`, name,
      sections: [{ id: 'pinned', title: 'Pinned', isExpanded: true, cards: [] }],
      createdAt: now, updatedAt: now,
    };
    writeStub([board, ...readStub()]);
    return board;
  }
}

export async function deleteBoard(id: string): Promise<void> {
  try {
    await tryFetch<{ ok: true }>(`${API_BASE}/boards/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[boards-client] deleteBoard live failed, using stub:', err);
    writeStub(readStub().filter(b => b.id !== id));
  }
}

export async function pinCard(
  boardId: string,
  widget: DataWidget,
  sourceThreadId?: string,
): Promise<PinnedCard | null> {
  try {
    return await tryFetch<PinnedCard>(`${API_BASE}/boards/${boardId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widget, sourceThreadId }),
    });
  } catch (err) {
    console.warn('[boards-client] pinCard live failed, using stub:', err);
    const boards = readStub();
    const idx = boards.findIndex(b => b.id === boardId);
    if (idx < 0) return null;
    const card: PinnedCard = {
      id: `card-${uid()}`, widget,
      sourceThreadId: sourceThreadId ?? null,
      pinnedAt: new Date().toISOString(),
    };
    const board = boards[idx]!;
    const section = board.sections[0]!;
    section.cards.push(card);
    board.updatedAt = card.pinnedAt;
    boards[idx] = board;
    writeStub(boards);
    return card;
  }
}

export async function unpinCard(boardId: string, cardId: string): Promise<void> {
  try {
    await tryFetch<{ ok: true }>(`${API_BASE}/boards/${boardId}/cards/${cardId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[boards-client] unpinCard live failed, using stub:', err);
    const boards = readStub();
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    for (const sec of board.sections) sec.cards = sec.cards.filter(c => c.id !== cardId);
    board.updatedAt = new Date().toISOString();
    writeStub(boards);
  }
}
