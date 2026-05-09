# LiveOps Calendar 2026 — Per-Campaign Requirements Architecture

**Source:** GS LiveOps Calendar 2026 (47 campaigns across CFM, Total Football, Cookie Run, NTH, PlayTogether)
**Architecture assumption:** A **Journey/LiveOps engine** subscribes to Kafka, holds per-user-per-journey state, evaluates predicates, and emits actions. The **data store is User Stage** — one shared metric registry with per-metric freshness configuration (`time_grain`) materialized to offline Iceberg + online KV mirror.
**Reward delivery:** Handled end-to-end by the existing **Promotion service**. The Reward Engine is the contract layer that calls Promotion with `(user_id, bundle_id, idempotency_key, reason_code)` — it does not re-implement granting.

---

## How to read this document

Each campaign is one row with six fields:

- **Goal** — the LTV outcome the campaign is buying.
- **Trigger conditions** — the predicate that admits a user or fires the action.
- **Journey-internal state** — counters, flags, journey progress, dedup state that this campaign holds inside the Journey engine. Per-user, per-journey, ephemeral.
- **User Stage metrics** — *shared* metrics the campaign reads at decision time via the online KV mirror. Each metric annotated with required `time_grain`: `daily` / `hourly` / `5min` / `event-time`.
- **Monitoring** — campaign-specific operational and business signals beyond the universal baseline.

### The two read paths (the collapse from four archetypes)

The four read-path archetypes from the prior version (Batch SoR / Batch + render-read / Streaming / Hybrid) were really points on a 2×2 of *(freshness needed) × (where the predicate state machine lives)*. Once we commit that **Journey engine evaluates all live predicates**, the second axis collapses to a single answer. What's left is per-metric freshness — a `time_grain` field on each User Stage metric definition, not an architecture choice per campaign.

| Read path | What it is | Lives where |
|---|---|---|
| **Journey-internal state** | Counters, flags, dedup, journey progress *specific to this one campaign*. Derived from events Journey already subscribes to. | Inside Journey engine's per-user-per-journey state store |
| **User Stage read** | *Shared* metric served via online KV at decision time. Freshness controlled per metric. | User Stage — offline Iceberg (truth) + online KV mirror (serving) |

The architectural decision per metric is just: *"who else uses this?"* If only this journey, it's Journey-internal. If shared across campaigns/segments/analytics, it's User Stage. If User Stage AND must reflect the latest event, it's User Stage with `event-time` time_grain (stream-materialized).

### Conventions

- "Baseline" User Stage metrics (`last_login_at`, `account_age_days`, `country`, `lang`, `is_reachable_push`) assumed available daily-grain for all campaigns; only listed when load-bearing.
- Standard journey-internal state (`journey_entered_at`, `current_step_id`, `last_iam_received_at[campaign_id]`) is implicit for every Journey-driven campaign.
- Rewards always flow `Reward Engine → Promotion service → in-game grant`.
- ⭐ marks campaigns that single-handedly justify a platform capability — see *Notes* under each table.

Categories follow the LTV taxonomy: **NRU activation · retention & recall · monetization · churn prevention · social ignition · contribution tiering.**

---

# Category 1 — NRU Activation

| Campaign | Goal | Trigger conditions | Journey-internal state | User Stage metrics | Monitoring |
|---|---|---|---|---|---|
| **TF-1** · Football Hub (Sep, 14d/user) | Onboard new + recall returning coaches via chaptered missions | Entry A: `account_age_days <= 10`. Entry B: `last_login_before_session_at <= today - 7d`. 14-day clock starts on per-user segment entry | Per-user activation timestamp, current chapter, chapter completion within journey, referral chain for this campaign | `account_age_days` (daily), `last_login_before_session_at` (hourly), referral graph snapshot (hourly) | Per-chapter funnel + drop-off; per-user clock skew; referral integrity (every accept matches NRU activation); D1/3/7/14 by chapter depth |
| **CFM-12** · IAM "New Guide" pack | Nudge brand-new players to intro pack on the 3rd ranked match | `account_age_days <= 7 AND ranked_match_count == 3` (transition into 3) AND `NOT iam_received_24h` | Session-counted ranked matches in this journey (resets at journey re-entry), IAM dedup | `account_age_days` (daily) | Fire-to-popup latency (<5s post-3rd-match); 24h pack purchase rate; uplift vs holdout on D7 ARPU; freq-cap collisions with CFM-13/14 |
| **COS-3** ⭐ · DJ Miya's Surprise Gift (9-tier step-up) | Convert F2P new users to first-payers via gated tier unlocks | Entry: `lifetime_spend_total == 0 AND account_age_days <= 14`. Tier 4: `purchased(tier_1)`. Tier 7: `purchased(tier_1) AND purchased(tier_4)` | Which tiers visible to this user (derived at render from purchased_pack_ids) | `lifetime_spend_total` (5min — shared), `purchased_pack_ids` set (**event-time** — shared with COS journeys), `account_age_days` (daily) | Tier-unlock latency (purchase → tier 4 visible <5s); tier funnel conversion; payment-failure-then-retry handling; F2P→payer rate vs holdout |

**Notes:**
- **COS-3** ⭐ is the cleanest example of a User Stage metric that *must* be event-time freshness because it's shared (other Cookie Run journeys also need `purchased_pack_ids`) AND payment must reflect within seconds. This is the residual "streaming substrate" requirement once Journey owns the live evaluation.

