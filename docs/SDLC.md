# Diyafa — SDLC Process

## Overview

Every feature or sprint follows this lifecycle. No shortcuts — every step is mandatory.

## Process

### 1. Design Phase
- Brainstorm the feature (explore codebase, ask questions, propose approaches)
- Write design doc to `docs/plans/YYYY-MM-DD-<feature>-design.md`
- Get user approval before implementation

### 2. Implementation Plan
- Write detailed task-by-task plan to `docs/plans/YYYY-MM-DD-<feature>.md`
- Each task: exact files, code snippets, test expectations, commit messages
- Get user approval before coding

### 3. Implementation
- Execute tasks (parallel where possible via subagents)
- Follow TDD where applicable
- Commit frequently with descriptive messages

### 4. Verification (MANDATORY)

Run ALL four checks after implementation — every time, no exceptions:

```bash
# 1. TypeScript — zero errors
pnpm check-types

# 2. ESLint — zero errors, zero warnings
npx eslint src/ --max-warnings 0

# 3. Tests — all passing
pnpm test

# 4. Production build — all routes passing
rm -rf .next && pnpm build
```

### 5. Dev Server Smoke Test (MANDATORY)

After build verification, start the dev server and test affected pages:

```bash
# Start dev server (clears stale cache first)
rm -rf .next && pnpm dev

# Test pages return 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/explore
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login

# Verify key elements render in HTML
curl -s http://localhost:3000/ | grep -oP "key-element-1|key-element-2" | sort | uniq -c
```

### 6. i18n Verification

If new translation keys were added:
- Check EN keys exist and are correct
- Check FR translations added for all new keys
- Check AR translations added for all new keys
- TypeScript check will catch missing keys (ParseKeys type)

### 7. Commit & PR

Only after ALL checks pass. Never commit with failing checks.

## Gotchas Learned

- `rm -rf .next` before build if switching between `pnpm build` and `pnpm dev` — stale middleware compilation uses wrong `NODE_ENV`
- CSP `unsafe-eval` only in dev CSP — production build compiles middleware with `NODE_ENV=production`, dev server needs fresh `.next`
- Port 3000 may be in use — dev server falls back to 3001, check both
- ESLint `no-nested-ternary` — extract to helper functions
- ESLint `padding-line-between-statements` — blank line before return statements
- `TranslatedText` uses strict `ParseKeys` type — i18n keys must exist

## Checklist Template

```
[ ] Design doc written and approved
[ ] Implementation plan written and approved
[ ] Code implemented
[ ] TypeScript: zero errors
[ ] ESLint: zero errors, zero warnings
[ ] Tests: all passing (note count)
[ ] Production build: all routes passing
[ ] Dev server: affected pages return 200
[ ] Dev server: key elements render in HTML
[ ] i18n: FR/AR translations complete
[ ] Committed with descriptive message
```
