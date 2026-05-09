/**
 * 02 — Feature Store Detail (fs_detail)
 * Shows: header, 3 tabs (Overview / Lineage / Used By), sticky right rail.
 * Showcase: consecutive_ranked_losses_streak — dual-tier, side-by-side definition.
 * Per PRD §6.2 + §6.3 spec.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T, Button, Badge, Avatar, Tabs } from '../../theme';
import { LatencyBadge } from '../../components/latency-badge';
import { Histogram } from '../../components/histogram';
import { getFeatureByName, allFeatures } from '../../data/catalog/features/index';
import { allSegments } from '../../data/catalog/segments';
import { allCampaigns } from '../../data/catalog/campaigns';
import { DefinitionSideBySide } from './_components/definition-side-by-side';
import { LineageTab } from './_components/lineage-tab';
import { UsedByTab } from './_components/used-by-tab';
import { RecentValuesPanel } from './_components/recent-values-panel';
import { computeUsageCounts, getFeatureUsage } from './_logic/usage-count';

// Precompute usage map at module load
const USAGE_MAP = computeUsageCounts(allFeatures, allSegments, allCampaigns);

const TYPE_LABEL: Record<string, string> = {
  'int': 'Counter · integer',
  'numeric': 'Score · numeric',
  'bool': 'Boolean',
  'enum': 'Tag · enum',
  'string': 'String',
  'timestamp': 'Timestamp',
  'array<string>': 'Array · string[]',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  beta: 'warning',
  deprecated: 'destructive',
};

export default function FeatureStoreDetailPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<'overview' | 'lineage' | 'usedby'>('overview');

  const decodedName = name ? decodeURIComponent(name) : '';
  const feature = getFeatureByName(decodedName);

  // Redirect to library if feature not found
  React.useEffect(() => {
    if (decodedName && !feature) {
      navigate('/feature-store', { replace: true });
    }
  }, [decodedName, feature, navigate]);

  if (!feature) return null;

  const usage = getFeatureUsage(USAGE_MAP, feature.name);

  // Find related features in same domain (up to 5, excluding self)
  const related = allFeatures
    .filter((f) => f.domain === feature.domain && f.name !== feature.name)
    .slice(0, 5);

  const storageDescription = feature.dualTier
    ? `${TYPE_LABEL[feature.type] ?? feature.type}, served from Redis online tier [<1s · A] and Iceberg offline tier [<1h · B]`
    : feature.substrate === 'A'
    ? `${TYPE_LABEL[feature.type] ?? feature.type}, served from TEE online state store [${feature.latencyTier} · A]`
    : `${TYPE_LABEL[feature.type] ?? feature.type}, served from Iceberg offline tier [${feature.latencyTier} · B]`;

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'lineage', label: 'Lineage' },
    { value: 'usedby', label: `Used By (${usage.segmentCount + usage.campaignCount})` },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '24px 40px 0', background: '#fff',
        borderBottom: `1px solid ${T.n200}`,
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <button
            onClick={() => navigate('/feature-store')}
            style={{
              fontFamily: T.fSans, fontSize: 11, color: T.n500, background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Feature Store
          </button>
          <span style={{ color: T.n300, fontSize: 11 }}>/</span>
          <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>
            {feature.name}
          </span>
        </div>

        {/* Feature name + meta */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ minWidth: 0 }}>
            {/* Technical name — mono */}
            <div style={{
              fontFamily: T.fMono, fontSize: 20, color: T.n950,
              fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4,
            }}>
              {feature.name}
            </div>
            {/* Display name — serif italic */}
            <div style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              fontStyle: 'italic', fontSize: 15, color: T.n500, marginBottom: 12,
            }}>
              {feature.displayName}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {/* Type chip */}
              <span style={{
                fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
                padding: '2px 8px', borderRadius: 4,
                background: '#dbeafe', color: '#1e40af',
              }}>
                {TYPE_LABEL[feature.type] ?? feature.type}
              </span>

              {/* Latency badge(s) */}
              {feature.dualTier ? (
                <LatencyBadge tiers={[{ tier: '<1s', substrate: 'A' }, { tier: '<1h', substrate: 'B' }]} />
              ) : (
                <LatencyBadge tier={feature.latencyTier} substrate={feature.substrate} />
              )}

              {/* Status */}
              <Badge variant={STATUS_VARIANT[feature.status] ?? 'secondary'}>
                {feature.status}
              </Badge>

              {/* Owner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Avatar name={feature.owner} size={18} />
                <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
                  {feature.owner}
                </span>
              </div>

              {/* Domain */}
              <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400 }}>
                {feature.domain}
              </span>
            </div>
          </div>

          {/* Edit definition CTA — no-op per PRD §13 */}
          <Button variant="outline" size="sm" style={{ flexShrink: 0, marginTop: 4 }}>
            Edit definition
          </Button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value as typeof tab)}
              style={{
                fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
                color: tab === t.value ? T.brand : T.n600,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 16px 10px',
                borderBottom: tab === t.value ? `2px solid ${T.brand}` : '2px solid transparent',
                transition: 'color .12s, border-color .12s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', padding: '28px 40px', gap: 32, alignItems: 'flex-start' }}>
        {/* Main content area */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {tab === 'overview' && (
            <OverviewTab feature={feature} storageDescription={storageDescription} />
          )}
          {tab === 'lineage' && (
            <LineageTab
              feature={feature}
              segments={usage.segments}
              campaigns={usage.campaigns}
            />
          )}
          {tab === 'usedby' && (
            <UsedByTab
              featureName={feature.name}
              segments={usage.segments}
              campaigns={usage.campaigns}
            />
          )}
        </div>

        {/* Right rail — sticky */}
        <aside style={{
          width: 220, flexShrink: 0,
          position: 'sticky', top: 80, alignSelf: 'flex-start',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Use in segment CTA */}
          <Button
            variant="primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate(`/segments/new?seedFeature=${encodeURIComponent(feature.name)}`)}
          >
            Use in segment
          </Button>

          {/* Investigate in Explore CTA */}
          <Button
            variant="outline"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate(`/explore?feature=${encodeURIComponent(feature.name)}`)}
          >
            Investigate in Explore
          </Button>

          {/* Related features */}
          {related.length > 0 && (
            <div style={{
              border: `1px solid ${T.n200}`, borderRadius: 8,
              background: '#fff', overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 12px', borderBottom: `1px solid ${T.n200}`,
                fontFamily: T.fSans, fontSize: 10, fontWeight: 700,
                color: T.n500, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Related Features
              </div>
              {related.map((rel) => (
                <button
                  key={rel.name}
                  onClick={() => navigate(`/feature-store/${encodeURIComponent(rel.name)}`)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', background: 'none', border: 'none',
                    cursor: 'pointer', borderBottom: `1px solid ${T.n100}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.n50)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n800 }}>
                    {rel.name}
                  </div>
                  <div style={{
                    fontFamily: '"Georgia", serif', fontStyle: 'italic',
                    fontSize: 10, color: T.n400,
                  }}>
                    {rel.displayName}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick stats */}
          <div style={{
            border: `1px solid ${T.n200}`, borderRadius: 8,
            background: '#fff', padding: '12px',
          }}>
            <div style={{
              fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            }}>
              Usage
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600 }}>
                <span style={{ fontWeight: 700, color: T.n900 }}>{usage.segmentCount}</span>
                {' '}segment{usage.segmentCount !== 1 ? 's' : ''}
              </div>
              <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600 }}>
                <span style={{ fontWeight: 700, color: T.n900 }}>{usage.campaignCount}</span>
                {' '}campaign{usage.campaignCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────
interface OverviewTabProps {
  feature: NonNullable<ReturnType<typeof getFeatureByName>>;
  storageDescription: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ feature, storageDescription }) => (
  <>
    {/* Definition side-by-side */}
    <section style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10, padding: 20 }}>
      <DefinitionSideBySide feature={feature} />
    </section>

    {/* Type + storage row */}
    <section style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 60 }}>
        Storage
      </span>
      <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n700 }}>
        {storageDescription}
      </span>
    </section>

    {/* Distribution histogram — full width */}
    <section style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10, padding: 20 }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n500,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
      }}>
        Value Distribution · 28-bin histogram
      </div>
      <Histogram
        featureName={feature.name}
        featureType={feature.type}
        width={600}
        height={100}
      />
      <div style={{
        display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap',
      }}>
        {[
          { label: 'p50', color: T.green600 },
          { label: 'p90', color: T.amber500 },
          { label: 'p99', color: '#ef4444' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 16, height: 1.5, background: color, borderTop: `1.5px dashed ${color}` }} />
            <span style={{ fontFamily: T.fMono, fontSize: 10, color }}>
              {label} marker
            </span>
          </div>
        ))}
      </div>
    </section>

    {/* Recent values */}
    <section style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10, padding: 20 }}>
      <RecentValuesPanel feature={feature} />
    </section>

    {/* Materialization status */}
    <section style={{
      background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10, padding: 20,
    }}>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n500,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
      }}>
        Materialization Status
      </div>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {[
          { label: 'Last refresh', value: '06:00 ICT today' },
          { label: 'Freshness SLA', value: feature.dualTier ? '<1s (A) · <1h (B)' : feature.latencyTier },
          { label: 'Recent runs', value: '12 successful, 0 failed' },
          { label: 'Schedule', value: feature.substrate === 'A' ? 'event-driven' : 'hourly batch' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {label}
            </div>
            <div style={{ fontFamily: T.fMono, fontSize: 12, color: T.n800, fontWeight: 500 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  </>
);
