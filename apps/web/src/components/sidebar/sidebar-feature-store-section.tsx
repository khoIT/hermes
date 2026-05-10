/**
 * SidebarFeatureStoreSection — replaces the generic <RecentItems> for the
 * Feature Store section with a richer four-surface layout:
 *   ▸ Register feature (CTA)
 *   ▸ PINNED      (when any pins exist)
 *   ▸ YOU VIEWED  (when any view history exists)
 *   ▸ NEW THIS MONTH (features added this calendar month)
 *
 * All subsections render only when non-empty, so the section stays compact
 * for a fresh user. Stale pin IDs (renamed/deleted features) are silently
 * filtered against the live catalog at render time.
 */
import React from 'react';
import { Plus, Grid } from 'lucide-react';
import { SidebarSection } from './sidebar-section';
import { SidebarItem } from './sidebar-item';
import { SidebarSubheader } from './sidebar-subheader';
import { getRecent } from '../../utils/recent-items-store';
import { getPinned, subscribePinned } from '../../utils/pinned-features-store';
import { getAllFeatures, subscribeFeatures, allFeatures } from '../../data/catalog/features';
import type { HermesFeature } from '@hermes/contracts';

interface SidebarFeatureStoreSectionProps {
  collapsed?: boolean;
}

const MAX_PER_GROUP = 5;

function isAddedThisMonth(addedAt: string | undefined): boolean {
  if (!addedAt) return false;
  try {
    const d = new Date(addedAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  } catch {
    return false;
  }
}

export function SidebarFeatureStoreSection({ collapsed }: SidebarFeatureStoreSectionProps) {
  // Subscribe to feature catalog (hot-reloads when register flow runs).
  const features = React.useSyncExternalStore(
    subscribeFeatures,
    () => getAllFeatures() as HermesFeature[],
    () => allFeatures,
  );

  // Subscribe to pin store.
  const pinned = React.useSyncExternalStore(subscribePinned, getPinned, getPinned);

  // Recent-viewed (existing window-event pattern).
  const [recent, setRecent] = React.useState(() => getRecent('features'));
  React.useEffect(() => {
    const handler = () => setRecent(getRecent('features'));
    window.addEventListener('hermes:recent-changed', handler);
    return () => window.removeEventListener('hermes:recent-changed', handler);
  }, []);

  // Resolve names to live features; drop missing.
  const featureByName = React.useMemo(() => {
    const m = new Map<string, HermesFeature>();
    for (const f of features) m.set(f.name, f);
    return m;
  }, [features]);

  const pinnedItems = React.useMemo(
    () => pinned.map(n => featureByName.get(n)).filter((f): f is HermesFeature => !!f).slice(0, MAX_PER_GROUP),
    [pinned, featureByName],
  );

  const viewedItems = React.useMemo(
    () => recent.slice(0, MAX_PER_GROUP),
    [recent],
  );

  const newItems = React.useMemo(
    () => features
      .filter(f => isAddedThisMonth(f.addedAt))
      .slice()
      .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''))
      .slice(0, MAX_PER_GROUP),
    [features],
  );

  return (
    <SidebarSection
      id="features"
      icon={Grid}
      label="Feature Store"
      to="/feature-store"
      collapsed={collapsed}
    >
      {/* Register CTA — always visible */}
      <SidebarItem
        icon={Plus}
        label="Register feature"
        to="/feature-store/new"
        indent
        muted
      />

      {pinnedItems.length > 0 && (
        <>
          <SidebarSubheader>Pinned</SidebarSubheader>
          {pinnedItems.map(f => (
            <SidebarItem
              key={`pin-${f.name}`}
              label={f.name}
              to={`/feature-store/${encodeURIComponent(f.name)}`}
              indent
            />
          ))}
        </>
      )}

      {viewedItems.length > 0 && (
        <>
          <SidebarSubheader>You viewed</SidebarSubheader>
          {viewedItems.map(item => (
            <SidebarItem
              key={`view-${item.id}`}
              label={item.title}
              to={item.href ?? `/feature-store/${encodeURIComponent(item.id)}`}
              indent
            />
          ))}
        </>
      )}

      {newItems.length > 0 && (
        <>
          <SidebarSubheader>New this month</SidebarSubheader>
          {newItems.map(f => (
            <SidebarItem
              key={`new-${f.name}`}
              label={f.name}
              to={`/feature-store/${encodeURIComponent(f.name)}`}
              indent
            />
          ))}
        </>
      )}
    </SidebarSection>
  );
}
