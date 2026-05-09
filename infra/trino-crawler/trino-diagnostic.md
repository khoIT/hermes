# Trino Reachability Diagnostic

| Field | Value |
|---|---|
| Generated | 2026-05-09T14:02:12.340Z |
| Host | gio-gds-trino.vnggames.net:8080 |
| Catalog | iceberg |
| Schema | cfm_vn |
| Tables reachable | 7 / 7 |

## Per-table probe (last-7d row count)

| Table | OK | Latency (ms) | Rows last 7d | Error |
|---|---|---|---|---|
| `etl_login` | ✓ | 24954 | 4,661,782 | — |
| `etl_logout` | ✓ | 33588 | 4,663,408 | — |
| `etl_game_detail` | ✓ | 5957 | 12,881,188 | — |
| `etl_recharge` | ✓ | 16863 | 48,355 | — |
| `etl_moneyflow` | ✓ | 12580 | 47,057,683 | — |
| `etl_appsflyer_installs_datalocker` | ✓ | 26290 | 68,179 | — |
| `std_master_user_profile` | ✓ | 19392 | 437,072 | — |

> **All tables reachable.** Phase 02 (7d real pull) can proceed.