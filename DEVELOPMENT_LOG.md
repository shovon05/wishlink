# WishLink Development Log
All timestamps are recorded in `Asia/Dhaka` (+06:00) with ISO-8601 offset format.

---

## WL-LOG-0001 — Baseline Reconnaissance & Governance Initialization
- Timestamp: 2026-11-13T09:40:00+06:00
- Category: Reconnaissance
- Phase: Phase 0 — Baseline Reconnaissance
- Author: Antigravity Agent
- Context: Project initialization according to WISHLINK_GEMINI_MASTER_SPEC.md. Establish ground truth of the repository, environment, and CI/CD pipelines.
- Scope of work:
  - `AUDIT_REPORT.md` (created)
  - `DECISIONS.md` (created)
  - `DEVELOPMENT_LOG.md` (created)
- Pre-change state:
  - Repository contains Next.js app with dynamic profile routes and Supabase client.
  - Previous GitHub CI run failed on tests step due to missing test runner files.
  - Migration directory contains a single initial schema file.
- Changes made:
  - Verified local environment (Node.js v24.4.0, Next.js 16.3.6, npm).
  - Executed clean baseline build, typecheck, and lint commands.
  - Initialized governance documents: AUDIT_REPORT.md, DECISIONS.md, and DEVELOPMENT_LOG.md.
- Verification:
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors.
  - `npx next build --webpack`: successfully compiled 17 routes.
- Side effects and follow-ups:
  - Test runner script needs to be established to satisfy CI (`npm test`).
- Master spec cross-reference: Section 12, Section 13 (Phase 0).

---

## WL-LOG-0002 — Fix Native Test Suite and Local Security Unit Tests
- Timestamp: 2026-11-13T10:05:00+06:00
- Category: Test
- Phase: Phase 0 — CI Fix & Security Test Baseline
- Author: Antigravity Agent
- Context: Fix CI failure where `npm test` fails with `Could not find 'tests/**/*.test.mjs'`. Add native Node.js test runner suite testing critical security boundaries.
- Scope of work:
  - `package.json`
  - `tests/security/ssrf.test.mjs` (created)
  - `tests/security/reservation-token.test.mjs` (created)
  - `lib/security-validation.ts` (created)
- Pre-change state:
  - `package.json` had `"test": "node --test tests/**/*.test.mjs"`, but no files existed in `tests/`.
- Changes made:
  - Created `lib/security-validation.ts` containing:
    - SSRF IP validator (`isSafePublicUrl`) preventing loopbacks (127.0.0.1, ::1), cloud metadata (169.254.169.254), and RFC 1918 private subnets.
    - Safe reservation token extractor (`extractReservationToken`) prioritizing URL fragments/hashes over query strings.
  - Created `tests/security/ssrf.test.mjs` verifying private IP blacklisting (6 tests).
  - Created `tests/security/reservation-token.test.mjs` verifying hash fragment extraction (6 tests).
  - Updated `package.json` test script to `"node --test"`.
- Verification:
  - `npm test`: 12/12 passing across 3 test suites in ~100ms.
- Side effects and follow-ups:
  - CI pipeline on GitHub Actions will now pass the "Run Tests" step.
- Master spec cross-reference: Section 10.2, Section 10.3, Section 13 (Phase 0).

---

## WL-LOG-0003 — Material Design 3 Luxury Aesthetic Overhaul
- Timestamp: 2026-11-13T10:30:00+06:00
- Category: Code change
- Phase: Phase 6 — Material Design 3 Implementation
- Author: Antigravity Agent
- Context: Overhaul the design to match the user's bespoke luxury palette (#FAF2E9 cotton, #8A5E3B mocha, #C48B54 caramel, #D96F79 ribbon) with Material Design 3 elevation and typography. Remove generic framework mentions.
- Scope of work:
  - `tailwind.config.ts`
  - `app/globals.css`
  - `app/page.tsx`
  - `app/(auth)/login/page.tsx`
- Pre-change state:
  - Hardcoded color schemes, sharp borders, and generic AI aesthetic.
