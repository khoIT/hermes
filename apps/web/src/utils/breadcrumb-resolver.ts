/**
 * Pure breadcrumb resolver — maps a pathname to a list of breadcrumb crumbs.
 * Resolver receives `Getters` for catalog lookups so it can render display
 * names instead of raw IDs.
 */
import { matchPath } from 'react-router-dom';
import type { HermesFeature, HermesSegment, HermesCampaign } from '@hermes/contracts';
import type { Board } from '../api/boards-client';
import type { ThreadIndexEntry } from './chat-store';

export interface Crumb {
  label: string;
  to?: string;
}

export interface BreadcrumbGetters {
  getFeature: (name: string) => HermesFeature | undefined;
  getSegment: (id: string) => HermesSegment | undefined;
  getBoard: (id: string) => Board | undefined;
  getCampaign: (id: string) => HermesCampaign | undefined;
  getThread: (id: string) => ThreadIndexEntry | undefined;
}

type Params = Record<string, string | undefined>;
type Resolver = (params: Params, g: BreadcrumbGetters) => Crumb[];

const titleCase = (s: string) =>
  s.split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

const ROUTE_REGISTRY: Array<{ pattern: string; resolver: Resolver }> = [
  { pattern: '/',        resolver: () => [{ label: 'Home' }] },
  { pattern: '/welcome', resolver: () => [{ label: 'Welcome' }] },

  // Chat
  { pattern: '/chat',     resolver: () => [{ label: 'All Chats' }] },
  { pattern: '/chat/:id', resolver: ({ id }, g) => [
    { label: 'All Chats', to: '/chat' },
    { label: (id && g.getThread(id)?.title) || 'Conversation' },
  ]},

  // Feature Store
  { pattern: '/feature-store',       resolver: () => [{ label: 'Feature Store' }] },
  { pattern: '/feature-store/new',   resolver: () => [
    { label: 'Feature Store', to: '/feature-store' },
    { label: 'Register' },
  ]},
  { pattern: '/feature-store/:name', resolver: ({ name }, g) => {
    if (!name) return [{ label: 'Feature Store', to: '/feature-store' }];
    const f = g.getFeature(name);
    if (!f) return [{ label: 'Feature Store', to: '/feature-store' }, { label: name }];
    return [
      { label: 'Feature Store', to: '/feature-store' },
      { label: titleCase(f.domain), to: `/feature-store?group=${encodeURIComponent(f.domain)}` },
      { label: f.displayName ?? f.name },
    ];
  }},

  // Boards / Canvas
  { pattern: '/canvas',          resolver: () => [{ label: 'Boards' }] },
  { pattern: '/canvas/:boardId', resolver: ({ boardId }, g) => [
    { label: 'Boards', to: '/canvas' },
    { label: (boardId && g.getBoard(boardId)?.name) || boardId || 'Board' },
  ]},

  // Segments
  { pattern: '/segments',                 resolver: () => [{ label: 'Segments' }] },
  { pattern: '/segments/new',             resolver: () => [
    { label: 'Segments', to: '/segments' },
    { label: 'New' },
  ]},
  { pattern: '/segments/patterns',        resolver: () => [
    { label: 'Segments', to: '/segments' },
    { label: 'Patterns' },
  ]},
  { pattern: '/segments/:id',             resolver: ({ id }, g) => [
    { label: 'Segments', to: '/segments' },
    { label: (id && g.getSegment(id)?.displayName) || id || 'Segment' },
  ]},
  { pattern: '/segments/:id/:tab',        resolver: ({ id, tab }, g) => [
    { label: 'Segments', to: '/segments' },
    { label: (id && g.getSegment(id)?.displayName) || id || 'Segment',
      to: id ? `/segments/${id}` : undefined },
    { label: tab ? titleCase(tab) : '' },
  ]},

  // Campaigns
  { pattern: '/campaigns',                    resolver: () => [{ label: 'Campaigns' }] },
  { pattern: '/campaigns/patterns',           resolver: () => [
    { label: 'Campaigns', to: '/campaigns' },
    { label: 'Patterns' },
  ]},
  { pattern: '/campaigns/new/:trigger',       resolver: ({ trigger }) => [
    { label: 'Campaigns', to: '/campaigns' },
    { label: 'New' },
    { label: trigger ? titleCase(trigger) : '' },
  ]},
  { pattern: '/campaigns/:id',                resolver: ({ id }, g) => [
    { label: 'Campaigns', to: '/campaigns' },
    { label: (id && g.getCampaign(id)?.displayName) || id || 'Campaign' },
  ]},
  { pattern: '/campaigns/:id/:tab',           resolver: ({ id, tab }, g) => [
    { label: 'Campaigns', to: '/campaigns' },
    { label: (id && g.getCampaign(id)?.displayName) || id || 'Campaign',
      to: id ? `/campaigns/${id}` : undefined },
    { label: tab ? titleCase(tab) : '' },
  ]},

  // Stub modules
  { pattern: '/playbooks',  resolver: () => [{ label: 'Playbooks' }] },
  { pattern: '/funnels',    resolver: () => [{ label: 'Funnels' }] },
  { pattern: '/retentions', resolver: () => [{ label: 'Retentions' }] },
  { pattern: '/knowledge',  resolver: () => [{ label: 'Knowledge' }] },
  { pattern: '/explore',    resolver: () => [{ label: 'Explore' }] },
  { pattern: '/data',       resolver: () => [{ label: 'Data' }] },
  { pattern: '/settings',   resolver: () => [{ label: 'Settings' }] },
  { pattern: '/account',    resolver: () => [{ label: 'Account' }] },
];

export function resolveBreadcrumb(pathname: string, getters: BreadcrumbGetters): Crumb[] {
  for (const { pattern, resolver } of ROUTE_REGISTRY) {
    const m = matchPath(pattern, pathname);
    if (m) return resolver(m.params as Params, getters);
  }
  // Fallback — titlecase first segment.
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg ? [{ label: titleCase(seg) }] : [{ label: 'Home' }];
}
