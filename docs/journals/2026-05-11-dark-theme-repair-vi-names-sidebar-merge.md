# Dark Theme Repair, VI Entity Names, Sidebar Cleanup

Date: 2026-05-11
Branch: `agent_demo`
Commits: `92bc193` · `02e82ac` · `e713e95`

## What shipped

Three focused fixes on the heels of dark theme launch:

1. **Dark theme color bleed** — ~93 components had hardcoded `#fff` / cream
   backgrounds that didn't flip with `html.dark`, combined with `T.n900` now
   near-white in dark mode, rendered invisible white-on-white text inside
   still-white cards. New tokens `--hermes-shell` / `--hermes-sidebar` /
   `--hermes-topbar` (light + dark pairs) exposed as `T.shell` / `T.sidebar` /
   `T.topbar`. Dark `--hermes-surface` lifted to `#161c25` so cards read as
   elevated panels above deeper shell. Added CSS safety net (`[style*="background:#fff"]`
   attribute selector) under `html.dark` for stragglers.

2. **VI entity name localization** — Settings → Language now flips
   segment/campaign/chat-thread NAMES to Vietnamese; message bodies stay
   English (user decision: "titles only"). Architecture: id-keyed VI maps in
   `apps/web/src/i18n/entity-names.ts`; hooks + pure helpers in
   `apps/web/src/i18n/use-localized-names.ts`. No mutation of `@hermes/contracts`
   schema, no fixture changes, falls back to English `displayName` for
   ad-hoc / already-Vietnamese entities. Coverage: 15 segments, 4 campaigns, 9
   threads. Plumbed into: sidebar recent-items, welcome panels, chat-rail,
   library rows, Cmd-K modal search.

3. **Dark theme segment detail tabs + sidebar dedup** — Segment detail
   sub-tab strip had hardcoded `rgba(249,246,242,0.92)` (same bug). Migrated
   to `T.topbar` + `T.n200` border. Removed duplicate `+ Ask Hermes` SidebarItem
   at top — routes to `/chat` landing, same as bottom-right FAB. Chat section
   icon flipped from Clock to MessageSquare so it reads "ask / chat" not
   "history". One concept, one place.

3 commits, 22 high-traffic files touched (App shell, Sidebar, Topbar, theme
primitives, chat-rail × 4, welcome panels × 3, segments/campaigns/feature-store
libs, segment detail, chat input, widget shell, action cards, modal, search,
avatar menu, context menu, collapse), zero failing tests.

## Key decisions

- **Two-pronged dark theme strategy.** Token migration for hot files +
  CSS safety net for stragglers is more pragmatic than chasing every `#fff`
  to perfection. Safety net scoped with `:not([data-hermes-surface])` doesn't
  trample opt-in components like Settings page sections.

- **VI translation kept render-time, not schema-time.** id-keyed maps live
  client-side; `@hermes/contracts` stays mono-lingual, catalog-api payloads
  unchanged. Adding more languages is just another map, zero backend migration.
  Fallback to English `displayName` means demo entities don't break if they
  arrive un-mapped.

- **Sidebar dedup is polish, not a separate concern.** Removing 3 Ask Hermes
  entry points → 2 (Chat section + FAB) happened same sprint as i18n + dark
  polish because surfaces should look right AND not be cluttered.

## Verification

- Dark theme: segment detail tabs now readable; card contrast OK in shell.
- VI names: Settings toggle flips segment/campaign/thread names; English bodies
  unaffected. Ad-hoc entities fall back to English. Cmd-K search matches
  localized titles.
- Sidebar: Chat section has MessageSquare icon; no duplicate Ask Hermes entry.
- `pnpm --filter @hermes/web typecheck` — clean.
- `pnpm --filter @hermes/web build` — clean.

## Unresolved

- **CSS safety net scope.** `:not([data-hermes-surface])` guards Settings page,
  but if more opt-in components need the same guard, may need a more granular
  selector. No friction yet.

- **VI locale coverage for future entities.** When new segments/campaigns/threads
  ship English-titled from the backend, they won't have VI entries until someone
  updates the maps. Acceptable for MVP because: (1) admin-facing, (2) fallback
  to English works, (3) maps are easy to extend. Consider a "missing VI name"
  warning in dev mode if coverage becomes a bottleneck.
