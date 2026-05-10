/**
 * Suggested prompts shown on the chat landing page + chat rail empty state.
 *
 * Plan 260510-1519: replaces 5 generic prompts with 4 categorized scripted
 * prompts under 2 pills (Deep research → Board, Find features → Segment).
 * Each prompt maps to a thread fixture (thread-005..008) seeded by
 * chat-bootstrap; clicking a prompt creates a new thread and plays its
 * pre-baked T1 response, then T2/T3 advance via multi-turn-registry.
 */

export type PromptCategory = 'demo' | 'research' | 'segment';

export interface SuggestedPrompt {
  id: string;
  text: string;
  category: PromptCategory;
  /** Thread fixture id whose T1 response answers this prompt. */
  threadId: string;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  // ── Demo arc: Board → Segment → Campaign in ≤90s ─────────────────────────
  {
    id: 'cfm-arpdau-demo',
    category: 'demo',
    threadId: 'thread-demo-livops-2026',
    text: 'Why is CFM ARPDAU dipping last quarter?',
  },
  {
    id: 'pt6-gem-burn',
    category: 'research',
    threadId: 'thread-005',
    text: 'Compare PT-6 vs PT-10 gem-burn — did the hoarder branch drain stockpiles?',
  },
  {
    id: 'cfm-tier-roi',
    category: 'research',
    threadId: 'thread-006',
    text: 'How are CFM-11 year-end tiers performing on reward-cost vs retention?',
  },
  {
    id: 'cfm-loss-streak',
    category: 'segment',
    threadId: 'thread-007',
    text: 'Players hitting consecutive ranked losses — how to intervene?',
  },
  {
    id: 'pt-whale-recall',
    category: 'segment',
    threadId: 'thread-008',
    text: 'Find at-risk PT whales who haven\'t logged in this week',
  },
];

export const CATEGORY_LABEL: Record<PromptCategory, string> = {
  demo: 'Demo · Full arc',
  research: 'Deep research → Board',
  segment: 'Find features → Segment',
};
