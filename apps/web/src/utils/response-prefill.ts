/**
 * response-prefill — extracts structured prefill context from an AssistantMessage
 * for seeding QuickSegmentDialog and QuickCampaignDialog.
 *
 * Walks response.sections to find:
 *   - features: names mentioned in widget series/columns or narrative text
 *   - narrative: first 280 chars of concatenated narrative text
 *   - goal4r: inferred 4R goal from all text
 *   - primaryWidget: first widget section's DataWidget
 *   - hintedSegmentId: first "seg-..." pattern found in narrative
 */
import type { ChatMessage } from './chat-store';
import type {
  NarrativePayload, InsightsPayload, WidgetPayload, DataWidget,
  LineChartWidget, ScatterChartWidget, DataTableWidget,
} from '../data/chat/response-types';
import { getAllFeatures } from '../data/catalog/features';
import { inferGoal4R, type Goal4R } from './four-r-inference';

export interface PrefillContext {
  /** Technical feature names found in widgets or narrative. */
  features: string[];
  /** First 280 chars of concatenated narrative text. */
  narrative: string;
  /** Inferred 4R goal from all text (null = ambiguous or unknown). */
  goal4r: Goal4R | null;
  /** First chart/table widget — used for Pin-to-board. */
  primaryWidget: DataWidget | null;
  /** First segment id hint found in narrative text (e.g. "seg-abc123"). */
  hintedSegmentId: string | null;
}

const SEG_ID_RE = /\bseg-[a-z0-9-]+/g;

/** Extract words from widget for feature name matching. */
function widgetTerms(widget: DataWidget): string[] {
  const terms: string[] = [];
  if (widget.type === 'line' || widget.type === 'scatter') {
    const w = widget as LineChartWidget | ScatterChartWidget;
    for (const s of w.series) terms.push(s.name.toLowerCase());
  } else if (widget.type === 'table') {
    const w = widget as DataTableWidget;
    for (const col of w.columns) {
      terms.push(col.key.toLowerCase());
      terms.push(col.label.toLowerCase());
    }
  } else if (widget.type === 'bar') {
    // bar widget labels rarely match feature names, but include title
    terms.push(widget.title.toLowerCase());
  }
  return terms;
}

export function extractPrefillContext(message: ChatMessage): PrefillContext {
  const featureNames = getAllFeatures().map(f => f.name.toLowerCase());

  const foundFeatures = new Set<string>();
  const narrativeParts: string[] = [];
  let primaryWidget: DataWidget | null = null;
  let hintedSegmentId: string | null = null;

  for (const section of message.sections ?? []) {
    switch (section.type) {
      case 'widget': {
        const w = (section.payload as WidgetPayload).widget;
        if (!primaryWidget) primaryWidget = w;
        // Scan widget terms for feature name matches
        const terms = widgetTerms(w);
        for (const name of featureNames) {
          if (terms.some(t => t.includes(name) || name.includes(t.replace(/\s+/g, '_')))) {
            foundFeatures.add(name);
          }
        }
        break;
      }
      case 'narrative': {
        const text = (section.payload as NarrativePayload).text;
        narrativeParts.push(text);
        // Match feature names in narrative
        const lower = text.toLowerCase();
        for (const name of featureNames) {
          // Match both snake_case and space-separated variants
          const readable = name.replace(/_/g, ' ');
          if (lower.includes(name) || lower.includes(readable)) {
            foundFeatures.add(name);
          }
        }
        // Scan for segment id hints
        if (!hintedSegmentId) {
          const m = text.match(SEG_ID_RE);
          if (m) hintedSegmentId = m[0];
        }
        break;
      }
      case 'insights': {
        const items = (section.payload as InsightsPayload).items;
        const joined = items.join(' ');
        narrativeParts.push(joined);
        const lower = joined.toLowerCase();
        for (const name of featureNames) {
          const readable = name.replace(/_/g, ' ');
          if (lower.includes(name) || lower.includes(readable)) {
            foundFeatures.add(name);
          }
        }
        if (!hintedSegmentId) {
          const m = joined.match(SEG_ID_RE);
          if (m) hintedSegmentId = m[0];
        }
        break;
      }
      default:
        break;
    }
  }

  // Also scan top-level message.text if no sections
  if (message.text && !message.sections?.length) {
    narrativeParts.push(message.text);
  }

  const allText = narrativeParts.join(' ');
  const narrative = allText.slice(0, 280);
  const goal4r = inferGoal4R(allText);

  return {
    features: Array.from(foundFeatures),
    narrative,
    goal4r,
    primaryWidget,
    hintedSegmentId,
  };
}

/**
 * Derive a default name from the first sentence of narrative text.
 * Strips markdown bold markers. Truncates at 60 chars.
 */
export function defaultNameFromNarrative(narrative: string): string {
  const clean = narrative.replace(/\*\*/g, '').replace(/`[^`]*`/g, '').trim();
  const firstSentence = (clean.split(/[.!?]/)[0] ?? '').trim();
  return firstSentence.slice(0, 60) || 'New segment';
}
