/**
 * Feature Store Detail (fs_detail) — v2 redesign.
 * 4 tabs: Overview · Analytics · Lineage · Used By
 *
 * Header replaces owner avatar with games chip cluster + Platform · Propensity
 * chip (when applicable). Right rail adds a Health snapshot card visible
 * across all tabs. CTA pair: Edit definition (no-op per PRD §13) +
 * Register similar feature (Phase 4).
 */
import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { T, Button, Badge } from '../../theme';
import { LatencyBadge } from '../../components/latency-badge';
import { getFeatureByName, allFeatures } from '../../data/catalog/features/index';
import { useFeatureLoadStatus } from '../../data/catalog/features/_use-features';
import { FeaturesUnavailable } from '../../components/features-unavailable';
import { allSegments } from '../../data/catalog/segments';
import { allCampaigns } from '../../data/catalog/campaigns';
import { DefinitionSideBySide } from './_components/definition-side-by-side';
import { LineageTab } from './_components/lineage-tab';
import { UsedByTab } from './_components/used-by-tab';
import { AnalyticsTab } from './_components/analytics-tab';
import { GamesChipCluster } from './_components/games-chip-cluster';
import { PlatformPropensityChip } from './_components/platform-propensity-chip';
import { PropensityModelCard } from './_components/propensity-model-card';
import { DescriptionBlock } from './_components/description-block';
import { HealthSnapshotCard } from './_components/health-snapshot-card';
import { computeUsageCounts, getFeatureUsage } from './_logic/usage-count';
import { SourceProvenanceCard } from './_components/_lm/source-provenance-card';
import { HealthVerdictCard } from './_components/_lm/health-verdict-card';
import { ThresholdPlaygroundPanel } from './_components/_lm/threshold-playground-panel';
import {
  QuantileStripPanel, CoverageSegmentationPanel, SampleValueCardsPanel,
  CorrelatedFeaturesPanel, OutlierExamplesPanel,
} from './_components/_da/analyst-panels';
import {
  PipelineHealthTimelinePanel, CostLatencyPanel, LineageV2Panel, BackfillHistoryPanel,
} from './_components/_de/engineer-panels';

const USAGE_MAP = computeUsageCounts(allFeatures, allSegments, allCampaigns);

const TYPE_LABEL: Record<string, string> = {
  int: 'Counter · integer',
  numeric: 'Score · numeric',
  bool: 'Boolean',
  enum: 'Tag · enum',
  string: 'String',
  timestamp: 'Timestamp',
  'array<string>': 'Array · string[]',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  beta: 'warning',
  deprecated: 'destructive',
};

type TabValue = 'liveops' | 'analyst' | 'engineer' | 'overview' | 'analytics' | 'lineage' | 'usedby';
const ALL_TABS: TabValue[] = ['liveops', 'analyst', 'engineer', 'overview', 'analytics', 'lineage', 'usedby'];

