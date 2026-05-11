---
date: 2026-05-11
author: khoitn
topic: design-convention
tags: [chat, agent-first, threads, design]
---

# Agent-first thread seed-message convention

## Decision

The slim `Conversation.messages[0]` of every agent-first chat thread MUST be a **contextual investigative question** grounded in the detection's subject — not a generic placeholder.

## Bad (legacy — fixed 2026-05-11)

All 3 agent-first threads originally seeded with the same placeholder:

```ts
{ role: 'user', text: 'Show me what you found.' }
```

T1 then auto-played the agent's analysis. The conversation read as the agent dumping findings on an empty prompt — the user looked passive, the agent felt presumptive.

## Good (current convention)

The user is staged as a PM who has clicked the inbox card and is asking the agent to dig into the specific anomaly. The agent's T1 response reads as a real analyst handoff:

| Thread | User-seed text |
|---|---|
| `thread-demo-agent-livops-2026` | "What's behind the CFM ARPDAU drop?" |
| `thread-demo-agent-d7-fb-cohort-2026` | "Why is D7 down on the FB May cohort?" |
| `thread-demo-agent-whale-recall-2026` | "Why has top-1% recall fallen this month?" |

## Why this matters

1. **Demo readability.** Stakeholders skim the first user message before the agent's response. A real question primes them for the analysis that follows. A placeholder reads as scaffolding.
2. **Conversation logic.** The thread is a chat, not a report. A chat opens with a question.
3. **Voice consistency.** Matches the canonical analyst threads (`thread-001..008`, `thread-demo-livops-2026`) which all open with a real user question.
4. **Localization.** Vietnamese seed translations (when authored) will read naturally — generic placeholders translate poorly.

## Rule for future agent-first threads

When creating a new `thread-demo-agent-<subject>-<year>.ts`:

1. Write the user seed as a **single question the user-as-PM would ask after clicking the inbox card**.
2. Use the same subject vocabulary as the inbox card headline (ARPDAU / D7 / recall / etc.).
3. Keep it short (under 60 chars).
4. Phrase as investigation, not as command ("Why is X happening?" not "Fix X").
5. Update the thread file's doc-comment to point back to this journal.

## Non-rules (intentionally flexible)

- Question style ("Why…?" vs "What's behind…?" vs "What's driving…?") — pick what reads natural for the subject.
- Capitalization / punctuation — match the analyst-thread style (sentence case, single question mark).
- Length — 30-60 chars typical; longer if the subject genuinely needs framing.

## Related changes

- `apps/web/src/data/chat/threads/thread-demo-agent-livops-2026.ts:464` — seed updated
- `apps/web/src/data/chat/threads/thread-demo-agent-d7-fb-cohort-2026.ts:506` — seed updated
- `apps/web/src/data/chat/threads/thread-demo-agent-whale-recall-2026.ts:467` — seed updated
- Template thread doc-comment updated to reference this convention

## Notes

- This is a **content** convention, not a code contract. There is no compile-time enforcement. New thread authors should grep this journal during onboarding.
- The slim-seed pattern itself (one user message, T1 auto-plays on entry) is unchanged.
- A richer "deep thinking" trace (working-status block + task progress + named sub-agents) is in scope for a separate feature, brainstorm next.
