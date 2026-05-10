/**
 * Widget — discriminated-union renderer. Picks the right widget body
 * based on widget.type and wraps everything in a WidgetShell.
 */
import React from 'react';
import type { DataWidget } from '../../../data/chat/response-types';
import { WidgetShell } from './widget-shell';
import { DataTable } from './data-table';
import { LineChartView } from './line-chart';
import { BarFunnelChartView } from './bar-funnel-chart';
import { ScatterChartView } from './scatter-chart';

interface WidgetProps {
  widget: DataWidget;
  onPin?: () => void;
}

export function Widget({ widget, onPin }: WidgetProps) {
  return (
    <WidgetShell title={widget.title} widget={widget} onPin={onPin}>
      {widget.type === 'table'   && <DataTable        widget={widget} />}
      {widget.type === 'line'    && <LineChartView    widget={widget} />}
      {widget.type === 'bar'     && <BarFunnelChartView widget={widget} />}
      {widget.type === 'scatter' && <ScatterChartView widget={widget} />}
    </WidgetShell>
  );
}
