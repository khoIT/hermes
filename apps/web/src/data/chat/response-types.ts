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
