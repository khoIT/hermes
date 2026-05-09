/**
 * Nav — 5-tab sticky nav bar per PRD §5.1 + Agentic §5.1.
 * Tabs: 01 Feature Store · 02 Explore · 03 Segments · 04 Campaign · 05 Agents
 * Verb subtitles: inventory · investigate · compose · activate · supervise
 * Active route uses deep red #f05a22. Role dropdown stub on right.
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { T } from './theme';
import { BrandMark } from './components/brand-mark';

interface NavTab {
  num: string;
  label: string;
  verb: string;
  path: string;
  /** Match any sub-route of this path as "active" */
  matchPrefix: string;
}

const TABS: NavTab[] = [
  { num: '01', label: 'Feature Store', verb: 'inventory',    path: '/feature-store', matchPrefix: '/feature-store' },
  { num: '02', label: 'Explore',       verb: 'investigate',  path: '/explore',       matchPrefix: '/explore'       },
  { num: '03', label: 'Segments',      verb: 'compose',      path: '/segments',      matchPrefix: '/segments'      },
  { num: '04', label: 'Campaign',      verb: 'activate',     path: '/campaigns',     matchPrefix: '/campaigns'     },
  { num: '05', label: 'Agents',        verb: 'supervise',    path: '/agents',        matchPrefix: '/agents'        },
];

function RoleDropdown() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: T.fSans, fontSize: 12, fontWeight: 500, color: T.n700,
          background: 'none', border: `1px solid ${T.n200}`,
          borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
        }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: 9999,
          background: T.brand, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.fSans, fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>K</span>
        <span>Khoi · CFM PM</span>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none"
          stroke={T.n400} strokeWidth={2} strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: '#fff', border: `1px solid ${T.n200}`,
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          minWidth: 180, zIndex: 500, padding: '6px 0',
        }}>
          {['CFM PM', 'NTH PM', 'TF PM', 'GDS Admin'].map(role => (
            <button
              key={role}
              onClick={() => setOpen(false)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                fontFamily: T.fSans, fontSize: 12, color: T.n700,
                padding: '7px 14px', background: 'none', border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.n50; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              Khoi · {role}
            </button>
          ))}
          <div style={{ height: 1, background: T.n100, margin: '4px 0' }} />
          <button
            onClick={() => setOpen(false)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              fontFamily: T.fSans, fontSize: 12, color: T.n500,
              padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const location = useLocation();

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 0,
      borderBottom: `1px solid ${T.n200}`,
      background: '#fff',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Brand mark */}
      <NavLink to="/" style={{ textDecoration: 'none', marginRight: 32, flexShrink: 0 }}>
        <BrandMark />
      </NavLink>

      {/* Module tabs */}
      <nav style={{ display: 'flex', alignItems: 'stretch', flex: 1, height: '100%' }}>
        {TABS.map(tab => {
          const isActive = location.pathname.startsWith(tab.matchPrefix);
          return (
            <NavLink
              key={tab.num}
              to={tab.path}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '0 14px', gap: 1, cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${T.brand}` : '2px solid transparent',
                transition: 'border-color .12s',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 4,
                }}>
                  <span style={{
                    fontFamily: T.fMono, fontSize: 9, color: isActive ? T.brand : T.n400,
                    fontWeight: 600, letterSpacing: '0.04em',
                  }}>
                    {tab.num}
                  </span>
                  <span style={{
                    fontFamily: T.fSans, fontSize: 13, fontWeight: isActive ? 600 : 500,
                    color: isActive ? T.brand : T.n700,
                    transition: 'color .12s',
                  }}>
                    {tab.label}
                  </span>
                </div>
                <span style={{
                  fontFamily: T.fSans, fontSize: 9, fontWeight: 500,
                  color: isActive ? T.brand : T.n400,
                  textTransform: 'lowercase', letterSpacing: '0.03em',
                  opacity: 0.8,
                }}>
                  {tab.verb}
                </span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Right — role dropdown stub */}
      <div style={{ marginLeft: 16, flexShrink: 0 }}>
        <RoleDropdown />
      </div>
    </header>
  );
}