---

# Category 2 — Retention & Recall

| Campaign | Goal | Trigger conditions | Journey-internal state | User Stage metrics | Monitoring |
|---|---|---|---|---|---|
| **CFM-1** · Đảo Thiên Đường (Jun) | DAU through broad participation; convert clones to loyalists | `last_login_at >= today - 7d` | Minimal | `last_login_at` (hourly), RFM bucket (daily), `clone_signal` custom dim (daily) | Daily participation; clone→loyal RFM transition; reward-budget burn |
| **CFM-4** · Summer Festival (Jul) | Recall lapsed + retain actives via daily check-in + recall-code | Active: `last_login_at >= today - 1d`. Lapsed: `between today-15d AND today-7d` | Recall codes generated for this active player (per-user, capped), redemption chain | `last_login_at` (hourly), reachability flags (daily) | Recall conversion (sent→redeemed→returned); recall-fraud (one phone receiving N codes); D7 of recall-attributed vs organic returners |
| **CFM-8** · Cho Kẹo Hay Bị Ghẹo (Oct, Halloween) | DAU lift via novel theme | `last_login_at >= today - 14d` | Minimal | Baseline | Novelty-fatigue check vs CFM-1; reward-budget burn |
| **TF-2** · Sân Cỏ Thảnh Thơi (Jul, daily) | Build daily-login habit via mission loop | Daily login = entry. Streak gating: `completed_yesterday_missions == true` | Today's mission completion state (resets daily, per-journey) | `current_streak_days` (daily — shared if other campaigns reward streaks), `last_streak_break_at` (daily) | Daily completion rate (target band WoW); streak-break vs streak-recovery; per-mission drop-off |
| **TF-3** · Đại Chiến Bi Lắc (Aug, foosball) | Short-session DAU lift; encourage 2nd "real" match | `real_match_played_count_today >= 1` (bonus play); `won >= 1` (bonus ticket) | Today's minigame plays remaining, today's match counts (resets at server reset) | Baseline | Minigame plays per DAU; cannibalization check (real matches must NOT decrease); ticket-farming fraud |
| **TF-4** · Hành Trình Ông Bầu (Oct, board game) | Long-cycle retention via weekly board-game | Milestone: `lap_completion_count >= N` | Lap count, board position, dice rolls remaining today (per-journey) | Baseline | Weekly lap-completion rate; abandonment by lap; reward-tier unlock distribution |
| **COS-1** · King of Platter City (Jul, season start) | DAU + retention spike at S5; reward Power Players at 5 milestones | Power Player: `match_played_count_last_7d >= threshold`. Milestone reveal: `current_oven_crown >= milestone_value` | Which milestones unlocked for this user (cached) | `current_oven_crown` (**event-time** — shared with COS analytics, must be live), `match_played_count_last_7d` (hourly). **Blocked until COS Kafka onboarding** | Milestone unlock per tier; H5 read latency on rank score (<500ms); D14 retention of Power Player vs S1 baseline |
| **NTH-2** · Giang Hồ Xanh (Jun) | Light summer participation; landing UGC | `has_bound_uid == true` | Minimal | `has_bound_uid` (daily) | Daily entry rate; bound-UID conversion; chest-collection completion |
| **NTH-7** · UGC Hub Mùa Thu (Aug) | Consolidate UGC patterns into autumn creator hub | Universal-opt-in across 5 lanes | Per-lane participation flags for this campaign | Baseline | Per-lane participation; cross-lane multi-participants (NSM); spam/abuse flag rate |
| **NTH-8** · Non Sông Gấm Vóc 2/9 (Aug) | One-day national-day DAU spike | Universal-opt-in | Minimal | Baseline | Day-of participation; same-day re-login rate |
| **NTH-11** · Đêm Tuyết Tặng Lễ (Dec) | Light Christmas seasonal | Universal-opt-in | Minimal | Cross-year `seasonal_participation_tag` (daily) | Standard seasonal participation; reward-budget burn |
| **PT-2** · Hội: Dung Dăng Dung Dẻ (Jun) | DAU via social-promo; encourage friend play | Universal-opt-in; friend-graph for social mission | Today's friend-mission progress | `friend_count` (daily), `friend_session_overlap_count_today` (hourly — shared) | Mutual-online events per DAU; social-mission completion; invite-to-accept funnel |
| **PT-3** · Cừu mây mơ mộng (Jun) | DAU lift via new content | Universal-opt-in | Minimal | `novelty_content_engagement_tag` (daily) | First-week novelty curve; reward-budget burn |
| **PT-5** · Play B.I.N.G.O (Jul) | DAU via daily-cell-completion bingo | Cells complete via daily missions | Bingo card state (cell completion bitmap, lines completed) — per-journey ephemeral | Baseline | Daily cell-completion; line-completion distribution; abandonment by day-of-card |
| **PT-7** · Gian hàng nước ép Rụt Rè (Aug) | DAU via new shop experience | Universal-opt-in | Minimal | Baseline | Standard novelty engagement |

**Notes:**
- Most retention campaigns are **Journey-led** with very thin User Stage reads — the journey progress state, daily counters, and bingo cards live entirely inside Journey because no other campaign needs them.
- The exception worth flagging: `current_oven_crown` for COS-1 is shared (segment builders, leaderboards, analytics all need it) and must be event-time fresh, so it's a User Stage metric with stream-materialization required.

