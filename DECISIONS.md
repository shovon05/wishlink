# WishLink — Architecture & Security Decisions (ADRs)

Authoritative register of architectural, database, security, and interface decisions.
Spec Reference: `WISHLINK_GEMINI_MASTER_SPEC.md` Section 12.5

---

## DEC-001: Single Canonical Migration Directory
- **Date**: 2026-11-13
- **Status**: Accepted
- **Context**: The repository contained migration files under both `supabase/migrations/` and `lib/supabase/migrations/`.
- **Decision**: `supabase/migrations/` is designated as the sole canonical migration source for all Supabase CLI operations, migrations, and local/remote staging deployments. `lib/supabase/migrations/` is kept purely as a legacy read mirror and must never diverge from `supabase/migrations/`. All new migrations must be numbered forward monotonically (e.g. `005_fix_reservation_lifecycle.sql`).

---

## DEC-002: Strict Per-Request Consent Invariant (Disabling Auto-Share)
- **Date**: 2026-11-13
- **Status**: Accepted
- **Context**: `002_reservation_system.sql` allowed `auto_share_address` to immediately populate `shared_address_id` upon reservation creation.
- **Decision**: Strict privacy invariant enforcement. Every reservation must begin in an unapproved state (`shared_address_id = NULL`). Address disclosure must be gated on explicit, authenticated owner action per gift request. Auto-share is disabled in the database function `reserve_gift` and hidden from the user interface.

---

## DEC-003: URL Fragment Ticket Protocol for Gifter Tokens
- **Date**: 2026-11-13
- **Status**: Accepted
- **Context**: Gifter access tokens in query parameters (`?token=...`) are transmitted to web servers in HTTP `GET` requests, appearing in server access logs, reverse proxy logs, browser history, and HTTP `Referer` headers.
- **Decision**: Gifter reservation tickets will exclusively use the URL fragment hash (`#token=<token>`). Since URL fragments are never transmitted over the wire in HTTP requests, access logs and server telemetry cannot leak the secret bearer token. Query token fallbacks are rejected on newly created reservations.

---

## DEC-004: Material Design 3 Visual System & Color Role Mapping
- **Date**: 2026-11-13
- **Status**: Accepted
- **Context**: The product uses a warm bespoke luxury palette (#FAF2E9 linen, #8A5E3B mocha, #C48B54 caramel, #D96F79 rosewood, #F4C2C3 blush). The specification calls for a coherent Material Design 3 (Material You) token implementation without bloated component frameworks.
- **Decision**: Map the custom brand palette to formal Material Design 3 color roles:
  - `primary`: `#8A5E3B` (rich mocha)
  - `on-primary`: `#FFFFFF`
  - `primary-container`: `#F5EBE1`
  - `on-primary-container`: `#3E2412`
  - `secondary`: `#C48B54` (warm caramel)
  - `secondary-container`: `#FBF2E9`
  - `tertiary`: `#D96F79` (rosewood accent)
  - `tertiary-container`: `#FDE8E9`
  - `surface`: `#FAF2E9` (linen canvas)
  - `surface-container`: `#F3E8DC`
  - `surface-container-high`: `#EBDDCE`
  - `outline`: `#D8C3B0`
  - `outline-variant`: `#E8DACD`
  - `error`: `#BA1A1A`
  - `error-container`: `#FFDAD6`
  Implement M3 tokens directly in CSS variables in `globals.css` alongside Tailwind utilities. Ensure full mobile/desktop responsiveness and AA contrast.
