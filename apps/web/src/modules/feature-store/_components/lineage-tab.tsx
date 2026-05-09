/**
 * LineageTab — simple SVG lineage graph.
 * Layout: upstream source tables → pipeline node → downstream segments/campaigns.
 * Shallow graph (2-3 nodes max) per phase spec risk mitigation.
 */
import React from 'react';
import { T } from '../../../theme';
import type { HermesFeature } from '@hermes/contracts';
import type { HermesSegment } from '@hermes/contracts';
import type { HermesCampaign } from '@hermes/contracts';
import { TIER_LABEL } from '../../../components/_logic/latency-labels';

interface LineageTabProps {
  feature: HermesFeature;
  segments: HermesSegment[];
  campaigns: HermesCampaign[];
}

// SVG layout constants
const SVG_W = 680;
const SVG_H = 280;
const NODE_W = 140;
const NODE_H = 40;
const COL_X = { source: 40, pipeline: 270, downstream: 480 };
const MID_Y = SVG_H / 2;

function NodeBox({
  x, y, label, sublabel, fill, stroke, textColor,
}: {
  x: number; y: number; label: string; sublabel?: string;
  fill: string; stroke: string; textColor: string;
}) {
  return (
    <g>
      <rect x={x} y={y - NODE_H / 2} width={NODE_W} height={NODE_H}
        rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + NODE_W / 2} y={y - (sublabel ? 6 : 0)}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily={T.fMono} fontSize={10} fill={textColor} fontWeight={600}>
        {label.length > 18 ? label.slice(0, 16) + '…' : label}
      </text>
      {sublabel && (
        <text x={x + NODE_W / 2} y={y + 10}
          textAnchor="middle" dominantBaseline="middle"
          fontFamily={T.fSans} fontSize={9} fill={T.n400}>
          {sublabel}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const cx1 = x1 + (x2 - x1) * 0.5;
  const cx2 = x1 + (x2 - x1) * 0.5;
  return (
    <path
      d={`M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`}
      fill="none" stroke={T.n300} strokeWidth={1.5}
      markerEnd="url(#arrowhead)"
    />
  );
}

/** Derive upstream source tables from feature domain + substrate */
function getUpstreamSources(feature: HermesFeature): { label: string; sub: string }[] {
  const sources: { label: string; sub: string }[] = [];

  if (feature.substrate === 'A' || feature.dualTier) {
    sources.push({ label: 'event_match_end', sub: 'Kafka · Substrate A' });
  }
  if (feature.substrate === 'B' || feature.dualTier) {
    const tableMap: Record<string, string> = {
      'identity-lifecycle': 'dim_user_identity',
      'monetization': 'fct_iap_transactions',
      'currency': 'fct_currency_balance',
      'engagement': 'fct_session_events',
      'gameplay-cfm': 'fct_cfm_match_results',
      'stateful-streaks': 'fct_cfm_ranked_match_results',
      'inventory': 'fct_inventory_events',
      'promotion-config': 'cfg_promotion_active',
      'social-playstyle': 'fct_social_events',
      'test-system': 'cfg_test_accounts',
      'campaign-engagement': 'fct_campaign_interactions',
    };
    const table = tableMap[feature.domain] ?? `fct_${feature.domain.replace(/-/g, '_')}`;
    sources.push({ label: table, sub: 'Iceberg · Substrate B' });
  }

  return sources.slice(0, 2); // max 2 upstream sources for clarity
}

export const LineageTab: React.FC<LineageTabProps> = ({ feature, segments, campaigns }) => {
  const sources = getUpstreamSources(feature);
  const downSegs = segments.slice(0, 3);
  const downCamps = campaigns.slice(0, 2);
  const downstreamCount = downSegs.length + downCamps.length;

  // Vertical positions for source nodes
  const sourceYs = sources.length === 1
    ? [MID_Y]
    : sources.map((_, i) => MID_Y - 30 + i * 60);

  // Vertical positions for downstream nodes
  const downstreamItems = [
    ...downSegs.map((s) => ({ label: s.displayName, sub: 'segment', color: T.blue600 })),
    ...downCamps.map((c) => ({ label: c.displayName, sub: 'campaign', color: T.brand })),
  ];
  const totalDown = downstreamItems.length;
  const downYs = totalDown === 0
    ? []
    : totalDown === 1
    ? [MID_Y]
    : downstreamItems.map((_, i) => {
        const spread = Math.min((totalDown - 1) * 48, 180);
        return MID_Y - spread / 2 + (i / (totalDown - 1)) * spread;
      });

  // Pipeline node label — PM-facing toolbar copy (Phase 2 v2).
  // Engineer detail signals (Substrate A/B) live on the source-table sublabels below.
  const pipelineLabel = feature.dualTier
    ? 'Dual-tier pipeline'
    : `${TIER_LABEL[feature.latencyTier]} materialiser`;

  return (
    <div>
      <div style={{
        fontFamily: T.fSans, fontSize: 11, color: T.n400, marginBottom: 16,
        fontStyle: 'italic',
      }}>
        Upstream source tables → Hermes pipeline → downstream segments & campaigns
      </div>

      <div style={{
        border: `1px solid ${T.n200}`, borderRadius: 8,
        background: T.n50, overflow: 'hidden',
      }}>
        <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4"
              refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill={T.n300} />
            </marker>
          </defs>

          {/* Column labels */}
          {(['Sources', 'Pipeline', 'Downstream'] as const).map((label, i) => {
            const xs = [COL_X.source, COL_X.pipeline, COL_X.downstream];
            return (
              <text key={label} x={(xs[i] ?? 0) + NODE_W / 2} y={20}
                textAnchor="middle" fontFamily={T.fSans} fontSize={9}
                fill={T.n400} fontWeight={700}>
                {label.toUpperCase()}
              </text>
            );
          })}

          {/* Source nodes */}
          {sources.map((src, i) => {
            const y = sourceYs[i] ?? MID_Y;
            return (
              <g key={src.label}>
                <NodeBox
                  x={COL_X.source} y={y}
                  label={src.label} sublabel={src.sub}
                  fill="#f0fdf4" stroke="#86efac" textColor={T.green600}
                />
                {/* Arrow source → pipeline */}
                <Arrow
                  x1={COL_X.source + NODE_W} y1={y}
                  x2={COL_X.pipeline} y2={MID_Y}
                />
              </g>
            );
          })}

          {/* Pipeline node */}
          <NodeBox
            x={COL_X.pipeline} y={MID_Y}
            label={feature.name.length > 16 ? feature.name.slice(0, 14) + '…' : feature.name}
            sublabel={pipelineLabel}
            fill={T.brandSoft} stroke={T.brandBorder} textColor={T.brand}
          />

          {/* Downstream nodes */}
          {downstreamItems.map((item, i) => {
            const y = downYs[i] ?? MID_Y;
            const isSegment = item.sub === 'segment';
            return (
              <g key={i}>
                <Arrow
                  x1={COL_X.pipeline + NODE_W} y1={MID_Y}
                  x2={COL_X.downstream} y2={y}
                />
                <NodeBox
                  x={COL_X.downstream} y={y}
                  label={item.label} sublabel={item.sub}
                  fill={isSegment ? '#eff6ff' : T.brandSoft}
                  stroke={isSegment ? '#bfdbfe' : T.brandBorder}
                  textColor={isSegment ? T.blue600 : T.brand}
                />
              </g>
            );
          })}

          {/* Empty downstream placeholder */}
          {downstreamCount === 0 && (
            <text x={COL_X.downstream + NODE_W / 2} y={MID_Y}
              textAnchor="middle" dominantBaseline="middle"
              fontFamily={T.fSans} fontSize={11} fill={T.n400}>
              No downstream consumers
            </text>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { color: T.green600, bg: '#f0fdf4', label: 'Source table' },
          { color: T.brand, bg: T.brandSoft, label: 'Feature pipeline' },
          { color: T.blue600, bg: '#eff6ff', label: 'Segment' },
          { color: T.brand, bg: T.brandSoft, label: 'Campaign' },
        ].map(({ color, bg, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1px solid ${color}` }} />
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
