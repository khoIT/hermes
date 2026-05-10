/**
 * Predicate tab — read-mode default + visible [Edit] button + `e` shortcut +
 * `?edit=1` deeplink. Edit mode wraps the existing `<PredicateComposer>`
 * with reducer-backed state, sticky Save/Discard ribbon, and
 * `segments-client.update()` persistence (overrides the static catalog so
 * Overview re-renders after Save).
 */
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { T } from '../../theme';
import { allSegments } from '../../data/catalog/segments';
import type { PredicateAST, PredicateLeaf, PredicateGroup } from '@hermes/contracts';
import type { Predicate as InternalPredicate, Row, Operator } from './_state/predicate-types';
import { canvasReducer, initialState } from './_state/canvas-reducer';
import { PredicateComposer } from './_composer/predicate-composer';
import { PredicateReadView } from './_components/predicate-read-view';
import { updateSegment } from '../../api/segments-client';
import { useSegment } from '../../utils/use-segment';
import { toast } from '../../components/ui/toast';
import { EditModeProvider } from '../../utils/edit-mode-context';

const ID = () => Math.random().toString(36).slice(2, 9);

// ---------------------------------------------------------------------------
// AST <-> internal-predicate converters
// ---------------------------------------------------------------------------
function astToInternal(ast: PredicateAST): InternalPredicate {
  return {
    groups: ast.groups.map(g => ({
      id: ID(),
      mode: g.op === 'OR' ? 'any' : 'all',
      rows: g.conditions.map(c => ({
        id: ID(),
        feature: c.feature,
        operator: c.op as Operator,
        value: c.value,
      })),
    })),
    exclusions: (ast.exclusions ?? []).map(c => ({
      id: ID(),
      feature: c.feature,
      operator: c.op as Operator,
      value: c.value,
    })),
  };
}

function internalToAst(p: InternalPredicate): PredicateAST {
  const toLeaf = (r: Row): PredicateLeaf => ({
    feature: r.feature,
    op: r.operator as PredicateLeaf['op'],
    value: r.value as PredicateLeaf['value'],
  });
  return {
    groups: p.groups.map((g): PredicateGroup => ({
      op: g.mode === 'any' ? 'OR' : 'AND',
      conditions: g.rows.map(toLeaf),
    })),
    exclusions: p.exclusions.map(toLeaf),
  };
}

function predicateEqual(a: PredicateAST, b: PredicateAST): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SegmentsPredicatePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const seg = useSegment(id ?? '');
  const baseSeg = id ? allSegments.find(s => s.id === id) : undefined;

  const initialEdit = searchParams.get('edit') === '1' || searchParams.get('edit') === 'true';
  const [mode, setMode] = React.useState<'read' | 'edit'>(initialEdit ? 'edit' : 'read');
  const [savedPredicate, setSavedPredicate] = React.useState<PredicateAST | undefined>(seg?.predicate);

  React.useEffect(() => {
    if (seg && !savedPredicate) setSavedPredicate(seg.predicate);
  }, [seg, savedPredicate]);

  const [state, dispatch] = React.useReducer(
    canvasReducer,
    undefined,
    () => initialState({
      draftPredicate: seg ? astToInternal(seg.predicate) : undefined,
    }),
  );

  const currentAst = React.useMemo(() => internalToAst(state.predicate), [state.predicate]);
  const dirty = savedPredicate ? !predicateEqual(currentAst, savedPredicate) : false;

  const enterEdit = React.useCallback(() => setMode('edit'), []);
  const exitEdit = React.useCallback(() => {
    setMode('read');
    if (searchParams.get('edit')) {
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // `e` shortcut — toggle modes when no input focused, no modifiers pressed.
  React.useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== 'e') return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) return;
      const ae = document.activeElement as HTMLElement | null;
      if (ae && ae.closest('input, textarea, select, [contenteditable], [role="combobox"], [role="listbox"], [role="menu"], [role="dialog"], [role="textbox"]')) return;
      ev.preventDefault();
      setMode(m => (m === 'edit' ? 'read' : 'edit'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // beforeunload guard during edit + dirty
  React.useEffect(() => {
    if (mode !== 'edit' || !dirty) return;
    const handler = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
      ev.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [mode, dirty]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateSegment(id, { predicate: currentAst });
      setSavedPredicate(currentAst);
      toast('Predicate saved', { tone: 'success' });
      exitEdit();
    } catch (err) {
      toast('Save failed — try again', { tone: 'error' });
      console.error(err);
    }
  };

  const handleDiscard = () => {
    if (!savedPredicate) return;
    dispatch({ type: 'SET_PREDICATE', predicate: astToInternal(savedPredicate) });
    exitEdit();
  };

  if (!id) return null;
  if (!baseSeg) {
    return (
      <div style={{ padding: 32, fontFamily: T.fSans, color: T.n500 }}>
        Segment not found.
      </div>
    );
  }

  return (
    <EditModeProvider value={mode === 'edit'}>
      <div style={{ padding: '24px 32px 100px', maxWidth: 920 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, gap: 8,
        }}>
          <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n600 }}>
            {mode === 'read'
              ? <>Read-only view of the segment predicate. Press <Kbd>e</Kbd> or click Edit to modify.</>
              : 'Editing predicate — Save to persist, Discard to revert.'}
          </div>
          {mode === 'read' && (
            <button
              onClick={enterEdit}
              style={{
                fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: '#fff',
                background: T.brand, border: 'none',
                borderRadius: 7, padding: '7px 14px',
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}
            >
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        {mode === 'read' && (
          <PredicateReadView predicate={savedPredicate ?? baseSeg.predicate} />
        )}

        {mode === 'edit' && (
          <PredicateComposer
            predicate={state.predicate}
            activePlaygroundRowId={state.activePlaygroundRowId}
            activeSwapRowId={state.activeSwapRowId}
            openPicker={state.openPicker}
            pickerTargetGroupId={state.pickerTargetGroupId}
            dispatch={dispatch}
          />
        )}
      </div>

      {mode === 'edit' && (
        <SaveRibbon
          dirty={dirty}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}
    </EditModeProvider>
  );
}

function SaveRibbon({ dirty, onSave, onDiscard }: {
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 25, display: 'flex', alignItems: 'center', gap: 12,
      background: T.surface, border: `1px solid ${T.n200}`, borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      padding: '8px 12px',
    }}>
      <span style={{
        fontFamily: T.fSans, fontSize: 12,
        color: dirty ? '#92400e' : T.n500,
      }}>
        {dirty ? 'Unsaved changes' : 'No changes'}
      </span>
      <button
        onClick={onDiscard}
        style={{
          fontFamily: T.fSans, fontSize: 12, color: T.n700,
          background: T.surface, border: `1px solid ${T.n200}`,
          borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
        }}
      >Discard</button>
      <button
        onClick={onSave}
        disabled={!dirty}
        style={{
          fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
          color: '#fff', background: dirty ? T.brand : T.n300,
          border: 'none', borderRadius: 7, padding: '6px 14px',
          cursor: dirty ? 'pointer' : 'not-allowed',
        }}
      >Save</button>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd style={{
      fontFamily: T.fMono, fontSize: 11, color: T.n800,
      background: T.n100, border: `1px solid ${T.n200}`,
      borderRadius: 4, padding: '1px 5px',
    }}>{children}</kbd>
  );
}
