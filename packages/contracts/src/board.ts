/**
 * Board contracts — shared by chat Pin-to-Board flow + canvas pages.
 *
 * Phase 6 of plan 260510-0151-chat-first-sidebar-ia. Cards store the full
 * DataWidget JSON snapshot at pin-time so boards stay stable even if the
 * source thread later mutates.
 */
import { z } from 'zod';

export const BoardSectionMeta = z.object({
  id: z.string(),
  title: z.string(),
  isExpanded: z.boolean(),
});
export type BoardSectionMeta = z.infer<typeof BoardSectionMeta>;

// Loose widget JSON — the runtime renderer (apps/web/src/components/chat/widgets/widget.tsx)
// validates against its own discriminated union. Boards just transports it.
export const PinnedCardWidget = z.record(z.string(), z.unknown());
export type PinnedCardWidget = z.infer<typeof PinnedCardWidget>;

export const PinnedCard = z.object({
  id: z.string(),
  widget: PinnedCardWidget,
  sourceThreadId: z.string().nullable().optional(),
  pinnedAt: z.string(),
});
export type PinnedCard = z.infer<typeof PinnedCard>;

export const BoardSection = BoardSectionMeta.extend({
  cards: z.array(PinnedCard).default([]),
});
export type BoardSection = z.infer<typeof BoardSection>;

export const Board = z.object({
  id: z.string(),
  name: z.string(),
  sections: z.array(BoardSection),
  cardCount: z.number().int().nonnegative().optional(),
  owner: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Board = z.infer<typeof Board>;

export const CreateBoardBody = z.object({
  name: z.string().min(1),
  sections: z.array(BoardSectionMeta).optional(),
});
export type CreateBoardBody = z.infer<typeof CreateBoardBody>;

export const PinCardBody = z.object({
  sectionId: z.string().optional(),
  widget: PinnedCardWidget,
  sourceThreadId: z.string().optional(),
});
export type PinCardBody = z.infer<typeof PinCardBody>;
