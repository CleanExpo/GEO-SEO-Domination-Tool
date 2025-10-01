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
import Layout from '@/components/common/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<CompanyProfile />} />
          <Route path="/audit" element={<WebsiteAudit />} />
          <Route path="/ranking" element={<LocalRanking />} />
          <Route path="/competitors" element={<CompetitorAnalysis />} />
          <Route path="/citations" element={<Citations />} />
          <Route path="/ai-strategy" element={<AIStrategy />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
