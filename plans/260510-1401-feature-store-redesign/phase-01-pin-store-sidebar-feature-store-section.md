---
phase: 1
title: "Pin store + sidebar Feature Store section"
status: completed
priority: P1
effort: "0.4d"
dependencies: []
---

# Phase 1: Pin store + sidebar Feature Store section

## Overview

Build the localStorage-backed pin store and the new custom Feature Store sidebar section with four stacked surfaces: Register CTA, Pinned, You viewed, New this month. **Must land first** — page rail (Phase 2) and pin button on row card (Phase 3) both consume APIs from this phase.

## Requirements

- **Functional:**
  - Register CTA renders persistently below section header → navigates `/feature-store/new`
  - Pinned section renders only when pins exist; max 5 entries; click navigates `/feature-store/:name`
  - You viewed renders only when `getRecent('features')` non-empty; max 5
  - New this month renders only when there are features with `addedAt` in current calendar month; max 5; sort desc by `addedAt`
  - Pin store survives page reload; emits subscribe events so sidebar updates within one render tick after `togglePin()`
  - Stale pin IDs (renamed/deleted features) silently filtered against current catalog at render time
- **Non-functional:**
  - Section height under typical state (3 pinned + 5 viewed + 5 new + Register + 3 subheaders = ~14 rows) does not push other sidebar sections below the fold on a 1080p viewport when expanded
  - Subscribe pattern matches existing `subscribeFeatures` / `useSyncExternalStore` convention — no new state library

## Architecture

```
apps/web/src/utils/pinned-features-store.ts
  ┌─ Public API ──────────────────────────────────┐
  │ getPinned(): string[]                         │
  │ togglePin(name: string): boolean // returns now-pinned │
  │ subscribePinned(cb: () => void): () => void   │
  │ MAX_PINS = 5                                  │
  └───────────────────────────────────────────────┘
  Storage: localStorage key `hermes.feature-store.pinned` → JSON string[]
  Eviction: FIFO when MAX_PINS exceeded (drop oldest)

apps/web/src/components/sidebar/sidebar-feature-store-section.tsx
  ┌─ Layout ──────────────────────────────────────┐
  │ <SidebarSection id="features" ...>            │
  │   <SidebarItem icon=Plus label="Register feature" to="/feature-store/new" indent primary /> │
  │   {pinned.length > 0 && <Subheader>PINNED</Subheader>}     │
  │   {pinned.map(name => <SidebarItem indent ... />)}         │
  │   {viewed.length > 0 && <Subheader>YOU VIEWED</Subheader>} │
  │   {viewed.map(item => <SidebarItem indent ... />)}         │
  │   {newThisMonth.length > 0 && <Subheader>NEW THIS MONTH</Subheader>} │
  │   {newThisMonth.map(...)}                                  │
  │ </SidebarSection>                                          │
  └────────────────────────────────────────────────────────────┘

  Reads:
   - useSyncExternalStore(subscribePinned, getPinned, getPinned)
   - getRecent('features') + hermes:recent-changed event listener
   - useSyncExternalStore(subscribeFeatures, getAllFeatures, () => allFeatures) — filtered to current month
```

## Related Code Files

- **Create:**
  - `apps/web/src/utils/pinned-features-store.ts`
  - `apps/web/src/components/sidebar/sidebar-feature-store-section.tsx`
  - `apps/web/src/components/sidebar/sidebar-subheader.tsx` — small uppercase mono 9.5px label component (reused for PINNED / YOU VIEWED / NEW THIS MONTH)
- **Modify:**
  - `apps/web/src/components/sidebar/sidebar.tsx` — replace the existing Feature Store `<SidebarSection>...<RecentItems module="features" />...</SidebarSection>` block with `<SidebarFeatureStoreSection collapsed={collapsed} />`

## Implementation Steps

