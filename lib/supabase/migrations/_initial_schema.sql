-- Wishlist-sharing application: initial schema, RLS, grants, and triggers.
-- Run once against a new/empty Supabase project database.

-- UUID generation is provided by PostgreSQL (gen_random_uuid()).
-- No uuid-ossp extension is required.

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    pet_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    CONSTRAINT profiles_username_not_blank CHECK (
        username <> '' AND username = pg_catalog.btrim(username)
    )
);

-- Case-insensitive uniqueness: "Shovon05" and "shovon05" conflict.
CREATE UNIQUE INDEX profiles_username_lower_idx
    ON public.profiles (pg_catalog.lower(username));

CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    label TEXT,
    full_address TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    CONSTRAINT addresses_full_address_not_blank CHECK (
        pg_catalog.btrim(full_address) <> ''
    )
);

CREATE INDEX addresses_user_id_idx ON public.addresses (user_id);
CREATE INDEX addresses_user_priority_idx
    ON public.addresses (user_id, priority);

CREATE TABLE public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    product_url TEXT NOT NULL,
    title TEXT,
    image_url TEXT,
    price TEXT,
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

CREATE INDEX wishlist_items_user_id_idx ON public.wishlist_items (user_id);
CREATE INDEX wishlist_items_user_sort_order_idx
    ON public.wishlist_items (user_id, sort_order);
CREATE INDEX wishlist_items_status_idx ON public.wishlist_items (status);

CREATE TABLE public.gift_reservations (
    id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    wishlist_item_id UUID NOT NULL
        REFERENCES public.wishlist_items (id) ON DELETE CASCADE,
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    gifter_contact TEXT,
    shared_address_id UUID
        REFERENCES public.addresses (id) ON DELETE SET NULL
);

CREATE INDEX gift_reservations_wishlist_item_id_idx
    ON public.gift_reservations (wishlist_item_id);
CREATE INDEX gift_reservations_shared_address_id_idx
    ON public.gift_reservations (shared_address_id)
    WHERE shared_address_id IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_reservations ENABLE ROW LEVEL SECURITY;

-- Remove any inherited/default client privileges, then grant only what is needed.
REVOKE ALL ON TABLE public.profiles
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.addresses
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.wishlist_items
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.gift_reservations
    FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- profiles: public read; owners may update editable profile fields only.
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT UPDATE (username, pet_name, avatar_url)
    ON TABLE public.profiles TO authenticated;

CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- addresses: private; only the owner can read or manage their own addresses.
GRANT SELECT, DELETE ON TABLE public.addresses TO authenticated;
GRANT INSERT (user_id, label, full_address, priority)
    ON TABLE public.addresses TO authenticated;
GRANT UPDATE (label, full_address, priority)
    ON TABLE public.addresses TO authenticated;

CREATE POLICY "Users can view own addresses"
    ON public.addresses
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own addresses"
    ON public.addresses
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own addresses"
    ON public.addresses
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own addresses"
    ON public.addresses
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- wishlist_items: public read; owners manage their own items.
GRANT SELECT ON TABLE public.wishlist_items TO anon, authenticated;
GRANT INSERT (user_id, product_url, title, image_url, price, category, sort_order)
    ON TABLE public.wishlist_items TO authenticated;
GRANT UPDATE (product_url, title, image_url, price, category, sort_order, status)
    ON TABLE public.wishlist_items TO authenticated;
GRANT DELETE ON TABLE public.wishlist_items TO authenticated;

CREATE POLICY "Wishlist items are viewable by everyone"
    ON public.wishlist_items
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Users can insert own wishlist items"
    ON public.wishlist_items
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own wishlist items"
    ON public.wishlist_items
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own wishlist items"
    ON public.wishlist_items
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- gift_reservations: anyone can insert; only the wishlist owner can read
-- reservations or set a shared address. No public SELECT is granted.
GRANT INSERT (wishlist_item_id, is_anonymous, gifter_contact)
    ON TABLE public.gift_reservations TO anon, authenticated;
