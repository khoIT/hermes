/**
 * Campaigns drizzle schema.
 *
 * Lives separately from `schema.ts` to keep file sizes manageable. Re-exported
 * from `schema.ts` so existing import sites (and drizzle-kit's single-file
 * config) still resolve.
 *
 * Phase 5 of plan 260510-0151-chat-first-sidebar-ia: chat action card → POST
 * /api/v1/campaigns. Mirrors `segments` shape: optimistic concurrency via
 * `version`, append-only `campaign_changelog`, audit logged via the global
 * AuditService.
 */
import {
  pgTable, text, integer, timestamp, jsonb, uuid, index,
} from 'drizzle-orm/pg-core';
import { segments } from './schema';

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  // realtime|scheduled|onetime — drives the canvas variant + scheduling rules.
  type: text('type').notNull().default('realtime'),
  // FK to segments. Nullable so chat can stage a draft before audience picks
  // a segment; tighten to NOT NULL once the chat flow always pre-selects one.
  segmentId: text('segment_id').references(() => segments.id, { onDelete: 'set null' }),
  game: text('game').notNull().default('ALL'),     // PTG|CFM|TFB|ALL — denormalised for filter perf
  channel: text('channel').notNull().default('iam'),
  status: text('status').notNull().default('draft'),
  owner: text('owner').notNull(),
  // Display-only counters; live numbers come from query-svc once the
  // campaign is wired to the streaming pipeline. Persisted so list views
  // stay snappy even when the analytics rollup is offline.
  sent: text('sent').notNull().default('—'),
  reached: integer('reached').notNull().default(0),
  converted: integer('converted').notNull().default(0),
  revenue: text('revenue').notNull().default('—'),
  ctr: text('ctr').notNull().default('—'),
  start: text('start').notNull().default('Ongoing'),
  end: text('end').notNull().default(''),
  // Action payload (offer / message / cooldown / holdout). Loose JSON now;
  // a dedicated zod-validated shape lives in @hermes/contracts/campaign.ts.
  payload: jsonb('payload').notNull().default({}),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byGame:    index('campaigns_by_game').on(t.game),
  bySegment: index('campaigns_by_segment').on(t.segmentId),
  byStatus:  index('campaigns_by_status').on(t.status),
}));

// Append-only edit history; matches segment_changelog shape so the audit
// inspector can render both with the same component.
export const campaignChangelog = pgTable('campaign_changelog', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  actorId: text('actor_id').notNull(),
  diff: jsonb('diff').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCampaign: index('cmp_cl_by_campaign').on(t.campaignId, t.version),
}));
