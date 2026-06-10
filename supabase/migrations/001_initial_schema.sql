-- 001_initial_schema.sql — Full DDL for Velora database
-- 7 tables (profiles renamed to users), RLS policies, handle_new_user trigger, Realtime publication

CREATE EXTENSION IF NOT EXISTS pgsodium;

-- 1. users — mirrors auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. settings — stores plaintext or Vault secret_id
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- 3. campaigns — video campaign definitions
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. clips — clip queue and results (Realtime target)
CREATE TABLE IF NOT EXISTS public.clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_ts NUMERIC,
  end_ts NUMERIC,
  status TEXT DEFAULT 'queued',
  step TEXT,
  current_step TEXT,
  mode TEXT NOT NULL DEFAULT 'simple',
  clip_style TEXT DEFAULT 'auto',
  target_duration TEXT DEFAULT 'dynamic',
  user_prompt TEXT,
  virality_score NUMERIC DEFAULT 0,
  edit_state JSONB DEFAULT '{}'::jsonb,
  drive_url TEXT,
  drive_folder_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. content_schedule — calendar scheduling (Phase 3 prep)
CREATE TABLE IF NOT EXISTS public.content_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES public.clips(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT,
  scheduled_at TIMESTAMPTZ,
  caption TEXT,
  hashtags TEXT[],
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. content_series — series groupings
CREATE TABLE IF NOT EXISTS public.content_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. analytics_events — insert-only event log
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES public.clips(id),
  event_type TEXT NOT NULL,
  platform TEXT,
  value NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all 7 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies: users
CREATE POLICY admin_all_users ON public.users FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- RLS policies: settings
CREATE POLICY admin_all_settings ON public.settings FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- RLS policies: campaigns
CREATE POLICY admin_all_campaigns ON public.campaigns FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- RLS policies: clips
CREATE POLICY admin_all_clips ON public.clips FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- RLS policies: content_schedule
CREATE POLICY admin_all_content_schedule ON public.content_schedule FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- RLS policies: content_series
CREATE POLICY admin_all_content_series ON public.content_series FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- RLS policies: analytics_events
CREATE POLICY admin_all_analytics_events ON public.analytics_events FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- handle_new_user trigger function — first signup becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users) THEN
    INSERT INTO public.users (id, email, role) VALUES (NEW.id, NEW.email, 'admin');
  ELSE
    INSERT INTO public.users (id, email, role) VALUES (NEW.id, NEW.email, 'guest');
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add clips table to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'clips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clips;
  END IF;
END;
$$;
