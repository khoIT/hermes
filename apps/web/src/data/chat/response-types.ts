/**
 * Chat response section types — concrete schemas for the discriminated union
 * referenced by ChatMessage.sections[]. PRD §7.1 alignment.
 *
 * v1: plain TypeScript types (no Zod). Phase 5 may layer validation if action
 * cards need round-tripping to backend.
 */

export type ChannelName = 'Facebook' | 'Admob' | 'Moloco' | 'Vungle' | string;

export interface DataTableColumn {
  key: string;
  label: string;
  /** Optional formatter hint. */
  format?: 'currency' | 'percent' | 'number' | 'string';
  /** Highlight per-column max as the top performer (light-green bg). */
  highlightTop?: boolean;
}

export interface DataTableWidget {
  type: 'table';
  id: string;
  title: string;
  columns: DataTableColumn[];
  rows: Record<string, string | number>[];
}

export interface ChartSeries {
  name: string;
  /** Stable color override (defaults to channel palette). */
  color?: string;
  data: { x: string | number; y: number }[];
}

export interface LineChartWidget {
  type: 'line';
  id: string;
  title: string;
  xLabel?: string;
  yLabel?: string;
  series: ChartSeries[];
}

export interface BarFunnelWidget {
  type: 'bar';
  id: string;
  title: string;
  xLabel?: string;
  yLabel?: string;
  /** Single series of named bars; supports horizontal funnel layout. */
  bars: { label: string; value: number; color?: string }[];
  /** Render horizontally as a funnel rather than vertical bar chart. */
  funnel?: boolean;
}

export interface ScatterChartWidget {
  type: 'scatter';
  id: string;
  title: string;
  xLabel?: string;
  yLabel?: string;
  series: ChartSeries[];
}

export type DataWidget =
  | DataTableWidget
  | LineChartWidget
  | BarFunnelWidget
  | ScatterChartWidget;

// ─── Section payloads ───────────────────────────────────────────────────────

export interface NarrativePayload { text: string; }
export interface H2Payload { text: string; }
export interface WidgetPayload { widget: DataWidget; }
export interface InsightsPayload { items: string[]; }
export interface FollowUpsPayload { items: string[]; }

export interface ActionCardSegmentPayload {
  /** Auto-derived name preview before Confirm. */
  name: string;
  /** Predicate description (human readable for v1; structured later). */
  description?: string;
  /** Set after successful POST: id of the created segment. */
  createdId?: string;
  /**
   * Pre-bound segment id. When set, Confirm skips the API call and navigates
   * to this existing segment. Used by scripted demo threads that should
   * reuse a seeded segment (with audience metrics already wired) rather
   * than create a fresh empty one.
   */
  targetSegmentId?: string;
  /**
   * Technical feature names referenced by the predicate. Rendered inline as
   * compact click-through pills inside the segment card so the segment +
   * its inputs read as a single artifact (instead of orphaned chips above).
   * Click → /feature-store/:name. Backward-compatible: omit to skip.
   */
  features?: string[];
}

export interface ActionCardCampaignPayload {
  name: string;
  type: 'realtime' | 'scheduled' | 'onetime';
  /** Optional segment id to bind. */
  segmentId?: string;
  description?: string;
  createdId?: string;
}

// ─── Phase 2 (260510-1519): scripted multi-turn extensions ──────────────────

export interface FeatureChipPayload {
  /** Technical feature name; component fetches /api/v1/features/:name. */
  featureName: string;
}

export interface PinToBoardPayload {
  /** Display name of the target board (auto-create if missing). */
  boardName: string;
  /** Stable id of the widget already rendered upstream in this thread. */
  widgetSnapshotId: string;
}

export interface SoftHintPayload {
  text: string;
}

/**
 * Tool-call chip — structured function-call surfacing a query/computation the
 * agent ran. Renders as: `⚡ fn(arg=val, arg=val) → result · duration`.
 *
 * Buffering: when the chip first mounts, it animates a "running" state for
 * `durationMs` (default 900ms) before flipping to "done". Makes the agent
 * feel like it is actually executing rather than pre-canned.
 *
 * Used in agent-first demo path + (now) the canonical analyst arc + research
 * threads. Replaces the legacy single-line `label/detail` shape from the
 * 260510-2300 cook.
 */
export interface ToolCallPayload {
  /** Function name. e.g. "query_trino", "compute_decomp", "shapley_attribution" */
  fn: string;
  /** Structured args — rendered inline as `name="value"`. Order preserved. */
  args?: Array<{ name: string; value: string | number | boolean }>;
  /** Result summary. e.g. "2.1M rows · cached:false" */
  result?: string;
  /** Buffer duration in ms. Drives the running→done animation. Default 900. */
  durationMs?: number;
  /** Optional status override. Default behavior: starts 'running', flips
   *  to 'done' after durationMs. Set 'done' to skip animation. */
  status?: 'running' | 'done' | 'error';
  /** Optional error message (only shown when status='error'). */
  error?: string;
}

/**
 * Provenance footer — small grey caption beneath a chart/table.
 * Used to show data source, time window, sample size — grounds claims.
 */
export interface ProvenancePayload {
  text: string;
}
