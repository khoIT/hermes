/**
 * DriftIndicator — single-glyph drift signal for the Feature Store row.
 *   score < 0.2          → '—' gray (calm)
 *   0.2 ≤ score < 0.4    → '◷' amber (watch)
 *   score ≥ 0.4          → '⚠' red   (alert)
 */
import React from 'react';
import { T } from '../../../theme';
import { DRIFT_THRESHOLD, DRIFT_WATCH_THRESHOLD } from '../_logic/thresholds';

interface DriftIndicatorProps {
  score: number;
}

export function DriftIndicator({ score }: DriftIndicatorProps) {
  const safe = Number.isFinite(score) ? score : 0;
  let glyph = '—';
  let color: string = T.n400;
  let tip = `Drift score: ${safe.toFixed(2)} — calm`;
  if (safe >= DRIFT_THRESHOLD) {
    glyph = '⚠';
    color = T.red600;
    tip = `Drift score: ${safe.toFixed(2)} — alert`;
  } else if (safe >= DRIFT_WATCH_THRESHOLD) {
    glyph = '◷';
    color = T.amber500;
    tip = `Drift score: ${safe.toFixed(2)} — watch`;
  }
  return (
    <span
      title={tip}
      aria-label={tip}
      style={{
        fontFamily: T.fMono, fontSize: 13, lineHeight: 1,
        color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18,
      }}
    >
      {glyph}
    </span>
  );
}
