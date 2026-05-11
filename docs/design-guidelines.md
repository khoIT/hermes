# Design Guidelines

**Reference:** Bedrock + Hermes PRD §4 visual language.

**Authority:** `apps/web/src/theme.tsx` (single source of truth) + `apps/web/src/theme-tokens.css` (light/dark var values).

**Last updated:** 2026-05-11 — dark-theme repair + VI localization round.

---

## 1. Design Tokens

### 1.1 Colors

Tokens are exported from the `T` object in `apps/web/src/theme.tsx` and resolve to CSS custom properties defined in `theme-tokens.css` (separate values under `:root` and `html.dark`). Toggling `html.dark` (via `ThemeProvider`) flips every consumer instantly.

#### Neutral scale

| Token   | Light  | Dark    | Typical usage |
|---------|--------|---------|---------------|
| `T.n50` | #fafafa | #11161d | Page background under cards |
| `T.n100`| #f5f5f5 | #161c25 | Hover states, soft fills |
| `T.n200`| #e5e5e5 | #232a36 | Borders, dividers |
| `T.n300`| #d4d4d4 | #2f3845 | Secondary borders |
| `T.n400`| #a3a3a3 | #525c6b | Placeholders, muted icons |
| `T.n500`| #737373 | #8a93a3 | Secondary text, captions |
| `T.n600`| #525252 | #b1bac8 | Body labels |
| `T.n700`| #404040 | #cdd4df | Primary text |
| `T.n800`| #262626 | #e2e7ee | Headings |
| `T.n900`| #171717 | #f0f3f8 | Strongest body text |
| `T.n950`| #0a0a0a | #f8fafc | Display headlines |

