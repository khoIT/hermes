/**
 * Keyword matcher — free-text intent → PlaybookId or null.
 * Tie-break by keyword hit count (higher wins). Pure function.
 */
import type { Playbook, PlaybookId } from './compose-types';

export function matchPlaybook(intent: string, playbooks: readonly Playbook[]): PlaybookId | null {
  const q = intent.toLowerCase();
  if (q.trim() === '') return null;

  let best: { id: PlaybookId; hits: number } | null = null;
  for (const pb of playbooks) {
    const hits = pb.keywords.reduce((n, kw) => (q.includes(kw.toLowerCase()) ? n + 1 : n), 0);
    if (hits === 0) continue;
    if (!best || hits > best.hits) best = { id: pb.id, hits };
  }
  return best?.id ?? null;
}
