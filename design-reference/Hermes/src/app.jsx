// app.jsx — Hermes shell + router
const { useState: useStateA, useEffect: useEffectA, useCallback: useCallbackA } = React;

function Topbar({ route, navigate }) {
  const mods = [
    { num: '01', lbl: 'Feature Store', route: 'feature-library', match: ['feature-library', 'feature-detail'] },
    { num: '02', lbl: 'Explore',       route: 'explore',         match: ['explore'] },
    { num: '03', lbl: 'Segments',      route: 'segment-library', match: ['segment-library', 'segment-canvas', 'segment-monitoring'] },
    { num: '04', lbl: 'Campaign',      route: 'campaign-library',match: ['campaign-library', 'campaign-canvas', 'campaign-monitoring'] },
  ];
  return (
    <header className="topbar">
      <div className="brand" onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>
        <span className="h">Hermes</span>
        <span className="sub">Player Engagement</span>
      </div>
      {mods.map(m => (
        <div key={m.num}
             className={'module-tab' + (m.match.includes(route) ? ' active' : '')}
             onClick={() => m.route === 'explore' ? null : navigate(m.route)}
             style={m.route === 'explore' ? { opacity: 0.45, cursor: 'default' } : {}}>
          <span className="num">{m.num}</span>
          <span className="lbl">{m.lbl}{m.route === 'explore' ? ' ·' : ''}</span>
          {m.route === 'explore' && (
            <span style={{ position: 'absolute', right: 6, top: 8, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-5)' }}>soon</span>
          )}
        </div>
      ))}
      <div style={{ flex: 1 }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 4 }}>
        <button className="btn ghost sm" title="Search">
          <Icon name="search" size={13}/> <span className="t-meta">Search…</span>
          <span className="mono" style={{ marginLeft: 8, padding: '1px 5px', borderRadius: 3, background: 'var(--hover)', fontSize: 10 }}>⌘K</span>
        </button>
        <span style={{ width: 1, height: 22, background: 'var(--line)' }}/>
        <span className="t-meta" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>CFM · LiveOps</span>
        <Avatar initials="KH" size={26}/>
      </div>
    </header>
  );
}

function App() {
  const [route, setRoute] = useStateA('home');
  const [params, setParams] = useStateA({});
  const [overlay, setOverlay] = useStateA(null);

  const navigate = useCallbackA((r, p = {}) => {
    if (r === 'segment-handoff') { setOverlay({ kind: 'segment-handoff', params: p }); return; }
    if (r === 'campaign-handoff') { setOverlay({ kind: 'campaign-handoff', params: p }); return; }
    setOverlay(null);
    setRoute(r);
    setParams(p);
    // scroll to top of any scroll container
    requestAnimationFrame(() => {
      const main = document.getElementById('hermes-main');
      if (main) main.scrollTop = 0;
    });
  }, []);

  useEffectA(() => {
    const onKey = e => { if (e.key === 'Escape' && overlay) setOverlay(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlay]);

  let body;
  switch (route) {
    case 'home':                body = <HomeScreen navigate={navigate}/>; break;
    case 'feature-library':     body = <FeatureLibrary navigate={navigate}/>; break;
    case 'feature-detail':      body = <FeatureDetail id={params.id} navigate={navigate}/>; break;
    case 'segment-library':     body = <SegmentLibrary navigate={navigate}/>; break;
    case 'segment-canvas':      body = <SegmentCanvas navigate={navigate} params={params}/>; break;
    case 'segment-monitoring':  body = <SegmentMonitoring id={params.id} navigate={navigate}/>; break;
    case 'campaign-library':    body = <CampaignLibrary navigate={navigate}/>; break;
    case 'campaign-canvas':     body = <CampaignCanvas navigate={navigate} params={params}/>; break;
    case 'campaign-monitoring': body = <CampaignMonitoring id={params.id} navigate={navigate}/>; break;
    default:                    body = <HomeScreen navigate={navigate}/>;
  }

  return (
    <div className="app-shell">
      <Topbar route={route} navigate={navigate}/>
      <main id="hermes-main" style={{ overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg)' }}>
        {body}
      </main>
      {overlay?.kind === 'segment-handoff' && (
        <SegmentHandoff onClose={() => setOverlay(null)} navigate={navigate} idOverride={overlay.params?.id}/>
      )}
      {overlay?.kind === 'campaign-handoff' && (
        <CampaignHandoff
          isRT={overlay.params?.isRT !== false}
          hasSegment={overlay.params?.hasSegment !== false}
          onClose={() => setOverlay(null)}
          navigate={navigate}/>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
