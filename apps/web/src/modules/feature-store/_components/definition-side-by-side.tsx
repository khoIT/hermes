/**
 * DefinitionSideBySide — two-column mono block showing the Semantic
 * Management Layer definition: expr-lang (Substrate A) + dbt SQL (Substrate B).
 * Per PRD §6.3 — "one definition, two materializations" pitch.
 */
import React from 'react';
import { T } from '../../../theme';
import type { HermesFeature } from '@hermes/contracts';

interface DefinitionSideBySideProps {
  feature: HermesFeature;
}

/** Generate a placeholder expr-lang snippet for features without a definition */
function placeholderExprLang(feature: HermesFeature): string {
  return [
    `# Substrate A — TEE online state at event arrival`,
    `WHEN event.uid IS NOT NULL`,
    `  THEN AGGREGATE(${feature.name}, window='session')`,
    `ELSE @state.${feature.name}`,
  ].join('\n');
}

/** Generate a placeholder dbt SQL snippet for features without a definition */
function placeholderDbtSql(feature: HermesFeature): string {
  return [
    `-- Substrate B — Hatchet/Trino warm tier refresh every <${feature.latencyTier}>`,
    `SELECT`,
    `  uid,`,
    `  ${feature.type === 'int' ? 'COUNT(*)' : 'MAX(value)'} AS ${feature.name}`,
    `FROM {{ ref("fct_${feature.domain.replace(/-/g, '_')}_events") }}`,
    `WHERE ds >= CURRENT_DATE - INTERVAL '7' DAY`,
    `GROUP BY uid`,
  ].join('\n');
}

const CodeBlock: React.FC<{
  title: string;
  subtitle: string;
  code: string;
  accentColor: string;
}> = ({ title, subtitle, code, accentColor }) => (
  <div style={{
    flex: 1, minWidth: 0,
    border: `1px solid ${T.n200}`, borderRadius: 8,
    overflow: 'hidden',
  }}>
    {/* Header bar */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px',
      background: T.n50, borderBottom: `1px solid ${T.n200}`,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: 2, background: accentColor, flexShrink: 0,
      }} />
      <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.n700, fontWeight: 600 }}>
        {title}
      </span>
      <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400 }}>
        {subtitle}
      </span>
    </div>
    {/* Code body */}
    <pre style={{
      margin: 0, padding: '14px 16px',
      fontFamily: T.fMono, fontSize: 12, lineHeight: 1.65,
      color: T.n800, background: '#fff',
      overflowX: 'auto',
      whiteSpace: 'pre',
      minHeight: 120,
    }}>
      {code}
    </pre>
  </div>
);

export const DefinitionSideBySide: React.FC<DefinitionSideBySideProps> = ({ feature }) => {
  const exprLang = feature.definition?.exprLang ?? placeholderExprLang(feature);
  const dbtSql = feature.definition?.dbtSql ?? placeholderDbtSql(feature);
  const isReal = Boolean(feature.definition);

  return (
    <div>
      {/* Section heading */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{
          fontFamily: T.fSans, fontSize: 11, fontWeight: 700, color: T.n500,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Semantic Definition — one source, two materializations
        </div>
        {!isReal && (
          <span style={{
            fontFamily: T.fMono, fontSize: 10, color: T.n400,
            padding: '1px 6px', border: `1px solid ${T.n200}`, borderRadius: 4,
          }}>
            generated placeholder
          </span>
        )}
      </div>

      {/* Side-by-side blocks */}
      <div style={{ display: 'flex', gap: 12 }}>
        <CodeBlock
          title="Substrate A · expr-lang"
          subtitle="Apollo TEE · real-time"
          code={exprLang}
          accentColor={T.green600}
        />
        <CodeBlock
          title="Substrate B · dbt SQL over Iceberg"
          subtitle="Hatchet/Trino · warm batch"
          code={dbtSql}
          accentColor={T.amber500}
        />
      </div>

      {/* Pitch line */}
      <div style={{
        marginTop: 10, fontFamily: T.fSans, fontSize: 11, color: T.n400,
        fontStyle: 'italic',
      }}>
        This definition compiles once and materialises to both substrates automatically —
        no duplicate logic to maintain.
      </div>
    </div>
  );
};
