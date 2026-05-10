/**
 * ChatRailHeader — title + New + Close. Title is clickable when a thread is
 * active, navigating to the full-page chat view.
 */
import React from 'react';
import { Plus, X } from 'lucide-react';
import { T, Icon } from '../../theme';

interface ChatRailHeaderProps {
  title: string;
  /** When true, clicking the title navigates to the full-page chat. */
  titleClickable?: boolean;
  onTitleClick?: () => void;
  onNew: () => void;
  onClose: () => void;
  /** Optional second line — current page's artifact context. */
  subtitle?: string;
}

export function ChatRailHeader({
  title, titleClickable, onTitleClick, onNew, onClose, subtitle,
}: ChatRailHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0 12px',
      height: 56, flexShrink: 0, boxSizing: 'border-box',
      borderBottom: `1px solid ${T.n200}`,
      background: '#fff',
      fontFamily: T.fSans,
    }}>
      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        <button
          onClick={titleClickable ? onTitleClick : undefined}
          disabled={!titleClickable}
          title={titleClickable ? 'Open in full chat' : undefined}
          style={{
            textAlign: 'left',
            background: 'transparent', border: 'none',
            padding: 0,
            cursor: titleClickable ? 'pointer' : 'default',
            fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.n900,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
          onMouseEnter={e => { if (titleClickable) e.currentTarget.style.color = T.brand; }}
          onMouseLeave={e => { if (titleClickable) e.currentTarget.style.color = T.n900; }}
        >
          {title}
        </button>
        {subtitle && (
          <div
            title={subtitle}
            style={{
              fontFamily: T.fSans, fontSize: 11, color: T.n500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <button onClick={onNew} aria-label="New chat" title="New chat" style={iconBtn}>
        <Icon icon={Plus} size={14} color={T.n600} />
      </button>
      <button onClick={onClose} aria-label="Close rail" title="Close" style={iconBtn}>
        <Icon icon={X} size={14} color={T.n600} />
      </button>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, borderRadius: 6,
  background: 'transparent', border: 'none', cursor: 'pointer',
  flexShrink: 0,
};
