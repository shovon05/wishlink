# Wishlink

> **Everything you wish for. One private link.**

Wishlink is a privacy-first universal wishlist and gift registry platform. It allows users to curate items from any online store (Amazon, Etsy, Target, Apple, Shopify, or local boutiques), share a single public link, prevent awkward duplicate purchases with real-time atomic locking, and safely coordinate gift deliveries without ever publicly exposing residential addresses.

---

## Key Features

- **Universal Product Scraper:** Paste any store link. Wishlink extracts high-resolution imagery, titles, structured prices, and currencies using Schema.org JSON-LD and OpenGraph metadata, with graceful manual entry fallback.
- **SSRF-Hardened Crawler:** Server-side fetches block IPv4/IPv6 loopback, RFC 1918 private subnets, cloud instance metadata endpoints (169.254.169.254), prevent DNS rebinding, follow manual redirects, and enforce a 2 MB streaming response abort limit.
- **Zero-Leak Delivery Privacy:** Residential addresses are strictly kept in private tables protected by PostgreSQL Row Level Security (RLS). Addresses are never rendered in public profiles or returned in anonymous API payloads.
- **Hashed Token Access & Fragment URLs:** Secret gift reservation access tokens are hashed via SHA-256 (`token_hash`) before storage in an isolated `private` schema. Links pass the bearer token via URL fragments (`#token=...`) so tokens are never transmitted in HTTP headers, logged in proxies, or leaked in `Referer` headers.
- **Atomic Duplicate Prevention:** Gifts are reserved using PostgreSQL row-level locks (`SELECT ... FOR UPDATE`), eliminating race conditions and duplicate gifts.
- **14-Day Auto-Expiry & Sweep:** Inactive reservations automatically expire after 14 days, releasing held items back to available status and revoking address permissions.
- **Spoiler-Free / Surprise Mode:** Registry owners can enable Surprise Mode to keep gift titles and photos hidden on their dashboard and in notifications, preserving the magic of the surprise while still approving delivery handoffs.
- **Batch Reordering:** Drag-and-drop wishlist sorting updates all positions in a single atomic database RPC roundtrip.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI & Styling:** React 19, Tailwind CSS v4, Lucide Icons, `@dnd-kit`
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, SECURITY DEFINER RPCs)
- **Email:** Resend
- **Testing:** Node.js native test runner (`node --test`)
- **CI/CD:** GitHub Actions (TypeScript typecheck, ESLint, unit tests, Next.js build)

---

## Getting Started

### 1. Prerequisites

- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **Supabase Project:** A Supabase project with PostgreSQL 15+

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=your-resend-api-key
```

### 3. Database Migrations

Apply the versioned SQL migrations in order located in `supabase/migrations/`:

```
supabase/migrations/
  ├── 001_initial_schema.sql         # Profiles, addresses, wishlist_items, RLS
  ├── 002_reservation_system.sql     # Reservations, private secrets schema, atomic locks & RPCs
  ├── 003_notifications.sql          # Notifications table and triggers
  └── 004_security_hardening.sql     # Batch reorder RPC, auto-expiry sweeper, search_path security
```

You can apply them using the Supabase CLI:

```bash
supabase db push
```

Or execute them in sequence using the Supabase SQL Editor.

### 4. Install Dependencies & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## Testing & Quality Assurance

```bash
# Run unit test suite (SSRF validation, token resolution)
npm test

# Typecheck TypeScript without emitting JS
npx tsc --noEmit

# Run ESLint
npm run lint

# Production build
npm run build
```

---

## License

This project is licensed under the MIT License.
