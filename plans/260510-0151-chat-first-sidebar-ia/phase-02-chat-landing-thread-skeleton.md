---
phase: 2
title: "Chat landing + thread skeleton"
status: pending
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Chat landing + thread skeleton

## Overview

Build the `/` chat-landing screen (Hermes brand mark + tagline + 5 suggested prompts + input + Deep Research toggle) and the `/chat/:id` thread view shell (H1 question + assistant identity header + structured response container + bottom input). No real responses yet — Phase 3 brings widgets, Phase 4 brings content.

## Requirements

- **Functional:** suggested prompt click submits → routes to `/chat/:id` with thread state, send button submits, in-flight loading state with `Stop Hermes` button
- **Non-functional:** input max-width 820px centered, response block max-width 820px, font matches PRD §6 (15-16px line-height 1.6)

## Architecture

```
/  → ChatLandingPage
     ├ Brand mark (▦ Hermes)
     ├ Tagline
     ├ <ChatInputBox>
     │   ├ <DeepResearchToggle />
     │   └ <SendButton />
     └ <SuggestedPromptList />  (5 rows)

/chat/:id → ChatThreadPage
     ├ <ThreadHeader> (H1 question)
     └ <ThreadMessages>
         ├ <UserMessage />
         └ <AssistantResponse>          ← stub in Phase 2; widgets in Phase 3
             ├ identity header
             ├ message body container
             ├ <ResponseActionBar />    ← Phase 3
             └ <FollowUps />            ← Phase 3
     └ <ChatInputBox> (in-thread)
```

State: `useChatThread(threadId)` reads/writes localStorage `hermes.chat.thread.{id}`. New threads created via `createThread(initialMessage)` returning new id.

## Related Code Files

**Create:**
- `apps/web/src/modules/chat/landing-page.tsx`
- `apps/web/src/modules/chat/thread-page.tsx`
- `apps/web/src/components/chat/chat-input-box.tsx`
- `apps/web/src/components/chat/deep-research-toggle.tsx`
- `apps/web/src/components/chat/send-button.tsx`
- `apps/web/src/components/chat/suggested-prompt-list.tsx`
- `apps/web/src/components/chat/suggested-prompt-row.tsx`
- `apps/web/src/components/chat/thread-header.tsx`
- `apps/web/src/components/chat/user-message.tsx`
- `apps/web/src/components/chat/assistant-response.tsx` — stub container
- `apps/web/src/data/chat/suggested-prompts.ts` — 5 prompts (brainstorm §3.6)
- `apps/web/src/utils/chat-store.ts` — localStorage CRUD for threads + messages, schema version key

**Modify:**
- `apps/web/src/routes.tsx` — wire `/` to `<ChatLandingPage />`, `/chat/:id` to `<ChatThreadPage />`
- `apps/web/src/modules/home/page.tsx` — leave unchanged (will be moved in Phase 10)

## Implementation Steps

1. Create `chat-store.ts` with types `Conversation`, `ChatMessage`, `ResponseSection` matching PRD §7.1; `createThread`, `appendMessage`, `getThread`, `listThreads`, `deleteThread`
2. Create `suggested-prompts.ts` exporting 5 prompts (Hermes-flavored — see brainstorm §3.6)
3. Build `chat-input-box.tsx` (textarea, send disabled until non-empty, ⌘+Enter submits, Esc clears focus)
4. Build `deep-research-toggle.tsx` (visual toggle only, persists to localStorage `hermes.chat.deepResearch`)
5. Build `send-button.tsx` (circular dark, white arrow, disabled state)
6. Build `suggested-prompt-row.tsx` (curved arrow icon `↗` + prompt text, full-width clickable row)
7. Build `suggested-prompt-list.tsx` (renders 5 rows from `suggested-prompts.ts`)
8. Build `landing-page.tsx`: centered logo + tagline + ChatInputBox + SuggestedPromptList; on submit, create new thread + navigate to `/chat/:id`
9. Build `thread-header.tsx` (H1 question text from first user message)
10. Build `user-message.tsx` (right-aligned, sub-heading style per PRD §4.6)
11. Build `assistant-response.tsx` STUB — renders identity header (`▦ Hermes`) + body slot (empty in Phase 2)
12. Build `thread-page.tsx`: reads thread by id, renders ThreadHeader + messages + ChatInputBox at bottom; submitting appends to thread
13. Wire routing; verify clicking a suggested prompt → submits → lands on `/chat/:id` with one user message rendered
14. `pnpm typecheck && pnpm --filter @hermes/web build`

## Success Criteria

- [ ] `/` shows brand mark, tagline, input, Deep Research toggle, 5 suggested prompts
- [ ] Clicking suggested prompt creates a thread, navigates to `/chat/:id`, renders user message
- [ ] In-thread input submits new user message; appears in same thread
- [ ] Refresh on `/chat/:id` rehydrates thread from localStorage
- [ ] Deep Research toggle state persists across reload
- [ ] No assistant response rendered yet (waits for Phase 3+4)
- [ ] `pnpm typecheck` clean

## Risk Assessment

- **Race on createThread + navigate:** ensure thread id written to localStorage before `useNavigate` fires.
- **Empty thread title display:** sidebar All Chats reads thread title from first user message; must handle "still typing" gracefully.
- **Schema versioning:** lock to `hermes.chat.v1.*` keys; bump migration in chat-store if shape changes.
