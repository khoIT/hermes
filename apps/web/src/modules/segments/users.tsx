/**
 * Users tab — 50-row sample of UIDs landing in the segment + CSV export.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { T } from '../../theme';
import { allSegments } from '../../data/catalog/segments';
import { getUserSample } from './_utils/synth-segment-detail-data';
import { UsersTable } from './_components/users-table';
import { downloadCsv } from './_utils/csv-export';

export default function SegmentsUsersPage() {
  const { id } = useParams<{ id: string }>();
  const seg = id ? allSegments.find(s => s.id === id) : undefined;
  const rows = React.useMemo(() => id ? getUserSample(id) : [], [id]);
  if (!id) return null;
  if (!seg) {
    return (
      <div style={{ padding: 32, fontFamily: T.fSans, color: T.n500 }}>
        Segment not found.
      </div>
    );
  }

  const lastBuild = seg.lastBuildAt
    ? new Date(seg.lastBuildAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Not synced yet';

  const onExport = () => {
    const headers = ['uid', 'last_seen_iso', 'lifecycle', 'spend_tier', 'country', 'device'];
    const data = rows.map(r => [
      r.uid, r.lastSeenISO, r.lifecycle, r.spendTier, r.country, r.device,
    ]);
    downloadCsv(`segment-${id}-users.csv`, headers, data);
  };

  return (
    <div style={{ padding: '24px 32px 48px', maxWidth: 1200 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n600 }}>
          Sample of <strong style={{ color: T.n900 }}>{rows.length}</strong>
          {' '}from {(seg.audienceSize ?? 0).toLocaleString()} matched users · Last build {lastBuild}
        </div>
        <button
          onClick={onExport}
          style={{
            fontFamily: T.fSans, fontSize: 12, fontWeight: 500, color: T.n700,
            background: T.surface, border: `1px solid ${T.n200}`,
            borderRadius: 7, padding: '7px 12px',
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>
      <UsersTable rows={rows} />
    </div>
  );
}
