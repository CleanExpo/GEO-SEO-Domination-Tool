-- Migration: 005_theming_system.sql
-- Description: Per-tenant white-label theming with colour schemes, logos, and custom domains
-- Dependencies: 003_multi_tenancy_foundation.sql
-- Author: Orchestra Coordinator (Phase 3)
-- Date: 2025-10-05

-- ============================================================
-- THEMING SYSTEM TABLES
-- ============================================================

-- Organisation themes table
CREATE TABLE IF NOT EXISTS organisation_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Colour scheme (Australian English spelling)
  primary_colour varchar(7) NOT NULL DEFAULT '#10b981', -- emerald-500
  secondary_colour varchar(7) NOT NULL DEFAULT '#14b8a6', -- teal-500
  accent_colour varchar(7) NOT NULL DEFAULT '#3b82f6', -- blue-500

  -- Brand assets (Supabase Storage URLs)
  logo_url text,
  logo_dark_url text, -- Dark mode variant
  favicon_url text,

  -- Custom domain configuration
  custom_domain text,
  custom_domain_verified boolean DEFAULT false,

  -- Typography
  font_family text DEFAULT 'Inter',
  heading_font_family text, -- Optional separate heading font

  -- UI preferences
  border_radius text DEFAULT 'md' CHECK (border_radius IN ('none', 'sm', 'md', 'lg', 'xl')),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  CONSTRAINT valid_hex_primary CHECK (primary_colour ~* '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT valid_hex_secondary CHECK (secondary_colour ~* '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT valid_hex_accent CHECK (accent_colour ~* '^#[0-9A-Fa-f]{6}$')
);

-- Indexes for performance
CREATE INDEX idx_organisation_themes_org_id ON organisation_themes(organisation_id);
CREATE INDEX idx_organisation_themes_custom_domain ON organisation_themes(custom_domain) WHERE custom_domain IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE organisation_themes ENABLE ROW LEVEL SECURITY;

-- Policy: Organisation members can view their org's theme
CREATE POLICY org_themes_select ON organisation_themes
  FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id
      FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Organisation admins can update theme
CREATE POLICY org_themes_update ON organisation_themes
  FOR UPDATE
  USING (
    organisation_id IN (
      SELECT organisation_id
      FROM organisation_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id
      FROM organisation_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Policy: Organisation admins can insert theme
CREATE POLICY org_themes_insert ON organisation_themes
  FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id
      FROM organisation_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Policy: Organisation owners can delete theme (reset to default)
CREATE POLICY org_themes_delete ON organisation_themes
  FOR DELETE
  USING (
    organisation_id IN (
      SELECT organisation_id
      FROM organisation_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- ============================================================
-- STORAGE BUCKET FOR BRAND ASSETS
-- ============================================================

-- Create storage bucket for organisation branding
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organisation-branding',
  'organisation-branding',
  true, -- Public access for logos/favicons
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Organisation members can view
CREATE POLICY org_branding_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'organisation-branding' AND
    (storage.foldername(name))[1] IN (
      SELECT organisation_id::text
      FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

-- Storage policy: Organisation admins can upload
CREATE POLICY org_branding_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'organisation-branding' AND
    (storage.foldername(name))[1] IN (
      SELECT organisation_id::text
      FROM organisation_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Storage policy: Organisation admins can update
CREATE POLICY org_branding_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'organisation-branding' AND
    (storage.foldername(name))[1] IN (
      SELECT organisation_id::text
      FROM organisation_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    bucket_id = 'organisation-branding' AND
    (storage.foldername(name))[1] IN (
      SELECT organisation_id::text
      FROM organisation_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Storage policy: Organisation admins can delete
CREATE POLICY org_branding_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'organisation-branding' AND
    (storage.foldername(name))[1] IN (
      SELECT organisation_id::text
      FROM organisation_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organisation_theme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_update_organisation_theme_timestamp
  BEFORE UPDATE ON organisation_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_organisation_theme_updated_at();

-- Function: Create default theme on organisation creation
CREATE OR REPLACE FUNCTION create_default_organisation_theme()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organisation_themes (organisation_id, created_by)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (organisation_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create default theme for new organisations
CREATE TRIGGER trigger_create_default_theme
  AFTER INSERT ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_organisation_theme();

-- ============================================================
-- SEED DATA (Default themes for existing organisations)
-- ============================================================

-- Create default themes for any existing organisations without themes
INSERT INTO organisation_themes (organisation_id, created_by)
SELECT
  o.id,
  o.created_by
FROM organisations o
LEFT JOIN organisation_themes ot ON o.id = ot.organisation_id
WHERE ot.id IS NULL;

-- ============================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================

COMMENT ON TABLE organisation_themes IS 'White-label theming configuration per organisation';
COMMENT ON COLUMN organisation_themes.primary_colour IS 'Primary brand colour in hex format';
COMMENT ON COLUMN organisation_themes.custom_domain IS 'Custom domain for white-label hosting (e.g., app.customer.com)';
COMMENT ON COLUMN organisation_themes.border_radius IS 'Global UI border radius preference';
