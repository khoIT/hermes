# Hermes Demo Data — Compiled from GS LiveOps Calendar 2026

**Purpose:** Realistic feature and event catalogs for the Hermes mockup, derived from analyzing all 48 campaigns in the 2026 calendar across CFM, NTH, COS, TF, and PT.

**Use:**
- **Claude Design** — populate the Feature Store library, the event source picker, and the five demo campaign authoring flows.
- **Engineering (GDS + Apollo)** — feasibility check on what features and events the platform must support before PTG pilot.

**Source documents:**
- `sentinel_gap_analysis.md` (per-game campaign mapping with substrate verdicts)
- `apollo_journey_engine_coverage.md` (per-campaign mechanic extraction)

---

## Part 1 — Batch Features (Substrate B)

67 features across 9 domains. All served from Trino over Iceberg via GDS Hatchet workflows. Latency tiers indicate refresh cadence.

### Identity & lifecycle (11)

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `account_age_days` | int | `<1d` | Days since `account_first_login_ts` |
| `account_first_login_ts` | timestamp | `<1d` | Set once at first login (write-once) |
| `account_first_login_mmdd` | string | `<1d` | For PT-1 anniversary trigger |
| `days_since_install` | int | `<1d` | From AppsFlyer first_open |
| `lifetime_login_count` | int | `<1d` | All-time session starts |
| `last_login_days_ago` | int | `<1d` | Recency for lapsed-user cohorts |
| `player_lifecycle_stage` | enum | `<1d` | nru / mid / veteran / lapsed |
| `is_new_user_d7` | bool | `<1d` | account_age_days ≤ 7 |
| `is_returning_after_lapse` | bool | `<1d` | Came back after ≥30d gap |
| `region_code` | enum | `<1d` | VN / TH / ID / PH / Other |
| `character_gender` | enum | `<1d` | NTH only — male / female |

### Monetization (12)

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `is_paying_user_lifetime` | bool | `<1h` | Has ever made a purchase |
| `lifetime_purchase_count` | int | `<1h` | All-time non-refunded purchases |
| `lifetime_revenue_local` | numeric | `<1h` | All-time gross revenue, local currency |
| `last_purchase_days_ago` | int | `<1h` | Recency of last purchase |
| `spend_tier_lifetime` | enum | `<1d` | free / low / mid / high / whale |
| `vip_status` | enum | `<1h` | none / vip1 / vip2 / vip3 / vip_max |
| `pass_owned_current` | bool | `<1h` | Has active battle pass |
| `pass_progress_current` | int | `<1h` | Pass tier reached this season |
| `annual_contribution_tier` | int | `<1d` | CFM-11 RFM tier 1–5 |
| `avg_purchase_amount_30d` | numeric | `<1d` | Mean ARPPU over 30d |
| `purchase_count_30d` | int | `<1d` | Purchases in last 30 days |
| `purchase_count_7d` | int | `<1d` | Purchases in last 7 days |

### Currency snapshots (3) — refresh hourly

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `gem_balance_current` | int | `<1h` | Premium currency balance |
| `cf_coin_balance_current` | int | `<1h` | CFM secondary currency, used in CFM-18 |
| `premium_currency_balance` | int | `<1h` | Per-game premium |

### Engagement (9)

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `session_count_30d` | int | `<1d` | Sessions in last 30 days |
| `session_count_7d` | int | `<1d` | Sessions in last 7 days |
| `session_count_1d` | int | `<1h` | Sessions today |
| `avg_session_duration_30d` | numeric | `<1d` | Mean session length, minutes |
| `daily_login_streak_current` | int | `<1d` | Current consecutive days |
| `daily_login_streak_max` | int | `<1d` | Max ever |
| `mission_completion_rate_30d` | numeric | `<1d` | Completed / offered |
| `mission_completion_count_7d` | int | `<1d` | |
| `chapter_progress_max` | int | `<1d` | Max chapter reached, used in TF-1 |

