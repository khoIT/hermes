# Code Standards

**Owner:** Hermes team · aligned with CLAUDE.md development rules.

**Last updated:** 2026-05-09 · Phase 11

---

## 1. TypeScript & Type Safety

### 1.1 Strict Mode

**Rule:** `tsconfig.json` with `strict: true` for all packages.

**Enforcement:** Pre-push validation via `pnpm typecheck` (0 errors required).

### 1.2 Shared Data Types

**Single source:** `packages/contracts/src/`

All shared structures (Feature, Segment, Campaign, Predicate, Opportunity, Event) defined here with Zod schemas.

```typescript
// ✓ Good
import { type Feature, FeatureSchema } from '@hermes/contracts';

const feature: Feature = FeatureSchema.parse(data);

// ✗ Bad (local redefinition)
interface LocalFeature {
  id: string;
  name: string;
  // ...
}
```

### 1.3 No `any` Without Comment

**Rule:** `any` is forbidden unless justified inline.

```typescript
// ✗ Bad
const value: any = someUnknownData;

// ✓ Good
// @ts-ignore — API returns untyped JSONL rows (temporary, pre-May-12 schema migration)
const value: Record<string, unknown> = someUnknownData;

// Or use as const assertion
const value = someUnknownData as const;
```

**Rationale:** Preserves type safety for new code; documents waivers for schema drift during migration.

---

## 2. File Organization

### 2.1 Module Structure

Each module follows a consistent directory layout:

```
modules/{module-name}/
├── page.tsx                 # Router entry (TanStack Router file-based routing)
├── _components/             # React components (private exports)
│   ├── canvas.tsx
│   ├── library.tsx
│   ├── detail.tsx
│   └── ...
├── _logic/                  # Business logic helpers
│   ├── feature-builder.ts
│   ├── segment-composer.ts
│   └── formatters.ts
├── _state/                  # Zustand stores + TanStack Query hooks
│   ├── feature-store.ts
│   ├── audience-lookup.ts
│   └── campaign-draft.ts
└── _composer/               # Complex multi-part views
    ├── segment-workflow.tsx
    └── ...
```

**Naming convention:**
- `page.tsx` — Router entry point (PascalCase exports OK)
- `_components/*` — Private components (kebab-case filenames, PascalCase exports)
- `_logic/*` — Helpers (kebab-case filenames, lowercase exports)
- `_state/*` — State (kebab-case filenames, camelCase exports)

### 2.2 File Naming

| Context | Pattern | Example |
|---------|---------|---------|
| React component (TS/TSX) | kebab-case filename, PascalCase export | `_components/feature-pill.tsx` → export `FeaturePill` |
| Logic file (TS) | kebab-case filename, lowercase exports | `_logic/segment-builder.ts` → export `buildSegment()` |
| State file (TS) | kebab-case filename, camelCase store | `_state/audience-lookup.ts` → export `useAudienceLookup` |
| Utility | kebab-case filename, lowercase exports | `utils/format-id.ts` → export `formatId()` |

**Length:** Descriptive is better than short. `feature-detail-histogram-component.tsx` is fine if accurate.

### 2.3 Max File Size

**Rule:** Individual code files ≤200 lines.

**Exception:** TypeScript interfaces/types may exceed 200 lines if modular (split components instead).

**Check:** `wc -l apps/web/src/modules/*/page.tsx` (audited during code review).

---

## 3. Component Conventions

### 3.1 React Components

```typescript
// ✓ Good: Named export from _components folder
export function FeaturePill({ name, latency, tier }: Props) {
  return <div className="...">...</div>;
}

// ✗ Bad: Default export + undefined types
export default function ({ name }: any) {
  return <div>{name}</div>;
}
```

### 3.2 Props Types

Define props types inline above component:

```typescript
interface FeaturePillProps {
  name: string;
  latency: string;
  tier: 'A' | 'B';
  synthesised?: boolean;
}

export function FeaturePill(props: FeaturePillProps) {
  // ...
}
```

### 3.3 Hooks

Use Zustand for client state, TanStack Query for server state (v1: static JSON via imports).

```typescript
// ✓ Zustand store
import { create } from 'zustand';

export const useSegmentDraft = create<SegmentDraftState>((set) => ({
  predicates: [],
  addPredicate: (p) => set(/* ... */),
}));

// ✓ TanStack Query hook (post-May-12)
export function useAudienceCount(predicate: Predicate) {
  return useQuery({
    queryKey: ['audience', predicate],
    queryFn: async () => getAudienceCount(predicate),
  });
}

// ✗ Avoid: React.useState for shared app state
const [globalSegments, setGlobalSegments] = useState([]); // ✗
```

---

## 4. Styling & Design Tokens

### 4.1 Inline Styles + Design Tokens

The web app uses React inline `style={{ ... }}` objects driven by tokens from `apps/web/src/theme.tsx`. Tailwind is **not** used in `apps/web` — design tokens are the single source of truth and resolve to CSS custom properties under `:root` / `html.dark` (see `theme-tokens.css`).

