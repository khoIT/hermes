/**
 * 4R inference — derive { tag, alignment } from playbook + intent.
 * Trivial: read from playbook. Fallback heuristic for unmatched intent.
 */
import type { FourRTag, Playbook, PlaybookId } from './compose-types';

const FALLBACK: Record<string, FourRTag> = {
  retain: '4r-retain',
  retention: '4r-retain',
  whale: '4r-revenue',
  spend: '4r-revenue',
  pay: '4r-revenue',
  lapsed: '4r-reactivate',
  dormant: '4r-reactivate',
  comeback: '4r-reactivate',
  new: '4r-recruit',
  onboard: '4r-recruit',
  ftue: '4r-recruit',
};

export function inferFourR(
  playbookId: PlaybookId | null,
  intent: string,
  playbooks: readonly Playbook[],
): { tag: FourRTag; alignment: number } {
  if (playbookId) {
    const pb = playbooks.find((p) => p.id === playbookId);
    if (pb) return pb.fourR;
  }
  const q = intent.toLowerCase();
  for (const [kw, tag] of Object.entries(FALLBACK)) {
    if (q.includes(kw)) return { tag, alignment: 0.6 };
  }
  return { tag: '4r-retain', alignment: 0.55 };
}
