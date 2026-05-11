---
phase: 5
title: "Web Shell + Nav + Theme + Shared Components"
status: in-progress
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 05: Web Shell, Nav, Theme, Shared Components

## Context Links
- PRD_Hermes_Design.md §4 (visual language), §5 (nav + IA)
- PRD_Hermes_Agentic.md §5.1 (5th nav tab placement), §9 (visual additions)
- Bedrock visual reference: `LiveOps Engine.html`, `theme.jsx`, `colors_and_type.css`

## Overview
App shell with 5-module nav per PRD. Routing skeleton for all 23 screens. Shared components used across modules: latency badges, feature pills, sparklines, audience band, predicate composer building blocks, handoff modal frame, agent badges. Theme tokens and primitives finalised.

## Key Insights
- Nav order: `01 Feature Store · 02 Explore · 03 Segments · 04 Campaign · 05 Agents`. Verb labels per PRD: inventory · investigate · compose · activate · supervise.
- Agent badge color reuses `#f05a22` (deep red) — no new palette per Agentic §9.
- Latency badge format: `[<1s · A]` / `[<1h · B]` / `[<1d · B]` with substrate icon. Dual-tier features show both.
- Plain-English explainer toggle is a cross-cutting feature — implement as shared component used in segments + campaigns.
- Materials shelf is reused across both authoring canvases.

## Requirements
**Functional**
- App shell with sticky nav, BrandMark, role/user dropdown stub.
- React Router routes for all 23 screens (placeholder pages return module name + screen ID).
- Shared components functional with crawled data:
  - `<LatencyBadge tier="<1s" substrate="A">` etc.
  - `<FeaturePill featureName="..." onClick={swap} />` opens swap popover (P-7 wires logic).
  - `<Sparkline data={[...]} />` from theme.tsx.
  - `<Histogram data={[...]} p50 p90 p99 />` 28-bin SVG with markers.
  - `<AudienceBand uids percent breakdown />` sticky band component.
  - `<HandoffModal idType="segment" id substrate steps consumerPath />` modal frame.
  - `<AgentBadge variant="agent" | "agent-edited" />`.
  - `<AgentAttribution agent thread />` for handoff modals.
  - `<OpportunityCard {...op} mode="card" | "detail" | "embedded" />` shared by inbox/detail/monitoring.
  - `<ApproveEditDismiss onApprove onEdit onDismiss />` 3-CTA component.
  - `<PlainEnglishToggle predicate />` toggle + render.

**Non-functional**
- All shared components fully typed against `@hermes/contracts`.
- No file >200 lines; split rendering vs logic where applicable.
- Routes match PRD screen IDs in URLs (e.g. `/segments/04` → canvas) for easy demo navigation.

## Architecture
```
apps/web/src/
├── App.tsx                         shell + Router setup
├── nav.tsx                         5-tab nav, role dropdown stub
├── routes.tsx                      route → component map for 23 screens
├── theme.tsx                       T tokens + primitives (P-1)
├── ui/                             primitives (P-1)
├── components/
│   ├── latency-badge.tsx
│   ├── feature-pill.tsx
│   ├── histogram.tsx
│   ├── sparkline.tsx               (re-export from theme + chart variant)
│   ├── audience-band.tsx
│   ├── handoff-modal.tsx
│   ├── agent-badge.tsx
│   ├── agent-attribution.tsx
│   ├── agent-reasoning-panel.tsx
│   ├── opportunity-card.tsx
│   ├── approve-edit-dismiss.tsx
│   ├── plain-english-toggle.tsx
│   ├── materials-shelf.tsx
│   └── brand-mark.tsx
└── modules/
    ├── home/page.tsx               00 placeholder
    ├── feature-store/{library,detail}.tsx   01-02 placeholders
    ├── explore/stub.tsx                       Module 02 — nav-only
    ├── segments/{library,canvas,threshold-deep,handoff-modal,monitoring,patterns}.tsx
    ├── campaigns/{library,canvas/{realtime,scheduled,onetime},journey,prelaunch,handoff-modal,monitoring,patterns}.tsx
    └── agents/{inbox,opportunity-detail,drafts,activity,settings}.tsx
```

## Related Code Files
**Create**
- All files in `apps/web/src/components/` (per architecture)
- `apps/web/src/nav.tsx`, `apps/web/src/routes.tsx`
- All `modules/*/<screen>.tsx` placeholder files
- `apps/web/src/utils/format-uid-count.ts` (e.g. 23890 → "23,890 UIDs")
- `apps/web/src/utils/predicate-hash.ts` (consistent hashing for audience-counts lookup)

**Modify**
- `apps/web/src/App.tsx` — wire Router + nav

## Implementation Steps
1. Define route table in `routes.tsx` mapping each PRD screen ID to component path. URLs:
   - `/` → home (00)
   - `/feature-store` → 01, `/feature-store/:name` → 02
   - `/explore` → stub
   - `/segments` → 03, `/segments/new` → 04, `/segments/:id` → 07, `/segments/:id/threshold` → 05, `/segments/:id/handoff` → 06 (modal route), `/segments/patterns` → 08
   - `/campaigns` → 09, `/campaigns/new/realtime` → 10, `/campaigns/new/scheduled` → 11, `/campaigns/new/onetime` → 12, `/campaigns/:id` → 16, `/campaigns/:id/journey` → 13, `/campaigns/:id/prelaunch` → 14, `/campaigns/:id/handoff` → 15, `/campaigns/patterns` → 17
   - `/agents` → 18, `/agents/op/:id` → 19, `/agents/drafts` → 20, `/agents/activity` → 21, `/agents/settings` → 22
