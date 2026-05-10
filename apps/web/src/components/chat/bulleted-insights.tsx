/**
 * BulletedInsights — bullet list inline within an assistant response.
 * Items render with custom diamond marker for visual rhythm.
 */
import React from 'react';
import { T } from '../../theme';
import { NarrativePara } from './narrative-para';

interface BulletedInsightsProps {
  items: string[];
}

export function BulletedInsights({ items }: BulletedInsightsProps) {
  return (
    <ul style={{
      listStyle: 'none', padding: 0, margin: '8px 0 12px',
      maxWidth: 820,
    }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          padding: '4px 0',
        }}>
          <span style={{
            color: T.brand, fontSize: 16, lineHeight: 1.4, marginTop: 1,
          }}>◆</span>
          <div style={{ flex: 1, minWidth: 0, marginTop: -3 }}>
            <NarrativePara text={item} />
          </div>
        </li>
      ))}
    </ul>
  );
}
