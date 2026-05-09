/**
 * UsedByTab — tables of segments and campaigns referencing a feature.
 * v2: header summary with unique games used; rows tinted by game chip;
 * sort order CFM → PT → NTH → TF → COS → PG (canonical demo order).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, Badge } from '../../../theme';
import type { HermesCampaign, HermesGame, HermesSegment } from '@hermes/contracts';
import { GAME_ORDER, GAME_TINT } from '../../../components/_logic/game-colors';

interface UsedByTabProps {
  segments: HermesSegment[];
  campaigns: HermesCampaign[];
  featureName: string;
}

function gameRank(g: string): number {
  const idx = GAME_ORDER.indexOf(g as HermesGame);
  return idx === -1 ? 99 : idx;
}

function uniqueGames(rows: { game: string }[]): HermesGame[] {
  const set = new Set<string>();
  for (const r of rows) set.add(r.game);
  return GAME_ORDER.filter((g) => set.has(g));
}

const GameChipCell: React.FC<{ game: string }> = ({ game }) => {
  const tint = GAME_TINT[game as HermesGame];
  if (!tint) {
    return (
      <span
        style={{
          fontFamily: T.fMono,
          fontSize: 11,
          background: T.n100,
          padding: '2px 6px',
          borderRadius: 4,
        }}
      >
        {game}
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: T.fMono,
        fontWeight: 700,
        fontSize: 10,
        padding: '2px 6px',
        background: tint.bg,
        color: tint.fg,
        border: `1px solid ${tint.border}`,
        borderRadius: 4,
        letterSpacing: '0.04em',
      }}
    >
      {tint.label}
    </span>
  );
};

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

  const sortedSegments = React.useMemo(
    () =>
      [...segments].sort(
        (a, b) => gameRank(a.game) - gameRank(b.game) || b.audienceSize - a.audienceSize,
      ),
    [segments],
  );
  const sortedCampaigns = React.useMemo(
    () =>
      [...campaigns].sort(
        (a, b) => gameRank(a.game) - gameRank(b.game) || a.id.localeCompare(b.id),
      ),
    [campaigns],
  );

  const games = uniqueGames([...sortedSegments, ...sortedCampaigns]);
  const summary = `Used by ${segments.length} segment${segments.length === 1 ? '' : 's'} and ${
    campaigns.length
  } campaign${campaigns.length === 1 ? '' : 's'}${
    games.length > 0 ? ` across ${games.map((g) => GAME_TINT[g].label).join(', ')}` : ''
  }`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── Header summary ── */}
      <div
        style={{
          fontFamily: T.fSans,
          fontSize: 13,
          color: T.n600,
          padding: '4px 0',
          borderBottom: `1px solid ${T.n200}`,
          paddingBottom: 12,
        }}
      >
        {summary}
      </div>

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
                {sortedSegments.map((seg) => (
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
                      <GameChipCell game={seg.game} />
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
                {sortedCampaigns.map((camp) => (
                  <tr key={camp.id}>
                    <td style={TABLE_CELL}>
                      <div style={{ fontFamily: T.fSans, fontWeight: 500 }}>{camp.displayName}</div>
                      <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.n400 }}>{camp.id}</div>
                    </td>
                    <td style={TABLE_CELL}>
                      <GameChipCell game={camp.game} />
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
