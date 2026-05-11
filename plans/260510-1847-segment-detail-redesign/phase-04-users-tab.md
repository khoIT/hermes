---
phase: 4
title: "Users Tab"
status: completed
priority: P0
effort: "0.5d"
dependencies: [1]
---

# Phase 4: Users Tab

## Overview

Implements the Users page that shows a 50-row paginated sample of UIDs landing in the segment with last-event timestamp, lifecycle stage, spend tier, country, and device. Includes CSV export. Replaces the `ComingSoon` stub. No row drill-in (per locked decision).

## Requirements

**Functional:**
- `/segments/:id/users` renders a toolbar + paginated table.
- Toolbar: "{N} users · Last build {ts}" left-aligned + `[⬇ Export CSV]` button right-aligned.
- Table columns (6): UID (mono) · Last seen · Lifecycle · Spend tier · Country · Device.
- 50 rows total, paginated 25/page (2 pages). Pagination controls bottom-right.
- CSV export downloads `segment-{id}-users.csv` with all 50 rows + header row.
- Sample data deterministic per segment id.

**Non-functional:**
- `users.tsx` ≤120 LoC.
- `users-table.tsx` ≤180 LoC.
- `csv-export.ts` ≤80 LoC.
- Sample generator ≤120 LoC additional in `synth-segment-detail-data.ts`.

## Architecture

```
users.tsx
  ├─ toolbar: count + last-build + [Export CSV]
  └─ <UsersTable rows={sample}/>
       ├─ thead: 6 columns
       ├─ tbody: 25 rows per page
       └─ pagination: prev / "Page 1 of 2" / next

synth-segment-detail-data.ts (extended)
  exports new:
    - getUserSample(segmentId): UserSampleRow[50]

UserSampleRow = {
  uid: string,             // 'usr-' + 8 hex chars
  lastSeenISO: string,     // ISO timestamp within last 14d
  lifecycle: 'new'|'active'|'at-risk'|'churned',
  spendTier: 'whale'|'dolphin'|'minnow'|'f2p',
  country: string,         // 2-letter ISO
  device: 'ios'|'android'|'web',
}

csv-export.ts
  exports:
    - downloadCsv(filename, headers: string[], rows: string[][]): void
    - rowsToCsv(rows): string
```

CSV escape: wrap any cell containing `,` `"` or newlines in double quotes; escape inner `"` as `""`.

## Related Code Files

**Create:**
- `apps/web/src/modules/segments/users.tsx`
- `apps/web/src/modules/segments/_components/users-table.tsx`
- `apps/web/src/modules/segments/_utils/csv-export.ts`

**Modify:**
- `apps/web/src/modules/segments/_utils/synth-segment-detail-data.ts` — add `getUserSample()`.
- `apps/web/src/routes.tsx` — replace `users` ComingSoon stub with `<Users/>`.

**Delete:** none.

## Implementation Steps

1. **Sample generator** (1h)
   - In `synth-segment-detail-data.ts`:
     - `getUserSample(id)`: 50 rows.
     - UID: `'usr-' + (PRNG.next() * 0xffffffff).toString(16).padStart(8,'0')`.
     - Last seen: ISO of `now() - PRNG.next() * 14 * 86400 * 1000`.
     - Lifecycle / spendTier / device: weighted draws aligned with Phase 3 generators (so Composition charts and Users table tell consistent stories).
     - Country: weighted draw from same Phase 3 country pool.
   - Cache result by id with `useMemo` in caller.

2. **CSV export utility** (45 min)
   - `csv-export.ts`:
     - `escapeCell(s: string)`: returns wrapped/escaped string.
     - `rowsToCsv(headers, rows)`: header line + rows joined by `\r\n`.
     - `downloadCsv(filename, headers, rows)`: build Blob, create object URL, anchor click, revoke.

3. **`<UsersTable>`** (1.5h)
   - Header row: 6 columns with sticky background, T.n100, bold T.n800.
   - Body rows: alternating background optional; mono font for UID column.
   - Last seen: human-friendly relative ("2 days ago") + tooltip with full ISO.
   - Lifecycle / Spend tier: small colored pill (reuse Phase 3 color maps).
   - Country: text code (no flag).
   - Device: small icon (lucide Smartphone / Globe).
   - Pagination: `<button>Prev</button> Page X of Y <button>Next</button>` bottom-right; disabled state when at boundaries.

4. **`users.tsx` composition** (30 min)
   - Pull `seg` and `sample = getUserSample(id)`.
   - Toolbar: format count and last-build with `seg.lastBuildAt` or "Not synced yet" fallback.
   - Export click: `downloadCsv('segment-' + id + '-users.csv', headers, rows.map(rowToArray))`.
   - Render table.

5. **Route wire-up** (10 min)
   - Edit `routes.tsx`: replace ComingSoon for `users` with `<Users/>`.

6. **Verification:**
   - Load `/segments/seg-cfm-loss-streak-non-paying-2026-0508-a3f9/users`.
   - Toolbar shows count + last build; Export CSV downloads a 51-line file (1 header + 50 rows).
   - Pagination switches between page 1 (rows 1–25) and page 2 (rows 26–50).
   - Open CSV — escaping correct on commas in country names, etc.
   - Lifecycle / spend / country distributions match Composition tab (qualitatively).
   - `pnpm typecheck` clean.

## Success Criteria

- [ ] `/segments/:id/users` renders toolbar + 25-row table + pagination.
- [ ] Pagination flips between page 1 and page 2.
- [ ] CSV export downloads valid file with 1 header + 50 data rows.
- [ ] CSV escapes commas/quotes correctly.
- [ ] Sample data deterministic across reloads.
- [ ] Distribution roughly matches Composition tab (sanity check, not strict).
- [ ] `pnpm typecheck` clean.

## Risk Assessment

- **Risk:** Browser blocks blob downloads in some sandboxes.
  - **Mitigation:** Confirm via dev tools that `URL.createObjectURL` works; fallback link element approach (`<a download>`) used directly.
- **Risk:** Sample row count (50) feels token-ier than real product expectations.
  - **Mitigation:** 50 is a sample, not the segment population — copy in toolbar makes that clear ("Sample of 50 from {N} matched users").
- **Risk:** Cells containing `\n` break CSV.
  - **Mitigation:** None of the fixture columns contain newlines, but escape function still handles them correctly.
- **Risk:** Distribution drift from Composition (different seeds).
  - **Mitigation:** Both Phase 3 + Phase 4 use the same `mulberry32(hashSegmentId)` seed source so the marginal distributions roughly align.
