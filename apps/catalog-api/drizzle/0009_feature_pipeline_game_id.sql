-- Phase 02 of Feature Store v3: add game_id column for multi-game architecture.
-- Phase 00 found only cfm_vn reachable on this Trino account; existing rows
-- backfill to 'cfm'. New games plug in once Trino access lands.

-- raw_event_aggregates: add game_id, recompose PK
ALTER TABLE "raw_event_aggregates" ADD COLUMN "game_id" text NOT NULL DEFAULT 'cfm';--> statement-breakpoint
ALTER TABLE "raw_event_aggregates" DROP CONSTRAINT IF EXISTS "raw_event_aggregates_pkey";--> statement-breakpoint
ALTER TABLE "raw_event_aggregates" ADD CONSTRAINT "raw_event_aggregates_pkey"
  PRIMARY KEY ("source_table", "game_id", "uid", "event_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rea_by_game" ON "raw_event_aggregates" USING btree ("game_id");--> statement-breakpoint

-- feature_values: add game_id, recompose PK
ALTER TABLE "feature_values" ADD COLUMN "game_id" text NOT NULL DEFAULT 'cfm';--> statement-breakpoint
ALTER TABLE "feature_values" DROP CONSTRAINT IF EXISTS "feature_values_pkey";--> statement-breakpoint
ALTER TABLE "feature_values" ADD CONSTRAINT "feature_values_pkey"
  PRIMARY KEY ("feature_name", "game_id", "uid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fv_by_game" ON "feature_values" USING btree ("game_id");--> statement-breakpoint

-- feature_pipeline_runs: NEW table for Phase 01 DE pipeline-health endpoint
CREATE TABLE "feature_pipeline_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "feature_name" text NOT NULL,
  "source_table" text,
  "started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "finished_at" timestamp with time zone,
  "rows_written" bigint NOT NULL DEFAULT 0,
  "duration_ms" integer,
  "error" text
);--> statement-breakpoint
CREATE INDEX "fpr_by_feature_started" ON "feature_pipeline_runs" USING btree ("feature_name", "started_at" DESC);
