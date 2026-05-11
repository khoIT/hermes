---
phase: 9
title: "Agents Module"
status: pending
priority: P1/P2
effort: "6h"
dependencies: [7, 8]
---

# Phase 09: Agents Module (Screens 18-22) + Cross-Cutting

## Context Links
- PRD_Hermes_Agentic.md §4 (Atomic Opportunity card spec), §5 (Module 05), §6 (cross-cutting modifications)
- Catalog: `apps/web/src/data/catalog/agents/`
- Component: `<OpportunityCard>` from P-5

## Overview
Build Module 05. Inbox (18) and opportunity detail (19) are P1 — they're load-bearing for demo steps 10-12. Drafts (20), activity (21), settings (22) are P2. Cross-cutting modifications to existing modules: Author column on libraries, attribution on right rail Suggested-next, Experiment Agent panel on campaign monitoring (already in P-8), agent-attribution line on handoff modals (already in P-7/P-8 — verify).

## Key Insights
- Atomic Opportunity card is the load-bearing UI element (Agentic §4) — equivalent to predicate composer for module 03. Already built in P-5; this phase wires it into 3 contexts (inbox row, detail page, embedded in monitoring).
- Approval contract is per-artifact, never batched (Agentic §3). 3 paths: approve as-is / approve with edits / reject (with 4 reasons + dismiss-without-feedback).
- "Approve & draft" routes to canvas in agent-draft review mode — predicate pre-populated, banner replaces intent ribbon (Agentic §5.4).
- Studio Agent slot in settings shows "Coming in Phase 2" — visible commitment, no design effort.
- No agent chat. No model picker. No prompt editor. Per Agentic §11.

## Requirements
**Functional**
- 18 inbox:
  - Header stat strip: "9 opportunities · 3 drafts pending review · 2 experiment recommendations · 31 actions this week"
  - 4 tabs: Opportunities (default · n=9) · Drafts (n=3) · Recommendations (n=2) · Activity
  - Filter rail (Opportunities tab): agent · 4R goal · game · window · confidence
  - Body: list of OpportunityCard components in card mode
  - Sort: window urgency, then confidence
  - Empty states for Drafts/Recommendations with friendly copy
- 19 opportunity-detail:
  - Same OpportunityCard at full width with 2 additions:
    - Evidence panel expanded — full-width charts (audience size 30d, predicted vs actual for cited prior campaigns), event-stream samples, link-out chips
    - Agent thread — chronological log of reasoning steps in mono lines
- 20 drafts:
  - List view of agent-authored Segments + Campaigns awaiting review
  - Each row: artifact type chip · mono ID + serif italic display · "Drafted from opportunity ag-op-NNNN" link · "Drafted by Authoring Agent · 4h ago" · estimated impact · quick actions (Open · Approve · Reject)
  - Click "Open" → routes to corresponding canvas in agent-draft review mode (P-7 wires `?from=draft-id` flow)
- 21 activity:
  - Chronological feed of every agent action across workspace
  - Filterable by agent · action type (proposed · drafted · recommended · auto-archived) · outcome (approved · approved-with-edits · rejected · dismissed · expired)
  - One row per action, mono timestamps, terse copy
- 22 settings:
  - Per-agent enable/disable toggle (3 agents)
  - Frequency picker (continuous · hourly · daily · weekly scan)
  - Scope picker (games · 4R goals)
  - One section per agent
  - Studio Agent slot with `Coming in Phase 2 ·` empty state
- Cross-cutting verifications:
  - Library row Author column on `03_seg_library` (P-7) and `09_cmp_library` (P-8) — verify both render
  - Right rail Suggested-next attribution on `04_seg_canvas` (P-7) — verify
  - Experiment Agent panel on `16_cmp_monitoring` (P-8) — verify
  - Agent-attribution line on handoff modals (P-7, P-8) — verify both segment + campaign handoffs render attribution when artifact is agent-drafted

**Non-functional**
- 9 opportunities + 3 drafts + 2 recommendations all populated from `data/catalog/agents/` (P-3).
- Reject modal asks for one of 4 reasons + Dismiss-without-feedback path.
- Approve-as-is on opportunity → opportunity status flips to `approved` in local state, route to drafts queue (or directly to canvas review mode if Authoring Agent has already drafted).

## Architecture
```
modules/agents/
├── inbox.tsx                       18
├── opportunity-detail.tsx          19
├── drafts.tsx                      20
├── activity.tsx                    21
├── settings.tsx                    22
└── _components/
    ├── tabs-strip.tsx              4 inbox tabs
    ├── filter-rail.tsx
    ├── reject-modal.tsx            4 reasons + dismiss
    ├── agent-thread.tsx            chronological mono log
    ├── evidence-panel-expanded.tsx
    ├── draft-row.tsx
    ├── activity-row.tsx
    └── agent-config-section.tsx    per-agent settings
```

## Related Code Files
**Create** — all files in `modules/agents/`.

**Read**
- `data/catalog/agents/opportunities.ts`, `drafts.ts`, `recommendations.ts`, `activity.ts`
- `data/catalog/segments.ts`, `campaigns.ts` (for cross-link rendering)

**Verify (no modify)**
- `modules/segments/library.tsx` — Author column present
- `modules/campaigns/library.tsx` — Author column present
- `modules/segments/canvas.tsx` — right rail Suggested-next attribution
- `modules/campaigns/monitoring.tsx` — Experiment Agent panel
- `modules/segments/handoff-modal.tsx` + `modules/campaigns/handoff-modal.tsx` — conditional agent attribution line

