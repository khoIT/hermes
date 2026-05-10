-- Phase 2 of plan 260510-1640-chat-artifact-connectivity.
-- Adds nullable source_thread_id to segments + campaigns so action cards can
-- persist back-links to the originating chat thread. ADD COLUMN ... NULL only —
-- no defaults, no constraints — so existing rows are unaffected and the
-- migration is fully reversible via DROP COLUMN.

ALTER TABLE "segments" ADD COLUMN IF NOT EXISTS "source_thread_id" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "source_thread_id" text;
