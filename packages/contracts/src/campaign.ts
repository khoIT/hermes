import { z } from 'zod';
import { Id, GameCode } from './primitives.js';

export const CampaignStatus = z.enum([
  'draft',
  'scheduled',
  'running',
  'paused',
  'finished',
  'archived',
]);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

export const CampaignType = z.enum(['realtime', 'scheduled', 'onetime']);
export type CampaignType = z.infer<typeof CampaignType>;

export const Campaign = z.object({
  id: Id,
  name: z.string(),
  description: z.string().default(''),
  type: CampaignType.default('realtime'),
  segmentId: Id.nullable(),
  game: GameCode,
  channel: z.string(),                   // 'push + in-game' / 'email + push'
  status: CampaignStatus,
  owner: z.string(),
  sent: z.string(),                      // display — '18.4K' / '—'
  reached: z.number().int().nonnegative(),
  converted: z.number().int().nonnegative(),
  revenue: z.string(),                   // display — '₫ 1.24B' / '—'
  ctr: z.string(),                       // display — '22.4%' / '—'
  start: z.string(),                     // 'Apr 18' / 'Ongoing'
  end: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
  version: z.number().int().nonnegative().default(1),
});
export type Campaign = z.infer<typeof Campaign>;

// POST /api/v1/campaigns — what chat action-card-campaign.tsx sends.
export const CreateCampaignBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: CampaignType.optional(),
  segmentId: Id.nullable().optional(),
  game: GameCode.optional(),
  channel: z.string().optional(),
  status: CampaignStatus.optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type CreateCampaignBody = z.infer<typeof CreateCampaignBody>;
