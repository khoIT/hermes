# Code review — Welcome inbox promotion + 2 agent-first flows

**Plan:** `260511-1122-welcome-inbox-promote-plus-flows`
**Branch:** `agent_demo`
**Scope:** 9 modified + 2 new files (~1,470 LOC of fixture, ~117 LOC of plumbing).

## Score: 8.5 / 10
## Critical (P0) issues: 0

Ship recommendation: **APPROVE with optional polish**. All 6 registration sites
are symmetric; types are sound; typecheck clean; fixtures internally
consistent; canonical arc untouched. Findings below are all cosmetic /
low-severity polish.

---

## Verification matrix (all green)

| Check | Result |
|---|---|
| All 6 plumbing sites updated symmetrically (chat-bootstrap, multi-turn-registry, chat-rail dispatch, thread-page T1 + reset-anchor map, restart-demo-chip, entity-names) | YES — both new ids appear in all 6 sites |
| Stale `cardHeadline`/`cardBody` references left over from i18n rename | NO — `grep -rn "cardHeadline\|cardBody" apps/web/src` returns 0 hits |
| `TranslationKey` widening on `NoticedCard` safe | YES — `TranslationKey = keyof typeof en`; `useT(key: TranslationKey)` validated at call site |
| Section types in new fixtures all valid per `ResponseSection.type` union | YES — only uses `tool_call`, `narrative`, `h2`, `widget`, `provenance`, `insights`, `action_card_segment`, `action_card_campaign`, `soft_hint` |
| `pnpm --filter @hermes/web typecheck` | clean (0 new errors) |
| `BOOTSTRAP_VERSION` bumped to force re-seed | YES (`v12-260510-2330` → `v13-260511-1145`) |
| Slim seed structure matches auto-play expectation (1 user msg, id matches DEMO_FIRST_USER_MSG_ID) | YES — `m-agent-b-u1`, `m-agent-c-u1` correctly mapped |
| HIDDEN_THREADS not pushed to recents (no sidebar pollution) | YES — separate branch in `bootstrap-chat-threads.ts` |
| Restart chip handles both new threads | YES — `Record<string, Conversation>` includes both ids |
| Registry keys namespaced by threadId (no cross-thread collision on "Build a rescue segment") | YES — `makeKey(threadId, userText)` |
| Canonical analyst arc (`thread-demo-livops-2026`) and arc A (`thread-demo-agent-livops-2026`) untouched | YES — diffs only add adjacent map entries |
| EN/VI i18n parity | YES — 6 new keys mirrored in both, `vi` is `Record<keyof typeof en, string>` so compile catches drift |
| Vietnamese phrasing concise per existing convention | YES |
| Security / injection surface | N/A — pure scripted fixtures, no user-supplied content paths into rendering |

---

## Findings

### Medium

**M1 · Inbox card A `detectedAt` label drift vs the demo's reference "today"**
File: `apps/web/src/modules/welcome/hermes-noticed-panel.tsx:29`
Card A is labeled `'06:14 today'`. Underlying thread `createdAt` is
`2026-05-10T06:14`. The current run-date (per CLAUDE.md context) is
`2026-05-11`. Cards B + C anchor to a "today = 2026-05-11" frame
(`yesterday 14:20`, `2d ago, ongoing`), so card A should read `yesterday 06:14`
for consistency.

This is a static string; no logic-driven date arithmetic, so the demo will
not break. But it makes the three cards look authored against different
reference dates, which weakens the "continuous monitoring" narrative the
promotion is meant to convey.

Recommendation: change card A `detectedAt` to `'yesterday 06:14'` — OR
adjust B/C to be one day fresher if "today = 2026-05-10" is the canonical
demo anchor (arc A's createdAt is the existing anchor for the canonical
demo, so this option preserves prior intent). Pick one frame and apply
consistently.

### Low

