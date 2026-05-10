/**
 * page-context-resolver — pathname → PageContext for the chat rail's
 * page-context chip. Mirrors the breadcrumb-resolver registry pattern so
 * a single change of route shape updates both surfaces.
 *
 * Returns null for non-detail pages so the rail input shows no chip.
 */
import { matchPath } from 'react-router-dom';
import type { HermesFeature, HermesSegment, HermesCampaign } from '@hermes/contracts';
import type { Board } from '../api/boards-client';

export type PageContextKind = 'feature' | 'segment' | 'board' | 'campaign';

export interface PageContext {
  kind: PageContextKind;
  /** Display label in the chip ("Feature · {displayName or name}"). */
  label: string;
  /** Stable id for dismiss-state and linking. */
  entityId: string;
}

export interface ContextGetters {
  getFeature: (name: string) => HermesFeature | undefined;
  getSegment: (id: string) => HermesSegment | undefined;
  getBoard: (id: string) => Board | undefined;
  getCampaign: (id: string) => HermesCampaign | undefined;
}

type Params = Record<string, string | undefined>;
type Resolver = (params: Params, g: ContextGetters) => PageContext | null;

const REGISTRY: Array<{ pattern: string; resolver: Resolver }> = [
  {
    pattern: '/feature-store/:name',
    resolver: ({ name }, g) => {
      if (!name) return null;
      const f = g.getFeature(name);
      const display = f?.displayName ?? name;
      return { kind: 'feature', label: `Feature · ${display}`, entityId: name };
    },
  },
  {
    pattern: '/segments/:id',
    resolver: ({ id }, g) => {
      if (!id) return null;
      const s = g.getSegment(id);
      const display = s?.displayName ?? id;
      return { kind: 'segment', label: `Segments · ${display}`, entityId: id };
    },
  },
  {
    pattern: '/segments/:id/:tab',
    resolver: ({ id }, g) => {
      if (!id) return null;
      const s = g.getSegment(id);
      const display = s?.displayName ?? id;
      return { kind: 'segment', label: `Segments · ${display}`, entityId: id };
    },
  },
  {
    pattern: '/canvas/:boardId',
    resolver: ({ boardId }, g) => {
      if (!boardId) return null;
      const b = g.getBoard(boardId);
      const display = b?.name ?? boardId;
      return { kind: 'board', label: `Board · ${display}`, entityId: boardId };
    },
  },
  {
    pattern: '/campaigns/:id',
    resolver: ({ id }, g) => {
      if (!id) return null;
      const c = g.getCampaign(id);
      const display = c?.displayName ?? id;
      return { kind: 'campaign', label: `Campaigns · ${display}`, entityId: id };
    },
  },
  {
    pattern: '/campaigns/:id/:tab',
    resolver: ({ id }, g) => {
      if (!id) return null;
      const c = g.getCampaign(id);
      const display = c?.displayName ?? id;
      return { kind: 'campaign', label: `Campaigns · ${display}`, entityId: id };
    },
  },
];

export function resolvePageContext(pathname: string, getters: ContextGetters): PageContext | null {
  for (const { pattern, resolver } of REGISTRY) {
    const m = matchPath(pattern, pathname);
    if (m) return resolver(m.params as Params, getters);
  }
  return null;
}