### Gameplay — CFM specific (10)

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `ranked_match_count_lifetime` | int | `<1h` | All-time ranked matches |
| `ranked_match_count_30d` | int | `<1d` | Last 30 days |
| `ranked_win_rate_30d` | numeric | `<1d` | Wins / matches |
| `ranked_win_rate_7d` | numeric | `<1d` | |
| `mmr_current` | int | `<1h` | Current matchmaking rating |
| `mmr_drift_7d` | int | `<1d` | mmr_current − mmr_7d_ago |
| `rank_points_current` | int | `<1h` | Ladder points |
| `rank_tier_current` | int | `<1h` | Tier 1–10 |
| `demotion_threshold_distance` | int | `<1h` | **Derived:** rank_points − tier_min. Used in CFM-14 |
| `is_in_demotion_zone` | bool | `<1h` | **Derived:** demotion_threshold_distance ≤ 10 |

### Stateful streaks (2) — dual-tier

These features have a batch refresh (`<1h`) for warmth in non-realtime predicates *and* are mirrored in the TEE online state store for realtime use. The Feature Store treats them as one feature with dual latency badge `<1s · A` shown in trigger predicates and `<1h · B` shown in segment predicates.

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `consecutive_ranked_losses_streak` | int | `<1s · A` / `<1h · B` | CFM-13 Pass Stuck — resets on win |
| `consecutive_ranked_wins_streak` | int | `<1s · A` / `<1h · B` | Inverse |

### Inventory & items (5)

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `weapon_owned_lifetime` | array<string> | `<1d` | All weapons ever owned, used in CFM-2 |
| `weapon_count_owned` | int | `<1d` | Length of above |
| `housing_items_owned` | array<string> | `<1d` | NTH-3 |
| `char_skins_owned` | array<string> | `<1d` | Cosmetic ownership |
| `specific_pack_owned` | bool | `<1h` | Per-SKU ownership flag |

### Promotion / config (3) — refresh on config push

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `promoted_weapon_list` | array<string> | `<1h` | Active promotion config, CFM-17 |
| `promoted_item_active_count` | int | `<1h` | Number of items currently promoted |
| `weapon_promotion_active_count` | int | `<1h` | |

### Social, playstyle & external (12)

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `guild_id` | string | `<1d` | |
| `guild_role` | enum | `<1d` | leader / officer / member |
| `guild_contribution_30d` | numeric | `<1d` | CFM-5 Nấu Lẩu |
| `dominant_playstyle` | enum | `<1d` | pvp / pve / housing / fishing / social — NTH-10, PT-11 |
| `pvp_engagement_score` | numeric | `<1d` | |
| `social_engagement_score` | numeric | `<1d` | |
| `ugc_creator_score` | numeric | `<1d` | NTH UGC campaigns |
| `ugc_voter_score` | numeric | `<1d` | |
| `mong_hoa_luc_popularity_score` | numeric | `<1h` | NTH-9 — pushed via external API |
| `anti_fraud_trust_score` | numeric | `<1h` | NTH-6 — pushed by anti-fraud system |
| `cs_flag` | enum | `<1h` | Customer service tags |
| `marketing_consent_flag` | bool | `<1d` | |

### Test & system (2)

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `is_test_account` | bool | `<1d` | Always exclude from production segments |
| `is_internal_user` | bool | `<1d` | Employee / QA accounts |

### Campaign engagement & anti-fatigue (4)

| Feature | Type | Latency | Notes |
|---|---|---|---|
| `last_iam_received_ts` | timestamp | `<1h` | For anti-fatigue policies |
| `iam_received_count_24h` | int | `<1h` | Used in CFM-18 anti-fatigue clause |
| `iam_received_count_7d` | int | `<1h` | |
| `last_campaign_id_received` | string | `<1h` | |

---

## Part 2 — Live Events (Substrate A · Kafka)

47 events across 8 domains. All consumed by Apollo TEE for trigger evaluation; many also feed batch feature derivation in Substrate B (CDC pattern).

### Match & gameplay (6)

