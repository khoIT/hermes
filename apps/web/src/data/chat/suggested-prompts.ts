/**
 * Suggested prompts shown on the chat landing page (PRD §4.2 + brainstorm §3.6).
 * Hermes-flavored, NOT verbatim Actioneer.
 */
export interface SuggestedPrompt {
  id: string;
  text: string;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'cpi-ltv',
    text: 'Does higher CPI actually produce higher LTV players? Show the correlation across channels',
  },
  {
    id: 'segment-drift',
    text: 'Which segments are drifting outside their expected envelope this week?',
  },
  {
    id: 'd7-cfm-cohort',
    text: 'Show D7 retention for CFM 5-game-targeting cohort vs. control',
  },
  {
    id: 'churn-features',
    text: 'What features predict churn for high-spend players?',
  },
  {
    id: 'create-segment-spent-50',
    text: 'Create a segment of users who spent over $50 in the last 30 days and are at high churn risk',
  },
];
