-- Migration 008: Auto-Add Users to Organisation
-- This migration creates a trigger to automatically add new users to an organisation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
  new_org_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;

  -- Get or create default organisation
  SELECT id INTO default_org_id
  FROM organisations
  WHERE slug = 'default'
  LIMIT 1;

  IF default_org_id IS NULL THEN
    INSERT INTO organisations (id, name, slug, plan)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Default Organisation',
      'default',
      'enterprise'
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO default_org_id;
  END IF;

  -- Create personal organisation for this user
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

  -- Also add user as member of default organisation (fallback)
  IF default_org_id IS NOT NULL THEN
    INSERT INTO organisation_members (organisation_id, user_id, role)
    VALUES (default_org_id, NEW.id, 'member')
    ON CONFLICT (organisation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
