-- 004_security_hardening.sql
-- Wishlink Batch Reordering, Hardened Permissions & Expiry Sweeper

-- ============================================================
-- BATCH REORDER WISHLIST ITEMS
-- ============================================================

CREATE OR REPLACE FUNCTION public.reorder_wishlist_items(
    p_item_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_mismatched_count INT;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF p_item_ids IS NULL OR pg_catalog.array_length(p_item_ids, 1) = 0 THEN
        RETURN;
    END IF;

    -- Verify that every item belongs to the authenticated user
    SELECT COUNT(*)
      INTO v_mismatched_count
      FROM public.wishlist_items wi
     WHERE wi.id = ANY(p_item_ids)
       AND wi.user_id <> v_user_id;

    IF v_mismatched_count > 0 THEN
        RAISE EXCEPTION 'Unauthorized item in reorder list.' USING ERRCODE = '42501';
    END IF;

    -- Atomically update sort order based on array ordinal position in one roundtrip
    UPDATE public.wishlist_items AS wi
       SET sort_order = pos.idx - 1
      FROM pg_catalog.unnest(p_item_ids) WITH ORDINALITY AS pos(id, idx)
     WHERE wi.id = pos.id
       AND wi.user_id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_wishlist_items(UUID[]) TO authenticated;

-- ============================================================
-- SWEEP EXPIRED RESERVATIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.sweep_expired_reservations()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_expired_count INT;
BEGIN
    WITH expired AS (
        UPDATE public.gift_reservations
           SET status = 'expired',
               shared_address_id = NULL
         WHERE status = 'active'
           AND expires_at <= pg_catalog.now()
        RETURNING wishlist_item_id
    )
    UPDATE public.wishlist_items wi
       SET status = 'available'
      FROM expired
     WHERE wi.id = expired.wishlist_item_id
       AND wi.status = 'reserved';

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    RETURN v_expired_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sweep_expired_reservations() TO authenticated;

