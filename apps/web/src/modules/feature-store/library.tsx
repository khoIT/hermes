/**
 * 01 — Feature Store Library (fs_library)
 * Groupable + filterable catalog over all 73 Hermes features.
 * Per PRD §6.1 spec.
 */
import React from 'react';
import { T, Button } from '../../theme';
import { allFeatures } from '../../data/catalog/features/index';
import { allSegments } from '../../data/catalog/segments';
import { allCampaigns } from '../../data/catalog/campaigns';
import { StatStrip } from './_components/stat-strip';
import { FilterRail } from './_components/filter-rail';
import { GroupByControl } from './_components/group-by-control';
import { FeatureRowCard } from './_components/feature-row-card';
import { groupFeatures, type GroupByStrategy } from './_logic/group';
import { applyFilter, EMPTY_FILTER, type FilterState } from './_logic/filter';
import { computeUsageCounts } from './_logic/usage-count';
import type { FeatureUsage } from './_logic/usage-count';

// ── Precompute usage map at module load (stable across renders) ──────────────
const USAGE_MAP = computeUsageCounts(allFeatures, allSegments, allCampaigns);

// ── Entry-points strip CTAs ──────────────────────────────────────────────────
const ENTRY_POINTS = [
  { label: 'Browse by domain', active: true },
  { label: 'Register a new feature', active: false },
  { label: 'Recently added', active: false },
  { label: 'Drift detected', active: false, badge: '2' },
];

export default function FeatureStoreLibraryPage() {
  const [groupBy, setGroupBy] = React.useState<GroupByStrategy>('domain');
  const [filterState, setFilterState] = React.useState<FilterState>(EMPTY_FILTER);

  // Apply filter then group
  const filtered = React.useMemo(
    () => applyFilter(allFeatures, filterState),
    [filterState],
  );

  const groups = React.useMemo(
    () => groupFeatures(filtered, groupBy),
    [filtered, groupBy],
  );

  const totalVisible = filtered.length;

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '28px 40px 0',
        background: '#fff', borderBottom: `1px solid ${T.n200}`,
      }}>
        <div style={{
          fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
        }}>
          01 · Feature Store
        </div>
        <div style={{
          fontFamily: T.fDisp, fontSize: 44, textTransform: 'uppercase',
          color: T.n950, lineHeight: 0.95, marginBottom: 12,
        }}>
          Feature Store
        </div>
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 16, maxWidth: 560 }}>
          The Semantic Management Layer — {allFeatures.length} features compiled once,
          materialised across Substrate A (TEE real-time) and Substrate B (Hatchet/Iceberg batch).
        </p>

        {/* Stat strip */}
        <StatStrip features={allFeatures} />

        {/* Entry-points strip */}
        <div style={{
          display: 'flex', gap: 4, paddingBottom: 0, marginTop: 4,
          borderTop: `1px solid ${T.n100}`, paddingTop: 12,
        }}>
          {ENTRY_POINTS.map((ep) => (
            <div key={ep.label} style={{ position: 'relative' }}>
              <button
                style={{
                  fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
                  color: ep.active ? T.brand : T.n600,
                  background: 'none', border: 'none', cursor: ep.active ? 'default' : 'pointer',
                  padding: '6px 14px 10px',
                  borderBottom: ep.active ? `2px solid ${T.brand}` : '2px solid transparent',
                  transition: 'color .12s, border-color .12s',
                }}
              >
                {ep.label}
                {ep.badge && (
                  <span style={{
                    marginLeft: 6, fontFamily: T.fMono, fontSize: 10, fontWeight: 700,
                    background: '#fee2e2', color: T.red600,
                    padding: '1px 5px', borderRadius: 9999,
                  }}>
                    {ep.badge}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body: filter rail + grouped list ──────────────────────────────── */}
      <div style={{ display: 'flex', padding: '24px 40px', gap: 0, alignItems: 'flex-start' }}>
        {/* Filter rail */}
        <FilterRail
          features={allFeatures}
          state={filterState}
          onChange={setFilterState}
        />

        {/* Main list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar: group-by + result count */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <GroupByControl value={groupBy} onChange={setGroupBy} />
            <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400 }}>
              {totalVisible} feature{totalVisible !== 1 ? 's' : ''}
              {totalVisible < allFeatures.length ? ` of ${allFeatures.length}` : ''}
            </span>
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
    <div style={{ marginBottom: 24 }}>
      {/* Group header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px',
          borderBottom: `1px solid ${T.n200}`, marginBottom: 8,
        }}
      >
        <svg
          width={12} height={12} viewBox="0 0 24 24" fill="none"
          stroke={T.n500} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span style={{ fontFamily: T.fSans, fontSize: 12, fontWeight: 700, color: T.n700 }}>
          {groupName}
        </span>
        <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n400 }}>
          {features.length}
        </span>
      </button>

      {/* Feature rows */}
      {!collapsed && features.map((feature, idx) => (
        <FeatureRowCard
          key={feature.name}
          feature={feature}
          usage={usageMap.get(feature.name) ?? { segments: [], campaigns: [], segmentCount: 0, campaignCount: 0 }}
          index={idx}
        />
      ))}
    </div>
  );
};
