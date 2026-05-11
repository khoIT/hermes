---
phase: 3
title: "Empty-state polish"
status: pending
priority: P2
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Empty-state polish

## Overview

Wire the rail's empty state to show top 3 recent threads + 4 categorized scripted prompts under 2 pills. Add compact mode to `<SuggestedPromptList>` so it renders narrower in the rail vs. full-page landing.

## Requirements

**Functional:**
- Rail empty state shows two sections below brand mark + tagline:
  - **RECENT THREADS** — top 3 threads from existing `recent-items-store` (chats category). Click → opens thread inline in rail.
  - **TRY ONE OF THESE** — 4 prompts grouped under 2 pills: `Deep research → Board` (2 entries) and `Find features → Segment` (2 entries). Click → starts new thread inline in rail.
- `<SuggestedPromptList>` accepts `variant: 'landing' | 'rail'` prop. Rail variant: single column, smaller padding, tighter font sizes.
- Categorization on landing page also updates (the 4 new prompts replace existing 5 — already done in P2).

**Non-functional:**
- Recent threads list: max 3 items, 28px row height, truncate long titles.
- Pill headers: small caps, T.n500, 11px font, letter-spacing 0.04em.
- Compact pill in rail: padding 8px 12px (vs 12px 16px landing); font 13px (vs 14px landing).
- Empty state body scrolls if total exceeds rail body height.

## Architecture

```
<ChatRailEmpty>
  <BrandMark />
  <Tagline>Ask about this page or your data</Tagline>
  <RecentThreadsSection />     ← NEW (P3)
  <ScriptedPromptsSection />   ← NEW (P3)
</ChatRailEmpty>
```

**RecentThreadsSection:**
```tsx
function RecentThreadsSection() {
  const items = listRecent('chats').slice(0, 3);
  if (items.length === 0) return null;
  return (
    <section>
      <h6 className="rail-header">RECENT THREADS</h6>
      {items.map(item => (
        <button key={item.id} onClick={() => openThreadInRail(item.id)}>
          <Icon icon={MessageCircle} size={14} />
          <span>{truncate(item.title, 40)}</span>
        </button>
      ))}
    </section>
  );
}
```

**ScriptedPromptsSection:**
```tsx
function ScriptedPromptsSection() {
  const research = SUGGESTED_PROMPTS.filter(p => p.category === 'research');
  const segment = SUGGESTED_PROMPTS.filter(p => p.category === 'segment');
  return (
    <section>
      <h6 className="rail-header">TRY ONE OF THESE</h6>
      <CategoryPill label="Deep research → Board" prompts={research} />
      <CategoryPill label="Find features → Segment" prompts={segment} />
    </section>
  );
}
```

`<SuggestedPromptList variant="rail">` is the underlying renderer used inside `<CategoryPill>`.

## Related Code Files

**Modify:**
- `apps/web/src/components/chat-rail/chat-rail-empty.tsx` — fill stub sections from P1 with `<RecentThreadsSection>` + `<ScriptedPromptsSection>`.
- `apps/web/src/components/chat/suggested-prompt-list.tsx` — add `variant` prop; rail variant single-column compact.

**Optional new (if helpful):**
- `apps/web/src/components/chat-rail/recent-threads-section.tsx`
- `apps/web/src/components/chat-rail/scripted-prompts-section.tsx`

## Implementation Steps

1. **Update SuggestedPromptList** — add `variant?: 'landing' | 'rail'` prop. Adjust padding, font, layout per variant.
2. **RecentThreadsSection** — read top 3 from `recent-items-store` (chats); render compact rows; click opens thread in rail.
3. **ScriptedPromptsSection** — read `SUGGESTED_PROMPTS`, group by `category`, render 2 pill labels with 2 prompts each. Click → calls existing `handlePromptPick` (creates thread, sets activeThreadId in rail).
4. **Wire into ChatRailEmpty** — replace P1 stubs with the two sections.
5. **Verify** — navigate to a detail page, open rail, see brand mark + tagline + recent threads (3) + scripted prompts (4). Click a prompt → thread T1 renders inline. Click `+ New` from header → empty state returns. Click a recent thread → that thread renders inline.

## Success Criteria

- [ ] Rail empty state shows 4 sections: brand mark, tagline, recent threads, scripted prompts
- [ ] Recent threads section shows top 3 threads, click opens inline in rail
- [ ] Scripted prompts section shows 4 prompts under 2 categorized pills
- [ ] Click a prompt → thread T1 renders inline in rail (using existing P2 wiring)
- [ ] `<SuggestedPromptList variant="rail">` renders single-column compact
- [ ] `<SuggestedPromptList variant="landing">` unchanged from current behavior
- [ ] No regression on chat landing page `/`
- [ ] `pnpm typecheck` passes for `apps/web`

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Recent threads list exceeds rail body height | `overflow-y: auto` on body; cap recent at 3 items hard. |
| recent-items-store entries reference deleted threads (e.g. thread-003) | Filter out items whose threadId doesn't resolve in conversation store. |
| Variant prop on SuggestedPromptList causes style branching mess | Keep both variants in same file; CSS-in-JS conditional on variant; <40 LOC delta. |
| Scripted prompts section CTAs collide with input box submit | Section sits in rail body (scrollable); input is in fixed bottom slot. No collision. |
| User clicks scripted prompt while a thread is already active | Active state shows compact thread, not empty state — empty-state CTAs aren't visible. No collision. |
| Empty rail at 1280px feels cramped | Rail width 400px tunable; this phase doesn't change widths. |