**L1 · Arc B treatment/holdout count drift between T3 forecast and T4 actuals (silent)**
File: `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts`
T3 (line ~311) splits `30,560 treatment · 7,640 holdout`.
T4 (line ~366) reports `n=30,540 (treat) + 7,632 (hold)` — 20 + 8 = 28 UIDs
silently dropped.
Arc A's analogous step explains the gap (line ~360: "3 churned independently
before assignment"). Arc B does not. Tiny cosmetic — the demo narrator never
calls attention to the deltas. Suggested fix: add half a sentence to the T4
narrative ("Treatment n=30,540 vs assigned 30,560: 20 churned independently
in the 24h before tutorial re-trigger landed"), or revert T4 numbers to
match T3 exactly. Both options take <1 min.

**L2 · Whale recall T3 uses `type: 'realtime'` for a manual concierge campaign**
File: `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts:324`
The fixture comment acknowledges: `'manual' not in type enum; using 'realtime'
with mechanic detail in description`. Faithful to current
`ActionCardCampaignPayload.type` enum (`realtime | scheduled | onetime`), but
when a viewer reads the action card pill `realtime` next to "Manual
concierge outreach (50/week cadence)" the labels conflict. This is a
demo-clarity issue, not a correctness issue.
Options (no change required for ship):
- Use `'scheduled'` (50/week cadence reads as scheduled rollout) and update
  description.
- Extend the enum to `'manual'` in a separate follow-up (out of scope).

**L3 · Arc B T1 narrative inline `\n\n` literal vs single-paragraph rendering**
File: `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts:190`
Filter narrative uses `'…\n…\n\n…'` inline. Whether the narrative renderer
collapses `\n` to spaces or honors them as paragraph breaks depends on
`assistant-response` markdown handling — should double-check the rendered
output looks the same as arc A's T2 multi-filter intro (which is a single
flowing paragraph). If the renderer respects newlines, no action; if not,
fold to single paragraph.
Not blocking — easy visual QA at runtime.

**L4 · `_catalog.json` change touched but out of scope**
File: `apps/web/public/_catalog.json` — large auto-generated diff (240KB).
Likely re-emitted by a tooling step. Not part of the plan; flag for the
implementer to confirm intentional vs accidental commit. If unintentional,
`git checkout HEAD -- apps/web/public/_catalog.json` before commit.

### Positive observations

- **Symmetric edits everywhere.** Both new thread ids appear in all 6
  registration sites (chat-bootstrap THREADS/HIDDEN, multi-turn-registry,
  chat-rail T1 dispatch, thread-page DEMO_THREAD_T1 + DEMO_FIRST_USER_MSG_ID,
  restart-demo-chip DEMO_FIXTURES, entity-names THREAD_TITLES_VI). No miss.
- **Type widening (`'…cardHeadline'` literal → `TranslationKey`) is the
  right call.** Locking to literal union with 3 cards forces a type churn
  every time a new card is added. `TranslationKey` covers the full surface
  with no loss of typesafety (still rejected at compile if you pass a
  non-key string).
- **Tool-call function name rotation is good.** Arc A: 9 unique fns. Arc B:
  12 unique fns. Arc C: 12 unique fns, all distinct from A's campaign+retro
  set (`manual_outreach_capacity`, `select_appreciation_drop`,
  `forecast_recovery`, `causal_attribution`, `pre_outreach_recovery_check`,
  `lookalike_scope`, `cohort_intersect`, `dormancy_signal`,
  `spend_distribution`, `load_campaign_log`). Overlap with A (`query_trino`,
  `load_experiment`, `shapley_attribution`, `estimate_cost`, `split_holdout`,
  `query_features`) is intentional realism — same data lake, same primitives.
- **Numerical anchors hold within each thread.**
  - Arc B: blended D7 22.4% / FB D7 18.2% / gap 4.2pp ✓; segment 38,200 ✓;
    forecast +6pp, actual +8.1pp = (26.3 − 18.2) ✓; D14 +5.2pp ✓.
  - Arc C: 1,240 top-1% / 472 dormant (38% recall from 52%) ✓; 89 UIDs / $38k
    MRR ✓; $1,602 cost = $18×89 ✓; +38pp lift = +30pp outreach + +8pp
    endogenous ✓.
