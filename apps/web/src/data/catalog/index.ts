/**
 * Hermes catalog — top-level re-exports.
 * All static catalog content bundled with the web app (no Trino dependency).
 *
 * Features:  73 across 11 domains (PRD header: 67; tables sum to 73)
 * Events:    51 across 8 domains (PRD header: 47; tables sum to 51)
 * Segments:  15 (5 demo RFM tiers treated as siblings + 2 game-specific + 8 fictional)
 * Campaigns: 7 (5 representative + 2 agent-drafted)
 * Opportunities: 9 | Drafts: 3 | Recommendations: 2 | Activity: 6
 */

// Feature catalog
export * from './features/index.js';

// Event catalog
export * from './events/index.js';

// Segment catalog
export * from './segments.js';

// Campaign catalog
export * from './campaigns.js';

// Audience Pattern Library
export * from './audience-patterns.js';

// Campaign Pattern Library (intervention archetypes)
export * from './intervention-archetypes.js';

// Agent data (Module 05)
export * from './agents/index.js';
