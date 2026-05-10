/**
 * Boards drizzle schema.
 *
 * Phase 6 of plan 260510-0151-chat-first-sidebar-ia: Pin-to-Board flow from
 * chat widgets. Two tables: `boards` holds the metadata + the section list
 * (jsonb of `{id, title, isExpanded}`); `board_cards` holds pinned widgets,
 * each tagged with `section_id` (string FK by id, not by row PK — keeps
 * sections trivially renameable without a row-level migration).
 *
 * Widget JSON is stored verbatim — boards take a snapshot at pin time so the
 * card stays stable even if the source thread later mutates.
 */
import {
  pgTable, text, timestamp, jsonb, uuid, index,
} from 'drizzle-orm/pg-core';

const DEFAULT_SECTIONS = [
  { id: 'pinned', title: 'Pinned', isExpanded: true },
] as const;

export const boards = pgTable('boards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  // [{id, title, isExpanded}, ...]; cards live separately in board_cards.
  sections: jsonb('sections').notNull().$default(() => DEFAULT_SECTIONS as unknown as object),
  owner: text('owner').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOwner: index('boards_by_owner').on(t.owner),
}));

export const boardCards = pgTable('board_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  // String FK to boards.sections[].id — sections are jsonb so we don't have
  // a row-level FK target. Defaults to 'pinned' so single-section boards
  // never need an explicit section_id from the client.
  sectionId: text('section_id').notNull().default('pinned'),
  // The full DataWidget JSON (`@hermes/contracts/board.PinnedCardWidget`).
  // Stored verbatim — pin-time snapshot semantics, no later auto-refresh.
  widget: jsonb('widget').notNull(),
  // Where this card came from. Optional so non-chat surfaces can pin too.
  sourceThreadId: text('source_thread_id'),
  pinnedAt: timestamp('pinned_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byBoard: index('board_cards_by_board').on(t.boardId, t.sectionId),
  byThread: index('board_cards_by_thread').on(t.sourceThreadId),
}));