```tsx
import { T } from '../../theme';

// ✓ Good: token-driven inline styles, flips light↔dark automatically
<div style={{
  background: T.surface,
  border: `1px solid ${T.n200}`,
  borderRadius: 10,
  color: T.n900,
  padding: 16,
}}>
```

```tsx
// ✗ Bad: hardcoded hex doesn't flip with html.dark
<div style={{ background: '#fff', color: '#171717' }}>
```

### 4.2 Theme tokens — chrome surfaces

Card/popover/modal backgrounds use `T.surface` (never `'#fff'`). App chrome surfaces have dedicated tokens:

| Use case                          | Token        |
|-----------------------------------|--------------|
| Card, popover, modal              | `T.surface`  |
| Outer App shell (gap)             | `T.shell`    |
| Sidebar, chat-rail aside          | `T.sidebar`  |
| Topbar, sticky sub-tab strips     | `T.topbar`   |

If a card can't be migrated to `T.surface` this round (e.g. third-party component, complex inline-style merge), opt it into the dark-mode flip by adding `data-hermes-surface="card"` on the outermost element. See `docs/design-guidelines.md` §1.1 for details.

A CSS safety net under `html.dark` catches lingering `'#fff'` patterns at runtime — but it's a backstop, not a substitute for migration. Any new code must use tokens.

### 4.3 Localized entity names

When rendering segment / campaign / chat-thread names, route through `apps/web/src/i18n/use-localized-names.ts`. Don't render `seg.displayName` / `cmp.displayName` / `thread.title` directly in user-facing surfaces unless you know the entity is ad-hoc / user-created (no fixture-level translation).

```tsx
import { useLocalizedSegmentName } from '../../i18n/use-localized-names';

function SegmentRow({ seg }: { seg: HermesSegment }) {
  const name = useLocalizedSegmentName(seg);
  return <span>{name}</span>;  // EN displayName when lang=en, VI map when lang=vi
}
```

For renders inside `.map(...)` callbacks where hooks aren't legal, use the pure helpers:

```ts
import { useI18n } from '../../i18n/i18n-provider';
import { localizedThreadTitleById } from '../../i18n/use-localized-names';

const { lang } = useI18n();
items.map(it => localizedThreadTitleById(it.id, it.title, lang));
```

VI translation maps live in `apps/web/src/i18n/entity-names.ts` — extend there, not on fixture files. The `@hermes/contracts` schema stays mono-lingual on purpose.

### 4.4 No New Fonts

Only three fonts allowed:
- `T.fSans` (Inter)
- `T.fDisp` (League Gothic)
- `T.fMono` (Geist Mono)

---

## 5. Error Handling

### 5.1 Try-Catch Pattern

```typescript
export async function getFeatures() {
  try {
    const response = await fetch('/api/features');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return FeatureListSchema.parse(await response.json());
  } catch (error) {
    console.error('Failed to fetch features:', error);
    // Return fallback or rethrow
    throw new ApplicationError('Feature catalog unavailable', { cause: error });
  }
}
```

### 5.2 User-Facing Errors

Provide actionable messages, not stack traces.

```typescript
// ✓ Good
throw new Error('Could not save segment. Please check your network connection and try again.');

// ✗ Bad
throw new Error('TypeError: Cannot read property "id" of undefined');
```

---

## 6. Naming Conventions

### 6.1 Variables & Functions

```typescript
// Constants (UPPER_SNAKE_CASE)
const MAX_AUDIENCE_SIZE = 10_000_000;
const DEFAULT_THRESHOLD = 50;

// Variables (camelCase)
let currentSegment: Segment;
const featureCount = 67;

// Functions (camelCase, verb-first for actions)
function formatId(id: string): string { }
function calculateAudienceCount(predicate: Predicate): number { }
function useSegmentDraft() { } // hooks: use* prefix
```

### 6.2 React Components

```typescript
// Components (PascalCase, noun-first)
export function FeaturePill() { }
export function SegmentCanvas() { }

// Hooks (camelCase, use* prefix)
export function useSegmentDraft() { }
export function useAudienceCount() { }
```

### 6.3 Technical IDs (Feature Names, SegmentID, TriggerID)

All lowercase, dash-separated (kebab-case):
- Feature: `consecutive_ranked_losses_streak`, `purchase_count_7d`, `account_age_days`
- Segment: `seg-cfm-ss1-weapon-owners-2026`
- Trigger: `trg-cfm-pass-stuck`
- Campaign: `cmp-cfm-407`

---

## 7. Git & Commit Practices

### 7.1 Conventional Commits

```
feat(modules): add segment threshold playground
fix(canvas): handle negative threshold values
docs(readme): update deployment instructions
refactor(state): simplify audience lookup logic
test(feature-store): add histogram tests
chore(deps): upgrade tailwind to v4
```