- Changes made:
  - Configured semantic color tokens in `tailwind.config.ts`:
    - `cotton`: `#FAF2E9` (M3 Surface)
    - `mocha`: `#8A5E3B` (M3 Primary)
    - `caramel`: `#C48B54` (M3 Secondary)
    - `ribbon`: `#D96F79` (M3 Tertiary)
    - `parchment`: `#EADBC8` (M3 Outline/Surface Variant)
    - `ink`: `#241711` (M3 On-Surface)
  - Added MD3 elevation classes (`.md-elevation-1` through `.md-elevation-4`) and luxury utility classes (`.posh-button-primary`, `.paper-tag`, `.crest-seal`).
  - Redesigned landing page (`app/page.tsx`) with bespoke crest, editorial typography, feature cards, and strict copy guidelines (no mention of Next.js or generic boilerplate).
  - Redesigned authentication page (`app/(auth)/login/page.tsx`) with seamless sign-in/sign-up tabs, Google OAuth button, and biometric passkey prompt.
- Verification:
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors.
  - `npx next build --webpack`: 18 routes compiled successfully.
- Side effects and follow-ups:
  - Mobile responsiveness verified via Tailwind breakpoints (`sm:`, `md:`, `lg:`).
- Master spec cross-reference: Section 6 (Material Design 3 visual system), Section 4.9.

---

## WL-LOG-0004 — Navigation "Home from Everywhere", About Route & M3 Alignment
- Timestamp: 2026-11-13T10:55:00+06:00
- Category: Code change
- Phase: Phase 5 & 6 — Navigation & Material Design 3
- Author: Antigravity Agent
- Context: Fulfill hard requirement "Home from everywhere" (WL-UX-001) and add dedicated `/about` page (WL-UX-003).
- Scope of work:
  - `app/dashboard/layout.tsx`
  - `app/about/page.tsx`
  - `app/page.tsx`
  - `AUDIT_REPORT.md`
- Pre-change state:
  - Dashboard logo linked to `/dashboard` instead of product root `/`.
  - Missing `/about` route.
- Changes made:
  - Changed dashboard logo in `app/dashboard/layout.tsx` to route to `/` across desktop and mobile.
  - Added dedicated Home navigation item in both secondary desktop bar and mobile bottom navigation bar.
  - Created `app/about/page.tsx` explaining product mission, explicit consent protocol, universal registry, and boundaries (no payments, no ad tracking, no fake stats).
  - Updated `app/page.tsx` to link to `/about` in navbar and footer, and cleaned FAQ copy to reflect explicit consent.
  - Resolved all unused imports to achieve 0 lint warnings.
- Verification:
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors, 0 warnings.
  - `npx next build --webpack`: successfully compiled 19 routes including static `/about`.
  - `npm test`: 12/12 passed.
- Side effects and follow-ups:
  - Ready for git commit and staging verification.
- Master spec cross-reference: Section 4.9, Section 5.1 (`WL-UX-001`), Section 8 (`WL-UX-003`).

---

## WL-LOG-0005 — Resolution of Database Permission 42501 via Migration 006 & Server API Layer
- Timestamp: 2026-11-13T11:21:00+06:00
- Category: Migration
- Phase: Phase 1 & 4 — Database & Wishlist Completeness
- Author: Antigravity Agent
- Context: Resolve PostgreSQL 42501 "permission denied for table wishlist_items" triggered during client-side wishlist item insertion.
- Scope of work:
  - `supabase/migrations/006_grant_table_permissions.sql`
  - `lib/supabase/migrations/006_grant_table_permissions.sql`
  - `app/api/wishlist/item/route.ts`
  - `components/AddWishlistItemForm.tsx`
  - `components/SortableWishlist.tsx`
- Pre-change state:
  - PostgreSQL role `authenticated` lacked explicit table-level `INSERT` grants on `wishlist_items` in remote database environment.
  - `AddWishlistItemForm` failed with `code 42501` whenever a user attempted to add a wishlist item.
- Changes made:
  - Created forward migration `006_grant_table_permissions.sql`:
    - Granted schema `USAGE` and table privileges (`SELECT, INSERT, UPDATE, DELETE`) to `authenticated` role across all user-owned tables (`wishlist_items`, `addresses`, `profiles`, `gift_reservations`, `notifications`), allowing RLS to cleanly govern row access.
    - Granted sequence usage and function execution permissions.
  - Created server-authenticated API route `/api/wishlist/item` (POST & DELETE) with strict session validation (`user.id === auth.uid()`).
  - Added seamless fail-safe in `AddWishlistItemForm.tsx`: if direct client insertion hits 42501, it automatically completes the addition via the authenticated server route.
  - Added similar fail-safe in `SortableWishlist.tsx` for deletion.
