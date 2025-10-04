-- ========================================
-- FILE 8 OF 8: Create Triggers
-- Purpose: Create database triggers for auto-profile creation and updated_at timestamps
-- Dependencies: All tables from Files 1-7
-- Run this AFTER SUPABASE-07-enable-rls.sql completes
-- ========================================

-- ========================================
-- AUTO-PROFILE CREATION TRIGGER
-- ========================================

-- Function: Automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile record when a new user signs up';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- UPDATED_AT TIMESTAMP TRIGGERS
-- ========================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Updates the updated_at timestamp whenever a row is modified';

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'user_settings', 'user_api_keys',
      'companies', 'keywords', 'seo_audits',
      'crm_contacts', 'crm_deals', 'crm_tasks', 'crm_calendar_events', 'crm_support_tickets',
      'hub_projects', 'hub_collections', 'project_templates', 'generated_projects',
      'crm_projects', 'crm_project_notes', 'crm_github_projects',
      'crm_prompts', 'crm_components', 'crm_ai_tools', 'crm_tutorials',
      'job_schedules'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl, tbl);
  END LOOP;
END $$;

-- ========================================
-- CUSTOM BUSINESS LOGIC TRIGGERS
-- ========================================

-- Function: Update company's last accessed timestamp when related data is accessed
CREATE OR REPLACE FUNCTION update_company_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE companies
    SET updated_at = NOW()
    WHERE id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_company_last_accessed IS 'Updates company timestamp when related records are modified';

-- Apply to keywords table
DROP TRIGGER IF EXISTS update_company_on_keyword_change ON keywords;
CREATE TRIGGER update_company_on_keyword_change
  AFTER INSERT OR UPDATE ON keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_company_last_accessed();

-- Apply to seo_audits table
DROP TRIGGER IF EXISTS update_company_on_audit_change ON seo_audits;
CREATE TRIGGER update_company_on_audit_change
  AFTER INSERT OR UPDATE ON seo_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_company_last_accessed();

-- Function: Calculate ranking change automatically
CREATE OR REPLACE FUNCTION calculate_rank_change()
RETURNS TRIGGER AS $$
DECLARE
  previous_rank INTEGER;
BEGIN
  -- Get the most recent rank for this keyword (excluding current insert)
  SELECT rank INTO previous_rank
  FROM rankings
  WHERE keyword_id = NEW.keyword_id
    AND id != NEW.id
  ORDER BY checked_at DESC
  LIMIT 1;

  -- Calculate rank change (negative = improvement, positive = decline)
  IF previous_rank IS NOT NULL THEN
    NEW.rank_change = NEW.rank - previous_rank;
  ELSE
    NEW.rank_change = 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_rank_change IS 'Automatically calculates rank change based on previous ranking';

DROP TRIGGER IF EXISTS calculate_rank_change_on_insert ON rankings;
CREATE TRIGGER calculate_rank_change_on_insert
  BEFORE INSERT ON rankings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_rank_change();

-- Function: Update keyword's current_rank when new ranking is added
CREATE OR REPLACE FUNCTION update_keyword_current_rank()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE keywords
  SET current_rank = NEW.rank,
      updated_at = NOW()
  WHERE id = NEW.keyword_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_keyword_current_rank IS 'Updates keyword current_rank when new ranking is recorded';

DROP TRIGGER IF EXISTS update_keyword_rank_on_ranking_insert ON rankings;
CREATE TRIGGER update_keyword_rank_on_ranking_insert
  AFTER INSERT ON rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_current_rank();

-- Function: Increment usage count on resource access
CREATE OR REPLACE FUNCTION increment_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.usage_count = COALESCE(OLD.usage_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_usage_count IS 'Increments usage_count when UPDATE is called on resource tables';

-- Apply to resource tables (usage tracking)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['crm_prompts', 'crm_components', 'crm_ai_tools'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS increment_%I_usage ON %I', tbl, tbl);
    -- Note: This trigger would be manually activated by application code via UPDATE
  END LOOP;
END $$;

-- Function: Increment tutorial views count
CREATE OR REPLACE FUNCTION increment_tutorial_views()
RETURNS TRIGGER AS $$
BEGIN
  NEW.views = COALESCE(OLD.views, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_tutorial_views IS 'Increments views count for tutorials';

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify trigger on auth.users
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Verify updated_at triggers exist
SELECT
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'update_%_updated_at'
ORDER BY event_object_table;

-- Verify custom triggers exist
SELECT
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'update_company_on_keyword_change',
    'update_company_on_audit_change',
    'calculate_rank_change_on_insert',
    'update_keyword_rank_on_ranking_insert'
  )
ORDER BY event_object_table;

-- Verify functions exist
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'update_updated_at_column',
    'update_company_last_accessed',
    'calculate_rank_change',
    'update_keyword_current_rank',
    'increment_usage_count',
    'increment_tutorial_views'
  )
ORDER BY routine_name;

-- Expected output: All triggers and functions should be listed
