# Code Standards

> Stub — to be filled in Phase 11.

## Key conventions (Phase 1 baseline)
- File naming: kebab-case for TS/TSX, PascalCase for React components exported as default
- Max file size: 200 lines (CLAUDE.md rule)
- Package namespace: `@hermes/*`
- Design tokens: single source of truth in `apps/web/src/theme.tsx` + `src/styles/colors-and-type.css`
- No `any` escapes without inline justification comment
