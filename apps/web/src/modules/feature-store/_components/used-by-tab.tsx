/**
 * UsedByTab — tables of segments and campaigns referencing a feature.
 * Segments table links to /segments/:id.
 * Campaigns table shows transitive reference via audience segment.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Badge } from '../../../theme';
import type { HermesSegment } from '@hermes/contracts';
import type { HermesCampaign } from '@hermes/contracts';

interface UsedByTabProps {
  segments: HermesSegment[];
  campaigns: HermesCampaign[];
  featureName: string;
}

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
    active: 'success',
    draft: 'warning',
    stale: 'destructive',
    archived: 'secondary',
  };
  return <Badge variant={variantMap[status] ?? 'secondary'}>{status}</Badge>;
}

const TABLE_HEADER: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 10, fontWeight: 700,
  color: T.n400, textTransform: 'uppercase', letterSpacing: '0.07em',
  padding: '6px 12px', textAlign: 'left', borderBottom: `1px solid ${T.n200}`,
  background: T.n50,
};

const TABLE_CELL: React.CSSProperties = {
  fontFamily: T.fSans, fontSize: 12, color: T.n800,
  padding: '8px 12px', borderBottom: `1px solid ${T.n100}`,
  verticalAlign: 'middle',
};

export const UsedByTab: React.FC<UsedByTabProps> = ({ segments, campaigns, featureName }) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── Segments table ── */}
      <div>
        <div style={{
          fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n900,
          marginBottom: 10,
        }}>
          Segments using{' '}
          <code style={{ fontFamily: T.fMono, fontSize: 12, color: T.brand }}>{featureName}</code>
          {' '}<span style={{ color: T.n400, fontWeight: 400 }}>({segments.length})</span>
        </div>

        {segments.length === 0 ? (
          <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n400, padding: '12px 0' }}>
            No segments reference this feature.
          </div>
        ) : (
          <div style={{ border: `1px solid ${T.n200}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TABLE_HEADER}>Segment</th>
                  <th style={TABLE_HEADER}>Game</th>
                  <th style={TABLE_HEADER}>Audience</th>
                  <th style={TABLE_HEADER}>Status</th>
                  <th style={TABLE_HEADER}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((seg) => (
                  <tr
                    key={seg.id}
                    onClick={() => navigate(`/segments/${seg.id}`)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.n50)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={TABLE_CELL}>
                      <div style={{ fontFamily: T.fSans, fontWeight: 500 }}>{seg.displayName}</div>
                      <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400 }}>{seg.id}</div>
                    </td>
                    <td style={TABLE_CELL}>
                      <span style={{
                        fontFamily: T.fMono, fontSize: 11,
                        background: T.n100, padding: '2px 6px', borderRadius: 4,
                      }}>
                        {seg.game}
                      </span>
                    </td>
                    <td style={TABLE_CELL}>
                      {seg.audienceSize.toLocaleString()}
                    </td>
                    <td style={TABLE_CELL}>
                      <StatusBadge status={seg.status ?? 'active'} />
                    </td>
                    <td style={{ ...TABLE_CELL, fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
                      {seg.owner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Campaigns table ── */}
      <div>
        <div style={{
          fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n900,
          marginBottom: 10,
        }}>
          Campaigns referencing this feature{' '}
          <span style={{ color: T.n400, fontWeight: 400, fontSize: 12 }}>
            (transitive via segment or trigger predicate)
          </span>
          {' '}<span style={{ color: T.n400, fontWeight: 400 }}>({campaigns.length})</span>
        </div>

        {campaigns.length === 0 ? (
          <div style={{ fontFamily: T.fSans, fontSize: 13, color: T.n400, padding: '12px 0' }}>
            No campaigns reference this feature transitively.
          </div>
        ) : (
          <div style={{ border: `1px solid ${T.n200}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TABLE_HEADER}>Campaign</th>
                  <th style={TABLE_HEADER}>Game</th>
                  <th style={TABLE_HEADER}>Type</th>
                  <th style={TABLE_HEADER}>Status</th>
                  <th style={TABLE_HEADER}>Author</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr key={camp.id}>
                    <td style={TABLE_CELL}>
                      <div style={{ fontFamily: T.fSans, fontWeight: 500 }}>{camp.displayName}</div>
                      <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400 }}>{camp.id}</div>
                    </td>
                    <td style={TABLE_CELL}>
                      <span style={{
                        fontFamily: T.fMono, fontSize: 11,
                        background: T.n100, padding: '2px 6px', borderRadius: 4,
                      }}>
                        {camp.game}
                      </span>
                    </td>
                    <td style={{ ...TABLE_CELL, fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
                      {camp.triggerType}
                    </td>
                    <td style={TABLE_CELL}>
                      <StatusBadge status={camp.status} />
                    </td>
                    <td style={{ ...TABLE_CELL, fontFamily: T.fMono, fontSize: 11, color: T.n500 }}>
                      {camp.author}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
