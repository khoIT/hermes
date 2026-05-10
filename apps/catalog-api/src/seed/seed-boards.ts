/**
 * Sample boards seed — 2 demo boards, each modelled as a "detailed artifacts
 * analysis" tied to a LiveOps 2026 scenario from
 * `design-reference/Hermes/uploads/liveops_2026_campaign_requirements.md`.
 *
 *   bd-livops-loss-streak-rescue  → CFM · Loss-Streak Rescue (segment
 *     seg-cfm-loss-streak-non-paying-2026-0508-a3f9 + campaign cmp-cfm-407)
 *   bd-livops-whale-at-risk-yend  → CFM · Whale-At-Risk · Year-End 2026
 *     (segment seg-cfm-whale-at-risk)
 *
 * Idempotent: ON CONFLICT DO NOTHING on the boards row + a card-count guard
 * skips card inserts when the board already has its sample cards.
 */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

type Db = NodePgDatabase<typeof schema>;

interface SampleBoard {
  id: string;
  name: string;
  /** Phase 4: reverse-link to originating chat thread. */
  sourceThreadId?: string;
  sections: { id: string; title: string; isExpanded: boolean }[];
  cards: { sectionId: string; widget: Record<string, unknown> }[];
}

const SECTIONS_DEFAULT = [
  { id: 'pinned', title: 'Pinned', isExpanded: true },
];

const SECTIONS_TWO = [
  { id: 'audience', title: 'Audience',     isExpanded: true },
  { id: 'lift',     title: 'Lift & Tests', isExpanded: true },
];

const LOSS_STREAK_BOARD: SampleBoard = {
  id: 'bd-livops-loss-streak-rescue',
  name: 'CFM · Loss-Streak Rescue · 2026 LiveOps Analysis',
  sections: SECTIONS_TWO,
  cards: [
    {
      sectionId: 'audience',
      widget: {
        type: 'line',
        id: 'w-loss-streak-audience-30d',
        title: 'Loss-Streak segment · audience size (30d)',
        xLabel: 'Date',
        yLabel: 'Eligible players',
        series: [{
          name: 'seg-cfm-loss-streak-non-paying',
          color: '#f05a22',
          data: [
            { x: '2026-04-10', y: 4120 }, { x: '2026-04-13', y: 4380 },
            { x: '2026-04-16', y: 4760 }, { x: '2026-04-19', y: 5210 },
            { x: '2026-04-22', y: 5680 }, { x: '2026-04-25', y: 6240 },
            { x: '2026-04-28', y: 6810 }, { x: '2026-05-01', y: 7340 },
            { x: '2026-05-04', y: 7920 }, { x: '2026-05-07', y: 8480 },
            { x: '2026-05-10', y: 8960 },
          ],
        }],
      },
    },
    {
      sectionId: 'audience',
      widget: {
        type: 'bar',
        id: 'w-loss-streak-iam-funnel',
        title: 'IAM rescue funnel · cmp-cfm-407',
        funnel: true,
        bars: [
          { label: 'Eligible',           value: 8960 },
          { label: 'IAM Sent',           value: 8412 },
          { label: 'Opened',             value: 5230 },
          { label: 'Clicked',            value: 2814 },
          { label: 'Logged back in 24h', value: 2106 },
        ],
      },
    },
    {
      sectionId: 'lift',
      widget: {
        type: 'table',
        id: 'w-loss-streak-variants',
        title: 'Variant performance · cmp-cfm-407 (last 14d)',
        columns: [
          { key: 'variant', label: 'Variant', format: 'string' },
          { key: 'audience', label: 'Audience', format: 'number' },
          { key: 'd1',       label: 'D1 retention', format: 'percent', highlightTop: true },
          { key: 'd7',       label: 'D7 retention', format: 'percent', highlightTop: true },
          { key: 'arpdauLift', label: 'ARPDAU lift', format: 'percent', highlightTop: true },
        ],
        rows: [
          { variant: 'A · 100 CF coin grant',  audience: 2986, d1: 0.612, d7: 0.284, arpdauLift: 0.087 },
          { variant: 'B · Free skin trial',    audience: 2974, d1: 0.598, d7: 0.301, arpdauLift: 0.052 },
          { variant: 'Control · No-IAM',       audience: 3000, d1: 0.541, d7: 0.197, arpdauLift: 0.000 },
        ],
      },
    },
    {
      sectionId: 'lift',
      widget: {
        type: 'line',
        id: 'w-loss-streak-retention-curve',
        title: '28d retention curve · Treatment vs Control',
        xLabel: 'Days since rescue',
        yLabel: 'Retention',
        series: [
          {
            name: 'Treatment (A+B pooled)',
            color: '#f05a22',
            data: [
              { x: 1, y: 0.605 }, { x: 3, y: 0.482 }, { x: 7, y: 0.292 },
              { x: 14, y: 0.218 }, { x: 21, y: 0.184 }, { x: 28, y: 0.162 },
            ],
          },
          {
            name: 'Control',
            color: '#7a7a7a',
            data: [
              { x: 1, y: 0.541 }, { x: 3, y: 0.398 }, { x: 7, y: 0.197 },
              { x: 14, y: 0.131 }, { x: 21, y: 0.098 }, { x: 28, y: 0.078 },
            ],
          },
        ],
      },
    },
  ],
};

