# Demo Known Limitations & Deferred Features

**Phase 10 validation scope:** Full 13-step demo flow running against `pnpm build` output (production bundle). Validation date: 2026-05-09.

---

## Critical Limitations (Architectural)

### 1. Trino Authentication Blocked — Synthetic Fixtures Used

**Impact:** Crawler cannot fetch real cfm_vn data. Feature and segment predicates are synthesised.

**Mitigation:**
- All 73 features sourced from `infra/trino-crawler/fixtures/` (5 JSON files, 509 KB total)
- 67 features from real cfm_vn schema snapshot; 6 synthetic additions (e.g., `event_match_end`, `is_paying_user_lifetime`)
- Demo uses hardcoded synthetic segment + campaign IDs that reference synthetic feature sets
- **Not a blocker for demo:** Real Trino migration happens post-launch (out of P-12 scope)

**How to verify:** Read `infra/trino-crawler/fixtures/features.json` — all features have `source: "cfm_vn"` or `source: "synthetic"` annotation.

---

### 2. Catalog API Drizzle Schema → Hermes Data Model Mismatch

**Impact:** `catalog-api` migrations use Bedrock-flavoured Drizzle schemas (PostgreSQL). Hermes doesn't have a prod database; only mock JSON fixtures.

**Mitigation:**
- Catalog API boots successfully on localhost (tested P-12)
- Health check returns 200
- Real migration to Hermes schema deferred to post-launch
- **Not a blocker for demo:** All web UI data flows from fixtures, not catalog-api queries

---

### 3. Catalog API Dist Path Divergence

**Impact:** NestJS build outputs to `dist/src/main.js` instead of idiomatic `dist/main.js`.