---

# Category 3 — Monetization

| Campaign | Goal | Trigger conditions | Journey-internal state | User Stage metrics | Monitoring |
|---|---|---|---|---|---|
| **CFM-2** · Voting Vũ Khí SS1 (Jun-Jul) | Drive returning-weapon purchases via voting drama and ownership FOMO | Personalized copy if `lifetime_owned_items ∩ candidate_weapons ≠ ∅` | Today's votes cast, invite chain | `lifetime_owned_items` set (daily — shared), custom dim "VotingSS1_Candidates" (daily) | Voting rate among ever-owned-candidate users (2-3x baseline); vote→purchase of winner; vote-spam / fake-invite signal |
| **CFM-7** · Tàu Điện Ngầm: Trạm 09 (Sep) | Drive event-pack purchase via must-buy gating | State A: pack-purchased. State B: not. A↔B propagates within seconds | `pack_purchased[campaign_id]` flag (per-journey; flips on payment) | Baseline | Pack purchase → CTA flip latency (<5s); H5 visit→buy conversion; daily-claim post-purchase; refund-revoke correctness |
| **CFM-9** · Hành Trình Tiêu Gem (Nov) | Drain gem inventory; tiered offers by current balance | Banding `[0,1k]`, `(1k,10k]`, `(10k,∞)` → different drop tables (Finding 3) | Tier-band resolved for this user (cached), reward draws | `current_gem_balance` (**event-time** — shared with PT-6/PT-10), tier_banding custom dim (daily) | Spend velocity per band; cross-band leak (critical); reward-budget cost by band; post-event balance drain |
| **CFM-16** · IAM "VIP Trial Expired" | Convert weapon-trial users at trial expiry | Event: `weapon_trial_expired`. Optional engagement filter `trial_kill_count >= threshold` | Trial-kill counts during trial period, IAM dedup | `active_trial_registry` (event-time — shared) | Fire-to-popup latency (<5s of expiry); 24h purchase rate; engagement-filter calibration |
| **CFM-17** · IAM "Killed By Promoted Weapon" | Trigger purchase intent on N kills by promoted weapon in-session | `count(killed_by ∈ promoted_list, current_session) >= N` | Session-scoped `killed_by_weapon_count[map]`, IAM dedup | `promoted_weapon_list` custom dim (daily) | Fire rate per promoted weapon (calibration); 24h purchase conversion; freq-cap collisions with CFM-13/14 |
| **CFM-18** · IAM "Low CF Coin + Promoted Item" | Catch contextual "want item but need coins" moment | `cf_coin_balance ∈ [x,y] AND promoted_item.is_active AND time_since_view < 30min` | Session-scoped `promoted_item_view_at[item_id]`, IAM dedup | `cf_coin_balance` (**event-time** — shared), `active_promoted_item_id` (5min — system-wide) | Trigger firings per promoted-item-view session; two-step funnel (IAM→top-up→purchase); refund-rate spike |
| **PT-4** · Quà tặng Ngài Thị Trưởng (Jul) | Drive recharge via featured bundle | Push-targeted by recharge tier | Minimal | `last_recharge_at` (hourly), `lifetime_recharge_total` (5min), `recharge_tier` derived (5min) | Bundle purchase by tier; cross-tier uplift; push delivery rate |
| **PT-6** ⭐ · Hành trình huyền thoại (Aug, segmented gem-burn) | Drain gems with **differentiated drop tables per segment** (canonical Finding 3) | Multi-segment binding. Segment A: NRU/F2P. Segment B: VIP/hoarders. **Mutually exclusive** | Resolved segment for this user (deterministic at journey entry), reward draws | `current_gem_balance` (**event-time**), `vip_tier` (event-time — shared), `lifetime_spend` (5min — shared), `account_age_days` (daily) | Drop-rate parity audit (Segment A higher pity?); cross-segment leak (critical); per-segment burn velocity; reward-budget by segment |
| **PT-8** · Cửa hàng may mắn (Sep) | Drive recharge via luck shop with daily rotation | Daily rotation per server reset | Today's lucky-shop purchases, today's rotation seed | Baseline | Daily spend per visiting user; rotation A/B uplift; refund/regret rate |
| **PT-10** · Đập trứng cùng Dillis (Nov) | Same as PT-6, November iteration | Same as PT-6 | Same as PT-6 | Same as PT-6 — *reuses the multi-segment payload + event-time gem balance infrastructure* | Same as PT-6 |

**Notes:**
- **PT-6** ⭐ is the canonical Finding 3 case — multi-segment payload branching is now framed as a **Journey engine concern** (resolve segment at journey entry, hold the resolved branch as journey-internal state, draw rewards from per-branch drop tables). The data store provides the metric values; Journey provides the deterministic resolution.
- The CFM IAM block (CFM-16/17/18) shows the typical Journey-led shape: most state is session-scoped journey-internal (kill counts, view recency), with a thin User Stage read for shared metrics that need event-time freshness (`cf_coin_balance`, `active_promoted_item_id`).

---

# Category 4 — Churn Prevention (in-session frustration mitigation)

*Smallest by count, but the cleanest test of the Journey-led model. Every campaign here is "Journey subscribes to events, holds session state, fires IAM" with almost no User Stage involvement.*

