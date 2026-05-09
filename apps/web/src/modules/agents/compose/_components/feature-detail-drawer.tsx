/**
 * Feature detail drawer — read-only "open in Feature Store" panel.
 * Shows source, type, latency, distribution sparkline, key analytics signals.
 */
import React from 'react';
import { T, Sparkline } from '../../../../theme';
import { SideDrawer } from './side-drawer';
import { ProvenanceDot } from './provenance-dot';
import type { HermesFeature } from '@hermes/contracts';

interface Props {
  open: boolean;
  feature: HermesFeature | undefined;
  onClose: () => void;
}

function getSource(f: HermesFeature | undefined): 'real' | 'hybrid' | 'synth' {
  if (!f) return 'synth';
  return ((f.analytics as unknown as { source?: 'real' | 'hybrid' | 'synth' }).source) ?? 'synth';
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.n100}` }}>
    <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n900 }}>{value}</span>
  </div>
);

export const FeatureDetailDrawer: React.FC<Props> = ({ open, feature, onClose }) => (
  <SideDrawer
    open={open}
    onClose={onClose}
    title={feature?.displayName ?? 'Feature detail'}
    subtitle={feature?.name}
    width={520}
  >
    {feature ? (
      <div style={{ padding: 20 }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', padding: '12px 14px',
          background: T.n50, borderRadius: 10, marginBottom: 16,
        }}>
          <ProvenanceDot source={getSource(feature)} size={10} />
          <span style={{ fontFamily: T.fMono, fontSize: 11, fontWeight: 600, color: T.n800 }}>
            {getSource(feature).toUpperCase()} source
          </span>
          <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500, marginLeft: 'auto' }}>
            {feature.domain}
          </span>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontFamily: T.fMono, fontSize: 10, color: T.n500,
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
          }}>
            Distribution · last 30d request rate
          </div>
          <Sparkline data={feature.analytics.requestRateSparkline.slice(-30)} width={460} height={48} />
        </div>

        <div style={{ marginBottom: 4 }}>
          <Row label="Type"        value={feature.type} />
          <Row label="Latency"     value={feature.latencyTier} />
          <Row label="Substrate"   value={feature.substrate} />
          <Row label="Status"      value={feature.status} />
          <Row label="Drift score" value={feature.analytics.driftScore.toFixed(3)} />
          <Row label="Null rate"   value={`${(feature.analytics.nullRate * 100).toFixed(1)}%`} />
          <Row label="Coverage"    value={feature.analytics.coverageOfMau ? `${(feature.analytics.coverageOfMau * 100).toFixed(0)}% of MAU` : '—'} />
          <Row label="Used by"     value={`${feature.usedBySegments ?? 0} segments · ${feature.usedByCampaigns ?? 0} campaigns`} />
        </div>

        <a
          href={`/feature-store/${feature.name}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block', marginTop: 16, fontFamily: T.fSans, fontSize: 12,
            color: T.brand, textDecoration: 'none',
          }}
        >
          Open full Feature Store page →
        </a>
      </div>
    ) : (
      <div style={{ padding: 24, fontFamily: T.fSans, fontSize: 13, color: T.n500 }}>
        Feature not in catalog snapshot. Ensure catalog-api is reachable.
      </div>
    )}
  </SideDrawer>
);
