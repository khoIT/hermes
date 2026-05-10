/** Knowledge — sidebar stub (glossary + system docs). */
import React from 'react';
import { BookOpen } from 'lucide-react';
import { ComingSoon } from '../../components/empty-state/coming-soon';

export default function KnowledgePage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Knowledge"
      body="Glossary, system docs, and shared playbooks for your team.
            Searchable from the chat input via @docs."
      bullets={[
        'Hermes feature glossary',
        'Game-specific definitions',
        'Onboarding & demo guides',
      ]}
    />
  );
}
