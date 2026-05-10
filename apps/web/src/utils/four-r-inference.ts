/**
 * four-r-inference — keyword-based 4R goal classifier.
 * Maps response text to the highest-frequency 4R goal bucket.
 * Returns null on zero matches or a tie between two goals.
 */

export type Goal4R = 'retain' | 'revenue' | 'reactivate' | 'recruit';

const KEYWORD_MAP: Record<Goal4R, string[]> = {
  retain:     ['churn', 'retention', 'lapsed', 'dormant', 'loss streak', 'frustration'],
  revenue:    ['arpdau', 'spend', 'whale', 'monetiz', 'iap', 'vip', 'gem', 'purchase'],
  reactivate: ['reactivat', 'comeback', 'win-back', 'winback', 'recall', 'return'],
  recruit:    ['onboard', 'ftue', 'first-time', 'first time', 'new user', 'install'],
};

/**
 * Infer the dominant 4R goal from a block of text.
 * Returns the highest-count match; null on tie or zero hits.
 */
export function inferGoal4R(text: string): Goal4R | null {
  const lower = text.toLowerCase();
  const scores: Record<Goal4R, number> = {
    retain: 0, revenue: 0, reactivate: 0, recruit: 0,
  };

  for (const [goal, keywords] of Object.entries(KEYWORD_MAP) as [Goal4R, string[]][]) {
    for (const kw of keywords) {
      // Count all occurrences of keyword in text
      let pos = 0;
      while ((pos = lower.indexOf(kw, pos)) !== -1) {
        scores[goal]++;
        pos += kw.length;
      }
    }
  }

  const entries = Object.entries(scores) as [Goal4R, number][];
  const max = Math.max(...entries.map(([, v]) => v));
  if (max === 0) return null;

  const winners = entries.filter(([, v]) => v === max);
  if (winners.length !== 1) return null; // tie or empty → null

  const winner = winners[0];
  return winner ? winner[0] : null;
}
