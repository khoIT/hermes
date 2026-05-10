/**
 * Boards list — `/canvas`. Lists all boards with card counts.
 * Header has "+ New Board" inline create button.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import { T, Icon } from '../../theme';
import { listBoards, createBoard, type Board } from '../../api/boards-client';
import { pushRecent } from '../../utils/recent-items-store';
import { notifyRecentChanged } from '../../components/sidebar/recent-items';
import { ComingSoon } from '../../components/empty-state/coming-soon';

export default function CanvasListPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = React.useState<Board[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    void listBoards().then(b => { if (!cancelled) { setBoards(b); setLoaded(true); } });
    return () => { cancelled = true; };
  }, []);

  const onCreate = async () => {
    const n = name.trim();
    if (!n) return;
    const b = await createBoard(n);
    pushRecent('boards', { id: b.id, title: b.name, updatedAt: b.updatedAt });
    notifyRecentChanged();
    setName(''); setCreating(false);
    navigate(`/canvas/${b.id}`);
  };

  if (!creating && loaded && boards.length === 0) {
    return (
      <div>
        <ComingSoon
          icon={Layers}
          title="No boards yet"
          body="Pin a chat widget to a board to assemble a live dashboard. Each board is a working surface for a question, not a static report."
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -40, paddingBottom: 40 }}>
          <button onClick={() => setCreating(true)} style={primaryBtn}>
            <Icon icon={Plus} size={13} color="#fff" />
            New board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100, margin: '0 auto', fontFamily: T.fSans }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: T.n950, margin: 0, letterSpacing: '-0.01em' }}>
          Boards
        </h1>
        <span style={{ flex: 1 }} />
        {creating ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              autoFocus value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onCreate(); if (e.key === 'Escape') { setCreating(false); setName(''); }}}
              placeholder="Board name..."
              style={{
                border: `1px solid ${T.n200}`, borderRadius: 7,
                padding: '6px 10px', fontSize: 13, fontFamily: T.fSans, outline: 'none',
              }}
            />
            <button onClick={onCreate} style={primaryBtn}>Create</button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} style={primaryBtn}>
            <Icon icon={Plus} size={13} color="#fff" />
            New board
          </button>
        )}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14,
      }}>
        {boards.map(b => {
          const cardCount = b.cardCount
            ?? b.sections.reduce((n, s) => n + (s.cards?.length ?? 0), 0);
          return (
            <button
              key={b.id}
              onClick={() => navigate(`/canvas/${b.id}`)}
              style={{
                textAlign: 'left',
                background: T.surface, border: `1px solid ${T.n200}`, borderRadius: 10,
                padding: 18, cursor: 'pointer',
                fontFamily: T.fSans,
                transition: 'box-shadow .12s, border-color .12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = T.brand; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = T.n200; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Icon icon={Layers} size={16} color={T.n600} />
                <span style={{ fontSize: 15, fontWeight: 600, color: T.n900 }}>{b.name}</span>
              </div>
              <div style={{ fontSize: 12, color: T.n500 }}>
                {cardCount} {cardCount === 1 ? 'card' : 'cards'} · Updated {new Date(b.updatedAt).toLocaleDateString()}
              </div>
            </button>
          );
        })}
      </div>
      {boards.length === 0 && (
        <div style={{ color: T.n500, padding: 20, fontSize: 13 }}>No boards yet.</div>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: T.brand, color: '#fff', border: 'none',
  padding: '8px 14px', borderRadius: 8,
  fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
  cursor: 'pointer',
};
