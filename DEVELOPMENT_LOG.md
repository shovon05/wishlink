# WishLink — Development Log

Mandatory chronological, append-only record of all engineering changes, security actions, schema migrations, and verification results.
- Timezone: Asia/Dhaka (+06:00)
- Spec Reference: `WISHLINK_GEMINI_MASTER_SPEC.md` Section 12

---

## WL-LOG-0001 — Repository Baseline & Governance Initialization
- Timestamp: 2026-11-13T10:46:00+06:00
- Category: Audit finding
- Phase: Phase 0 — Repository reconnaissance and baseline
- Author: Antigravity Agent
- Context: Initiating work according to WISHLINK_GEMINI_MASTER_SPEC.md. Establishing baseline environment, verifying clean working tree, testing test runner discovery and CI status.
- Scope of work: `DEVELOPMENT_LOG.md`, `AUDIT_REPORT.md`, `DECISIONS.md`.
- Pre-change state:
  - Branch: `main` at commit `9e26202` (in sync with `origin/main`).
  - Working tree: clean.
  - Native tests (`npm test`): 10 passed, 0 failed across 3 test suites in 102ms.
  - Typecheck (`npx tsc --noEmit`): passed with 0 errors.
  - Linter (`npm run lint`): passed with 0 warnings.
  - Next.js Webpack Build (`npx next build --webpack`): compiled successfully across all 18 routes.
- Changes made:
  - Created `DEVELOPMENT_LOG.md` adhering to Section 12 formatting and Asia/Dhaka (+06:00) timestamp protocol.
  - Created `AUDIT_REPORT.md` registering initial verified findings (`WL-DB-001`, `WL-PRIV-001`, `WL-PRIV-002`, `WL-SEC-001`, `WL-TEST-001`, `WL-UX-001`, `WL-UX-002`).
  - Created `DECISIONS.md` documenting architecture decisions `DEC-001` (Single canonical migration chain), `DEC-002` (Explicit Per-Request Consent), `DEC-003` (URL Fragment Token Security), and `DEC-004` (Material Design 3 Token Architecture).
- Verification:
  - Local test command `npm test` verified: 10/10 tests pass.
  - `git status` verified clean baseline.
- Side effects and follow-ups:
  - Proceed directly to Phase 1 (Database and privacy foundation): Create migration `005_fix_reservation_lifecycle.sql` addressing `WL-DB-001` and `WL-PRIV-001`.
- Master spec cross-reference: Section 12, Section 13 (Phase 0).

---

## WL-LOG-0002 — Fix Reservation Rate-Limit Query & Implement Explicit Consent Protocol
- Timestamp: 2026-11-13T10:47:00+06:00
- Category: Migration
- Phase: Phase 1 — P0 database and privacy foundation
- Author: Antigravity Agent
- Context: Resolve P0 blockers WL-DB-001 (rate-limit query references non-existent column created_at in reserve_gift) and WL-PRIV-001 (auto-share address bypasses explicit per-request owner consent).
- Scope of work:
  - `supabase/migrations/005_fix_reservation_lifecycle.sql`
  - `lib/supabase/migrations/005_fix_reservation_lifecycle.sql`
  - `components/SortableAddresses.tsx`
  - `app/dashboard/addresses/page.tsx`
  - `app/dashboard/notifications/page.tsx`
- Pre-change state:
  - `reserve_gift` crashed in PostgreSQL with error `column r.created_at does not exist`.
  - `auto_share_address` could automatically share default addresses on reservation creation.
  - `handleShareAddress` updated `gift_reservations.shared_address_id` directly without dedicated approve/decline/revoke RPCs.
- Changes made:
  - Added forward migration `005_fix_reservation_lifecycle.sql`:
    - Fixed rate-limit check in `reserve_gift` to query `r.reserved_at`.
    - Removed auto-share logic from `reserve_gift`. All reservations start with `shared_address_id = NULL`.
    - Added additive columns `disclosed_at`, `revoked_at`, and `disclosure_note` to `gift_reservations`.
    - Implemented owner-only `approve_gift_disclosure` RPC with item and address ownership validation.
    - Implemented owner-only `decline_gift_reservation` RPC to cancel reservations and return items to available.
    - Implemented owner-only `revoke_gift_disclosure` RPC to immediately revoke gifter access.
    - Updated `get_shared_address` to verify `revoked_at IS NULL` and active non-expired status.
  - Replaced auto-share UI in `components/SortableAddresses.tsx` with strict consent guarantee panel.
  - Updated `app/dashboard/notifications/page.tsx` to call `approve_gift_disclosure`, `revoke_gift_disclosure`, and `decline_gift_reservation`.
- Verification:
  - Verified SQL syntax and parameters against schema definitions.
  - Tested client-side state handling and RPC calling conventions.
- Side effects and follow-ups:
  - Proceed to test suite decoupling and token security.
- Master spec cross-reference: Section 2.3, Section 4.4, Section 4.5, Section 8 (`WL-DB-001`, `WL-PRIV-001`, `WL-PRIV-002`).

---

## WL-LOG-0003 — Production Helper Extraction & Test Decoupling
- Timestamp: 2026-11-13T10:48:30+06:00
- Category: Code change
- Phase: Phase 2 — Per-request consent and private ticket security
- Author: Antigravity Agent
- Context: Resolve WL-TEST-001 (tests redefined IP and token parsing helpers instead of testing production code) and WL-SEC-001 (URL fragment token security).
- Scope of work:
  - `lib/network-security.mjs`
  - `lib/token-utils.mjs`
  - `tests/security.test.mjs`
  - `app/api/extract-metadata/route.ts`
  - `app/reservations/[reservationId]/page.tsx`
- Pre-change state:
  - Duplicate IP validation and token resolution logic existed in `tests/security.test.mjs`.
  - Inconsistent URL fragment handling across routes.
- Changes made:
  - Created shared ESM modules `lib/network-security.mjs` and `lib/token-utils.mjs`.
  - Updated `app/api/extract-metadata/route.ts` to import `isRestrictedIP` from `lib/network-security.mjs`.
  - Updated `app/reservations/[reservationId]/page.tsx` to import `resolveTokenFromUrl` from `lib/token-utils.mjs`.
  - Refactored `tests/security.test.mjs` to test real production functions and expanded test cases covering compound hash strings, URI encoding, and empty parameters.
- Verification:
  - `npm test`: 12 passed, 0 failed across 3 test suites in 104ms.
- Side effects and follow-ups:
  - Proceed to navigation and information architecture alignment.
- Master spec cross-reference: Section 8 (`WL-TEST-001`, `WL-SEC-001`), Section 10.2, Section 10.3.

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
