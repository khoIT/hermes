/**
 * Predicate AST → Postgres SQL translator for `feature_values`.
 *
 * AST shape:
 *   leaf  : { feature, op, value }
 *   all   : Predicate[]   → uids matching every child
 *   any   : Predicate[]   → uids matching any child
 *   not   : Predicate     → all uids minus children
 *
 * Each predicate compiles to a query yielding a set of uids. INTERSECT /
 * UNION / EXCEPT compose them. Returns { text, params } for direct use
 * with pg.Pool.query() — no Drizzle dependency.
 */

export type LeafOp = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'in';

export type Predicate =
  | { all:  Predicate[] }
  | { any:  Predicate[] }
  | { not:  Predicate }
  | { leaf: { feature: string; op: LeafOp; value: number | string | string[] } };

export type CompiledQuery = { text: string; params: unknown[] };

export function validatePredicate(p: Predicate): void {
  if ('leaf' in p) {
    if (typeof p.leaf.feature !== 'string') throw new Error('leaf.feature must be a string');
    if (!['gt', 'lt', 'gte', 'lte', 'eq', 'in'].includes(p.leaf.op)) {
      throw new Error(`unsupported op: ${p.leaf.op}`);
    }
    if (p.leaf.op === 'in' && !Array.isArray(p.leaf.value)) {
      throw new Error(`op 'in' requires value to be an array`);
    }
    if (p.leaf.op !== 'in' && p.leaf.op !== 'eq' && typeof p.leaf.value !== 'number') {
      throw new Error(`op '${p.leaf.op}' requires numeric value`);
    }
    return;
  }
  if ('all' in p) {
    if (!Array.isArray(p.all) || p.all.length === 0) throw new Error('all[] must be non-empty');
    p.all.forEach(validatePredicate);
    return;
  }
  if ('any' in p) {
    if (!Array.isArray(p.any) || p.any.length === 0) throw new Error('any[] must be non-empty');
    p.any.forEach(validatePredicate);
    return;
  }
  if ('not' in p) {
    validatePredicate(p.not);
    return;
  }
  throw new Error('predicate must have exactly one of: leaf | all | any | not');
}

class ParamBag {
  private bag: unknown[] = [];
  push(v: unknown): string {
    this.bag.push(v);
    return `$${this.bag.length}`;
  }
  values(): unknown[] {
    return this.bag;
  }
}

function translateLeaf(p: Extract<Predicate, { leaf: unknown }>, params: ParamBag): string {
  const { feature, op, value } = p.leaf;
  const featTok = params.push(feature);
  if (op === 'in') {
    const placeholders = (value as string[]).map((v) => params.push(v)).join(', ');
    return `(SELECT uid FROM feature_values WHERE feature_name = ${featTok} AND value_text IN (${placeholders}))`;
  }
  if (op === 'eq') {
    const tok = params.push(String(value));
    return `(SELECT uid FROM feature_values WHERE feature_name = ${featTok} AND (value_text = ${tok} OR value_numeric::text = ${tok}))`;
  }
  const numTok = params.push(Number(value));
  const cmp = op === 'gt' ? '>' : op === 'gte' ? '>=' : op === 'lt' ? '<' : '<=';
  return `(SELECT uid FROM feature_values WHERE feature_name = ${featTok} AND value_numeric ${cmp} ${numTok})`;
}

function translate(p: Predicate, params: ParamBag): string {
  if ('leaf' in p) return translateLeaf(p, params);
  if ('all' in p) {
    if (p.all.length === 1) return translate(p.all[0], params);
    return `(${p.all.map((c) => translate(c, params)).join(' INTERSECT ')})`;
  }
  if ('any' in p) {
    if (p.any.length === 1) return translate(p.any[0], params);
    return `(${p.any.map((c) => translate(c, params)).join(' UNION ')})`;
  }
  if ('not' in p) {
    return `((SELECT DISTINCT uid FROM feature_values) EXCEPT ${translate(p.not, params)})`;
  }
  throw new Error('unreachable');
}

export function buildCountQuery(p: Predicate, sampleLimit: number): CompiledQuery {
  validatePredicate(p);
  const params = new ParamBag();
  const inner = translate(p, params);
  const limitTok = params.push(sampleLimit);
  const text = `
    WITH matched AS ${inner}
    SELECT
      (SELECT COUNT(*)::bigint FROM matched) AS count,
      (SELECT array_agg(uid) FROM (SELECT uid FROM matched LIMIT ${limitTok}) s) AS sample_uids
  `;
  return { text, params: params.values() };
}
