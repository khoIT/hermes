---
phase: 6
title: "Frontend Wiring (Static → API)"
status: pending
priority: P1
effort: "4h"
dependencies: [5]
---

# Phase 06: Frontend Wiring (Static → API)

## Overview

**Hard cut from static JSON to API.** Delete the `feature-analytics-180d.json` import in `apps/web/src/data/catalog/features/index.ts`; replace with a runtime fetch to `/api/v1/features`. No env flag. No fallback banner. `pnpm dev` requires `pnpm --filter @hermes/catalog-api dev` to be running. The static JSON file itself is deleted from the bundle.

UI consumers (library, detail, segments composer, campaigns canvas) keep their existing `HermesFeature` shape — only the source changes.

## Requirements

**Functional:**
- New module `apps/web/src/data/catalog/features/_loader.ts` that fetches `/api/v1/features` once at app boot, parses with `HermesFeature` zod, populates the in-memory store.
- React hook `useFeatures()` returning `{ status: 'loading' | 'ready' | 'error', features: HermesFeature[] }`.
- Existing `getAllFeatures()`, `subscribeFeatures()`, `getFeatureByName()` keep their signatures unchanged.
- Suspense-style boot: app shell renders, Feature Store routes show a loading skeleton until features arrive.
- Error UI: if API fetch fails (5xx, network down, schema-parse error), surface a full-page error in the Feature Store routes only ("Backend unavailable — start `pnpm --filter @hermes/catalog-api dev`"). Other modules unaffected unless they read features.
- Static JSON file `feature-analytics-180d.json` and the static-array exports (`builtinFeatures`) are deleted; the catalog source files (`*.ts`) are repurposed solely for the catalog-api JSON export step (Phase 05).

