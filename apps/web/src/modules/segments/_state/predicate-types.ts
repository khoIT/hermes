/**
 * Predicate AST types for the segment authoring canvas.
 * AND-of-OR-groups model: groups are AND'd; rows within a group are OR'd;
 * exclusions are AND NOT'd to the entire predicate.
 * Per PRD §8.3 and phase-07 spec.
 */

/** Supported operators per feature type */
export type Operator =
  | '>=' | '<=' | '>' | '<' | '=' | '!='
  | 'in' | 'not_in'
  | 'contains_any' | 'contains_all'
  | 'between'
  | 'is_true' | 'is_false';

/** One condition row in a group */
export interface Row {
  id: string;
  feature: string;   // snake_case feature name
  operator: Operator;
  value: unknown;    // string | number | number[] | string[]
}

/** One match group — rows joined by `mode` ('any' = OR · 'all' = AND).
 *  Per PRD §8.3, Group 1 typically OR's broad-net signals; Group 2+ AND's restrictions.
 *  Optional for backward compat — read via `groupMode(g)` helper to default to 'all'. */
export interface MatchGroup {
  id: string;
  rows: Row[];
  mode?: 'any' | 'all';
}

/** Read group mode with safe default — Group 1 OR'd, others AND'd by convention. */
export function groupMode(g: MatchGroup): 'any' | 'all' {
  return g.mode ?? 'all';
}

/** Top-level predicate AST */
export interface Predicate {
  groups: MatchGroup[];
  exclusions: Row[];
}

/** Audience lookup result */
export interface AudienceLookup {
  count: number;
  percentMau: number;
  percentSubpop: number;
  subpopLabel: string;
  estimated: boolean;
  breakdown?: {
    lifecycle: Array<{ label: string; fraction: number }>;
    spendTier: Array<{ label: string; fraction: number }>;
  };
}

/** Default operator for feature type */
export function defaultOperator(featureType: string): Operator {
  switch (featureType) {
    case 'bool': return 'is_true';
    case 'enum': return '=';
    case 'string': return '=';
    case 'array': return 'contains_any';
    case 'timestamp': return '>=';
    default: return '>='; // int, float
  }
}

/** Default value placeholder for a given operator */
export function defaultValue(op: Operator): unknown {
  if (op === 'is_true') return true;
  if (op === 'is_false') return false;
  if (op === 'between') return [0, 10];
  if (op === 'in' || op === 'not_in') return [];
  if (op === 'contains_any' || op === 'contains_all') return [];
  return 0;
}

/** Generate a short random ID */
export function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Build an empty row with a given feature */
export function makeRow(feature: string, featureType = 'int'): Row {
  const op = defaultOperator(featureType);
  return { id: makeId(), feature, operator: op, value: defaultValue(op) };
}

/** Build an empty group with one row */
export function makeGroup(feature?: string, featureType?: string, mode: 'any' | 'all' = 'all'): MatchGroup {
  return {
    id: makeId(),
    rows: feature ? [makeRow(feature, featureType)] : [makeRow('account_age_days')],
    mode,
  };
}

/** Empty predicate */
export function emptyPredicate(): Predicate {
  return { groups: [], exclusions: [] };
}