| Campaign | Goal | Trigger conditions | Journey-internal state | User Stage metrics | Monitoring |
|---|---|---|---|---|---|
| **CFM-13** ⭐ · IAM "Pass Stuck" (5 consecutive losses) | Save users mid-frustration before rage-quit | `consecutive_loss_count >= 5` evaluated on every match-end. Reset on win/session-end. NOT received in 24h | `consecutive_loss_count` (resets on win or session-end), `current_screen` (must be lobby), IAM dedup | `account_age_days` (daily, optional NRU filter) | Trigger fire rate vs expected (anomaly + kill-switch); next-session retention vs holdout (the actual save metric); IAM dismissal rate; refund-spike correlation |
| **CFM-14** · IAM "Rank Protection" (within 10 of demotion) | Save users from rank-3000-floor demotion | `current_rank_points - demotion_threshold <= 10 AND rank_tier < 3000` | Computed predicate evaluated on every rank-update event Journey subscribes to | `demotion_threshold[tier]` lookup table (daily, almost static). `current_rank_points` and `rank_tier` either Journey-internal (sub from rank events directly) OR User Stage event-time if shared | Fire rate by rank tier (skewed → game-balance signal); post-IAM next-match outcome; demotion-prevention rate vs holdout |
| **CFM-15** · IAM "Healthy Play" (60 min lobby) | Reward or redirect long lobby sessions | `current_session_duration_min >= 60 AND current_screen == 'lobby'`. NOT received in 24h | `current_session_start_at`, `current_screen`, screen-transition map, IAM dedup | None | Fire rate per DAU (target band); IAM action rate; session-end correlation (ending or extending sessions?) |

**Notes:**
- **CFM-13** ⭐ is the cleanest demonstration of the Journey-led model. "5 consecutive losses with reset" is a stateful streaming primitive — but if Journey owns it, it's Journey-internal state and User Stage doesn't need to know about it. **No stream-materialized User Stage metric required for this campaign.** The previously-flagged "streaming substrate gap" disappears here.
- **CFM-14** raises a real design choice: is `current_rank_points` shared (other rank-watching campaigns/segments need it → User Stage event-time) or campaign-local (Journey subscribes to rank events itself)? The decision rule: if 2+ campaigns or any analytics/segment needs it, User Stage. Otherwise Journey-internal. For 2026 calendar as written, only CFM-14 reads it — Journey-internal is fine.

---

# Category 5 — Social Ignition

| Campaign | Goal | Trigger conditions | Journey-internal state | User Stage metrics | Monitoring |
|---|---|---|---|---|---|
| **CFM-3** · Promote Hero: Wu Mengmeng (Jul) | Build emotional bond via storytelling with personalized lifetime-stat copy | Three time-of-day windows (07-12, 15-18, 20-24); copy interpolates `lifetime_X_count` | Daily-window check-in state, story progress | `lifetime_headshot_count`, `lifetime_match_count`, `lifetime_kill_count`, `lifetime_revive_count` (all daily — shared via Asset Library across CFM-3/6/10) | Per-window participation; copy-rendering audit; story-completion funnel; share rate |
| **CFM-5** · Nấu lẩu / Monthly (Jul-Aug, recurring) | Monthly guild participation; cross-wave retention is success metric | `last_login >= today - 1d AND guild_id IS NOT NULL`. Wave-N targets wave-(N-1) participants OR absentees | Current-wave participation flag (per-journey) | `guild_id` (hourly — shared), `guild_member_count` (daily), **wave-1 participants Past Segment** (hourly — needs cohort carryover support) | Wave-over-wave participation (retention curve); guild-pool achievement distribution; guild-leaving spike around rewards (loophole signal) |
| **CFM-6** · Tài Năng Của Lan Xi'er (Jul-Aug) | Storytelling — same as CFM-3 | Same as CFM-3 | Same | Same lifetime-stat set — *reuses CFM-3 personalization payload* | Same as CFM-3 |
| **CFM-10** · Concert Heartshot Girl Group (Dec) | Storytelling + competitive leaderboard (Top 10 get title) | Top-N: rank-based segment by `total_concert_score` at close | Story progress | Lifetime-stat set (CFM-3 reuse, daily); `total_concert_score` (5min — shared with leaderboard); final leaderboard snapshot at close | Leaderboard top-N anti-fraud; refresh latency (top-100 visible real-time); per-rank engagement |
| **NTH-1** · Cục Dân Chính Giang Hồ (May) | Pull short-film UGC to social | Universal-opt-in for bound-UID | Minimal | `has_bound_uid` (daily); post-event `lifetime_ugc_submissions` tag | Submission volume; off-platform reach; content-moderation flag rate; creator vs viewer cohort retention |
| **NTH-3** · Danh Viên Bình Tuyển (Jun, housing UGC) | Activate housing-engaged players | `count(housing_module_interactions, last_30d) > 0` | Minimal | `housing_interaction_count_30d` (hourly), `lifetime_housing_items_owned_count` (daily), custom dim "HousingItems" (daily) | Eligible-population sanity; submission rate among eligible; UGC quality moderation |
| **NTH-4** · Giang Hồ Vạn Ảnh (Jul, short-film) | Kick off creator ecosystem with quality-graded films | Universal-opt-in (creators + voters self-select) | Minimal | Post-event Past Segments (creator quality-tier tag) | Submission count; voter participation; vote-spam signal; off-platform spillover |
| **NTH-5** · Nhà Thiết Kế Thời Trang (Jul, fashion + couples) | Activate fashion/social engagement; couples is a new social hook | Couples flag: `partner_uid IS NOT NULL` | Couples-participation flag for this campaign | `partner_uid` (hourly — shared, needs social-graph service) | Couples participation; partner-uid validity (no fake-couple farming); content-moderation flags |
| **NTH-6** ⭐ · ROAD TO INGAME CONCERT TICKET (Jul, 200 VIP / 600 standard) | Multi-week pre-heat with FOMO via 7-fragment collection mechanic | Multi-state per-user; final qualification: all 7 fragments. Slot allocation at close: top-200 by votes → VIP, 201-800 → standard | `fragments_owned_bitmap` (7-bit, per-journey), per-fragment last-update-at, inventory counters, slot-allocation cache | `total_vote_score` (5min — shared with leaderboard analytics), `anti_fraud_trust_score` (event-time-ish — external via adapter) | Per-fragment collection rate (uneven = tuning); inventory burn (200/600 hard caps; self-stop on depletion); leaderboard freshness; fraud-flag rate; allocation correctness audit |
| **COS-2** · Welcome to The Cookie Show (Jul-Aug, UGC) | Pull UGC from Casual Player segment | Casual = `active_recently AND NOT high_match_volume AND NOT high_rank_velocity` | Minimal | `match_played_count_last_7d` (hourly), `rank_change_velocity` (hourly) | Casual segment population sanity; UGC submission rate; off-platform engagement; creator-partner discovery funnel |
| **PT-9** · Survey: Chọn lựa (Oct, IAM survey) | Collect insight via in-context survey at high-engagement moments | `count(shop_click, today) IN [3, 6, 9]` (transition into 3rd/6th/9th). Per-user-per-question dedup. Player-tier variant | Today's shop-click count (per-journey), today's questions seen (dedup), survey responses cache | `player_tier` (daily). **Survey responses must flow back as queryable User Stage attributes** (closed loop) | Survey response rate; response distribution sanity; per-question dedup integrity; downstream segment-from-survey usage |
| **PT-12** · Trúc Xanh (Dec, mini-game social) | End-of-year social mini-game | Universal-opt-in | Minimal | Baseline | Standard participation; reward-budget burn |