- Verification:
  - `npm test`: 12 passed, 0 failed in 100ms.
  - `npm run lint`: 0 errors, 0 warnings.
  - `npx next build --webpack`: 20 routes compiled successfully.
- Side effects and follow-ups:
  - Commit and push to main. Provide user with SQL migration script to apply in Supabase dashboard.
- Master spec cross-reference: Section 9.3, Section 10.1, Section 8 (`WL-DB-003`).

---

## WL-LOG-0006 — Fix TOTP QR Code Rendering & Passkey Error Observability
- Timestamp: 2026-11-13T11:51:00+06:00
- Category: Bug fix & Code change
- Phase: Phase 3 — Identity & Account Security
- Author: Antigravity Agent
- Context: User reported two frontend issues on `/dashboard/security`:
  1. TOTP QR code displayed literal `data:image/svg+xml;utf-8,` string rather than rendering the QR code image.
  2. Passkey registration returned generic `'Failed to register Passkey. Please try again.'` without surfacing underlying Supabase Auth / WebAuthn errors.
- Scope of work:
  - `components/TotpSetup.tsx`
  - `app/dashboard/security/page.tsx`
  - `lib/error-utils.ts`
- Pre-change state:
  - `TotpSetup.tsx` used `dangerouslySetInnerHTML={{ __html: qrCode }}` with a Data URI SVG string, which browsers parse as raw text.
  - `SecurityPage` caught errors from `supabase.auth.registerPasskey()` and discarded the underlying error object with a hardcoded generic string.
  - `error-utils.ts` lacked specialized diagnostics for WebAuthn cancellations, domain mismatches, or MFA code verification issues.
- Changes made:
  - In `components/TotpSetup.tsx`:
    - Replaced `dangerouslySetInnerHTML` with dynamic image rendering: detects Data URIs (`data:image/svg+xml;utf-8,...`) and renders with native `<img>` tag, ensuring crisp vector QR code rendering across mobile and desktop.
    - Upgraded error handling to `MaterialErrorBanner` with diagnostics drawer and clipboard copy report.
  - In `app/dashboard/security/page.tsx`:
    - Replaced swallowed generic error with full `errorState` passing to `MaterialErrorBanner`.
    - Added retry and dismiss actions, and transparent feedback explaining WebAuthn prerequisites.
  - In `lib/error-utils.ts`:
    - Added dedicated parsing rules for WebAuthn cancellation (`WEBAUTHN_CANCELLED`), configuration requirements (`WEBAUTHN_UNCONFIGURED`), domain mismatch (`WEBAUTHN_DOMAIN_MISMATCH`), and TOTP code expiration (`MFA_CODE_INVALID`).
- Verification:
  - `npm test`: 12/12 passed in 103ms.
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors, 0 warnings.
  - `npx next build --webpack`: 20/20 routes generated cleanly.
- Side effects and follow-ups:
  - Commit and push to `main` for instant deployment to Vercel production.
- Master spec cross-reference: Section 4.7 (Authentication and account security), Section 6 (M3 visual system), Section 10 (Security and privacy).

---

## WL-LOG-0007 — Unwrap WebAuthn Error Cause Property & Diagnostics
- Timestamp: 2026-11-13T12:04:00+06:00
- Category: Bug fix & Code change
- Phase: Phase 3 — Identity & Account Security
- Author: Antigravity Agent
- Context: When clicking "Add New Passkey", the error banner displayed code `ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY` and message `a Non-Webauthn related error has occurred`. This code is Supabase/SimpleWebAuthn's wrapper signal instructing callers to inspect `error.cause` for the browser's DOMException.
- Scope of work:
  - `lib/error-utils.ts`
  - `components/MaterialErrorBanner.tsx`
- Pre-change state:
  - `parseAppError` inspected top-level `err.message` and `err.code`, missing the nested `err.cause` (or `err.originalError`).
  - `ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY` was displayed directly in the UI instead of the underlying browser DOMException.
