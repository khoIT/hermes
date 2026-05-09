/**
 * Audience count card — big serif number + 3 cohort breakdown bars.
 * Cohort bars use illustrative fixture values (consistent with Feature Store
 * coverage panel precedent — annotated as fixture-derived).
 */
import React from 'react';
import { T } from '../../../../theme';

interface Props {
  status: 'computing' | 'reviewing' | 'approved' | 'idle' | 'stale' | 'proposing';
  count: number | null;
  durationMs?: number;
  error?: string | null;
  onRetry?: () => void;
}

const FIXTURE = {
  lifecycle: [
    { label: 'NRU', value: 0.18, color: '#a855f7' },
    { label: 'Mid', value: 0.62, color: T.brand },
    { label: 'Vet', value: 0.20, color: '#059669' },
  ],
  region: [
    { label: 'VN', value: 0.74, color: T.brand },
    { label: 'TH', value: 0.10, color: '#3f8dff' },
    { label: 'ID', value: 0.08, color: '#a855f7' },
    { label: 'PH', value: 0.05, color: '#059669' },
    { label: 'Other', value: 0.03, color: T.n400 },
  ],
  spend: [
    { label: 'Free', value: 0.91, color: T.n400 },
    { label: 'Low', value: 0.06, color: '#3f8dff' },
    { label: 'Mid', value: 0.02, color: T.brand },
    { label: 'High', value: 0.01, color: '#059669' },
  ],
};

const Bar: React.FC<{ label: string; segments: { label: string; value: number; color: string }[] }> = ({ label, segments }) => (
  <div>
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: T.fMono, fontSize: 10, color: T.n500,
      letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4,
    }}>
      <span>{label}</span>
      <span>{segments.map((s) => `${s.label} ${(s.value * 100).toFixed(0)}%`).join(' · ')}</span>
    </div>
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: T.n100 }}>
      {segments.map((s) => (
        <div key={s.label} style={{ width: `${s.value * 100}%`, background: s.color }} />
      ))}
    </div>
  </div>
);

export const AudienceCountCard: React.FC<Props> = ({ status, count, durationMs, error, onRetry }) => {
  const isLoading = status === 'computing' || status === 'stale';

  return (
    <div style={{
      padding: 18, borderRadius: 12, background: '#fff',
      border: `1px solid ${T.n200}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{
            fontFamily: T.fMono, fontSize: 10, color: T.n500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Live audience size
          </div>
          {error ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: '"Spectral", Georgia, serif', fontSize: 22, color: T.red600 }}>
                Couldn't fetch
              </span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  style={{
                    fontFamily: T.fSans, fontSize: 11, color: T.brand, background: 'none',
                    border: 0, cursor: 'pointer', padding: 0,
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          ) : isLoading || count == null ? (
            <div style={{
              width: 180, height: 36, borderRadius: 8, marginTop: 4,
              background: `linear-gradient(90deg, ${T.n100}, ${T.n200}, ${T.n100})`,
              backgroundSize: '200% 100%', animation: 'audience-shimmer 1.4s linear infinite',
            }} />
          ) : (
            <span style={{
              fontFamily: '"Spectral", Georgia, serif', fontSize: 44, color: T.n950,
              lineHeight: 1, fontWeight: 400, letterSpacing: '-0.01em',
            }}>
              {count.toLocaleString()}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: T.fMono, fontSize: 10, color: T.n500, paddingBottom: 4,
        }}>
          UIDs{durationMs ? ` · ${durationMs}ms` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bar label="Lifecycle" segments={FIXTURE.lifecycle} />
        <Bar label="Region"    segments={FIXTURE.region} />
        <Bar label="Spend tier" segments={FIXTURE.spend} />
      </div>
      <div style={{
        marginTop: 8, fontFamily: T.fMono, fontSize: 9, color: T.n400,
        letterSpacing: '0.04em',
      }}>
        cohort bars · illustrative · matches Feature Store coverage panel precedent
      </div>
      <style>{`@keyframes audience-shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
};
