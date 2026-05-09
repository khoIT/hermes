# Trino Schema Audit — STUB (VPN down)

> **Status:** VPN not connected — Trino unreachable.
> Rerun `pnpm refresh-cfm-data --schema-only` after connecting VPN.

| Field | Value |
|---|---|
| Generated | 2026-05-09T09:22:41.087Z |
| Attempted host | gio-gds-trino.vnggames.net:8080 |
| Catalog | iceberg |
| Expected schema | cfm_vn |
| Failure reason | [trino] Access Denied: Cannot show schemas: iceberg
SQL: SHOW SCHEMAS FROM iceberg |

## Expected Tables (from trino-mock bedrock)

These tables are confirmed to exist in the trino-mock JSONL bedrock
and are expected to be present in `iceberg.cfm_vn` once VPN is connected:

| Table | Notes |
|---|---|
| `etl_login` | Session start events |
| `etl_logout` | Session end + online time |
| `etl_game_detail` | Per-match stats (kills, ladder score, game result) |
| `etl_moneyflow` | In-game currency flow (balance deltas) |
| `etl_recharge` | Real-money purchase events |
| `etl_new_register` | New user registration events |
| `etl_appsflyer_installs_datalocker` | AppsFlyer install attribution |
| `etl_match_net_work_stats` | Per-match network quality |
| `std_master_user_profile` | Unified user profile (install_time, first/last login, total_rev) |

## Next Steps

1. Connect VPN to reach `gio-gds-trino.vnggames.net`
2. Run: `pnpm refresh-cfm-data --schema-only`
3. This stub file will be overwritten with the real audit.