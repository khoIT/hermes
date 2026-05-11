/**
 * Stable ids of every agent-first chat thread (Hermes-detected anomalies).
 * Surfaces the Deep Research toggle in chat input + gates deep-trace render.
 */
export const AGENT_FIRST_THREAD_IDS: ReadonlySet<string> = new Set([
  'thread-demo-agent-livops-2026',
  'thread-demo-agent-d7-fb-cohort-2026',
  'thread-demo-agent-whale-recall-2026',
]);

export function isAgentFirstThread(id: string | null | undefined): boolean {
  if (!id) return false;
  return AGENT_FIRST_THREAD_IDS.has(id);
}
