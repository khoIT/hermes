/**
 * TabsStrip — 4 inbox tabs with badge counts for Module 05 Agents inbox.
 * Tabs: Opportunities · Drafts · Recommendations · Activity
 * Per PRD_Hermes_Agentic.md §5.2
 */
import React from 'react';
import { T } from '../../../theme';

export type InboxTab = 'opportunities' | 'drafts' | 'recommendations' | 'activity';

interface TabDef {
  id: InboxTab;
  label: string;
  count?: number;
}

interface TabsStripProps {
  active: InboxTab;
  onChange: (tab: InboxTab) => void;
  counts: { opportunities: number; drafts: number; recommendations: number };
}

export const TabsStrip = React.memo<TabsStripProps>(({ active, onChange, counts }) => {
  const tabs: TabDef[] = [
    { id: 'opportunities',   label: 'Opportunities',    count: counts.opportunities   },
    { id: 'drafts',          label: 'Drafts',           count: counts.drafts          },
    { id: 'recommendations', label: 'Recommendations',  count: counts.recommendations },
    { id: 'activity',        label: 'Activity'                                        },
  ];

  return (
    <div style={{
      display: 'flex', gap: 0, borderBottom: `1px solid ${T.n200}`,
      marginBottom: 0,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              fontFamily: T.fSans, fontSize: 13, fontWeight: isActive ? 600 : 500,
              color: isActive ? T.brand : T.n600,
              background: 'none', border: 'none', borderBottom: isActive ? `2px solid ${T.brand}` : '2px solid transparent',
              padding: '10px 18px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'color .1s, border-color .1s',
              marginBottom: -1,
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                fontFamily: T.fMono, fontSize: 10,
                background: isActive ? T.brand : T.n200,
                color: isActive ? '#fff' : T.n600,
                borderRadius: 9999, padding: '1px 6px',
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
TabsStrip.displayName = 'TabsStrip';
