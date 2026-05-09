# Design Guidelines

**Reference:** Bedrock + Hermes PRD §4 visual language.

**Authority:** `apps/web/src/theme.tsx` (single source of truth).

---

## 1. Design Tokens

### 1.1 Colors

**Source:** `apps/web/src/theme.tsx` (`T.colors`)

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#f05a22` | VNG Games deep red · active campaigns · accent elements |
| `gray-50` | `#f9fafb` | Lightest background |
| `gray-100` | `#f3f4f6` | Card backgrounds, hover states |
| `gray-200` | `#e5e7eb` | Borders, dividers |
| `gray-300` | `#d1d5db` | Secondary borders |
| `gray-400` | `#9ca3af` | Disabled text, placeholders |
| `gray-500` | `#6b7280` | Secondary text |
| `gray-600` | `#4b5563` | Body text, labels |
| `gray-700` | `#374151` | Primary text |
| `gray-800` | `#1f2937` | Headings, dark text |
| `gray-900` | `#111827` | Darkest text |
| `success` | `#10b981` | Positive indicators |
| `warning` | `#f59e0b` | Caution states |
| `error` | `#ef4444` | Destructive actions, errors |
| `anomaly` | `var(--anomaly)` | Amber (#fbbf24) · drift warnings, anomalies in feature data |

**No hex escapes in component code.** All colors via `T.colors` or CSS custom properties. No `#abc123` inline.

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

| Context | Color | Reasoning |
|---------|-------|-----------|
| Active campaign, segment save button, accent highlight | `#f05a22` (primary) | VNG Games brand; signals action |
| Feature card hover, form input focus | `#f3f4f6` (gray-100) | Subtle elevation |
| Anomaly badge, drift warning, threshold outlier | `var(--anomaly)` (amber) | High visibility for unexpected data |
| Disabled button, placeholder text | `#9ca3af` (gray-400) | De-emphasized, not actionable |
| Success state, checkmark | `#10b981` (success) | Positive feedback |
| Error message, destructive action | `#ef4444` (error) | Alert state |

**No new hex values.** All colors from token map.

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

---

## 9. Visual Fidelity Rules

1. **Token-only colors** — No inline hex values in component code.
2. **Consistent spacing** — Use `T.spacing` tokens; no magic numbers.
3. **No new fonts** — Only `T.fSans`, `T.fDisp`, `T.fMono` + serif italic intent.
4. **No avatars** — Agent represented by badge + name text only.
5. **Mono for IDs** — All SegmentID, TriggerID, feature names in `T.fMono`.
6. **Intent via italic** · Segment/campaign goals, AI summaries via serif italic or em.

See `docs/demo-known-limitations.md` for known visual polish gaps.
