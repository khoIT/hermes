/**
 * Canvas reducer — useReducer state for the segment authoring canvas.
 * Owns: predicate AST, intent text, UI state (open pickers, active playground row).
 * Audience lookup is computed from predicate on every relevant action.
 *
 * Per phase-07 spec: useReducer, NOT context/external store — keep simple.
 */
import {
  type Predicate, type MatchGroup, type Row, type AudienceLookup,
  makeId, makeGroup, makeRow, emptyPredicate, defaultOperator, defaultValue,
} from './predicate-types';
import { lookupAudience } from './audience-lookup';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export interface CanvasState {
  predicate: Predicate;
  intent: string;
  intentCollapsed: boolean;
  audience: AudienceLookup;
  /** ID of the row currently showing the threshold playground */
  activePlaygroundRowId: string | null;
  /** ID of the row currently showing the swap popover */
  activeSwapRowId: string | null;
  /** Which slide-in picker is open */
  openPicker: 'condition' | 'exclusion' | 'or-row' | null;
  /** Group ID targeted by the or-row picker */
  pickerTargetGroupId: string | null;
  /** Whether the handoff modal is open */
  handoffOpen: boolean;
  /** Minted segment ID (set when Build is clicked) */
  mintedSegmentId: string | null;
  /** True when canvas was opened from an agent draft */
  fromDraft: boolean;
  draftId: string | null;
}

function computeAudience(predicate: Predicate): AudienceLookup {
  return lookupAudience(predicate);
}