| Event | Key properties | Used by |
|---|---|---|
| `event_match_start` | mode, map, mmr_at_start | CFM ranked tracking |
| `event_match_end` | outcome (win/lose), mode, mmr_change, kills, deaths, weapon_used, killed_by_weapon, duration | **CFM-13 Pass Stuck**, CFM-12, CFM-17 |
| `event_round_end` | round_number, won | |
| `event_kill` | weapon, victim_uid, killer_uid | CFM-17 |
| `event_death` | weapon, killer_uid | |
| `event_weapon_pickup` | weapon_id | |

### Session & login (7)

| Event | Key properties | Used by |
|---|---|---|
| `event_login` | is_first_login_in_window, last_login_gap_days | **TF-1**, PT-1 |
| `event_logout` | session_duration | |
| `event_session_start` | platform, region | |
| `event_session_end` | duration_minutes | |
| `event_lobby_enter` | mode | CFM-15 |
| `event_lobby_exit` | duration_minutes | |
| `event_lobby_idle_60min` | (timer-based) | **CFM-15 Healthy Play** |

### Purchase & monetization (6)

| Event | Key properties | Used by |
|---|---|---|
| `event_purchase` | sku, currency, gross_charged_amount, order_number | |
| `event_iap_shop_open` | shop_section | CFM-7 |
| `event_clicktobuy_item_iap` | item_id, price | |
| `event_pack_offered` | pack_tier, pack_id | |
| `event_purchase_failed` | reason | |
| `event_pack_purchased` | tier (1/2/3/4), sku | **COS-3 step-up** |

### Item & inventory (6)

| Event | Key properties | Used by |
|---|---|---|
| `event_item_received` | item_id, source | **PT-4** |
| `event_item_used` | item_id | |
| `event_currency_balance_change` | currency, delta, balance_after | **CFM-18**, CFM-9 |
| `event_weapon_trial_started` | weapon_id, expires_at | |
| `event_weapon_trial_expired` | weapon_id | **CFM-16** |
| `event_weapon_unlocked` | weapon_id, source | |

### Progression (8)

| Event | Key properties | Used by |
|---|---|---|
| `event_level_up` | new_level | |
| `event_quest_complete` | quest_id, quest_type | |
| `event_chapter_complete` | chapter_id, total_chapters | **TF-1** |
| `event_chapter_started` | chapter_id | TF-1 chapter-stuck |
| `event_milestone_reached` | milestone_id | |
| `event_rank_promotion` | new_tier | |
| `event_rank_demotion` | new_tier | |
| `event_mmr_threshold_crossed` | new_threshold | |

### Social (6)

| Event | Key properties | Used by |
|---|---|---|
| `event_friend_invite_sent` | recipient_uid | CFM-4 |
| `event_friend_invite_accepted` | inviter_uid | CFM-4 |
| `event_guild_join` | guild_id | |
| `event_guild_leave` | guild_id | |
| `event_chat_message_sent` | channel | |
| `event_pair_formed` | partner_uid | NTH-5 couples |

### Campaign / UI interaction (8)

| Event | Key properties | Used by |
|---|---|---|
| `event_iam_shown` | campaign_id, variant | All IAM campaigns |
| `event_iam_clicked` | campaign_id, cta | |
| `event_iam_dismissed` | campaign_id | |
| `event_shop_open` | shop_section | |
| `event_shop_click` | shop_section, item_id | **PT-9 survey trigger** |
| `event_survey_response` | survey_id, response | **PT-9** |
| `event_h5_event_open` | event_id | |
| `event_minigame_played` | minigame_id, score | |

### UGC & moderation (4)

| Event | Key properties | Used by |
|---|---|---|
| `event_ugc_submission` | content_id, content_type | NTH-1, NTH-4, NTH-7 |
| `event_ugc_vote` | content_id, vote | |
| `event_ugc_view` | content_id | |
| `event_suspicious_activity_flagged` | flag_type, severity | NTH-6 anti-fraud |

---

## Part 3 — Five Representative Campaigns

