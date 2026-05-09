/**
 * Full-page error shown on Feature Store routes when the boot loader
 * could not reach `/api/v1/features`. Phase 06 hard-cut design: the web
 * bundle has no static fallback, so this is the actual UX a contributor
 * will see if catalog-api isn't running.
 */
import React from 'react';
import { T } from '../theme';
import { useFeatureLoadStatus } from '../data/catalog/features/_use-features';
import { getLoadStatus } from '../data/catalog/features/index';

export const FeaturesUnavailable: React.FC = () => {
  const status = useFeatureLoadStatus();
  if (status === 'ready') return null;

  const { error } = getLoadStatus();
  const isLoading = status === 'loading';

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.n50,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          padding: 32,
          background: '#fff',
          border: `1px solid ${T.n200}`,
          borderRadius: 8,
          fontFamily: T.fSans,
          color: T.n700,
        }}
      >
        <div
          style={{
            fontFamily: T.fDisp,
            fontSize: 28,
            fontWeight: 600,
            color: T.n900,
            marginBottom: 8,
          }}
        >
          {isLoading ? 'Loading features…' : 'Feature Store unavailable'}
        </div>
        {isLoading ? (
          <div style={{ fontSize: 13, color: T.n600 }}>Fetching catalog from backend…</div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: T.n600, marginBottom: 16 }}>
              The catalog-api at <code style={{ fontFamily: T.fMono }}>/api/v1/features</code> is
              not reachable. Feature Store cannot render without it.
            </div>
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 12,
                background: T.n100,
                padding: 12,
                borderRadius: 4,
                color: T.n800,
                whiteSpace: 'pre-line',
                marginBottom: 16,
              }}
            >
              # In a separate terminal:
              {'\n'}pnpm dev:db
              {'\n'}pnpm --filter @hermes/catalog-api dev
            </div>
            {error ? (
              <div style={{ fontSize: 11, color: T.n500, fontFamily: T.fMono }}>
                Reason: {error}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
