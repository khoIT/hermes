import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { boards, boardCards } from '../db/schema';
import type { Db } from '../db/client';
import { InjectDb } from '../db/client';
import { AuditService } from '../audit/audit.service';
import type { BedrockClaims } from '../auth/auth.service';

type SectionMeta = { id: string; title: string; isExpanded: boolean };

const DEFAULT_SECTIONS: SectionMeta[] = [
  { id: 'pinned', title: 'Pinned', isExpanded: true },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

@Injectable()
export class BoardsService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  // List boards with `cardCount` rolled up so the canvas list page can
  // render `N cards · Updated [date]` without an N+1 fetch.
  async list() {
    const rows = await this.db
      .select().from(boards)
      .orderBy(desc(boards.updatedAt));
    if (!rows.length) return { items: [] };
    const cardRows = await this.db
      .select({ boardId: boardCards.boardId, id: boardCards.id })
      .from(boardCards);
    const counts = new Map<string, number>();
    for (const r of cardRows) counts.set(r.boardId, (counts.get(r.boardId) ?? 0) + 1);
    const items = rows.map(b => ({ ...b, cardCount: counts.get(b.id) ?? 0 }));
    return { items };
  }

  // Detail view: hydrates cards into their declared sections so the front
  // end can render a stable section order even if the cards table is empty.
  async get(id: string) {
    const rows = await this.db.select().from(boards).where(eq(boards.id, id)).limit(1);
    if (!rows.length) throw new NotFoundException('board not found');
    const board = rows[0]!;
    const cards = await this.db
      .select().from(boardCards)
      .where(eq(boardCards.boardId, id))
      .orderBy(asc(boardCards.pinnedAt));
    const sectionMeta = (board.sections as SectionMeta[]) ?? DEFAULT_SECTIONS;
    const sections = sectionMeta.map(s => ({
      ...s,
      cards: cards
        .filter(c => c.sectionId === s.id)
        .map(c => ({
          id: c.id,
          widget: c.widget,
          sourceThreadId: c.sourceThreadId,
          pinnedAt: c.pinnedAt,
        })),
    }));
    return { ...board, sections };
  }

  async create(input: { name: string; sections?: SectionMeta[] }, user: BedrockClaims) {
    const id = `bd_${Date.now().toString(36)}_${uid()}`;
    const now = new Date();
    const row = {
      id,
      name: input.name,
      sections: (input.sections ?? DEFAULT_SECTIONS) as never,
      owner: user.name,
      createdAt: now,
      updatedAt: now,
    };
    const [inserted] = await this.db.insert(boards).values(row).returning();
    await this.audit.log({
      actorId: user.sub, action: 'create', entity: 'board', entityId: id,
      payload: { name: row.name },
    });
    return { ...inserted, cardCount: 0 };
  }

  async update(
    id: string,
    patch: { name?: string; sections?: SectionMeta[] },
    user: BedrockClaims,
  ) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.sections !== undefined) updates.sections = patch.sections;
    const result = await this.db
      .update(boards).set(updates).where(eq(boards.id, id)).returning();
    if (!result.length) throw new NotFoundException('board not found');
    await this.audit.log({
      actorId: user.sub, action: 'update', entity: 'board', entityId: id,
      payload: { fields: Object.keys(patch) },
    });
    return result[0];
  }

  async remove(id: string, user: BedrockClaims) {
    const result = await this.db.delete(boards).where(eq(boards.id, id)).returning();
    if (!result.length) throw new NotFoundException('board not found');
    await this.audit.log({
      actorId: user.sub, action: 'delete', entity: 'board', entityId: id,
      payload: { name: result[0]!.name },
    });
    return { ok: true };
  }

  async pinCard(
    boardId: string,
    body: { sectionId?: string; widget: unknown; sourceThreadId?: string },
    user: BedrockClaims,
  ) {
    const exists = await this.db.select({ id: boards.id })
      .from(boards).where(eq(boards.id, boardId)).limit(1);
    if (!exists.length) throw new NotFoundException('board not found');
    const [card] = await this.db.insert(boardCards).values({
      boardId,
      sectionId: body.sectionId ?? 'pinned',
      widget: body.widget as never,
      sourceThreadId: body.sourceThreadId ?? null,
    }).returning();
    await this.db.update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, boardId));
    await this.audit.log({
      actorId: user.sub, action: 'pin', entity: 'board_card', entityId: card!.id,
      payload: { boardId, sourceThreadId: body.sourceThreadId ?? null },
    });
    return card;
  }

  async unpinCard(boardId: string, cardId: string, user: BedrockClaims) {
    const result = await this.db.delete(boardCards)
      .where(and(eq(boardCards.boardId, boardId), eq(boardCards.id, cardId)))
      .returning();
    if (!result.length) throw new NotFoundException('card not found');
    await this.db.update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, boardId));
    await this.audit.log({
      actorId: user.sub, action: 'unpin', entity: 'board_card', entityId: cardId,
      payload: { boardId },
    });
    return { ok: true };
  }
}
