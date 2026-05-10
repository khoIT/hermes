/** Data — sidebar stub (connectors). */
import React from 'react';
import { Database } from 'lucide-react';
import { ComingSoon } from '../../components/empty-state/coming-soon';

export default function DataPage() {
  return (
    <ComingSoon
      icon={Database}
      title="Data"
      body="Connector inventory and source health for the upstream warehouse,
            event streams, and feature pipelines."
      bullets={[
        'Trino · Postgres · Iceberg connectors',
        'Mock fixtures and demo seeds',
        'Latency & freshness SLAs per source',
      ]}
    />
  );
}