**Non-functional:**
- Single fetch at boot; subsequent component reads hit the cache.
- Bundle size delta strictly negative (we're deleting ~16k lines of JSON).
- No fallback to local data — there is no second code path to maintain.

## Architecture

### Loader flow

```
On app boot (main.tsx):
  await loader.boot({ timeoutMs: 8000 })
  → fetch('/api/v1/features')
  → HermesFeature.array().parse(body)
  → store.set(features)
  → render <App />

If fetch fails:
  → store.setError(reason)
  → render <App /> anyway
  → Feature Store routes detect status==='error' and render <FeaturesUnavailable />
```

Boot is awaited because the demo flow assumes features are present from the first render. 8s timeout is generous; under that, the user sees a brief loading shell on initial load.

### useFeatures() hook

```ts
export function useFeatures(): { status: LoadStatus; features: HermesFeature[] } {
  const features = React.useSyncExternalStore(
    subscribeFeatures,
    () => getAllFeatures(),
    () => [],
  );
  const status = useFeatureLoadStatus();
  return { status, features };
}
```

Pages that need a loading skeleton call `useFeatures()`. Pages that already use `getAllFeatures()` continue to work (they'll see an empty array briefly during boot, then re-render once subscribers are notified).

### Vite proxy

Add `/api` proxy in `apps/web/vite.config.ts` pointing to `http://localhost:3001` so the dev server forwards calls without CORS pain.

### Build-time check

Add a postbuild assertion: scan `dist/` for any file that re-introduces `feature-analytics-180d`. If found, fail the build. Prevents accidental re-introduction of the static path.

## Related Code Files

**Create:**
- `apps/web/src/data/catalog/features/_loader.ts` — boot fetcher + status store
- `apps/web/src/data/catalog/features/_use-features.ts` — `useFeatures()` hook + status hook
- `apps/web/src/components/features-unavailable.tsx` — full-page error for FS routes
- `apps/web/scripts/check-no-static-features.cjs` — postbuild guard

**Modify:**
- `apps/web/src/data/catalog/features/index.ts` — remove static `analyticsByName` import + `withAnalytics()` merge; export functions only (no built-in array). The TS source files in `features/*.ts` stay (the catalog-api JSON exporter reads them).
- `apps/web/src/main.tsx` — invoke `await loader.boot()` before `<App />` render
- `apps/web/vite.config.ts` — add `/api` dev proxy
- `apps/web/src/modules/feature-store/library.tsx` — render `<FeaturesUnavailable />` when status === 'error'; render skeleton when status === 'loading'
- `apps/web/src/modules/feature-store/detail.tsx` — same loading + error treatment
- `apps/web/package.json` — add `postbuild` hook running the static-features guard

**Delete:**
- `apps/web/src/data/catalog/feature-analytics-180d.json` — removed from the web bundle. (The catalog-api may still read it at boot for T5 fallback; if so, move it to `apps/catalog-api/src/seed/feature-analytics-180d.json` first in Phase 05.)

## Implementation Steps

1. **Pre-step:** confirm Phase 05 ships first and moves `feature-analytics-180d.json` into `apps/catalog-api/src/seed/` (T5 fallback path on the server). If not done, do it as the first commit of this phase.
2. Author `_loader.ts` with fetch + zod parse + status state. Three states: `loading`, `ready`, `error`.
3. Author `_use-features.ts` exporting `useFeatures()` and `useFeatureLoadStatus()`.
4. Modify `features/index.ts`: keep `getAllFeatures()`, `subscribeFeatures()`, `getFeatureByName()`, `registerFeature()` signatures. Remove the static merge logic. The internal `cachedSnapshot` starts as `[]` and is populated by `_loader.boot()`.
5. Wire `await loader.boot()` in `main.tsx` before render. Show a brief `<BootingShell />` while waiting if needed.
6. Add Vite `/api` proxy.
7. Author `<FeaturesUnavailable />` (full-page error for FS routes only).
8. Update `library.tsx` and `detail.tsx` to handle `status === 'loading' | 'error'`.
9. Delete `apps/web/src/data/catalog/feature-analytics-180d.json` (after verifying step 1).
10. Author `check-no-static-features.cjs` postbuild guard.
11. Smoke: `pnpm --filter @hermes/catalog-api dev` + `pnpm dev` → Feature Store renders with API data.
12. Smoke: stop catalog-api → Feature Store routes show `<FeaturesUnavailable />`; other modules unaffected.
13. `grep -r 'feature-analytics-180d' apps/web/src` returns nothing.
14. `pnpm typecheck` and `pnpm build` green; postbuild guard passes.
15. Commit.

## Todo List

- [ ] Confirm Phase 05 has moved analytics JSON to catalog-api seed (or do it as first commit here)
- [ ] Build `_loader.ts` with fetch + zod parse + status state
- [ ] Build `_use-features.ts` hook
- [ ] Wire loader boot in `main.tsx`
- [ ] Modify `features/index.ts` — remove static merge, keep public API
- [ ] Add Vite `/api` dev proxy
- [ ] Build `<FeaturesUnavailable />`
- [ ] Add loading + error handling to library.tsx and detail.tsx
- [ ] Delete `feature-analytics-180d.json` from web bundle
- [ ] Author postbuild guard `check-no-static-features.cjs`
- [ ] Smoke: backend up
- [ ] Smoke: backend down (error UI shows)
- [ ] `grep` confirms zero references to deleted JSON
- [ ] `pnpm typecheck` + `pnpm build` green; guard passes
- [ ] Commit

## Success Criteria

- [ ] `pnpm --filter @hermes/catalog-api dev` + `pnpm dev` → Feature Store library and detail render with API-sourced analytics; no console errors.
- [ ] Backend stopped → Feature Store routes render `<FeaturesUnavailable />`; navigating to Segments / Campaigns / Agents still works (those pages may show "feature unknown" placeholders for predicates that reference features, but no crash).
- [ ] `apps/web/src/data/catalog/feature-analytics-180d.json` is deleted from the repo.
- [ ] `grep -r 'feature-analytics-180d' apps/web/src` returns nothing.
- [ ] Postbuild guard runs and passes.
- [ ] 13-step demo flow walks end-to-end with the backend running (no breakage in Segments/Campaigns/Agents that read features).
- [ ] `pnpm typecheck` and `pnpm build` green.

## Risk Assessment

- **No fallback path:** if catalog-api crashes in prod, Feature Store module is dark. **Mitigation:** the Phase 07 deployment guide must document that catalog-api is now a hard dependency for the Feature Store module. Future Hatchet/health-check work will add automated restart.
- **Cross-module breakage from missing features:** Segments composer reads features when rendering predicate rows. If features array is empty during boot, predicate rendering may explode. **Mitigation:** wait for `await loader.boot()` before rendering `<App />`. 8s timeout means worst-case user sees a brief shell, never an empty composer.
- **Hidden static-import consumers:** something we missed still imports the JSON directly. **Mitigation:** postbuild guard scans `dist/` for the JSON name; CI fails if it reappears.
- **Boot blocking on slow API:** initial paint delayed by up to 8s. **Mitigation:** acceptable for this phase (KISS); a Suspense + skeleton render path can land later if we measure the wait as painful.
- **Cold dev experience:** new contributors must run two processes. **Mitigation:** update README + deployment-guide.md (Phase 07) with explicit `pnpm dev:db && pnpm --filter @hermes/catalog-api dev && pnpm dev` sequence.
