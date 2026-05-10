/**
 * Hermes App shell — sidebar (left) + main routed content (right).
 * Replaces the old top Nav with the 260px Sidebar per chat-first IA redesign.
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { T } from './theme';
import { Sidebar } from './components/sidebar/sidebar';
import { AppRoutes } from './routes';
import { ToastHost } from './components/ui/toast';
import { bootstrapChatThreads } from './utils/chat-bootstrap';
import { notifyRecentChanged } from './components/sidebar/recent-items';
import { CmdKModal } from './components/global-search/cmd-k-modal';
import { useGlobalShortcut } from './utils/keyboard-shortcut';
import { AskHermesFab } from './components/fab/ask-hermes-fab';
import { AskHermesPanel } from './components/fab/ask-hermes-panel';
import { Topbar } from './components/topbar/topbar';
import { TopbarTrailingProvider } from './utils/topbar-trailing-context';

export default function App() {
  const [cmdKOpen, setCmdKOpen] = React.useState(false);
  useGlobalShortcut('mod+k', () => setCmdKOpen(o => !o));

  React.useEffect(() => {
    bootstrapChatThreads();
    notifyRecentChanged();
  }, []);

  return (
    <BrowserRouter>
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
          <AskHermesFab />
          <AskHermesPanel />
          <ToastHost />
          <CmdKModal open={cmdKOpen} onClose={() => setCmdKOpen(false)} />
        </div>
      </TopbarTrailingProvider>
    </BrowserRouter>
  );
}
