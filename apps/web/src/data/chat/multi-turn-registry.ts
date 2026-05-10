/**
 * multi-turn-registry — scripted (threadId, lastUserText) → next assistant
 * message lookup. Drives the 3-turn guided flows (thread-005..008).
 *
 * Keys are full sentences taken from the prior turn's followUps so registry
 * collisions with free-text input are extremely unlikely.
 */
import type { ChatMessage } from '../../utils/chat-store';
import { thread005Turns } from './threads/thread-005-pt6-gem-burn-research';
import { thread006Turns } from './threads/thread-006-cfm-tier-roi-research';
import { thread007Turns } from './threads/thread-007-cfm-loss-streak-multi';
import { thread008Turns } from './threads/thread-008-pt-whale-recall';
import { threadDemoLivops2026Turns } from './threads/thread-demo-livops-2026';


export interface RegistryEntry {
  assistantMsg: ChatMessage;
  isTerminal?: boolean;
}

const ENTRIES: Array<[string, string, RegistryEntry]> = [
  // ─── thread-005: PT-6 gem-burn research → PT Liveops Board ─────────────
  ['thread-005', 'Drill into hoarder segment',  { assistantMsg: thread005Turns.drillHoarder }],
  ['thread-005', 'Compare F2P vs hoarder',      { assistantMsg: thread005Turns.f2pVsHoarder }],
  ['thread-005', 'Show drop-table parity audit', { assistantMsg: thread005Turns.parity }],
  ['thread-005', 'Pin to PT Liveops Board',     { assistantMsg: thread005Turns.pin, isTerminal: true }],

  // ─── thread-006: CFM-11 tier ROI research → CFM Liveops Board ──────────
  ['thread-006', 'Compare to last year',        { assistantMsg: thread006Turns.lastYear }],
  ['thread-006', 'Show tier population shift',  { assistantMsg: thread006Turns.population }],
  ['thread-006', 'Drill into NRU tier',         { assistantMsg: thread006Turns.nru }],
  ['thread-006', 'Pin to CFM Liveops Board',    { assistantMsg: thread006Turns.pin, isTerminal: true }],

  // ─── thread-007: CFM loss-streak features → segment ────────────────────
  ['thread-007', 'Show me the features',                    { assistantMsg: thread007Turns.features }],
  ['thread-007', 'Filter by non-paying tenure ≥ 7d',        { assistantMsg: thread007Turns.tenure }],
  ['thread-007', 'Past A/B results',                        { assistantMsg: thread007Turns.ab }],
  ['thread-007', 'Build segment from these features',       { assistantMsg: thread007Turns.build, isTerminal: true }],

  // ─── thread-008: PT whale-recall features → segment ────────────────────
  ['thread-008', 'Show me the features',         { assistantMsg: thread008Turns.features }],
  ['thread-008', 'Tighten cohort',               { assistantMsg: thread008Turns.tighten }],
  ['thread-008', 'Compare to active whales',     { assistantMsg: thread008Turns.active }],
  ['thread-008', 'Build at-risk whale segment',  { assistantMsg: thread008Turns.build, isTerminal: true }],

  // ─── thread-demo-livops-2026: full arc Board → Segment → Campaign ────────
  // Canonical path
  ['thread-demo-livops-2026', "Who's most at risk right now?",  { assistantMsg: threadDemoLivops2026Turns.atRisk }],
  ['thread-demo-livops-2026', 'Build a rescue intervention',    { assistantMsg: threadDemoLivops2026Turns.campaign }],
  // T1 alt branches (each ends with a chip back to canonical)
  ['thread-demo-livops-2026', 'Compare to Q1 2026',             { assistantMsg: threadDemoLivops2026Turns.q1Compare }],
  ['thread-demo-livops-2026', 'Show competitor benchmarks',     { assistantMsg: threadDemoLivops2026Turns.competitorBench }],
  // T2 alt branches (each ends with a chip back to canonical)
  ['thread-demo-livops-2026', 'Tighten to non-paying only',     { assistantMsg: threadDemoLivops2026Turns.tightenNonPaying }],
  ['thread-demo-livops-2026', 'Show 7d retention impact',       { assistantMsg: threadDemoLivops2026Turns.show7dRetention }],
  // T3 alt branches (terminal — campaign is configured)
  ['thread-demo-livops-2026', 'Tweak holdout %',                { assistantMsg: threadDemoLivops2026Turns.tweakHoldout, isTerminal: true }],
  ['thread-demo-livops-2026', 'Add a control variant',          { assistantMsg: threadDemoLivops2026Turns.addControl, isTerminal: true }],
];

const REGISTRY = new Map<string, RegistryEntry>(
  ENTRIES.map(([threadId, userText, entry]) => [makeKey(threadId, userText), entry])
);

function makeKey(threadId: string, userText: string): string {
  return `${threadId}::${userText.trim()}`;
}

export function lookupNextTurn(threadId: string, userText: string): RegistryEntry | null {
  return REGISTRY.get(makeKey(threadId, userText)) ?? null;
}

/**
 * Generic fallback response for off-script free-text input.
 * Returns a short narrative + 2 follow-up chips that map to real scripted paths.
 */
export function genericFallbackResponse(_text: string): Omit<import('../../utils/chat-store').ChatMessage, 'id' | 'createdAt'> {
  return {
    role: 'assistant',
    sections: [
      {
        type: 'narrative',
        payload: { text: "Let me explore that angle — here's what stands out for your game's live-ops right now." },
      },
    ],
    followUps: ['Show me at-risk segments', 'Compare to last week'],
  };
}
