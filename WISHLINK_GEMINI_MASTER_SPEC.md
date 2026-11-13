# WishLink — Master Product, Engineering, Security & Development Specification

> **Document type:** Master implementation brief for Gemini / an autonomous coding agent  
> **Audit snapshot:** 13 November 2026  
> **Project root in the supplied archive:** `wishlink/local/my-app/`  
> **Primary objective:** Turn the existing WishLink application into a complete, reliable, privacy-first wishlist and gift-coordination product.  
> **Operating rule:** Inspect first, preserve what works, fix verified defects, implement missing requirements, and prove every completion with test evidence.

This document supersedes the earlier WishLink implementation brief. It incorporates the useful product and security requirements from `WISHLINK_PROJECT_SPEC.md`, the previous Gemini brief, and the supplied repository documentation, while correcting claims that do not match the current source snapshot.

**Treat this document as the target product specification. Treat the actual repository, the canonical migration chain, the deployed database schema (when safely accessible), and reproducible tests as the evidence of the current implementation.** Never assume a feature works merely because a component or SQL function exists.

---

## Table of Contents

1. [Mission and product definition](#1-mission-and-product-definition)
2. [Goals, boundaries and product principles](#2-goals-boundaries-and-product-principles)
3. [User roles and complete user journeys](#3-user-roles-and-complete-user-journeys)
4. [Product requirements](#4-product-requirements)
5. [Routes, navigation and page requirements](#5-routes-navigation-and-page-requirements)
6. [Material Design 3 visual system](#6-material-design-3-visual-system)
7. [Existing codebase: verified starting point](#7-existing-codebase-verified-starting-point)
8. [Verified audit findings and implementation priorities](#8-verified-audit-findings-and-implementation-priorities)
9. [Data model and database rules](#9-data-model-and-database-rules)
10. [Security, privacy and abuse-prevention requirements](#10-security-privacy-and-abuse-prevention-requirements)
11. [Development governance and strict agent rules](#11-development-governance-and-strict-agent-rules)
12. [Timestamped development log protocol](#12-timestamped-development-log-protocol)
13. [Implementation phases and quality gates](#13-implementation-phases-and-quality-gates)
14. [Testing strategy and acceptance criteria](#14-testing-strategy-and-acceptance-criteria)
15. [Deployment and release checklist](#15-deployment-and-release-checklist)
16. [Required deliverables and final handoff](#16-required-deliverables-and-final-handoff)
17. [Decision register starter](#17-decision-register-starter)

---

# 1. Mission and product definition

## 1.1 What WishLink is

WishLink is a privacy-first, shareable wishlist and gift-coordination website. Each user can claim a short public profile link such as:

`https://wishlink.me/shovon`

They can put this link in an Instagram story, Facebook story, social profile, personal portfolio, or send it directly to friends. Visitors open the link and see the owner's published profile and wishlist. A person who wants to gift an item can start a gift request. The owner is notified and decides whether to disclose delivery information for **that specific request**.

The central promise is:

> **A gift giver must never receive a recipient's delivery address or private contact details unless the recipient explicitly approves the exact information for that particular gift request.**

WishLink is not an online store. It organizes wishes and coordinates delivery information. The gifter purchases the item from the original retailer and arranges delivery independently.

## 1.2 Product principles

1. **Privacy before convenience.** No delivery address, phone number, private note, or secret token is public by default.
2. **Consent is specific.** Each gift request requires its own approval. Consent must not silently carry over to another gifter or another item.
3. **Real functionality.** A button, form, toggle, menu, route or notification must perform the action its label promises.
4. **No false certainty.** A reservation means intent to gift, not proof of purchase or delivery.
5. **Simple sharing.** The public profile link must be short, memorable, mobile-friendly and easy to copy/share.
6. **Coherent design.** Use Material Design 3 consistently instead of mixing unrelated visual systems.
7. **Traceable development.** Meaningful engineering work, test runs, failures, decisions and deployments must be recorded with timestamps.

---

# 2. Goals, boundaries and product principles

## 2.1 Version 1 goals

- A complete home page with a clear product explanation and real navigation.
- Google sign-in and sign-up through Supabase OAuth.
- Passkey registration and passkey sign-in.
- TOTP two-factor authentication with an actual MFA challenge.
- A unique short username/profile URL per user.
- Public profile settings and wishlist visibility controls.
- Wishlist CRUD: add, edit, remove, reorder, priority, store URL and product metadata.
- Secure product metadata extraction with a manual-entry fallback.
- Saved delivery addresses managed privately by the owner.
- Gift request creation with atomic duplicate prevention.
- Owner approval or decline for every gift request.
- Per-request selection of exactly which delivery fields to share.
- Private gifter ticket with server-enforced token access, revocation and expiry.
- In-app notifications and safe email notifications.
- A dashboard for incoming and outgoing gift activity.
- A fully responsive Material Design 3 interface, including social-media in-app browsers.
- An accessible route back to the true home page from every page.
- A transparent, timestamped development log maintained by the implementing agent.

## 2.2 Version 1 non-goals

Do not expand the first release into a large commerce platform. Unless the project owner later requests otherwise, v1 does not include:

- Payments, checkout, payment-card collection or escrow.
- In-app shipping-label purchase or courier booking.
- A social feed, likes, comments or follower system.
- Public address books or public contact details.
- Advertising trackers or third-party ad scripts.
- Group crowdfunding or partial-payment contributions.
- Automatic purchase detection from retailer accounts.

Group gifting, contributions, richer retailer integrations and advanced social features can be considered after the single-gifter workflow is secure and stable.

## 2.3 Non-negotiable privacy decisions

- **Always ask for each gift in v1.** Do not automatically share an address when a reservation is created. The existing `auto_share_address` behaviour must be disabled or removed from the v1 flow because it bypasses the interaction the product is built around.
- Do not request browser geolocation to discover a user's home address. The owner must add or choose a saved delivery address themselves.
- A gifter never receives the owner's address just by opening the profile, reserving an item, or receiving an email.
- The owner must see a preview of the exact fields before approving disclosure.
- The owner must be able to revoke future access. Explain that revocation prevents future retrieval from WishLink but cannot erase information the gifter has already copied, screenshotted or otherwise retained.

---

# 3. User roles and complete user journeys

## 3.1 Roles

| Role | Permissions and responsibilities |
|---|---|
| **Owner** | Authenticated account holder who edits their profile, wishlist, addresses, privacy settings and gift-request decisions. |
| **Gifter** | A person who starts a gift request. V1 should preserve the existing low-friction guest reservation capability unless a security test proves it cannot be maintained safely. A gifter may optionally identify themselves. |
| **Visitor** | Anyone viewing a public profile without starting a gift request. They can browse only the fields explicitly published by the owner. |
| **Administrator / service process** | Trusted operational actor for scheduled expiry, email delivery and support operations. Must not be implemented as a public client role. |

An account owner can also become a gifter on another person's wishlist. A person does not need a WishLink account merely to view a public profile. Do not add mandatory gifter sign-up without a documented product decision and a clear user benefit.

## 3.2 Journey A — Discover WishLink and create an account

1. A person opens `/` from a browser, portfolio or social link.
2. The home page explains what WishLink does and how address approval works.
3. The person selects **Continue with Google**.
4. Supabase completes the OAuth flow and returns through `/auth/callback`.
5. A first-time account is sent to `/onboarding` to claim a username and finish the minimum profile setup.
6. The user lands on `/dashboard` and sees their profile link, quick actions and pending activity.
7. The user can later register a passkey and enable TOTP 2FA in Security settings.

## 3.3 Journey B — Create and share a wishlist

1. The owner adds an item by pasting a retailer URL or entering details manually.
2. WishLink attempts to extract title, image, price and currency using a safe server-side metadata extractor.
3. The owner reviews and edits the extracted fields before saving.
4. The owner sets priority, optional note, category and sort order.
5. The owner copies the short profile link, uses native share where supported, or opens the QR code.
6. The public profile shows only the items and fields allowed by the profile visibility settings.

## 3.4 Journey C — A gifter starts a request

1. A gifter opens `/{username}`.
2. The gifter opens an available item and selects **Gift this** / **Reserve this gift**.
3. The server checks whether the item is still available and atomically creates a request.
4. The item becomes `reserved` so another gifter cannot reserve it concurrently.
5. The gifter receives a private tracking ticket. Explain that this is an intent/reservation, not a completed purchase.
6. The owner receives an in-app notification and, if configured, a safe email alert.

The guest gifter flow must be designed carefully: the ticket contains a high-entropy bearer secret, while the database stores only a hash. The raw token must not be placed in ordinary query parameters, logs, email bodies, analytics or referrer headers.

## 3.5 Journey D — Owner approves exactly what to share

1. The owner opens the request in `/dashboard/notifications` or `/gifts`.
2. The owner sees the item, gifter identity (or anonymous status), request time and current status.
3. The owner selects one saved delivery address or creates a new one.
4. The owner chooses the exact fields to share, for example:
   - Delivery address (required for physical delivery).
   - Recipient name (optional).
   - Delivery phone number (optional).
   - Delivery instructions (optional).
   - Email only if there is a demonstrated delivery need and the owner explicitly selects it.
5. The owner sees a clear disclosure preview and confirms **Approve and share selected details**.
6. The server verifies ownership, request state and any required step-up authentication before creating a request-specific disclosure grant.
7. Only the authorized gifter ticket can retrieve the approved fields while the grant is active.

## 3.6 Journey E — Gifter sends and owner confirms the gift

1. The gifter purchases from the external retailer and arranges delivery.
2. The gifter may select **I've sent the gift**. This is a gifter-reported event, not proof from the retailer.
3. The owner receives a status notification and can select **Received** after the gift arrives.
4. On completion, delivery details are no longer retrievable through WishLink and the item becomes `gifted`.
5. The owner can separately cancel a request or revoke the disclosure grant when appropriate.

---

# 4. Product requirements

## 4.1 Public profile and short link

Each profile should support:

- Unique case-insensitive username.
- Display name (the current schema calls this `pet_name`; avoid renaming it without a deliberate migration).
- Avatar and optional short bio.
- Public profile URL: `/{username}`.
- Copy link, native share and QR-code actions.
- Open Graph and Twitter/social preview metadata using public profile information only.
- Responsive wishlist presentation.
- Optional public profile visibility modes:
  - `public`: anyone with the link can view.
  - `signed_in`: authenticated users only.
  - `private`: only the owner can view their profile.
- A profile setting to disable search-engine indexing. A non-public profile must never be indexable.
- Meaningful profile-empty, unavailable, reserved and not-found states.

Enforce visibility on the server/database. A hidden frontend card is not access control. Use `noindex` and correct metadata for private/non-indexable pages.

### Username rules

The current onboarding code accepts 3–30 letters, numbers and underscores, rejects the `user_` prefix, and has a reserved-word list. Preserve that format initially unless the entire route, validation and database design are deliberately updated together.

Centralize validation and the reserved-word list. The list must include every static root route, including at least `api`, `auth`, `login`, `logout`, `signup`, `register`, `dashboard`, `onboarding`, `mfa-challenge`, `privacy`, `terms`, `about`, `demo`, `reservations`, `settings`, `help`, `support`, `contact` and any new static route. Do not maintain separate inconsistent client and server lists.

## 4.2 Wishlist item model and management

Each wish should support:

| Field | Requirement |
|---|---|
| Title | Required; owner-editable. |
| Product/store URL | Required; validated HTTP/HTTPS URL. |
| Product image | Optional; validated remote or uploaded image. |
| Price | Optional; preserve a numeric amount and ISO currency code where possible. |
| Note | Optional; owner-controlled, never used for public data unless intentionally published. |
| Category | Optional; owner-selected or inferred but always editable. |
| Priority | `most_wanted` or `nice_to_have` (or equivalent); show most-wanted items first. |
| Sort order | Stable, owner-controlled order; use the existing batch reorder RPC after verifying it. |
| Availability | `available`, `reserved`, `gifted`. |

Owner actions:

- Add by URL or manual entry.
- Preview extracted metadata before saving.
- Edit every field.
- Delete with confirmation.
- Reorder with drag-and-drop and keyboard-accessible alternatives.
- Change priority.
- Mark an item as gifted only through a valid lifecycle action or explicit owner action.
- Open the original retailer link in a safe new tab where appropriate.

A reservation must prevent another active reservation for the same item. Do not let the public UI change reserved/gifted status directly.

## 4.3 Product metadata extraction

The existing `/api/extract-metadata` route and Cheerio-based extractor are valuable and should be hardened rather than replaced.

Requirements:

- Accept only `https:` by default; allow `http:` only if there is a documented reason.
- Reject credentials in URLs, unsupported ports, localhost, private/link-local/reserved IPs, cloud metadata destinations, IPv4-mapped IPv6 bypasses and non-web schemes.
- Validate every redirect destination.
- Prevent DNS rebinding/TOCTOU: checking DNS and then letting an ordinary `fetch()` resolve the hostname again is not sufficient. Pin the validated destination IP or use a safe outbound fetch layer that validates the actual connected peer.
- Bound connection time, total request time, redirect count and response size.
- Accept only HTML/XHTML content types for parsing.
- Do not execute remote scripts or render fetched HTML.
- Parse JSON-LD and Open Graph metadata defensively; treat all extracted content as untrusted.
- Validate image URLs independently. Do not make the browser fetch arbitrary unsafe schemes.
- Provide a clean manual-entry fallback when the retailer blocks requests or metadata is incomplete.
- Replace the current per-process in-memory rate-limit `Map` with a durable/shared limiter before production traffic. Parse client IP information only through trusted platform proxy headers.
- Add tests for redirect loops, invalid URLs, IPv4/IPv6 edge cases, DNS rebinding strategy, large response bodies, timeout, non-HTML content, malformed metadata and manual fallback.

Do not promise that every retailer can be scraped. Retailers may block automated requests or provide incomplete metadata.

## 4.4 Gift request lifecycle and duplicate prevention

Use explicit, server-enforced lifecycle states. Keep item availability, gift-request status and disclosure-grant status as separate concepts; do not overload one `status` column with unrelated meaning.

### Suggested request states

- `pending_owner_approval`
- `approved`
- `sent_by_gifter` (reported by gifter)
- `completed` / `received`
- `declined`
- `cancelled`
- `expired`

### Suggested disclosure states

- `not_shared`
- `active`
- `declined`
- `revoked`
- `expired`

### State-transition rules

| Event | Request result | Item result | Disclosure access |
|---|---|---|---|
| Gifter creates request | `pending_owner_approval` | `reserved` | None |
| Owner approves | `approved` | `reserved` | Only selected fields become available to that request's gifter |
| Owner declines | `declined` | `available` | Never available |
| Gifter cancels pending request | `cancelled` | `available` | Never available |
| Owner revokes disclosure | Request remains visible with revoked share state; owner may reapprove or cancel | Remains reserved until an explicit lifecycle action | Immediately blocked server-side |
| Gifter marks sent | `sent_by_gifter` | `reserved` | Hide or expire disclosure according to the approved lifecycle policy; record this as a gifter-reported event |
| Owner confirms receipt | `completed` | `gifted` | Immediately blocked |
| Pending request reaches deadline | `expired` | `available` | Never available |
| Approved disclosure reaches deadline | Request expires or requires fresh owner action according to the documented policy | Reconcile safely; never leave an indefinitely held item | Immediately blocked |

The implementation may choose a simpler equivalent state model, but it must preserve these independent security facts and all transitions must be documented in `DECISIONS.md`.

### Time limits

- Pending requests: expire after 7 days without owner action.
- Approved disclosure: default 14 days after approval.
- Allow the owner to select a share duration within a safe bounded range, recommended 3–30 days.
- Use database time, not client time, for all expiry and authorization checks.
- Expiry must be reliably executed by a trusted scheduled process or database job. A UI visit must not be required to clean up expired reservations.

### Atomicity and concurrency

- Create request, lock item and create private ticket secret in one database transaction/RPC.
- Protect against two concurrent gifters attempting the same item.
- Validate that a user cannot reserve their own item when authenticated.
- Add a database constraint/locking strategy that enforces one active reservation per item.
- Do not rely only on a client-side “Available” check.

## 4.5 Consent-based disclosure and address book

This is WishLink's most sensitive product capability.

### Address book

- The owner can add, edit, label, mark default, reorder and delete saved delivery addresses.
- Address records are visible only to their owner through normal app access.
- Support optional recipient name, phone number and delivery instructions where needed.
- Do not request the browser's current location. Do not infer a home address from geolocation.
- Do not expose address data in a public profile query, page metadata, notification payload, analytics event or log.

### Approval interface

Before approval, show:

- Which item is being gifted.
- Who is requesting (name/contact only if voluntarily supplied; otherwise “Anonymous gifter”).
- Which exact address is selected.
- Individual switches for optional delivery fields.
- How long the gifter will be able to retrieve the selected information.
- A plain-language statement that the gifter can copy or retain information once viewed.

Use two distinct actions: **Approve and share** and **Decline request**. Do not use ambiguous labels like “Continue”.

### Server-side requirements

- Approval must be a server-controlled operation (secure route handler or RPC) that confirms the authenticated user owns the wishlist item and the reservation is pending/eligible.
- Never allow direct client updates to `shared_address_id` to act as a complete consent protocol.
- Persist the consent decision, selected field flags, selected address reference or immutable disclosure snapshot, approval time, expiry time and actor.
- Consider a private, reservation-specific snapshot so later edits to the saved address do not silently change the information already approved for that gift.
- A gifter's bearer ticket must validate both reservation ID and a high-entropy random secret. Store only a cryptographic hash of the secret.
- The read endpoint/RPC must check request status, disclosure status, expiry, ownership linkage, token hash and allowed fields on every read.
- `Cache-Control: no-store` and a restrictive `Referrer-Policy` are required for private ticket/detail responses.
- No address/contact values in server logs, telemetry, error messages, email or notification content.
- Revoke must take effect on the next server-side read, not merely hide the information in React state.
- Record a privacy-safe audit event for each approval, disclosure view, revocation, expiry and completion.

**Important limitation to communicate honestly:** WishLink can stop further retrieval after revocation. It cannot remotely erase an address that a gifter already copied, photographed or remembered.

## 4.6 Notifications and activity center

Required event types include:

- New gift request for owner.
- Owner approved or declined request for gifter.
- Owner revoked or renewed disclosure access.
- Gifter marked gift sent.
- Owner confirmed gift received.
- Request cancelled or expired.

Requirements:

- In-app notification center with accurate unread count.
- Supabase Realtime for new notifications, with reliable initial fetch and reconnect handling.
- Do not mark every notification read merely because a page mounted unless that is the intended and clearly tested interaction. Prefer marking read when viewed or explicitly dismissed.
- Email notifications may use the existing Resend integration.
- Email body must contain a safe summary and a link back to WishLink only. Never include address, phone, delivery instructions, access token or private notes.
- Make webhook delivery idempotent so retries do not send duplicate emails.
- Validate webhook authentication with a non-empty configured secret and compare secrets safely.
- Do not expose provider API keys or service-role keys to browser code.
- Add notification preferences only after basic reliable delivery works.

## 4.7 Authentication and account security

### Google OAuth

- Continue with Google is the primary sign-in/sign-up method for v1.
- Preserve Supabase Auth and the existing callback route.
- Validate the post-login redirect with a strict same-origin relative path allowlist. Do not rely solely on string prefix checks.
- Handle provider cancellation, denied consent, expired code, missing profile and onboarding errors.
- Configure the exact deployed OAuth callback URL in Supabase and Google Cloud; document it without publishing secrets.

### Passkeys

- Allow passkey sign-in from the login page.
- Allow passkey registration from Security settings.
- List registered passkeys with device label and last-used information if the provider exposes it.
- Allow rename/delete only after confirming the operation with the provider.
- Prevent removal of the last viable authentication method.
- Detect unsupported browsers and provide Google sign-in as a clear alternative.
- Test registration and sign-in on real supported browsers/devices; the presence of `signInWithPasskey()` in source is not proof of end-to-end availability.

### TOTP two-factor authentication

- TOTP enrollment must show a QR code and manual key only during setup.
- Require successful verification before marking TOTP as enabled.
- Provide a working `/mfa-challenge` page and guard against redirect loops.
- Require step-up verification for sensitive operations such as address access/mutations, approving disclosure, changing security settings and deleting the account.
- Recovery codes are desirable for v1: generate 10 one-time codes on the server, display them once, store only salted/strong hashes, invalidate each after use and replace old codes on regeneration. If this cannot be implemented safely with the current auth provider, document the limitation and provide a tested account recovery path instead of shipping insecure homemade codes.
- Verify the actual assurance semantics for Passkey vs TOTP. Do not claim that passkey automatically satisfies or bypasses MFA unless the Supabase/provider configuration and tests prove it.
- Disabling 2FA or removing a factor requires reauthentication/step-up verification.

### Sessions and account recovery

- Show active sessions/devices where provider support permits.
- Provide sign out current session and sign out everywhere.
- Do not let a user remove their last usable sign-in method.
- Handle stale/expired sessions gracefully.

## 4.8 Profile, privacy and account settings

Add/complete the following settings:

- Edit display name, username (with availability check), avatar and bio.
- Visibility: Public / Signed-in only / Private.
- Search-engine indexing preference.
- Block new gift requests switch.
- Surprise Mode (the repository already has a `surprise_mode` field and a toggle component; verify semantics and privacy implications).
- Notification preferences.
- Address book.
- Security and passkey management.
- Data export (JSON) and account deletion with reauthentication.

Account deletion must remove personal profile, wishlist and address data according to the retention policy. If some gift audit records must remain for abuse prevention or integrity, anonymize them and explain what remains. Do not retain address/contact snapshots after the defined disclosure retention period.

## 4.9 Home page and About page

The `/` route is a complete product entry point, not a static placeholder.

### Signed-out home

- Responsive app bar with WishLink logo, About, Privacy, Terms and Sign in.
- Clear hero statement describing a personal wishlist link and consent-based gifting.
- Primary CTA: **Create your WishLink** / **Continue with Google**.
- A realistic, clearly labelled preview of a public profile and wishlist.
- Three-step explainer: create your wishlist → share your link → approve delivery details.
- Privacy explanation emphasizing that addresses are never published.
- Feature summary: universal product links, gift reservation, duplicate prevention, owner-controlled delivery sharing.
- FAQ with factual answers.
- Footer with About, Privacy, Terms and support/contact route.

### Signed-in home

- Welcome and a clear **Open dashboard** action.
- Public profile link with copy/share/QR controls.
- Pending gift-request count and one-click navigation to requests.
- Quick actions: Add a wish, Edit profile, Manage addresses.
- Short preview of most-wanted items.

`/dashboard` remains the main signed-in workspace. Do not make the root route inaccessible to signed-in users.

### About

Explain the product, how gifting works, the consent model, and what WishLink does not do. Avoid fake founder stories, fake statistics, fake testimonials or unsupported security claims.

---

# 5. Routes, navigation and page requirements

Preserve the existing Next.js App Router layout and add routes only where needed. Avoid creating duplicate routes for features already implemented.

| Route | Access | Required purpose |
|---|---|---|
| `/` | Public / signed-in variant | Fully functional home page. |
| `/about` | Public | Product and workflow explanation. |
| `/login` | Public | Google sign-in, Passkey sign-in, clear errors and legal links. |
| `/auth/callback` | Public callback | Secure OAuth code exchange and safe redirect. |
| `/auth/signout` | Authenticated action | Revoke session and return safely. |
| `/onboarding` | Authenticated | Claim username and minimum profile setup. |
| `/{username}` | According to visibility | Public/shareable profile and published wishlist. |
| `/{username}/gift/{itemId}` | Public or signed-in according to final gifter policy | Start a gift request. |
| `/dashboard` | Owner | Wishlist studio and account overview. |
| `/dashboard/gifts` | Owner / gifter | Unified incoming and outgoing gift-request history with status filters and actions. Reuse existing reservation data rather than creating a second source of truth. |
| `/dashboard/profile` | Owner | Edit public-facing profile. |
| `/dashboard/addresses` | Owner + step-up for sensitive access | Manage delivery addresses. |
| `/dashboard/notifications` | Owner | Incoming requests and approval/decline/revoke actions. |
| `/dashboard/security` | Owner + step-up | Passkeys, TOTP, recovery and session management. |
| `/dashboard/privacy` | Owner | Visibility, gift-request preferences, export and deletion. |
| `/dashboard/notifications/preferences` | Owner | Email/in-app preferences if implemented. |
| `/reservations/{reservationId}` | Authorized gifter ticket | View request status and approved details only. |
| `/privacy` | Public | Accurate privacy policy. |
| `/terms` | Public | Accurate service terms. |
| `/demo` | Public | Explicitly labelled demonstration only; never production fake data. |
| `*` | Public | Helpful 404 with a working Home link. |

Some of these routes already exist in the supplied snapshot. Inspect before creating them.

## 5.1 Hard requirement: Home from everywhere

Every route must expose a visible, keyboard-accessible route back to `/`.

- The global brand/logo must link to `/`, not `/dashboard`.
- The dashboard shell must also include a real Home destination.
- Mobile navigation must include Home or an always-visible brand/home control.
- Public profile, login, onboarding, gift ticket, reservation, settings, privacy and error pages must all provide a Home route.
- Do not rely on browser back history.
- Add an automated route-level test that verifies the shared shell or page contains a valid link to `/` for every relevant route.

The current dashboard brand link points to `/dashboard`; change this so it is not mistaken for the actual product home page.

---

# 6. Material Design 3 visual system

## 6.1 Design direction

Use **Material Design 3 / Material You** as the single product-wide design system. The intended result is clean, modern, calm, credible and privacy-focused. It should feel like a carefully built product, not a themed landing-page template.

The current UI has a bespoke warm “cotton/mocha” theme and some custom Material-like elevation utilities. That is not a consistent Material 3 implementation. Replace the mixed visual language with a coherent token and component system after the core flows are secure.

## 6.2 Implementation approach

- Keep the existing Next.js, React and Tailwind CSS v4 stack.
- Implement Material 3 color roles and design tokens using CSS variables/Tailwind unless there is a documented reason to add a UI library.
- Do not add MUI or another component framework simply for the name. If MUI is proposed, record the dependency, SSR integration, bundle and migration trade-offs in `DECISIONS.md` first.
- Choose one seed color, generate a consistent light/dark palette, and document the choice.
- Use accessible Material color roles: primary, on-primary, secondary, tertiary, surface, surface-container, outline, error and their on-colors.
- Meet WCAG AA contrast for text and controls.

## 6.3 Components and patterns

Use consistent Material patterns for:

- Top app bar and adaptive navigation.
- Buttons: filled, tonal, outlined and text.
- Cards and surface containers.
- Text fields, selects, switches and form validation.
- Chips for priority and lifecycle status.
- Dialogs and confirmation sheets.
- Menus, tabs and navigation rail/drawer.
- Snackbars/toasts for transient feedback.
- Floating action button for the primary Add Wish action where appropriate.
- Loading indicators, skeletons and empty/error states.

## 6.4 Responsive behaviour

- Mobile: navigation bar / compact app bar; optimize for Instagram and Facebook in-app browsers.
- Tablet: navigation rail where appropriate.
- Desktop: navigation drawer or persistent navigation and a clear content grid.
- Test narrow widths, keyboard navigation and browser zoom.
- Use touch targets around 44–48 CSS px where practical.
- Support reduced motion and visible focus styles.
- Ensure dialogs fit small mobile viewports and never hide the primary action behind the keyboard.

## 6.5 Visual quality rules

- No random gradients, ornamental flourishes or stacked shadows on every surface.
- Avoid excessive rounded cards, decorative badges and inconsistent icon weights.
- Use a predictable spacing, typography, shape and elevation scale.
- Do not use a display serif font as the main interface typeface unless the design is explicitly justified and still follows M3 typography hierarchy.
- Keep color, typography and density consistent across home, About, auth, dashboard, profile and ticket pages.
- Dark mode must be deliberately designed, not a simple inversion.

## 6.6 Copy and content rules — strict

- No lorem ipsum, filler sentences, fake testimonials, fake user counts or invented activity.
- Do not use generic AI-style claims such as “revolutionary”, “unleash”, “supercharge”, “seamless experience” or “next-level”.
- Never claim “100% secure”, “unhackable” or “zero risk”.
- Use direct language that describes the actual action: “Share your address with Alex?” / “Your address is not visible on your public profile.”
- Do not put internal implementation terms in user-facing copy.
- Keep terminology consistent: wishlist, wish item, gift request, gifter, delivery address, approval, disclosure, revoke.
- Keep product strings centralized so English and Bangla localization can be added without rewriting components.
- All content must be proofread. No broken grammar, mixed casing or untranslated debug strings.

---

# 7. Existing codebase: verified starting point

## 7.1 Project location and stack

The archive contains an existing application at `wishlink/local/my-app/`. Work inside that directory. Do not create a new scaffold beside it or rewrite the application from scratch.

Verified from the supplied `package.json` and project files:

- Next.js `16.3.6` with App Router.
- React / React DOM `19.2.8`.
- TypeScript.
- Tailwind CSS v4.
- Supabase Auth, PostgreSQL, RLS and Realtime via `@supabase/ssr` and `@supabase/supabase-js`.
- `@dnd-kit` for sortable wishlist/address interactions.
- `cheerio` for metadata parsing.
- `resend` for transactional email.
- `lucide-react` icons.
- Node.js native test runner (`node --test`).
- GitHub Actions CI for typecheck, lint, tests and build.

Do not migrate frameworks, database providers or auth systems without a verified reason and explicit decision record.

## 7.2 Existing implementation files

| Feature | Existing path(s) |
|---|---|
| Home page | `app/page.tsx` |
| Login: Google and Passkey | `app/(auth)/login/page.tsx` |
| OAuth callback | `app/auth/callback/route.ts` |
| Sign-out route | `app/auth/signout/route.ts` |
| MFA challenge | `app/mfa-challenge/page.tsx` |
| Onboarding | `app/onboarding/` |
| Public profile | `app/[username]/page.tsx` |
| Gift request start | `app/[username]/gift/[itemId]/page.tsx` |
| Reservation ticket | `app/reservations/[reservationId]/page.tsx` |
| Dashboard | `app/dashboard/` |
| Saved addresses | `app/dashboard/addresses/page.tsx`, `components/SortableAddresses.tsx` |
| Notifications and owner approval UI | `app/dashboard/notifications/page.tsx` |
| Security / TOTP | `app/dashboard/security/page.tsx`, `components/TotpSetup.tsx` |
| Wishlist add/edit/reorder | `components/AddWishlistItemForm.tsx`, `components/SortableWishlist.tsx` |
| Gifter reservation widget | `components/MyGiftReservations.tsx` |
| Reservation form | `components/GiftReservationForm.tsx` |
| Share profile | `components/ShareProfileButton.tsx` |
| Surprise mode | `components/SurpriseModeToggle.tsx` |
| Metadata extractor | `app/api/extract-metadata/route.ts` |
| Notification webhook | `app/api/webhooks/notification-created/route.ts` |
| Privacy and terms | `app/privacy/page.tsx`, `app/terms/page.tsx` |
| Supabase clients | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts` |
| SQL migration chain | `supabase/migrations/001_initial_schema.sql` through `004_security_hardening.sql` |
| Existing tests | `tests/security.test.mjs` |
| CI workflow | `.github/workflows/ci.yml` |

## 7.3 Migration directory warning

There are duplicate/legacy migration locations in the archive:

- `supabase/migrations/` — this is the canonical migration path documented by the root `README.md`; it contains versioned migrations `001` through `004`.
- `lib/supabase/migrations/` — contains duplicate copies of those versioned migrations and an older `_initial_schema.sql` file.

The root README says to apply `supabase/migrations/001` through `004` in order. Keep that as the canonical path unless the actual Supabase CLI configuration proves otherwise. Do not apply both folders. Do not apply the old `lib/supabase/migrations/_initial_schema.sql` on top of the versioned chain. It is legacy documentation/schema material and is not equivalent to the full current chain.

Before changing migration files, verify the actual Supabase CLI configuration, migration history table and the current deployed schema if safe access is available. Never edit an already-applied migration to “fix” a production database; add a new versioned migration.

## 7.4 Existing tests and baseline evidence

The supplied `tests/security.test.mjs` contains unit tests for private/reserved IP detection and reservation token URL parsing. A static test run against the extracted source snapshot completed with **10 tests passing and 0 failing**.

This does not prove the application works end to end. The current tests do not execute the SQL migration against PostgreSQL, prove RLS policies, test concurrent reservations or exercise full browser flows. The `created_at`/`reserved_at` SQL mismatch described below is not detected by the present unit tests.

The existing 10 passing unit tests are narrow: `tests/security.test.mjs` locally redefines the IP-validation and token-parsing logic instead of importing the production route implementation. Gemini must correct this test arrangement so tests exercise the real helpers. The current archive's complete TypeScript/lint/build baseline has not been established in this specification. Gemini must run those commands inside the real project after checking Node/dependency availability and record the actual results in `DEVELOPMENT_LOG.md`.

## 7.5 Do not repeat stale audit claims

The supplied `PROJECT_DOCUMENTATION.md` and Claude-generated audit include findings that were true for an older state or were based on the older `_initial_schema.sql`. In the current snapshot:

- `/mfa-challenge` **exists**.
- `/auth/signout` **exists**.
- `public.notifications` is created by `supabase/migrations/003_notifications.sql`.
- `components/MyGiftReservations.tsx` is imported and rendered by `app/dashboard/layout.tsx`; it is not orphaned.
- The root layout already places `siteName` inside `openGraph`, so the old `Metadata.siteName` type error claim is not applicable to this snapshot.
- The current root migration chain is more complete than the older `_initial_schema.sql` file.

Do not recreate or “fix” these as missing features. Inspect their real behaviour and tests instead.

---

# 8. Verified audit findings and implementation priorities

The following findings are based on static inspection of the supplied 13 November 2026 source archive. They are a starting audit, not a substitute for running the database migrations and application tests.

Severity definitions:

- **P0 — Release blocker:** core flow cannot work or privacy boundary is violated.
- **P1 — High:** serious security/privacy or functional gap; fix before public release.
- **P2 — Medium:** reliability, maintenance or UX issue; fix before broad release where relevant.
- **P3 — Low:** polish or technical debt.

| ID | Priority | Verified observation | Main evidence | Required action |
|---|---:|---|---|---|
| `WL-DB-001` | P0 | `gift_reservations` defines `reserved_at`, but the rate-limit query inside `reserve_gift` reads `r.created_at`. The query references a column not declared by the current migration. | `supabase/migrations/002_reservation_system.sql` around lines 11–24 and 160–167. | Add a new migration or correct the function in a new migration to use the actual timestamp column (likely `reserved_at`); execute against a test database and prove reservation succeeds. Do not merely change the old migration if it may already be applied. |
| `WL-PRIV-001` | P0 | `auto_share_address` can cause `reserve_gift` to assign a default `shared_address_id` during reservation creation. This bypasses the per-request approval interaction when enabled. | `supabase/migrations/001_initial_schema.sql`, `002_reservation_system.sql` around the auto-share block; `app/dashboard/addresses/page.tsx`; `components/SortableAddresses.tsx`. | Remove/disable auto-share in v1. Require owner approval for every reservation and verify the default is false in both schema and application. |
| `WL-PRIV-002` | P1 | Current approval UI directly updates `gift_reservations.shared_address_id`. There is no complete per-field disclosure record or dedicated non-destructive revocation lifecycle in the visible flow. | `app/dashboard/notifications/page.tsx` around `handleShareAddress`; `supabase/migrations/002_reservation_system.sql`. | Implement a server-side approval operation, disclosure state, exact field selection, approval/expiry/revoke timestamps, privacy-safe audit events and immediate server-side access checks. |
| `WL-SEC-001` | P1 | Reservation ticket accepts a query-string token as fallback. Query tokens can appear in browser history, access logs, telemetry and referrer contexts. | `app/reservations/[reservationId]/page.tsx` token parsing; `tests/security.test.mjs` query fallback test. | Use URL fragment or a safer one-time exchange. Remove query fallback after a migration/compatibility plan; update tests. Clear the fragment from the visible URL after safely capturing the token if the chosen flow permits. |
| `WL-SEC-002` | P1 | Metadata extractor validates DNS then performs a regular `fetch()`. DNS may resolve differently at connection time (TOCTOU/DNS rebinding). Redirect destinations are manually validated, but the actual socket destination must also be pinned/verified. | `app/api/extract-metadata/route.ts`, `validateHostname()` and `fetchSafeHtml()`. | Use a fetch transport that pins the verified public IP or validates the actual peer. Test redirect and rebinding cases. |
| `WL-OPS-001` | P2 | Metadata rate limiter is a process-local in-memory `Map`, which is not reliable across serverless instances and can reset on cold starts. | `app/api/extract-metadata/route.ts`, top-level `rateLimitMap`. | Replace with shared/durable rate limiting and trusted client-IP handling before production. |
| `WL-OPS-002` | P2 | `sweep_expired_reservations()` is `SECURITY DEFINER` and granted to `authenticated`; review whether any signed-in user should be able to trigger a global expiry sweep. | `supabase/migrations/004_security_hardening.sql`, function and grant. | Prefer a trusted scheduled job/service-only execution or explicitly constrain/authenticate the operation. Test permissions. |
| `WL-OPS-003` | P2 | The expiry-sweeper SQL function exists, but no in-repository schedule configuration is visible in the supplied snapshot. An external Supabase Cron/job may exist, but it is not proven by the archive. | `supabase/migrations/004_security_hardening.sql`; no scheduler configuration found in the inspected project files. | Verify the actual staging/production schedule. If absent, configure a trusted scheduled invocation and record its environment and monitoring. |
| `WL-DB-002` | P2 | Duplicate versioned migration copies exist under `lib/supabase/migrations/` and `supabase/migrations/`, alongside the legacy `_initial_schema.sql`. | Archive tree and `README.md`. | Keep one canonical migration path, document it, and deprecate/remove duplicate artifacts only after confirming no tooling depends on them. |
| `WL-SEC-003` | P2 | `private.gift_reservation_secrets` includes an `access_token` compatibility field, and `get_shared_address` still contains a comparison path for it in addition to the hash. | `supabase/migrations/002_reservation_system.sql`. | Verify whether legacy plaintext token compatibility is needed. Migrate old records safely and remove plaintext token acceptance/storage when possible. Never log token values. |
| `WL-TEST-001` | P1 | The security test file redefines IP-validation and token-parsing helpers instead of importing and exercising the production implementation. The tests can pass while the route code behaves differently. | `tests/security.test.mjs` versus `app/api/extract-metadata/route.ts` and `app/reservations/[reservationId]/page.tsx`. | Extract security-critical pure helpers into shared production modules and test those exact functions; add route/RPC integration tests. |
| `WL-UX-001` | P2 | Dashboard logo points to `/dashboard`, not the true product home `/`. | `app/dashboard/layout.tsx`. | Add a persistent Home destination and make the brand/home control route to `/` on every page. |
| `WL-UX-002` | P2 | Current styling is a bespoke cotton/mocha design with a few Material-like elevation classes, not a coherent M3 token system. | `app/globals.css` and page/component styles. | Replace with one accessible, responsive Material Design 3 system after critical flows are stable. |
| `WL-UX-003` | P2 | Existing source includes no `/about`, profile-editing route, or complete privacy-settings route in the route inventory. Profile visibility/noindex and the necessary profile fields are not represented in the current base schema. | `app/` route inventory and `supabase/migrations/001_initial_schema.sql`. | Add missing pages and additive schema changes; enforce settings server-side. |
| `WL-AUTH-001` | P2 | Google OAuth, Passkey sign-in/registration and TOTP components exist, but full passkey management, recovery-code lifecycle and sensitive-action step-up still require end-to-end verification. | `app/(auth)/login/page.tsx`, `app/dashboard/security/page.tsx`, `components/TotpSetup.tsx`, `app/mfa-challenge/page.tsx`. | Complete and test each lifecycle; do not equate code presence with working production authentication. |
| `WL-NOTIF-001` | P2 | Notification webhook and Resend code exist; delivery configuration, webhook idempotency, retry behaviour and all lifecycle email events still need verification. | `app/api/webhooks/notification-created/route.ts`, `supabase/migrations/003_notifications.sql`. | Verify external webhook setup and make safe, idempotent delivery. |

## 8.1 Important migration detail

The current `supabase/migrations/002_reservation_system.sql` defines the timestamp column as `reserved_at` but queries `r.created_at` inside `reserve_gift`. This is a confirmed static schema/function mismatch. The first database task must fix it with a forward migration and a real SQL integration test.

Do not confuse this with Claude's older claim that the current canonical chain is missing the notifications table or RPC functions. The versioned migrations `002` and `003` do define the reservation RPCs and notification table. The legacy `_initial_schema.sql` is not the full current chain.

---

# 9. Data model and database rules

## 9.1 Existing schema concepts

The canonical migration chain already contains these core entities (exact columns must be rechecked against the database before modifying):

- `profiles`: `id`, `username`, `pet_name`, `avatar_url`, `surprise_mode`, `auto_share_address`, `created_at`.
- `addresses`: `id`, `user_id`, `label`, `full_address`, `priority`, `is_default`, `created_at`.
- `wishlist_items`: `id`, `user_id`, `product_url`, `title`, `image_url`, `price`, `price_amount`, `price_currency`, `category`, `sort_order`, `status`, `created_at`.
- `gift_reservations`: `id`, `wishlist_item_id`, `reserved_at`, `expires_at`, `is_anonymous`, `gifter_contact`, `shared_address_id`, `status`, `cancelled_at`, `completed_at`.
- `private.gift_reservation_secrets`: reservation ID and token hash, with a legacy compatibility field that must be reviewed.
- `notifications`: owner, reservation, notification type, created/read timestamps.

## 9.2 Additive schema direction

Do not replace the data model wholesale. Plan additive migrations to support only the verified gaps, likely including:

- Profile bio, display settings, visibility and search indexing preference.
- `gift_requests_enabled` / block-request preference.
- Per-request consent/disclosure status, selected field flags and timestamps.
- Reservation-specific disclosure snapshot or immutable selected data reference.
- Owner-visible audit events without storing duplicated address strings in the log.
- Optional address recipient name, phone and delivery instructions.
- Gifter-reported sent timestamp/event.
- Notification delivery/idempotency state if required.
- Recovery code hashes if a secure implementation is selected.

Use the names that fit the current schema and explain any deviation in `DECISIONS.md`.

## 9.3 Database engineering rules

- Apply migrations in the documented order and through one canonical path.
- Add new migration files for schema changes; never rewrite an applied migration to repair a live database.
- Enable RLS on every user-owned or private table.
- Revoke default privileges and grant only the operations needed by each role.
- Every `SECURITY DEFINER` function must set a safe `search_path`, validate actor identity, validate ownership and input, and have minimum `EXECUTE` grants.
- Public/anonymous roles must not have direct SELECT access to private addresses, private token tables, audit details or notifications.
- Use server-side authorization as well as RLS; the UI cannot be the only access barrier.
- Use constraints/indexes for invariants and query paths.
- Verify all column names referenced by functions, triggers, views and queries against the actual schema.
- Prefer RPCs for transactional state changes, consent and cross-table invariants.
- Use database time for expiry.
- Make migration scripts re-runnable where appropriate, but do not hide failed migration execution.
- Include rollback or recovery notes for risky schema changes.

## 9.4 Data retention

- Pending requests expire after the defined pending window.
- Disclosure snapshots and access grants expire and are deleted/cleared according to the retention policy.
- Completion, cancellation, expiry and revocation must block future address reads immediately.
- Keep only the minimum audit data required for product integrity and abuse prevention.
- Document export and deletion behaviour accurately.

---

# 10. Security, privacy and abuse-prevention requirements

The implementing agent must test these cases explicitly, not simply state that they are handled.

## 10.1 Authorization and RLS tests

- Anonymous visitors cannot query addresses, phone numbers, delivery instructions, tokens, audit records or notification rows.
- User A cannot read, update or delete User B's profile settings, wishlist, addresses or notifications.
- A gifter cannot change a reservation's owner, item, consent state, shared fields, status or expiry by calling Supabase directly.
- A user cannot approve a reservation belonging to another owner.
- A user cannot reserve their own item while authenticated.
- A ticket token for reservation A cannot retrieve reservation B.
- An expired, declined, revoked, cancelled or completed request cannot return delivery details.
- A token hash alone must not be sufficient to recover the original bearer secret.
- A public profile query must never select private address/contact fields.

## 10.2 Ticket/token safety

- Generate secrets using a cryptographically secure random source.
- Store a one-way hash only.
- Prefer URL fragment delivery or a one-time exchange rather than query strings.
- Do not place raw secrets in logs, email, notifications, telemetry or analytics.
- Use short enough access scope and mandatory expiry.
- Use `Cache-Control: no-store`, strict referrer policy and no third-party scripts on the private ticket page.
- Do not put raw token in `localStorage` unless a documented threat analysis establishes why it is necessary and how XSS exposure is mitigated. Prefer a short-lived/session-scoped or fragment-based design.
- Revalidate permissions on every server-side read; never trust a cached client copy of address data.

## 10.3 Web and API safety

- Validate and normalize all untrusted input on the server.
- Validate all external URLs and every redirect hop.
- Prevent SSRF using actual destination IP validation, not DNS lookup alone.
- Add request timeouts, response size limits and content-type checks.
- Sanitize untrusted strings before emails and HTML rendering.
- Protect OAuth callback against open redirects using a strict allowlist and same-origin URL parsing.
- Apply CSRF protections where relevant, strict cookie settings and Content Security Policy.
- Use secure, HTTP-only, appropriate SameSite cookies.
- Rate-limit authentication, metadata extraction and reservation creation.
- Avoid leaking database or provider errors to end users; log safe error IDs without PII.

## 10.4 Privacy and data protection

- No address or phone in public profile HTML, page source, public API response, Open Graph image, email, push/in-app notification body or application logs.
- No private data in screenshots/demo fixtures shipped to production.
- No third-party analytics trackers by default. If analytics are added, use aggregate/privacy-friendly analytics and never include personal data.
- Encrypt sensitive fields at rest using platform guarantees and evaluate application-level encryption for the most sensitive address/contact fields. If application-level encryption is used, keys must be outside the database and server-only; never embed encryption keys in frontend bundles.
- Make the privacy policy match the actual data flows and retention periods.
- The privacy settings page must explain who receives information, which fields and how long access remains valid.

## 10.5 Abuse and operational controls

- Prevent repeated reservation spam with rate limits and per-owner/actor abuse controls.
- Prevent malicious or excessively large retailer URL fetches.
- Make notification webhook processing authenticated and idempotent.
- Log state changes with actor ID and timestamp, but never log secret/address content.
- Build basic reporting/blocking for abusive gifters only if needed for v1; do not introduce a public social system.

---

# 11. Development governance and strict agent rules

These rules apply to Gemini throughout the project. They are not optional style suggestions.

## 11.1 Before touching code

1. Confirm the real working directory is `wishlink/local/my-app/`.
2. Run `pwd`, `git status --short`, inspect the current branch and identify existing user modifications.
3. Read `AGENTS.md`, `README.md`, `PROJECT_DOCUMENTATION.md`, `package.json`, current migrations, tests and relevant feature files.
4. Read the installed Next.js version-specific agent documentation at `node_modules/next/dist/docs/` before changing Next.js code. The repository's `AGENTS.md` explicitly warns that this Next.js version has breaking changes.
5. Inspect `.env.local.example` for variable names only. **Do not open, print, copy, summarize or log `.env.local` values.**
6. Map routes, DB schema, RLS policies, RPCs, triggers, webhooks and CI.
7. Run baseline commands before modifying anything and record exact outcomes in `DEVELOPMENT_LOG.md`.
8. Create/update `AUDIT_REPORT.md` with reproducible findings and severity.

## 11.2 Source-of-truth hierarchy

When documents disagree, use this order:

1. Actual deployed database schema and migration history, if safely verified.
2. Canonical versioned `supabase/migrations/` chain and current source code.
3. Reproducible automated/manual test evidence.
4. This master specification for the intended target behaviour.
5. `README.md` and current project documentation.
6. Older audit docs, comments and generated suggestions.

The master spec defines what the product should become. It does not prove that a feature already works. Older documentation does not override verified current code.

## 11.3 Change-control rules

- Make small, focused, reviewable changes.
- Preserve existing working features and styles until the replacement is verified.
- Never replace the project with a template or create a parallel app.
- Do not introduce dependencies without recording the need and trade-offs in `DECISIONS.md`.
- Do not perform broad version upgrades unless required by a verified issue.
- Do not modify unrelated files.
- Review `git diff` after every meaningful work unit.
- Do not commit automatically unless the project owner explicitly asks.
- Do not discard uncommitted user changes.
- Do not run destructive commands such as `git reset --hard`, `git clean -fdx`, broad `rm -rf`, forced pushes or database drops.
- Do not change production data or apply migrations to production without explicit owner approval.
- Use local/staging database for migration tests wherever possible.
- Do not add fake data to real accounts or production pages.

## 11.4 Definition of verified completion

A task is **not complete** because code was written or a page looks finished.

A task can be marked `DONE` only when:

1. The implementation exists.
2. The relevant UI, API, database and authorization path is connected.
3. Tests were added or updated.
4. Relevant automated checks passed.
5. Manual verification was performed where automation is insufficient.
6. `git diff` was reviewed.
7. `DEVELOPMENT_LOG.md` records what changed and the evidence.
8. `AUDIT_REPORT.md` and `DECISIONS.md` are updated where appropriate.

Use `BLOCKED`, `NOT RUN`, `FAILED` or `PARTIALLY VERIFIED` honestly. Never convert an untested item into `DONE`.

## 11.5 Every control must work

Audit every visible button, icon button, link, menu item, switch, dialog, input and form.

For each control verify:

- It has the correct action and target.
- It has disabled/loading states when needed.
- It prevents duplicate submissions.
- It displays success only after server/provider confirmation.
- It displays understandable errors.
- It works with keyboard and touch.
- It does not expose private data before authorization.
- It does not use `href="#"` or inert placeholders.

## 11.6 Agent communication and progress reporting

At the start of each phase, state the phase and objective. After each meaningful work unit, update the development log and provide a concise progress report that includes:

- Work completed.
- Files changed.
- Commands/tests run and exact pass/fail outcome.
- Any new finding or blocker.
- Next immediate task.

Do not send filler progress updates. Do not claim background work. Do not tell the user a task is running if no tool/process is actually executing.

## 11.7 Secrets and personal data

- Never read or print `.env.local` values.
- Never place tokens, keys, passwords, private addresses, phone numbers or real user data in `DEVELOPMENT_LOG.md`, `AUDIT_REPORT.md`, screenshots or test output.
- Use redacted placeholders when recording configuration state.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or other server credentials to client code.

---

# 12. Timestamped development log protocol

A project-level file named **`DEVELOPMENT_LOG.md` is mandatory**. Gemini must create it at the beginning of its first implementation session and maintain it throughout development.

## 12.1 Time format

Use the user's project timezone:

- Timezone: `Asia/Dhaka`
- Offset: `+06:00`
- Format: `YYYY-MM-DDTHH:mm:ss+06:00`

Example format only: `2026-11-13T10:45:00+06:00`.

Use the actual system clock at the time of the work. Never invent, estimate, backdate or silently edit timestamps. If the tool environment provides UTC only, convert it accurately to Asia/Dhaka and keep the original UTC value in the same entry if useful.

## 12.2 What must be logged

Create a log entry:

- When a phase starts and finishes.
- Before and after a database migration or schema-affecting operation.
- After a meaningful implementation unit.
- After a test/build/lint/typecheck run.
- When a defect is discovered, fixed, deferred or re-opened.
- When a technical/product decision is made.
- When a task is blocked by missing secrets, provider access, user approval or environment configuration.
- Before and after a deployment, only if deployment is explicitly authorized.

Do not log every keystroke or trivial file read. Log enough information for the owner to reconstruct what happened and when.

## 12.3 Mandatory entry format

Append entries; do not silently rewrite past entries. Corrections must be added as a new entry that references the old one.

```md
## WL-LOG-0001 — Short action title

- **Status:** STARTED | COMPLETED | FAILED | BLOCKED | REOPENED
- **Started:** YYYY-MM-DDTHH:mm:ss+06:00
- **Finished:** YYYY-MM-DDTHH:mm:ss+06:00 (omit while in progress)
- **Agent:** Gemini / named sub-agent
- **Phase:** Phase 0 — Repository reconnaissance
- **Objective:** What this work unit is supposed to accomplish.
- **Inspected:** Relevant files, routes, migrations or components.
- **Changed:** Exact files changed, or `None`.
- **Commands:** Exact commands run (never include secrets).
- **Results:** Actual outcomes, key output, exit codes and failures.
- **Tests:** Test names and pass/fail totals; state `NOT RUN` when not run.
- **Security/privacy impact:** What was checked and what changed.
- **Decision links:** IDs from `DECISIONS.md`, if any.
- **Open issues:** Remaining risks, blockers or follow-up tasks.
- **Next action:** The immediate next work unit.
```

## 12.4 Log quality rules

- Every completed log entry must include at least one evidence item: file path/line range, test result, command exit code, migration result or manual verification record.
- Record failed commands as well as successful ones. Do not delete failed test results after fixing the code; add a later successful run.
- For tests, record exact totals and command.
- For database changes, record migration filename, target environment (`local`, `staging`, `production`) and whether it was applied. Never include database URLs or credentials.
- For deployment, record environment, commit hash, deployment ID/URL if public, result and rollback plan. Never log secret values.
- For a blocker, state who/what must unblock it and which functionality remains unverified.
- Keep entries chronological and append-only.

## 12.5 Companion project records

Gemini must create and maintain these files in the project root:

- `DEVELOPMENT_LOG.md` — chronological, timestamped activity record.
- `AUDIT_REPORT.md` — issue register with ID, severity, evidence, status, owner/agent, fix and verification.
- `DECISIONS.md` — architecture/product decisions, options considered, rationale and date/time.
- `README.md` — accurate setup, environment variable names, migrations and development commands.

Do not duplicate the full development log into the README. Keep each record focused.

---

# 13. Implementation phases and quality gates

Work in this order. Do not redesign the entire UI before the privacy and reservation foundation is verified.

## Phase 0 — Repository reconnaissance and baseline

Tasks:

- [ ] Confirm working directory, branch and initial `git status`.
- [ ] Read the relevant project instructions and Next.js v16 documentation.
- [ ] Map all route files, components, API routes, Supabase clients and environment variable names.
- [ ] Identify canonical vs duplicate migration files.
- [ ] Inspect all RLS policies, triggers and RPC definitions.
- [ ] Run baseline `npm test`.
- [ ] Run baseline `npx tsc --noEmit`.
- [ ] Run baseline `npm run lint`.
- [ ] Run baseline `npm run build`.
- [ ] Record unavailable services/configuration without exposing secrets.
- [ ] Create `DEVELOPMENT_LOG.md`, `AUDIT_REPORT.md` and `DECISIONS.md`.

**Gate 0:** No source modifications until the initial repo state, baseline results and priority audit are recorded. If a command cannot run, log the exact blocker.

## Phase 1 — P0 database and privacy foundation

Tasks:

- [ ] Fix the `reserved_at` / `created_at` mismatch in `reserve_gift` using a forward migration.
- [ ] Validate function body against the actual deployed schema or a fresh test database.
- [ ] Disable/remove automatic address sharing in v1.
- [ ] Verify all new reservations start with no shared address/disclosure grant.
- [ ] Confirm item reservation is atomic and prevents concurrent duplicates.
- [ ] Review all RLS grants, policies and `SECURITY DEFINER` RPCs.
- [ ] Restrict expiry sweeper execution to a trusted scheduled/service process.
- [ ] Resolve canonical migration directory and document the single supported application order.
- [ ] Add SQL integration tests for reservation success, unavailable item, own-item rejection, rate limit and concurrency.

**Gate 1:** A reservation succeeds on the test database, the timestamp query works, duplicate reservation fails safely, no address is shared automatically, and RLS prevents unauthorized reads.

## Phase 2 — Per-request consent and private ticket security

Tasks:

- [ ] Design the request/disclosure state machine and document it in `DECISIONS.md`.
- [ ] Add additive migrations for disclosure status, exact share fields, timestamps and audit events.
- [ ] Implement owner-only approve and decline operations.
- [ ] Implement dedicated revoke operation and immediate server-side denial.
- [ ] Add expiry enforcement and scheduled cleanup.
- [ ] Make private ticket token fragment-only or use a secure one-time exchange.
- [ ] Remove query-token fallback after a safe compatibility plan.
- [ ] Remove legacy plaintext token support when safe.
- [ ] Add `no-store`/referrer protections.
- [ ] Add tests for token mismatch, another user's token, no approval, each disclosure field, revoke, expiry, cancellation and completion.

**Gate 2:** The gifter can retrieve only approved fields for one request, and the next read after revoke/expiry/completion returns no private details.

## Phase 3 — Identity, profile and account security

Tasks:

- [ ] Verify Google OAuth in a real supported Supabase environment.
- [ ] Harden callback redirects with an explicit same-origin allowlist.
- [ ] Verify onboarding, case-insensitive username uniqueness and reserved routes.
- [ ] Verify Passkey registration, sign-in, listing and removal.
- [ ] Verify TOTP enrolment, challenge, disable and recovery behaviour.
- [ ] Add step-up checks to sensitive operations.
- [ ] Add session management/sign-out-everywhere if supported.
- [ ] Add profile editing, visibility and indexing preferences.
- [ ] Add gift-request blocking preference.
- [ ] Add data export and account deletion with proper reauthentication.

**Gate 3:** User journeys work from a clean browser session, no redirect loops occur, private settings are server-enforced, and no account can remove its final usable authentication method.

## Phase 4 — Wishlist, address book, request and notification completeness

Tasks:

- [ ] Verify all wishlist CRUD actions persist to Supabase.
- [ ] Verify manual metadata entry and retailer metadata fallback.
- [ ] Harden SSRF, DNS rebinding, redirect and distributed rate limiting.
- [ ] Verify batch reorder RPC and address reorder behaviour.
- [ ] Complete owner address/contact management.
- [ ] Complete incoming and outgoing request history in a unified `/dashboard/gifts` view (or document why the existing dashboard/notification UI is the single equivalent).
- [ ] Complete in-app notifications and accurate unread behaviour.
- [ ] Verify Resend webhook setup and idempotency.
- [ ] Add email lifecycle notifications with no sensitive payload.
- [ ] Add QR and social preview actions.

**Gate 4:** All data changes persist, no placeholder actions remain, notifications are accurate, and the gift request flow works with owner and gifter test accounts.

## Phase 5 — Information architecture and navigation

Tasks:

- [ ] Complete `/` signed-out and signed-in variants.
- [ ] Add `/about` and complete Privacy/Terms.
- [ ] Add missing profile and privacy settings routes.
- [ ] Add one shared home/brand destination across all route shells.
- [ ] Ensure the dashboard logo links to `/`.
- [ ] Add/verify 404 and error recovery paths.
- [ ] Test every internal link and route target.

**Gate 5:** Every page has a working home route, every route is intentional, and all navigation destinations exist.

## Phase 6 — Material Design 3 redesign

Tasks:

- [ ] Define design tokens and theme seed.
- [ ] Implement consistent light/dark mode and manual toggle.
- [ ] Create shared buttons, form fields, cards, dialogs, chips, navigation and feedback components.
- [ ] Refactor home, About, auth, profile, dashboard, settings and gifter ticket.
- [ ] Remove legacy theme utilities only after equivalent M3 components are in use.
- [ ] Ensure mobile, tablet and desktop layouts work.
- [ ] Test keyboard, screen reader labels, reduced motion and color contrast.
- [ ] Check Instagram/Facebook in-app browser behaviour.

**Gate 6:** The full product—not only the landing page—uses one consistent Material 3 system, meets accessibility targets and has real content and functional controls.

## Phase 7 — Full regression, release preparation and handoff

Tasks:

- [ ] Run full unit/integration/e2e suite.
- [ ] Run typecheck, lint and production build.
- [ ] Test the main flows with two separate accounts plus a logged-out visitor.
- [ ] Test concurrency, consent, revoke, expiry and deletion.
- [ ] Review every visible control and every route.
- [ ] Review `git diff` and ensure no unrelated user work was changed.
- [ ] Scan for secrets, private data in logs, debug output and placeholder content.
- [ ] Update README, `AUDIT_REPORT.md`, `DECISIONS.md` and `DEVELOPMENT_LOG.md`.
- [ ] Produce deployment checklist and known-limitations list.

**Gate 7:** No P0 or P1 issue remains open. Any unavoidable limitation is explicit, user-visible where relevant and recorded as `BLOCKED`/`DEFERRED`, not falsely marked complete.

---

# 14. Testing strategy and acceptance criteria

## 14.1 Required commands

Run from `wishlink/local/my-app/` and record exact output/result:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Also run focused tests as they are implemented, for example:

```bash
node --test tests/**/*.test.mjs
```

Use the project's actual test scripts and installed tooling; do not invent a passing result. If `npm run build` requires public configuration variables, use documented safe test placeholders only where appropriate and state what is not being verified.

## 14.2 Automated test categories

### Database and state machine

- Reservation available item succeeds.
- Reservation already reserved/gifted item fails.
- Two concurrent reservation attempts yield exactly one active reservation.
- Owner cannot reserve own item.
- `reserve_gift` rate-limit query references a real timestamp column.
- Pending request expires on schedule.
- Approved disclosure expires on schedule.
- Declined/cancelled/revoked/completed requests cannot return details.
- Expiry clears disclosure and releases item safely.

### Privacy and authorization

- Anonymous role cannot read private addresses or notifications.
- User A cannot read User B's private information.
- Gifter token can read only its own approved reservation.
- Token in query string is rejected after compatibility migration.
- No address or phone appears in public HTML/API/metadata/email/logs.
- Revoke takes effect server-side on the next read.

### Authentication

- Google sign-in and sign-up.
- Callback safe redirect and external redirect rejection.
- Onboarding username constraints and reserved names.
- Passkey enroll, sign-in, delete and last-factor guard.
- TOTP enroll, challenge, recovery, disable and reauthentication.
- Expired session and sign-out everywhere.

### Frontend and UX

- Home page works signed-out and signed-in.
- All controls perform real actions.
- Every route has an accessible Home link.
- Public profile visibility modes work server-side.
- Wishlist add/edit/delete/reorder/priority work.
- Address management and consent dialog work.
- Notification unread count and realtime reconnect work.
- Mobile in-app browser layout works.
- Keyboard navigation, focus states and accessible labels work.

## 14.3 Manual end-to-end test matrix

Use at least:

- **Account A:** wishlist owner.
- **Account B:** authenticated gifter (for account-based optional flows).
- **Guest browser/session:** unauthenticated gifter.
- **Separate browser profile/device:** to ensure local storage/session state is not shared accidentally.

Test full sequences:

1. Create account A → claim username → add address → add item → copy profile URL.
2. Open profile as guest → reserve item → verify owner notification → verify address is still hidden.
3. Owner declines → verify gifter sees declined and item becomes available.
4. Guest reserves again → owner approves only address → verify exactly that address is visible.
5. Verify phone/contact remains hidden unless separately selected.
6. Owner revokes → refresh ticket and call endpoint directly → verify no details are returned.
7. Owner re-approves or cancels according to the designed state model.
8. Gifter reports sent → owner marks received → verify item gifted and details inaccessible.
9. Test pending expiry and approved-share expiry.
10. Repeat with two simultaneous gifter attempts and verify only one reservation succeeds.

## 14.4 Product acceptance checklist

### Owner

- [ ] Can sign in with Google.
- [ ] Can complete onboarding and claim a unique short username.
- [ ] Can create and customize profile.
- [ ] Can add, edit, delete and reorder wishlist items.
- [ ] Can add, edit, reorder and delete delivery addresses.
- [ ] Can see and act on incoming gift requests.
- [ ] Must approve each gift request individually.
- [ ] Can choose exact fields to share.
- [ ] Can decline and revoke disclosure access.
- [ ] Can see notification and audit history.
- [ ] Can configure profile visibility and gift-request blocking.
- [ ] Can configure Passkey and TOTP security.
- [ ] Can export and delete their account.

### Gifter

- [ ] Can open a public profile from a short link.
- [ ] Can browse published wishlist items.
- [ ] Can start a gift request without the product forcing an account when guest flow is supported.
- [ ] Receives a private ticket.
- [ ] Sees pending/approved/declined/revoked/expired/completed status accurately.
- [ ] Sees delivery details only after approval.
- [ ] Sees only the fields explicitly approved.
- [ ] Loses future access immediately after revoke, expiry, cancellation or completion.

### Platform

- [ ] Reservation is atomic and duplicate-proof.
- [ ] RLS protects every private table.
- [ ] No secrets or delivery details leak into public output/logs.
- [ ] Notifications and emails are accurate and idempotent.
- [ ] Metadata extraction is SSRF-safe and rate-limited.
- [ ] Every route has a Home path.
- [ ] Material Design 3 is consistent and responsive.
- [ ] WCAG AA contrast and keyboard accessibility are verified.
- [ ] No placeholder text, fake data, broken links or inert controls remain.
- [ ] Tests, typecheck, lint and production build pass.

---

# 15. Deployment and release checklist

Before release, verify each item for the correct environment. Do not deploy or apply production migrations unless explicitly authorized by the project owner.

## Supabase

- [ ] Canonical versioned migrations `001`–`004` and all new migrations applied in order to staging.
- [ ] Staging schema matches the code.
- [ ] RLS enabled and tested on every private table.
- [ ] RPC permissions checked, especially `SECURITY DEFINER` functions.
- [ ] Realtime publication configured for notifications.
- [ ] Scheduled expiry job configured and tested.
- [ ] OAuth provider configured with exact redirect URLs.
- [ ] Auth site URL and redirect allowlist correct.

## Environment variable names

Use `.env.local.example` as the reference and update it if new variables are required. Likely names include:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `RESEND_API_KEY` (server-only)
- `WEBHOOK_SECRET` (server-only)
- Any encryption/rate-limit provider variables added through a documented decision.

Document names and purpose only. Never paste values into this file, logs, screenshots or final reports.

## Application hosting

- [ ] HTTPS enabled.
- [ ] Production site URL is correct for metadata and email links.
- [ ] Secure cookie behaviour verified.
- [ ] CSP/referrer policy configured.
- [ ] Error monitoring does not capture private addresses, phone numbers or bearer tokens.
- [ ] Email sender domain verified and SPF/DKIM configured where applicable.
- [ ] Webhook secret configured and webhook delivery tested.
- [ ] Mobile in-app browser smoke test completed.
- [ ] Rollback plan prepared.

---

# 16. Required deliverables and final handoff

The implementing agent must leave the repository with:

1. Working WishLink application source code.
2. `README.md` with accurate setup and run instructions.
3. `.env.local.example` with required environment variable names only.
4. Additive, ordered SQL migrations and clear application instructions.
5. `DECISIONS.md` with architecture and product decisions.
6. `AUDIT_REPORT.md` with every discovered issue and its final status.
7. `DEVELOPMENT_LOG.md` with timestamped chronological work history.
8. Automated tests for the reservation state machine, RLS/authorization, token access, consent/revoke/expiry and Home navigation.
9. A deployment checklist and known limitations.

## 16.1 Final response from Gemini

At the end, provide a structured handoff with:

- Product areas completed.
- Files added/changed (grouped by feature).
- Database migrations added and exact order.
- Security/privacy changes and tests performed.
- Test matrix with `PASS`, `FAIL`, `BLOCKED` or `NOT RUN`.
- Actual command outputs/results for `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build`.
- Any external configuration still required (Google OAuth, Supabase settings, Resend, deployment environment), names only and no secret values.
- Known limitations and deferred work.
- Link/path to `DEVELOPMENT_LOG.md`, `AUDIT_REPORT.md` and `DECISIONS.md`.

Do not state that WishLink is production-ready if any P0/P1 issue remains, the live provider flow was not tested, or production migrations/configuration were not verified.

---

# 17. Decision register starter

Create `DECISIONS.md` and record decisions using this format:

```md
## DEC-001 — Decision title

- **Date/time:** YYYY-MM-DDTHH:mm:ss+06:00
- **Status:** PROPOSED | ACCEPTED | REJECTED | SUPERSEDED
- **Context:** What problem needs a decision?
- **Options considered:**
  1. Option A
  2. Option B
- **Decision:** What was selected?
- **Reason:** Why is it the best fit for WishLink?
- **Consequences:** Security, UX, migration, cost or maintenance implications.
- **Evidence:** File paths, test results or provider documentation checked.
```

The following decisions must be recorded early:

- Canonical migration directory and how deployed migration history will be reconciled.
- Per-request consent model and removal of auto-share in v1.
- Token transport and legacy token compatibility plan.
- Reservation/disclosure state machine and expiry rules.
- Whether gifter guest reservations remain supported in v1 (default: preserve existing guest flow if secure).
- Material Design 3 seed color and component implementation approach.
- Recovery-code implementation or documented fallback.
- Encryption/key-management approach for address and contact data.
- Distributed rate-limiting provider/mechanism.

---

## Final instruction to the implementing agent

**Do not treat this as a request to merely redesign the landing page.** WishLink is an existing application with authentication, wishlist, reservation, notification and security code already present. Audit it, fix the verified P0/P1 defects, complete the privacy-consent workflow, finish missing product routes, unify the Material Design 3 interface, and verify the result end to end.

Work in small, logged phases. Maintain `DEVELOPMENT_LOG.md` with actual Asia/Dhaka timestamps. Maintain `AUDIT_REPORT.md` and `DECISIONS.md`. Inspect every change, test every important action, and report exactly what is verified and what is not. **Never trade the recipient's privacy for a shorter implementation.**