**Notes:**
- **NTH-6** ⭐ remains the most architecturally complex campaign, but the simplification still helps: `fragments_owned_bitmap` is purely Journey-internal (no other campaign needs this 7-bit pattern), only the *shared* metrics (`total_vote_score` for leaderboard, trust score for fraud) are User Stage. The mechanism Journey must support: a complex per-journey state machine + an external signal adapter feeding User Stage + rank-based selection at close.
- **Lifetime-stat interpolation** (CFM-3/6/10, NTH-10, PT-11) is the textbook example of *correctly-shared* User Stage metrics: they're daily-grain (no event-time freshness needed), used by 5+ campaigns, and live in the Asset Library's payload-resolution path.

---

# Category 6 — Contribution Tiering (year-end recognition)

| Campaign | Goal | Trigger conditions | Journey-internal state | User Stage metrics | Monitoring |
|---|---|---|---|---|---|
| **CFM-11** ⭐ · Lễ Hội Cuối Năm / Mừng Sinh Nhật CFL (Dec) | Year-end lookback + tiered rewards by full-year contribution | Annual RFM with custom-dim tiers — Veteran/Active/Casual/New-this-year. Multi-segment binding (Finding 3) | Resolved tier for this user (cached at journey entry, deterministic) | Annual aggregations (daily): `login_days_2026`, `rank_achievements_2026`, `gem_spend_2026`, `match_count_2026`, `hours_played_2026`. Tier-membership derived dim (daily) | Tier-distribution sanity; reward-cost reconciliation per tier; participation rate per tier; next-year D7 by tier (lookback ROI); cross-tier leakage audit |
| **NTH-9** ⭐ · 20/10 Hồng Nhan Tri Ân (Oct, gendered) | Vietnamese Women's Day; differentiated by character gender + Mộng Hoa Lục leaderboard | Hard split on `character.gender`. Mutually-exclusive segment binding. Female-leaderboard uses external popularity score | Resolved branch (gendered, deterministic), gender-specific chest cooldown state | `character.gender` (daily — Role Info endpoint), `mong_hoa_luc_popularity_score` (5min — External Signal Adapter) | Gender-resolution determinism (no user resolves to both branches); reward-weighting parity (female slightly higher per spec); external-signal freshness on Mộng Hoa Lục; leaderboard accuracy |
| **NTH-10** · Giang Hồ Nhất Niên Ký (Nov, anniversary yearbook) | Personalized year-in-review by **dominant playstyle** (fisherman/designer/fighter) | Yearbook variant by dominant playstyle | Yearbook-variant resolution cache | `dominant_playstyle_tag` (daily — derived), playstyle taxonomy custom dim (daily), annual aggregations per playstyle dimension (daily), confidence score per tag (daily) | Tag-distribution sanity (one tag dominating = taxonomy needs rework); confidence-threshold calibration; yearbook-share rate (off-platform NSM) |
| **PT-1** · Kỷ niệm hành trình chơi cùng nhau (Jun, anniversary) | Celebrate user account anniversary | `MM-DD(today) == MM-DD(account_first_login_at) AND lifetime_login_days > 7` | IAM dedup for this campaign | `account_first_login_mmdd` precomputed dim (daily), `lifetime_login_days` (daily) | Daily fire-count distribution (~1/365 of actives — sanity); anniversary-IAM action rate; first-login date accuracy audit |
| **PT-11** · KAIA Year-End Wrap-Up (Dec) | Year-end summary with personalized lookback (Spotify-Wrapped) | Same as NTH-10. Adds NRU variant | Yearbook-variant resolution cache | Same as NTH-10 — *reuses playstyle-taxonomy infrastructure* | Same as NTH-10 + NRU-variant share rate |

