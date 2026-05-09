-- Phase 06 of Feature Store v3: drop Bedrock-derived tables that the
-- Hermes web bundle no longer references. Catalog-API mappings/ and
-- master-tables/ modules also deleted.

-- Drop in dependency order (build_jobs FK on master_tables; master_user_profile_dx FK on master_tables).
DROP TABLE IF EXISTS "build_jobs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "master_user_profile_dx" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "master_tables" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "mappings" CASCADE;
