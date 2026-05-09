/**
 * Hermes App shell — route table placeholder.
 * P-5 will flesh out nav + all page routes.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/home-page';
import { T } from './theme';

/** Minimal top-bar so the shell feels intentional, not blank. */
function TopBar() {
  return (
    <header style={{
      height: 48, display: 'flex', alignItems: 'center', padding: '0 40px',
      borderBottom: `1px solid ${T.n200}`, background: '#fff',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <span style={{
        fontFamily: T.fDisp, fontSize: 22, fontWeight: 400,
        textTransform: 'uppercase', letterSpacing: '0.04em',
        color: T.n950,
      }}>
        HERMES
      </span>
      <span style={{
        marginLeft: 10, fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
        color: T.brand, textTransform: 'uppercase', letterSpacing: '0.08em',
        background: T.brandSoft, border: `1px solid ${T.brandBorder}`,
        borderRadius: 4, padding: '2px 6px',
      }}>
        α
      </span>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: T.n50 }}>
        <TopBar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* P-5 routes: /campaigns, /segments, /metrics, /explorer, /settings */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
