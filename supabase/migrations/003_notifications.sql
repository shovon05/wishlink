-- 003_notifications.sql
-- Wishlink Notifications & Realtime Trigger Automation

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES public.gift_reservations (id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL DEFAULT 'gift_reserved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_user_read_at_idx ON public.notifications (user_id, read_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated;

GRANT SELECT, UPDATE (read_at) ON TABLE public.notifications TO authenticated;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
CREATE POLICY "Users can mark own notifications as read"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Enable Supabase Realtime for notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- Trigger: When a reservation is inserted, automatically notify the wishlist owner
CREATE OR REPLACE FUNCTION public.notify_owner_on_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    SELECT wi.user_id
      INTO v_owner_id
      FROM public.wishlist_items wi
     WHERE wi.id = NEW.wishlist_item_id;

    IF v_owner_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            reservation_id,
            notification_type
        )
        VALUES (
            v_owner_id,
            NEW.id,
            'gift_reserved'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_owner_on_reservation ON public.gift_reservations;
CREATE TRIGGER tr_notify_owner_on_reservation
    AFTER INSERT ON public.gift_reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_owner_on_reservation();

