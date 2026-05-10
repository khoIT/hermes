/**
 * BarFunnelChartWidget — Recharts BarChart wrapper.
 * Vertical bars by default; set widget.funnel=true for horizontal funnel layout.
 */
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ResponsiveContainer,
} from 'recharts';
import { T } from '../../../theme';
import type { BarFunnelWidget } from '../../../data/chat/response-types';
import { colorFor } from './colors';

interface Props {
  widget: BarFunnelWidget;
}

export function BarFunnelChartView({ widget }: Props) {
  const data = widget.bars.map((b, i) => ({
    label: b.label, value: b.value,
    color: b.color ?? colorFor(b.label, i),
  }));

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={widget.funnel ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 16, left: widget.funnel ? 80 : 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={T.n100} />
          {widget.funnel ? (
            <>
              <XAxis type="number" stroke={T.n500} tick={{ fontSize: 11, fontFamily: T.fSans }} />
              <YAxis dataKey="label" type="category" stroke={T.n500} tick={{ fontSize: 11, fontFamily: T.fSans }} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" stroke={T.n500} tick={{ fontSize: 11, fontFamily: T.fSans }} />
              <YAxis stroke={T.n500} tick={{ fontSize: 11, fontFamily: T.fSans }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              fontFamily: T.fSans, fontSize: 12,
              border: `1px solid ${T.n200}`, borderRadius: 6,
            }}
          />
          <Bar dataKey="value" radius={4}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
