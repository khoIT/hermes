/** Settings — sidebar stub. */
import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { ComingSoon } from '../../components/empty-state/coming-soon';

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={SettingsIcon}
      title="Settings"
      body="Workspace, notifications, and integration preferences. Keyboard
            shortcuts and theme options ship in the next iteration."
      bullets={[
        'Workspace · members · default substrate',
        'Email & Slack notifications',
        'Keyboard shortcuts',
      ]}
    />
  );
}
