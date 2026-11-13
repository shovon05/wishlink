-- 005_fix_reservation_lifecycle.sql
-- Fixes WL-DB-001 (rate-limit timestamp column name mismatch in reserve_gift)
-- Fixes WL-PRIV-001 (removes auto-sharing address in reserve_gift to enforce explicit per-request consent)
-- Implements WL-PRIV-002 (explicit approve_gift_disclosure, decline_gift_reservation, and revoke_gift_disclosure RPCs)

-- 1. Additive columns for granular disclosure tracking
ALTER TABLE public.gift_reservations
    ADD COLUMN IF NOT EXISTS disclosed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS disclosure_note TEXT;

-- 2. Corrected reserve_gift RPC
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
    v_recent_reservations INT;
BEGIN
    IF p_wishlist_item_id IS NULL OR p_is_anonymous IS NULL THEN
        RAISE EXCEPTION 'Item and anonymity selection are required.'
            USING ERRCODE = '22004';
    END IF;

    -- 1. Atomically lock and inspect the wishlist item
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

    -- 2. Anti-griefing check: If already reserved, check if prior reservation expired
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

    -- 3. Rate-limiting check: Prevent flooding active reservations on a single recipient's list
    -- Fixes WL-DB-001: Correctly query r.reserved_at instead of non-existent r.created_at
    SELECT COUNT(*)
      INTO v_recent_reservations
      FROM public.gift_reservations r
      JOIN public.wishlist_items wi ON wi.id = r.wishlist_item_id
     WHERE wi.user_id = v_owner_id
       AND r.reserved_at > (pg_catalog.now() - INTERVAL '15 minutes')
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

    -- 5. Fixes WL-PRIV-001: Strict privacy invariant.
    -- Never auto-share address upon reservation creation. All reservations start with NULL shared_address_id.
    -- Explicit owner approval via approve_gift_disclosure is strictly required.

    -- 6. Cryptographically secure token generation and hashing
    v_reservation_id := pg_catalog.gen_random_uuid();
    v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
    v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

    INSERT INTO public.gift_reservations (
        id,
        wishlist_item_id,
        is_anonymous,
        gifter_contact,
        shared_address_id,
        status,
        expires_at,
        reserved_at
    )
    VALUES (
        v_reservation_id,
        p_wishlist_item_id,
        p_is_anonymous,
        v_contact,
        NULL, -- Gated on explicit consent
        'active',
        pg_catalog.now() + INTERVAL '14 days',
        pg_catalog.now()
    );

    INSERT INTO private.gift_reservation_secrets (
        reservation_id,
        token_hash
    )
    VALUES (
        v_reservation_id,
        v_token_hash
    );

    UPDATE public.wishlist_items
       SET status = 'reserved'
     WHERE id = p_wishlist_item_id;

    RETURN QUERY SELECT v_reservation_id, v_raw_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_gift(UUID, BOOLEAN, TEXT) TO anon, authenticated;

-- 3. Dedicated Consent-Based Disclosure RPCs (Fixes WL-PRIV-002)

-- Approve Address Disclosure (Owner Only)
CREATE OR REPLACE FUNCTION public.approve_gift_disclosure(
    p_reservation_id UUID,
    p_address_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_item_id UUID;
    v_owner_id UUID;
    v_reservation_status TEXT;
    v_address_owner UUID;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- 1. Verify reservation and lock
    SELECT r.wishlist_item_id, r.status
      INTO v_item_id, v_reservation_status
      FROM public.gift_reservations r
     WHERE r.id = p_reservation_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_reservation_status <> 'active' THEN
        RAISE EXCEPTION 'Cannot approve an inactive or expired reservation.' USING ERRCODE = '55000';
    END IF;

    -- 2. Verify wishlist item ownership
    SELECT wi.user_id
      INTO v_owner_id
      FROM public.wishlist_items wi
     WHERE wi.id = v_item_id;

    IF v_owner_id IS DISTINCT FROM (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Only the wishlist owner can approve address disclosure.' USING ERRCODE = '42501';
    END IF;

    -- 3. Verify selected address belongs to the owner
    SELECT a.user_id
      INTO v_address_owner
      FROM public.addresses a
     WHERE a.id = p_address_id;

    IF NOT FOUND OR v_address_owner IS DISTINCT FROM (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Selected delivery address does not exist or does not belong to you.' USING ERRCODE = '42501';
    END IF;

    -- 4. Apply atomic disclosure grant
    UPDATE public.gift_reservations
       SET shared_address_id = p_address_id,
           disclosed_at = pg_catalog.now(),
           revoked_at = NULL
     WHERE id = p_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_gift_disclosure(UUID, UUID) TO authenticated;

-- Decline Gift Reservation (Owner Only)
CREATE OR REPLACE FUNCTION public.decline_gift_reservation(
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
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- Lock and verify
    SELECT r.wishlist_item_id
      INTO v_item_id
      FROM public.gift_reservations r
     WHERE r.id = p_reservation_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation not found.' USING ERRCODE = 'P0002';
    END IF;

    SELECT wi.user_id
      INTO v_owner_id
      FROM public.wishlist_items wi
     WHERE wi.id = v_item_id
       FOR UPDATE;

    IF v_owner_id IS DISTINCT FROM (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Only the wishlist owner can decline reservations.' USING ERRCODE = '42501';
    END IF;

    -- Update reservation to cancelled
    UPDATE public.gift_reservations
       SET status = 'cancelled',
           cancelled_at = pg_catalog.now(),
           shared_address_id = NULL
     WHERE id = p_reservation_id;

    -- Restore wishlist item availability
    UPDATE public.wishlist_items
       SET status = 'available'
     WHERE id = v_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_gift_reservation(UUID) TO authenticated;

-- Revoke Gift Address Disclosure (Owner Only)
CREATE OR REPLACE FUNCTION public.revoke_gift_disclosure(
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
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT r.wishlist_item_id
      INTO v_item_id
      FROM public.gift_reservations r
     WHERE r.id = p_reservation_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation not found.' USING ERRCODE = 'P0002';
    END IF;

    SELECT wi.user_id
      INTO v_owner_id
      FROM public.wishlist_items wi
     WHERE wi.id = v_item_id;

    IF v_owner_id IS DISTINCT FROM (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Only the wishlist owner can revoke disclosure.' USING ERRCODE = '42501';
    END IF;

    -- Server-side immediate revocation
    UPDATE public.gift_reservations
       SET shared_address_id = NULL,
           revoked_at = pg_catalog.now()
     WHERE id = p_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_gift_disclosure(UUID) TO authenticated;

-- 4. Hardened get_shared_address verifying revocation & expiration
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
      AND s.token_hash = encode(extensions.digest(p_access_token, 'sha256'), 'hex')
      AND r.status = 'active'
      AND r.shared_address_id IS NOT NULL
      AND r.revoked_at IS NULL
      AND r.expires_at > pg_catalog.now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_address(UUID, TEXT) TO anon, authenticated;