**Notes:**
- **CFM-11** ⭐ tests whether User Stage supports **annual aggregation windows** with year-rollover semantics. Today's GDS revamp `time_grain` enum is `realtime / 5min / 1hour / 1day` — annual is implementable on top of `1day` aggregations but needs explicit rollover support.
- **NTH-9** ⭐ is the load-bearing example for the **External Signal Adapter** as a first-class component. Mộng Hoa Lục popularity originates outside Kafka; without the adapter as a User Stage write path, every external signal becomes a bespoke integration.
- **NTH-10 + PT-11** prove the playstyle-taxonomy pattern is cross-game. Build the taxonomy as shared custom-dim set, not per-game.

---

# Part B — Consolidated platform requirements

The per-campaign tables generate a small number of recurring platform requirements. With Journey engine framing them, the requirements split cleanly between *Journey engine concerns* and *User Stage data-store concerns*.

## B1 — What lives where (the only design decision per metric)

The simplification: every piece of state in the calendar resolves to one of three locations.

| Location | What lives here | Rule of thumb |
|---|---|---|
| **Journey engine internal state** | Session-scoped counters, journey progress, per-campaign dedup, complex per-journey state machines (NTH-6 fragments), resolved-segment caching, in-flight ephemeral computation | Only this one campaign cares about it. Derived from events Journey already subscribes to. |
| **User Stage** (offline + online KV) | Shared metrics — identity, lifetime aggregates, current economy state, ownership history, RFM, segments, custom dimensions, external signals | 2+ campaigns / segments / analytics need this exact value. Persisted. Recomputable from Behavior. |
| **Promotion service** | Reward inventory, grant state, refund-revoke. Reward Engine in our system is the contract layer that calls Promotion | Out of scope of this document. Already exists. |

The test for whether something is User Stage vs Journey-internal: *"would another campaign want to read this exact value?"* If yes, User Stage. If no, Journey-internal.

## B2 — User Stage feature classes (with required `time_grain`)

Classified by access pattern and freshness need. The `time_grain` column is the per-metric architecture decision — `event-time` is the only one that requires stream-materialization beyond Trino batch.

| Feature class | Examples | Used by | `time_grain` |
|---|---|---|---|
| **Identity & profile** | `country`, `lang`, `is_reachable_push`, `has_bound_uid`, `character.gender` | All baseline + NTH-9 | daily |
| **Account-age & login recency** | `account_age_days`, `last_login_at`, `last_login_before_session_at`, `account_first_login_mmdd` | NRU + Retention (~20 campaigns) | daily / hourly |
| **Lifetime aggregations** | `lifetime_login_days`, `lifetime_headshot_count`, `lifetime_match_count`, `lifetime_kill_count`, `lifetime_recharge_total`, `lifetime_owned_items` set | CFM-3/6/10/11, NTH-10, PT-1/11, CFM-2 | daily |
| **Annual aggregations** | `login_days_2026`, `gem_spend_2026`, `match_count_2026` (custom-window) | CFM-11, NTH-10, PT-11 | daily *(with year-rollover semantics — gap)* |
| **Recharge & spend state** | `last_recharge_at`, `lifetime_spend_total`, `recharge_tier`, `vip_tier` | PT-4/6/8/10, COS-3, CFM-9 | 5min / **event-time** for VIP-flip-sensitive |
| **Economy state (live)** | `current_gem_balance`, `cf_coin_balance`, `current_oven_crown`, `current_rank_points` | CFM-9/14/16/18, COS-1, PT-6/10 | **event-time** (the residual streaming-substrate need) |
| **Ownership history** | `purchased_pack_ids` set, `lifetime_owned_items` set | CFM-2, COS-3 | **event-time** for COS-3 (must reflect within seconds); daily for CFM-2 |
| **Engagement counters** | `housing_interaction_count_30d`, `match_played_count_last_7d`, `rank_change_velocity`, `friend_session_overlap_count_today` | NTH-3, COS-1/2, PT-2 | hourly |
| **Streaks & habits** | `current_streak_days`, `last_streak_break_at` | TF-2 | daily |
| **Custom dimensions** | weapon_lists, promoted_items, housing_items, voting_candidates, playstyle taxonomy, contribution tiers | CFM-2/9/11/17/18, NTH-3/10, PT-11 | daily (rarely change) |
| **Segments & RFM** | RFM bucket, clone_signal, dominant_playstyle_tag, Casual/Power Player flags | CFM-1, NTH-10, COS-1/2, PT-11 | daily |
| **External signals** | `mong_hoa_luc_popularity_score`, `anti_fraud_trust_score`, `cs_ticket_count` | NTH-6/9 | 5min / event-time *(via External Signal Adapter)* |
| **Closed-loop attributes** | Survey responses → segment criterion; recall-code-attributed returns; UGC-creator status | PT-9 + future feedback | per-event (write at action completion) |
| **Cross-wave cohort carryover** | "Wave-1 participants" as Past Segment input | CFM-5, all post-event retros | per-wave |
| **Relational/graph attributes** | `partner_uid`, `guild_id`, `friend_count` | NTH-5, CFM-5, PT-2 | hourly *(via graph service)* |