export default function FeatureStoreDetailPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loadStatus = useFeatureLoadStatus();

  const tabFromQuery = searchParams.get('tab') as TabValue | null;
  const initialTab: TabValue =
    tabFromQuery && ALL_TABS.includes(tabFromQuery) ? tabFromQuery : 'liveops';
  const [tab, setTab] = React.useState<TabValue>(initialTab);

  const decodedName = name ? decodeURIComponent(name) : '';
  const feature = getFeatureByName(decodedName);

  React.useEffect(() => {
    if (loadStatus === 'ready' && decodedName && !feature) {
      navigate('/feature-store', { replace: true });
    }
  }, [decodedName, feature, navigate, loadStatus]);

  if (loadStatus !== 'ready') {
    return <FeaturesUnavailable />;
  }

  const setTabAndQuery = React.useCallback(
    (next: TabValue) => {
      setTab(next);
      const params = new URLSearchParams(searchParams);
      if (next === 'overview') params.delete('tab');
      else params.set('tab', next);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  if (!feature) return null;

  const usage = getFeatureUsage(USAGE_MAP, feature.name);

  const related = allFeatures
    .filter((f) => f.domain === feature.domain && f.name !== feature.name)
    .slice(0, 5);

  const storageDescription = feature.dualTier
    ? `${TYPE_LABEL[feature.type] ?? feature.type}, served from Redis online tier (Realtime) and Iceberg offline tier (Batch warm)`
    : feature.substrate === 'A'
    ? `${TYPE_LABEL[feature.type] ?? feature.type}, served from TEE online state store (Realtime)`
    : `${TYPE_LABEL[feature.type] ?? feature.type}, served from Iceberg offline tier (${
        feature.latencyTier === '<1h' ? 'Batch warm' : 'Batch cold'
      })`;

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'liveops',  label: 'LiveOps' },
    { value: 'analyst',  label: 'Analyst' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'overview', label: 'Overview' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'lineage', label: 'Lineage' },
    { value: 'usedby', label: `Used By (${usage.segmentCount + usage.campaignCount})` },
  ];

  const handleRegisterSimilar = () => {
    const params = new URLSearchParams({
      domain: feature.domain,
      games: feature.games.join(','),
      latency: feature.latencyTier,
      similarTo: feature.name,
    });
    navigate(`/feature-store/new?${params.toString()}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '24px 40px 0',
          background: '#fff',
          borderBottom: `1px solid ${T.n200}`,
        }}
      >
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <button
            onClick={() => navigate('/feature-store')}
            style={{
              fontFamily: T.fSans,
              fontSize: 11,
              color: T.n500,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Feature Store
          </button>
          <span style={{ color: T.n300, fontSize: 11 }}>/</span>
          <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>{feature.name}</span>
        </div>

        {/* Feature name + meta */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 20,
                color: T.n950,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                marginBottom: 4,
              }}
            >
              {feature.name}
            </div>
            <div
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: 15,
                color: T.n500,
                marginBottom: 12,
              }}
            >
              {feature.displayName}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <span
                style={{
                  fontFamily: T.fSans,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#dbeafe',
                  color: '#1e40af',
                }}
              >
                {TYPE_LABEL[feature.type] ?? feature.type}
              </span>

              {feature.dualTier ? (
                <LatencyBadge
                  tiers={[
                    { tier: '<1s', substrate: 'A' },
                    { tier: '<1h', substrate: 'B' },
                  ]}
                />
              ) : (
                <LatencyBadge tier={feature.latencyTier} substrate={feature.substrate} />
              )}

              <GamesChipCluster games={feature.games} size="md" />

              {feature.platform && (
                <PlatformPropensityChip propensity={feature.propensityModel} size="md" />
              )}

              <Badge variant={STATUS_VARIANT[feature.status] ?? 'secondary'}>{feature.status}</Badge>

              <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400 }}>
                {feature.domain}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 4 }}>
            <Button variant="outline" size="sm">
              Edit definition
            </Button>
            <Button variant="primary" size="sm" onClick={handleRegisterSimilar}>
              Register similar feature
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTabAndQuery(t.value)}
              style={{
                fontFamily: T.fSans,
                fontSize: 13,
                fontWeight: 500,
                color: tab === t.value ? T.brand : T.n600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
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
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {tab === 'liveops' && (
            <>
              <SourceProvenanceCard feature={feature} />
              <HealthVerdictCard feature={feature} />
              <ThresholdPlaygroundPanel feature={feature} />
            </>
          )}
          {tab === 'analyst' && (
            <>
              <QuantileStripPanel        feature={feature} />
              <CoverageSegmentationPanel feature={feature} />
              <SampleValueCardsPanel     feature={feature} />
              <CorrelatedFeaturesPanel   feature={feature} />
              <OutlierExamplesPanel      feature={feature} />
            </>
          )}
          {tab === 'engineer' && (
            <>
              <PipelineHealthTimelinePanel feature={feature} />
              <CostLatencyPanel            feature={feature} />
              <LineageV2Panel              feature={feature} />
              <BackfillHistoryPanel        feature={feature} />
            </>
          )}
          {tab === 'overview' && (
            <OverviewTab feature={feature} storageDescription={storageDescription} />
          )}
          {tab === 'analytics' && <AnalyticsTab feature={feature} />}
          {tab === 'lineage' && (
            <LineageTab feature={feature} segments={usage.segments} campaigns={usage.campaigns} />
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
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            position: 'sticky',
            top: 80,
            alignSelf: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <Button
            variant="primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate(`/segments/new?seedFeature=${encodeURIComponent(feature.name)}`)}
          >
            Use in segment
          </Button>

          <Button
            variant="outline"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate(`/explore?feature=${encodeURIComponent(feature.name)}`)}
          >
            Investigate in Explore
          </Button>

          <HealthSnapshotCard
            analytics={feature.analytics}
            onOpenAnalytics={() => setTabAndQuery('analytics')}
          />

          {related.length > 0 && (
            <div
              style={{
                border: `1px solid ${T.n200}`,
                borderRadius: 8,
                background: '#fff',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: `1px solid ${T.n200}`,
                  fontFamily: T.fSans,
                  fontSize: 10,
                  fontWeight: 700,
                  color: T.n500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Related Features
              </div>
              {related.map((rel) => (
                <button
                  key={rel.name}
                  onClick={() => navigate(`/feature-store/${encodeURIComponent(rel.name)}`)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${T.n100}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.n50)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.n800 }}>{rel.name}</div>
                  <div
                    style={{
                      fontFamily: '"Georgia", serif',
                      fontStyle: 'italic',
                      fontSize: 10,
                      color: T.n400,
                    }}
                  >
                    {rel.displayName}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              border: `1px solid ${T.n200}`,
              borderRadius: 8,
              background: '#fff',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontFamily: T.fSans,
                fontSize: 10,
                fontWeight: 700,
                color: T.n500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              Usage
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600 }}>
                <span style={{ fontWeight: 700, color: T.n900 }}>{usage.segmentCount}</span>{' '}
                segment{usage.segmentCount !== 1 ? 's' : ''}
              </div>
              <div style={{ fontFamily: T.fSans, fontSize: 12, color: T.n600 }}>
                <span style={{ fontWeight: 700, color: T.n900 }}>{usage.campaignCount}</span>{' '}
                campaign{usage.campaignCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface OverviewTabProps {
  feature: NonNullable<ReturnType<typeof getFeatureByName>>;
  storageDescription: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ feature, storageDescription }) => (
  <>
    {feature.platform && <PropensityModelCard feature={feature} />}

    <DescriptionBlock feature={feature} />

    <section style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10, padding: 20 }}>
      <DefinitionSideBySide feature={feature} />
    </section>

    <section
      style={{
        background: '#fff',
        border: `1px solid ${T.n200}`,
        borderRadius: 10,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: T.fSans,
          fontSize: 10,
          fontWeight: 700,
          color: T.n400,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          minWidth: 60,
        }}
      >
        Storage
      </span>
      <span style={{ fontFamily: T.fSans, fontSize: 13, color: T.n700 }}>{storageDescription}</span>
    </section>
  </>
);
