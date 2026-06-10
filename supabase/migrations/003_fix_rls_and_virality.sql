-- 003_fix_rls_and_virality.sql
-- Fix 1: Create SECURITY DEFINER is_admin() to break recursive RLS loop
-- Fix 2: Drop old recursive policies, create non-recursive ones
-- Fix 3: Guard for virality_score column if missing

-- ============================================================
-- 1. SECURITY DEFINER helper — bypasses RLS on public.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- ============================================================
-- 2. Drop all old recursive policies
-- ============================================================
DROP POLICY IF EXISTS admin_all_users ON public.users;
DROP POLICY IF EXISTS admin_all_settings ON public.settings;
DROP POLICY IF EXISTS admin_all_campaigns ON public.campaigns;
DROP POLICY IF EXISTS admin_all_clips ON public.clips;
DROP POLICY IF EXISTS admin_all_content_schedule ON public.content_schedule;
DROP POLICY IF EXISTS admin_all_content_series ON public.content_series;
DROP POLICY IF EXISTS admin_all_analytics_events ON public.analytics_events;

-- ============================================================
-- 3. Create new non-recursive policies using is_admin()
-- ============================================================
-- users — admins see all; users see their own row
CREATE POLICY admin_all_users ON public.users FOR ALL USING (
  public.is_admin()
);
CREATE POLICY user_self_users ON public.users FOR SELECT USING (
  id = auth.uid()
);

-- settings — admins see all; users see their own
CREATE POLICY admin_all_settings ON public.settings FOR ALL USING (
  public.is_admin()
);
CREATE POLICY user_self_settings ON public.settings FOR ALL USING (
  user_id = auth.uid()
);

-- campaigns — admins see all; users see their own
CREATE POLICY admin_all_campaigns ON public.campaigns FOR ALL USING (
  public.is_admin()
);
CREATE POLICY user_self_campaigns ON public.campaigns FOR ALL USING (
  user_id = auth.uid()
);

-- clips — admins see all; users see their own
CREATE POLICY admin_all_clips ON public.clips FOR ALL USING (
  public.is_admin()
);
CREATE POLICY user_self_clips ON public.clips FOR ALL USING (
  user_id = auth.uid()
);

-- content_schedule — admins see all; users see their own
CREATE POLICY admin_all_content_schedule ON public.content_schedule FOR ALL USING (
  public.is_admin()
);
CREATE POLICY user_self_content_schedule ON public.content_schedule FOR ALL USING (
  user_id = auth.uid()
);

-- content_series — admins see all; users see their own
CREATE POLICY admin_all_content_series ON public.content_series FOR ALL USING (
  public.is_admin()
);
CREATE POLICY user_self_content_series ON public.content_series FOR ALL USING (
  user_id = auth.uid()
);

-- analytics_events — admins see all; users insert their own
CREATE POLICY admin_all_analytics_events ON public.analytics_events FOR ALL USING (
  public.is_admin()
);
CREATE POLICY user_self_analytics_events ON public.analytics_events FOR ALL USING (
  user_id = auth.uid()
);

-- ============================================================
-- 4. Guard: add virality_score if missing from clips
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clips'
      AND column_name = 'virality_score'
  ) THEN
    ALTER TABLE public.clips ADD COLUMN virality_score NUMERIC DEFAULT 0;
  END IF;
END;
$$;
