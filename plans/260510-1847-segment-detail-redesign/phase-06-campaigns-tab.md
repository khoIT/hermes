---
phase: 6
title: "Campaigns Tab"
status: completed
priority: P1
effort: "0.25d"
dependencies: [1]
---

# Phase 6: Campaigns Tab

## Overview

Implements `/segments/:id/campaigns` showing the list of campaigns currently targeting this segment. Replaces the `ComingSoon` stub. Empty state surfaces a CTA to create a new campaign seeded with this segment.

## Requirements

**Functional:**
- `/segments/:id/campaigns` renders a list of campaigns where `campaign.audienceRef === id`. **The contract field is `audienceRef`, not `segmentId`** (verified in `packages/contracts/src/hermes-campaign.ts`). Do not invent a `segmentId` field.
- Each list row: status pill · name · type chip (`triggerType`: realtime/scheduled/onetime) · last send date · observed lift if available (else "—" — `HermesCampaign` has no `lift` field, so this is an empty placeholder; do NOT generate synth lift values that read as real).
- Click row → `navigate('/campaigns/{campaignId}')`.
- Empty state: "Not used in any campaign yet" + `[Create campaign →]` button linking to `/campaigns/new/realtime?seedSegmentId={id}`.

**Non-functional:**
- `campaigns-tab.tsx` ≤150 LoC.
- No new fixtures — reuse existing campaign catalog (`allCampaigns` from `data/catalog/campaigns` if present).

## Architecture

```
campaigns-tab.tsx
  pull seg + campaigns = allCampaigns.filter(c => c.audienceRef === id)
  if (campaigns.length === 0)
    render <EmptyState>
  else
    render <CampaignList rows={campaigns}/>
```

`<CampaignList>`: simple table or row list — leverage existing `<CampaignsLibraryRow>`-like styling if one exists in the campaigns module.

## Related Code Files

**Create:**
- `apps/web/src/modules/segments/campaigns-tab.tsx`

**Modify:**
- `apps/web/src/routes.tsx` — replace `campaigns` ComingSoon stub with `<CampaignsTab/>`.

**Reuse (no modification):**
- `apps/web/src/data/catalog/campaigns.ts` (or similar) for `allCampaigns`.

**Delete:** none.

## Implementation Steps

1. **Locate campaign catalog** (10 min)
   - Find `allCampaigns` export (check `apps/web/src/data/catalog/`).
   - **Verified contract field:** `HermesCampaign.audienceRef` (nullable optional string). Filter on this, NOT `segmentId`.
   - Add helper `getCampaignsForSegment(segmentId): HermesCampaign[]` in catalog module = `allCampaigns.filter(c => c.audienceRef === segmentId)`.

2. **`<CampaignsTab>`** (1.5h)
   - Pull `seg`, filter `allCampaigns` by `segmentId === id`.
   - **Populated state:** render header "{N} campaigns targeting this segment" + table with columns: Status · Name · Type · Last send · Lift.
     - Status pill: green for active, gray for paused/draft.
     - Type chip: small badge.
     - Last send: relative time ("2 days ago") + tooltip ISO.
     - Lift: render "—" when contract value missing. **Do NOT generate synthetic lift values** — they read as real on demo day. If the field is unpopulated, hide the column or show a subtle "Not measured yet" caption.
     - Row click → navigate to campaign monitoring page.
   - **Empty state:** centered card.
     - Icon (lucide MailX) + "Not used in any campaign yet" + secondary copy "Activate this audience by creating a realtime, scheduled, or one-time campaign."
     - Primary CTA: `[Create campaign →]` → `navigate('/campaigns/new/realtime?seedSegmentId=' + id)`.
     - Secondary link below: "Browse campaign patterns →" → `/campaigns/patterns`.

3. **Route wire-up** (10 min)
   - Edit `routes.tsx`: replace ComingSoon for `campaigns` with `<CampaignsTab/>`.

4. **Verification:**
   - Load `/segments/{id}/campaigns` for a segment with `usedByCampaigns > 0` → list renders.
   - Load for a segment with no campaigns → empty state renders with CTA.
   - Click CTA → navigates to `/campaigns/new/realtime?seedSegmentId={id}`.
   - Click a row → navigates to `/campaigns/{campaignId}`.
   - `pnpm typecheck` clean.

## Success Criteria

- [ ] `/segments/:id/campaigns` renders list when campaigns exist.
- [ ] Empty state renders with CTA when none.
- [ ] CTA navigates to seeded `/campaigns/new/realtime` URL.
- [ ] Row click navigates to campaign detail.
- [ ] `pnpm typecheck` clean.

## Risk Assessment

- **Risk:** `allCampaigns` catalog doesn't have `segmentId` field for all entries.
  - **Mitigation:** Filter defensively (`c.segmentId === id`); empty state shows when no matches. Acceptable for prototype.
- **Risk:** Real backend `GET /api/v1/campaigns?segmentId={id}` may exist — using static catalog misses live campaigns.
  - **Mitigation:** Phase 6 ships static-catalog version; optional follow-up wires to backend API once verified. Document this limitation in code comment.
- **Risk:** Campaign type chip color/style diverges from `/campaigns` library page.
  - **Mitigation:** If a `<CampaignTypeChip>` component exists in campaigns module, import and reuse; otherwise inline a simple badge with consistent T tokens.
