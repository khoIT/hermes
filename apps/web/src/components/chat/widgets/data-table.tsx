/**
 * DataTable — multi-column tabular widget with currency/percent formatters
 * and per-column top-performer highlighting (light-green cell bg).
 */
import React from 'react';
import { T } from '../../../theme';
import type { DataTableWidget, DataTableColumn } from '../../../data/chat/response-types';

interface DataTableProps {
  widget: DataTableWidget;
}

function format(value: string | number | undefined, fmt: DataTableColumn['format']): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string') return value;
  switch (fmt) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 2,
      }).format(value);
    case 'percent':
      return `${value.toFixed(value < 1 ? 1 : 0)}%`;
    case 'number':
      return value.toLocaleString();
    default:
      return String(value);
  }
}

function pickTopRowsByCol(
  rows: Record<string, string | number>[],
  columns: DataTableColumn[],
): Record<string, number | null> {
  const top: Record<string, number | null> = {};
  for (const col of columns) {
    if (!col.highlightTop) continue;
    let bestIdx = -1;
    let bestVal = -Infinity;
    rows.forEach((r, i) => {
      const v = r[col.key];
      if (typeof v === 'number' && v > bestVal) {
        bestVal = v;
        bestIdx = i;
      }
    });
    top[col.key] = bestIdx >= 0 ? bestIdx : null;
  }
  return top;
}

export function DataTable({ widget }: DataTableProps) {
  const top = React.useMemo(
    () => pickTopRowsByCol(widget.rows, widget.columns),
    [widget],
  );

  if (!widget.rows.length) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: T.n500, fontFamily: T.fSans, fontSize: 13 }}>
        No data
      </div>
    );
  }

  return (
    <div style={{ overflow: 'auto', maxHeight: 320 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fSans, fontSize: 13 }}>
        <thead>
          <tr>
            {widget.columns.map(col => (
              <th key={col.key} style={{
                textAlign: 'left', padding: '8px 12px',
                borderBottom: `1px solid ${T.n200}`,
                color: T.n500, fontWeight: 600, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {widget.rows.map((row, ri) => (
            <tr key={ri}>
              {widget.columns.map(col => {
                const isTop = top[col.key] === ri;
                return (
                  <td key={col.key} style={{
                    padding: '10px 12px',
                    borderBottom: `1px solid ${T.n100}`,
                    background: isTop ? T.greenSoft : 'transparent',
                    color: T.n900,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}>{format(row[col.key], col.format)}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
