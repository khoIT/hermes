/**
 * MaterialsShelf — collapsible right-rail shelf used in segment and campaign
 * authoring canvases. Four sections: Features in Use · Pattern Ref ·
 * Hypothesis Ref · Suggested Next (AI).
 * Per PRD §8.3 Region 4.
 */
import React from 'react';
import { T } from '../theme';

interface ShelfSection {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

interface MaterialsShelfProps {
  sections?: ShelfSection[];
  featuresInUse?: string[];
  suggestedNext?: string[];
  onAddFeature?: (name: string) => void;
  style?: React.CSSProperties;
}

function ShelfBlock({ title, content, defaultOpen = true }: ShelfSection) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${T.n100}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '8px 0',
          fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n500,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        {title}
        <span style={{ fontSize: 10, color: T.n400 }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && <div style={{ paddingBottom: 10 }}>{content}</div>}
    </div>
  );
}

export const MaterialsShelf = React.memo<MaterialsShelfProps>(({
  sections,
  featuresInUse = [],
  suggestedNext = [],
  onAddFeature,
  style,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  const defaultSections: ShelfSection[] = [
    {
      title: `Features in use · ${featuresInUse.length}`,
      defaultOpen: true,
      content: featuresInUse.length ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {featuresInUse.map(f => (
            <li key={f} style={{
              fontFamily: T.fMono, fontSize: 11, color: T.n700,
              padding: '3px 0', borderBottom: `1px solid ${T.n50}`,
            }}>{f}</li>
          ))}
        </ul>
      ) : (
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400, margin: 0, fontStyle: 'italic' }}>
          No features added yet.
        </p>
      ),
    },
    {
      title: 'Pattern reference',
      defaultOpen: false,
      content: <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400, margin: 0, fontStyle: 'italic' }}>No pattern linked.</p>,
    },
    {
      title: 'Hypothesis reference',
      defaultOpen: false,
      content: <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400, margin: 0, fontStyle: 'italic' }}>No hypothesis linked.</p>,
    },
    {
      title: 'Suggested next (AI)',
      defaultOpen: true,
      content: suggestedNext.length ? (
        <div>
          <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, margin: '0 0 6px', fontStyle: 'italic' }}>
            Segments like yours often add:
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {suggestedNext.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700 }}>{f}</span>
                {onAddFeature && (
                  <button
                    onClick={() => onAddFeature(f)}
                    style={{
                      fontFamily: T.fSans, fontSize: 10, color: T.brand,
                      background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
                    }}
                  >+ add</button>
                )}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8, fontFamily: T.fSans, fontSize: 10, color: T.n400, fontStyle: 'italic' }}>
            Suggested by Insight Agent · <button style={{ fontFamily: T.fSans, fontSize: 10, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>open thread →</button>
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400, margin: 0, fontStyle: 'italic' }}>
          No suggestions yet.
        </p>
      ),
    },
  ];

  const activeSections = sections ?? defaultSections;

  if (collapsed) {
    return (
      <div style={{ width: 24, ...style }}>
        <button
          onClick={() => setCollapsed(false)}
          title="Expand shelf"
          style={{
            fontFamily: T.fSans, fontSize: 11, color: T.n400,
            background: 'none', border: `1px solid ${T.n200}`,
            borderRadius: 6, padding: '6px 4px', cursor: 'pointer',
            writingMode: 'vertical-lr',
          }}
        >Materials ▸</button>
      </div>
    );
  }

  return (
    <div style={{
      width: 220, flexShrink: 0,
      padding: '12px 16px',
      borderLeft: `1px solid ${T.n200}`,
      background: T.n50,
      ...style,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: T.fSans, fontSize: 10, fontWeight: 700, color: T.n400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Materials
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{ fontFamily: T.fSans, fontSize: 11, color: T.n400, background: 'none', border: 'none', cursor: 'pointer' }}
          title="Collapse shelf"
        >◂</button>
      </div>
      {activeSections.map((s, i) => <ShelfBlock key={i} {...s} />)}
    </div>
  );
});
MaterialsShelf.displayName = 'MaterialsShelf';
