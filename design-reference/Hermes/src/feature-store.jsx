/* global React, window, Icon, LatencyBadge, GoalBadge, Avatar, Sparkline, StatusDot, fmtNum */
const { useState: useStateH } = React;

// ─── 00 Home ──────────────────────────────────────────────────────────────
function HomeScreen({ navigate }) {
  const { CAMPAIGNS, SEGMENTS, FEATURES } = window.HERMES_DATA;
  const activeCmps = CAMPAIGNS.filter(c => c.status === 'Active');
  const driftSegs = SEGMENTS.filter(s => s.drift);

  const tile = (label, value, sub, onClick, accent) => (
    <button onClick={onClick} className="card elev-1" style={{
      padding: 20, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'transform .12s, box-shadow .12s', minHeight: 124,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px -8px rgba(10,10,10,0.16)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
      <span className="t-mini" style={{ color: accent ? 'var(--accent-2)' : undefined }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 500, color: accent ? 'var(--accent)' : 'var(--ink)', lineHeight: 1 }}>{value}</span>
      <span className="t-meta" style={{ marginTop: 'auto' }}>{sub}</span>
    </button>
  );

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 32px 60px' }} data-screen-label="00 Home">
      <div style={{ marginBottom: 32 }}>
        <span className="t-mini">May 8, 2026 · Hermes v0.4 build · PTG pilot</span>
        <h1 className="serif" style={{ fontSize: 44, lineHeight: 1.15, margin: '10px 0 22px', maxWidth: 760 }}>
          Compose audiences and activate campaigns over the LiveOps feature store.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', maxWidth: 720, margin: 0 }}>
          Self-service authoring across two substrates: Apollo TEE for real-time event triggers,
          GDS Hatchet over Trino + Iceberg for batch segments. One semantic layer, one set of features, one place to ship.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {tile('Active campaigns', activeCmps.length, `${CAMPAIGNS.filter(c => c.status === 'Draft').length} in draft · ${CAMPAIGNS.filter(c => c.status === 'Ended').length} ended this month`, () => navigate('campaign-library'), true)}
        {tile('Active segments', SEGMENTS.filter(s => s.status !== 'Draft').length, `${SEGMENTS.filter(s => s.status === 'Draft').length} in draft · ${driftSegs.length} with drift this week`, () => navigate('segment-library'))}
        {tile('Features in store', '127', '38 hot · 56 warm · 33 cold · 12 added this month', () => navigate('feature-library'))}
        {tile('Events on bus', '47', '8 domains · 1 schema drift this week', () => {})}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Active campaigns list */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontFamily: 'var(--sans)', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>Active campaigns</h3>
            <button className="btn ghost sm" onClick={() => navigate('campaign-library')}>
              View all <Icon name="arrow" size={12}/>
            </button>
          </div>
          {activeCmps.slice(0, 5).map(c => (
            <div key={c.id} onClick={() => navigate('campaign-monitoring', { id: c.id })}
              style={{ display: 'grid', gridTemplateColumns: '1.6fr 100px 90px 80px', gap: 12, alignItems: 'center',
                padding: '14px 18px', borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafaf6'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span className="serif" style={{ fontSize: 16 }}>{c.display}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{c.id} · {c.triggerType}</span>
              </div>
              <GoalBadge goal={c.goal} size="sm"/>
              <Sparkline data={c.spark} accent={c.lift && c.lift.includes('+')}/>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
                color: c.lift && c.lift.includes('+') ? 'var(--success)' : 'var(--ink-3)' }}>
                {c.lift}
              </span>
            </div>
          ))}
        </div>

        {/* Right column — quick actions + drift */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Start something</h3>
            </div>
            <div style={{ padding: 8 }}>
              {[
                ['Build a segment', 'Compose a population from features.', 'database', () => navigate('segment-canvas', { fresh: true })],
                ['Launch a campaign', 'Activate over a segment or live event.', 'send', () => navigate('campaign-canvas', { type: 'realtime' })],
                ['Browse the feature store', 'See what predicates can compose.', 'layers', () => navigate('feature-library')],
              ].map(([t, d, ic, fn]) => (
                <button key={t} onClick={fn} style={{
                  display: 'flex', gap: 12, alignItems: 'center', padding: 12, width: '100%',
                  border: 0, background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-tint)',
                    color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={ic} size={16}/>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t}</span>
                    <span className="t-meta">{d}</span>
                  </span>
                  <Icon name="chevright" size={14} color="var(--ink-4)"/>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="alert" size={14} color="var(--amber)"/> Anomalies
              </h3>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span className="t-mini">Drift detected · 1 segment</span>
                <button onClick={() => navigate('segment-library')} style={{
                  display: 'block', textAlign: 'left', marginTop: 4, padding: 0, background: 'none', border: 0, cursor: 'pointer',
                }}>
                  <span className="serif" style={{ fontSize: 14 }}>{driftSegs[0]?.display}</span>
                  <div className="t-meta">audience size +18% above expected envelope, 2 days running</div>
                </button>
              </div>
              <div>
                <span className="t-mini">Schema drift · 1 event</span>
                <div style={{ marginTop: 4 }}>
                  <span className="mono" style={{ fontSize: 12 }}>event_lobby_idle_60min</span>
                  <div className="t-meta">timer event volume −22% over last 7 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 01 Feature Store Library ─────────────────────────────────────────────
function FeatureLibrary({ navigate }) {
  const { FEATURES, FEATURE_DOMAINS } = window.HERMES_DATA;
  const [groupBy, setGroupBy] = useStateH('domain');
  const [filterTier, setFilterTier] = useStateH('all');
  const [query, setQuery] = useStateH('');

  let features = FEATURES;
  if (filterTier !== 'all') features = features.filter(f => f.tier === filterTier || (filterTier === 'hot' && f.tierBadges.some(b => b.includes('A'))));
  if (query) features = features.filter(f => f.id.includes(query) || f.display.toLowerCase().includes(query.toLowerCase()));

  // Group features
  const groups = {};
  features.forEach(f => {
    const k = groupBy === 'domain' ? (FEATURE_DOMAINS.find(d => d.key === f.domain)?.label || f.domain)
            : groupBy === 'tier' ? (f.tier === 'dual' ? 'Dual-tier (A + B)' : f.tier === 'warm' ? 'Warm (<1h · B)' : f.tier === 'cold' ? 'Cold (<1d · B)' : 'Hot (<1s · A)')
            : 'All';
    if (!groups[k]) groups[k] = [];
    groups[k].push(f);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '224px 1fr', height: '100%' }} data-screen-label="01 Feature Store · Library">
      {/* Filter rail */}
      <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--line)', padding: '20px 16px', overflowY: 'auto' }}>
        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Group by</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {[['domain','Domain'],['tier','Tier'],['owner','Owner'],['none','None']].map(([k, l]) => (
            <button key={k} onClick={() => setGroupBy(k)} style={{
              padding: '6px 8px', borderRadius: 5, textAlign: 'left', fontSize: 12.5,
              background: groupBy === k ? 'var(--hover)' : 'transparent',
              color: groupBy === k ? 'var(--ink)' : 'var(--ink-3)', fontWeight: groupBy === k ? 500 : 400,
            }}>{l}</button>
          ))}
        </div>

        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Latency class</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 22 }}>
          {[['all','All tiers',127],['hot','Hot · <1s · A',38],['warm','Warm · <1h · B',56],['cold','Cold · <1d · B',33]].map(([k, l, n]) => (
            <button key={k} onClick={() => setFilterTier(k)} style={{
              padding: '6px 8px', borderRadius: 5, textAlign: 'left', fontSize: 12.5,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: filterTier === k ? 'var(--hover)' : 'transparent', color: filterTier === k ? 'var(--ink)' : 'var(--ink-3)',
            }}>
              <span>{l}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-5)' }}>{n}</span>
            </button>
          ))}
        </div>

        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Type</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {['Counter','Streak','Score','Tag','Boolean','Tuple','Array'].map(t => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 12.5, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--ink)' }}/> {t}
            </label>
          ))}
        </div>

        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Owner</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[['GDS','TL'],['CFM','KP'],['NTH','NL'],['TF','VT']].map(([t, av]) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 12.5, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--ink)' }}/>
              <Avatar initials={av} size={18}/>
              {t}
            </label>
          ))}
        </div>
      </aside>

      {/* List */}
      <div style={{ overflowY: 'auto' }}>
        <div style={{ padding: '24px 32px 8px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <h1 className="serif" style={{ margin: 0, fontSize: 28 }}>Feature Store</h1>
            <button className="btn primary"><Icon name="plus" size={13}/>Register feature</button>
          </div>
          <p className="t-meta" style={{ margin: '0 0 12px', maxWidth: 640 }}>
            127 features · 38 hot tier · 56 warm · 33 cold · 12 added this month. The atomic primitives
            both substrates share — Apollo TEE for &lt;1s reads, Hatchet + Trino + Iceberg for batch.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <span style={{ position: 'absolute', left: 10, top: 9, color: 'var(--ink-4)' }}><Icon name="search" size={14}/></span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search features…"
                className="input" style={{ width: '100%', paddingLeft: 32, height: 32 }}/>
            </div>
            <button className="btn sm"><Icon name="sparkle" size={12}/>Recently added</button>
            <button className="btn sm"><Icon name="alert" size={12}/>Drift detected</button>
          </div>
        </div>

        <div style={{ padding: '8px 32px 40px' }}>
          {Object.entries(groups).map(([gName, gFeatures]) => (
            <div key={gName} style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 0' }}>
                <h2 className="serif" style={{ margin: 0, fontSize: 18 }}>{gName}</h2>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-5)' }}>{gFeatures.length}</span>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {gFeatures.map((f, i) => (
                  <FeatureRow key={f.id} feature={f} navigate={navigate} last={i === gFeatures.length - 1}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ feature, navigate, last }) {
  return (
    <div onClick={() => navigate('feature-detail', { id: feature.id })}
      style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) 80px minmax(0, 1fr) 80px 70px 100px 24px',
        gap: 14, alignItems: 'center', padding: '12px 18px',
        borderBottom: last ? 0 : '1px solid var(--hairline)', cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#fafaf6'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span className="mono" style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feature.id}</span>
        <span className="serif" style={{ fontSize: 14, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feature.display}</span>
      </div>
      <span className="pill">{feature.type}</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {feature.tierBadges.map(b => <LatencyBadge key={b} tier={b}/>)}
      </div>
      <Avatar initials={feature.ownerAvatar} size={22}/>
      <Sparkline data={feature.spark || [4,4,5,5,5,5,5]} w={64}/>
      <span className="t-meta" style={{ fontFamily: 'var(--mono)', fontSize: 11, textAlign: 'right' }}>
        {feature.usedBy.segments} seg · {feature.usedBy.campaigns} cmp
      </span>
      <Icon name="chevright" size={14} color="var(--ink-5)"/>
    </div>
  );
}

// ─── 02 Feature Detail ────────────────────────────────────────────────────
function FeatureDetail({ id, navigate }) {
  const f = (window.HERMES_DATA.FEATURES || []).find(f => f.id === id) || window.HERMES_DATA.FEATURES[0];
  const [tab, setTab] = useStateH('overview');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: '100%' }} data-screen-label="02 Feature Store · Detail">
      <div style={{ overflowY: 'auto' }}>
        {/* Breadcrumb + header */}
        <div style={{ padding: '16px 32px 0' }}>
          <button onClick={() => navigate('feature-library')} className="btn ghost sm" style={{ paddingLeft: 0 }}>
            <Icon name="chevleft" size={12}/> Feature Store
          </button>
        </div>
        <div style={{ padding: '8px 32px 20px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 18, fontWeight: 500 }}>{f.id}</span>
                <span className="pill">{f.type}</span>
                {f.tierBadges.map(b => <LatencyBadge key={b} tier={b}/>)}
                <StatusDot status="Active"/>
              </div>
              <h1 className="serif" style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>{f.display}</h1>
              <p style={{ color: 'var(--ink-3)', maxWidth: 720, marginTop: 12, fontSize: 13.5 }}>{f.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, fontSize: 12, color: 'var(--ink-4)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar initials={f.ownerAvatar} size={20}/> {f.owner} owns</span>
                <span>·</span>
                <span>Last refresh {f.freshness}</span>
                <span>·</span>
                <span>{f.usedBy.segments} segments · {f.usedBy.campaigns} campaigns</span>
              </div>
            </div>
            <button className="btn"><Icon name="edit" size={12}/>Edit definition</button>
          </div>
        </div>

        <div style={{ padding: '0 32px' }}>
          <div className="tabs">
            {['overview','lineage','used by'].map(t => (
              <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'used by' ? `Used by (${f.usedBy.segments + f.usedBy.campaigns})` : t[0].toUpperCase() + t.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {tab === 'overview' && (
          <div style={{ padding: '24px 32px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Definition — semantic layer made literal */}
            <div className="card">
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="t-mini">Definition</span>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>One definition compiles to both substrates · Semantic Management Layer</div>
                </div>
                <span className="pill info"><Icon name="zap" size={11}/>compiles to A + B</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: 18, borderRight: '1px solid var(--hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <LatencyBadge tier="<1s · A"/>
                    <span className="t-mini">expr-lang · Apollo TEE</span>
                  </div>
                  <pre className="mono" style={{ margin: 0, padding: 12, background: '#faf8f3', borderRadius: 6, fontSize: 12, lineHeight: 1.6, overflowX: 'auto' }}>{`feature consecutive_ranked_losses_streak: int {
  on event_match_end:
    if event.outcome == "lose":
      state.value + 1
    else:
      0
  initial: 0
  ttl: never
}`}</pre>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <LatencyBadge tier="<1h · B"/>
                    <span className="t-mini">dbt + Trino · Iceberg</span>
                  </div>
                  <pre className="mono" style={{ margin: 0, padding: 12, background: '#faf8f3', borderRadius: 6, fontSize: 12, lineHeight: 1.6, overflowX: 'auto' }}>{`SELECT
  uid,
  COUNT(*) FILTER (
    WHERE outcome = 'lose'
    AND ts > last_win_ts
  ) AS consecutive_ranked_losses_streak
FROM events.match_end
GROUP BY uid`}</pre>
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="card" style={{ padding: 18 }}>
              <span className="t-mini">Storage & materialization</span>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--ink-2)' }}>
                Counter, integer, served from <span className="mono" style={{ background: '#f3f1ec', padding: '1px 6px', borderRadius: 4 }}>Redis online tier</span> (hot)
                and <span className="mono" style={{ background: '#f3f1ec', padding: '1px 6px', borderRadius: 4 }}>Iceberg offline tier</span>.
                CDC keeps the warm batch view consistent with the realtime state store.
              </p>
            </div>

            {/* Distribution */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span className="t-mini">Distribution · 7 days</span>
                <span className="t-meta mono" style={{ fontSize: 11 }}>n = 1.2M players</span>
              </div>
              <div className="histo" style={{ height: 110 }}>
                {(f.hist || [70,55,38,28,20,15,12,10,8,6,5,5,4,4,3,3,3,3,2,2,2,2,2,2,1,1,1,1]).map((v, i) => (
                  <div key={i} className="bar" style={{ height: `${(v / Math.max(...(f.hist || [70]))) * 100}%`, background: i < 4 ? '#d4d2cc' : i < 12 ? '#a3a3a3' : '#525252' }}/>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)', marginTop: 8 }}>
                <span>0</span><span>p50 = {f.p50 ?? '—'}</span><span>p90 = {f.p90 ?? '—'}</span><span>p99 = {f.p99 ?? '—'}</span><span>{f.max ?? '—'}</span>
              </div>
            </div>

            {/* Recent values */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid var(--hairline)' }}>
                <span className="t-mini">Recent values · sample</span>
                <span className="t-meta mono" style={{ fontSize: 11 }}>refreshing live</span>
              </div>
              {[
                ['cfl_22893012', 7, '14s ago', 'increasing'],
                ['cfl_45112309', 5, '32s ago', 'flat'],
                ['cfl_88421076', 0, '47s ago', 'reset on win'],
                ['cfl_19834204', 12, '1m 4s ago', 'flagged'],
                ['cfl_60917432', 3, '1m 18s ago', 'increasing'],
              ].map(([uid, val, ago, note], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 100px 120px 1fr', gap: 12, padding: '8px 18px', alignItems: 'center', borderBottom: i === 4 ? 0 : '1px solid var(--hairline)' }}>
                  <span className="mono" style={{ fontSize: 12 }}>{uid}</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: val >= 5 ? 'var(--accent-2)' : 'var(--ink)' }}>{val}</span>
                  <span className="t-meta mono" style={{ fontSize: 11 }}>{ago}</span>
                  <span className="t-meta">{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'lineage' && (
          <div style={{ padding: '24px 32px' }}>
            <div className="card" style={{ padding: 32 }}>
              <span className="t-mini">Upstream → Computation → Downstream</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
                <div>
                  <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Upstream</span>
                  {['kafka.match_end', 'iceberg.player_dim'].map(s => (
                    <div key={s} className="mono" style={{ padding: '8px 10px', background: '#fafaf6', border: '1px solid var(--hairline)', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>{s}</div>
                  ))}
                </div>
                <div>
                  <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Computation</span>
                  <div className="mono" style={{ padding: '8px 10px', background: '#faf8f3', border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}>
                    expr-lang stateful counter (TEE)
                  </div>
                  <div className="mono" style={{ padding: '8px 10px', background: '#faf8f3', border: '1px solid var(--line)', borderRadius: 6, fontSize: 12, marginTop: 6 }}>
                    Hatchet workflow `streak_warm_refresh_v2`
                  </div>
                </div>
                <div>
                  <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Downstream</span>
                  {[
                    ['seg-cfm-loss-streak-non-paying-2026', 'segment'],
                    ['cmp-cfm-407 · Pass Stuck Rescue', 'campaign'],
                  ].map(([s, t]) => (
                    <div key={s} className="mono" style={{ padding: '8px 10px', background: '#fafaf6', border: '1px solid var(--hairline)', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'used by' && (
          <div style={{ padding: '24px 32px' }}>
            <div className="card">
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--hairline)' }}>
                <span className="t-mini">Segments referencing this feature</span>
              </div>
              {window.HERMES_DATA.SEGMENTS.filter(s => ['seg-cfm-loss-streak-non-paying-2026-0508-a3f9', 'seg-cfm-pass-stuck-responders'].includes(s.id)).map(s => (
                <div key={s.id} onClick={() => navigate('segment-monitoring', { id: s.id })}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 100px 100px 80px', gap: 16, padding: '10px 18px', borderBottom: '1px solid var(--hairline)', cursor: 'pointer', alignItems: 'center' }}>
                  <div>
                    <span className="serif" style={{ fontSize: 14 }}>{s.display}</span>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{s.id}</div>
                  </div>
                  <GoalBadge goal={s.goal} size="sm"/>
                  <span className="mono" style={{ fontSize: 12 }}>{fmtNum(s.size)}</span>
                  <Icon name="chevright" size={14} color="var(--ink-5)"/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right rail — actions */}
      <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--line)', padding: 0, overflowY: 'auto' }}>
        <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--hairline)' }}>
          <button onClick={() => navigate('segment-canvas', { fresh: true, seedFeature: f.id })}
            className="btn accent" style={{ width: '100%', justifyContent: 'center', height: 36 }}>
            <Icon name="plus" size={14}/> Use in segment
          </button>
          <button className="btn" style={{ width: '100%', justifyContent: 'center', height: 32, marginTop: 8 }}>
            <Icon name="scope" size={13}/> Investigate in Explore
          </button>
        </div>
        <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--hairline)' }}>
          <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Related in domain</span>
          {window.HERMES_DATA.FEATURES.filter(x => x.domain === f.domain && x.id !== f.id).slice(0, 4).map(x => (
            <button key={x.id} onClick={() => navigate('feature-detail', { id: x.id })}
              style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', textAlign: 'left',
                width: '100%', borderRadius: 6, background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <span className="mono" style={{ fontSize: 11.5 }}>{x.id}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{x.tierBadges[0]}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '20px 18px' }}>
          <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Materialization</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
            {[
              ['Last refresh', f.freshness, 'success'],
              ['Freshness SLA', '<1h · met', 'success'],
              ['Recent runs', '24/24 ok · 7d'],
              ['Storage', 'Redis + Iceberg'],
            ].map(([l, v, s], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="t-meta">{l}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: s === 'success' ? 'var(--success)' : 'var(--ink-2)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

Object.assign(window, { HomeScreen, FeatureLibrary, FeatureDetail });
