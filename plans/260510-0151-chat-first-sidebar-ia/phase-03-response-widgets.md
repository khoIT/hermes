---
phase: 3
title: "Response widgets"
status: pending
priority: P1
effort: "1.5d"
dependencies: [2]
---

# Phase 3: Response widgets

## Overview

Build the structured assistant response — narrative + H2 sections + 4 widget types (table, line chart, bar/funnel chart, scatter chart) + bulleted insights + action bar (Download/Copy/Slack/Credits/Thumbs) + follow-ups. Widgets get `Pin to board` button (toast-stub until Phase 6) and `Data ▾` dropdown (Data table / Export CSV — toast).

## Requirements

- **Functional:** AssistantResponse renders all section types from `ResponseSection[]`, widgets are pin-able, follow-ups submit on click, action bar fires correct actions/toasts
- **Non-functional:** widgets render <100ms, charts use Recharts (already a project dep — verify), tables max 6 rows visible (overflow scroll), color-coded top performers per PRD §6

## Architecture

```
<AssistantResponse>
  <ResponseHeader>           ← ▦ Hermes label
  <NarrativePara />          ← markdown paragraph
  <ResponseSection>          ← H2 heading + body
    <Widget>
      <WidgetHeader>         ← title + Pin button + Data dropdown
      <WidgetBody>
        <DataTable | LineChart | BarFunnelChart | ScatterChart />
  <BulletedInsights />
  <ResponseActionBar>        ← Download / Copy / Slack / Credits / Thumbs
<FollowUps>                  ← 4-5 follow-up rows
```

Widget data shape matches PRD §7.1 `DataWidget`. Pin-to-board fires `pinToBoard(widgetId)` callback (toast-stub until Phase 6).

## Related Code Files

**Create:**
- `apps/web/src/components/chat/assistant-response.tsx` — replace Phase 2 stub with full impl
- `apps/web/src/components/chat/response-header.tsx`
- `apps/web/src/components/chat/narrative-para.tsx` — markdown w/ inline `code` + bold
- `apps/web/src/components/chat/response-section.tsx` — H2 + body slot
- `apps/web/src/components/chat/widgets/widget-shell.tsx` — title + pin + data dropdown
- `apps/web/src/components/chat/widgets/data-table.tsx`
- `apps/web/src/components/chat/widgets/line-chart.tsx` — Recharts LineChart
- `apps/web/src/components/chat/widgets/bar-funnel-chart.tsx` — Recharts BarChart
- `apps/web/src/components/chat/widgets/scatter-chart.tsx` — Recharts ScatterChart
- `apps/web/src/components/chat/widgets/widget.tsx` — discriminated-union renderer
- `apps/web/src/components/chat/bulleted-insights.tsx`
- `apps/web/src/components/chat/response-action-bar.tsx` — 6 icons + click handlers (toast)
- `apps/web/src/components/chat/follow-ups.tsx` + `follow-up-row.tsx`
- `apps/web/src/components/ui/toast.tsx` — if not already present
- `apps/web/src/data/chat/response-types.ts` — Zod schemas matching PRD §7.1 (mirror in `packages/contracts` if shared)

**Modify:**
- `apps/web/src/components/chat/thread-page.tsx` — render assistant responses inline now
- `apps/web/src/data/chat/suggested-prompts.ts` — already in place from Phase 2

## Implementation Steps

1. Verify Recharts is installed; if not, `pnpm --filter @hermes/web add recharts`
2. Define `response-types.ts` Zod schemas (`DataWidget`, `ResponseSection`, `ChartSeries`, etc.) — mirror PRD §7.1
3. Build `widget-shell.tsx` with title bar (left) + pin button + Data ▾ dropdown (right)
4. Build `data-table.tsx` — multi-column with currency/percentage formatters; light-green bg on top-performer cell per column (compute max in component)
5. Build `line-chart.tsx`, `bar-funnel-chart.tsx`, `scatter-chart.tsx` — Recharts wrappers, color-coded series per PRD §6
6. Build `widget.tsx` discriminated-union renderer (`type === 'table'` → DataTable, etc.)
7. Build `narrative-para.tsx` — supports `**bold**`, inline `` `code` `` (mono font + light gray bg)
8. Build `response-section.tsx` — H2 + body
9. Build `bulleted-insights.tsx`
10. Build `response-action-bar.tsx` — 6 icons (Download, Copy, Slack, ⚡credits, 👍, 👎). Click stubs: Download → toast "Demo only"; Copy → real `navigator.clipboard.writeText()`; Slack → toast; Thumbs → local state + toast
11. Build `follow-up-row.tsx` (curved arrow + sentence) and `follow-ups.tsx` (4-5 rows)
12. Build full `assistant-response.tsx` rendering all sections from `message.sections[]` + action bar + follow-ups
13. Build `toast.tsx` if missing — fixed bottom-right, 4000ms auto-dismiss
14. Test render with hand-written sample fixture (full Use Case 1 from PRD §5)
15. `pnpm typecheck && pnpm --filter @hermes/web build`

## Success Criteria

- [ ] Test fixture (CPI/LTV) renders narrative + table + scatter chart + action bar + 5 follow-ups
- [ ] Top-performer cells in data table have light-green background
- [ ] Pin button fires toast "Coming soon" (Phase 6 wires real)
- [ ] Data ▾ dropdown shows Data table + Export CSV options (both toast)
- [ ] Copy icon copies response text to clipboard
- [ ] Follow-up click submits as next user message in same thread
- [ ] Charts render at 820px max-width, responsive down to 600px
- [ ] `pnpm typecheck` clean

## Risk Assessment

- **Recharts bundle size:** ~85kb gzipped. Acceptable for May 12; revisit in Phase 3 perf optimization.
- **Markdown rendering:** keep MINIMAL — bold + inline code only. Don't pull in `react-markdown` for this; hand-roll a simple regex-based renderer.
- **Color-coding consistency:** scatter chart series colors must match PRD §6 (Facebook=green, Admob=purple, Moloco=orange, Vungle=blue/teal). Define palette constants in `widgets/colors.ts`.
- **Empty widgets:** if rows[] is empty, render "No data" placeholder, not blank box.
