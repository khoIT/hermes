/**
 * LineChartWidget — Recharts wrapper. Renders one or more named series
 * sharing an x-axis. Channel-aware colors via colorFor().
 */
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer,
} from 'recharts';
import { T } from '../../../theme';
import type { LineChartWidget } from '../../../data/chat/response-types';
import { colorFor } from './colors';

interface Props {
  widget: LineChartWidget;
}

export function LineChartView({ widget }: Props) {
  // Reshape: [{ x, [seriesA]: y, [seriesB]: y }, ...] — assumes parallel x-axes
  const xs = widget.series[0]?.data.map(d => d.x) ?? [];
  const data = xs.map((x, i) => {
    const row: Record<string, string | number> = { x: String(x) };
    for (const s of widget.series) {
      row[s.name] = s.data[i]?.y ?? 0;
    }
    return row;
  });

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.n100} />
          <XAxis dataKey="x" stroke={T.n500} tick={{ fontSize: 11, fontFamily: T.fSans }} />
          <YAxis stroke={T.n500} tick={{ fontSize: 11, fontFamily: T.fSans }} />
          <Tooltip
            contentStyle={{
              fontFamily: T.fSans, fontSize: 12,
              border: `1px solid ${T.n200}`, borderRadius: 6,
            }}
          />
          <Legend wrapperStyle={{ fontFamily: T.fSans, fontSize: 12 }} />
          {widget.series.map((s, i) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color ?? colorFor(s.name, i)}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