**Distribution by `time_grain`:**

- **Daily:** ~70% of metrics. Trino batch over Iceberg, written to KV mirror after computation. The bulk of the calendar.
- **Hourly / 5min:** ~20%. Trino micro-batch, same path.
- **Event-time:** ~10%. **Stream-materialized** to both Iceberg and KV mirror. This is the *residual streaming requirement* once Journey owns predicate evaluation — much smaller than "the streaming substrate" was before. The list: `current_gem_balance`, `cf_coin_balance`, `current_oven_crown`, `vip_tier`, `purchased_pack_ids` (for COS journeys), `active_trial_registry`, plus External Signal Adapter outputs.

## B3 — The online KV mirror as architected component

This stays the load-bearing data-layer gap. Same seven contracts as before:

1. **Schema parity from the registry.** Mirror layout derived from `state_metric_definitions`. New metric → both materializations get plans automatically.
2. **Per-metric freshness SLA.** `current_gem_balance` < 1min staleness; `lifetime_login_days` < 1 day. Staleness alarms per feature.
3. **Bootstrap semantics on cold start.** New feature goes live → either materialize from offline once, or expose explicit `valid_from` timestamp.
4. **Missing-value semantics.** `GET (user, metric)` for users with no value: null vs 0 vs key-not-found. Contract decision.
5. **Atomic multi-feature read** (`HMGET (user, [metric_ids])`). Journey evaluates 5-predicate segments in one round-trip.
6. **Drift monitoring.** Periodic sample reads, recompute via Trino, alarm on divergence > X%.
7. **Eviction / cold-tier policy.** Inactive 90+ days → cold tier? Cost calculation matters at 5-game scale.

The KV mirror is what Journey reads at decision time. Without it as a real architected component, every Journey predicate evaluation goes through Trino — page loads collapse, throughput collapses, the whole approach collapses.

## B4 — Journey engine requirements

Once Journey is the live-event substrate, what it must do:

- **Subscribe to per-game Kafka topics** with the bandwidth target: 5 B events/day/game (per the GDS revamp paper figure).
- **Per-user-per-journey state store** — RocksDB-class, durable across restarts, recoverable, bounded by active-journey count not user count.
- **Stateful predicate primitives** as journey building blocks: consecutive-count-with-reset, session-scoped counters, first-time-of-X capture, time-since-event, derived/computed attributes, MM-DD calendar predicates.
- **User Stage online KV reads** at decision time, with the multi-feature `HMGET` contract above. Latency budget <50ms per decision.
- **Action emission to channels** — IAM, Push, SMS, Webshop, Pay Hub, Player Hub, Level Up, Club. Plus Reward Engine → Promotion.
- **Per-user activation clocks** — 14-day-from-segment-entry (TF-1), 3-daily-windows (CFM-3), per-wave (CFM-5).
- **Multi-segment payload branching** — bind multiple segments to one journey with deterministic mutually-exclusive resolution. Finding 3 hard requirement.
- **Frequency capping** — per-user IAM dedup, cross-campaign caps, priority rules. CFM has 7 simultaneous IAM journeys; without caps, frustrated player triggering CFM-13/14/17 in 5s gets 3 popups.
- **Kill-switches and real-time monitoring** on every Journey-led campaign that grants rewards or fires IAMs.
- **Journey templates** ("Combo Wombo") for the patterns that recur — onboarding, login-cadence, retargeting, win-back, anniversary, lifetime-stat-storytelling.

## B5 — Tool layer requirements (Campaign Hub)

- **Calendar & scheduling** with per-user activation clocks. Replaces the Excel sheet.
- **Segment Builder v2** — stateful predicates, computed/derived attributes, all-time aggregation windows, Custom Dimensions, MM-DD calendar predicates.
- **Journey Builder v2** — session-scoped counters, first-time-of-X, multiple triggers per journey, journey templates, per-journey performance.
- **Asset & Content Library** — versioned creative, copy, IAM templates, reward bundles, payload schemas. Powers lifetime-stat interpolation, gendered branches, segment-tiered drops.
- **Custom Dimensions service** — weapon lists, promoted items, housing items, playstyle taxonomy, contribution tiers, voting candidates.
- **Permissions & multi-tenancy** — per-game isolation.
- **Approvals & audit** — workflow sign-off on reward grants, pricing, VIP eligibility. Audit log with rollback.
- **Cross-campaign conflict resolution** — priority/exclusion + mutually-exclusive segment evaluation for Finding 3 campaigns.
- **External Signal Adapter** — Mộng Hoa Lục, CS flags, anti-fraud, 3rd-party identity. Feeds User Stage.

## B6 — Monitoring rollup

