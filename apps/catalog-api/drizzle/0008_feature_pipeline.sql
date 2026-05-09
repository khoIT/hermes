-- Real Trino Feature Pipeline (Phase 2): 4 tables backing the
-- /features endpoints. See plans/260509-2032-real-trino-feature-pipeline/.

-- raw_event_aggregates: per-day per-uid rollup of each Trino source table.
-- 7d real rows + 23d synth backfill. Indexed for date-range scans.
CREATE TABLE "raw_event_aggregates" (
  "source_table" text NOT NULL,
  "uid" text NOT NULL,
  "event_date" date NOT NULL,
  "row_count" bigint NOT NULL DEFAULT 0,
  "numeric_sum" double precision,
  "numeric_max" double precision,
  "numeric_min" double precision,
  "last_value" jsonb,
  "is_synthesized" boolean NOT NULL DEFAULT false,
  "computed_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "raw_event_aggregates_pkey" PRIMARY KEY ("source_table", "uid", "event_date")
);--> statement-breakpoint
CREATE INDEX "rea_by_date" ON "raw_event_aggregates" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "rea_by_table_date" ON "raw_event_aggregates" USING btree ("source_table", "event_date");--> statement-breakpoint
CREATE INDEX "rea_by_synth" ON "raw_event_aggregates" USING btree ("is_synthesized");--> statement-breakpoint

-- feature_values: latest per-uid value for each batch feature.
-- No per-uid timeseries; per-day shape lives in feature_distributions_daily.
CREATE TABLE "feature_values" (
  "feature_name" text NOT NULL,
  "uid" text NOT NULL,
  "value_text" text,
  "value_numeric" double precision,
  "computed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_synthesized" boolean NOT NULL DEFAULT false,
  CONSTRAINT "feature_values_pkey" PRIMARY KEY ("feature_name", "uid")
);--> statement-breakpoint
CREATE INDEX "fv_by_numeric" ON "feature_values" USING btree ("feature_name", "value_numeric");--> statement-breakpoint

-- feature_distributions_daily: 30 daily snapshots per feature.
-- Numeric → 24-bin histogram. Bool → 2 buckets. Enum → full categorical.
CREATE TABLE "feature_distributions_daily" (
  "feature_name" text NOT NULL,
  "snapshot_date" date NOT NULL,
  "bucket_kind" text NOT NULL,
  "buckets" jsonb NOT NULL,
  "total_uids" bigint NOT NULL DEFAULT 0,
  "null_count" bigint NOT NULL DEFAULT 0,
  "distinct_count" bigint NOT NULL DEFAULT 0,
  "is_synthesized" boolean NOT NULL DEFAULT false,
  "computed_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "feature_distributions_daily_pkey" PRIMARY KEY ("feature_name", "snapshot_date")
);--> statement-breakpoint
CREATE INDEX "fdd_by_feature" ON "feature_distributions_daily" USING btree ("feature_name");--> statement-breakpoint

-- feature_analytics_180d: single rollup per feature in FeatureAnalytics180d
-- zod shape. catalog-api /features endpoint reads this directly.
-- source: 'real' | 'hybrid' | 'synth' — distinguishes provenance.
CREATE TABLE "feature_analytics_180d" (
  "feature_name" text PRIMARY KEY NOT NULL,
  "usage_count_180d" bigint NOT NULL DEFAULT 0,
  "drift_score" double precision NOT NULL DEFAULT 0,
  "drift_event_dates" jsonb NOT NULL,
  "freshness_sla_met" double precision NOT NULL DEFAULT 1,
  "null_rate" double precision NOT NULL DEFAULT 0,
  "distinct_values_p50" bigint NOT NULL DEFAULT 0,
  "top_consuming_campaigns" jsonb NOT NULL,
  "request_rate_sparkline" jsonb NOT NULL,
  "last_backfill_at" timestamp with time zone,
  "p99_lookup_latency_ms" bigint,
  "coverage_of_mau" double precision,
  "median_lag_minutes" bigint,
  "last_sla_miss_at" timestamp with time zone,
  "source" text NOT NULL DEFAULT 'synth',
  "computed_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "fa180_by_source" ON "feature_analytics_180d" USING btree ("source");
