/**
 * Format a drift score (0..1) into a numeric label + plain-English band.
 *
 *   <0.2  → "stable"
 *   <0.4  → "mild drift"
 *   ≥0.4  → "severe drift"
 *
 * Returns the numeric to 2 decimals + a human-readable band + a tone hint
 * for chip / icon coloring (green / amber / red).
 */
export type DriftBand = 'stable' | 'mild' | 'severe';
export type DriftTone = 'ok' | 'warn' | 'critical';

export interface DriftFormat {
  numeric: string;
  band: DriftBand;
  bandLabel: string;
  tone: DriftTone;
}

export function formatDriftScore(score: number): DriftFormat {
  const clamped = Math.max(0, Math.min(1, score));
  const numeric = clamped.toFixed(2);
  if (clamped < 0.2) {
    return { numeric, band: 'stable', bandLabel: 'stable', tone: 'ok' };
  }
  if (clamped < 0.4) {
    return { numeric, band: 'mild', bandLabel: 'mild drift', tone: 'warn' };
  }
  return { numeric, band: 'severe', bandLabel: 'severe drift', tone: 'critical' };
}

const TONE_COLORS: Record<DriftTone, { bg: string; fg: string }> = {
  ok: { bg: '#dcfce7', fg: '#166534' },
  warn: { bg: '#fef3c7', fg: '#92400e' },
  critical: { bg: '#fee2e2', fg: '#991b1b' },
};

export function driftToneColors(tone: DriftTone): { bg: string; fg: string } {
  return TONE_COLORS[tone];
}
