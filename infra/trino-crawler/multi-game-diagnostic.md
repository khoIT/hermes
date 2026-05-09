# Multi-Game Trino Reachability Diagnostic

Generated: 2026-05-09T15:32:24.068Z  ·  Host: gio-gds-trino.vnggames.net:8080  ·  Catalog: iceberg

## Summary

| Game schema | Tables reachable | Status |
|---|---|---|
| `cfm_vn` | 7 / 7 | ✓ all reachable |
| `ptg_vn` | 0 / 7 | ✗ all blocked |
| `nth_vn` | 0 / 7 | ✗ all blocked |
| `tf_vn` | 0 / 7 | ✗ all blocked |
| `cos_vn` | 0 / 7 | ✗ all blocked |

## `cfm_vn`

| Table | OK | Rows last 7d | Latency | Error |
|---|---|---|---|---|
| `etl_login` | ✓ | 4,661,782 | 430ms | — |
| `etl_logout` | ✓ | 4,663,408 | 200ms | — |
| `etl_game_detail` | ✓ | 12,881,188 | 213ms | — |
| `etl_recharge` | ✓ | 48,355 | 159ms | — |
| `etl_moneyflow` | ✓ | 47,057,683 | 340ms | — |
| `etl_appsflyer_installs_datalocker` | ✓ | 68,179 | 267ms | — |
| `std_master_user_profile` | ✓ | 437,072 | 284ms | — |

## `ptg_vn`

| Table | OK | Rows last 7d | Latency | Error |
|---|---|---|---|---|
| `etl_login` | ✗ | — | 79ms | [trino] line 1:27: Schema 'ptg_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.ptg_vn.etl_login WHERE dteventt |
| `etl_logout` | ✗ | — | 155ms | [trino] line 1:27: Schema 'ptg_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.ptg_vn.etl_logout WHERE dtevent |
| `etl_game_detail` | ✗ | — | 78ms | [trino] line 1:27: Schema 'ptg_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.ptg_vn.etl_game_detail WHERE dt |
| `etl_recharge` | ✗ | — | 76ms | [trino] line 1:27: Schema 'ptg_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.ptg_vn.etl_recharge WHERE dteve |
| `etl_moneyflow` | ✗ | — | 93ms | [trino] line 1:27: Schema 'ptg_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.ptg_vn.etl_moneyflow WHERE dtev |
| `etl_appsflyer_installs_datalocker` | ✗ | — | 81ms | [trino] line 1:27: Schema 'ptg_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.ptg_vn.etl_appsflyer_installs_d |
| `std_master_user_profile` | ✗ | — | 79ms | [trino] line 1:27: Schema 'ptg_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.ptg_vn.std_master_user_profile  |

## `nth_vn`

| Table | OK | Rows last 7d | Latency | Error |
|---|---|---|---|---|
| `etl_login` | ✗ | — | 78ms | [trino] line 1:27: Schema 'nth_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.nth_vn.etl_login WHERE dteventt |
| `etl_logout` | ✗ | — | 158ms | [trino] line 1:27: Schema 'nth_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.nth_vn.etl_logout WHERE dtevent |
| `etl_game_detail` | ✗ | — | 87ms | [trino] line 1:27: Schema 'nth_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.nth_vn.etl_game_detail WHERE dt |
| `etl_recharge` | ✗ | — | 73ms | [trino] line 1:27: Schema 'nth_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.nth_vn.etl_recharge WHERE dteve |
| `etl_moneyflow` | ✗ | — | 76ms | [trino] line 1:27: Schema 'nth_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.nth_vn.etl_moneyflow WHERE dtev |
| `etl_appsflyer_installs_datalocker` | ✗ | — | 76ms | [trino] line 1:27: Schema 'nth_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.nth_vn.etl_appsflyer_installs_d |
| `std_master_user_profile` | ✗ | — | 74ms | [trino] line 1:27: Schema 'nth_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.nth_vn.std_master_user_profile  |

## `tf_vn`

| Table | OK | Rows last 7d | Latency | Error |
|---|---|---|---|---|
| `etl_login` | ✗ | — | 79ms | [trino] line 1:27: Table 'iceberg.tf_vn.etl_login' does not exist
SQL: SELECT count(*) AS c FROM iceberg.tf_vn.etl_login |
| `etl_logout` | ✗ | — | 73ms | [trino] line 1:27: Table 'iceberg.tf_vn.etl_logout' does not exist
SQL: SELECT count(*) AS c FROM iceberg.tf_vn.etl_logo |
| `etl_game_detail` | ✗ | — | 78ms | [trino] line 1:27: Table 'iceberg.tf_vn.etl_game_detail' does not exist
SQL: SELECT count(*) AS c FROM iceberg.tf_vn.etl |
| `etl_recharge` | ✗ | — | 76ms | [trino] line 1:27: Table 'iceberg.tf_vn.etl_recharge' does not exist
SQL: SELECT count(*) AS c FROM iceberg.tf_vn.etl_re |
| `etl_moneyflow` | ✗ | — | 75ms | [trino] line 1:27: Table 'iceberg.tf_vn.etl_moneyflow' does not exist
SQL: SELECT count(*) AS c FROM iceberg.tf_vn.etl_m |
| `etl_appsflyer_installs_datalocker` | ✗ | — | 76ms | [trino] line 1:27: Table 'iceberg.tf_vn.etl_appsflyer_installs_datalocker' does not exist
SQL: SELECT count(*) AS c FROM |
| `std_master_user_profile` | ✗ | — | 76ms | [trino] line 1:27: Table 'iceberg.tf_vn.std_master_user_profile' does not exist
SQL: SELECT count(*) AS c FROM iceberg.t |

## `cos_vn`

| Table | OK | Rows last 7d | Latency | Error |
|---|---|---|---|---|
| `etl_login` | ✗ | — | 76ms | [trino] line 1:27: Schema 'cos_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.cos_vn.etl_login WHERE dteventt |
| `etl_logout` | ✗ | — | 101ms | [trino] line 1:27: Schema 'cos_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.cos_vn.etl_logout WHERE dtevent |
| `etl_game_detail` | ✗ | — | 80ms | [trino] line 1:27: Schema 'cos_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.cos_vn.etl_game_detail WHERE dt |
| `etl_recharge` | ✗ | — | 79ms | [trino] line 1:27: Schema 'cos_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.cos_vn.etl_recharge WHERE dteve |
| `etl_moneyflow` | ✗ | — | 76ms | [trino] line 1:27: Schema 'cos_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.cos_vn.etl_moneyflow WHERE dtev |
| `etl_appsflyer_installs_datalocker` | ✗ | — | 77ms | [trino] line 1:27: Schema 'cos_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.cos_vn.etl_appsflyer_installs_d |
| `std_master_user_profile` | ✗ | — | 74ms | [trino] line 1:27: Schema 'cos_vn' does not exist
SQL: SELECT count(*) AS c FROM iceberg.cos_vn.std_master_user_profile  |

## Phase 02 scope decision

- **Fully reachable:** `cfm_vn` → wire into Phase 02 multi-game crawler.
- **Blocked:** `ptg_vn`, `nth_vn`, `tf_vn`, `cos_vn` → keep on synth path entirely.