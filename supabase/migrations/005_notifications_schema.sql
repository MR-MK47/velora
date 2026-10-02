-- 005_notifications_schema.sql
-- Velora Real-time Notification System Schema
-- Adds notifications table, RLS policies, Realtime publication, and automated high-virality DB trigger

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES public.clips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'high_virality',
  virality_score NUMERIC DEFAULT 0,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY admin_all_notifications ON public.notifications FOR ALL USING (
  public.is_admin()
);

CREATE POLICY user_self_notifications ON public.notifications FOR ALL USING (
  user_id = auth.uid()
);

-- Enable Realtime for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

-- Trigger Function: Automatically create notification when a high virality clip is created/updated
CREATE OR REPLACE FUNCTION public.handle_high_virality_clip_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trigger if virality score >= 80 and no notification exists yet for this clip
  IF (NEW.virality_score IS NOT NULL AND NEW.virality_score >= 80) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE clip_id = NEW.id AND type = 'high_virality'
    ) THEN
      INSERT INTO public.notifications (
        user_id,
        clip_id,
        title,
        message,
        type,
        virality_score,
        is_read
      ) VALUES (
        NEW.user_id,
        NEW.id,
        '🔥 High-Virality Clip Identified!',
        CONCAT('Clip (Score: ', NEW.virality_score, '/100) is ready for publishing.'),
        'high_virality',
        NEW.virality_score,
        FALSE
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to public.clips for both INSERT and UPDATE
DROP TRIGGER IF EXISTS on_high_virality_clip ON public.clips;
CREATE TRIGGER on_high_virality_clip
  AFTER INSERT OR UPDATE ON public.clips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_high_virality_clip_notification();