> The dark scale is a hand-tuned inversion, not a programmatic flip. `T.n50` lands on a slight cool-blue (#11161d) so cards read warmer; `T.n900`–`T.n950` skew warm-white so text doesn't glare.

#### Brand + status

| Token              | Light    | Dark     | Usage |
|--------------------|----------|----------|-------|
| `T.brand`          | #f05a22  | #f06b3a  | VNG Games orange · primary actions |
| `T.brandHover`     | #f54a00  | #f7894e  | Hover variant of brand |
| `T.brandSoft`      | #fff7ed  | #2a1810  | Brand-tinted backgrounds (active rows) |
| `T.brandBorder`    | #fed7aa  | #5a3422  | Brand-tinted borders |
| `T.red500/600`     | #ef4444 / #dc2626 | #ef4444 / #f87171 | Destructive, errors |
| `T.redSoft`        | #fef2f2  | #2a1416  | Soft red backgrounds (danger zone) |
| `T.blue500/600`    | #3b82f6 / #3f8dff | #60a5fa / #6ea3ff | Info |
| `T.blueSoft`       | #eff6ff  | #14213a  | Info-tinted backgrounds |
| `T.green600`       | #059669  | #34d399  | Positive (deltas, lift) |
| `T.greenSoft`      | #ecfdf5  | #0f2a20  | Connected/active chips |
| `T.amber500`       | #f59e0b  | #fbbf24  | Drift/anomaly warning |
| `T.amberSoft`      | #fffbeb  | #2a1f0a  | Drift warning backgrounds |
| `T.purple500`      | #a855f7  | #c084fc  | ML / agentic surfaces |
| `T.purpleSoft`     | #faf5ff  | #1f1530  | Soft ML chips |

#### Surfaces (use these instead of `'#fff'`)

| Token          | Light                       | Dark                         | Where to use |
|----------------|-----------------------------|------------------------------|--------------|
| `T.surface`        | #ffffff                  | #161c25                      | Cards, popovers, modals — anything that was previously `'#fff'` |
| `T.surfaceMuted`   | #fafaf6                  | #11161d                      | Soft inset panels |
| `T.surfaceSubtle`  | #f9fafb                  | #1b232f                      | Subtle deeper inset (table stripes, code blocks) |
| `T.shell`          | #efe9e0 (cream gap)      | #07090c                      | Outer App shell — visible in the gap around `<main>` |
| `T.sidebar`        | #f9f6f2                  | #0d1117                      | Sidebar background, chat-rail aside |
| `T.topbar`         | rgba(249,246,242,0.92)   | rgba(13,17,23,0.92)          | Sticky top chrome, sub-tab strips (with `backdrop-filter: blur(8px)`) |

In dark mode the layered hierarchy is: `T.shell` (deepest) → `T.sidebar` → `T.surface` (lifted card). Honor that order or panels read flat.

**No hex escapes in component code.** All colors via `T` tokens. No inline `'#fff'` / `'#000'` / `'rgba(...)'` for surfaces or text — those don't flip with `html.dark`.

#### Dark-mode opt-in for inline-styled cards

For panels that hardcode `'#fff'` and can't be migrated this round, opt them in by adding `data-hermes-surface="card"` (or `"muted"`) on the outermost element. CSS in `theme-tokens.css` flips just those nodes when `html.dark` engages:

```tsx
<section
  data-hermes-surface="card"
  style={{ background: '#fff', /* ... */ }}
>
```

A broader CSS safety net under `html.dark` catches lingering `style="background:#fff"` / `rgb(255, 255, 255)` patterns automatically — but it's a backstop, not a substitute for migrating to `T.surface`.

#### Charting

`CHART` (also in `theme.tsx`) is an 8-color stable-order palette for series colouring:

```ts
['#f05a22', '#3f8dff', '#059669', '#f59e0b', '#a855f7', '#ef4444', '#0891b2', '#db2777']
```

These are kept identical in light and dark — they're data ink, not chrome.

### 1.2 Typography

**Source:** `apps/web/src/theme.tsx` (`T.fonts`)

| Token | Font | Usage | Weight | Size |
|-------|------|-------|--------|------|
| `fSans` | Inter | Body text, UI labels | 400–700 | 12–18px |
| `fDisp` | League Gothic | Headlines, big numbers (feature counts, audience size) | 700 | 24–48px |
| `fMono` | Geist Mono | Technical surfaces: feature IDs, predicate code, substrate names, UIDs | 400–500 | 12–14px |

**Typography hierarchy:**

- **Display (Headlines):** `T.fDisp` · sentence case (not ALL CAPS) · used sparingly on feature titles + metric headers
- **Body (Prose):** `T.fSans` · standard weight (400) · line-height 1.6
- **Label (Form, Button):** `T.fSans` · medium weight (500) · 12–14px
- **Technical (IDs, Code):** `T.fMono` · 12–14px · used for SegmentID, TriggerID, feature names, predicate blocks
- **Intent (Serif accent):** *Serif italic* (design intent only — not a code token; achieved via `<em>` or accent text) · used on segment/campaign intent statements

**Example:**

```tsx
// Headline
<h1 className="font-[family-var(--font-disp)] text-2xl">
  Weapon Owners
</h1>

// Body
<p className="font-[family-var(--font-sans)]">
  Players with lifetime weapon purchases ≥ 10.
</p>

// Technical
<code className="font-[family-var(--font-mono)] text-sm">
  seg-cfm-ss1-weapon-owners-2026
</code>
```

### 1.3 Spacing

**Source:** `apps/web/src/theme.tsx` (`T.spacing`)

| Token | Value | Usage |
|-------|-------|-------|
| `4` | 4px | Micro spacing (icon gaps, tight padding) |
| `8` | 8px | Small gaps (button padding, tight component gutters) |
| `12` | 12px | Medium gaps (form field spacing, list item gutters) |
| `16` | 16px | Standard gap (card padding, section gutters) |
| `20` | 20px | Large padding (modal body, content cards) |
| `24` | 24px | Extra-large padding (top-level section gutters) |
| `32` | 32px | Huge gap (between major sections) |

**Card padding:** `20–24px` (standard).
**Dense row spacing:** `16px` (tight list items, audience band).
**Component gaps:** `12–16px` (internal component gutters).

### 1.4 Radius

**Source:** `apps/web/src/theme.tsx` (`T.radii`)

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Small components (inputs, chips) |
| `md` | 8px | Standard (cards, modals) |
| `lg` | 12px | Large (prominent cards, hero elements) |

### 1.5 Shadows

**Source:** `apps/web/src/theme.tsx` (`T.shadows`)

| Token | Style | Usage |
|-------|-------|-------|
| `sm` | Small blur, low elevation | Hover states on cards |
| `md` | Medium blur, mid elevation | Default card shadow |
| `lg` | Large blur, high elevation | Modals, dropdowns |

---

## 2. Component Patterns

### 2.1 Latency Badge (v2 Substrate Relabel)

**PM-facing labels** (library, detail header, picker, predicate row, filter rail):
- `Realtime` — `<1s` · green tone (#dcfce7 / #15803d)
- `Batch warm` — `<1h` · amber tone (#fef3c7 / #b45309)
- `Batch cold` — `<1d` · slate tone (#e2e8f0 / #475569)

**Engineer-facing labels** (handoff modals, lineage detail rows, definition pane):
- `Substrate A · Apollo TEE + Temporal` — verbatim, never paraphrased
- `Substrate B · Hatchet + Trino + Iceberg` — verbatim, never paraphrased

**Single source of truth:** `apps/web/src/components/_logic/latency-labels.ts`.

**Implementation:** `apps/web/src/components/latency-badge.tsx`

```tsx
<LatencyBadge tier="<1s" substrate="A" />   // → "Realtime"
<LatencyBadge tier="<1h" substrate="B" />   // → "Batch warm"
<LatencyBadge tiers={[                     // dual-tier pair
  { tier: '<1s', substrate: 'A' },
  { tier: '<1h', substrate: 'B' },
]} />
```

**Substrate dot:** preserved as ambient cue — orange dot for A, neutral for B.

### 2.1b Game Color Tokens (v2 Phase 3+)

Per-game tint table for chip clusters, library group headers, predicate row pills.

| Game | Code | bg / fg / border                       | Full name           |
|------|------|----------------------------------------|---------------------|
| cfm  | CFM  | #fee2e2 / #991b1b / #fecaca            | CrossFire Mobile    |
| pt   | PT   | #dbeafe / #1e40af / #bfdbfe            | PlayTogether        |
| nth  | NTH  | #dcfce7 / #166534 / #bbf7d0            | Ngọa Thiên Hạ       |
| tf   | TF   | #fef3c7 / #92400e / #fde68a            | Thiết Hỏa            |
| cos  | COS  | #fce7f3 / #9d174d / #fbcfe8            | Cộng Đồng           |
| ptg  | PG   | #e0e7ff / #3730a3 / #c7d2fe            | PlayTogether-G      |

**Platform tint:** deep-red brand color `#f05a22` / `#fff` — used for the
`Platform · Propensity` chip across the library, detail, and segment surfaces.

**Token file:** `apps/web/src/components/_logic/game-colors.ts`.

### 2.2 Feature Pill

**Contains:** Feature name + latency badge + optional synthesised indicator.

**Implementation:** `modules/_shared/components/FeaturePill.tsx`

```tsx
<FeaturePill 
  name="consecutive_ranked_losses_streak"
  latency="<1h"
  tier="B"
  synthesised={false}
/>
```

**Visual:** Gray background, mono font, inline badge.

### 2.3 Opportunity Card

**Regions (top to bottom):**
1. **Intent block** · Serif italic headline · "Loss Streak Mitigation" (AI intent summary)
2. **Window & Confidence** · Bold text · "Next 72 hours · 78% confident"
3. **Evidence panel** · Sparkline chart · "Recent match losses detected in last 3 days"
4. **Proposed action block** · "Send 'back-to-winning' push + discount offer"
5. **Why-now collapsed** · Inline explanation (expandable)
6. **Approve / Edit / Dismiss** · Three action buttons (bottom)

**Implementation:** `modules/_shared/components/OpportunityCard.tsx`

### 2.4 Predicate Composer

**Pattern:** AND-of-OR groups.

**Visual layout:**
- Each group = OR'd predicates in a gray box
- Between groups = AND connector
- Within group = OR label + row separator
- Optional AND NOT exclusions

**Implementation:** `modules/_shared/components/PredicateComposer.tsx`

### 2.5 Threshold Playground

**Contains:**
- Slider for threshold adjustment (left)
- Live audience band (sticky, right) showing updated count
- Feature pill (top) showing which feature is being adjusted
- Optional histogram chart below

**Implementation:** `modules/_shared/components/ThresholdPlayground.tsx`

**Key interaction:** As user drags slider, audience count updates in real-time (reads `data/crawled/audience-counts.json` in v1).

### 2.6 Audience Band (Sticky)

**Shows:**
- Current segment name or temp ID
- Live audience count
- Recent activity indicator

**Fixed position:** Docks to top of segment canvas during scroll.

**Implementation:** `modules/_shared/components/AudienceBand.tsx`

### 2.7 Handoff Modal

**Two substrates, conditional rendering:**

**Segment Handoff (Substrate B):**
```
Name: Weapon Owners (Strict Tier 1)
SegmentID: seg-cfm-ss1-weapon-owners-2026
Predicate: [weapon_lifetime_count ≥ 10] AND [last_session_weapon_class = "sword"]
Audience: 245,000 users
Substrate: Hatchet (batch compile) → Trino (segment query) → Iceberg (storage)
Refresh: Every 24h
```

**Campaign Handoff (Substrate A + B hybrid):**
```
Trigger: event_match_end
Real-time predicate: [consecutive_ranked_losses_streak ≥ 5]
SegmentID: seg-cfm-ss1-weapon-owners-2026 (audience filter)
TriggerID: trg-cfm-pass-stuck (event evaluator)
Substrate A: Apollo TEE (sub-second) → Temporal (workflow spawn)
Substrate B: Hatchet (batch compile) → Iceberg (audience lookup)
Launch: Immediate
```

**Mono blocks:** All IDs, predicate code, substrate names in `T.fMono`.

**Implementation:** `modules/segments/handoff-modal.tsx`, `modules/campaigns/handoff-modal.tsx`

---

## 3. Visual Language Philosophy

### 3.1 Data-Tool Register (Segments)

Inspired by Mode, Looker, Hex, Mixpanel. Emphasizes:
- **Audience count as primary feedback** — Live updates as you adjust predicates
- **Compact predicate builder** — AND-of-OR composition, inline thresholds
- **Minimal prose** — No marketing narrative, just data relationships

### 3.2 Activation Register (Campaigns)

Different from Segments. Emphasizes:
- **Intent first** · "What are you trying to achieve?" · Serif italic
- **Hypothesis clarity** · "We expect a 5% lift in retention"
- **Action design** · payload, timing, channel, goal, exit condition
- **Journey orchestration** · step nodes, branching, holdout logic

### 3.3 Intent via Serif Italic

**Usage:** Segment/campaign intent statements, AI-generated recommendations, goal descriptions.

**Why:** Signals *human intent* (non-technical, strategic) vs technical surface (predicate, IDs).

**Not a design token** — achieved via CSS `font-style: italic` + accent font (if available).

**Example:**
```tsx
<h2 className="italic font-serif text-lg text-gray-800">
  Loss Streak Mitigation
</h2>
```

---

## 4. Color Usage

| Context | Token | Reasoning |
|---------|-------|-----------|
| Active campaign, segment save button, accent highlight | `T.brand` | VNG Games brand; signals action |
| Feature card hover, form input focus | `T.n100` | Subtle elevation |
| Anomaly badge, drift warning, threshold outlier | `T.amber500` / `T.amberSoft` | High visibility for unexpected data |
| Disabled button, placeholder text | `T.n400` | De-emphasized, not actionable |
| Success state, checkmark | `T.green600` | Positive feedback |
| Error message, destructive action | `T.red600` | Alert state |
| Card / popover / modal background | `T.surface` | Flips light↔dark with theme |
| Page chrome (shell / sidebar / topbar) | `T.shell` / `T.sidebar` / `T.topbar` | Layered chrome surfaces |

**No new hex values.** All colors from `T`. Inline `'#fff'` / `'#000'` for chrome is forbidden — see §1.1 dark-mode opt-in.

---

## 5. Responsive Breakpoints

**Target resolutions:** 1280px (common ultrawide) · 1920px (projector demo).

**Tested components:**
- OpportunityCard (6 regions stack responsively)
- Segment canvas (sticky audience band, threshold playground adapt)
- Feature detail (dual-target defs side-by-side on wide screens)

**Pattern:** Desktop-first; mobile optimizations deferred.

---

## 6. Animation & Motion

**Smooth transitions (default):** Property changes over 150–200ms.

**Snappy transitions:** Button clicks, tab switches (50–100ms).

**Example:**
```css
transition: all 150ms var(--transition-smooth);
```

**Pulse animation:** Opportunity card "why-now" expandable section; pulse on expansion.

---

## 7. Accessibility

**Contrast:** All text meets WCAG AA (4.5:1 for body, 3:1 for large text).

**Keyboard navigation:** All interactive elements focusable via Tab; modals trap focus.

**Semantic HTML:** Proper heading hierarchy, `<label>` elements for inputs, `role` attributes where needed.

**Screen readers:** `aria-label` on icon buttons, `aria-describedby` on complex regions.

---

## 8. Component Reference

| Component | File | Purpose |
|-----------|------|---------|
| OpportunityCard | `modules/_shared/components/OpportunityCard.tsx` | AI recommendation card (6 regions) |
| AgentBadge | `modules/_shared/components/AgentBadge.tsx` | Small agent identifier + icon |
| AgentAttribution | `modules/_shared/components/AgentAttribution.tsx` | "Drafted by Authoring Agent" line |
| LatencyBadge | `modules/_shared/components/LatencyBadge.tsx` | Tier classification pill |
| FeaturePill | `modules/_shared/components/FeaturePill.tsx` | Feature name + badge |
| PredicateComposer | `modules/_shared/components/PredicateComposer.tsx` | AND-of-OR builder |
| ThresholdPlayground | `modules/_shared/components/ThresholdPlayground.tsx` | Slider + live audience |
| AudienceBand | `modules/_shared/components/AudienceBand.tsx` | Sticky audience overview |
| HandoffModal | `modules/*/handoff-modal.tsx` | Substrate A/B handoff confirmation |
| Histogram | `modules/_shared/components/Histogram.tsx` | 28-bin distribution chart |
| Sparkline | `modules/_shared/components/Sparkline.tsx` | Compact trend line |
| WorkingStatusBlock | `components/chat/sections/working-status-block.tsx` | Deep-research section: "Working.." / "Done" header + intent (gated by DeepResearchToggle) |
| TaskProgressPanel | `components/chat/sections/task-progress-panel.tsx` | Deep-research section: step-by-step task checklist (gated by DeepResearchToggle) |
| SubagentPanel | `components/chat/sections/subagent-panel.tsx` | Deep-research section: subagent roster + provenance (gated by DeepResearchToggle) |
| SubagentList | `components/chat/sections/subagent-list.tsx` | Subagent roster child (renders agent avatars + names + metadata) |

---

## 9. Visual Fidelity Rules

1. **Token-only colors** — No inline hex values in component code.
2. **Consistent spacing** — Use `T.spacing` tokens; no magic numbers.
3. **No new fonts** — Only `T.fSans`, `T.fDisp`, `T.fMono` + serif italic intent.
4. **No avatars** — Agent represented by badge + name text only.
5. **Mono for IDs** — All SegmentID, TriggerID, feature names in `T.fMono`.
6. **Intent via italic** · Segment/campaign goals, AI summaries via serif italic or em.

See `docs/demo-known-limitations.md` for known visual polish gaps.
