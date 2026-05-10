/**
 * Channel-aware palette for chart widgets. PRD §6 mapping.
 * Generic series fall back to T-theme CHART palette.
 */
import { CHART, T } from '../../../theme';

export const CHANNEL_COLORS: Record<string, string> = {
  Facebook: T.green600,
  Admob: T.purple500,
  Moloco: T.brand,
  Vungle: T.blue500,
};

export function colorFor(name: string, fallbackIndex = 0): string {
  return CHANNEL_COLORS[name] ?? CHART[fallbackIndex % CHART.length] ?? T.brand;
}
