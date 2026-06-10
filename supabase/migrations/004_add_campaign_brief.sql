-- 004_add_campaign_brief.sql
-- Add campaign_brief column to campaigns table for campaign descriptions

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaigns'
      AND column_name = 'campaign_brief'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN campaign_brief TEXT DEFAULT '';
  END IF;
END;
$$;
