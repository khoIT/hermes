import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, sql, SQL } from 'drizzle-orm';
import { campaigns, campaignChangelog } from '../db/schema';
import type { Db } from '../db/client';
import { InjectDb } from '../db/client';
import { AuditService } from '../audit/audit.service';
import type { BedrockClaims } from '../auth/auth.service';

type ListFilters = {
  game?: string;
  status?: string;
  type?: string;
  segmentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type CreateInput = {
  id?: string;
  name: string;
  description?: string;
  type?: 'realtime' | 'scheduled' | 'onetime';
  segmentId?: string | null;
  game?: string;
  channel?: string;
  status?: string;
  payload?: Record<string, unknown>;
};

@Injectable()
export class CampaignsService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  async list(f: ListFilters) {
    const conds: SQL[] = [];
    if (f.game) conds.push(eq(campaigns.game, f.game));
    if (f.status) conds.push(eq(campaigns.status, f.status));
    if (f.type) conds.push(eq(campaigns.type, f.type));
    if (f.segmentId) conds.push(eq(campaigns.segmentId, f.segmentId));
    if (f.search) conds.push(ilike(campaigns.name, `%${f.search}%`));
    const where = conds.length ? and(...conds) : undefined;
    const pageSize = Math.min(f.pageSize ?? 200, 500);
    const offset = (f.page ?? 0) * pageSize;
    const items = await this.db
      .select().from(campaigns).where(where)
      .orderBy(desc(campaigns.updatedAt))
      .limit(pageSize).offset(offset);
    const total = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(campaigns).where(where);
    return { items, total: total[0]?.count ?? items.length };
  }

  async get(id: string) {
    const rows = await this.db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (!rows.length) throw new NotFoundException('campaign not found');
    return rows[0];
  }

  async create(input: CreateInput, user: BedrockClaims) {
    const id = input.id ?? `cmp_${Date.now().toString(36)}`;
    const now = new Date();
    const row = {
      id,
      name: input.name,
      description: input.description ?? '',
      type: input.type ?? 'realtime',
      segmentId: input.segmentId ?? null,
      game: input.game ?? 'ALL',
      channel: input.channel ?? 'iam',
      status: input.status ?? 'draft',
      owner: user.name,
      sent: '—',
      reached: 0,
      converted: 0,
      revenue: '—',
      ctr: '—',
      start: 'Ongoing',
      end: '',
      payload: (input.payload ?? {}) as never,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    const [inserted] = await this.db.insert(campaigns).values(row).returning();
    await this.audit.log({
      actorId: user.sub, action: 'create', entity: 'campaign', entityId: id,
      payload: { name: row.name, type: row.type, segmentId: row.segmentId },
    });
    return inserted;
  }

  async update(
    id: string,
    patch: Record<string, unknown>,
    ifMatch: number,
    user: BedrockClaims,
  ) {
    const updates: Record<string, unknown> = {};
    for (const k of [
      'name', 'description', 'type', 'segmentId', 'game', 'channel',
      'status', 'payload', 'sent', 'reached', 'converted', 'revenue', 'ctr', 'start', 'end',
    ]) {
      if (k in patch) updates[k] = patch[k];
    }
    updates.version = sql`${campaigns.version} + 1`;
    updates.updatedAt = new Date();
    const result = await this.db
      .update(campaigns)
      .set(updates)
      .where(and(eq(campaigns.id, id), eq(campaigns.version, ifMatch)))
      .returning();
    if (!result.length) {
      const existing = await this.db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
      if (!existing.length) throw new NotFoundException('campaign not found');
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'campaign was modified by another writer',
        details: { currentVersion: existing[0]!.version, ifMatch },
      });
    }
    const updated = result[0]!;
    await this.db.insert(campaignChangelog).values({
      campaignId: id, version: updated.version, actorId: user.sub, diff: patch as never,
    });
    await this.audit.log({
      actorId: user.sub, action: 'update', entity: 'campaign', entityId: id,
      payload: { version: updated.version, fields: Object.keys(patch) },
    });
    return updated;
  }

  async remove(id: string, user: BedrockClaims) {
    const result = await this.db.delete(campaigns).where(eq(campaigns.id, id)).returning();
    if (!result.length) throw new NotFoundException('campaign not found');
    await this.audit.log({
      actorId: user.sub, action: 'delete', entity: 'campaign', entityId: id,
      payload: { name: result[0]!.name },
    });
    return { ok: true };
  }
}
