/**
 * Intent matcher — keyword scoring, returns highest-matching intent id or null.
 * Plain string tokenization; case-insensitive. Tie-break by total keyword count
 * (more keywords matched wins). No external NLP.
 */
import { INTENTS, type Intent } from '../data/chat/intents';

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9$\-_ ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  );
}

export function matchIntent(text: string): Intent | null {
  if (!text.trim()) return null;
  const tokens = tokenize(text);
  let best: { intent: Intent; score: number; matched: number } | null = null;

  for (const intent of INTENTS) {
    let matched = 0;
    let score = 0;
    for (const kw of intent.keywords) {
      // Multi-word keywords: check substring match
      if (kw.includes(' ') || kw.includes('-')) {
        if (text.toLowerCase().includes(kw.toLowerCase())) {
          matched += 1;
          score += 2; // multi-word matches weight more
        }
        continue;
      }
      if (tokens.has(kw.toLowerCase())) {
        matched += 1;
        score += 1;
      }
    }
    if (matched === 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && matched > best.matched)
    ) {
      best = { intent, score, matched };
    }
  }
  return best?.intent ?? null;
}