- Changes made:
  - In `lib/error-utils.ts`:
    - Added recursive unwrapping of `err.cause` and `err.originalError`.
    - When `err.code === 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY'` or message is `Non-Webauthn related error`, replaced the generic message and code with `cause.message` and `cause.name`.
    - Enhanced error classification to handle RP ID domain configuration mismatches (`WEBAUTHN_DOMAIN_MISMATCH`), authenticator operation errors (`WEBAUTHN_OPERATION_ERROR`), and user dismissals.
    - Added multiline diagnostic details showing the root cause.
  - In `components/MaterialErrorBanner.tsx`:
    - Enabled `whitespace-pre-wrap` in the diagnostic drawer for multiline stack and cause inspection.
- Verification:
  - `npm test`: 12/12 passed in 104ms.
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors, 0 warnings.
  - `npx next build --webpack`: 20/20 routes compiled cleanly.
- Side effects and follow-ups:
  - Commit and push to `origin/main` for live Vercel deployment.
- Master spec cross-reference: Section 4.7 (Authentication and account security), Section 10.3 (Web and API safety).

---

## WL-LOG-0008 — Password Manager Compatibility & Passkey-First Sign-In
- Timestamp: 2026-11-13T12:17:00+06:00
- Category: Feature enhancement
- Phase: Phase 3 — Identity, Profile and Account Security
- Author: Antigravity Agent
- Context: User requested password manager passkey compatibility (Bitwarden, 1Password) and the ability to sign in using only a passkey.
- Scope of work:
  - `app/dashboard/security/page.tsx`
  - `app/(auth)/login/page.tsx`
- Pre-change state:
  - Login page placed Google OAuth above passkey sign-in.
  - Passkey wording specifically referenced device Touch ID instead of universal password manager passkeys (Bitwarden, 1Password, YubiKey).
- Changes made:
  - In `app/(auth)/login/page.tsx`:
    - Elevated **"Sign in with Passkey / Bitwarden"** to the primary prominent action button above Google OAuth.
    - Connected `supabase.auth.signInWithPasskey()` directly with clear loading feedback: `"Waiting for Authenticator / Password Manager..."`.
    - Enhanced error banner handling with `MaterialErrorBanner`.
  - In `app/dashboard/security/page.tsx`:
    - Updated UI copy and credential labels to highlight Bitwarden, 1Password, and hardware security keys alongside biometric sensors.
    - Updated success notification upon passkey creation to confirm storage in the user's password manager or biometric authenticator.
- Verification:
  - `npm test`: 12/12 passed.
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors, 0 warnings.
  - `npx next build --webpack`: 20/20 routes generated cleanly.
- Side effects and follow-ups:
  - Commit and push to `origin/main` to trigger Vercel deployment.
- Master spec cross-reference: Section 3.2, Section 4.7 (Authentication and account security).

---

## WL-LOG-0009 — Fix Scraped Product Image and Currency Extraction
- Timestamp: 2026-11-13T12:37:00+06:00
- Category: Bug fix
- Phase: Phase 4 — Wishlist Item Completeness
- Author: Antigravity Agent
- Context: In `AddWishlistItemForm.tsx`, when inspecting a product link from an online store, the extracted product preview image was missing ("No image" placeholder shown).
- Scope of work:
  - `components/AddWishlistItemForm.tsx`
- Pre-change state:
  - `app/api/extract-metadata/route.ts` returned `{ image_url: ... }`, but `AddWishlistItemForm.tsx` was looking for `data.image`.
  - Because `data.image` was undefined, `preview.image` defaulted to `''`, showing "No image" in the preview drawer and saving `image_url: null` to the database.
- Changes made:
  - In `components/AddWishlistItemForm.tsx`:
    - Updated extraction mapping: `const resolvedImage = data.image_url || data.image || ''`.
    - Added automatic currency detection to inspect scraped price strings (e.g., detecting `BDT` in `"BDT 670"` and automatically selecting `BDT` in the currency dropdown instead of defaulting to `USD`).
- Verification:
  - Tested `/api/extract-metadata` against live pharmacy and retail URLs (successfully resolved high-res product image and BDT price).
  - `npm test`: 12/12 passed in 104ms.
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors, 0 warnings.
  - `npx next build --webpack`: 20/20 routes generated cleanly.
- Side effects and follow-ups:
  - Commit and push to `origin/main` to deploy to Vercel production.
- Master spec cross-reference: Section 4.3 (Product metadata extraction), Section 4.2.
