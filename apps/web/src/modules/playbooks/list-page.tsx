/** Playbooks — sidebar stub. Phase 2 will wire reusable chat→automation flow. */
import React from 'react';
import { FileText } from 'lucide-react';
import { ComingSoon } from '../../components/empty-state/coming-soon';

export default function PlaybooksListPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Playbooks"
      body="Convert any chat into a reusable automation. Save the question, the
            response shape, and the action — replay on a schedule or in a
            shared workspace."
      bullets={[
        'Save a thread as a named playbook',
        'Schedule replays — daily, weekly, on event',
        'Share with your team workspace',
      ]}
    />
  );
}
