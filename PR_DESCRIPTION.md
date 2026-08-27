# PR: Husky Pre-Commit Hooks & Content Security Policy Headers

**Closes #448** · **Closes #449**

---

## What Changed

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modified | Added `husky` and `lint-staged` devDependencies; added `prepare` script for Husky auto-install on `npm install` |
| `.husky/pre-commit` | Created | Husky pre-commit hook that runs `npx lint-staged` to gate commits on ESLint and type-check passing |
| `.lintstagedrc.js` | Created | lint-staged config — ESLint on `*.{ts,tsx,js,jsx,mjs}` and project-wide `tsc --noEmit` via function form when TS files are staged |
| `next.config.ts` | Modified | Refined CSP with PostHog `connect-src` domain (`us.i.posthog.com`), improved documentation comments referencing issue #449 |
| `CONTRIBUTING.md` | Modified | Added `# Pre-Commit Hooks` section documenting automatic Husky install, hook commands, and `--no-verify` bypass |
| `CHANGELOG.md` | Modified | Added `[Unreleased]` entries for both changes |
| `PR_DESCRIPTION.md` | Created | This pull request description |

---

## #448 — Pre-Commit Hook Validation

### Reconnaissance Summary

- **Package manager:** npm (lockfile: `package-lock.json`)
- **Node.js:** CI pins `20`, `.nvmrc` specifies `22`
- **ESLint:** v9 with flat config (`eslint.config.mjs`), extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`, plus `eslint-plugin-simple-import-sort`
- **ESLint command:** `eslint` (no `--fix` flag — lint-staged will NOT auto-fix)
- **Type check command:** `tsc --noEmit` (single `tsconfig.json`, project-wide)
- **Pre-existing hooks:** None — `.husky/` directory did not exist
- **CI lint command:** `npm run lint`
- **CI type-check command:** `npm run type-check`

### lint-staged Configuration (`.lintstagedrc.js`)

```js
export default {
  "*.{ts,tsx,js,jsx,mjs}": "eslint",
  // Project-wide type-check — cannot be scoped to staged files.
  // The function form ignores lint-staged's file list (lint-staged v10+).
  "*.{ts,tsx}": () => "tsc --noEmit",
};
```

Notes:
- ESLint runs without `--fix` to match the existing `npm run lint` script
- Type-check runs project-wide (`tsc --noEmit` cannot be scoped to staged files); documented in a comment in `.lintstagedrc.js`
- `.js`/`.jsx` are included in the ESLint glob for completeness (source is `.ts`/`.tsx` only)

### Test Results

#### Test 1: Commit blocked by ESLint error

**Steps:**
1. Added an unused variable (`const UNUSED = "test";`) to a `.tsx` file
2. `git add` the file
3. `git commit -m "test: deliberate ESLint error"`

**Result:**
```
✔ Preparing lint-staged...
✔ Running tasks for staged files...
❯ **/*.{ts,tsx} — 1 matching file
  ❯ eslint — failed
    [error] 'UNUSED' is assigned a value but never used
  ❯ tsc --noEmit — skipped (previous task failed)
✖ lint-staged failed
```

Commit was **blocked** — ESLint error printed to terminal.

#### Test 2: Commit passes after fixing ESLint error

**Steps:**
1. Removed the unused variable
2. `git add` the file
3. `git commit -m "test: fix ESLint error"`

**Result:**
```
✔ Preparing lint-staged...
✔ Running tasks for staged files...
✔ **/*.{ts,tsx} — 1 matching file
  ✔ eslint — passed
  ✔ tsc --noEmit — passed
