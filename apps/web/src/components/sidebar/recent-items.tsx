/**
 * RecentItems — renders a module's recent entries from localStorage as
 * indented sidebar sub-rows, capped at 4 visible + a "See all..." link.
 */
import React from 'react';
import { SidebarItem } from './sidebar-item';
import { ChatContextMenu } from './chat-context-menu';
import { getRecent, type RecentModule } from '../../utils/recent-items-store';

interface RecentItemsProps {
  module: RecentModule;
  /** Module landing route (where "See all..." goes). */
  seeAllTo: string;
  /** How to construct an item href; defaults to `${seeAllTo}/${id}`. */
  hrefFor?: (id: string) => string;
  /** Visible item cap (default 4). */
  visible?: number;
}

export function RecentItems({ module, seeAllTo, hrefFor, visible = 4 }: RecentItemsProps) {
  // Re-read on render — sidebar mounts once, so we expose a cheap re-fetch
  // hook via window event for other code paths to trigger.
  const [items, setItems] = React.useState(() => getRecent(module));

  React.useEffect(() => {
    const handler = () => setItems(getRecent(module));
    window.addEventListener('hermes:recent-changed', handler);
    return () => window.removeEventListener('hermes:recent-changed', handler);
  }, [module]);

  if (items.length === 0) {
    return (
      <SidebarItem
        label="No recent items"
        to={seeAllTo}
        indent
        muted
      />
    );
  }

  const shown = items.slice(0, visible);
  return (
    <>
      {shown.map(item => (
        <SidebarItem
          key={item.id}
          label={item.title}
          to={item.href ?? hrefFor?.(item.id) ?? `${seeAllTo}/${item.id}`}
          indent
          trailing={module === 'chats' ? (
            <ChatContextMenu threadId={item.id} threadTitle={item.title} />
          ) : undefined}
        />
      ))}
      {items.length > visible && (
        <SidebarItem
          label={`See all... (${items.length})`}
          to={seeAllTo}
          indent
          muted
        />
      )}
    </>
  );
}

/** Helper for callers — fire after pushRecent so open sidebars refresh. */
export function notifyRecentChanged() {
  window.dispatchEvent(new CustomEvent('hermes:recent-changed'));
}