2. Build `<Nav />` — 5 tabs, active-route highlight using `T.colors.accent`. Verb labels under tab names. Role dropdown stub on right (`Khoi · CFM PM`).
3. Build `<BrandMark />` — VNGGames mark + Hermes wordmark using `T.fDisp` (League Gothic).
4. Build `<LatencyBadge />`:
   - Props: `{ tier: "<1s" | "<1h" | "<1d", substrate: "A" | "B" }`
   - Renders mono pill with bracket chars literally: `[<1s · A]`.
   - Dual-tier variant accepts array: `tiers={[{tier:"<1s",sub:"A"},{tier:"<1h",sub:"B"}]}`.
5. Build `<FeaturePill />` — clickable, opens swap popover (popover content placeholder; P-7 wires).
6. Build `<Histogram />`:
   - 28-bin SVG, gradient fill matching theme.
   - Optional p50/p90/p99 dotted vertical markers.
   - Optional matched-region overlay (used by threshold playground).
   - Reads from `crawled/distributions.json`.
7. Build `<AudienceBand />`:
   - Props: `{ uids, percentMau, percentSubpop, breakdown? }`
   - Sticky positioning (consumer wraps with sticky parent).
   - "Show breakdown ▾" expand-in-place with lifecycle/spend-tier bars.
   - Pulse animation on uid count change (CSS keyframe, ~400ms).
8. Build `<HandoffModal />`:
   - Props: `{ idType, id, substrate, steps, consumerPath, agentAttribution? }`
   - Modal that cannot be dismissed by overlay click (per PRD §10).
   - Mono blocks for ID + substrate + consumer path verbatim.
   - Optional `<AgentAttribution />` line above "What happens next".
9. Build `<OpportunityCard />`:
   - 3 modes: card (inbox row), detail (full-width 19), embedded (16 monitoring inline).
   - Regions: intent · window+confidence · evidence · proposed · whyNow (collapsed) · CTAs.
   - "Why now" expand state local; persists per session.
10. Build `<ApproveEditDismiss />` — 3-CTA bar matching PRD card spec.
11. Build `<AgentBadge />` — variants `agent`, `agent-edited`. Mono pill, deep red filled vs outlined.
12. Build `<AgentAttribution />`, `<AgentReasoningPanel />`, `<MaterialsShelf />`, `<PlainEnglishToggle />`.
13. Build placeholder modules — each module screen returns: `<div><h1>{ID}</h1><p>{name}</p></div>`. Wire to route table.
14. Verify `pnpm dev` — click each nav tab, navigate to each route, no 404.
15. Commit: `feat(web): app shell + nav + shared components for 5 modules`.

## Todo List
- [ ] Define route table for all 23 screens
- [ ] Build `<Nav />` with 5 tabs + active highlight
- [ ] Build `<BrandMark />`
- [ ] Build `<LatencyBadge />` with dual-tier support
- [ ] Build `<FeaturePill />` with swap popover stub
- [ ] Build `<Histogram />` 28-bin with p-markers
- [ ] Build `<Sparkline />` (extend theme primitive)
- [ ] Build `<AudienceBand />` sticky with breakdown expansion
- [ ] Build `<HandoffModal />` frame
- [ ] Build `<OpportunityCard />` with 3 modes
- [ ] Build `<ApproveEditDismiss />`, `<AgentBadge />`, `<AgentAttribution />`, `<AgentReasoningPanel />`
- [ ] Build `<MaterialsShelf />`, `<PlainEnglishToggle />`
- [ ] Wire placeholder pages for all 23 screens
- [ ] Smoke test all routes navigable
- [ ] Commit checkpoint

## Success Criteria
- [ ] All 23 PRD screen routes resolvable; no 404s
- [ ] Nav highlights active module
- [ ] LatencyBadge renders both single + dual-tier per PRD §6.2 spec
- [ ] Histogram renders sample data with visible p50/p90/p99 markers
- [ ] HandoffModal renders verbatim mono substrate copy from PRD §8.7
- [ ] OpportunityCard renders the 6 regions per Agentic §4 ASCII spec

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Sticky AudienceBand breaks with module-level scroll containers | Use position:sticky with scoped parent; test in canvas layouts |
| HandoffModal copy drift from PRD verbatim | Centralise mono copy strings in `components/handoff-modal-copy.ts`; load by substrate |
| Pulse animation performance on slider drag | RequestAnimationFrame throttle; CSS-only pulse (transform:scale) |
| OpportunityCard re-rendered N times in inbox list | Memoise with React.memo on `id`; CTAs use refs not closures |

## Security Considerations
- No XSS surface — all content is hardcoded TS exports, no `dangerouslySetInnerHTML`.
- Predicate hash util uses stable hash (SHA-1 over canonical form) — no security implications since fixtures only.

## Next Steps
- P-6, P-7, P-8, P-9 fill in module pages.
- P-10 validates routes work end-to-end via demo flow.