1. Build `pinned-features-store.ts`:
   - Module-level `let pinned: string[]` initialized via `JSON.parse(localStorage.getItem('hermes.feature-store.pinned') ?? '[]')` (try/catch → empty)
   - `Set<() => void>` of subscribers
   - `togglePin(name)`: if present remove, else prepend; truncate to MAX_PINS (5); persist; notify subscribers
   - `subscribePinned(cb)`: returns unsubscribe
   - `getPinned()`: returns current array (defensive copy)
2. Build `sidebar-subheader.tsx` — purely presentational. Mono uppercase label, 9.5px, color `T.n400`, padding `8px 16px 4px 32px` (matches sidebar item indent).
3. Build `sidebar-feature-store-section.tsx`:
   - Hooks: `usePinned()` (useSyncExternalStore), `useRecentFeatures()` (existing pattern via window event), `useSyncExternalStore` over features catalog
   - Compute `newThisMonth = features.filter(f => isAddedThisMonth(f.addedAt)).sort(byAddedAtDesc).slice(0, 5)`
   - Filter pinned IDs against current catalog (drop missing): `pinned.map(name => features.find(f => f.name === name)).filter(Boolean).slice(0, 5)`
   - Render layout per Architecture above
   - Keep section identity `id="features"` so sidebar collapse state is preserved
4. Modify `sidebar.tsx`:
   - Import `SidebarFeatureStoreSection`
   - Replace the existing `<SidebarSection id="features" ...><RecentItems module="features" .../></SidebarSection>` (lines 79-91 of current file) with `<SidebarFeatureStoreSection collapsed={collapsed} />`
   - Note: `SidebarFeatureStoreSection` itself wraps `<SidebarSection>`, so the replacement is a direct swap
5. Manual smoke test:
   - Reload `/feature-store` → sidebar shows Register CTA only (no pins, no view history yet)
   - Click any feature → navigate to detail → return → sidebar shows "YOU VIEWED" with that feature
   - Open detail of feature with `addedAt` this month → already in NEW THIS MONTH list (no action needed)
   - Pin will be tested in Phase 3 (button on row card); for now, manually `togglePin('cpi_7d')` in DevTools console → PINNED section appears immediately
6. Run `pnpm --filter @hermes/web typecheck` → must pass

## Success Criteria

- [ ] `pinned-features-store.ts` exports `getPinned`, `togglePin`, `subscribePinned`, `MAX_PINS`
- [ ] localStorage key `hermes.feature-store.pinned` round-trips correctly
- [ ] Sidebar Feature Store section renders Register CTA + (conditional) Pinned/Viewed/New subsections
- [ ] Subheaders use shared `<SidebarSubheader>` component
- [ ] Stale pin IDs auto-filtered (verified by hand-editing localStorage to `["nonexistent_feature"]` → no row rendered)
- [ ] Manual `togglePin` in DevTools updates sidebar within one render tick (no full reload)
- [ ] When section is collapsed (chevron up), all subsections hide as expected
- [ ] When sidebar is icon-rail collapsed (60px), section still navigates correctly
- [ ] `pnpm --filter @hermes/web typecheck` clean

## Risk Assessment

- **Risk:** Pin store concurrent edits across tabs cause stale display.
  - Mitigation: storage event listener could sync; not in scope for May 12 demo (single-tab usage). Document in code comment.
- **Risk:** New this month list flickers when catalog hot-reloads after register flow.
  - Mitigation: existing `subscribeFeatures` pattern handles this — `useSyncExternalStore` re-renders deterministically.
- **Risk:** `RecentItems` component is removed for features module but other modules still use it.
  - Mitigation: don't delete `RecentItems` — keep it for chats/boards/segments/campaigns. Only `sidebar.tsx` swap is needed.
- **Risk:** Section height pushes Boards/Playbooks/etc. below the fold when fully populated.
  - Mitigation: each subsection renders only when non-empty; max 5 each; section header itself is collapsible. Acceptable trade.