Picked to span the full latency and complexity spectrum:

| # | Campaign | Game | Type | Substrate | What it demonstrates |
|---|---|---|---|---|---|
| 1 | CFM-2 Voting Vũ Khí SS1 | CFM | Pure Segment · One-time push | B | Custom-dimension array predicate |
| 2 | CFM-11 Lễ Hội Cuối Năm | CFM | 4 Segments · Scheduled push | B | RFM tiering with branching rewards |
| 3 | CFM-13 Pass Stuck Rescue | CFM | Real-time campaign | A + B | Stateful predicate, mixed-latency, journey, holdout |
| 4 | CFM-18 Low CF Coin + Promoted Item | CFM | Real-time campaign | A + B | Mid-session balance check, anti-fatigue |
| 5 | TF-1 Football Hub Học Viện Sân Cỏ | TF | Hybrid Segment + real-time trigger | A + B | Per-user 14-day clock, chapter-stuck branching |

---

### Campaign 1 — CFM-2 Voting Vũ Khí SS1

**Game:** CrossFire Legends · **Window:** 29 Jun – 12 Jul 2026 · **Type:** Pure Segment · One-time push · **Substrate:** B

**Hypothesis.** Players who own SS1-tier weapons are the strongest signal for engagement with weapon-nostalgia content; sending them a vote H5 drives both campaign participation and viral re-share.

**Predicate.**

```
weapon_owned_lifetime  CONTAINS_ANY  [w_ak47_ss1, w_m4a1_ss1, w_awm_ss1, w_desert_eagle_ss1]
AND  account_age_days  ≥  365
AND NOT  is_test_account
```

**Audience preview.** ~84,200 UIDs at as_of_timestamp 2026-06-29 06:00 ICT. Lifecycle 4% NRU / 31% Mid / 65% Veteran. Spend tier 22% Free / 51% Low-Mid / 27% High-Whale.

**Action.** One-time push notification + IAM banner, deep-linked to vote H5. No journey, no variants. Universal opt-in (no holdout) — standard for participation-driving Past Segment campaigns.

**Substrate routing.**

```
✓  Segment registered
   SegmentID  seg-cfm-ss1-weapon-owners-2026   [copy]

   1. Hatchet starts BuildSegmentWorkflow                  · queued
   2. Predicate compiled to Trino SQL over Iceberg         · ~2 min
   3. UID list materialised to state_user_segments         · ~3 min
   4. Activation API exposes list to Apollo channels       · ready

   Substrate B · Hatchet + Trino + Iceberg
   Apollo consumes via: GET /segments/seg-cfm-ss1-weapon-owners-2026/uids
```

---

### Campaign 2 — CFM-11 Lễ Hội Cuối Năm / Sinh Nhật CFL

**Game:** CFM · **Window:** 18 – 31 Dec 2026 · **Type:** 4 Sibling Segments + Branching Campaign · **Substrate:** B

**Hypothesis.** Year-end retention lift comes from differentiated reward tiers — NRUs need onboarding incentives, mid-tier needs upsell, whales need recognition. One-size-fits-all leaves money and goodwill on the table.

**Predicates** (4 sibling segments forming a tier ladder, mutually exclusive):

```
TIER 1 · NRU
  account_age_days ≤ 90
  AND is_paying_user_lifetime = false

TIER 2 · MID
  account_age_days > 90
  AND spend_tier_lifetime IN [low, mid]
  AND ranked_match_count_30d ≥ 10

TIER 3 · HIGH
  spend_tier_lifetime = high
  AND daily_login_streak_current ≥ 7

TIER 4 · WHALE
  spend_tier_lifetime = whale
  OR annual_contribution_tier ≥ 4
```

**Audience preview.** ~480k NRU · 1.2M Mid · 145k High · 22k Whale. Tier 4 includes 18% of total revenue contribution.

**Action.** 4 differentiated reward bundles (per tier) + IAM banner with personalized contribution stats ("You played N matches with Y guild this year"). Holdout 5% per tier balanced.