| Concern | Signals | Driven by |
|---|---|---|
| **Trigger health** | Fire rate vs expected, anomaly alerts, kill-switch state, predicate-eval latency p99 | Journey-led campaigns (~12) |
| **User Stage online↔offline parity** | Per-metric KV value vs batch-recomputed Trino value, alarm on divergence > X% | All event-time and 5min-grain User Stage metrics |
| **User Stage freshness** | Per-metric staleness alarm based on configured `time_grain` SLA | All User Stage metrics |
| **Funnel performance** | Impression → click → conversion → reward → retention, by segment | All 47 |
| **Reward integrity** | Promotion grant-success, refund-revoke correctness, inventory burn, budget vs budget | All reward-granting (~30 of 47) |
| **Frequency cap collisions** | Cross-campaign user-collision count, near-cap-hit rate | All IAM (7+) |
| **Segment-resolution determinism** | Multi-segment branch-assignment audit | NTH-9, PT-6/10, CFM-11 |
| **Uplift vs holdout** | Treatment-vs-control on retention, ARPU, engagement | All measured |
| **Anti-fraud** | Vote spam, fake invites, share abuse, recall-code farming | NTH-6, CFM-4, NTH-4, leaderboards |
| **External-signal freshness** | Mộng Hoa Lục age-of-data, CS feed age, fraud-score age | NTH-6, NTH-9 |
| **Channel delivery** | IAM render rate, push/SMS delivery, channel-failure escalation | All |
| **Personalization correctness** | Lifetime-stat interpolation audit, playstyle-tag confidence, copy-render spotcheck | CFM-3/6/10, NTH-10, PT-11 |
| **Outcome-loop integrity** | Reward-grant event written back to Behavior records within SLA | Every reward-granting campaign |

---

# Part C — Cross-cutting patterns

Six patterns recur across enough campaigns to be platform capabilities — most map cleanly to Journey or User Stage, not both.

**Pattern 1 — Lifetime-stat interpolation as personalization payload.** *User Stage concern.* Daily-grain lifetime aggregations + Asset Library render-time interpolation. Build once, reuse everywhere. CFM-3/6/10, NTH-10, PT-11.

**Pattern 2 — Multi-segment, mutually-exclusive payload branching.** *Journey engine concern.* NTH-9, PT-6/10, CFM-11, CFM-9. Journey resolves segment at journey entry deterministically; holds resolved branch as journey-internal; draws from per-branch payloads in Asset Library.

**Pattern 3 — Sub-second event-time triggers.** *Journey engine concern, almost entirely.* CFM-12 through CFM-18, PT-9, parts of COS-3. Journey subscribes to events directly, holds session-scoped state, fires actions. The previously-flagged "streaming substrate" gap collapses to a small set of *shared* metrics that need event-time User Stage materialization.

**Pattern 4 — Per-user activation clock starting at segment entry.** *Journey engine concern.* TF-1 (14 days), CFM-3 (daily windows), CFM-5 (multi-wave), seasonal anniversaries.

**Pattern 5 — Closed-loop attribute creation.** *Both — Journey produces, User Stage stores.* PT-9 surveys → User Stage attributes; recall-code-attributed returns; UGC-creator status. Journey emits the event; the Outcome Loop writes it as a User Stage metric for downstream campaigns.

**Pattern 6 — External-signal ingestion.** *User Stage concern via Adapter.* Mộng Hoa Lục, CS flags, anti-fraud, 3rd-party identity. External Signal Adapter normalizes into User Stage namespace.

---

# Part D — Sequencing implication

Mapping the 47 campaigns to deadlines through the Journey-led lens:

- **15 May 2026 IAM rollout:** CFM-12 through CFM-18, TF-1, COS-1.
  Needs: **Journey engine MVP** (live event subscription, per-user state, predicate evaluation, action emission, frequency capping, kill-switches) + **User Stage online KV mirror** (the seven contracts) + Reward Engine contract to Promotion.
  *The streaming-substrate gap reframes to: User Stage event-time materialization for `current_oven_crown` (COS-1) and IAM-dedup state. Much smaller scope.*

- **Q3 (Jul–Sep):** NTH-6 concert, PT-6 gem-burn, TF-1 per-user clock, COS-3 step-up.
  Needs: External Signal Adapter (NTH-6), multi-segment payload branching in Journey (PT-6/10), event-time materialization for `purchased_pack_ids` (COS-3), inventory tracking with hard-stop semantics (NTH-6).

- **Q4 (Oct–Dec):** NTH-9 (gendered + Mộng Hoa Lục), CFM-11 (annual aggregation), NTH-10 + PT-11 (playstyle taxonomy as cross-game shared).
  Needs: Annual `time_grain` with year-rollover semantics, playstyle taxonomy as cross-game custom dim, External Signal Adapter (Mộng Hoa Lục).

The User Stage registry is on the critical path for *all of the above*. The four data-layer gaps from the prior version collapse to two:

1. **Online KV mirror as architected component** (the seven contracts). Unblocks every campaign that reads User Stage at Journey decision time.
2. **Event-time materialization path for the ~10% of metrics that need it.** Smaller scope than "the streaming substrate" — it's just a stream-processor writing to User Stage's online and offline materializations for a specific list of shared metrics that need it.

Plus one Tool/Engine layer gap that isn't data-store:

3. **Journey engine itself as a real implementation** — predicate primitives, state store, action emission, frequency capping, kill-switches, multi-segment payload branching, per-user activation clocks. This is the implicit assumption underlying everything above; if it doesn't exist, the framing collapses and we're back to four archetypes plus a streaming substrate.

---

*Document end. 47 campaigns mapped to 6 categories. Two read paths (Journey-internal state, User Stage shared read with per-metric `time_grain`). Two residual data-layer gaps (online KV mirror, event-time materialization for ~10% of metrics) plus the Journey engine as the load-bearing engine assumption.*