**Mitigation:**
- Boot script updated: `node dist/src/main.js` works
- No impact on demo (web app doesn't call catalog-api in this validation)
- Cosmetic issue, fixable in prod if needed

---

## Known Deferred Features

### 4. Campaign Canvas `?from=draft-` Pre-population

**Impact:** Step 12 opens segment canvas with `?from=draft-...` query; deeper wiring (pre-populating trigger type, predicate blocks) deferred.

**Current state:**
- Canvas opens (HTTP 200)
- Banner "Editing from draft" renders
- Agent attribution line conditionally shown
- Trigger type and predicate blocks do NOT auto-populate from draft

**Workaround:** Manual re-selection of trigger type + predicate (user experience impact; noted in P-8 report).

**Fix:** P-13+ can wire `draftId` → fetch draft JSON from fixture → populate canvas blocks. Deferred due to time constraints.

---

### 5. Inline Segment Creation from AudienceBlock

**Impact:** Campaign canvas AudienceBlock "Create inline segment" → mints synthetic SegmentID with hardcoded reach.

**Current state:**
- Synthetic ID: `seg-inline-{timestamp}`
- Reach: hardcoded to 15,000 users (not dynamically calculated from predicate)
- Segment not persisted (local state only)

**Limitation:** Does not reflect real predicate cardinality. For demo purposes, hardcoded reach is acceptable. Real wiring requires integration with Hatchet backend (out of scope).

---

## Test Coverage Limitations

### 6. No Browser Automation (Cross-Browser & Cross-Resolution Testing)

**Impact:** Cannot run interactive tests on Chrome + Firefox. Cannot test responsive breakpoints (1440×900, 1920×1080).

**Mitigation:**
- HTTP smoke tests validate all 13 routes (200 + content >500 bytes)
- Per-phase component tests covered in P-5 through P-9 reports
- Visual regression testing deferred (no Chromatic/Percy setup)

**Recommendation:** Post-launch, integrate Playwright for E2E cross-browser + cross-resolution validation.

---

## Data & Fixture Limitations

### 7. Campaign Monitoring Uplift Hardcoded

**Impact:** Campaign `cmp-cfm-407` shows "+8.2% Uplift" with real-looking chart. Other campaigns show "Insufficient data" banner.

**Current state:**
- `cmp-cfm-407` hardcoded uplift + cohort chart (visual proof point)
- Other campaign IDs missing real monitoring data (intentional for demo focus)

**Not a blocker:** Demo flow walks only `cmp-cfm-407`; other campaigns not used in 13-step flow.

---

### 8. Opportunity Synthesis — Window & Confidence

**Impact:** Opportunities rendered on `/agents` inbox use synthetic window/confidence scores.

**Current state:**
- `ag-op-1042`: window = "next-72h", confidence = 0.78 (hardcoded)
- Evidence sparklines generated from synthetic time series
- Thread IDs reference fixture JSON

**Real data source:** Post-launch, opportunities surface from real Authoring Agent service (Temporal, deployed separately).

---

## Docs & Documentation Gaps

### 9. CLAUDE.md Docs Structure Deferred

**Impact:** Phase 25 criterion #25 (docs populated per CLAUDE.md structure) deferred to P-11.

**Current state:**
- Only `./docs/demo-known-limitations.md` (this file) exists
- Missing:
  - `system-architecture.md`
  - `deployment-guide.md`
  - `development-roadmap.md`
  - `code-standards.md`

**Timeline:** P-11 (docs polish) — scheduled immediately after P-10.

---

## Performance Notes (Not Blockers)

### 10. Web Bundle Size Warning

**Build output:**
```
dist/assets/index-DExhvavl.js: 612.57 kB (gzip: 146.71 kB)
Warning: Some chunks are larger than 500 kB after minification.
```

**Status:** ⚠️ Warning, not error. App runs fine. Code-splitting deferred to prod optimization phase.

**Fix:** Dynamic imports + route-based splitting can reduce main bundle. Not blocking demo.

---

## Summary: What Works, What Doesn't

| Component | Status | Notes |
|-----------|--------|-------|
| All 13 demo routes | ✓ Works | HTTP 200 + full HTML |
| Substrate copy (S-A & S-B) | ✓ Works | Verbatim match vs PRD |
| OpportunityCard 6 regions | ✓ Works | All regions rendered + styled |
| Feature Store browsing | ✓ Works | 73 features, latency badges visible |
| Segment canvas + threshold playground | ✓ Works | Slider + audience region functional |
| Campaign trigger variants (3/3) | ✓ Works | Real-time, scheduled, one-time |
| Hybrid handoff (A + B) | ✓ Works | Both substrate blocks conditional |
| Agent inbox (9 opp + 3 draft + 2 rec) | ✓ Works | All tabs render |
| Monitoring +8.2% lift (cmp-cfm-407) | ✓ Works | Hardcoded but visually correct |
| Agents module (Module 05) | ✓ Works | Rightmost tab, active highlighting |
| Cross-module routing (FS→Seg→Cmp→Mon) | ✓ Works | 3+ CTAs tested |
| Production bundle | ✓ Works | `pnpm build` → `dist/` → preview server |
| Trino real data | ✗ Blocked | VPN auth required; fixtures used instead |
| Catalog-api prod schema | ✗ Deferred | Mock-only setup for P-12 validation |
| Draft pre-population | ✗ Deferred | Canvas opens, deeper wiring TBD |
| Inline segment cardinality | ✗ Deferred | Hardcoded reach (no real calculation) |
| Cross-browser testing | ✗ Deferred | No browser automation attached |
| Docs structure | ✗ Deferred | P-11 task |

---

## Next Steps

1. **P-11 (Docs Polish)** — Populate `./docs/` per CLAUDE.md structure.
2. **Post-Launch (Prod Hardening)** — Address:
   - Trino real data integration (auth + schema)
   - Catalog API prod schema alignment
   - Code-splitting + bundle size optimization
   - E2E cross-browser + cross-resolution testing
   - Real Authoring Agent service integration

---

## Validation Metadata

- **Validated on:** 2026-05-09, 17:10 UTC+7
- **Environment:** Windows 11, Node v22.15.1, pnpm v10.32.1
- **Build tool:** Vite 5.4.21
- **Preview server:** http://127.0.0.1:4173
- **Bundle size:** 612.57 kB (146.71 kB gzip)
- **Test scope:** 13-step demo flow + 25-criteria acceptance gate
- **Result:** 24/25 criteria passed (96%); 1 deferred to P-11

