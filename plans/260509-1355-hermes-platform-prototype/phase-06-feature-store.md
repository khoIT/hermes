---
phase: 6
title: "Feature Store Module"
status: pending
priority: P1
effort: "5h"
dependencies: [3, 4, 5]
---

# Phase 06: Feature Store Module (Screens 01-02)

## Context Links
- PRD_Hermes_Design.md §6 (Feature Store module spec)
- Hermes_Demo_Data.md Part 1 (67 features), Part 6 (mockup mapping)
- Catalog: `apps/web/src/data/catalog/features/`
- Crawled: `apps/web/src/data/crawled/distributions.json`

## Overview
Build screens 01_fs_library and 02_fs_detail. Library is groupable/filterable catalog over all 67 features. Detail showcases `consecutive_ranked_losses_streak` (dual-tier) with side-by-side expr-lang + dbt definition, full histogram, lineage tab, used-by tab.

## Key Insights
- Header stat strip is *load-bearing* — makes two-substrate commitment ambient on landing. Must show: feature count by tier, "added this month", drift count.
- Dual-tier feature detail must visibly show **one definition compiles to two substrates** — side-by-side mono blocks for expr-lang (Substrate A) and dbt/Trino SQL (Substrate B).
- "Used by N segments / M campaigns" backlink counts come from segment+campaign data — compute at component mount, not stored.
- "Edit definition" button is CTA-only (no editor); "Register a new feature" is CTA-only (no form). Per PRD §13.

## Requirements
**Functional**
- 01 library:
  - Header stat strip with: total count, hot/warm/cold tier counts, "added this month" count
  - Group-by control: domain (default) / tier / owner / used-in-prod / none
  - Filter rail: type chips, latency class, status, owner
  - Each feature row card per PRD §6.2 spec
  - Entry-points strip: "Browse by domain (default) · Register a new feature · Recently added · Drift detected"
  - Click row → `/feature-store/:name` (02 detail)
