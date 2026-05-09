/**
 * PredicateCascade — "HOW PREDICATES NARROW THE POPULATION" chart.
 * Horizontal stepped-bar visualization: MAU base → Group 1 → ∩ Group 2 → \ Exclusions.
 * Each bar height represents log10(count)/log10(MAU) proportion.
 * Orange #f05a22 fill, gray base, arrow with drop-label between steps.
 * Animates height on count change via CSS transition.
 *
 * Per reference design-reference/Hermes/src/segments.jsx AudiencePreview waterfall.
 * New component for P-UI port — cascade chart was not in previous build.
 */
import React from 'react';
import { T } from '../../../theme';

const ACCENT = '#f05a22';
const MAU_LOG = Math.log10(1_250_000); // log10(1.25M) — denominator for bar height

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function logScale(count: number, base: number): number {
  if (count <= 0) return 0;
  return Math.min(1, Math.log10(Math.max(1, count)) / Math.log10(Math.max(1, base)));
}

interface CascadeStep {
  label: string;
  count: number;
  kind: 'base' | 'group' | 'excl';
}

interface Props {
  /** Full MAU base (denominator) */
  mauBase: number;
  /** Steps after MAU base: one per group + optional exclusion */
  steps: CascadeStep[];
}

function ArrowDrop({ drop }: { drop: number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', width: 38, paddingBottom: 18, gap: 2, flexShrink: 0,
    }}>
      {/* Arrow → */}
      <svg width={14} height={10} viewBox="0 0 14 10" fill="none">
        <path d="M0 5h11M7 1l5 4-5 4" stroke={T.n400} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {drop > 0 && (
        <span style={{ fontFamily: T.fMono, fontSize: 9, color: T.n500 }}>
          −{fmtNum(drop)}
        </span>
      )}
    </div>
  );
}

export const PredicateCascade = React.memo<Props>(({ mauBase, steps }) => {
  const allSteps: CascadeStep[] = [
    { label: 'MAU base', count: mauBase, kind: 'base' },
    ...steps,
  ];

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: T.fMono, fontSize: 10, fontWeight: 600,
          color: T.n500, textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          How predicates narrow the population
        </span>
        <span style={{
          fontFamily: T.fMono, fontSize: 10, color: T.n400, fontStyle: 'italic',
        }}>
          independence approximation
        </span>
      </div>

      {/* Cascade bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: 56 }}>
        {allSteps.map((step, i) => {
          const pct = logScale(step.count, mauBase);
          const prev = i > 0 ? allSteps[i - 1]! : null;
          const drop = prev ? Math.max(0, prev.count - step.count) : 0;
          const barColor =
            step.kind === 'base' ? '#d4d2cc'
            : step.kind === 'excl' ? '#fca5a5'
            : ACCENT;

          return (
            <React.Fragment key={i}>
              {/* Drop arrow between steps */}
              {i > 0 && <ArrowDrop drop={drop} />}

              {/* Bar column */}
              <div style={{
                flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              }}>
                <div style={{
                  position: 'relative', height: 36,
                  background: '#f0ede7', borderRadius: 3, overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, bottom: 0, width: '100%',
                    height: `${Math.max(4, pct * 100)}%`,
                    background: barColor,
                    transition: 'height .35s ease',
                  }} />
                  <span style={{
                    position: 'absolute', top: 3, left: 4, right: 4,
                    fontFamily: T.fMono, fontSize: 10, fontWeight: 600,
                    color: pct > 0.55 ? '#fff' : T.n800, textAlign: 'left',
                    zIndex: 1,
                  }}>
                    {fmtNum(step.count)}
                  </span>
                </div>
                <span style={{
                  fontFamily: T.fSans, fontSize: 10, color: T.n500, marginTop: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

PredicateCascade.displayName = 'PredicateCascade';

// ── Helper: build cascade steps from canvas audience model ─────────────────
export interface AudienceModel {
  base: number;
  groupCounts: number[];        // count after each group (cumulative intersection)
  afterExcl: number;            // count after exclusions applied
  hasExclusions: boolean;
}

export function buildCascadeSteps(model: AudienceModel): CascadeStep[] {
  const steps: CascadeStep[] = [];
  model.groupCounts.forEach((count, i) => {
    steps.push({
      label: i === 0 ? 'Group 1' : `∩ Group ${i + 1}`,
      count,
      kind: 'group',
    });
  });
  if (model.hasExclusions) {
    steps.push({ label: '\\ Exclusions', count: model.afterExcl, kind: 'excl' });
  }
  return steps;
}
