-- ==========================================
-- MIGRATION: Notifications RLS Policies
-- ==========================================

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS POLICIES

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can create notifications for their palika
CREATE POLICY "Admins can create notifications for their palika"
    ON public.notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_regions ar
            WHERE ar.admin_id = auth.uid()
            AND ar.region_type = 'palika'
            AND ar.region_id = notifications.palika_id
        )
    );

-- Users can update their own notification's is_seen status
CREATE POLICY "Users can update their own notification seen status"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can update notifications in their palika
CREATE POLICY "Admins can update notifications in their palika"
    ON public.notifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_regions ar
            WHERE ar.admin_id = auth.uid()
            AND ar.region_type = 'palika'
            AND ar.region_id = notifications.palika_id
        )
    );

-- Admins can delete notifications in their palika
CREATE POLICY "Admins can delete notifications in their palika"
    ON public.notifications
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_regions ar
            WHERE ar.admin_id = auth.uid()
            AND ar.region_type = 'palika'
            AND ar.region_id = notifications.palika_id
        )
    );

-- NOTIFICATION ATTACHMENTS POLICIES

-- Users can view attachments for their own notifications
CREATE POLICY "Users can view attachments for their notifications"
    ON public.notification_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.notifications n
            WHERE n.id = notification_attachments.notification_id
            AND n.user_id = auth.uid()
        )
    );

-- Admins can create attachments for notifications in their palika
CREATE POLICY "Admins can create attachments for their palika notifications"
    ON public.notification_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notifications n
            WHERE n.id = notification_attachments.notification_id
            AND EXISTS (
                SELECT 1 FROM public.admin_regions ar
                WHERE ar.admin_id = auth.uid()
                AND ar.region_type = 'palika'
                AND ar.region_id = n.palika_id
            )
        )
    );

-- NOTIFICATION PREFERENCES POLICIES

-- Users can view their own preferences
CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own preferences
CREATE POLICY "Users can create their own notification preferences"
    ON public.notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
    ON public.notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
