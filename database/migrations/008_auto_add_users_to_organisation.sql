-- Migration: 008_auto_add_users_to_organisation.sql
-- Purpose: Auto-add new users to default organisation when they sign up
-- Author: Claude Code Agent
-- Date: 2025-10-05
-- Ticket: TENANT-002

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

BEGIN;

-- Create or replace the handle_new_user function to include organisation assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
  new_org_id UUID;
BEGIN
  -- Create profile for the new user
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;

  -- Get the default organisation ID
  SELECT id INTO default_org_id
  FROM organisations
  WHERE slug = 'default'
  LIMIT 1;

  -- If default organisation doesn't exist, create it
  IF default_org_id IS NULL THEN
    INSERT INTO organisations (id, name, slug, plan)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organisation', 'default', 'enterprise')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO default_org_id;
  END IF;

  -- Create a personal organisation for the new user
  INSERT INTO organisations (name, slug, plan)
  VALUES (
    COALESCE(NEW.email, 'User') || '''s Organisation',
    'user-' || NEW.id::text,
    'free'
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner of their personal organisation
  INSERT INTO organisation_members (organisation_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner')
  ON CONFLICT (organisation_id, user_id) DO NOTHING;

  -- Also add them as member of default organisation (fallback)
  IF default_org_id IS NOT NULL THEN
    INSERT INTO organisation_members (organisation_id, user_id, role)
    VALUES (default_org_id, NEW.id, 'member')
    ON CONFLICT (organisation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates profile and organisation membership when a new user signs up';

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- ============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================================================

-- To rollback this migration, restore the original handle_new_user function:
-- BEGIN;
--
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, role)
--   VALUES (NEW.id, NEW.email, 'free')
--   ON CONFLICT (id) DO NOTHING;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();
--
-- COMMIT;