const WHALE_AT_RISK_BOARD: SampleBoard = {
  id: 'bd-livops-whale-at-risk-yend',
  name: 'CFM · Whale-At-Risk · Year-End 2026 Analysis',
  sections: SECTIONS_DEFAULT,
  cards: [
    {
      sectionId: 'pinned',
      widget: {
        type: 'bar',
        id: 'w-whale-spend-tier',
        title: 'Whale segment · spend-tier composition',
        bars: [
          { label: 'Free',  value:  120 },
          { label: 'Low',   value:  340 },
          { label: 'Mid',   value:  680 },
          { label: 'High',  value: 1240 },
          { label: 'Whale', value: 2860, color: '#f05a22' },
        ],
      },
    },
    {
      sectionId: 'pinned',
      widget: {
        type: 'line',
        id: 'w-whale-daily-spend',
        title: 'Whales · rolling 30d ARPDAU (USD)',
        xLabel: 'Date',
        yLabel: 'ARPDAU $',
        series: [{
          name: 'Whale ARPDAU',
          color: '#f05a22',
          data: [
            { x: '2026-04-10', y: 38.2 }, { x: '2026-04-15', y: 39.8 },
            { x: '2026-04-20', y: 36.4 }, { x: '2026-04-25', y: 33.1 },
            { x: '2026-04-30', y: 29.7 }, { x: '2026-05-05', y: 26.2 },
            { x: '2026-05-10', y: 22.8 },
          ],
        }],
      },
    },
    {
      sectionId: 'pinned',
      widget: {
        type: 'table',
        id: 'w-whale-dormancy-drivers',
        title: 'Top dormancy drivers · whales (last 14d)',
        columns: [
          { key: 'driver',       label: 'Driver',          format: 'string' },
          { key: 'incidence',    label: 'Incidence',       format: 'percent', highlightTop: true },
          { key: 'dormancyLift', label: 'Δ dormancy 7d',   format: 'percent', highlightTop: true },
          { key: 'rescueable',   label: 'Reachable push',  format: 'percent' },
        ],
        rows: [
          { driver: 'Consecutive ranked-loss streak ≥4', incidence: 0.412, dormancyLift: 0.184, rescueable: 0.92 },
          { driver: 'Pass progress stalled >5 days',     incidence: 0.318, dormancyLift: 0.127, rescueable: 0.88 },
          { driver: 'No new content tried in 7d',        incidence: 0.286, dormancyLift: 0.094, rescueable: 0.95 },
          { driver: 'Friend churn (>2 buddies left)',    incidence: 0.142, dormancyLift: 0.071, rescueable: 0.71 },
        ],
      },
    },
  ],
};

// Phase 4: demo arc board — pre-seeded so "Pin to LiveOps 2026" from the demo
// thread finds an existing board rather than creating a stub. sourceThreadId
// links back to thread-demo-livops-2026 for the ContinueInChatPill.
const LIVOPS_2026_BOARD: SampleBoard = {
  id: 'bd-livops-2026-demo',
  name: 'LiveOps 2026',
  sourceThreadId: 'thread-demo-livops-2026',
  sections: SECTIONS_DEFAULT,
  cards: [],
};

const SAMPLE_BOARDS: SampleBoard[] = [LOSS_STREAK_BOARD, WHALE_AT_RISK_BOARD, LIVOPS_2026_BOARD];

export async function seedSampleBoards(db: Db): Promise<void> {
  const ownerName = 'system · livops-2026';
  const now = new Date();

  for (const sample of SAMPLE_BOARDS) {
    // Insert board row (idempotent) — keeps prior seed runs safe.
    // Note: sourceThreadId lives on board_cards (per-card), not boards table,
    // so we don't forward sample.sourceThreadId here; it is set automatically
    // when the chat pin action posts a card with sourceThreadId in the payload.
    await db.insert(schema.boards).values({
      id: sample.id,
      name: sample.name,
      sections: sample.sections as never,
      owner: ownerName,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();

    // Skip card inserts if this board already has cards (re-run safety —
    // we don't have a stable card id, so we guard by count to avoid dupes).
    const existing = await db.select({ id: schema.boardCards.id })
      .from(schema.boardCards)
      .where(eq(schema.boardCards.boardId, sample.id));
    if (existing.length > 0) continue;

    for (const c of sample.cards) {
      await db.insert(schema.boardCards).values({
        boardId: sample.id,
        sectionId: c.sectionId,
        widget: c.widget as never,
        sourceThreadId: null,
        pinnedAt: now,
      });
    }
  }
}
