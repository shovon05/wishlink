-- 002_reservation_system.sql
-- Wishlink Reservation Lifecycle, Atomic Locking & Private Token Storage

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- ============================================================
-- GIFT RESERVATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gift_reservations (
    id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    wishlist_item_id UUID NOT NULL REFERENCES public.wishlist_items (id) ON DELETE CASCADE,
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (pg_catalog.now() + INTERVAL '14 days'),
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    gifter_contact TEXT,
    shared_address_id UUID REFERENCES public.addresses (id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT gift_reservations_status_check
        CHECK (status IN ('active', 'completed', 'cancelled', 'expired'))
);

CREATE INDEX IF NOT EXISTS gift_reservations_wishlist_item_id_idx ON public.gift_reservations (wishlist_item_id);
CREATE INDEX IF NOT EXISTS gift_reservations_shared_address_id_idx ON public.gift_reservations (shared_address_id) WHERE shared_address_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS gift_reservations_status_idx ON public.gift_reservations (status);
CREATE INDEX IF NOT EXISTS gift_reservations_expires_at_idx ON public.gift_reservations (expires_at);

-- ============================================================
-- PRIVATE TOKENS TABLE (HASHED SECRETS)
-- ============================================================

CREATE TABLE IF NOT EXISTS private.gift_reservation_secrets (
    reservation_id UUID PRIMARY KEY REFERENCES public.gift_reservations (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    access_token UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.gift_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gift_reservations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.gift_reservation_secrets FROM PUBLIC, anon, authenticated;

-- RLS: Wishlist owners can view their items' reservations and assign a shared address
GRANT SELECT, UPDATE (shared_address_id) ON TABLE public.gift_reservations TO authenticated;

DROP POLICY IF EXISTS "Owners can view reservations for their items" ON public.gift_reservations;
CREATE POLICY "Owners can view reservations for their items"
    ON public.gift_reservations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlist_items wi
            WHERE wi.id = wishlist_item_id
              AND wi.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Owners can update shared address on active reservations" ON public.gift_reservations;
CREATE POLICY "Owners can update shared address on active reservations"
    ON public.gift_reservations FOR UPDATE
    TO authenticated
    USING (
        status = 'active' AND
        EXISTS (
            SELECT 1 FROM public.wishlist_items wi
            WHERE wi.id = wishlist_item_id
              AND wi.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        status = 'active' AND
        EXISTS (
            SELECT 1 FROM public.wishlist_items wi
            WHERE wi.id = wishlist_item_id
              AND wi.user_id = (SELECT auth.uid())
        )
    );

-- ============================================================
-- STORED PROCEDURES & RPCS
-- ============================================================

DROP FUNCTION IF EXISTS public.reserve_gift(uuid, boolean, text);

CREATE OR REPLACE FUNCTION public.reserve_gift(
    p_wishlist_item_id UUID,
    p_is_anonymous BOOLEAN DEFAULT TRUE,
    p_gifter_contact TEXT DEFAULT NULL
)
RETURNS TABLE (
    reservation_id UUID,
    access_token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_owner_id UUID;
    v_item_status TEXT;
    v_reservation_id UUID;
    v_raw_token TEXT;
    v_token_hash TEXT;
    v_contact TEXT;
    v_auto_share BOOLEAN;
    v_default_address_id UUID;
    v_recent_reservations INT;
BEGIN
    IF p_wishlist_item_id IS NULL OR p_is_anonymous IS NULL THEN
        RAISE EXCEPTION 'Item and anonymity selection are required.'
            USING ERRCODE = '22004';
    END IF;

    -- 1. Atomically lock and inspect the item
    SELECT wi.user_id, wi.status
      INTO v_owner_id, v_item_status
      FROM public.wishlist_items AS wi
     WHERE wi.id = p_wishlist_item_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wishlist item does not exist.'
            USING ERRCODE = '23503';
    END IF;

    -- Prevent reserving own wishlist item
    IF (SELECT auth.uid()) IS NOT NULL AND v_owner_id = (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'You cannot reserve your own wishlist item.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Anti-griefing check: If reserved, check for expired reservation to reclaim
    IF v_item_status = 'reserved' THEN
        UPDATE public.gift_reservations
           SET status = 'expired',
               shared_address_id = NULL
         WHERE wishlist_item_id = p_wishlist_item_id
           AND status = 'active'
           AND expires_at <= pg_catalog.now();

        IF FOUND THEN
            UPDATE public.wishlist_items
               SET status = 'available'
             WHERE id = p_wishlist_item_id;
            v_item_status := 'available';
        ELSE
            RAISE EXCEPTION 'This gift is already reserved by someone else.'
                USING ERRCODE = '55000';
        END IF;
    END IF;

    IF v_item_status <> 'available' THEN
        RAISE EXCEPTION 'This gift is no longer available for reservation.'
            USING ERRCODE = '55000';
    END IF;

    -- 3. Rate-limiting check: Prevent flooding active reservations on a single list
    SELECT COUNT(*)
      INTO v_recent_reservations
      FROM public.gift_reservations r
      JOIN public.wishlist_items wi ON wi.id = r.wishlist_item_id
     WHERE wi.user_id = v_owner_id
       AND r.created_at > (pg_catalog.now() - INTERVAL '15 minutes')
       AND r.status = 'active';

    IF v_recent_reservations >= 15 THEN
        RAISE EXCEPTION 'Too many recent reservations. Please wait a few minutes before trying again.'
            USING ERRCODE = '54000';
    END IF;

    -- 4. Contact validation
    IF p_is_anonymous THEN
        v_contact := NULL;
    ELSE
        v_contact := NULLIF(pg_catalog.btrim(p_gifter_contact), '');
        IF v_contact IS NULL THEN
            RAISE EXCEPTION 'Contact name or note is required for non-anonymous reservations.'
                USING ERRCODE = '22023';
        END IF;
        IF pg_catalog.char_length(v_contact) > 500 THEN
            RAISE EXCEPTION 'Contact note is too long (maximum 500 characters).'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    -- 5. Auto-share address check
    SELECT p.auto_share_address
      INTO v_auto_share
      FROM public.profiles p
     WHERE p.id = v_owner_id;

    IF v_auto_share IS TRUE THEN
        SELECT a.id
          INTO v_default_address_id
          FROM public.addresses a
         WHERE a.user_id = v_owner_id
         ORDER BY a.is_default DESC, a.priority ASC
         LIMIT 1;
    ELSE
        v_default_address_id := NULL;
    END IF;

    -- 6. Cryptographically secure token generation and hashing
    v_reservation_id := pg_catalog.gen_random_uuid();
    v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
    v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

    INSERT INTO public.gift_reservations (
        id, wishlist_item_id, is_anonymous, gifter_contact, shared_address_id, status, expires_at
    )
    VALUES (
        v_reservation_id, p_wishlist_item_id, p_is_anonymous, v_contact, v_default_address_id, 'active', pg_catalog.now() + INTERVAL '14 days'
    );

    INSERT INTO private.gift_reservation_secrets (
        reservation_id, token_hash
    )
    VALUES (
        v_reservation_id, v_token_hash
    );

    UPDATE public.wishlist_items
       SET status = 'reserved'
     WHERE id = p_wishlist_item_id;

    RETURN QUERY SELECT v_reservation_id, v_raw_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_gift(UUID, BOOLEAN, TEXT) TO anon, authenticated;

-- ============================================================
-- GET SHARED ADDRESS RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_shared_address(
    p_reservation_id UUID,
    p_access_token TEXT
)
RETURNS TABLE (
    address_label TEXT,
    full_address TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT a.label, a.full_address
    FROM public.gift_reservations AS r
    JOIN private.gift_reservation_secrets AS s
      ON s.reservation_id = r.id
    JOIN public.addresses AS a
      ON a.id = r.shared_address_id
    JOIN public.wishlist_items AS wi
      ON wi.id = r.wishlist_item_id
     AND wi.user_id = a.user_id
    WHERE r.id = p_reservation_id
      AND (s.token_hash = encode(extensions.digest(p_access_token, 'sha256'), 'hex')
           OR s.access_token::text = p_access_token)
      AND r.status = 'active'
      AND r.expires_at > pg_catalog.now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_address(UUID, TEXT) TO anon, authenticated;

-- ============================================================
-- CANCEL & COMPLETE RESERVATION RPCS
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancel_gift_reservation(
    p_reservation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_item_id UUID;
    v_owner_id UUID;
    v_item_status TEXT;
    v_reservation_status TEXT;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT r.wishlist_item_id INTO v_item_id
    FROM public.gift_reservations AS r
    WHERE r.id = p_reservation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation does not exist.' USING ERRCODE = 'P0002';
    END IF;

    SELECT wi.user_id, wi.status
    INTO v_owner_id, v_item_status
    FROM public.wishlist_items AS wi
    WHERE wi.id = v_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wishlist item does not exist.' USING ERRCODE = '23503';
    END IF;

    IF v_owner_id IS DISTINCT FROM (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Only the wishlist owner can cancel reservations.'
            USING ERRCODE = '42501';
    END IF;

    SELECT r.status INTO v_reservation_status
    FROM public.gift_reservations AS r
    WHERE r.id = p_reservation_id
      AND r.wishlist_item_id = v_item_id
    FOR UPDATE;

    IF NOT FOUND OR v_reservation_status <> 'active' THEN
        RAISE EXCEPTION 'Reservation is not active.' USING ERRCODE = '55000';
    END IF;

    UPDATE public.gift_reservations
    SET status = 'cancelled',
        cancelled_at = pg_catalog.now(),
        shared_address_id = NULL
    WHERE id = p_reservation_id;

    UPDATE public.wishlist_items
    SET status = 'available'
    WHERE id = v_item_id AND status = 'reserved';
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_gift_reservation(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_gift_reservation(
    p_reservation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_item_id UUID;
    v_owner_id UUID;
    v_item_status TEXT;
    v_reservation_status TEXT;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT r.wishlist_item_id INTO v_item_id
    FROM public.gift_reservations AS r
    WHERE r.id = p_reservation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation does not exist.' USING ERRCODE = 'P0002';
    END IF;

    SELECT wi.user_id, wi.status
    INTO v_owner_id, v_item_status
    FROM public.wishlist_items AS wi
    WHERE wi.id = v_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wishlist item does not exist.' USING ERRCODE = '23503';
    END IF;

    IF v_owner_id IS DISTINCT FROM (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Only the wishlist owner can complete a gift.'
            USING ERRCODE = '42501';
    END IF;

    SELECT r.status INTO v_reservation_status
    FROM public.gift_reservations AS r
    WHERE r.id = p_reservation_id
      AND r.wishlist_item_id = v_item_id
    FOR UPDATE;

    IF NOT FOUND OR v_reservation_status <> 'active' THEN
        RAISE EXCEPTION 'Reservation is not active.' USING ERRCODE = '55000';
    END IF;

    UPDATE public.gift_reservations
    SET status = 'completed',
        completed_at = pg_catalog.now(),
        shared_address_id = NULL
    WHERE id = p_reservation_id;

    UPDATE public.wishlist_items
    SET status = 'gifted'
    WHERE id = v_item_id AND status = 'reserved';
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_gift_reservation(UUID) TO authenticated;
