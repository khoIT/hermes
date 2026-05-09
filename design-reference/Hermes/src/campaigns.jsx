/* global React, window, Icon, LatencyBadge, GoalBadge, Avatar, Sparkline, StatusDot, fmtNum, getFeature */
const { useState: useSC, useEffect: useEC, useMemo: useMC } = React;

// ─── 09 Campaign Library ──────────────────────────────────────────────────
function CampaignLibrary({ navigate }) {
  const { CAMPAIGNS } = window.HERMES_DATA;
  const [groupBy, setGroupBy] = useSC('goal');
  const [filterStatus, setFilterStatus] = useSC('all');

  let cmps = CAMPAIGNS;
  if (filterStatus !== 'all') cmps = cmps.filter(c => c.status === filterStatus);

  const groups = {};
  cmps.forEach(c => {
    const k = groupBy === 'goal' ? c.goal
            : groupBy === 'trigger' ? c.triggerType
            : groupBy === 'status' ? c.status
            : 'All';
    if (!groups[k]) groups[k] = [];
    groups[k].push(c);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '224px 1fr', height: '100%' }} data-screen-label="09 Campaigns · Library">
      <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--line)', padding: '20px 16px', overflowY: 'auto' }}>
        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Group by</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {[['goal','4R goal'],['trigger','Trigger type'],['status','Status'],['none','None']].map(([k, l]) => (
            <button key={k} onClick={() => setGroupBy(k)} style={{
              padding: '6px 8px', borderRadius: 5, textAlign: 'left', fontSize: 12.5,
              background: groupBy === k ? 'var(--hover)' : 'transparent', color: groupBy === k ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: groupBy === k ? 500 : 400,
            }}>{l}</button>
          ))}
        </div>

        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Status</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {[['all','All'],['Active','Active'],['Draft','Draft'],['Ended','Ended']].map(([k, l]) => (
            <button key={k} onClick={() => setFilterStatus(k)} style={{
              padding: '6px 8px', borderRadius: 5, textAlign: 'left', fontSize: 12.5,
              background: filterStatus === k ? 'var(--hover)' : 'transparent', color: filterStatus === k ? 'var(--ink)' : 'var(--ink-3)',
            }}>{l}</button>
          ))}
        </div>

        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Trigger type</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {['Real-time','Scheduled','One-time'].map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 12.5, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--ink)' }}/> {s}
            </label>
          ))}
        </div>
      </aside>

      <div style={{ overflowY: 'auto' }}>
        <div style={{ padding: '24px 32px 8px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <h1 className="serif" style={{ margin: 0, fontSize: 28 }}>Campaigns</h1>
            <button onClick={() => navigate('campaign-canvas', { type: 'realtime' })} className="btn accent">
              <Icon name="plus" size={13}/> Build campaign
            </button>
          </div>
          <p className="t-meta" style={{ margin: '0 0 14px', maxWidth: 720 }}>
            23 active · 8 in draft · 12 monitoring · 4 ended this month. Each campaign wraps an audience with an action,
            a holdout, and a 4R goal. Real-time campaigns mint a <span className="mono">TriggerID</span> on activation;
            segment-backed campaigns reference a <span className="mono">SegmentID</span>.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 }}>
            <span className="t-meta" style={{ marginRight: 8 }}>Start from:</span>
            <button className="btn sm"><Icon name="target" size={12}/>A goal</button>
            <button className="btn sm"><Icon name="sparkle" size={12}/>A hypothesis</button>
            <button className="btn sm"><Icon name="bookmark" size={12}/>An archetype</button>
            <button className="btn sm"><Icon name="layers" size={12}/>An existing Segment</button>
            <button className="btn sm"><Icon name="branch" size={12}/>Build a journey</button>
          </div>
        </div>

        <div style={{ padding: '8px 32px 40px' }}>
          {Object.entries(groups).map(([gName, gCmps]) => (
            <div key={gName} style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 0' }}>
                {groupBy === 'goal'
                  ? <GoalBadge goal={gName}/>
                  : <h2 className="serif" style={{ margin: 0, fontSize: 18 }}>{gName}</h2>}
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-5)' }}>{gCmps.length}</span>
              </div>
              <div className="card">
                {gCmps.map((c, i) => <CampaignRow key={c.id} cmp={c} navigate={navigate} last={i === gCmps.length - 1}/>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignRow({ cmp, navigate, last }) {
  return (
    <div onClick={() => navigate(cmp.status === 'Draft' ? 'campaign-canvas' : 'campaign-monitoring', { id: cmp.id, type: 'realtime' })}
      style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 80px 90px 80px 80px 70px 24px',
        gap: 12, alignItems: 'center', padding: '14px 18px',
        borderBottom: last ? 0 : '1px solid var(--hairline)', cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#fafaf6'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className="serif" style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{cmp.display}</span>
          {cmp.liftSig && <span className="pill" style={{ fontSize: 10, background: '#dcf2e3', color: '#146c43', borderColor: '#bce5c8', flexShrink: 0 }}>p&lt;.05</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'nowrap' }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', flexShrink: 0 }}>{cmp.id}</span>
          <span style={{ color: 'var(--ink-5)', flexShrink: 0 }}>·</span>
          <span className="t-meta" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{cmp.audienceLabel}</span>
          <Avatar initials={cmp.ownerAvatar} size={16}/>
        </div>
      </div>
      <GoalBadge goal={cmp.goal} size="sm"/>
      <span className="pill" style={{ fontSize: 10.5,
        background: cmp.triggerType === 'Real-time' ? '#fff2eb' : cmp.triggerType === 'Scheduled' ? '#eaf2ff' : '#f3f1ec',
        borderColor: cmp.triggerType === 'Real-time' ? '#f8c9b0' : cmp.triggerType === 'Scheduled' ? '#c7d9f7' : '#e7e5e0',
        color: cmp.triggerType === 'Real-time' ? '#9a3412' : cmp.triggerType === 'Scheduled' ? '#1e63ce' : '#525252',
      }}>{cmp.triggerType}</span>
      <StatusDot status={cmp.status}/>
      <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{cmp.fires}</span>
      <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: cmp.lift && cmp.lift.startsWith('+') ? 'var(--success)' : 'var(--ink-3)' }}>{cmp.lift}</span>
      <Icon name="chevright" size={14} color="var(--ink-5)"/>
    </div>
  );
}

// ─── 10 Campaign Canvas (Real-time / Scheduled / One-time) ────────────────
function CampaignCanvas({ navigate, params }) {
  const seedType = params?.type || 'realtime';
  const [type, setType] = useSC(seedType);
  const [goal, setGoal] = useSC('Retain');
  const [intent, setIntent] = useSC('Rescue players who are losing streaks of ranked matches.');
  const [boundSegment, setBoundSegment] = useSC(params?.seedSegment ? {
    id: params.seedSegment,
    display: 'CFM ranked loss streak · non-paying',
    size: 23890,
  } : {
    id: 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9',
    display: 'CFM ranked loss streak · non-paying',
    size: 23890,
  });
  const [eventSrc, setEventSrc] = useSC('event_match_end');
  const [eventFilter, setEventFilter] = useSC('outcome = lose');
  const [cooldown, setCooldown] = useSC('24h');
  const [freqCap, setFreqCap] = useSC('Once per user per day');
  const [holdout, setHoldout] = useSC(10);
  const [variant, setVariant] = useSC(false);
  const [openTrigThresh, setOpenTrigThresh] = useSC(false);
  const [trigStreak, setTrigStreak] = useSC(5);
  const [showHandoff, setShowHandoff] = useSC(false);
  const [showJourney, setShowJourney] = useSC(false);
  const [showPicker, setShowPicker] = useSC(null);
  const [previewModal, setPreviewModal] = useSC(false);
  const [showPrelaunch, setShowPrelaunch] = useSC(false);

  const isRT = type === 'realtime';
  const isOne = type === 'onetime';
  const substrates = isRT ? ['A','B'] : ['B'];

  // estimated reach
  const estReach = useMC(() => {
    const trgFires = isRT ? Math.round(3200 + (5 - trigStreak) * 600) : null;
    const segReach = boundSegment ? boundSegment.size : 0;
    return { trgFires, segReach };
  }, [isRT, trigStreak, boundSegment]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 304px', height: '100%' }} data-screen-label="10 Campaign · Canvas">
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* breadcrumb */}
        <div style={{ padding: '12px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('campaign-library')} className="btn ghost sm" style={{ paddingLeft: 0 }}>
            <Icon name="chevleft" size={12}/> Campaigns
          </button>
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>draft · cmp-cfm-407</span>
        </div>

        <div style={{ padding: '8px 28px 14px' }}>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>
            CFM-13 Pass Stuck Rescue
          </h1>
        </div>

        {/* Top region — type / goal / intent */}
        <div style={{ padding: '0 28px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Trigger type</span>
            <div style={{ display: 'inline-flex', background: '#f0eee8', padding: 3, borderRadius: 7, gap: 2 }}>
              {[
                ['realtime', 'Real-time event-triggered'],
                ['scheduled', 'Scheduled push'],
                ['onetime', 'One-time push'],
              ].map(([k, l]) => (
                <button key={k} onClick={() => setType(k)} style={{
                  padding: '6px 14px', borderRadius: 5, fontSize: 12.5,
                  background: type === k ? '#fff' : 'transparent',
                  color: type === k ? 'var(--ink)' : 'var(--ink-3)',
                  fontWeight: type === k ? 500 : 400,
                  boxShadow: type === k ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>4R Goal</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Retain','Revenue','Reactivate','Recruit'].map(g => (
                <button key={g} onClick={() => setGoal(g)} style={{
                  padding: '7px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                  border: '1px solid ' + (goal === g ? 'var(--accent)' : 'var(--line)'),
                  background: goal === g ? '#fff2eb' : 'var(--surface)',
                  color: goal === g ? 'var(--accent-2)' : 'var(--ink-3)',
                }}>{g}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Intent</span>
            <input value={intent} onChange={e => setIntent(e.target.value)}
              className="serif input" style={{ fontSize: 17, padding: '12px 14px', fontStyle: 'italic', width: '100%' }}/>
          </div>
        </div>

        {/* Block 1 — Audience */}
        <CanvasBlock num={1} title="Audience">
          {boundSegment ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#faf8f3', borderRadius: 6 }}>
              <Icon name="layers" size={16} color="var(--accent)"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: 14 }}>{boundSegment.display}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{boundSegment.id}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{fmtNum(boundSegment.size)}</div>
                <div className="t-meta" style={{ fontSize: 10.5 }}>UIDs · last build 2h ago</div>
              </div>
              <button className="btn ghost sm" onClick={() => setBoundSegment(null)}><Icon name="x" size={11}/></button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setShowPicker('segment')}>
                <Icon name="layers" size={12}/> Pick existing segment
              </button>
              <button className="btn">
                <Icon name="edit" size={12}/> Define segment inline
              </button>
              {isRT && (
                <span className="t-meta" style={{ fontSize: 11.5, alignSelf: 'center', marginLeft: 6 }}>
                  Optional for real-time campaigns — leave empty to fire on any matching player.
                </span>
              )}
            </div>
          )}
        </CanvasBlock>

        {/* Block 2 — Schedule */}
        <CanvasBlock num={2} title="Schedule">
          {isRT && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <span className="t-mini" style={{ display: 'block', marginBottom: 6 }}>Active range</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input className="input mono" defaultValue="2026-05-09 18:00 ICT" style={{ flex: 1, fontSize: 12 }}/>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>→</span>
                  <input className="input mono" defaultValue="2026-06-09 18:00 ICT" style={{ flex: 1, fontSize: 12 }}/>
                </div>
              </div>
              <div>
                <span className="t-mini" style={{ display: 'block', marginBottom: 6 }}>Frequency cap</span>
                <select className="input" value={freqCap} onChange={e => setFreqCap(e.target.value)}>
                  <option>No frequency limit</option>
                  <option>Once per day</option>
                  <option>Once per user per day</option>
                  <option>Once per user for the duration of this campaign</option>
                </select>
              </div>
            </div>
          )}
          {type === 'scheduled' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <span className="t-mini" style={{ display: 'block', marginBottom: 6 }}>Cadence</span>
                <select className="input"><option>Daily · 09:00 ICT</option><option>Weekly · Mon 09:00</option></select>
              </div>
              <div>
                <span className="t-mini" style={{ display: 'block', marginBottom: 6 }}>Start</span>
                <input className="input mono" defaultValue="2026-05-12" style={{ fontSize: 12 }}/>
              </div>
              <div>
                <span className="t-mini" style={{ display: 'block', marginBottom: 6 }}>End</span>
                <input className="input mono" defaultValue="2026-08-12" style={{ fontSize: 12 }}/>
              </div>
            </div>
          )}
          {isOne && (
            <div style={{ display: 'flex', gap: 18 }}>
              {['Send when ready','On specific date'].map((l, i) => (
                <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                  <input type="radio" name="oneschedule" defaultChecked={i === 0} style={{ accentColor: 'var(--ink)' }}/> {l}
                </label>
              ))}
            </div>
          )}
        </CanvasBlock>

        {/* Block 3 — Event Trigger (real-time only) */}
        {isRT && (
          <CanvasBlock num={3} title="Event trigger" subtitle="Fires per-player on event arrival.">
            {/* Event source */}
            <div style={{ marginBottom: 12 }}>
              <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Event source</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: '#faf8f3', borderRadius: 6, border: '1px solid var(--hairline)' }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>on event = </span>
                <button className="feature-pill active" style={{ background: '#fff' }}>
                  {eventSrc} <Icon name="chevdown" size={10}/>
                </button>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>where</span>
                <span className="mono" style={{ fontSize: 11.5, padding: '2px 8px', background: '#fff', border: '1px solid var(--line)', borderRadius: 4 }}>
                  {eventSrc}.{eventFilter}
                </span>
                <span style={{ flex: 1 }}/>
                <span className="t-meta mono" style={{ fontSize: 10 }}>1.2M /day · 4.6k peak/min</span>
              </div>
            </div>

            {/* Trigger predicate */}
            <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Trigger predicate</span>
            <div className="predicate-group">
              <div className="group-header">
                <span><span className="mono" style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Group 1</span> · match ALL of these</span>
              </div>
              <div className="predicate-row">
                <span className="feature-pill">consecutive_ranked_losses_streak</span>
                <LatencyBadge tier="<1s · A"/>
                <span className="op-pill">≥</span>
                <div style={{ position: 'relative', flex: 1 }}>
                  <button className={`value-pill ${openTrigThresh ? 'editing' : ''}`} onClick={() => setOpenTrigThresh(true)}
                    style={{ minWidth: 56, textAlign: 'left' }}>{trigStreak}</button>
                  {openTrigThresh && (
                    <TrigThresh value={trigStreak} setValue={setTrigStreak} onClose={() => setOpenTrigThresh(false)}/>
                  )}
                </div>
                <button className="btn ghost sm" style={{ height: 24, padding: '0 4px' }}><Icon name="more" size={12}/></button>
              </div>
              <div style={{ padding: '4px 14px', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: 'var(--ink-4)', borderBottom: '1px solid var(--hairline)' }}>AND</div>
              <div className="predicate-row">
                <span className="feature-pill">is_paying_user_lifetime</span>
                <LatencyBadge tier="<1h · B"/>
                <span className="op-pill">=</span>
                <span className="value-pill" style={{ flex: 1 }}>false</span>
                <button className="btn ghost sm" style={{ height: 24, padding: '0 4px' }}><Icon name="more" size={12}/></button>
              </div>
              <div style={{ padding: 10, borderTop: '1px solid var(--hairline)', background: '#fafaf6' }}>
                <button className="btn sm ghost"><Icon name="plus" size={11}/> Add condition</button>
              </div>
            </div>

            {/* Mixed-latency banner */}
            <div className="banner amber" style={{ marginTop: 10 }}>
              <Icon name="alert" size={12}/>
              <span>This trigger evaluates at event time. Batch features (<span className="mono">&lt;1h</span>, <span className="mono">&lt;1d</span>) are point-in-time as of last refresh — today 06:00 for warm, last night for cold.</span>
            </div>

            {/* Cooldown / freq cap / anti-fatigue */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              <div>
                <span className="t-mini" style={{ display: 'block', marginBottom: 6 }}>Per-player cooldown</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['1h','6h','24h','7d'].map(o => (
                    <button key={o} onClick={() => setCooldown(o)} style={{
                      padding: '6px 12px', borderRadius: 5, fontSize: 12, border: '1px solid ' + (cooldown === o ? 'var(--ink)' : 'var(--line)'),
                      background: cooldown === o ? 'var(--ink)' : 'var(--surface)', color: cooldown === o ? '#fff' : 'var(--ink-3)',
                      fontFamily: 'var(--mono)',
                    }}>{o}</button>
                  ))}
                </div>
              </div>
              <div>
                <span className="t-mini" style={{ display: 'block', marginBottom: 6 }}>Global frequency cap</span>
                <select className="input"><option>Unlimited</option><option>10,000 /day</option><option>50,000 /day</option></select>
              </div>
            </div>

            <div style={{ background: '#faf8f3', padding: 12, borderRadius: 6, marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <Icon name="zap" size={14} color="var(--accent)"/>
              <span className="t-meta" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                Anti-fatigue: don't fire if <span className="mono">iam_received_count_24h</span> ≥ 3.
              </span>
              <span style={{ flex: 1 }}/>
              <button className="btn sm ghost">Edit</button>
            </div>
          </CanvasBlock>
        )}

        {/* Block 4 — Action */}
        <CanvasBlock num={isRT ? 4 : 3} title="Action">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" checked={variant} onChange={e => setVariant(e.target.checked)} style={{ accentColor: 'var(--accent)' }}/>
              A/B variant
            </label>
            <span style={{ flex: 1 }}/>
            <span className="t-mini">Channel</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['IAM', true], ['Push'], ['SMS'], ['Email'], ['Grant']].map(([n, on]) => (
                <button key={n} style={{
                  padding: '6px 11px', borderRadius: 5, fontSize: 11.5,
                  border: '1px solid ' + (on ? 'var(--ink)' : 'var(--line)'),
                  background: on ? 'var(--ink)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink-3)',
                }}>{n}</button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>IAM popup · variant A</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input className="input" defaultValue="Bạn đã đến gần rồi! Đừng bỏ cuộc."/>
                <textarea className="input" rows={3} defaultValue="Để chúng tôi tặng bạn 50 gem để tiếp tục chơi và đảo ngược phong độ."/>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input mono" defaultValue="grant: 50 gem" style={{ flex: 1, fontSize: 12 }}/>
                  <input className="input" defaultValue="CTA: Nhận quà" style={{ flex: 1 }}/>
                </div>
              </div>
              <div style={{ background: '#faf8f3', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 140 }}>
                <Icon name="eye" size={20} color="var(--ink-4)"/>
                <span className="t-meta" style={{ fontSize: 11.5, marginTop: 8 }}>414 × 736 · iOS preview</span>
                <button className="btn sm" style={{ marginTop: 10 }} onClick={() => setPreviewModal(true)}>Open preview</button>
              </div>
            </div>
          </div>
        </CanvasBlock>

        {/* Block 5 — Holdout */}
        <CanvasBlock num={isRT ? 5 : 4} title="Holdout">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="mono" style={{ fontSize: 22, fontWeight: 500, color: 'var(--accent)' }}>{100 - holdout}% / {holdout}%</span>
            <span className="t-meta" style={{ fontSize: 12 }}>treatment / control</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
            <input type="range" min={0} max={50} step={5} value={holdout} onChange={e => setHoldout(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent)' }}/>
            <span className="t-meta mono" style={{ fontSize: 11, minWidth: 36, textAlign: 'right' }}>{holdout}%</span>
          </div>
          <p className="t-meta" style={{ fontSize: 11.5, marginTop: 10, marginBottom: 0 }}>
            Powered to detect ≥ {holdout >= 10 ? '2.0' : '4.5'}% lift in D7 retention within 14 days.
          </p>
        </CanvasBlock>

        {/* Block 6 — Forecast + goal alignment */}
        <CanvasBlock num={isRT ? 6 : 5} title="Forecast & goal alignment" last>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 18 }}>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                <Stat label="Est. fires / day" value={isRT ? fmtNum(estReach.trgFires) : '—'} small="cooldown-discounted"/>
                <Stat label="Unique reach / wk" value={isRT ? fmtNum(estReach.trgFires * 5.6) : fmtNum(boundSegment?.size || 0)}/>
                <Stat label="Forecast lift" value="+7.4%" color="var(--success)" small="D7 retention"/>
              </div>
              <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>7-day daily forecast</span>
              <ForecastBars/>
            </div>
            <GoalDial goal={goal}/>
          </div>
        </CanvasBlock>

        {/* Bottom action bar */}
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '1px solid var(--line)',
          padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 5 }}>
          <button className="btn"><Icon name="bookmark" size={12}/>Save draft</button>
          <button className="btn"><Icon name="history" size={12}/>Backtest 30d</button>
          <button className="btn"><Icon name="flask" size={12}/>Test on 100 players</button>
          <button className="btn" onClick={() => setShowPrelaunch(true)}><Icon name="eye" size={12}/>Pre-launch</button>
          <button className="btn" onClick={() => setShowJourney(true)}><Icon name="branch" size={12}/>Journey</button>
          <div style={{ flex: 1 }}/>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', textAlign: 'right' }}>
            Compiles to: Substrate {substrates.join(' + ')}<br/>
            {isRT ? 'Apollo TEE + Hatchet' : 'Hatchet · Activation'}
          </span>
          <button className="btn accent lg" onClick={() => setShowHandoff(true)}>
            Activate · 5% rollout <Icon name="arrow" size={13}/>
          </button>
        </div>
      </div>

      {/* Right rail — materials shelf */}
      <CampaignRail isRT={isRT} boundSegment={boundSegment} eventSrc={eventSrc} navigate={navigate}/>

      {showHandoff && <CampaignHandoff isRT={isRT} hasSegment={!!boundSegment} onClose={() => setShowHandoff(false)} navigate={navigate}/>}
      {showJourney && <JourneyOverlay onClose={() => setShowJourney(false)}/>}
      {showPicker === 'segment' && <SegmentSlideoutPicker onClose={() => setShowPicker(null)} onPick={(s) => { setBoundSegment(s); setShowPicker(null); }}/>}
      {previewModal && <ChannelPreviewModal onClose={() => setPreviewModal(false)}/>}
      {showPrelaunch && <PrelaunchOverlay onClose={() => setShowPrelaunch(false)}/>}
    </div>
  );
}

function CanvasBlock({ num, title, subtitle, children, last }) {
  return (
    <div style={{ padding: '14px 28px 18px', borderBottom: last ? 0 : '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-5)', fontWeight: 600 }}>0{num}</span>
        <h3 className="serif" style={{ margin: 0, fontSize: 17, color: 'var(--ink)' }}>{title}</h3>
        {subtitle && <span className="t-meta" style={{ fontSize: 12 }}>· {subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function TrigThresh({ value, setValue, onClose }) {
  const bins = useMC(() => Array.from({length: 14}, (_, i) => Math.exp(-i * 0.42) * 100 + 4 + Math.random() * 4), []);
  const max = Math.max(...bins);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20 }}/>
      <div className="card elev-3" style={{ position: 'absolute', top: 32, left: 0, width: 460, zIndex: 21, padding: 14 }}>
        <div className="t-mini" style={{ marginBottom: 10 }}>Trigger threshold · streak</div>
        <div className="histo" style={{ height: 56 }}>
          {bins.map((v, i) => <div key={i} className={`bar ${i + 1 >= value ? 'matched' : ''}`} style={{ height: `${(v / max) * 100}%` }}/>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <span className="mono" style={{ fontSize: 12 }}>≥</span>
          <input type="range" min={1} max={14} value={value} onChange={e => setValue(parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }}/>
          <input type="number" value={value} onChange={e => setValue(parseInt(e.target.value) || 0)} className="input mono" style={{ width: 56, textAlign: 'center' }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button className="btn sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, color, small }) {
  return (
    <div>
      <span className="t-mini" style={{ display: 'block' }}>{label}</span>
      <span className="mono" style={{ fontSize: 22, fontWeight: 500, color: color || 'var(--ink)' }}>{value}</span>
      {small && <span className="t-meta" style={{ display: 'block', fontSize: 10.5 }}>{small}</span>}
    </div>
  );
}

function ForecastBars() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
      {days.map((d, i) => {
        const h = 40 + Math.sin(i / 1.4) * 20 + i * 2;
        return (
          <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ height: h, width: '100%', background: 'var(--accent)', opacity: 0.7, borderRadius: 2 }}/>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>{d}</span>
          </div>
        );
      })}
    </div>
  );
}

function GoalDial({ goal }) {
  const score = 88;
  const r = 50, c = 2 * Math.PI * r;
  return (
    <div style={{ background: '#faf8f3', borderRadius: 8, padding: 14, textAlign: 'center' }}>
      <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Goal alignment</span>
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r={r} stroke="#eeece6" strokeWidth="9" fill="none"/>
        <circle cx="60" cy="60" r={r} stroke="var(--accent)" strokeWidth="9" fill="none"
          strokeDasharray={`${c * (score / 100)} ${c}`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
        <text x="60" y="56" textAnchor="middle" fontSize="22" fontFamily="var(--mono)" fontWeight="500">{score}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#737373" fontFamily="var(--mono)">/ 100</text>
      </svg>
      <span className="serif" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{goal} fit · strong</span>
    </div>
  );
}

// ── Right rail materials shelf ───────────────────────────────────────────
function CampaignRail({ isRT, boundSegment, eventSrc, navigate }) {
  return (
    <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--line)', overflowY: 'auto' }}>
      <RailBlock title="Target segment">
        {boundSegment ? (
          <button onClick={() => navigate('segment-monitoring', { id: boundSegment.id })}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: 10, borderRadius: 6, background: '#faf8f3' }}>
            <span className="serif" style={{ fontSize: 13 }}>{boundSegment.display}</span>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 3 }}>{boundSegment.id.slice(0, 28)}…</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <LatencyBadge tier="<1h · B"/>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{fmtNum(boundSegment.size)}</span>
            </div>
          </button>
        ) : (
          <span className="t-meta" style={{ fontSize: 11.5 }}>—</span>
        )}
      </RailBlock>

      {isRT && (
        <RailBlock title="Event source">
          <div style={{ padding: 10, background: '#faf8f3', borderRadius: 6 }}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{eventSrc}</span>
            <div className="t-meta" style={{ fontSize: 10.5, marginTop: 3 }}>1.2M /day · ~4.6k peak/min · v3.2 stable</div>
          </div>
        </RailBlock>
      )}

      {isRT && (
        <RailBlock title="Features in trigger predicate · 2">
          {['consecutive_ranked_losses_streak','is_paying_user_lifetime'].map(f => (
            <button key={f} onClick={() => navigate('feature-detail', { id: f })}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 6, background: 'transparent', marginBottom: 2 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <span className="mono" style={{ fontSize: 11.5 }}>{f}</span>
            </button>
          ))}
        </RailBlock>
      )}

      <RailBlock title="Pattern reference">
        <div style={{ padding: 10, background: '#faf8f3', borderRadius: 6 }}>
          <span className="serif" style={{ fontSize: 13 }}>Pass Stuck Rescue</span>
          <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4 }}>Origin: CFM, May 2025. Avg lift +6.4% across 4 portfolio reuses.</div>
        </div>
      </RailBlock>

      <RailBlock title="Hypothesis reference">
        <div style={{ padding: 10, background: '#faf8f3', borderRadius: 6 }}>
          <span className="serif" style={{ fontSize: 13 }}>Pass-stuck players churn at 2.8× the rate.</span>
          <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4 }}>From Explore investigation 2026-04-22.</div>
        </div>
      </RailBlock>
    </aside>
  );
}

