/* global React, window, Icon, LatencyBadge, GoalBadge, Avatar, Sparkline, Histogram, StatusDot, fmtNum, getFeature */
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

// ─── 03 Segment Library ───────────────────────────────────────────────────
function SegmentLibrary({ navigate }) {
  const { SEGMENTS } = window.HERMES_DATA;
  const [groupBy, setGroupBy] = useS('goal');
  const [filterGoal, setFilterGoal] = useS('all');

  let segs = SEGMENTS;
  if (filterGoal !== 'all') segs = segs.filter(s => s.goal === filterGoal);

  const groups = {};
  segs.forEach(s => {
    const k = groupBy === 'goal' ? s.goal
            : groupBy === 'owner' ? s.owner
            : groupBy === 'type' ? s.type
            : 'All';
    if (!groups[k]) groups[k] = [];
    groups[k].push(s);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '224px 1fr', height: '100%' }} data-screen-label="03 Segments · Library">
      <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--line)', padding: '20px 16px', overflowY: 'auto' }}>
        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Group by</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {[['goal','4R goal'],['owner','Owner'],['type','Type'],['none','None']].map(([k, l]) => (
            <button key={k} onClick={() => setGroupBy(k)} style={{
              padding: '6px 8px', borderRadius: 5, textAlign: 'left', fontSize: 12.5,
              background: groupBy === k ? 'var(--hover)' : 'transparent', color: groupBy === k ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: groupBy === k ? 500 : 400,
            }}>{l}</button>
          ))}
        </div>

        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>4R goal</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {[['all','All'],['Retain','Retain'],['Revenue','Revenue'],['Reactivate','Reactivate'],['Recruit','Recruit']].map(([k, l]) => (
            <button key={k} onClick={() => setFilterGoal(k)} style={{
              padding: '6px 8px', borderRadius: 5, textAlign: 'left', fontSize: 12.5,
              background: filterGoal === k ? 'var(--hover)' : 'transparent', color: filterGoal === k ? 'var(--ink)' : 'var(--ink-3)',
            }}>{l}</button>
          ))}
        </div>

        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Status</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
          {['Active','Drift detected','Stale','Draft'].map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 12.5, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--ink)' }}/> {s}
            </label>
          ))}
        </div>

        <span className="t-mini" style={{ display: 'block', marginBottom: 10 }}>Has open campaigns</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {['Yes','No','Any'].map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 12.5, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="radio" name="oc" defaultChecked={s === 'Any'} style={{ accentColor: 'var(--ink)' }}/> {s}
            </label>
          ))}
        </div>
      </aside>

      <div style={{ overflowY: 'auto' }}>
        <div style={{ padding: '24px 32px 8px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <h1 className="serif" style={{ margin: 0, fontSize: 28 }}>Segments</h1>
            <button onClick={() => navigate('segment-canvas', { fresh: true })} className="btn accent">
              <Icon name="plus" size={13}/> Build segment
            </button>
          </div>
          <p className="t-meta" style={{ margin: '0 0 14px', maxWidth: 720 }}>
            31 segments · 23 active · 8 in draft · 6 derived from journey branches · 12 with drift this week.
            Frozen UID lists materialised in <span className="mono">state_user_segments</span>, served to Apollo via the Activation API.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 }}>
            <span className="t-meta" style={{ marginRight: 8 }}>Start from:</span>
            <button className="btn sm"><Icon name="target" size={12}/>A goal</button>
            <button className="btn sm"><Icon name="bookmark" size={12}/>Audience pattern</button>
            <button className="btn sm"><Icon name="layers" size={12}/>A feature</button>
            <button className="btn sm"><Icon name="edit" size={12}/>Continue draft</button>
          </div>
        </div>

        <div style={{ padding: '8px 32px 40px' }}>
          {Object.entries(groups).map(([gName, gSegs]) => (
            <div key={gName} style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 0' }}>
                {groupBy === 'goal'
                  ? <><GoalBadge goal={gName}/></>
                  : <h2 className="serif" style={{ margin: 0, fontSize: 18 }}>{gName}</h2>}
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-5)' }}>{gSegs.length}</span>
              </div>
              <div className="card">
                {gSegs.map((s, i) => <SegmentRow key={s.id} seg={s} navigate={navigate} last={i === gSegs.length - 1}/>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentRow({ seg, navigate, last }) {
  return (
    <div onClick={() => navigate('segment-canvas', { id: seg.id, mode: 'edit' })}
      style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 90px 100px 80px 60px 100px 64px',
        gap: 12, alignItems: 'center', padding: '14px 18px',
        borderBottom: last ? 0 : '1px solid var(--hairline)', cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#fafaf6'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className="serif" style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{seg.display}</span>
          {seg.drift && <span className="pill amber" style={{ fontSize: 10, flexShrink: 0 }}>drift</span>}
          {seg.status === 'Draft' && <span className="pill" style={{ fontSize: 10, flexShrink: 0 }}>draft</span>}
        </div>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.id}</span>
      </div>
      <GoalBadge goal={seg.goal} size="sm"/>
      <span className="t-meta" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seg.type}</span>
      <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{fmtNum(seg.size)}</span>
      <Sparkline data={seg.spark} amber={seg.drift} w={56}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Avatar initials={seg.ownerAvatar} size={22}/>
        <span className="t-meta" style={{ fontSize: 11 }}>{seg.edited}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
        <button className="btn ghost sm" title="Open monitoring"
          style={{ height: 26, width: 26, padding: 0, justifyContent: 'center' }}
          onClick={() => navigate('segment-monitoring', { id: seg.id })}>
          <Icon name="eye" size={12}/>
        </button>
        <button className="btn ghost sm" title="Edit predicate"
          style={{ height: 26, width: 26, padding: 0, justifyContent: 'center' }}
          onClick={() => navigate('segment-canvas', { id: seg.id, mode: 'edit' })}>
          <Icon name="edit" size={12}/>
        </button>
      </div>
    </div>
  );
}

// ── Predicate selectivity utilities ──────────────────────────────────────
function selOfRow(row, thresholdValue) {
  const { rowSelectivity } = window.HERMES_DATA;
  // Bind streak threshold from playground demo
  const v = (row.feature === 'consecutive_ranked_losses_streak' && thresholdValue != null) ? thresholdValue : row.value;
  return rowSelectivity(row.feature, row.op, v);
}
function groupSelectivity(group, thresholdValue) {
  const ps = group.rows.map(r => selOfRow(r, thresholdValue));
  if (ps.length === 0) return 1;
  if (group.any) {
    // OR — independence approximation: 1 - prod(1 - p)
    return 1 - ps.reduce((acc, p) => acc * (1 - p), 1);
  }
  // ALL — intersect, independence approximation
  return ps.reduce((acc, p) => acc * p, 1);
}
function exclusionFactor(exclList) {
  // Each exclusion drops a fraction; combined: prod(1 - p)
  if (!exclList.length) return 1;
  return exclList.reduce((acc, r) => acc * (1 - selOfRow(r, null)), 1);
}
function computeAudience(groups, excl, thresholdValue) {
  const { MAU_BASE } = window.HERMES_DATA;
  const groupP = groups.map(g => groupSelectivity(g, thresholdValue));
  const intersectionP = groupP.reduce((a, p) => a * p, 1);
  const finalP = intersectionP * exclusionFactor(excl);
  return {
    base: MAU_BASE,
    groupP,
    perGroupAfter: groupP.reduce((acc, p, i) => {
      const cum = (i === 0 ? p : acc[i - 1].cumP * p);
      acc.push({ p, cumP: i === 0 ? p : acc[i - 1].cumP * p, count: Math.round(MAU_BASE * cum) });
      return acc;
    }, []),
    afterExcl: Math.round(MAU_BASE * finalP),
    intersection: Math.round(MAU_BASE * intersectionP),
    final: Math.round(MAU_BASE * finalP),
  };
}

// ─── 04 Segment Authoring Canvas (centerpiece) ────────────────────────────
function SegmentCanvas({ navigate, params }) {
  // Hydrate from a real segment id (edit mode), else seed with CFM Pass Stuck
  const { SEGMENT_PREDICATES, SEGMENTS } = window.HERMES_DATA;
  const segId = params?.id;
  const editMode = params?.mode === 'edit' || !!segId;
  const segMeta = segId ? SEGMENTS.find(s => s.id === segId) : null;
  const seed = (segId && SEGMENT_PREDICATES[segId]) || SEGMENT_PREDICATES['seg-cfm-loss-streak-non-paying-2026-0508-a3f9'];
  const seedTitle = seed.title;
  const seedIntent = seed.intent;
  const seedGroups = seed.groups;
  const seedExcl = seed.excl;

  const [groups, setGroups] = useS(seedGroups);
  const [excl, setExcl] = useS(seedExcl);
  const [intentOpen, setIntentOpen] = useS(false);
  const [intent, setIntent] = useS(seedIntent);
  const [openSwap, setOpenSwap] = useS(null);   // { groupIdx, rowIdx } or 'excl-N'
  const [openThresh, setOpenThresh] = useS(null);
  const [thresholdValue, setThresholdValue] = useS(5);
  const [showBreakdown, setShowBreakdown] = useS(false);
  const [explainer, setExplainer] = useS(false);
  const [showHandoff, setShowHandoff] = useS(false);
  const [pulseCount, setPulseCount] = useS(0);
  const [picker, setPicker] = useS(null); // 'condition' | 'exclusion' | 'or-row'
  const [pickerCtx, setPickerCtx] = useS({});

  // Live audience computation from predicate selectivity
  const audienceModel = useM(
    () => computeAudience(groups, excl, thresholdValue),
    [groups, excl, thresholdValue]
  );
  const audience = audienceModel.final;

  useE(() => { setPulseCount(c => c + 1); }, [audience]);

  const updateRowValue = (gi, ri, v) => {
    setGroups(prev => prev.map((g, i) => i === gi ? {
      ...g, rows: g.rows.map((r, j) => j === ri ? { ...r, value: v } : r)
    } : g));
  };

  const removeRow = (gi, ri) => {
    setGroups(prev => prev.map((g, i) => i === gi ? { ...g, rows: g.rows.filter((_, j) => j !== ri) } : g).filter(g => g.rows.length > 0));
  };
  const removeExclusion = (i) => setExcl(prev => prev.filter((_, j) => j !== i));

  const addOrRow = (gi, featureId) => {
    setGroups(prev => prev.map((g, i) => i === gi ? {
      ...g, any: true, rows: [...g.rows, { id: `r${Date.now()}`, feature: featureId, op: '≥', value: 1 }]
    } : g));
  };
  const addGroup = (featureId) => {
    setGroups(prev => [...prev, { id: `g${Date.now()}`, any: false, rows: [{ id: `r${Date.now()}`, feature: featureId, op: '=', value: 1 }] }]);
  };
  const addExclusion = (featureId) => {
    setExcl(prev => [...prev, { id: `r${Date.now()}`, feature: featureId, op: '=', value: true }]);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 304px', height: '100%' }} data-screen-label="04 Segment · Authoring canvas">
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Breadcrumb */}
        <div style={{ padding: '12px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('segment-library')} className="btn ghost sm" style={{ paddingLeft: 0 }}>
            <Icon name="chevleft" size={12}/> Segments
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-4)' }}>
            <span className="mono">draft · seg-cfm-loss-streak-non-paying-2026</span>
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: '8px 28px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, lineHeight: 1.15, flex: 1 }}>
            {seedTitle}
          </h1>
          {editMode && segMeta && (
            <button className="btn sm" onClick={() => navigate('segment-monitoring', { id: segMeta.id })}>
              <Icon name="eye" size={12}/> Open monitoring
            </button>
          )}
          {editMode && segMeta && <span className="pill amber" style={{ fontSize: 10 }}>editing</span>}
        </div>

        {/* Region 1 — Intent (collapsible) */}
        <div style={{ padding: '0 28px 12px' }}>
          <div className="card" style={{ background: '#faf8f3', borderColor: '#ece8de' }}>
            <button onClick={() => setIntentOpen(!intentOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                background: 'transparent', border: 0, textAlign: 'left', cursor: 'pointer' }}>
              <Icon name={intentOpen ? 'chevdown' : 'chevright'} size={12}/>
              <span className="t-mini">Intent</span>
              <span className="serif" style={{ fontSize: 14, color: 'var(--ink-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: intentOpen ? 'normal' : 'nowrap' }}>
                {intent}
              </span>
              {!intentOpen && <span className="t-meta" style={{ fontSize: 11 }}>edit</span>}
            </button>
            {intentOpen && (
              <div style={{ padding: '0 14px 14px' }}>
                <textarea value={intent} onChange={e => setIntent(e.target.value)}
                  className="serif" style={{ width: '100%', minHeight: 64, fontSize: 16, lineHeight: 1.4, padding: 12,
                    border: '1px solid var(--line)', borderRadius: 6, background: '#fff', resize: 'vertical', outline: 0 }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <button className="btn sm ghost"><Icon name="sparkle" size={11}/>AI: redraft predicate from intent</button>
                  <button className="btn sm" onClick={() => setIntentOpen(false)}>Save & collapse</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Region 2 — Sticky audience preview */}
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)', padding: '8px 28px 12px' }}>
          <AudiencePreview key={pulseCount} model={audienceModel} groups={groups} excl={excl}
            showBreakdown={showBreakdown} setShowBreakdown={setShowBreakdown}/>
        </div>

        {/* Region 3 — Predicate composer */}
        <div style={{ padding: '8px 28px 12px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="t-mini">Predicate</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" checked={explainer} onChange={e => setExplainer(e.target.checked)} style={{ accentColor: 'var(--accent)' }}/>
              Plain-English explainer
            </label>
          </div>

          {explainer ? (
            <div className="card" style={{ padding: 22, background: '#faf8f3' }}>
              <p className="serif" style={{ fontSize: 18, lineHeight: 1.45, margin: 0, color: 'var(--ink-2)' }}>
                A player matches when (their <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>consecutive ranked losses streak is at least {thresholdValue}</span>{' '}
                <em>or</em> their <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>MMR has dropped more than 30 over the last 7 days</span>),{' '}
                <em>and</em> they have <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>never paid us</span>,{' '}
                <em>and</em> their <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>account is at least 30 days old</span> —{' '}
                <em>excluding</em> any test accounts.
              </p>
            </div>
          ) : (
            <>
              {groups.map((g, gi) => (
                <React.Fragment key={g.id}>
                  {gi > 0 && <Connector label="AND" delta={audienceModel.perGroupAfter[gi]?.count - audienceModel.perGroupAfter[gi - 1]?.count}/>}
                  <PredicateGroup
                    group={g} gi={gi}
                    groupCount={audienceModel.perGroupAfter[gi]?.count}
                    cumCount={Math.round(audienceModel.base * (audienceModel.perGroupAfter[gi]?.cumP || 0))}
                    thresholdValue={thresholdValue}
                    onUpdateValue={updateRowValue}
                    onRemoveRow={removeRow}
                    onOpenSwap={(ri) => setOpenSwap(`${gi}-${ri}`)}
                    openSwap={openSwap}
                    closeSwap={() => setOpenSwap(null)}
                    onSwap={(ri, fid) => {
                      setGroups(prev => prev.map((G, i) => i === gi ? {
                        ...G, rows: G.rows.map((R, j) => j === ri ? { ...R, feature: fid } : R)
                      } : G));
                      setOpenSwap(null);
                    }}
                    onOpenThresh={(ri) => setOpenThresh(`${gi}-${ri}`)}
                    openThresh={openThresh}
                    closeThresh={() => setOpenThresh(null)}
                    setThresholdValue={setThresholdValue}
                    onAddOrRow={() => { setPicker('or-row'); setPickerCtx({ gi }); }}
                  />
                </React.Fragment>
              ))}

              <Connector label="AND NOT" delta={audienceModel.afterExcl - audienceModel.intersection}/>
              <ExclusionBlock excl={excl} onRemove={removeExclusion}
                onAdd={() => { setPicker('exclusion'); }}/>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => { setPicker('condition'); setPickerCtx({ asGroup: true }); }} className="btn">
                  <Icon name="plus" size={12}/> Add new group · AND
                </button>
                <button onClick={() => setPicker('exclusion')} className="btn">
                  <Icon name="plus" size={12}/> Add exclusion · AND NOT
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom action bar */}
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '1px solid var(--line)',
          padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn"><Icon name="bookmark" size={12}/>Save draft</button>
          <button className="btn"><Icon name="history" size={12}/>Backtest</button>
          <button className="btn"><Icon name="eye" size={12}/>Preview UID list</button>
          <div style={{ flex: 1 }}/>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', textAlign: 'right' }}>
            Compiles to Substrate B<br/>Hatchet · BuildSegmentWorkflow
          </span>
          <button onClick={() => setShowHandoff(true)} className="btn accent lg">
            Build segment <Icon name="arrow" size={13}/>
          </button>
        </div>
      </div>

      {/* Right rail */}
      <SegmentRail groups={groups} excl={excl} navigate={navigate}/>

      {/* Pickers */}
      {picker && <FeaturePicker mode={picker} onClose={() => setPicker(null)}
        onPick={(fid) => {
          if (picker === 'or-row') addOrRow(pickerCtx.gi, fid);
          else if (picker === 'exclusion') addExclusion(fid);
          else if (picker === 'condition') addGroup(fid);
          setPicker(null);
        }}/>}

      {/* Handoff */}
      {showHandoff && <SegmentHandoff onClose={() => setShowHandoff(false)} navigate={navigate}/>}
    </div>
  );
}

// ── Audience preview band ────────────────────────────────────────────────
function AudiencePreview({ model, groups, excl, showBreakdown, setShowBreakdown }) {
  const value = model.final;
  const [displayed, setDisplayed] = useS(value);
  useE(() => {
    let frame, start = performance.now(), from = displayed, dur = 380;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplayed(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  // Build waterfall steps: MAU base → group 1 → cum after group 2 ... → after exclusions
  const steps = [{ label: 'MAU base', count: model.base, kind: 'base' }];
  groups.forEach((g, i) => {
    const cum = Math.round(model.base * (model.perGroupAfter[i]?.cumP || 0));
    steps.push({
      label: i === 0 ? `Group ${i + 1}` : `∩ Group ${i + 1}`,
      count: cum, kind: 'group',
    });
  });
  if (excl.length) steps.push({ label: '\\ Exclusions', count: model.afterExcl, kind: 'excl' });

  return (
    <div className="card pulse elev-1" style={{ padding: '14px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className="t-mini">Audience</span>
          <span className="mono" style={{ fontSize: 36, fontWeight: 500, lineHeight: 1, color: 'var(--accent)', letterSpacing: -0.02 }}>
            {fmtNum(displayed)}
          </span>
          <span className="t-meta">UIDs</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--ink-3)' }}>
          <span><span className="mono" style={{ color: 'var(--ink-2)' }}>≈ {(displayed / 1250000 * 100).toFixed(2)}%</span> of MAU</span>
          <span><span className="mono" style={{ color: 'var(--ink-2)' }}>≈ {(displayed / 290000 * 100).toFixed(1)}%</span> of CFM ranked active</span>
        </div>
        <div style={{ flex: 1 }}/>
        <button onClick={() => setShowBreakdown(!showBreakdown)} className="btn sm ghost">
          {showBreakdown ? 'Hide' : 'Show'} breakdown <Icon name={showBreakdown ? 'chevdown' : 'chevright'} size={11}/>
        </button>
      </div>

      {/* Waterfall — predicate contribution to UIDs */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="t-mini">How predicates narrow the population</span>
          <span className="t-meta mono" style={{ fontSize: 10.5 }}>independence approximation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56 }}>
          {steps.map((s, i) => {
            const pct = s.count / model.base;
            const prev = i > 0 ? steps[i - 1].count : null;
            const drop = prev != null ? prev - s.count : 0;
            return (
              <React.Fragment key={i}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ position: 'relative', height: 36, background: '#f3f1ec', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', left: 0, bottom: 0, width: '100%',
                      height: `${Math.max(2, pct * 100)}%`,
                      background: s.kind === 'base' ? '#d4d2cc' : s.kind === 'excl' ? 'var(--accent-2)' : 'var(--accent)',
                      transition: 'height .35s ease',
                    }}/>
                    <span className="mono" style={{
                      position: 'absolute', top: 3, left: 4, right: 4, fontSize: 10, fontWeight: 600,
                      color: pct > 0.5 ? '#fff' : 'var(--ink)', textAlign: 'left',
                    }}>{fmtNum(s.count)}</span>
                  </div>
                  <span className="t-meta" style={{ fontSize: 10, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 38, textAlign: 'center', paddingBottom: 18 }}>
                    <Icon name="arrow" size={11} color="var(--ink-5)"/>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 1 }}>
                      −{fmtNum(steps[i].count - steps[i + 1].count)}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {showBreakdown && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--hairline)' }}>
          <BreakdownBars title="Lifecycle" data={[['NRU', 12], ['Mid', 41], ['Veteran', 35], ['Lapsed', 12]]}/>
          <BreakdownBars title="Country" data={[['VN', 68], ['TH', 14], ['ID', 10], ['Other', 8]]}/>
          <BreakdownBars title="Spend tier" data={[['Free', 100], ['Low', 0], ['Mid', 0], ['High', 0]]}/>
        </div>
      )}
    </div>
  );
}

function BreakdownBars({ title, data }) {
  return (
    <div>
      <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>{title}</span>
      {data.map(([l, v]) => (
        <div key={l} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 36px', gap: 8, fontSize: 11.5, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ color: 'var(--ink-3)' }}>{l}</span>
          <div style={{ height: 6, background: '#eeece6', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${v}%`, background: 'var(--accent)' }}/>
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>{v}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Connector "AND" / "AND NOT" between groups ───────────────────────────
function Connector({ label, delta }) {
  return (
    <div className="connector" style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span>{label}</span>
      {Number.isFinite(delta) && delta !== 0 && (
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', fontWeight: 400 }}>
          drops {fmtNum(Math.abs(delta))} UIDs
        </span>
      )}
    </div>
  );
}

// ── Predicate group (rows OR'd within) ───────────────────────────────────
function PredicateGroup({ group, gi, groupCount, cumCount, onUpdateValue, onRemoveRow, onOpenSwap, openSwap, closeSwap, onSwap, onOpenThresh, openThresh, closeThresh, thresholdValue, setThresholdValue, onAddOrRow }) {
  const { MAU_BASE } = window.HERMES_DATA;
  const rowCounts = group.rows.map(r => Math.round(MAU_BASE * selOfRow(r, thresholdValue)));
  const groupCountResolved = groupCount != null ? groupCount : Math.round(MAU_BASE * groupSelectivity(group, thresholdValue));
  return (
    <div className="predicate-group">
      <div className="group-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span><span className="mono" style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Group {gi + 1}</span> · match {group.any ? 'ANY' : 'ALL'} of these</span>
        <span style={{ flex: 1 }}/>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          group → <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmtNum(groupCountResolved)}</span>
          {cumCount != null && gi > 0 && <span style={{ color: 'var(--ink-4)' }}> · cumulative {fmtNum(cumCount)}</span>}
        </span>
        <button className="btn ghost sm"><Icon name="more" size={12}/></button>
      </div>
      {group.rows.map((r, ri) => (
        <React.Fragment key={r.id}>
          {ri > 0 && <div style={{ padding: '4px 14px', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: 'var(--ink-4)', borderBottom: '1px solid var(--hairline)' }}>
            {group.any ? 'OR' : 'AND'}
          </div>}
          <PredicateRow row={r}
            rowCount={rowCounts[ri]}
            groupCount={groupCountResolved}
            onUpdateValue={(v) => onUpdateValue(gi, ri, v)}
            onRemove={() => onRemoveRow(gi, ri)}
            onOpenSwap={() => onOpenSwap(ri)}
            openSwap={openSwap === `${gi}-${ri}`}
            closeSwap={closeSwap}
            onSwap={(fid) => onSwap(ri, fid)}
            onOpenThresh={() => onOpenThresh(ri)}
            openThresh={openThresh === `${gi}-${ri}`}
            closeThresh={closeThresh}
            thresholdValue={thresholdValue}
            setThresholdValue={setThresholdValue}
          />
        </React.Fragment>
      ))}
      <div style={{ padding: 10, borderTop: '1px solid var(--hairline)', background: '#fafaf6' }}>
        <button onClick={onAddOrRow} className="btn sm ghost">
          <Icon name="plus" size={11}/> Add OR row
        </button>
      </div>
    </div>
  );
}

// ── Single predicate row ─────────────────────────────────────────────────
function PredicateRow({ row, rowCount, groupCount, onUpdateValue, onRemove, onOpenSwap, openSwap, closeSwap, onSwap, onOpenThresh, openThresh, closeThresh, thresholdValue, setThresholdValue }) {
  const { MAU_BASE } = window.HERMES_DATA;
  const f = getFeature(row.feature);
  if (!f) return null;
  // Bind threshold playground only to the first streak row (demo)
  const useThreshSlider = row.feature === 'consecutive_ranked_losses_streak';
  const value = useThreshSlider ? thresholdValue : row.value;
  const cnt = rowCount != null ? rowCount : Math.round(MAU_BASE * selOfRow(row, thresholdValue));
  const pct = cnt / MAU_BASE;

  return (
    <div className="predicate-row" style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <button className={`feature-pill ${openSwap ? 'active' : ''}`} onClick={onOpenSwap}>
          {f.id}
          <Icon name="chevdown" size={10}/>
        </button>
        {openSwap && <FeatureSwapPopover feature={f} onSwap={onSwap} onClose={closeSwap}/>}
      </div>
      {f.tierBadges.map(b => <LatencyBadge key={b} tier={b}/>)}
      <button className="op-pill">{row.op}</button>
      <div style={{ position: 'relative', flex: 1 }}>
        <button className={`value-pill ${openThresh ? 'editing' : ''}`}
          onClick={onOpenThresh}
          style={{ minWidth: 56, textAlign: 'left' }}>
          {String(value)}
        </button>
        {openThresh && (
          useThreshSlider
            ? <ThresholdPlayground value={thresholdValue} setValue={setThresholdValue} onClose={closeThresh}/>
            : <SimpleValueEditor value={row.value} onSave={(v) => { onUpdateValue(v); closeThresh(); }} onClose={closeThresh}/>
        )}
      </div>
      {/* Contribution bar */}
      <div title={`Matches ${fmtNum(cnt)} UIDs alone (~${(pct*100).toFixed(1)}% of MAU)`}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: 162, flexShrink: 0 }}>
        <div style={{ flex: 1, height: 6, background: '#eeece6', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, pct * 100)}%`,
            background: 'var(--accent)', opacity: 0.88,
            transition: 'width .35s ease',
          }}/>
        </div>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', minWidth: 60, textAlign: 'right' }}>
          {fmtNum(cnt)}
        </span>
      </div>
      <button className="btn ghost sm" style={{ height: 24, padding: '0 4px' }}><Icon name="more" size={12}/></button>
      <button className="btn ghost sm" style={{ height: 24, padding: '0 4px' }} onClick={onRemove}><Icon name="x" size={12}/></button>
    </div>
  );
}

function SimpleValueEditor({ value, onSave, onClose }) {
  const [v, setV] = useS(value);
  return (
    <div className="card elev-3" style={{ position: 'absolute', top: 32, left: 0, padding: 10, minWidth: 220, zIndex: 10, display: 'flex', gap: 6 }}>
      <input type="text" value={String(v)} onChange={e => setV(e.target.value)} className="input mono" style={{ flex: 1, fontSize: 12 }} autoFocus/>
      <button className="btn sm primary" onClick={() => onSave(typeof value === 'boolean' ? v === 'true' : v)}>Save</button>
      <button className="btn sm ghost" onClick={onClose}><Icon name="x" size={11}/></button>
    </div>
  );
}

// ── Feature swap popover ─────────────────────────────────────────────────
function FeatureSwapPopover({ feature, onSwap, onClose }) {
  const { FEATURES } = window.HERMES_DATA;
  const alts = FEATURES.filter(f => f.domain === feature.domain && f.id !== feature.id).slice(0, 4);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20 }}/>
      <div className="card elev-3" style={{ position: 'absolute', top: 30, left: 0, width: 360, zIndex: 21, padding: 0 }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--hairline)' }}>
          <div className="t-mini" style={{ marginBottom: 6 }}>Current</div>
          <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{feature.id}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {feature.tierBadges.map(b => <LatencyBadge key={b} tier={b}/>)}
            <Sparkline data={feature.spark || [4,4,5,5,5,5,5]}/>
          </div>
        </div>
        <div style={{ padding: '10px 12px 8px' }}>
          <div className="t-mini" style={{ marginBottom: 8 }}>Swap for similar · ai-ranked</div>
          {alts.map(a => (
            <button key={a.id} onClick={() => onSwap(a.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 8, width: '100%', borderRadius: 6,
              background: 'transparent', textAlign: 'left',
            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
               onMouseLeave={e => e.currentTarget.style.background = ''}>
              <span className="mono" style={{ fontSize: 11.5, flex: 1 }}>{a.id}</span>
              <LatencyBadge tier={a.tierBadges[0]}/>
            </button>
          ))}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--hairline)' }}>
          <button className="btn sm ghost"><Icon name="external" size={11}/>Browse Feature Store</button>
        </div>
      </div>
    </>
  );
}

// ── Inline Threshold Playground ──────────────────────────────────────────
function ThresholdPlayground({ value, setValue, onClose }) {
  // 28-bin histogram for streak feature
  const bins = useM(() => {
    return Array.from({length: 14}, (_, i) => Math.exp(-i * 0.42) * 100 + 4 + Math.random() * 4);
  }, []);
  const max = Math.max(...bins);
  // Sensitivity hints
  const hints = [
    { thresh: 3, count: 47000 },
    { thresh: 5, count: 24000 },
    { thresh: 7, count: 8400 },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20 }}/>
      <div className="card elev-3" style={{ position: 'absolute', top: 32, left: 0, width: 540, zIndex: 21, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="t-mini">Threshold playground · consecutive_ranked_losses_streak</div>
          <button className="btn sm ghost" onClick={onClose}><Icon name="x" size={11}/></button>
        </div>

        {/* Histogram */}
        <div style={{ position: 'relative', padding: '8px 0' }}>
          <div className="histo" style={{ height: 64 }}>
            {bins.map((v, i) => (
              <div key={i} className={`bar ${i + 1 >= value ? 'matched' : ''}`}
                style={{ height: `${(v / max) * 100}%` }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-5)' }}>
            <span>0</span><span>3</span><span>5</span><span>7</span><span>10</span><span>14+</span>
          </div>
        </div>

        {/* Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <span className="mono" style={{ fontSize: 12 }}>≥</span>
          <input type="range" min={1} max={14} value={value}
            onChange={e => setValue(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)' }}/>
          <input type="number" value={value} onChange={e => setValue(parseInt(e.target.value) || 0)}
            className="input mono" style={{ width: 60, fontSize: 13, fontWeight: 600, textAlign: 'center' }}/>
        </div>

        {/* Sensitivity table */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14, padding: 10, background: '#faf8f3', borderRadius: 6 }}>
          {hints.map(h => (
            <div key={h.thresh} style={{ flex: 1, textAlign: 'center',
              padding: 6, borderRadius: 5,
              background: value === h.thresh ? '#fff' : 'transparent',
              border: value === h.thresh ? '1px solid var(--accent)' : '1px solid transparent' }}>
              <span className="t-meta mono" style={{ fontSize: 10 }}>at ≥{h.thresh}</span>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: value === h.thresh ? 'var(--accent)' : 'var(--ink)' }}>{fmtNum(h.count)}</div>
            </div>
          ))}
        </div>
        <p className="t-meta" style={{ fontSize: 11.5, marginTop: 10, marginBottom: 0 }}>
          Steep drop between <span className="mono">5</span> and <span className="mono">7</span> — choose carefully.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn sm" onClick={onClose}>Cancel</button>
          <button className="btn sm primary" onClick={onClose}>Apply</button>
        </div>
      </div>
    </>
  );
}

// ── Exclusion block ──────────────────────────────────────────────────────
function ExclusionBlock({ excl, onRemove, onAdd }) {
  return (
    <div className="predicate-group">
      <div className="group-header" style={{ background: '#fdf6f3' }}>
        <span><span className="mono" style={{ color: 'var(--accent-2)', fontWeight: 600 }}>Exclude</span> · drop these from the result</span>
      </div>
      {excl.map((r, i) => {
        const f = getFeature(r.feature);
        if (!f) return null;
        const { MAU_BASE } = window.HERMES_DATA;
        const cnt = Math.round(MAU_BASE * selOfRow(r, null));
        return (
          <div key={r.id} className="predicate-row">
            <span className="feature-pill">{f.id}</span>
            {f.tierBadges.map(b => <LatencyBadge key={b} tier={b}/>)}
            <span className="op-pill">{r.op}</span>
            <span className="value-pill" style={{ flex: 1 }}>{String(r.value)}</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--accent-2)', minWidth: 162, textAlign: 'right' }}>
              drops ≈ {fmtNum(cnt)} UIDs
            </span>
            <button className="btn ghost sm" style={{ height: 24, padding: '0 4px' }} onClick={() => onRemove(i)}><Icon name="x" size={12}/></button>
          </div>
        );
      })}
      <div style={{ padding: 10, borderTop: '1px solid var(--hairline)', background: '#fafaf6' }}>
        <button onClick={onAdd} className="btn sm ghost"><Icon name="plus" size={11}/> Add exclusion</button>
      </div>
    </div>
  );
}

// ── Right rail — features in use, suggested next ─────────────────────────
function SegmentRail({ groups, excl, navigate }) {
  const allFeatures = useM(() => {
    const ids = new Set();
    groups.forEach(g => g.rows.forEach(r => ids.add(r.feature)));
    excl.forEach(r => ids.add(r.feature));
    return Array.from(ids).map(id => getFeature(id)).filter(Boolean);
  }, [groups, excl]);

  return (
    <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--line)', overflowY: 'auto' }}>
      <RailBlock title={`Features in use · ${allFeatures.length}`}>
        {allFeatures.map(f => (
          <button key={f.id} onClick={() => navigate('feature-detail', { id: f.id })}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, background: 'transparent', marginBottom: 2 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <div className="mono" style={{ fontSize: 11.5 }}>{f.id}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              {f.tierBadges.map(b => <LatencyBadge key={b} tier={b}/>)}
            </div>
          </button>
        ))}
      </RailBlock>

      <RailBlock title="Suggested next · AI">
        <p className="t-meta" style={{ fontSize: 11.5, margin: '0 0 10px' }}>
          Segments like yours often add:
        </p>
        {[
          ['tenure_days_total', '<1d · B', '+12% match coverage'],
          ['gem_balance_current', '<1h · B', 'narrows 8%'],
          ['mmr_drift_3d', '<1d · B', 'similar shape to mmr_drift_7d'],
        ].map(([id, b, why]) => (
          <div key={id} style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 4, background: '#faf8f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ fontSize: 11.5, flex: 1 }}>{id}</span>
              <button className="btn sm ghost" style={{ height: 22, padding: '0 6px' }}><Icon name="plus" size={11}/></button>
            </div>
            <div className="t-meta" style={{ fontSize: 10.5, marginTop: 3 }}>{why}</div>
          </div>
        ))}
      </RailBlock>

      <RailBlock title="Pattern reference">
        <div style={{ padding: 10, background: '#faf8f3', borderRadius: 6 }}>
          <span className="serif" style={{ fontSize: 14 }}>Loss Streak Audience</span>
          <div className="t-meta" style={{ fontSize: 11, marginTop: 4 }}>Seeded on May 7. Average lift across portfolio: +6.4%.</div>
        </div>
      </RailBlock>
    </aside>
  );
}

// ── Feature Picker ───────────────────────────────────────────────────────
function FeaturePicker({ mode, onClose, onPick }) {
  const { FEATURES, FEATURE_DOMAINS } = window.HERMES_DATA;
  const [query, setQuery] = useS('');
  const [pickerMode, setPickerMode] = useS('browse');
  const filtered = FEATURES.filter(f => !query || f.id.includes(query.toLowerCase()) || f.display.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 50,
      background: 'var(--surface)', borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column',
      animation: 'slideUp .2s ease' }}
      className="elev-3">
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {mode === 'condition' && 'Add condition'}
            {mode === 'or-row' && 'Add OR row'}
            {mode === 'exclusion' && 'Add exclusion'}
          </h3>
          <button className="btn ghost sm" onClick={onClose}><Icon name="x" size={12}/></button>
        </div>
        <div className="tabs" style={{ marginTop: 12, marginBottom: -1 }}>
          {[['browse','Browse by category'],['search','Search'],['ai','AI assist']].map(([k, l]) => (
            <div key={k} className={`tab ${pickerMode === k ? 'active' : ''}`} style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => setPickerMode(k)}>{l}</div>
          ))}
        </div>
      </div>

      {mode === 'exclusion' && (
        <div style={{ padding: 14, borderBottom: '1px solid var(--hairline)' }}>
          <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Templates</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Paying users','Test accounts','Opt-outs','Churned','Active in another campaign'].map(t => (
              <button key={t} className="btn sm">{t}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--hairline)' }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search features…"
          className="input" style={{ width: '100%' }}/>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 16px' }}>
        {pickerMode === 'ai' && (
          <div style={{ padding: 12, background: '#faf8f3', borderRadius: 6, marginBottom: 12 }}>
            <span className="t-mini">Smart suggestions · pair well with current rows</span>
            <div className="t-meta" style={{ fontSize: 11.5, marginTop: 4 }}>Based on segments using consecutive_ranked_losses_streak.</div>
          </div>
        )}
        {filtered.slice(0, 18).map(f => (
          <button key={f.id} onClick={() => onPick(f.id)} className="card"
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, marginBottom: 6,
              width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--hairline)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink-3)'; e.currentTarget.style.background = '#fafaf6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hairline)'; e.currentTarget.style.background = ''; }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{f.id}</div>
              <div className="serif" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{f.display}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span className="pill" style={{ fontSize: 10 }}>{f.type}</span>
                {f.tierBadges.map(b => <LatencyBadge key={b} tier={b}/>)}
              </div>
            </div>
            {f.hist && (
              <div style={{ width: 64, flexShrink: 0 }}>
                <Histogram bins={f.hist.slice(0, 14)} height={28}/>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 06 Segment Handoff Modal ─────────────────────────────────────────────
function SegmentHandoff({ onClose, navigate, idOverride }) {
  const segId = idOverride || 'seg-cfm-loss-streak-non-paying-2026-0508-a3f9';
  const [step, setStep] = useS(0);
  useE(() => {
    const ts = [400, 1100, 1600, 2200];
    const ts2 = ts.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => ts2.forEach(clearTimeout);
  }, []);

  const steps = [
    { l: 'Hatchet starts BuildSegmentWorkflow', d: '~immediate' },
    { l: 'Predicate compiled to Trino SQL over Iceberg', d: '~2 min' },
    { l: 'UID list materialised to state_user_segments', d: '~3 min' },
    { l: 'Activation API exposes list to Apollo channels', d: 'ready' },
  ];

  return (
    <div className="scrim">
      <div className="card modal" style={{ width: 580, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--success)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={16}/>
            </span>
            <h2 className="serif" style={{ margin: 0, fontSize: 22, fontStyle: 'normal' }}>Segment registered</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#faf8f3', borderRadius: 6 }}>
            <span className="t-mini">SegmentID</span>
            <span className="mono" style={{ flex: 1, fontSize: 12, fontWeight: 500, overflow: 'auto' }}>{segId}</span>
            <button className="btn sm ghost"><Icon name="copy" size={12}/></button>
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

        <div style={{ padding: '14px 28px', background: '#faf8f3', borderTop: '1px solid var(--hairline)' }}>
          <span className="t-mini" style={{ display: 'block', marginBottom: 8 }}>Substrate B · Hatchet + Trino + Iceberg</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Apollo consumes via</span>
            <span className="mono" style={{ fontSize: 12, padding: '3px 8px', background: '#fff', borderRadius: 4, border: '1px solid var(--line)' }}>
              GET /segments/{segId.slice(0, 16)}…/uids
            </span>
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => { onClose(); navigate('segment-monitoring', { id: segId }); }}>
            <Icon name="eye" size={12}/> Open in monitoring
          </button>
          <button className="btn primary" onClick={() => { onClose(); navigate('campaign-canvas', { type: 'realtime', seedSegment: segId }); }}>
            <Icon name="send" size={12}/> Use in campaign
          </button>
          <button className="btn accent" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── 07 Segment Monitoring ────────────────────────────────────────────────
function SegmentMonitoring({ id, navigate }) {
  const seg = (window.HERMES_DATA.SEGMENTS.find(s => s.id === id)) || window.HERMES_DATA.SEGMENTS[0];
  const [tab, setTab] = useS('overview');

  return (
    <div style={{ overflowY: 'auto', height: '100%' }} data-screen-label="07 Segment · Monitoring">
      <div style={{ padding: '16px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('segment-library')} className="btn ghost sm" style={{ paddingLeft: 0 }}>
          <Icon name="chevleft" size={12}/> Segments
        </button>
        <button onClick={() => navigate('segment-canvas', { id: seg.id, mode: 'edit' })} className="btn">
          <Icon name="edit" size={12}/> Edit predicate
        </button>
      </div>
      <div style={{ padding: '8px 32px 20px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <GoalBadge goal={seg.goal}/>
          <span className="pill">{seg.type}</span>
          {seg.drift && <span className="pill amber"><Icon name="alert" size={10}/>drift detected</span>}
          <StatusDot status="Active"/>
        </div>
        <h1 className="serif" style={{ margin: 0, fontSize: 28 }}>{seg.display}</h1>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{seg.id}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, fontSize: 12, color: 'var(--ink-4)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar initials={seg.ownerAvatar} size={20}/> {seg.owner}</span>
          <span>·</span>
          <span>last build {seg.asOf}</span>
          <span>·</span>
          <span>{seg.campaigns} campaign{seg.campaigns === 1 ? '' : 's'} consuming</span>
        </div>
      </div>

      <div style={{ padding: '0 32px' }}>
        <div className="tabs">
          {['overview','monitoring','used by'].map(t => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div style={{ padding: '24px 32px 60px' }}>
          <div className="card" style={{ padding: 20 }}>
            <span className="t-mini">Predicate · plain English</span>
            <p className="serif" style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--ink-2)', margin: '8px 0 0' }}>
              When a player has lost <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>5 or more ranked matches in a row</span>{' '}
              <em>or</em> their <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>MMR has dropped &gt; 30 over 7 days</span>,
              <em>and</em> they have <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>never paid us</span>,
              <em>and</em> their <span style={{ background: '#fff2eb', padding: '0 4px', borderRadius: 3 }}>account is at least 30 days old</span>,
              excluding test accounts.
            </p>
          </div>
        </div>
      )}

      {tab === 'monitoring' && (
        <div style={{ padding: '20px 32px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 32, padding: '14px 0 22px', borderBottom: '1px solid var(--hairline)', marginBottom: 24 }}>
            {[
              ['Current size', fmtNum(seg.size), 'mono', 'var(--ink)'],
              ['7d delta', '+1.2%', 'mono', 'var(--success)'],
              ['30d delta', '+8.4%', 'mono', 'var(--success)'],
              ['Drift status', seg.drift ? 'Above envelope' : 'Within envelope', 'sans', seg.drift ? 'var(--amber)' : 'var(--success)'],
              ['Last build', '2h 14m ago', 'mono', 'var(--ink-2)'],
            ].map(([l, v, fk, c], i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span className="t-mini">{l}</span>
                <span style={{ fontFamily: fk === 'mono' ? 'var(--mono)' : 'var(--sans)', fontSize: 18, fontWeight: 500, color: c }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="t-mini">Audience size · last 30 days</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['7d','30d','90d','all'].map(w => (
                  <button key={w} className="btn sm" style={{ height: 24, padding: '0 8px',
                    background: w === '30d' ? 'var(--ink)' : 'var(--surface)', color: w === '30d' ? '#fff' : 'var(--ink-3)' }}>{w}</button>
                ))}
              </div>
            </div>
            <FakeTimeChart drift={seg.drift}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 18 }}>
              <span className="t-mini">Member churn-in / churn-out · per day</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 76, marginTop: 14 }}>
                {Array.from({length: 14}, (_, i) => {
                  const inV = 200 + Math.random() * 80;
                  const outV = 120 + Math.random() * 60;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ height: inV / 3, background: 'var(--success)', borderRadius: 1 }}/>
                      <div style={{ height: outV / 3, background: '#d4d2cc', borderRadius: 1 }}/>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <span className="t-mini">Campaigns consuming this segment</span>
              <div style={{ marginTop: 12 }}>
                <button onClick={() => navigate('campaign-monitoring', { id: 'cmp-cfm-407' })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px',
                    borderRadius: 6, background: 'transparent', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <span className="serif" style={{ fontSize: 14, flex: 1 }}>Pass Stuck Rescue</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>cmp-cfm-407</span>
                  <Icon name="chevright" size={12} color="var(--ink-5)"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'used by' && (
        <div style={{ padding: '24px 32px' }}>
          <div className="t-meta">Currently consuming: 1 campaign · Historical: 2 · Derived sub-segments: 1</div>
        </div>
      )}
    </div>
  );
}

// ── Fake time chart for monitoring ───────────────────────────────────────
function FakeTimeChart({ drift }) {
  const days = 30;
  const points = useM(() => {
    return Array.from({length: days}, (_, i) => {
      const base = 24000 + Math.sin(i / 4) * 1500;
      const trend = i * 50;
      const noise = (Math.random() - 0.5) * 1200;
      const spike = drift && i > 22 ? (i - 22) * 800 : 0;
      return Math.round(base + trend + noise + spike);
    });
  }, [drift]);
  const min = Math.min(...points), max = Math.max(...points);
  const w = 720, h = 160;
  const path = points.map((v, i) => {
    const x = (i / (days - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const envelopeUpper = points.map((v, i) => {
    const x = (i / (days - 1)) * w;
    const y = h - ((v + 1500 - min) / (max - min)) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const envelopeLower = points.map((v, i) => {
    const x = (i / (days - 1)) * w;
    const y = h - ((v - 1500 - min) / (max - min)) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 160 }}>
      <path d={`${envelopeUpper} L ${w} ${h} L 0 ${h} Z`} fill="#faf8f3"/>
      <path d={envelopeUpper} stroke="#e7e5e0" strokeWidth="1" fill="none" strokeDasharray="3,3"/>
      <path d={envelopeLower} stroke="#e7e5e0" strokeWidth="1" fill="none" strokeDasharray="3,3"/>
      <path d={path} stroke="var(--accent)" strokeWidth="1.6" fill="none"/>
      {drift && points.slice(23).map((v, i) => {
        const idx = i + 23;
        const x = (idx / (days - 1)) * w;
        const y = h - ((v - min) / (max - min)) * h;
        return <circle key={idx} cx={x} cy={y} r="3" fill="var(--amber)"/>;
      })}
    </svg>
  );
}

Object.assign(window, { SegmentLibrary, SegmentCanvas, SegmentMonitoring, SegmentHandoff });
