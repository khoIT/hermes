/**
 * Hermes App shell — mounts Nav + all 23 PRD screen routes.
 * P-5: sticky nav with 5 module tabs, role dropdown, BrandMark.
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { T } from './theme';
import { Nav } from './nav';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: T.n50, display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
