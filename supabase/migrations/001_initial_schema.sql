-- 001_initial_schema.sql
-- Wishlink Core Schema: Profiles, Addresses, and Wishlist Items

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    pet_name TEXT,
    avatar_url TEXT,
    surprise_mode BOOLEAN NOT NULL DEFAULT FALSE,
    auto_share_address BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    CONSTRAINT profiles_username_not_blank CHECK (
        username <> '' AND username = pg_catalog.btrim(username)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
    ON public.profiles (pg_catalog.lower(username));

-- ============================================================
-- ADDRESSES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    label TEXT,
    full_address TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    CONSTRAINT addresses_full_address_not_blank CHECK (
        pg_catalog.btrim(full_address) <> ''
    )
);

CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS addresses_user_priority_idx ON public.addresses (user_id, priority);

-- ============================================================
-- WISHLIST ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    product_url TEXT NOT NULL,
    title TEXT,
    image_url TEXT,
    price TEXT,
    price_amount NUMERIC(10, 2),
    price_currency TEXT NOT NULL DEFAULT 'USD',
    category TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    CONSTRAINT wishlist_items_status_check
        CHECK (status IN ('available', 'reserved', 'gifted')),
    CONSTRAINT wishlist_items_product_url_not_blank CHECK (
        pg_catalog.btrim(product_url) <> ''
    )
);

CREATE INDEX IF NOT EXISTS wishlist_items_user_id_idx ON public.wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS wishlist_items_user_sort_order_idx ON public.wishlist_items (user_id, sort_order);
CREATE INDEX IF NOT EXISTS wishlist_items_status_idx ON public.wishlist_items (status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.addresses FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.wishlist_items FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Profiles: Public read, owners may update their profile fields
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT UPDATE (username, pet_name, avatar_url, surprise_mode, auto_share_address)
    ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Addresses: Strict owner access only (NEVER public)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO authenticated;

DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
CREATE POLICY "Users can view own addresses"
    ON public.addresses FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
CREATE POLICY "Users can insert own addresses"
    ON public.addresses FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses"
    ON public.addresses FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses"
    ON public.addresses FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Wishlist Items: Public read for available/reserved items, full owner CRUD
GRANT SELECT ON TABLE public.wishlist_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.wishlist_items TO authenticated;

DROP POLICY IF EXISTS "Wishlist items viewable by public" ON public.wishlist_items;
CREATE POLICY "Wishlist items viewable by public"
    ON public.wishlist_items FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can insert own wishlist items"
    ON public.wishlist_items FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can update own wishlist items"
    ON public.wishlist_items FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can delete own wishlist items"
    ON public.wishlist_items FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- AUTH PROFILE CREATION TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_raw_username TEXT;
    v_base_username TEXT;
    v_candidate_username TEXT;
    v_suffix INT := 0;
BEGIN
    v_raw_username := NEW.raw_user_meta_data ->> 'user_name';
    IF v_raw_username IS NULL OR pg_catalog.btrim(v_raw_username) = '' THEN
        v_raw_username := NEW.raw_user_meta_data ->> 'preferred_username';
    END IF;
    IF v_raw_username IS NULL OR pg_catalog.btrim(v_raw_username) = '' THEN
        v_raw_username := pg_catalog.split_part(COALESCE(NEW.email, ''), '@', 1);
    END IF;

    v_base_username := pg_catalog.regexp_replace(
        pg_catalog.lower(COALESCE(v_raw_username, '')),
        '[^a-z0-9_]', '', 'g'
    );
    IF v_base_username = '' THEN
        v_base_username := 'user';
    END IF;

    v_candidate_username := v_base_username;
    WHILE EXISTS (
        SELECT 1 FROM public.profiles
        WHERE pg_catalog.lower(username) = v_candidate_username
    ) LOOP
        v_suffix := v_suffix + 1;
        v_candidate_username := v_base_username || v_suffix::text;
    END LOOP;

    INSERT INTO public.profiles (id, username, pet_name, avatar_url)
    VALUES (
        NEW.id,
        v_candidate_username,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name',
            v_candidate_username
        ),
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();