// ─── 15 Campaign Handoff Modal ────────────────────────────────────────────
function CampaignHandoff({ isRT, hasSegment, onClose, navigate }) {
  const [step, setStep] = useSC(0);
  useEC(() => {
    const ts = [400, 1100, 1700, 2300];
    const ts2 = ts.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => ts2.forEach(clearTimeout);
  }, []);

  const cmpId = 'cmp-cfm-407';
  const trgId = 'trg-cfm-pass-stuck';
  const segId = 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9';

  const steps = isRT ? [
    { l: 'Predicate compiled to expr-lang', d: '~immediate' },
    { l: 'Trigger config written to JourneyDB', d: 'done' },
    { l: 'Apollo TEE picks up on next reload', d: '~30 sec' },
    { l: 'TEE evaluates against event_match_end events', d: 'live' },
  ] : [
    { l: 'Hatchet starts BroadcastWorkflow', d: '~immediate' },
    { l: 'Audience UID list pulled from Activation API', d: '~10 sec' },
    { l: 'Channel handoff (IAM + Push)', d: '~30 sec' },
    { l: 'Delivery underway', d: 'live' },
  ];

  return (
    <div className="scrim">
      <div className="card modal" style={{ width: 600, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--success)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={16}/>
            </span>
            <h2 className="serif" style={{ margin: 0, fontSize: 22, fontStyle: 'normal' }}>Campaign activated · 5% rollout</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <IDRow label="CampaignID" value={cmpId}/>
            {isRT && <IDRow label="TriggerID" value={trgId} accent/>}
            {hasSegment && <IDRow label="SegmentID" value={segId}/>}
          </div>
        </div>

        <div style={{ padding: '0 28px 20px' }}>
          <span className="t-mini" style={{ display: 'block', marginBottom: 12, marginTop: 4 }}>What happens next</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 99,
                  background: i < step ? 'var(--success)' : i === step ? 'var(--amber-tint)' : '#f0eee8',
                  color: i < step ? '#fff' : 'var(--ink-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
                  border: i === step ? '1px solid var(--amber)' : 'none',
                }}>{i < step ? <Icon name="check" size={11}/> : i + 1}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>{s.l}</span>
                <span className="mono" style={{ fontSize: 11, color: i < step ? 'var(--success)' : 'var(--ink-4)', textAlign: 'right' }}>
                  {i < step ? 'done' : i === step ? 'running' : s.d}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isRT && (
          <div style={{ padding: '14px 28px', background: '#faf8f3', borderTop: '1px solid var(--hairline)' }}>
            <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Substrate A · Apollo TEE + Temporal</span>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              TEE evaluates <span style={{ color: 'var(--accent)' }}>@features.consecutive_ranked_losses_streak</span> and{' '}
              <span style={{ color: 'var(--accent)' }}>@features.is_paying_user_lifetime</span> per match_end event;<br/>
              spawns Temporal workflow on match.
            </div>
          </div>
        )}

        {hasSegment && (
          <div style={{ padding: '14px 28px', background: '#faf8f3', borderTop: '1px solid var(--hairline)' }}>
            <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Substrate B · Hatchet + Trino + Iceberg</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Apollo consumes via</span>
              <span className="mono" style={{ fontSize: 12, padding: '3px 8px', background: '#fff', borderRadius: 4, border: '1px solid var(--line)' }}>
                GET /segments/{segId.slice(0, 16)}…/uids
              </span>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => { onClose(); navigate('campaign-monitoring', { id: cmpId }); }}>
            <Icon name="eye" size={12}/> Open in monitoring
          </button>
          <button className="btn accent" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function IDRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
      background: accent ? '#fff2eb' : '#faf8f3',
      border: '1px solid ' + (accent ? '#f8c9b0' : 'var(--hairline)'),
      borderRadius: 6 }}>
      <span className="t-mini" style={{ minWidth: 90 }}>{label}</span>
      <span className="mono" style={{ flex: 1, fontSize: 12, fontWeight: 500, color: accent ? 'var(--accent-2)' : 'var(--ink)' }}>{value}</span>
      <button className="btn sm ghost"><Icon name="copy" size={12}/></button>
    </div>
  );
}