## Implementation Steps
1. `_components/tabs-strip.tsx` — 4 tabs with badges showing count.
2. `_components/filter-rail.tsx` — agent / 4R / game / window / confidence checkboxes.
3. `inbox.tsx`:
   - Header stat strip
   - Tabs strip
   - Per active tab, render appropriate body:
     - Opportunities: filter rail + list of OpportunityCard components
     - Drafts: list of draft-row components
     - Recommendations: list of OpportunityCard in `embedded` mode (since recommendations follow same approval contract)
     - Activity: list of activity-row components
   - Sort logic: window urgency tier first (today > this-week > this-month > evergreen), then confidence desc
4. `_components/reject-modal.tsx`:
   - Modal opens on Dismiss click
   - 4 radio reasons (Already covered · Tried before · Wrong target · Other)
   - "Dismiss without feedback" link as fast path
   - Confirm/Cancel
5. `_components/agent-thread.tsx`:
   - Mono-formatted chronological log
   - Format: `{HH:mm:ss}  {action}  {description}` per line
   - Hardcoded threads in `data/catalog/agents/opportunities.ts` per Agentic §5.3
6. `_components/evidence-panel-expanded.tsx`:
   - Audience size 30d chart
   - Predicted vs actual mini-chart for cited prior campaigns (3 lines)
   - Event-stream sample table
   - Link-out chips (open in Explore / open feature)
7. `opportunity-detail.tsx`:
   - Header: opportunity ID + game + 4R goal + window
   - Full-width OpportunityCard (`mode="detail"`)
   - Evidence panel expanded
   - Agent thread
8. `_components/draft-row.tsx`:
   - Type chip
   - Mono ID + serif italic display name
   - "Drafted from opportunity →" link to detail
   - "Drafted by Authoring Agent · Nh ago"
   - Estimated impact (audience size or forecast lift)
   - Quick actions (Open · Approve · Reject)
9. `drafts.tsx` — list of draft-row components.
10. `_components/activity-row.tsx` — one line per agent action with timestamp + agent + action type + outcome chip.
11. `activity.tsx` — chronological feed with filter rail.
12. `_components/agent-config-section.tsx`:
   - Per-agent box with enable toggle, frequency picker, scope picker
   - Description copy of what the agent does
13. `settings.tsx`:
   - 3 sections (Insight Agent · Authoring Agent · Experiment Agent)
   - Studio Agent slot with empty state + "Coming in Phase 2" copy
14. Wire approve flow:
   - Click "Approve & draft" on opportunity → if Authoring Agent has draft → route to canvas review mode with `?from=draft-{id}` → P-7 banner shows
   - If no draft yet → simulate "drafting…" toast then route to drafts queue
15. Wire reject flow:
   - Click "Dismiss" → opens reject modal
   - On confirm → opportunity status → `dismissed` in local state; remove from list
16. Verify cross-cutting items in segments/campaigns modules.
17. Smoke test demo flow steps 10-13.
18. Commit: `feat(agents): module 05 + cross-cutting attributions for opportunities, drafts, recommendations`.

## Todo List
- [ ] Build inbox tabs-strip + filter-rail
- [ ] Build inbox.tsx with 4 tabs
- [ ] Build opportunity-detail.tsx with evidence + agent thread
- [ ] Build agent-thread component
- [ ] Build evidence-panel-expanded
- [ ] Build draft-row + drafts.tsx
- [ ] Build activity-row + activity.tsx
- [ ] Build agent-config-section + settings.tsx with Studio Agent slot
- [ ] Build reject-modal with 4 reasons + fast-path dismiss
- [ ] Wire approve flow (route to canvas review mode)
- [ ] Wire reject flow (modal + state update)
- [ ] Verify Author column on segments + campaigns libraries
- [ ] Verify Suggested-next attribution on segments canvas
- [ ] Verify Experiment Agent panel on campaigns monitoring
- [ ] Verify agent-attribution line on both handoff modals
- [ ] Smoke test demo steps 10-13

## Success Criteria
- [ ] Module 05 nav tab lands rightmost with `supervise` verb label (Agentic §12.1)
- [ ] Inbox renders 9 opportunities + 3 drafts + 2 recommendations across 4 tabs (Agentic §12.2)
- [ ] OpportunityCard renders 6 regions per Agentic §4 (intent · window/confidence · evidence · proposed · why-now collapsed · CTAs) — Agentic §12.3
- [ ] "Approve & draft" routes to canvas in agent-draft review mode with predicate pre-populated (Agentic §12.4)
- [ ] Author column present on `03` and `09` libraries with ≥1 agent-drafted row visible (Agentic §12.5)
- [ ] Experiment Agent panel renders 2 recommendations on `16` (Agentic §12.6)
- [ ] Agent-attribution line on ≥1 handoff modal in demo flow (Agentic §12.7)
- [ ] Studio Agent slot in settings shows "Coming in Phase 2" empty state
- [ ] Demo steps 10-13 walk without dead ends

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Approve-flow state lost on route change | Pass via URL search param `?from=draft-id` — survives refresh; canvas reads on mount |
| Reject modal blocks back-navigation | Modal has explicit Cancel CTA; ESC key closes |
| Activity feed gets long with 30+ entries | Pagination or virtualisation; v1 caps at 30 entries — sufficient for demo |
| OpportunityCard 3 modes diverge in maintenance | Single component file; mode prop branches early; shared sub-components for sections |
| Cross-cutting verifications miss because P-7/P-8 didn't add them | Explicit checkbox list in success criteria; integration test in P-10 |

## Security Considerations
- No agent ever auto-acts. All approvals explicit per-artifact (Agentic §3). Enforced by UX, not backend (no backend in v1).
- Reject reasons stored in local state only — no audit trail in v1.

## Next Steps
- P-10 validates 13-step demo flow including agent layer.
- Post-May-12: real agent backend wiring; reject reasons feed agent training.