**Activation cadence.** Daily 06:00 ICT rebuild; Apollo campaign engine reads fresh SegmentIDs each morning and routes per-segment payload.

**Substrate routing.** 4 SegmentIDs maintained in parallel; campaign object references all four with per-segment action mapping. Standard scheduled workflow.

---

### Campaign 3 — CFM-13 Pass Stuck Rescue

**Game:** CFM · **Window:** ongoing (rolling) · **Type:** Real-time Campaign · **Substrate:** A + B

**Hypothesis.** *"Frustration drives next-session churn at ≥4-loss streaks."* Validated in Explore (exp-01, Mar 2026) — players hitting 4+ ranked losses in sequence churn at ~2.3× base rate within 24h. An MMR shield offer at the cliff moment is hypothesized to recover 6-9%.

**Trigger event.** `event_match_end`

**Predicate.**

```
event_match_end.outcome = lose
AND  consecutive_ranked_losses_streak  ≥  5         ⟵ realtime · A
AND  is_paying_user_lifetime  =  false              ⟵ batch · B
AND  mmr_drift_7d  <  −30                            ⟵ batch · B
AND NOT  is_test_account                              ⟵ batch · B

⚠ This trigger evaluates at event time. Batch features (<1h, <1d)
   are point-in-time as of last refresh — today 06:00 for warm,
   last night for cold.
```

**Trigger policies.** Per-player cooldown 24h · Global cap unlimited · Anti-fatigue: skip if `iam_received_count_24h ≥ 2`.

**Audience preview.**
- Estimated fires/day: ~3,420 (based on `event_match_end` volume × 4.2% predicate match rate × cooldown discount)
- Unique players/week: ~18,200

**Action — A/B/Holdout.**

| Variant | Allocation | Payload |
|---|---|---|
| A | 45% | IAM "MMR shield · Next loss won't drop your rank" |
| B | 45% | IAM "Bonus XP boost · +50% XP on next 3 wins" |
| Holdout | 10% | No IAM, control group |

**Journey.**

```
Trigger (event_match_end + predicate)
  → Action: IAM (variant per A/B/H allocation)
    → Wait 24h
      → Condition: did event_match_end.outcome = win occur within 24h?
        → Yes: Goal "Recovered" (success metric)
        → No:  Exit "No recovery"
```

**Substrate routing.**

```
✓  Live Trigger registered
   TriggerID  trg-cfm-pass-stuck   [copy]

   1. Predicate compiled to expr-lang                       · done
   2. Trigger config written to JourneyDB                   · done
   3. Apollo TEE picks up on next reload                    · ~30 sec
   4. TEE evaluates against event_match_end events          · live

   Substrate A · Apollo TEE + Temporal
   TEE evaluates @features.consecutive_ranked_losses_streak
     and @features.is_paying_user_lifetime per match_end event;
   spawns Temporal workflow on match.
```

**Why this campaign matters for the demo.** It's the only one of the five that exercises *all* the architectural decisions at once: dual-tier feature (`consecutive_ranked_losses_streak`), mixed-latency predicate, real-time event source, journey with wait-and-evaluate, A/B/holdout variants, both substrates collaborating. If the mockup walks this end-to-end, it walks the whole vision.

---

### Campaign 4 — CFM-18 Low CF Coin + Promoted Item

**Game:** CFM · **Window:** matches CFM weapon promotion calendar · **Type:** Real-time Campaign · **Substrate:** A + B

**Hypothesis.** Players whose CF Coin balance is just below the price of an active promoted item are 4× more likely to convert if shown a top-up offer at the moment of relevance — the gap between "I want this" and "I can't afford it" is the highest-intent conversion window in the funnel.

**Trigger event.** `event_currency_balance_change` (filtered to `currency = cf_coin`)

**Predicate.**

