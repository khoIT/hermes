/**
 * 08 — Audience Pattern Library (seg_patterns)
 * 5 pattern cards per PRD §8.9.
 * "Use pattern" navigates to canvas with pattern's key feature seeded.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { audiencePatterns } from '../../data/catalog/audience-patterns';
import { PatternCard } from './_components/pattern-card';

export default function SegmentsPatternsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <div style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 600, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        08 · Segments · Patterns
      </div>
      <div style={{ fontFamily: T.fDisp, fontSize: 40, textTransform: 'uppercase', color: T.n950, lineHeight: 0.95, marginBottom: 4 }}>
        Audience Patterns
      </div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, marginBottom: 24 }}>
        Reusable audience archetypes. Start from a pattern to pre-populate the segment canvas
        with proven feature combinations.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {audiencePatterns.map(pattern => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            onUse={p => navigate(`/segments/new?seedFeature=${p.keyFeatures[0]}`)}
            onNavigate={p => navigate(`/segments/new?seedFeature=${p.keyFeatures[0]}`)}
          />
        ))}
      </div>

      <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${T.n200}` }}>
        <button
          onClick={() => navigate('/segments/new')}
          style={{
            fontFamily: T.fSans, fontSize: 13, fontWeight: 500, color: '#fff',
            background: T.brand, border: 'none',
            borderRadius: 7, padding: '9px 20px', cursor: 'pointer',
          }}
        >
          Start from scratch →
        </button>
      </div>
    </div>
  );
}
