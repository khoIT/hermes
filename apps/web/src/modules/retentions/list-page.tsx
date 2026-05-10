/** Retentions — sidebar stub. */
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ComingSoon } from '../../components/empty-state/coming-soon';

export default function RetentionsListPage() {
  return (
    <ComingSoon
      icon={RefreshCw}
      title="Retentions"
      body="Cohort retention curves and DAU/MAU trends, sliced by your
            segments or any feature in the Feature Store."
      bullets={[
        'D1 / D7 / D30 retention curves',
        'DAU and MAU trend lines',
        'Compare cohorts side-by-side',
      ]}
    />
  );
}
