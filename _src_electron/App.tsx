import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/common/Layout'
import Dashboard from '@/pages/Dashboard'
import Calendar from '@/pages/Calendar'
import Contacts from '@/pages/Contacts'
import Companies from '@/pages/Companies'
import Deals from '@/pages/Deals'
import Interactions from '@/pages/Interactions'
import Tasks from '@/pages/Tasks'
import Projects from '@/pages/Projects'
import GitHubProjects from '@/pages/GitHubProjects'
import Notes from '@/pages/Notes'
import Prompts from '@/pages/Prompts'
import ComponentsLibrary from '@/pages/ComponentsLibrary'
import AITools from '@/pages/AITools'
import Tutorials from '@/pages/Tutorials'
import Support from '@/pages/Support'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/interactions" element={<Interactions />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/github-projects" element={<GitHubProjects />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/components-library" element={<ComponentsLibrary />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
