/**
 * ScatterChartWidget — Recharts ScatterChart wrapper. One Scatter per series.
 */
import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer,
} from 'recharts';
import { T } from '../../../theme';
import type { ScatterChartWidget } from '../../../data/chat/response-types';
import { colorFor } from './colors';

interface Props {
  widget: ScatterChartWidget;
}

export function ScatterChartView({ widget }: Props) {
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.n100} />
          <XAxis
            type="number"
            dataKey="x"
            name={widget.xLabel}
            stroke={T.n500}
            tick={{ fontSize: 11, fontFamily: T.fSans }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={widget.yLabel}
            stroke={T.n500}
            tick={{ fontSize: 11, fontFamily: T.fSans }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              fontFamily: T.fSans, fontSize: 12,
              border: `1px solid ${T.n200}`, borderRadius: 6,
            }}
          />
          <Legend wrapperStyle={{ fontFamily: T.fSans, fontSize: 12 }} />
          {widget.series.map((s, i) => (
            <Scatter
              key={s.name}
              name={s.name}
              data={s.data}
              fill={s.color ?? colorFor(s.name, i)}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
