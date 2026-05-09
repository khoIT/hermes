/**
 * Refinement input — user types a free-text refinement, the playbook's
 * scriptedReplies are matched by trigger keyword, and the matched reply +
 * template patch are dispatched as CAMPAIGN_REFINE. Generic fallback otherwise.
 */
import React from 'react';
import { T } from '../../../../theme';
import type { CampaignTemplate, PlaybookId } from '../_state/compose-types';
import { getPlaybookById } from '../../../../data/catalog/agents/compose-playbooks';

interface Props {
  playbookId: PlaybookId | null;
  onRefine: (userText: string, agentReply: string, templatePatch?: Partial<CampaignTemplate['action']>) => void;
}

const FALLBACK_REPLY =
  "Got it — there's no scripted reply for that yet, but I've noted the refinement on the action card.";

export const RefinementInput: React.FC<Props> = ({ playbookId, onRefine }) => {
  const [text, setText] = React.useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    const pb = playbookId ? getPlaybookById(playbookId) : null;
    const lower = t.toLowerCase();
    const reply = pb?.scriptedReplies.find((r) => lower.includes(r.trigger.toLowerCase()));
    if (reply) {
      onRefine(t, reply.agent, reply.templatePatch);
    } else {
      onRefine(t, FALLBACK_REPLY);
    }
    setText('');
  };

  return (
    <div style={{
      padding: 12, borderRadius: 10, background: '#fff',
      border: `1px solid ${T.n200}`,
    }}>
      <div style={{
        fontFamily: T.fMono, fontSize: 10, color: T.n500,
        letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        Refine this campaign
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={`e.g. "don't make the offer too generous" · "no spam" · "switch to push"`}
          style={{
            flex: 1, padding: '7px 10px', borderRadius: 8,
            border: `1px solid ${T.n200}`, outline: 0,
            fontFamily: T.fSans, fontSize: 12, color: T.n900,
          }}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{
            padding: '7px 12px', borderRadius: 8,
            background: text.trim() ? T.brand : T.n200,
            color: text.trim() ? '#fff' : T.n500,
            border: 0, fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Send →
        </button>
      </div>
    </div>
  );
};
