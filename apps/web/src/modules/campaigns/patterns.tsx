/**
 * 17 — Campaign Intervention Pattern Library (cmp_patterns)
 * 7 archetype cards per PRD §9.11.
 * Uses ArchetypeCard component and interventionArchetypes catalog.
 */
import React from 'react';
import { T } from '../../theme';
import { interventionArchetypes } from '../../data/catalog/intervention-archetypes';
import { ArchetypeCard } from './_components/archetype-card';

type GoalFilter = 'all' | 'retain' | 'revenue' | 'reactivate' | 'recruit';

export default function CampaignsPatternsPage() {
  const [goalFilter, setGoalFilter] = React.useState<GoalFilter>('all');
  const [query, setQuery]           = React.useState('');

  const filtered = React.useMemo(() => {
    let list = interventionArchetypes;
    if (goalFilter !== 'all') list = list.filter(a => a.goal4r === goalFilter);
    if (query) list = list.filter(a =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase())
    );
    return list;
  }, [goalFilter, query]);

  return (
    <div style={{ minHeight: '100vh', background: T.n50 }}>
      {/* Header */}
      <div style={{ padding: '28px 40px 0', background: '#fff', borderBottom: `1px solid ${T.n200}` }}>
        <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          04 · Campaign · Patterns
        </div>
        <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 10 }}>
          Intervention Patterns
        </div>
        <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 18, maxWidth: 640 }}>
          Proven campaign archetypes distilled from the portfolio. Each pattern includes predicate + action
          templates and cross-game lineage. Click "Use in campaign" to pre-populate a new canvas.
        </div>

        {/* Filter rail */}
        <div style={{ display: 'flex', gap: 10, paddingBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patterns…"
            style={{
              fontFamily: T.fSans, fontSize: 13, color: T.n900,
              border: `1px solid ${T.n200}`, borderRadius: 7,
              padding: '6px 12px', outline: 'none', width: 200,
            }}
          />
          {(['all', 'retain', 'revenue', 'reactivate', 'recruit'] as GoalFilter[]).map(g => (
            <button
              key={g}
              onClick={() => setGoalFilter(g)}
              style={{
                fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
                padding: '5px 14px', borderRadius: 9999, cursor: 'pointer',
                background: goalFilter === g
                  ? (g === 'all' ? T.n900 : g === 'retain' ? T.brand : g === 'revenue' ? T.green600 : g === 'reactivate' ? T.blue600 : T.purple500)
                  : '#fff',
                color: goalFilter === g ? '#fff' : T.n600,
                border: `1px solid ${goalFilter === g ? 'transparent' : T.n200}`,
              }}
            >
              {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
          <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n400, marginLeft: 'auto' }}>
            {filtered.length} pattern{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Pattern grid */}
      <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map(archetype => (
          <ArchetypeCard key={archetype.id} archetype={archetype} />
        ))}
        {filtered.length === 0 && (
          <div style={{
            fontFamily: T.fSans, fontSize: 13, color: T.n400,
            textAlign: 'center', padding: '48px 0',
          }}>
            No patterns match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