```
event_currency_balance_change.currency = cf_coin
AND  cf_coin_balance_current  ≥  500             ⟵ realtime · A
AND  cf_coin_balance_current  ≤  900             ⟵ realtime · A
AND  promoted_item_active_count  ≥  1            ⟵ batch · B (config refresh hourly)
AND  vip_status  ≠  none                         ⟵ batch · B
AND NOT  iam_received_count_24h  ≥  2            ⟵ batch · B (anti-fatigue)
```

**Trigger policies.** Per-player cooldown 12h · Frequency cap 50,000 fires/day.

**Audience preview.** ~12,800 fires/day · 7,400 unique players/week.

**Action.** IAM with CF Coin top-up offer pre-priced at the gap to the promoted item ("Top up 400 CF Coins for 99đ — unlock the AK-Knife Camo today").

**Substrate routing.** Same shape as Campaign 3, but the live state lookup pattern is what differs — TEE reads `cf_coin_balance_current` from the online state store on every balance-change event. This is the canonical mid-session-state pattern.

---

### Campaign 5 — TF-1 Football Hub Học Viện Sân Cỏ

**Game:** Total Football · **Window:** 1 Sep – 30 Sep 2026 · **Type:** Hybrid (Segment seed + Real-time trigger steady state) · **Substrate:** A + B

**Hypothesis.** A guided 14-day return-to-game journey with chapter-stuck detection recovers 18-22% of lapsed coaches into active player pool. Both existing matchers (returning before campaign start) and new matchers (first login after start) need the same journey, so we run a Segment-seed + real-time-trigger pattern in parallel.

**Audience seed (Segment, runs once on campaign start).**

```
account_age_days  ≥  90
AND  last_login_days_ago  BETWEEN  30  AND  180
AND  chapter_progress_max  ≥  3
AND  ranked_match_count_lifetime  ≥  20
AND NOT  is_test_account
```

→ ~38,000 returning lapsed coaches. **SegmentID seg-tf-returning-coaches** (one-time as-of snapshot at 2026-09-01 00:00).

**Real-time trigger** (handles new entrants who match same predicate going forward):

```
event_login
AND  event_login.last_login_gap_days  ≥  30
AND  account_age_days  ≥  90
AND  chapter_progress_max  ≥  3
AND  ranked_match_count_lifetime  ≥  20
```

→ ~600 fires/day in steady state. **TriggerID trg-tf-returning-login.**

**Per-user 14-day activation clock.** Derived feature `activation_clock_days_remaining` based on `segment_entry_ts` (set when player enters the segment OR fires the trigger, whichever first). Both paths feed the same Temporal workflow.

**Journey.**

```
Entry (Segment seed OR Real-time trigger)
  Day 0:  Action — IAM "Welcome back coach"
   ↓
  Wait 24h
   ↓
  Day 1:  Condition — has session_count_1d > 0?
            → Yes: continue
            → No: Action — Push "Your team's waiting"
   ↓
  Wait 48h
   ↓
  Day 3:  Condition — has chapter_progress_max advanced?
            → Yes: continue
            → No: Action — IAM "Chapter rescue tutorial"
   ↓
  Wait 96h
   ↓
  Day 7:  Condition — session_count_7d ≥ 1?
            → Yes: continue
            → No: Action — Re-engage push
   ↓
  Wait 168h
   ↓
  Day 14: Goal evaluation
            → ranked_match_count_30d increased ≥5: Goal "Activated"
            → else: Exit "Not activated"
```

**Holdout.** 10% of seed segment + 10% of trigger entrants, balanced. Holdout receives no IAM/Push but Day-14 goal still measured.

**Substrate routing.**

```
✓  Segment registered    seg-tf-returning-coaches  · Substrate B
✓  Live Trigger registered  trg-tf-returning-login  · Substrate A

   Both feed: Apollo Temporal workflow `tf-football-hub-activation-v1`
   Workflow holds 14-day per-user clock state in Temporal-managed memory.
```

**Why this campaign matters for the demo.** It's the canonical *hybrid* — shows that one campaign can compose a Segment AND a real-time trigger predicate into one journey. The Campaign module needs to support this pattern, and it's the single hardest case to express well in a UI.