**Format:** `<type>(<scope>): <subject>`

**No AI references:** Never mention "Claude" in commit message.

### 7.2 Pre-Push Checklist

1. `pnpm typecheck` → 0 errors
2. `pnpm build` → succeeds
3. Test the feature manually (if UI changes)
4. No TODO comments left behind (unless referencing an issue number)
5. Commit message follows conventional format

---

## 8. API & Backend Integration

### 8.1 Endpoint Contracts

All APIs use Zod-validated request/response schemas:

```typescript
// Request schema
const AudienceCountRequestSchema = z.object({
  predicate: PredicateSchema,
  as_of: z.date().optional(),
});

// Response schema
const AudienceCountResponseSchema = z.object({
  count: z.number(),
  sampled_uids: z.array(z.string()),
});

// Implementation
export async function getAudienceCount(predicate: Predicate) {
  const response = await fetch('/api/audience/count', {
    method: 'POST',
    body: JSON.stringify({ predicate }),
  });
  return AudienceCountResponseSchema.parse(await response.json());
}
```

### 8.2 Error Codes

Use HTTP status codes meaningfully:
- `200 OK` — Success
- `201 Created` — Resource created
- `400 Bad Request` — Invalid input (validation failed)
- `401 Unauthorized` — Missing/invalid JWT
- `403 Forbidden` — Authenticated but not authorized
- `404 Not Found` — Resource does not exist
- `500 Internal Server Error` — Unexpected server error

---

## 9. Testing

### 9.1 Unit Tests (Future)

When test framework is integrated:

```typescript
describe('formatId', () => {
  it('should format segment ID correctly', () => {
    expect(formatId('seg-cfm-ss1-weapon-owners')).toBe('seg-cfm-ss1-weapon-owners');
  });

  it('should throw on invalid input', () => {
    expect(() => formatId('')).toThrow();
  });
});
```

### 9.2 Current Testing (Phase 1)

- Manual smoke tests via `pnpm dev` + browser navigation
- Type validation via `pnpm typecheck`
- Build validation via `pnpm build`
- No automated test suite yet (deferred to Phase 2)

---

## 10. Performance

### 10.1 Bundle Size

Current warning (not blocker): 612 KB (gzip 146 KB).

**Optimization opportunities (post-May-12):**
- Route-based code splitting via dynamic `import()`
- Lazy-load agent module (least-critical features)
- Tree-shake unused recharts exports

### 10.2 Render Performance

- Memoize expensive components (`React.memo` on card lists)
- Use Zustand's selective subscriptions (avoid re-renders on unrelated state changes)
- Avoid inline object/array literals in props (memoization breaks otherwise)

```typescript
// ✗ Bad: Inline object, re-renders children on every parent render
<FeaturePill props={{ name: 'test' }} />

// ✓ Good: Stable object reference
const pillProps = { name: 'test' };
<FeaturePill {...pillProps} />
```

---

## 11. Documentation

### 11.1 Code Comments

Write comments for *why*, not *what*:

```typescript
// ✗ Bad: Comments duplicate the code
const count = data.length; // Get the count

// ✓ Good: Comments explain intent
// Use length instead of ID-based count to handle test data with synthetic IDs
const count = data.length;
```

### 11.2 Function JSDoc

Complex functions deserve JSDoc:

```typescript
/**
 * Translates a Hermes predicate AST to Trino SQL WHERE clause.
 * Handles AND-of-OR groups with optional NOT exclusions.
 *
 * @param predicate - Hermes predicate AST
 * @param schema - Target schema (cfm_vn, ballistar, etc.)
 * @returns SQL WHERE clause (usable in SELECT queries)
 * @throws ApplicationError if predicate contains unsupported operators
 */
export function translatePredicateToSQL(
  predicate: Predicate,
  schema: string,
): string { }
```

---

## 12. Forbidden Patterns

| Pattern | Reason | Alternative |
|---------|--------|-------------|
| `any` type | Breaks type safety | Use `unknown` + type guard or `as const` |
| Hardcoded hex colors | Can't maintain consistency | Use `T.colors` token |
| `setTimeout` for state sync | Race conditions | Use proper state management |
| Local data duplication | Source-of-truth conflicts | Fetch once, cache in store |
| Inline styles | Difficult to maintain | Use Tailwind utility classes |
| Deeply nested ternaries | Unreadable | Extract conditional logic to helper |
| `console.log` in production | Noise in logs | Use proper error handler or remove |

---

## 13. Common Tasks Checklist

- [ ] Component uses Tailwind, no inline CSS
- [ ] All data types from `@hermes/contracts`
- [ ] No hardcoded colors or spacing values
- [ ] File ≤200 lines (split if necessary)
- [ ] No `any` without comment
- [ ] Function names describe intent (verb + noun)
- [ ] Error handling present (try-catch or error boundary)
- [ ] Commit message follows conventional format
- [ ] Typecheck passes (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
