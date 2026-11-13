-- 006_grant_table_permissions.sql
-- Fixes WL-DB-003: Explicit table-level privileges for authenticated and anon roles.
-- Ensures that PostgreSQL permissions do not block client operations before RLS policies evaluate.

-- 1. Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Wishlist Items
-- Public visitors can read wishlist items; authenticated owners can create, edit, and delete their items (guarded by RLS).
GRANT SELECT ON TABLE public.wishlist_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.wishlist_items TO authenticated;

-- 3. Profiles
-- Public profiles are readable by everyone; authenticated owners can update their own row.
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- 4. Addresses
-- Strictly authenticated owners only (RLS enforces (auth.uid() = user_id)).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO authenticated;

-- 5. Gift Reservations
-- Anonymous and authenticated guests can create reservations via RPC or direct insert (guarded by RLS).
GRANT SELECT, INSERT, UPDATE ON TABLE public.gift_reservations TO anon, authenticated;

-- 6. Notifications
-- Authenticated recipients can view and update read status.
GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;

-- 7. Sequences & Routines
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
