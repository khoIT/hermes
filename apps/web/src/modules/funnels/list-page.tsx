/** Funnels — sidebar stub. */
import React from 'react';
import { Filter } from 'lucide-react';
import { ComingSoon } from '../../components/empty-state/coming-soon';

export default function FunnelsListPage() {
  return (
    <ComingSoon
      icon={Filter}
      title="Funnels"
      body="Multi-step conversion analysis. Define the steps, see drop-off
            rates per cohort, and compare against a control."
      bullets={[
        'Drag steps from the Feature Store',
        'Per-step drop-off + median time-between',
        'Cohort overlay (channel, country, segment)',
      ]}
    />
  );
}
