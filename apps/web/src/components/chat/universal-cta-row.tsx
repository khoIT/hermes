/**
 * UniversalCtaRow — three-button footer rendered on every AssistantResponse.
 *   🎯 Save as segment · 📊 Pin to board · 📣 Build campaign
 *
 * Smart-hide rules:
 *   - hiddenCtas mask suppresses individual buttons (set by caller when
 *     response already has the matching action_card_* / pin_to_board section).
 *   - response.suppressUniversalCtas === true → hide entire row.
 *   - Single narrative ≤80 chars → hide entire row (mitigates clutter on yes/no answers).
 *   - All three CTAs hidden → do NOT render container (no empty padding/border).
 */
import React from 'react';
import { Target, LayoutDashboard, Megaphone } from 'lucide-react';
import { T, Icon, type LucideIcon } from '../../theme';
import { extractPrefillContext } from '../../utils/response-prefill';
import { QuickSegmentDialog } from './quick-segment-dialog';
import { QuickCampaignDialog } from './quick-campaign-dialog';
import { PinToBoardSection } from './sections/pin-to-board-section';
import type { ChatMessage } from '../../utils/chat-store';
import type { NarrativePayload } from '../../data/chat/response-types';

type CtaKind = 'segment' | 'board' | 'campaign';

interface Props {
  response: ChatMessage;
  hiddenCtas: Set<CtaKind>;
}

/** Synthetic pin payload used when triggering board-pin from the CTA row. */
const SYNTHETIC_PIN_PAYLOAD = { boardName: 'My Board', widgetSnapshotId: '' };

export function UniversalCtaRow({ response, hiddenCtas }: Props) {
  const [openDialog, setOpenDialog] = React.useState<'segment' | 'campaign' | null>(null);
  // showPinSection: swaps the "Pin to board" CTA button for the PinToBoardSection
  // widget so the user sees a single-click pin action inline.
  const [showPinSection, setShowPinSection] = React.useState(false);

  // Suppression flag — already typed in ChatMessage
  const suppressed = response.suppressUniversalCtas === true;

  // Single narrative ≤80 chars → hide row
  const isTooShort = React.useMemo(() => {
    const sections = response.sections ?? [];
    const first = sections[0];
    if (sections.length === 1 && first && first.type === 'narrative') {
      const text = (first.payload as NarrativePayload).text ?? '';
      return text.length <= 80;
    }
    if (!sections.length && response.text) {
      return response.text.length <= 80;
    }
    return false;
  }, [response]);

  const visibleSegment  = !hiddenCtas.has('segment');
  const visibleBoard    = !hiddenCtas.has('board');
  const visibleCampaign = !hiddenCtas.has('campaign');
  const anyVisible = visibleSegment || visibleBoard || visibleCampaign;

  if (suppressed || isTooShort || !anyVisible) return null;

  const prefill = extractPrefillContext(response);

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
        padding: '6px 0', marginTop: 4,
        borderTop: `1px solid ${T.n100}`,
        maxWidth: 820,
      }}>
        {visibleSegment && (
          <CtaButton
            icon={Target}
            label="Save as segment"
            onClick={() => setOpenDialog('segment')}
          />
        )}
        {visibleBoard && prefill.primaryWidget && !showPinSection && (
          <CtaButton
            icon={LayoutDashboard}
            label="Pin to board"
            onClick={() => setShowPinSection(true)}
          />
        )}
        {/* Inline pin section replaces the button once activated */}
        {visibleBoard && prefill.primaryWidget && showPinSection && (
          <PinToBoardSection
            payload={SYNTHETIC_PIN_PAYLOAD}
            message={response}
            forceWidget={prefill.primaryWidget}
          />
        )}
        {visibleCampaign && (
          <CtaButton
            icon={Megaphone}
            label="Build campaign"
            onClick={() => setOpenDialog('campaign')}
          />
        )}
      </div>

      {/* Modal dialogs — rendered in a portal-like position via fixed overlay */}
      {openDialog === 'segment' && (
        <QuickSegmentDialog
          prefill={prefill}
          onClose={() => setOpenDialog(null)}
        />
      )}
      {openDialog === 'campaign' && (
        <QuickCampaignDialog
          prefill={prefill}
          onClose={() => setOpenDialog(null)}
        />
      )}
    </>
  );
}

interface CtaButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

function CtaButton({ icon, label, onClick }: CtaButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 6, border: 'none',
        background: 'transparent', cursor: 'pointer',
        fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
        color: T.n600, transition: 'background .1s, color .1s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = T.n100;
        e.currentTarget.style.color = T.n900;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = T.n600;
      }}
    >
      <Icon icon={icon} size={13} color="currentColor" />
      {label}
    </button>
  );
}
