/**
 * Hermes App shell — sidebar (left) + main routed content (center) + chat rail (right).
 * Replaces the old top Nav with the 260px Sidebar per chat-first IA redesign;
 * adds the contextual right-rail chat surface (260510-1519 plan).
 */
import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { T } from './theme';
import { Sidebar } from './components/sidebar/sidebar';
import { AppRoutes } from './routes';
import { ToastHost } from './components/ui/toast';
import { bootstrapChatThreads } from './utils/chat-bootstrap';
import { notifyRecentChanged } from './components/sidebar/recent-items';
import { CmdKModal } from './components/global-search/cmd-k-modal';
import { useGlobalShortcut } from './utils/keyboard-shortcut';
import { AskHermesFab } from './components/fab/ask-hermes-fab';
import { ChatRail } from './components/chat-rail/chat-rail';
import {
  isRailHidden, getDefaultOpen, getStoredOpen, setStoredOpen,
} from './utils/chat-rail-store';
import { Topbar } from './components/topbar/topbar';
import { TopbarTrailingProvider } from './utils/topbar-trailing-context';

function AppShell() {
  const [cmdKOpen, setCmdKOpen] = React.useState(false);
  useGlobalShortcut('mod+k', () => setCmdKOpen(o => !o));

  const { pathname } = useLocation();
  const railHidden = isRailHidden(pathname);

  const [railOpen, setRailOpen] = React.useState<boolean>(() => {
    const stored = getStoredOpen();
    if (stored !== null) return stored;
    return getDefaultOpen(pathname);
  });

  // When navigating to a route with a different default and no user pref yet,
  // honour the route default. Stored preference always wins.
  React.useEffect(() => {
    const stored = getStoredOpen();
    if (stored !== null) return;
    setRailOpen(getDefaultOpen(pathname));
  }, [pathname]);

  React.useEffect(() => {
    bootstrapChatThreads();
    notifyRecentChanged();
  }, []);

  const toggleRail = React.useCallback(() => {
    setRailOpen(prev => {
      const next = !prev;
      setStoredOpen(next);
      return next;
    });
  }, []);

  const closeRail = React.useCallback(() => {
    setRailOpen(false);
    setStoredOpen(false);
  }, []);

  return (
    <TopbarTrailingProvider>
      <div style={{
        minHeight: '100vh',
        background: T.n50,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
      }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Topbar onSearchOpen={() => setCmdKOpen(true)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <AppRoutes />
          </div>
        </main>
        {!railHidden && <ChatRail open={railOpen} onClose={closeRail} />}
        {!railHidden && <AskHermesFab open={railOpen} onToggle={toggleRail} />}
        <ToastHost />
        <CmdKModal open={cmdKOpen} onClose={() => setCmdKOpen(false)} />
      </div>
    </TopbarTrailingProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