---

## Part 4 — Naming conventions

Used consistently across all features and events for the Hermes mockup:

| Convention | Example | Notes |
|---|---|---|
| Feature names | `consecutive_ranked_losses_streak` | snake_case, no abbreviations except common ones (mmr, vip, iap) |
| Boolean prefix | `is_*`, `has_*` | `is_paying_user_lifetime`, `has_seen_login_form` |
| Time-window suffix | `_30d`, `_7d`, `_1d`, `_lifetime` | Append window to the metric, not prefix |
| Recency feature | `last_*_days_ago` | `last_login_days_ago`, `last_purchase_days_ago` |
| Snapshot feature | `*_current` | `gem_balance_current`, `pass_progress_current` |
| Counter feature | `*_count` | `lifetime_login_count`, `purchase_count_30d` |
| Score feature | `*_score` | `social_engagement_score`, `anti_fraud_trust_score` |
| Event names | `event_match_end`, `event_currency_balance_change` | `event_` prefix always; verb_noun structure |
| Segment IDs | `seg-{game}-{purpose}-{year}` | `seg-cfm-ss1-weapon-owners-2026` |
| Trigger IDs | `trg-{game}-{purpose}` | `trg-cfm-pass-stuck` |
| Campaign IDs | `cmp-{game}-{seq}` | `cmp-cfm-407` |

---

## Part 5 — What this implies for the platform

**For GDS engineering — features the registry must support:**

1. **Dual-tier features.** `consecutive_ranked_losses_streak` exists in batch (warm tier `<1h`) AND in TEE online state (`<1s`). The Feature Store registry must model this as one feature with two materializations, not two features. Both share definition; both are kept consistent via TEE-to-state-store CDC.

2. **Derived features.** `demotion_threshold_distance`, `is_in_demotion_zone`, `chapter_stuck_days`. The Semantic Layer must support feature definitions that reference other features, not just raw event aggregates.

3. **External-signal ingestion.** `mong_hoa_luc_popularity_score` (NTH-9), `anti_fraud_trust_score` (NTH-6), `cs_flag`. The Feature Store must accept writes from non-Kafka systems via API.

4. **Array features.** `weapon_owned_lifetime`, `housing_items_owned`. The DSL must support `CONTAINS_ANY` / `CONTAINS_ALL` predicates over arrays, not just scalar comparisons.

5. **First-time-of-X capture.** `account_first_login_ts`, `account_first_login_mmdd`. Write-once-at-event-time semantics. PT-1 anniversary depends on this; many other campaigns implicitly assume it.

**For Apollo engineering — events the TEE must consume:**

The 47 events listed in Part 2 represent the minimum Kafka topic surface. PTG pilot can launch with the subset required for its 12 campaigns; the full surface should be planned for the Q3 LOE expansion.

---

## Part 6 — How Hermes Design uses this

Direct mapping from this document to mockup elements:

- **`01_fs_library` Feature Store catalog** — populate from Part 1. Show 67 features grouped by domain. Include latency badges per the table.
- **`02_fs_detail` Feature detail** — pick `consecutive_ranked_losses_streak` as the showcase feature; it has dual-tier latency and is referenced by the canonical demo campaign.
- **Event source picker** (inside Campaign canvas, real-time trigger type) — populate from Part 2. Default category is "Match & gameplay"; default suggestion is `event_match_end`.
- **Segment library `03_seg_library`** — show CFM-2 and CFM-11 segments as already-built rows. Add 6-8 fictional ones for variety.
- **Campaign library `09_cmp_library`** — show all 5 campaigns from Part 3 as rows with appropriate trigger-type chips.
- **Authoring canvas demo** — Campaign 3 (CFM-13 Pass Stuck Rescue) is the canonical walkthrough. Predicate as written in Part 3.
- **Threshold playground** — slider over `consecutive_ranked_losses_streak` histogram, showing the ≥3 / ≥5 / ≥7 sensitivity table from the PRD.