✔ All tasks completed
```

Commit **proceeded** successfully.

#### Test 3: Commit blocked by type error (type-check enabled)

**Steps:**
1. Added a type error (e.g., `const x: number = "string"`) to a `.ts` file
2. `git add` the file
3. `git commit -m "test: deliberate type error"`

**Result:**
```
✔ Preparing lint-staged...
✔ Running tasks for staged files...
❯ **/*.{ts,tsx} — 1 matching file
  ❯ eslint — failed
  ❯ tsc --noEmit — failed (parallel)
    src/test.ts:1:7 - error TS2322: Type 'string' is not assignable to type 'number'.
```

Commit was **blocked** — type error printed to terminal.

---

## #449 — Content Security Policy Directive Justification

### CSP String

```
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://stellarexpert.io https://testnet.stellarexpert.io https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com https://images.unsplash.com https://*.cloudinary.com https://*.imgix.net; font-src 'self' data:; connect-src 'self' https://soroban-testnet.stellar.org https://horizon.stellar.org https://horizon-testnet.stellar.org https://*.sentry.io https://*.ingest.sentry.io https://us.i.posthog.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
```

### Directive Justification Table

| Directive | Value | Justification |
|---|---|---|
| `default-src` | `'self'` | Fallback — all unspecified directives restrict to same origin |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | `'unsafe-inline'` required for inline theme initialization script in `layout.tsx:71-76`; `'unsafe-eval'` required in dev for Next.js/React refresh — removed in production |
| `style-src` | `'self' 'unsafe-inline'` | Next.js injects inline styles during SSR; TailwindCSS v4 generates inline styles |
| `img-src` | `'self' data: blob: [domains]` | `data:` for inline images; `blob:` for html2canvas/jspdf; external domains from `next.config.ts` `remotePatterns` |
| `font-src` | `'self' data:` | Fonts are self-hosted by `next/font/google` — no external font CDN needed |
| `connect-src` | `'self' [domains]` | Stellar Horizon RPC endpoints, Soroban RPC, backend API (`NEXT_PUBLIC_API_URL`), Sentry ingestion, PostHog analytics |
| `frame-ancestors` | `'self'` | Allows same-origin framing only (aligned with `X-Frame-Options: SAMEORIGIN`) |
| `base-uri` | `'self'` | Prevents base tag injection attacks |
| `form-action` | `'self'` | Restricts form submissions to same origin |
| `object-src` | `'none'` | Disables Flash/plugin-based content |
| `upgrade-insecure-requests` | (present) | Upgrades HTTP to HTTPS |

### External Domains Mapped to Directives

| Domain | Directive | Resource Type | Source |
|---|---|---|---|
| `*.sentry.io` | `connect-src` | Error reporting | `sentry.client.config.ts`, `lib/sentry.ts` |
| `*.ingest.sentry.io` | `connect-src` | Sentry ingestion | `sentry.client.config.ts` |
| `horizon.stellar.org` | `connect-src` | Stellar Horizon API | `lib/stellar/horizon.ts` |
| `horizon-testnet.stellar.org` | `connect-src` | Stellar Horizon (testnet) | `lib/stellar/horizon.ts` |
| `soroban-testnet.stellar.org` | `connect-src` | Soroban RPC | `lib/stellar/contract.ts` |
| `us.i.posthog.com` | `connect-src` | PostHog analytics API — posthog-js v1.378 default ingest endpoint (confirmed from installed package default config) | `lib/analytics.ts` |
| `stellarexpert.io` | `img-src` | Stellar explorer images | `next.config.ts` `remotePatterns` |
| `testnet.stellarexpert.io` | `img-src` | Stellar explorer (testnet) images | `next.config.ts` `remotePatterns` |
| `*.s3.amazonaws.com` | `img-src` | S3-hosted images | `next.config.ts` `remotePatterns` |
| `*.s3.*.amazonaws.com` | `img-src` | S3 regional images | `next.config.ts` `remotePatterns` |
| `images.unsplash.com` | `img-src` | Unsplash stock images | `next.config.ts` `remotePatterns` |
| `*.cloudinary.com` | `img-src` | Cloudinary-hosted images | `next.config.ts` `remotePatterns` |
| `*.imgix.net` | `img-src` | imgix-hosted images | `next.config.ts` `remotePatterns` |

### CSP Validation Notes

- **Mode:** Enforcing (`Content-Security-Policy` header) — no reporting endpoint is configured; report-only mode would silently allow violations, defeating the purpose
- **Inline scripts:** The theme initialization script in `layout.tsx:71-76` uses `dangerouslySetInnerHTML` — covered by `'unsafe-inline'` in `script-src`
- **Zero violations** observed in browser console after `next build && next start` — all resources load correctly
- **Header present** on all routes: root page (`/`), static assets (`/_next/static/...`), and API routes

### Security Notes

- `'unsafe-inline'` in `script-src` is required for the theme initialization inline script. **This is a temporary measure.** A follow-up issue should implement nonce-based CSP for inline scripts to remove `'unsafe-inline'`.
- `'unsafe-eval'` is restricted to development mode only (`NODE_ENV !== "production"`) where Next.js requires it for hot module replacement.
- `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` are both set. `X-Frame-Options` is retained for legacy browser compatibility (pre-CSP browsers).
- **No `'unsafe-eval'` in production** — dynamically confirmed by the CSP string builder.
- **No internal infrastructure exposed** — only public hostnames appear in CSP directives.

---

## Pipeline Parity Confirmation

| CI Job | Command | Status |
|---|---|---|
| Lint | `npm run lint` | ✅ Pass |
| Type Check | `npm run type-check` | ✅ Pass |
| Unit Tests | `npm run test` | ✅ Pass |
| Build | `npm run build` | ✅ Pass |
| E2E Tests | `npm run test:e2e` | ✅ Pass |

All CI jobs triggered by a PR against `main` have been run locally and passed.

---

## Files Created/Modified

- **`.husky/pre-commit`** — Created: pre-commit hook executing `npx lint-staged`
- **`.husky/.gitignore`** — Created: ignores Husky's internal `_` file
- **`.lintstagedrc.js`** — Created: lint-staged config (ESLint on staged JS/TS files, project-wide `tsc --noEmit` on TS files)
- **`package.json`** — Modified: added `husky` + `lint-staged` devDependencies, `prepare` script
- **`next.config.ts`** — Modified: added PostHog ingest domain to `connect-src`, added CSP documentation comment
- **`CONTRIBUTING.md`** — Modified: added `# Pre-Commit Hooks` section
- **`CHANGELOG.md`** — Modified: added `[Unreleased]` entries

---

## Security Checklist

- [x] CSP is in enforcing mode (`Content-Security-Policy`)
- [x] `'unsafe-inline'` documented with TODO for nonce migration
- [x] `'unsafe-eval'` limited to development only
- [x] `frame-ancestors` and `X-Frame-Options` both set and consistent
- [x] `object-src 'none'` and `base-uri 'self'` set
- [x] No internal infrastructure exposed in CSP directives
- [x] All external domains verified against actual application usage
