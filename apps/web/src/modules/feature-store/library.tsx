/**
 * 01 — Feature Store Library (fs_library)
 * Groupable + filterable catalog over all 73 Hermes features.
 * Per PRD §6.1 spec.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Button } from '../../theme';
import { allFeatures, getAllFeatures, subscribeFeatures } from '../../data/catalog/features/index';
import { useFeatureLoadStatus } from '../../data/catalog/features/_use-features';
import { FeaturesUnavailable } from '../../components/features-unavailable';
import { allSegments } from '../../data/catalog/segments';
import { allCampaigns } from '../../data/catalog/campaigns';
import { StatStrip } from './_components/stat-strip';
import { FilterRail } from './_components/filter-rail';
import { GroupByControl } from './_components/group-by-control';
import { FeatureRowCard } from './_components/feature-row-card';
import { SortControl } from './_components/sort-control';
import { sortFeatures, type SortStrategy } from './_logic/sort';
import { groupFeatures, type GroupByStrategy } from './_logic/group';
import { applyFilter, EMPTY_FILTER, type FilterState } from './_logic/filter';
import { computeUsageCounts } from './_logic/usage-count';
import type { FeatureUsage } from './_logic/usage-count';
import type { HermesFeature } from '@hermes/contracts';

// ── Precompute usage map at module load (stable across renders) ──────────────
const USAGE_MAP = computeUsageCounts(allFeatures, allSegments, allCampaigns);

// Entry-points labels — badge count for "Drift detected" computed at render time.
type EntryPointKey = 'domain' | 'register' | 'recent' | 'drift';
interface EntryPoint {
  key: EntryPointKey;
  label: string;
}
const ENTRY_POINTS: EntryPoint[] = [
  { key: 'domain', label: 'Browse by domain' },
  { key: 'register', label: 'Register a new feature' },
  { key: 'recent', label: 'Recently added' },
  { key: 'drift', label: 'Drift detected' },
];

export default function FeatureStoreLibraryPage() {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = React.useState<GroupByStrategy>('domain');
  const [filterState, setFilterState] = React.useState<FilterState>(EMPTY_FILTER);

  const loadStatus = useFeatureLoadStatus();

  // Subscribe to catalog changes (Phase 4 register page hot-reloads here).
  const features = React.useSyncExternalStore(
    subscribeFeatures,
    () => getAllFeatures() as HermesFeature[],
    () => allFeatures,
  );

  if (loadStatus !== 'ready') {
    return <FeaturesUnavailable />;
  }

  const [sort, setSort] = React.useState<SortStrategy>('default');

  const driftedCount = React.useMemo(
    () => features.filter((f) => f.analytics.driftScore >= 0.4).length,
    [features],
  );
  const recentlyAddedCount = React.useMemo(() => {
    const now = new Date();
    return features.filter((f) => {
      if (!f.addedAt) return false;
      const d = new Date(f.addedAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [features]);

  const filtered = React.useMemo(() => applyFilter(features, filterState), [features, filterState]);
  const sorted = React.useMemo(() => sortFeatures(filtered, sort, USAGE_MAP), [filtered, sort]);
  const groups = React.useMemo(() => groupFeatures(sorted, groupBy), [sorted, groupBy]);
  const totalVisible = filtered.length;

  const onEntryPointClick = (key: EntryPointKey) => {
    if (key === 'register') return navigate('/feature-store/new');
    if (key === 'drift') {
      setFilterState({ ...filterState, driftedOnly: true });
      setSort('most-drifted');
      return;
    }
    if (key === 'recent') {
      setSort('recently-added');
      return;
    }
    if (key === 'domain') {
      setGroupBy('domain');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* ── Page header (compressed — breadcrumb owns title) ──────────────── */}
      <div style={{
        padding: '16px 40px 0',
        background: '#fff', borderBottom: `1px solid ${T.n200}`,
      }}>
        {/* Hairline StatStrip */}
        <StatStrip features={features} />

        {/* Entry-points strip — 28px chip row */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
          padding: '4px 0 12px',
        }}>
          {ENTRY_POINTS.map((ep) => {
            const active =
              (ep.key === 'domain' && groupBy === 'domain' && !filterState.driftedOnly) ||
              (ep.key === 'drift' && filterState.driftedOnly) ||
              (ep.key === 'recent' && sort === 'recently-added');
            const count =
              ep.key === 'drift' ? driftedCount
              : ep.key === 'recent' ? recentlyAddedCount
              : ep.key === 'domain' ? features.length
              : undefined;
            return (
              <button
                key={ep.key}
                onClick={() => onEntryPointClick(ep.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
                  height: 28, padding: '0 12px', borderRadius: 9999,
                  border: `1px solid ${active ? T.brand : T.n200}`,
                  background: active ? T.brandSoft : '#fff',
                  color: active ? T.brand : T.n700,
                  cursor: 'pointer',
                  transition: 'background .12s, color .12s, border-color .12s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = T.n300;
                    e.currentTarget.style.color = T.n900;
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = T.n200;
                    e.currentTarget.style.color = T.n700;
                  }
                }}
              >
                {ep.label}
                {count !== undefined && count > 0 && (
                  <span style={{
                    fontFamily: T.fMono, fontSize: 10, fontWeight: 600,
                    color: active ? T.brand : T.n500,
                  }}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body: filter rail + grouped list ──────────────────────────────── */}
      <div style={{ display: 'flex', padding: '24px 40px', gap: 0, alignItems: 'flex-start' }}>
        {/* Filter rail */}
        <FilterRail
          features={features}
          state={filterState}
          onChange={setFilterState}
        />

        {/* Main list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar: group-by + result count */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, gap: 12, flexWrap: 'wrap',
          }}>
            <GroupByControl value={groupBy} onChange={setGroupBy} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SortControl value={sort} onChange={setSort} />
              <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400 }}>
                {totalVisible} feature{totalVisible !== 1 ? 's' : ''}
                {totalVisible < features.length ? ` of ${features.length}` : ''}
              </span>
            </div>
          </div>

          {/* Groups */}
          {groups.length === 0 ? (
            <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n400, padding: '32px 0', textAlign: 'center' }}>
              No features match the current filters.
            </div>
          ) : (
            groups.map((group) => (
              <FeatureGroupSection
                key={group.groupName}
                groupName={group.groupName}
                features={group.features}
                usageMap={USAGE_MAP}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Group section component ──────────────────────────────────────────────────
interface FeatureGroupSectionProps {
  groupName: string;
  features: ReturnType<typeof groupFeatures>[number]['features'];
  usageMap: Map<string, FeatureUsage>;
}

const FeatureGroupSection: React.FC<FeatureGroupSectionProps> = ({
  groupName, features, usageMap,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Group header — serif italic title + small count, matches original v1 design */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: 'flex', alignItems: 'baseline', gap: 8, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px 10px',
        }}
      >
        <svg
          width={11} height={11} viewBox="0 0 24 24" fill="none"
          stroke={T.n500} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          style={{
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform .15s', flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: 18,
            fontWeight: 500,
            color: T.n900,
            letterSpacing: '-0.005em',
          }}
        >
          {groupName}
        </span>
        <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400 }}>
          {features.length}
        </span>
      </button>

      {/* Single bordered container — table-style. Per-row dividers handled by FeatureRowCard. */}
      {!collapsed && (
        <div
          style={{
            border: `1px solid ${T.n200}`,
            borderRadius: 10,
            background: '#fff',
            overflow: 'hidden',
          }}
        >
          {features.map((feature, idx) => (
            <FeatureRowCard
              key={feature.name}
              feature={feature}
              usage={usageMap.get(feature.name) ?? { segments: [], campaigns: [], segmentCount: 0, campaignCount: 0 }}
              isLast={idx === features.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
