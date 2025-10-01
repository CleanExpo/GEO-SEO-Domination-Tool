import { useState } from 'react'

interface Project {
  id: string
  name: string
  slug: string
  description: string
  category: string
  liveUrl: string
  icon: string
  color: string
  status: 'active' | 'development' | 'paused'
  techStack: string[]
}

export default function ProjectHub() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [viewportSize, setViewportSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Sample projects - will be loaded from database
  const projects: Project[] = [
    {
      id: '1',
      name: 'GEO-SEO Domination Tool',
      slug: 'geo-seo-domination',
      description: 'Advanced local SEO and AI-powered ranking analysis',
      category: 'SEO Tool',
      liveUrl: 'https://geo-seo-domination-tool-nk30afugb-unite-group.vercel.app',
      icon: '🚀',
      color: '#3b82f6',
      status: 'active',
      techStack: ['React', 'TypeScript', 'Electron', 'SQLite'],
    },
  ]

  const viewportSizes = {
    desktop: 'w-full h-full',
    tablet: 'w-[768px] h-[1024px] mx-auto',
    mobile: 'w-[375px] h-[667px] mx-auto',
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Project List */}
      <aside className="w-80 bg-card border-r border-border overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold">Project Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your centralized dashboard
          </p>
        </div>

        <div className="p-4">
          <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 mb-4">
            + Add New Project
          </button>

          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedProject?.id === project.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{project.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          project.status === 'active'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}
                      >
                        {project.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {project.category}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent">
              📊 View Analytics
            </button>
            <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent">
              🔑 Manage API Keys
            </button>
            <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent">
              ⚙️ Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - Live Sandbox */}
      <main className="flex-1 flex flex-col bg-background">
        {selectedProject ? (
          <>
            {/* Toolbar */}
            <div className="bg-card border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{selectedProject.icon}</span>
                <div>
                  <h2 className="font-semibold">{selectedProject.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedProject.liveUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Viewport Selector */}
                <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                  <button
                    onClick={() => setViewportSize('desktop')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewportSize === 'desktop'
                        ? 'bg-background shadow-sm'
                        : 'hover:bg-background/50'
                    }`}
                  >
                    🖥️ Desktop
                  </button>
                  <button
                    onClick={() => setViewportSize('tablet')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewportSize === 'tablet'
                        ? 'bg-background shadow-sm'
                        : 'hover:bg-background/50'
                    }`}
                  >
                    📱 Tablet
                  </button>
                  <button
                    onClick={() => setViewportSize('mobile')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewportSize === 'mobile'
                        ? 'bg-background shadow-sm'
                        : 'hover:bg-background/50'
                    }`}
                  >
                    📱 Mobile
                  </button>
                </div>

                <button
                  onClick={() => window.open(selectedProject.liveUrl, '_blank')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm"
                >
                  Open in New Tab →
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="flex-1 overflow-auto bg-muted p-6">
              <div className={`${viewportSizes[viewportSize]} bg-background rounded-lg shadow-2xl overflow-hidden`}>
                <iframe
                  src={selectedProject.liveUrl}
                  className="w-full h-full border-0"
                  title={selectedProject.name}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="bg-card border-t border-border px-6 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">Tech Stack:</span>
                <div className="flex gap-2">
                  {selectedProject.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-muted rounded text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>Last updated: Just now</span>
                <button className="hover:text-foreground">🔄 Refresh</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Project Hub</h2>
              <p className="text-muted-foreground">
                Select a project from the sidebar to view it in the live sandbox
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
