-- Phase 5+6 of plan 260510-0151-chat-first-sidebar-ia.
-- Adds campaigns + campaign_changelog (Phase 5) and boards + board_cards
-- (Phase 6). Both modules are addressed by the chat action-card flow and
-- the Pin-to-Board widget shell. Idempotent guards for safe re-run.

-- ─── Campaigns ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "type" text NOT NULL DEFAULT 'realtime',
  "segment_id" text REFERENCES "segments"("id") ON DELETE SET NULL,
  "game" text NOT NULL DEFAULT 'ALL',
  "channel" text NOT NULL DEFAULT 'iam',
  "status" text NOT NULL DEFAULT 'draft',
  "owner" text NOT NULL,
  "sent" text NOT NULL DEFAULT '—',
  "reached" integer NOT NULL DEFAULT 0,
  "converted" integer NOT NULL DEFAULT 0,
  "revenue" text NOT NULL DEFAULT '—',
  "ctr" text NOT NULL DEFAULT '—',
  "start" text NOT NULL DEFAULT 'Ongoing',
  "end" text NOT NULL DEFAULT '',
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_by_game" ON "campaigns" USING btree ("game");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_by_segment" ON "campaigns" USING btree ("segment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_by_status" ON "campaigns" USING btree ("status");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_changelog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" text NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "actor_id" text NOT NULL,
  "diff" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cmp_cl_by_campaign" ON "campaign_changelog" USING btree ("campaign_id", "version");--> statement-breakpoint

-- ─── Boards ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "boards" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "sections" jsonb NOT NULL DEFAULT '[{"id":"pinned","title":"Pinned","isExpanded":true}]'::jsonb,
  "owner" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "boards_by_owner" ON "boards" USING btree ("owner");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "board_cards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "board_id" text NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  "section_id" text NOT NULL DEFAULT 'pinned',
  "widget" jsonb NOT NULL,
  "source_thread_id" text,
  "pinned_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "board_cards_by_board" ON "board_cards" USING btree ("board_id", "section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "board_cards_by_thread" ON "board_cards" USING btree ("source_thread_id");
