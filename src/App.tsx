import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import CompanyProfile from '@/pages/CompanyProfile'
import WebsiteAudit from '@/pages/WebsiteAudit'
import LocalRanking from '@/pages/LocalRanking'
import CompetitorAnalysis from '@/pages/CompetitorAnalysis'
import Citations from '@/pages/Citations'
import Reports from '@/pages/Reports'
import AIStrategy from '@/pages/AIStrategy'
import Campaigns from '@/pages/Campaigns'
import ProjectHub from '@/pages/ProjectHub'
import ApiKeyManager from '@/pages/ApiKeyManager'
import ProjectConfig from '@/pages/ProjectConfig'
import IntegrationsHub from '@/pages/IntegrationsHub'
import WebhookManager from '@/pages/WebhookManager'
import IntegrationStatus from '@/pages/IntegrationStatus'
import ProjectGenerator from '@/pages/ProjectGenerator'
import WebsiteScraper from '@/pages/WebsiteScraper'
import Layout from '@/components/common/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<CompanyProfile />} />
          <Route path="/audit" element={<WebsiteAudit />} />
          <Route path="/scraper" element={<WebsiteScraper />} />
          <Route path="/ranking" element={<LocalRanking />} />
          <Route path="/competitors" element={<CompetitorAnalysis />} />
          <Route path="/citations" element={<Citations />} />
          <Route path="/ai-strategy" element={<AIStrategy />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/project-hub" element={<ProjectHub />} />
          <Route path="/project-generator" element={<ProjectGenerator />} />
          <Route path="/integrations" element={<IntegrationsHub />} />
          <Route path="/webhooks" element={<WebhookManager />} />
          <Route path="/integration-status" element={<IntegrationStatus />} />
          <Route path="/api-keys" element={<ApiKeyManager />} />
          <Route path="/project-config" element={<ProjectConfig />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
