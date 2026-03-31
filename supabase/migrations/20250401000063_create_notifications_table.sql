-- ==========================================
-- MIGRATION: Create Notifications System
-- ==========================================

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Recipient
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    palika_id INTEGER NOT NULL REFERENCES palikas(id),

    -- Type: 'general' for all users, 'personal' for specific users
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('general', 'personal')),
    category VARCHAR(100) NOT NULL, -- e.g., 'event', 'heritage', 'business', 'system', 'announcement'

    -- Content
    title VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    body_full TEXT,
    image_url TEXT,

    -- Status
    is_seen BOOLEAN DEFAULT false, -- Only for personal notifications

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT notification_type_personal_seen CHECK (
        (notification_type = 'personal') OR (notification_type = 'general' AND is_seen = false)
    )
);

-- NOTIFICATION ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.notification_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,

    -- Attachment details
    attachment_name VARCHAR(300) NOT NULL,
    attachment_url TEXT NOT NULL,
    attachment_type VARCHAR(50) NOT NULL CHECK (attachment_type IN ('file', 'web_url', 'app_link')),
    file_type VARCHAR(50), -- e.g., 'pdf', 'image', 'document'
    display_label VARCHAR(200),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    palika_id INTEGER NOT NULL REFERENCES palikas(id),

    -- Notification categories toggle
    enable_general_notifications BOOLEAN DEFAULT true,
    enable_personal_notifications BOOLEAN DEFAULT true,
    enable_event_notifications BOOLEAN DEFAULT true,
    enable_heritage_notifications BOOLEAN DEFAULT false,
    enable_business_notifications BOOLEAN DEFAULT true,
    enable_system_notifications BOOLEAN DEFAULT true,

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_palika ON public.notifications(palika_id);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_category ON public.notifications(category);
CREATE INDEX idx_notifications_is_seen ON public.notifications(is_seen);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_type_seen ON public.notifications(user_id, notification_type, is_seen);

CREATE INDEX idx_notification_attachments_notification ON public.notification_attachments(notification_id);
CREATE INDEX idx_notification_attachments_type ON public.notification_attachments(attachment_type);

CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);
