/**
 * Derive the current artifact context from the URL.
 * Used by Ask Hermes panel to inject "Context: <name>" prefix.
 */
import { useLocation } from 'react-router-dom';
import type { PageContext } from './panel-store';

export function useCurrentPageContext(): PageContext {
  const { pathname } = useLocation();
  // /segments/:id, /campaigns/:id, /feature-store/:name, /canvas/:boardId
  const m = (re: RegExp) => re.exec(pathname);

  let match;
  if ((match = m(/^\/segments\/([^/]+)\/?/))) {
    return { type: 'segment', id: match[1], name: match[1] };
  }
  if ((match = m(/^\/campaigns\/([^/]+)\/?/))) {
    return { type: 'campaign', id: match[1], name: match[1] };
  }
  if ((match = m(/^\/feature-store\/([^/]+)\/?/))) {
    return { type: 'feature', id: match[1], name: match[1] };
  }
  if ((match = m(/^\/canvas\/([^/]+)\/?/))) {
    return { type: 'board', id: match[1], name: match[1] };
  }
  return { type: null };
}

export function describeContext(ctx: PageContext): string | null {
  if (!ctx.type || !ctx.name) return null;
  return `Context: ${ctx.name} (${ctx.type})`;
}

/** Routes where the FAB should be hidden. */
export function shouldHideFab(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname.startsWith('/chat/')) return true;
  if (pathname === '/chat') return true;
  if (pathname === '/welcome') return true;
  return false;
}