GRANT SELECT ON TABLE public.gift_reservations TO authenticated;
GRANT UPDATE (shared_address_id)
    ON TABLE public.gift_reservations TO authenticated;

CREATE POLICY "Anyone can reserve a gift"
    ON public.gift_reservations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Item owner can view reservations"
    ON public.gift_reservations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.wishlist_items AS wi
            WHERE wi.id = gift_reservations.wishlist_item_id
              AND wi.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Item owner can set shared address"
    ON public.gift_reservations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.wishlist_items AS wi
            WHERE wi.id = gift_reservations.wishlist_item_id
              AND wi.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.wishlist_items AS wi
            WHERE wi.id = gift_reservations.wishlist_item_id
              AND wi.user_id = (SELECT auth.uid())
        )
        AND (
            shared_address_id IS NULL
            OR EXISTS (
                SELECT 1
                FROM public.addresses AS a
                WHERE a.id = gift_reservations.shared_address_id
                  AND a.user_id = (SELECT auth.uid())
            )
        )
    );

-- ============================================================
-- TRIGGER FUNCTIONS AND TRIGGERS
-- ============================================================

-- Create a profile after a new Supabase Auth user is inserted.
-- The full UUID is used in the temporary username to minimize collisions.
-- A retry handles the unlikely case where a user has already claimed that name.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_pet_name TEXT;
    v_username TEXT;
    v_attempt INTEGER;
BEGIN
    v_pet_name := COALESCE(
        NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'name'), '')
    );

    FOR v_attempt IN 1..5 LOOP
        IF v_attempt = 1 THEN
            v_username := 'user_' || pg_catalog.replace(NEW.id::TEXT, '-', '');
        ELSE
            v_username := 'user_' || pg_catalog.replace(
                pg_catalog.gen_random_uuid()::TEXT, '-', ''
            );
        END IF;

        BEGIN
            INSERT INTO public.profiles (id, username, pet_name)
            VALUES (NEW.id, v_username, v_pet_name);
            RETURN NEW;
        EXCEPTION WHEN unique_violation THEN
            -- A duplicate profile ID is not a username collision; surface it.
            IF EXISTS (
                SELECT 1
                FROM public.profiles AS p
                WHERE p.id = NEW.id
            ) THEN
                RAISE;
            END IF;
            -- Otherwise retry with a fresh UUID-based temporary username.
        END;
    END LOOP;

    RAISE EXCEPTION 'Unable to generate a unique temporary username for user %.', NEW.id
        USING ERRCODE = '23505';
END;
$function$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();

-- Atomically reserve an item only if it is still available.
-- The conditional UPDATE takes a row lock and rechecks the status after waiting,
-- preventing two concurrent inserts from reserving the same available item.
CREATE OR REPLACE FUNCTION public.reserve_available_wishlist_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_item_id UUID;
BEGIN
    UPDATE public.wishlist_items AS wi
       SET status = 'reserved'
     WHERE wi.id = NEW.wishlist_item_id
       AND wi.status = 'available'
    RETURNING wi.id INTO v_item_id;

    IF FOUND THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.wishlist_items AS wi
        WHERE wi.id = NEW.wishlist_item_id
    ) THEN
        RAISE EXCEPTION 'Wishlist item does not exist.'
            USING ERRCODE = '23503';
    END IF;

    RAISE EXCEPTION 'This item is no longer available.'
        USING ERRCODE = 'P0001';
END;
$function$;

CREATE TRIGGER on_gift_reservation_before_insert
    BEFORE INSERT ON public.gift_reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.reserve_available_wishlist_item();

-- Trigger functions are invoked by their triggers, not exposed as client RPCs.
REVOKE ALL ON FUNCTION public.handle_new_user_profile()
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_available_wishlist_item()
    FROM PUBLIC, anon, authenticated;
