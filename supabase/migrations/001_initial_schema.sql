-- 001_initial_schema.sql — Full DDL for Velora database
-- 7 tables, RLS policies, handle_new_user trigger, Realtime publication

CREATE EXTENSION IF NOT EXISTS pgsodium;

-- 1. profiles — mirrors auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. settings — stores plaintext or Vault secret_id
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- 3. campaigns — video campaign definitions
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. clips — clip queue and results (Realtime target)
CREATE TABLE IF NOT EXISTS public.clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_ts NUMERIC,
  end_ts NUMERIC,
  status TEXT DEFAULT 'queued',
  step TEXT,
  drive_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. content_schedule — calendar scheduling (Phase 3 prep)
CREATE TABLE IF NOT EXISTS public.content_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES public.clips(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. analytics_events — insert-only event log
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES public.clips(id),
  event_type TEXT NOT NULL,
  platform TEXT,
  value NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all 7 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies: profiles
CREATE POLICY select_own_profiles ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY insert_own_profiles ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY update_own_profiles ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY delete_own_profiles ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS policies: settings
CREATE POLICY select_own_settings ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_settings ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_settings ON public.settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY delete_own_settings ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- RLS policies: campaigns
CREATE POLICY select_own_campaigns ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_campaigns ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_campaigns ON public.campaigns FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY delete_own_campaigns ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

-- RLS policies: clips
CREATE POLICY select_own_clips ON public.clips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_clips ON public.clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_clips ON public.clips FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY delete_own_clips ON public.clips FOR DELETE USING (auth.uid() = user_id);

-- RLS policies: content_schedule
CREATE POLICY select_own_content_schedule ON public.content_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_content_schedule ON public.content_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_content_schedule ON public.content_schedule FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY delete_own_content_schedule ON public.content_schedule FOR DELETE USING (auth.uid() = user_id);

-- RLS policies: content_series
CREATE POLICY select_own_content_series ON public.content_series FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_content_series ON public.content_series FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_content_series ON public.content_series FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY delete_own_content_series ON public.content_series FOR DELETE USING (auth.uid() = user_id);

-- RLS policies: analytics_events (insert-only)
CREATE POLICY select_own_analytics_events ON public.analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_analytics_events ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- handle_new_user trigger function — first signup becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
    INSERT INTO public.profiles (id, email, role) VALUES (NEW.id, NEW.email, 'admin');
  ELSE
    INSERT INTO public.profiles (id, email, role) VALUES (NEW.id, NEW.email, 'user');
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.clips;