- 02 detail:
  - Header: name in mono + serif italic display, owner, type chip, latency badge, status, "Edit definition" button (no-op).
  - Tabs: Overview · Lineage · Used By
  - Overview tab:
    - Definition block — two-column mono blocks for expr-lang and dbt SQL (use placeholder generated copy if catalog doesn't include real definition; from `Hermes_Demo_Data.md` showcase examples for `consecutive_ranked_losses_streak`)
    - Type/storage row
    - Histogram (28-bin, full-width, p50/p90/p99 markers) reading `crawled/distributions.json`
    - Recent values panel reading `crawled/sample-players.json`
    - Materialization status row (last refresh, freshness SLA)
  - Lineage tab: ASCII or simple SVG graph showing upstream tables → pipeline → downstream segments/campaigns
  - Used-by tab: tables of segments and campaigns referencing this feature (transitive via segment refs in campaigns)
- Right rail (sticky, both 01 and 02): "Use in segment" CTA → routes to `/segments/new?seedFeature=:name`. "Investigate in Explore" CTA → `/explore?feature=:name`. Related features.

**Non-functional**
- 67 rows render virtualised if visible perf drops below 60fps; otherwise plain map.
- Histograms read JSON at module mount, memoised by feature name.
- All screen IDs visible in URL bar for demo navigation.

## Architecture
```
modules/feature-store/
├── library.tsx                     screen 01
├── detail.tsx                      screen 02
├── _components/
│   ├── stat-strip.tsx
│   ├── filter-rail.tsx
│   ├── group-by-control.tsx
│   ├── feature-row-card.tsx
│   ├── definition-side-by-side.tsx
│   ├── lineage-tab.tsx
│   ├── used-by-tab.tsx
│   └── recent-values-panel.tsx
└── _logic/
    ├── group.ts                    groupBy strategies
    ├── filter.ts
    └── usage-count.ts              backlink counts from segments/campaigns
```

## Related Code Files
**Create**
- `apps/web/src/modules/feature-store/library.tsx`
- `apps/web/src/modules/feature-store/detail.tsx`
- `apps/web/src/modules/feature-store/_components/*.tsx`
- `apps/web/src/modules/feature-store/_logic/*.ts`

**Read (no modify)**
- `apps/web/src/data/catalog/features/index.ts`
- `apps/web/src/data/crawled/distributions.json`
- `apps/web/src/data/crawled/sample-players.json`
- `apps/web/src/data/catalog/segments.ts` (for backlinks)
- `apps/web/src/data/catalog/campaigns.ts` (for backlinks)

## Implementation Steps
1. Implement `_logic/group.ts` — groupBy('domain'|'tier'|'owner'|'usedInProd'|'none') returns array of `{ groupName, features[] }`.
2. Implement `_logic/filter.ts` — predicate factory for type/latency/status/owner.
3. Implement `_logic/usage-count.ts` — for a feature, count segments referencing it + campaigns referencing it (directly or transitively via their audience segment).
4. `_components/stat-strip.tsx` — reads features array, computes tier counts, "added this month" via `addedAt` field, drift count via `crawled/` future signal (placeholder for now).
5. `_components/filter-rail.tsx` — left rail with checkboxes/chips for type, latency, status, owner. State managed by parent library page.
6. `_components/group-by-control.tsx` — segmented control with 5 options.
7. `_components/feature-row-card.tsx` — card per PRD §6.2: mono name + serif italic display, type chip, latency badge (via shared component), owner avatar, sparkline, backlink counts, freshness gauge. Click navigates to detail.
8. Library page (`library.tsx`):
   - Header with stat strip
   - Entry-points strip (4 CTAs)
   - 2-column layout: filter rail + grouped+filtered list
9. `_components/definition-side-by-side.tsx`:
   - 2-column mono blocks
   - Heading: "Substrate A · expr-lang" / "Substrate B · dbt SQL over Iceberg"
   - For showcase feature, content per Hermes_Demo_Data conventions
10. `_components/recent-values-panel.tsx` — small table of UID + current value samples.
11. `_components/lineage-tab.tsx` — simple SVG: upstream table boxes → pipeline node → downstream segment/campaign chips.
12. `_components/used-by-tab.tsx` — two tables (segments using, campaigns using).
13. Detail page (`detail.tsx`):
   - Header row
   - Tab switcher (Overview/Lineage/Used By)
   - Right rail (sticky) with CTAs
14. Wire `/feature-store/:name` to detail; if feature not found → redirect to library.
15. Smoke test on `consecutive_ranked_losses_streak` — verify dual-tier badge, side-by-side definitions, histogram rendered.
16. Commit: `feat(feature-store): library + detail screens with dual-tier showcase`.

## Todo List
- [ ] Implement group / filter / usage-count logic
- [ ] Build stat-strip, filter-rail, group-by-control
- [ ] Build feature-row-card matching PRD §6.2
- [ ] Build definition-side-by-side
- [ ] Build lineage-tab + used-by-tab
- [ ] Build recent-values-panel reading sample-players.json
- [ ] Wire library.tsx + detail.tsx pages
- [ ] Verify dual-tier feature renders correctly
- [ ] Smoke test demo flow steps 2 (browse → click feature)
- [ ] Commit checkpoint

## Success Criteria
- [ ] 67 feature rows render in 01_fs_library
- [ ] Header stat strip shows tier counts: hot · warm · cold + "X added this month"
- [ ] Group-by works for all 5 strategies
- [ ] Filter rail filters compose correctly (AND between filter types)
- [ ] Detail page for `consecutive_ranked_losses_streak` shows dual-tier latency badges per PRD §6.3
- [ ] Side-by-side definition blocks visible
- [ ] Histogram with p50/p90/p99 markers from real crawled data (if T1-T4) or synthesised (if T5)
- [ ] "Use in segment" CTA navigates to `/segments/new?seedFeature=consecutive_ranked_losses_streak`
- [ ] PRD acceptance #7 met (Feature Store screens make Semantic Layer tangible)

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Backlink usage counts slow with N×M segments × features | Memoise via `useMemo` keyed by features+segments+campaigns refs; precompute at module load |
| Histogram for some T5 synth feature looks fake | Synth shapes parameterised by feature.type — variability expected; badge "synth" makes it honest |
| Lineage SVG complex for cross-table features | Keep lineage shallow: 2-3 nodes max; full graph deferred post-May-12 |
| Definition side-by-side looks lopsided if dbt SQL is much longer | Auto-wrap mono blocks with horizontal scroll; min-height parity |

## Security Considerations
- No SQL injection — definitions are static display strings.
- Recent-values panel shows anonymised UIDs only.

## Next Steps
- P-7 reuses FeaturePill swap popover content (Feature Store catalog as slide-out).
- P-10 validates step 2 of demo flow (browse Feature Store → click showcase feature → see Semantic Layer).
