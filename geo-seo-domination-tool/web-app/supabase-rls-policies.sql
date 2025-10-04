-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor AFTER creating tables
-- https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPANIES TABLE POLICIES
-- ============================================================================

-- Users can view their own companies
CREATE POLICY "Users can view their own companies"
  ON companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own companies
CREATE POLICY "Users can insert their own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own companies
CREATE POLICY "Users can update their own companies"
  ON companies FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Users can delete their own companies
CREATE POLICY "Users can delete their own companies"
  ON companies FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- KEYWORDS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view keywords for their companies"
  ON keywords FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = keywords.company_id
    )
  );

CREATE POLICY "Users can insert keywords for their companies"
  ON keywords FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = keywords.company_id
    )
  );

CREATE POLICY "Users can update keywords for their companies"
  ON keywords FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = keywords.company_id
    )
  );

CREATE POLICY "Users can delete keywords for their companies"
  ON keywords FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = keywords.company_id
    )
  );

-- ============================================================================
-- RANKINGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view rankings"
  ON rankings FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN companies c ON c.id = k.company_id
      WHERE k.id = rankings.keyword_id
    )
  );

CREATE POLICY "Users can insert rankings"
  ON rankings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN companies c ON c.id = k.company_id
      WHERE k.id = rankings.keyword_id
    )
  );

-- ============================================================================
-- SEO AUDITS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view SEO audits"
  ON seo_audits FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = seo_audits.company_id
    )
  );

CREATE POLICY "Users can insert SEO audits"
  ON seo_audits FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = seo_audits.company_id
    )
  );

-- ============================================================================
-- CRM CONTACTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their CRM contacts"
  ON crm_contacts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert CRM contacts"
  ON crm_contacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update CRM contacts"
  ON crm_contacts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete CRM contacts"
  ON crm_contacts FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- CRM DEALS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their CRM deals"
  ON crm_deals FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert CRM deals"
  ON crm_deals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update CRM deals"
  ON crm_deals FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- CRM TASKS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their tasks"
  ON crm_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert tasks"
  ON crm_tasks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update tasks"
  ON crm_tasks FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- CRM EVENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their events"
  ON crm_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert events"
  ON crm_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update events"
  ON crm_events FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PROJECTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update projects"
  ON projects FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PROJECT NOTES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view project notes"
  ON project_notes FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_notes.project_id
    )
  );

CREATE POLICY "Users can insert project notes"
  ON project_notes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_notes.project_id
    )
  );

-- ============================================================================
-- RESOURCES TABLE POLICIES (Public Read, Authenticated Write)
-- ============================================================================

-- Resource Prompts
CREATE POLICY "Anyone can view resource prompts"
  ON resource_prompts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert resource prompts"
  ON resource_prompts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Resource Components
CREATE POLICY "Anyone can view resource components"
  ON resource_components FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert resource components"
  ON resource_components FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Resource AI Tools
CREATE POLICY "Anyone can view resource AI tools"
  ON resource_ai_tools FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert resource AI tools"
  ON resource_ai_tools FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Resource Tutorials
CREATE POLICY "Anyone can view resource tutorials"
  ON resource_tutorials FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert resource tutorials"
  ON resource_tutorials FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- NOTIFICATION QUEUE TABLE POLICIES (Service Role Only)
-- ============================================================================

-- Only service role can access notification queue
CREATE POLICY "Service role can manage notification queue"
  ON notification_queue FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- NOTIFICATION HISTORY TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their notification history"
  ON notification_history FOR SELECT
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- GITHUB REPOS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their GitHub repos"
  ON github_repos FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = github_repos.project_id
    )
  );

CREATE POLICY "Users can insert GitHub repos"
  ON github_repos FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = github_repos.project_id
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON crm_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