export function initialState(opts?: {
  seedFeature?: string;
  seedFeatureType?: string;
  fromDraft?: boolean;
  draftId?: string;
  draftPredicate?: Predicate;
}): CanvasState {
  let predicate: Predicate;
  if (opts?.draftPredicate) {
    predicate = opts.draftPredicate;
  } else if (opts?.seedFeature) {
    predicate = {
      groups: [makeGroup(opts.seedFeature, opts.seedFeatureType ?? 'int', 'any')],
      exclusions: [],
    };
  } else {
    predicate = emptyPredicate();
  }

  return {
    predicate,
    intent: '',
    intentCollapsed: predicate.groups.length > 0,
    audience: computeAudience(predicate),
    activePlaygroundRowId: null,
    activeSwapRowId: null,
    openPicker: null,
    pickerTargetGroupId: null,
    handoffOpen: false,
    mintedSegmentId: null,
    fromDraft: opts?.fromDraft ?? false,
    draftId: opts?.draftId ?? null,
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
export type CanvasAction =
  | { type: 'ADD_GROUP' }
  | { type: 'REMOVE_GROUP'; groupId: string }
  | { type: 'ADD_ROW'; groupId: string; feature: string; featureType?: string }
  | { type: 'REMOVE_ROW'; groupId: string; rowId: string }
  | { type: 'SET_ROW_FEATURE'; groupId: string; rowId: string; feature: string; featureType?: string }
  | { type: 'SET_ROW_OPERATOR'; groupId: string; rowId: string; operator: Row['operator'] }
  | { type: 'SET_ROW_VALUE'; groupId: string; rowId: string; value: unknown }
  | { type: 'SET_THRESHOLD'; groupId: string; rowId: string; value: number }
  | { type: 'ADD_EXCLUSION'; feature: string; featureType?: string }
  | { type: 'REMOVE_EXCLUSION'; rowId: string }
  | { type: 'SET_EXCLUSION_VALUE'; rowId: string; value: unknown }
  | { type: 'SET_INTENT'; intent: string }
  | { type: 'TOGGLE_INTENT_COLLAPSED' }
  | { type: 'OPEN_PLAYGROUND'; rowId: string }
  | { type: 'CLOSE_PLAYGROUND' }
  | { type: 'OPEN_SWAP'; rowId: string }
  | { type: 'CLOSE_SWAP' }
  | { type: 'OPEN_PICKER'; picker: 'condition' | 'exclusion' | 'or-row'; groupId?: string }
  | { type: 'CLOSE_PICKER' }
  | { type: 'OPEN_HANDOFF' }
  | { type: 'CLOSE_HANDOFF' }
  | { type: 'SET_GROUP_MODE'; groupId: string; mode: 'any' | 'all' }
  | { type: 'SET_PREDICATE'; predicate: Predicate };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'ADD_GROUP': {
      const newGroup = makeGroup();
      const predicate: Predicate = {
        ...state.predicate,
        groups: [...state.predicate.groups, newGroup],
      };
      return { ...state, predicate, audience: computeAudience(predicate) };
    }

    case 'REMOVE_GROUP': {
      const predicate: Predicate = {
        ...state.predicate,
        groups: state.predicate.groups.filter(g => g.id !== action.groupId),
      };
      return { ...state, predicate, audience: computeAudience(predicate) };
    }

    case 'ADD_ROW': {
      const row = makeRow(action.feature, action.featureType);
      const predicate: Predicate = {
        ...state.predicate,
        groups: state.predicate.groups.map(g =>
          g.id === action.groupId ? { ...g, rows: [...g.rows, row] } : g,
        ),
      };
      return { ...state, predicate, audience: computeAudience(predicate), openPicker: null };
    }

    case 'REMOVE_ROW': {
      const predicate: Predicate = {
        ...state.predicate,
        groups: state.predicate.groups.reduce<MatchGroup[]>((acc, g) => {
          if (g.id !== action.groupId) { acc.push(g); return acc; }
          const rows = g.rows.filter(r => r.id !== action.rowId);
          // Remove group entirely if it becomes empty
          if (rows.length > 0) acc.push({ ...g, rows });
          return acc;
        }, []),
      };
      return { ...state, predicate, audience: computeAudience(predicate) };
    }

    case 'SET_ROW_FEATURE': {
      const featureType = action.featureType ?? 'int';
      const op = defaultOperator(featureType);
      const predicate: Predicate = {
        ...state.predicate,
        groups: state.predicate.groups.map(g =>
          g.id !== action.groupId ? g : {
            ...g,
            rows: g.rows.map(r =>
              r.id !== action.rowId ? r : {
                ...r,
                feature: action.feature,
                operator: op,
                value: defaultValue(op),
              },
            ),
          },
        ),
      };
      return {
        ...state,
        predicate,
        audience: computeAudience(predicate),
        activeSwapRowId: null,
      };
    }

    case 'SET_ROW_OPERATOR': {
      const predicate: Predicate = {
        ...state.predicate,
        groups: state.predicate.groups.map(g =>
          g.id !== action.groupId ? g : {
            ...g,
            rows: g.rows.map(r =>
              r.id !== action.rowId ? r : {
                ...r,
                operator: action.operator,
                value: defaultValue(action.operator),
              },
            ),
          },
        ),
      };
      return { ...state, predicate, audience: computeAudience(predicate) };
    }

    case 'SET_ROW_VALUE':
    case 'SET_THRESHOLD': {
      const predicate: Predicate = {
        ...state.predicate,
        groups: state.predicate.groups.map(g =>
          g.id !== action.groupId ? g : {
            ...g,
            rows: g.rows.map(r =>
              r.id !== action.rowId ? r : { ...r, value: action.value },
            ),
          },
        ),
      };
      return { ...state, predicate, audience: computeAudience(predicate) };
    }

    case 'ADD_EXCLUSION': {
      const row = makeRow(action.feature, action.featureType);
      const predicate: Predicate = {
        ...state.predicate,
        exclusions: [...state.predicate.exclusions, row],
      };
      return { ...state, predicate, audience: computeAudience(predicate), openPicker: null };
    }

    case 'REMOVE_EXCLUSION': {
      const predicate: Predicate = {
        ...state.predicate,
        exclusions: state.predicate.exclusions.filter(r => r.id !== action.rowId),
      };
      return { ...state, predicate, audience: computeAudience(predicate) };
    }

    case 'SET_EXCLUSION_VALUE': {
      const predicate: Predicate = {
        ...state.predicate,
        exclusions: state.predicate.exclusions.map(r =>
          r.id !== action.rowId ? r : { ...r, value: action.value },
        ),
      };
      return { ...state, predicate, audience: computeAudience(predicate) };
    }

    case 'SET_INTENT':
      return { ...state, intent: action.intent };

    case 'TOGGLE_INTENT_COLLAPSED':
      return { ...state, intentCollapsed: !state.intentCollapsed };

    case 'OPEN_PLAYGROUND':
      return { ...state, activePlaygroundRowId: action.rowId, activeSwapRowId: null };

    case 'CLOSE_PLAYGROUND':
      return { ...state, activePlaygroundRowId: null };

    case 'OPEN_SWAP':
      return { ...state, activeSwapRowId: action.rowId, activePlaygroundRowId: null };

    case 'CLOSE_SWAP':
      return { ...state, activeSwapRowId: null };

    case 'OPEN_PICKER':
      return {
        ...state,
        openPicker: action.picker,
        pickerTargetGroupId: action.groupId ?? null,
        activeSwapRowId: null,
        activePlaygroundRowId: null,
      };

    case 'CLOSE_PICKER':
      return { ...state, openPicker: null, pickerTargetGroupId: null };

    case 'OPEN_HANDOFF': {
      // Mint a deterministic segment ID from predicate hash + date
      const hash = Object.values(state.predicate.groups)
        .flatMap(g => g.rows.map(r => r.feature))
        .join('-')
        .slice(0, 6)
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase() || 'seg';
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const shortHash = Math.abs(
        JSON.stringify(state.predicate).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
      ).toString(16).slice(0, 6);
      const mintedSegmentId = `seg-cfm-${hash}-2026-${date}-${shortHash}`;
      return { ...state, handoffOpen: true, mintedSegmentId };
    }

    case 'CLOSE_HANDOFF':
      return { ...state, handoffOpen: false };

    case 'SET_GROUP_MODE': {
      const predicate: Predicate = {
        ...state.predicate,
        groups: state.predicate.groups.map(g =>
          g.id === action.groupId ? { ...g, mode: action.mode } : g,
        ),
      };
      return { ...state, predicate };
    }

    case 'SET_PREDICATE': {
      return {
        ...state,
        predicate: action.predicate,
        audience: computeAudience(action.predicate),
        intentCollapsed: action.predicate.groups.length > 0,
      };
    }

    default:
      return state;
  }
}
