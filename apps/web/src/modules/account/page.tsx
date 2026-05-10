/**
 * Account — role switcher + sign out. Replaces the old Nav RoleDropdown.
 * Role switch is UI-only for v1; no real auth backend hook yet.
 */
import React from 'react';
import { T } from '../../theme';
import { toast } from '../../components/ui/toast';

const ROLES = ['CFM PM', 'NTH PM', 'TF PM', 'GDS Admin'];

export default function AccountPage() {
  const [role, setRole] = React.useState('CFM PM');

  return (
    <div style={{
      maxWidth: 560, margin: '60px auto', padding: '0 24px',
      fontFamily: T.fSans,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: T.n400,
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
      }}>Account</div>
      <h1 style={{
        fontSize: 28, fontWeight: 600, color: T.n950, letterSpacing: '-0.01em',
        margin: '0 0 24px',
      }}>Khoi · {role}</h1>

      {/* Identity card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: 18, border: `1px solid ${T.n200}`, borderRadius: 10,
        background: '#fff', marginBottom: 28,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 9999, background: T.brand,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700,
        }}>K</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.n900 }}>
            khoitn@vng.com.vn
          </div>
          <div style={{ fontSize: 12, color: T.n500 }}>VNGGames · LiveOps</div>
        </div>
      </div>

      {/* Role switcher */}
      <div style={{
        fontSize: 12, fontWeight: 600, color: T.n500,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
      }}>Switch role</div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 10,
        padding: 6, marginBottom: 28,
      }}>
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => { setRole(r); toast(`Switched to ${r}`, { tone: 'success' }); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', border: 'none', background: 'transparent',
              borderRadius: 6, cursor: 'pointer', fontFamily: T.fSans, fontSize: 13,
              color: T.n900, textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.n50; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span>Khoi · {r}</span>
            {role === r && <span style={{ color: T.brand, fontSize: 13 }}>✓</span>}
          </button>
        ))}
      </div>

      <button
        onClick={() => toast('Sign out — demo only')}
        style={{
          fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
          background: 'transparent', color: T.red600,
          border: `1px solid ${T.n200}`, borderRadius: 8,
          padding: '8px 14px', cursor: 'pointer',
        }}
      >Sign out</button>
    </div>
  );
}