// ─── 16 Campaign Monitoring ───────────────────────────────────────────────
function CampaignMonitoring({ id, navigate }) {
  const cmp = (window.HERMES_DATA.CAMPAIGNS.find(c => c.id === id)) || window.HERMES_DATA.CAMPAIGNS[0];
  return (
    <div style={{ overflowY: 'auto', height: '100%' }} data-screen-label="16 Campaign · Monitoring">
      <div style={{ padding: '16px 32px 0' }}>
        <button onClick={() => navigate('campaign-library')} className="btn ghost sm" style={{ paddingLeft: 0 }}>
          <Icon name="chevleft" size={12}/> Campaigns
        </button>
      </div>
      <div style={{ padding: '8px 32px 20px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <GoalBadge goal={cmp.goal}/>
          <span className="pill" style={{
            background: cmp.triggerType === 'Real-time' ? '#fff2eb' : '#f3f1ec',
            borderColor: cmp.triggerType === 'Real-time' ? '#f8c9b0' : '#e7e5e0',
            color: cmp.triggerType === 'Real-time' ? '#9a3412' : '#525252',
          }}>{cmp.triggerType}</span>
          <StatusDot status={cmp.status}/>
          <span className="t-meta" style={{ fontSize: 12 }}>· active for {cmp.runDays || 14} days · {cmp.fires}</span>
          <span style={{ flex: 1 }}/>
          {cmp.audience && (
            <button onClick={() => navigate('segment-monitoring', { id: cmp.audience })}
              className="btn sm" style={{ background: '#fff2eb', borderColor: '#f8c9b0' }}>
              <Icon name="layers" size={11}/>
              <span className="mono" style={{ fontSize: 10.5 }}>{cmp.audience.slice(0, 22)}…</span>
            </button>
          )}
          {cmp.triggerId && (
            <button className="btn sm" style={{ background: '#fff2eb', borderColor: '#f8c9b0' }}>
              <Icon name="zap" size={11}/>
              <span className="mono" style={{ fontSize: 10.5 }}>{cmp.triggerId}</span>
            </button>
          )}
        </div>
        <h1 className="serif" style={{ margin: 0, fontSize: 28 }}>{cmp.display}</h1>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{cmp.id}</span>
      </div>

      {/* Health snapshot */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          <Stat label="Total fires" value={fmtNum(47880)} small="across 14 days"/>
          <Stat label="Unique players" value={fmtNum(31200)}/>
          <Stat label="% of MAU" value="2.5%"/>
          <Stat label="Cost-to-date" value="$1,420"/>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, alignItems: 'center' }}>
          <div>
            <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Forecast vs actual · last 14 days</span>
            <ForecastVsActualChart/>
          </div>
          <div style={{ background: '#faf8f3', borderRadius: 8, padding: 14, textAlign: 'center' }}>
            <span className="t-mini" style={{ display: 'block' }}>On track</span>
            <span className="mono" style={{ fontSize: 22, fontWeight: 500, color: 'var(--success)' }}>+5%</span>
            <span className="t-meta" style={{ display: 'block', fontSize: 11 }}>3,420 actual vs 3,259 forecast</span>
          </div>
        </div>
      </div>

      {/* Uplift */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--hairline)' }}>
        <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Uplift on D7 retention</span>
        <h2 className="serif" style={{ margin: '0 0 16px', fontSize: 22, fontStyle: 'normal' }}>
          <span style={{ color: 'var(--success)' }}>+8.2%</span> D1 retention vs holdout, <span className="mono" style={{ fontSize: 16, color: 'var(--ink-3)' }}>p=0.02</span>
          <span className="pill" style={{ marginLeft: 10, fontSize: 11, background: '#dcf2e3', color: '#146c43', borderColor: '#bce5c8' }}>significant</span>
        </h2>
        <UpliftChart/>
      </div>

      {/* Operational */}
      <div style={{ padding: '20px 32px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <span className="t-mini" style={{ display: 'block', marginBottom: 12 }}>Sanity checks · live</span>
          <div className="card" style={{ padding: 6 }}>
            {[
              ['Trigger fire-rate stable', true],
              ['No null UIDs in last 24h', true],
              ['Cooldown enforced', true],
              ['Holdout split within ± 0.5%', true],
              ['Anti-fatigue clause active', true],
            ].map(([l, ok], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < 4 ? '1px solid var(--hairline)' : 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: ok ? 'var(--success)' : 'var(--amber)' }}/>
                <span style={{ fontSize: 13, flex: 1, color: 'var(--ink-2)' }}>{l}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{ok ? 'pass' : 'check'}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="t-mini" style={{ display: 'block', marginBottom: 12 }}>Recent fires · sample</span>
          <div className="card" style={{ padding: 0 }}>
            {[
              ['16:42:18', 'p_829112', 'IAM · variant A', 'opened'],
              ['16:42:14', 'p_511284', 'IAM · variant A', 'dismissed'],
              ['16:41:53', 'p_902145', 'IAM · variant A', 'converted +50 gem'],
              ['16:41:21', 'p_119804', 'IAM · variant A', 'opened'],
              ['16:40:48', 'p_337290', 'IAM · variant A', 'opened'],
            ].map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr', gap: 10, padding: '8px 14px', borderBottom: i < 4 ? '1px solid var(--hairline)' : 0, fontFamily: 'var(--mono)', fontSize: 11.5 }}>
                <span style={{ color: 'var(--ink-4)' }}>{r[0]}</span>
                <span>{r[1]}</span>
                <span style={{ color: 'var(--ink-3)' }}>{r[2]}</span>
                <span style={{ color: r[3].includes('converted') ? 'var(--success)' : 'var(--ink-2)' }}>{r[3]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <span className="t-mini" style={{ display: 'block', marginBottom: 12 }}>AI suggested follow-ups</span>
          <div style={{ padding: 14, background: '#faf8f3', borderRadius: 8 }}>
            <p className="serif" style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)' }}>
              Variant A is showing <span style={{ color: 'var(--success)', fontWeight: 600 }}>15% higher D7 spend</span> than holdout —
              extract these responders as a derived segment for whale-track recruitment.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn sm primary"><Icon name="branch" size={11}/>Extract responders</button>
              <button className="btn sm ghost">Dismiss</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForecastVsActualChart() {
  const w = 600, h = 90, days = 14;
  const forecast = Array.from({length: days}, (_, i) => 3000 + Math.sin(i / 3) * 200);
  const actual = forecast.map(f => f + (Math.random() - 0.3) * 300);
  const max = Math.max(...forecast, ...actual), min = Math.min(...forecast, ...actual);
  const path = (data, off) => data.map((v, i) => {
    const x = (i / (days - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h * 0.85 - off;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 90 }}>
      <path d={path(forecast, 5)} stroke="#bdbab5" strokeWidth="1.4" strokeDasharray="3,3" fill="none"/>
      <path d={path(actual, 5)} stroke="var(--accent)" strokeWidth="1.6" fill="none"/>
    </svg>
  );
}

function UpliftChart() {
  const w = 800, h = 160, days = 14;
  const treatment = Array.from({length: days}, (_, i) => 60 + i * 0.4 + Math.sin(i / 2) * 1.2);
  const holdout = Array.from({length: days}, (_, i) => 56 + i * 0.15 + Math.sin(i / 2) * 0.8);
  const max = 70, min = 50;
  const path = (data) => data.map((v, i) => {
    const x = (i / (days - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h * 0.85 - 10;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  const band = treatment.map((v, i) => {
    const x = (i / (days - 1)) * w;
    const y1 = h - ((v + 1.5 - min) / (max - min)) * h * 0.85 - 10;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y1}`;
  }).join(' ') + ' ' + treatment.slice().reverse().map((v, i) => {
    const idx = days - 1 - i;
    const x = (idx / (days - 1)) * w;
    const y2 = h - ((v - 1.5 - min) / (max - min)) * h * 0.85 - 10;
    return `L ${x} ${y2}`;
  }).join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 160 }}>
      <path d={band} fill="#fff2eb"/>
      <path d={path(holdout)} stroke="#a5a39d" strokeWidth="1.6" fill="none" strokeDasharray="4,3"/>
      <path d={path(treatment)} stroke="var(--accent)" strokeWidth="2" fill="none"/>
      <text x="10" y="20" fontSize="11" fontFamily="var(--mono)" fill="var(--accent)">Treatment</text>
      <text x="10" y="36" fontSize="11" fontFamily="var(--mono)" fill="#a5a39d">Holdout</text>
    </svg>
  );
}

// ── Slideouts and overlays ────────────────────────────────────────────────
function SegmentSlideoutPicker({ onClose, onPick }) {
  const { SEGMENTS } = window.HERMES_DATA;
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 50,
      background: 'var(--surface)', borderLeft: '1px solid var(--line)', overflowY: 'auto' }} className="elev-3">
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Pick segment</h3>
        <button className="btn ghost sm" onClick={onClose}><Icon name="x" size={12}/></button>
      </div>
      <div style={{ padding: 12 }}>
        {SEGMENTS.filter(s => s.size > 0).slice(0, 8).map(s => (
          <button key={s.id} onClick={() => onPick({ id: s.id, display: s.display, size: s.size })}
            className="card" style={{ display: 'block', width: '100%', textAlign: 'left', padding: 12, marginBottom: 6 }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafaf6'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="serif" style={{ fontSize: 14, flex: 1 }}>{s.display}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{fmtNum(s.size)}</span>
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 3 }}>{s.id}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <GoalBadge goal={s.goal} size="sm"/>
              <span className="t-meta" style={{ fontSize: 10.5 }}>· built {s.asOf}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChannelPreviewModal({ onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="card modal" onClick={e => e.stopPropagation()} style={{ width: 360, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="t-mini">IAM preview · iOS · 414 × 736</span>
          <button className="btn ghost sm" onClick={onClose}><Icon name="x" size={12}/></button>
        </div>
        <div style={{ background: 'linear-gradient(160deg, #1a1614, #2a1f1a)', borderRadius: 16, padding: 24, color: '#fff', textAlign: 'center', minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(2px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24 }}>
            <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 99, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkle" size={22} color="#fff"/>
            </div>
            <h3 className="serif" style={{ margin: '0 0 8px', fontSize: 18, fontStyle: 'normal' }}>Bạn đã đến gần rồi!</h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>Đừng bỏ cuộc. Nhận 50 gem để tiếp tục chơi.</p>
            <button style={{ background: 'var(--accent)', color: '#fff', border: 0, padding: '10px 22px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Nhận quà</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrelaunchOverlay({ onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="card modal" onClick={e => e.stopPropagation()} style={{ width: 720, padding: 0 }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="t-mini">Pre-launch monitoring</span>
            <h2 className="serif" style={{ margin: '4px 0 0', fontSize: 20, fontStyle: 'normal' }}>Simulation against last 7 days of real events</h2>
          </div>
          <button className="btn ghost sm" onClick={onClose}><Icon name="x" size={12}/></button>
        </div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
            <Stat label="Would have fired" value={fmtNum(22400)} small="last 7 days"/>
            <Stat label="Unique players" value={fmtNum(15800)}/>
            <Stat label="Cooldown collisions" value="3.2%" small="discounted from raw"/>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Sanity checks</span>
            {['Predicate compiles to expr-lang','Event source schema valid','All features fresh','Audience pool ≥ 1000','No null UIDs in trigger evaluation set','Cooldown reduces fires by 8%'].map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', fontSize: 12.5 }}>
                <Icon name="check" size={14} color="var(--success)"/>
                <span style={{ color: 'var(--ink-2)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>Back to canvas</button>
          <button className="btn accent" onClick={onClose}>Activate · 5% rollout <Icon name="arrow" size={12}/></button>
        </div>
      </div>
    </div>
  );
}

// ── Journey overlay (13) ─────────────────────────────────────────────────
function JourneyOverlay({ onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="card modal" onClick={e => e.stopPropagation()} style={{ width: 920, padding: 0 }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="t-mini">Journey canvas · cmp-cfm-407</span>
            <h2 className="serif" style={{ margin: '4px 0 0', fontSize: 20, fontStyle: 'normal' }}>Pass Stuck Rescue · multi-step</h2>
          </div>
          <button className="btn ghost sm" onClick={onClose}><Icon name="x" size={12}/></button>
        </div>
        <div style={{ padding: 24, background: '#faf8f3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <JourneyNode kind="entry" title="Trigger" sub="match_end · streak ≥ 5"/>
            <JourneyArrow/>
            <JourneyNode kind="action" title="IAM · variant A" sub="Bạn đã đến gần rồi!"/>
            <JourneyArrow/>
            <JourneyNode kind="wait" title="Wait" sub="24h"/>
            <JourneyArrow/>
            <JourneyNode kind="condition" title="Did engage?" sub="iam_response = open"/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            <span style={{ width: 80 }}/>
            <JourneyNode kind="action" title="Push · gem grant" sub="50 gem · CTA: Play now"/>
            <JourneyArrow/>
            <JourneyNode kind="exit" title="Goal: Retain" sub="Measured at D7"/>
            <JourneyArrow/>
            <JourneyExportBranch/>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyNode({ kind, title, sub }) {
  const c = kind === 'entry' ? '#fff2eb' : kind === 'action' ? '#eaf2ff' : kind === 'wait' ? '#f3f1ec' : kind === 'condition' ? '#fef6e0' : '#dcf2e3';
  const bd = kind === 'entry' ? '#f8c9b0' : kind === 'action' ? '#c7d9f7' : kind === 'wait' ? '#e7e5e0' : kind === 'condition' ? '#f0d896' : '#bce5c8';
  const ic = kind === 'entry' ? 'zap' : kind === 'action' ? 'send' : kind === 'wait' ? 'clock' : kind === 'condition' ? 'branch' : 'flag';
  return (
    <div style={{ background: c, border: '1px solid ' + bd, borderRadius: 8, padding: '10px 14px', minWidth: 150, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name={ic} size={12}/>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{title}</span>
      </div>
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{sub}</span>
    </div>
  );
}

function JourneyArrow() {
  return <Icon name="arrow" size={16} color="var(--ink-4)"/>;
}

function JourneyExportBranch() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', padding: '8px 12px', border: '1px dashed var(--ink-4)', borderRadius: 8, background: '#fff' }}>
      <span className="t-meta" style={{ fontSize: 11 }}>Responders · 4,820</span>
      <button className="btn sm primary"><Icon name="branch" size={11}/>Export as derived segment</button>
    </div>
  );
}

Object.assign(window, { CampaignLibrary, CampaignCanvas, CampaignMonitoring, CampaignHandoff });