- **T4 retro tone differentiation works.** Arc A: forecast exceeded + Shapley
  re-attribution surprise. Arc B: forecast exceeded + D14/D21 carryover
  surprise (new metric, not just re-attribution). Arc C: forecast partially
  confirmed + endogenous recovery (honest deconfounding) — meaningfully
  distinct shapes per the plan.
- **`useLayoutEffect` reset guard (`lastResetIdRef`) handles thread switches
  cleanly.** Switching from arc A → B → C in /chat/:id will re-anchor per id,
  not lock to a stale ref. Verified at `thread-page.tsx:91-105`.
- **HIDDEN_THREADS architecture preserved.** All three agent-first threads
  resolve at `/chat/<id>` but stay out of sidebar Recents — surface is the
  inbox row, as intended.
- **Bootstrap version bump pattern correct.** `v13-260511-1145` will force
  one-time wipe of non-canonical thread ids on first boot, then seed all
  five demo threads. Behavior matches prior version bumps. The new
  canonical-ids set correctly includes both new agent thread ids via
  `HIDDEN_THREADS.map(t => t.id)`.
- **Restart chip works for all 5 demo threads** (canonical + 4 agent-first
  variants). Delete + putThread fixture + navigate. Idempotent.

---

## Concurrency / race / async considerations

- **`delayedAppend` cancellation:** `pendingTimerRef.current` is cleared on
  rapid clicks and rail close. Confirmed for both chat-rail and thread-page.
  Adding two new auto-play targets does not introduce a new race vector —
  same `setTimeout` + `clearTimeout` pattern, no shared mutable state across
  the 4 demo threads.
- **`bootstrapped` flag at module scope:** still single-shot per page load.
  HMR or hot-reload during dev may surface stale state if the user mutates
  threads via UI then triggers a version bump, but that's a dev-only edge
  case the implementer is already aware of (see restart-demo-chip doc
  comment).

## Security / OWASP

- All fixture strings are static. No user-supplied content reaches `dangerouslySetInnerHTML`
  or eval-like paths in this diff. Narrative `**bold**` markdown is rendered by the existing
  assistant-response component (already trusted path). No new injection
  surface introduced.
- No PII, secrets, stack traces, or backend identifiers leak. Numerical
  anchors are fabricated demo data.

## Backwards compatibility

- i18n keys `welcome.hermesNoticed.cardHeadline` / `cardBody` are **removed
  outright** (renamed to `cardArpdauHeadline` / `cardArpdauBody`). Confirmed
  no callers remain (`grep -rn "cardHeadline\|cardBody" apps/web/src` = 0).
  Since `vi` is `Record<keyof typeof en, …>`, compile catches any drift —
  safe to break.
- `NoticedCard.headlineKey` type widened from literal to `TranslationKey`.
  Public type? Inspected: `NoticedCard` is `interface NoticedCard {…}` declared
  locally and not exported. Internal-only — safe.

---

## Unresolved questions

1. Is "today" anchored to 2026-05-10 (canonical demo createdAt) or 2026-05-11
   (current build date)? Determines whether the fix for M1 is on card A or
   on cards B + C.
2. Was the `_catalog.json` diff (240KB) intentional, or is it a stale local
   artifact from another tool? If not intentional, revert before commit.
3. Is the deliberate `realtime` enum re-use for arc C's manual concierge
   campaign acceptable for the demo, or should the enum be extended in a
   follow-up plan?

---

**Status:** DONE_WITH_CONCERNS
**Summary:** 8.5/10 · 0 P0 · ship-ready with optional cosmetic polish (M1 timestamp label, L1 silent count drift, L2 campaign-type mislabel, L4 _catalog.json scope check).
