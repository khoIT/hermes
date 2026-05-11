---
phase: 5
title: "Action cards + campaigns backend"
status: pending
priority: P1
effort: "1.5d"
dependencies: [4]
---

# Phase 5: Action cards + campaigns backend

## Overview

Wire chat action cards to live POST endpoints. Segments uses existing `POST /segments`. Campaigns requires NEW backend module (controller + service + drizzle table). Both flows: chat → action card with name preview → user clicks Confirm → POST → action card swaps to clean ✓ "Created — [name]" with View link → click View → navigate to detail page.

## Requirements

- **Functional:** Confirm button POSTs to backend, returns id, navigates to detail page; error states surface 4xx/5xx in inline error within action card
- **Non-functional:** POST latency <500ms p50 (local catalog-api), idempotent retries, optimistic UI (show pending state during inflight)

## Architecture

```
ChatThread receives intent: "create_segment" or "create_campaign"
   ↓
Renders <ActionCardSegment /> or <ActionCardCampaign />
   ↓
   shows: name preview · Confirm · Refine · Cancel
   ↓
On Confirm:
   POST /api/v1/segments      (existing)
   POST /api/v1/campaigns     (NEW — Phase 5 backend work)
   ↓
On 200:
   Replace card with <ActionConfirmedCard /> showing ✓ + name + View ↗
   ↓
On click View:
   navigate(`/segments/:id`) or `/campaigns/:id`

On error: show inline red banner inside card with retry button
```

Backend: new `apps/catalog-api/src/campaigns/` module mirroring `segments/` structure. Drizzle table `campaigns` with: id, name, description, type (`realtime|scheduled|onetime`), segmentId (FK), status, createdBy, createdAt, updatedAt.

## Related Code Files

**Frontend create:**
- `apps/web/src/components/chat/action-cards/action-card-segment.tsx`
- `apps/web/src/components/chat/action-cards/action-card-campaign.tsx`
- `apps/web/src/components/chat/action-cards/action-card-shell.tsx` — shared layout (preview + buttons)
- `apps/web/src/components/chat/action-cards/action-confirmed-card.tsx` — post-success view
- `apps/web/src/api/segments-client.ts` — `createSegment(payload)` fetch wrapper
- `apps/web/src/api/campaigns-client.ts` — `createCampaign(payload)` fetch wrapper

**Backend create (NEW campaigns module):**
- `apps/catalog-api/src/campaigns/campaigns.controller.ts` — GET / GET :id / POST / PATCH :id / DELETE :id
- `apps/catalog-api/src/campaigns/campaigns.service.ts`
- `apps/catalog-api/src/campaigns/campaigns.module.ts`
- `apps/catalog-api/src/db/schema-campaigns.ts` — drizzle table definition
- `apps/catalog-api/drizzle/migrations/NNNN_create_campaigns.sql` — generated via `pnpm --filter @hermes/catalog-api drizzle-kit generate`
- `packages/contracts/src/campaign.ts` — Zod schema (or extend existing if present)

**Modify:**
- `apps/catalog-api/src/app.module.ts` — register `CampaignsModule`
- `apps/catalog-api/src/db/schema.ts` — re-export campaigns table (or import in schema-campaigns.ts directly)
- `apps/web/src/components/chat/thread-page.tsx` — render action card when intent matches `create_segment` / `create_campaign`
- `apps/web/src/data/chat/intents.ts` — ensure intents trigger action card responseType
- `apps/web/src/data/chat/threads/thread-004-*.json` — set message section type to `action_card_segment`

## Implementation Steps

**Backend (campaigns module):**

1. Define drizzle table in `db/schema-campaigns.ts`: `id` (uuid PK), `name` (text), `description` (text nullable), `type` (enum 'realtime'|'scheduled'|'onetime'), `segment_id` (uuid FK to segments), `status` (text default 'draft'), `created_by` (text), `created_at`, `updated_at`
2. Run `pnpm --filter @hermes/catalog-api drizzle-kit generate` → produces SQL migration; commit
3. Run migration: `pnpm migrate`
4. Create `campaigns.service.ts` with `list()`, `get(id)`, `create(body, user)`, `update(id, patch, ifMatch, user)`, `remove(id, user)` — pattern-match `segments.service.ts`
5. Create `campaigns.controller.ts` mirroring `segments.controller.ts` (Zod validation pipe)
6. Create `campaigns.module.ts`
7. Register in `app.module.ts`
8. Add Zod schema to `packages/contracts/src/campaign.ts`; export from index
9. Smoke test via curl: `curl -X POST http://localhost:3001/api/v1/campaigns -d '{"name":"test","type":"realtime","segmentId":"..."}'` returns `{id: "..."}`

**Frontend:**

10. Build `action-card-shell.tsx` — preview area + Confirm/Refine/Cancel buttons + error/pending states
11. Build `action-card-segment.tsx` — uses shell, renders name + (auto-derived from query); on Confirm calls `segments-client.createSegment()`
12. Build `action-card-campaign.tsx` — uses shell; renders name + type pill (realtime/scheduled/onetime auto-detected from intent); on Confirm calls `campaigns-client.createCampaign()`
13. Build `action-confirmed-card.tsx` — clean ✓ + name + "View ↗" link
14. Build `segments-client.ts` and `campaigns-client.ts` with typed fetch wrappers + error envelope handling
15. Wire `thread-page.tsx` to render correct action card variant based on `message.sections[0].type`
16. Refine button → opens `/segments/new?prefill=...` or `/campaigns/new/realtime?prefill=...` (pre-fill JSON in URL or sessionStorage)
17. Test thread-004 end-to-end: prompt → action card → Confirm → ✓ card → View → /segments/:id with new segment visible
18. Test campaign creation via separate prompt or follow-up
19. `pnpm typecheck && pnpm --filter @hermes/web build && pnpm --filter @hermes/catalog-api build`

## Success Criteria

- [ ] `pnpm migrate` applies new campaigns migration cleanly
- [ ] `curl POST /api/v1/campaigns` returns valid `{id}` for valid payload
- [ ] `curl POST /api/v1/campaigns` returns 400 with Zod errors for invalid payload
- [ ] thread-004 demo: chat prompt → action card → Confirm → "Segment created" ✓ card → View → live segment at `/segments/:id`
- [ ] Campaign create flow works via second prompt
- [ ] Error state: kill catalog-api, click Confirm → inline error in card with retry button
- [ ] Refine button opens `/segments/new?prefill=...` or `/campaigns/new/realtime?prefill=...`
- [ ] `pnpm typecheck` clean across all packages

## Risk Assessment

- **Drizzle schema FK to segments:** if segments table has different column name (`segmentId` vs `segment_id`), align before migration. Read existing `db/schema.ts` first.
- **Zod schema duplication:** if `packages/contracts` already has a stale Campaign type, REUSE; don't create competing schema.
- **Catalog-api auth:** `current-user.decorator` requires JWT; for chat-driven creates we need auth context. Reuse Bedrock claims pattern from segments. Verify chat is authed.
- **Pre-fill via URL:** keep query string short; if payload is large, use sessionStorage with key `hermes.canvas.prefill` and read on canvas mount.
- **Campaign type inference:** intent matcher must detect realtime vs scheduled vs onetime from prompt keywords ("real-time", "send tomorrow", "one-shot"). Default to `realtime` if ambiguous.
