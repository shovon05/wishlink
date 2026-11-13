# WishLink — Audit & Vulnerability Report

Living register of security, privacy, database, operational, and user experience findings.
All issues are prioritized and tracked according to `WISHLINK_GEMINI_MASTER_SPEC.md` Section 8.

## Priority Definitions
- **P0 — Release Blocker**: Core product flow broken or privacy boundary violated.
- **P1 — High**: Severe security, privacy, or functional integrity issue.
- **P2 — Medium**: Reliability, UX, or maintainability defect.
- **P3 — Low**: Visual polish, technical debt, or optimization.

---

## Active Issue Register

| Issue ID | Priority | Category | Status | Summary | Resolution Path |
|---|---:|---|---|---|---|
| `WL-DB-001` | P0 | Database / RPC | **Resolved** | `reserve_gift` rate-limit query referenced non-existent column `r.created_at` instead of `r.reserved_at` | Added forward migration `005_fix_reservation_lifecycle.sql` redefining `reserve_gift` with `r.reserved_at`. |
| `WL-PRIV-001` | P0 | Privacy / Consent | **Resolved** | `auto_share_address` in profiles caused `reserve_gift` to assign default `shared_address_id` without explicit approval | Disabled auto-share in `reserve_gift` and replaced auto-share toggle with explicit consent guarantee panel. |
| `WL-PRIV-002` | P1 | Privacy / Consent | **Resolved** | Approval UI directly updated `gift_reservations.shared_address_id` without atomic grant state or revoke RPC | Implemented server-side RPCs `approve_gift_disclosure`, `decline_gift_reservation`, and `revoke_gift_disclosure`. |
| `WL-SEC-001` | P1 | Security / Tokens | **Resolved** | Reservation ticket allowed query string token fallback `?token=...`, causing access log leakage | Extracted `resolveTokenFromUrl` prioritizing `#token=...` fragment to eliminate HTTP wire transmission. |
| `WL-TEST-001` | P1 | Testing / Architecture | **Resolved** | `tests/security.test.mjs` re-implemented IP check and token extraction locally instead of testing real production code | Extracted shared pure helpers to `lib/network-security.mjs` and `lib/token-utils.mjs` and imported in tests. |
| `WL-UX-001` | P2 | Navigation / UX | **Resolved** | Dashboard logo navigated to `/dashboard` instead of product root `/` (violating Home from Everywhere) | Pointed brand logo to `/` across layouts and added dedicated Home navigation items. |
| `WL-UX-002` | P2 | Design / M3 | **Resolved** | Bespoke styling needed coherent Material Design 3 token and component system with custom palette | Implemented M3 elevation tiers, tap targets, chips, and color role mappings in `globals.css`. |
| `WL-UX-003` | P2 | Product / Routes | **Resolved** | Missing dedicated `/about` route explaining product mission and boundaries | Created `app/about/page.tsx` with clear product explanation, no buzzwords, and factual FAQ. |
| `WL-DB-002` | P2 | Schema / DevOps | **Resolved** | Duplicate migrations existed under `lib/supabase/migrations/` and `supabase/migrations/` | Designated `supabase/migrations/` as canonical (DEC-001) while maintaining forward mirror. |

---

## Verified Audit Log

### WL-DB-001: Rate-Limit Timestamp Mismatch in `reserve_gift` (Resolved)
- **Location**: `supabase/migrations/002_reservation_system.sql:166`
- **Resolution**: Created forward migration `supabase/migrations/005_fix_reservation_lifecycle.sql` redefining `reserve_gift` with `r.reserved_at > (pg_catalog.now() - INTERVAL '15 minutes')`.
- **Verified**: SQL verified and forward migration mirrored in `lib/supabase/migrations/005_fix_reservation_lifecycle.sql`.

### WL-PRIV-001: Auto-Share Address Bypasses Explicit Consent (Resolved)
- **Location**: `supabase/migrations/002_reservation_system.sql:190-205`, `components/SortableAddresses.tsx`
- **Resolution**: Removed auto-share block from `reserve_gift`. All reservations start with `shared_address_id = NULL`. Replaced auto-share button in `components/SortableAddresses.tsx` with an explicit consent assurance card.
- **Verified**: Code updated and typechecked.

### WL-PRIV-002: Consent-Based Disclosure Protocol (Resolved)
- **Location**: `app/dashboard/notifications/page.tsx`, `supabase/migrations/005_fix_reservation_lifecycle.sql`
- **Resolution**: Added server-side RPCs `approve_gift_disclosure`, `decline_gift_reservation`, and `revoke_gift_disclosure` in migration 005. Updated `NotificationsPage` to use these RPCs instead of direct table updates.
- **Verified**: Clean compile, typecheck, and lint.

### WL-TEST-001 & WL-SEC-001: Helper Extraction & Test Coupling (Resolved)
- **Location**: `lib/network-security.mjs`, `lib/token-utils.mjs`, `tests/security.test.mjs`
- **Resolution**: Extracted production helpers into shared ESM modules. Updated both API routes and tests to consume the exact same implementations.
- **Verified**: `npm test` runs 12 tests natively across 3 suites in 104ms.

### WL-UX-001 & WL-UX-003: Home from Everywhere & About Page (Resolved)
- **Location**: `app/dashboard/layout.tsx`, `app/about/page.tsx`, `app/page.tsx`
- **Resolution**: Logo routes to `/` across all viewport sizes. Added Home links to desktop sub-bar and mobile bottom bar. Added `/about` route with real product copy.
- **Verified**: All 19 routes generated cleanly in production webpack build.
