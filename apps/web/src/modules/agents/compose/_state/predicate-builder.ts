/**
 * Predicate builder — approved features → query-svc /audience/count predicate.
 * Maps internal threshold ops to query-svc leaf ops (gt|lt|gte|lte|eq|in).
 */
import type { ApprovedFeatureRow, ProposedFeatureRow } from './compose-types';

type LeafOp = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'in';

export interface QueryPredicate {
  all: { leaf: { feature: string; op: LeafOp; value: number | string | string[] } }[];
}

const OP_MAP: Record<string, LeafOp> = {
  '>': 'gt', '<': 'lt', '>=': 'gte', '<=': 'lte', '=': 'eq',
};

function mapLeaf(row: ProposedFeatureRow | ApprovedFeatureRow): QueryPredicate['all'][number] | null {
  const t = row.threshold;
  if (t.op === 'is_false') {
    return { leaf: { feature: row.featureId, op: 'eq', value: 'false' } };
  }
  if (t.op === 'is_true') {
    return { leaf: { feature: row.featureId, op: 'eq', value: 'true' } };
  }
  const op = OP_MAP[t.op];
  if (!op) return null;
  if (typeof t.value === 'boolean') {
    return { leaf: { feature: row.featureId, op: 'eq', value: t.value ? 'true' : 'false' } };
  }
  return { leaf: { feature: row.featureId, op, value: t.value } };
}

export function buildPredicate(rows: readonly (ProposedFeatureRow | ApprovedFeatureRow)[]): QueryPredicate | null {
  const leaves = rows.map(mapLeaf).filter((x): x is QueryPredicate['all'][number] => x !== null);
  if (leaves.length === 0) return null;
  return { all: leaves };
}
