import { useState } from 'react'

interface ProjectTemplate {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  icon: string
  color: string
  techStack: string[]
  features: Feature[]
  integrations: string[]
}

interface Feature {
  key: string
  name: string
  description: string
  category: string
  required: boolean
  requiresIntegration?: string
}

interface GenerationStep {
  name: string
  displayName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  progress: number
}

export default function ProjectGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [projectName, setProjectName] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])
  const [outputPath, setOutputPath] = useState('')
  const [idePreference, setIdePreference] = useState<'vscode' | 'cursor' | 'webstorm' | 'none'>('vscode')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [currentStep, setCurrentStep] = useState<string>('')
  const [overallProgress, setOverallProgress] = useState(0)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [generatedPath, setGeneratedPath] = useState('')

  const templates: ProjectTemplate[] = [
    {
      id: 'react-vite-ts',
      name: 'react-vite-typescript',
      displayName: 'React + Vite + TypeScript',
      description: 'Modern React application with Vite bundler and TypeScript',
      category: 'web',
      icon: '⚛️',
      color: '#61DAFB',
      techStack: ['React 19', 'Vite', 'TypeScript', 'TailwindCSS'],
      features: [
        { key: 'shadcn', name: 'shadcn/ui Components', description: 'Beautiful UI components with Radix UI', category: 'ui', required: false },
        { key: 'auth', name: 'Authentication', description: 'User authentication system', category: 'auth', required: false, requiresIntegration: 'supabase' },
        { key: 'database', name: 'Database Integration', description: 'Database ORM and queries', category: 'data', required: false, requiresIntegration: 'supabase' },
        { key: 'api', name: 'API Routes', description: 'Backend API endpoints', category: 'backend', required: false },
        { key: 'forms', name: 'Form Handling', description: 'Form validation and state management', category: 'ui', required: false },
        { key: 'routing', name: 'Client Routing', description: 'React Router setup', category: 'ui', required: true },
        { key: 'state', name: 'State Management', description: 'Zustand or Redux', category: 'logic', required: false },
        { key: 'testing', name: 'Testing Setup', description: 'Vitest and React Testing Library', category: 'quality', required: false },
        { key: 'ci_cd', name: 'CI/CD Pipeline', description: 'GitHub Actions workflow', category: 'devops', required: false, requiresIntegration: 'github' },
      ],
      integrations: ['shadcn', 'semrush-mcp', 'supabase', 'github', 'vercel', 'openai', 'anthropic', 'firecrawl'],
    },
    {
      id: 'nextjs-app',
      name: 'nextjs-app-router',
      displayName: 'Next.js 15 App Router',
      description: 'Full-stack Next.js application with App Router',
      category: 'fullstack',
      icon: '▲',
      color: '#000000',
      techStack: ['Next.js 15', 'React Server Components', 'TypeScript', 'TailwindCSS'],
      features: [
        { key: 'shadcn', name: 'shadcn/ui Components', description: 'Beautiful UI components with Radix UI', category: 'ui', required: false },
        { key: 'auth', name: 'Authentication', description: 'NextAuth.js setup', category: 'auth', required: false },
        { key: 'database', name: 'Database + ORM', description: 'Prisma or Drizzle ORM', category: 'data', required: false },
        { key: 'api', name: 'API Routes', description: 'App Router API routes', category: 'backend', required: false },
        { key: 'ssr', name: 'Server-Side Rendering', description: 'SSR and SSG pages', category: 'rendering', required: true },
        { key: 'seo', name: 'SEO Optimization', description: 'Metadata and sitemap', category: 'seo', required: false },
        { key: 'analytics', name: 'Analytics', description: 'Vercel Analytics', category: 'tracking', required: false },
      ],
      integrations: ['shadcn', 'semrush-mcp', 'supabase', 'github', 'vercel', 'stripe', 'openai', 'firecrawl'],
    },
    {
      id: 'fastapi-python',
      name: 'fastapi-python-api',
      displayName: 'FastAPI + Python',
      description: 'High-performance Python API with FastAPI',
      category: 'api',
      icon: '🐍',
      color: '#009688',
      techStack: ['Python 3.11', 'FastAPI', 'SQLAlchemy', 'Pydantic'],
      features: [
        { key: 'auth', name: 'JWT Authentication', description: 'Token-based auth', category: 'auth', required: false },
        { key: 'database', name: 'Database Models', description: 'SQLAlchemy ORM', category: 'data', required: false },
        { key: 'api', name: 'REST API', description: 'CRUD endpoints', category: 'backend', required: true },
        { key: 'docs', name: 'Auto Documentation', description: 'Swagger/OpenAPI', category: 'docs', required: true },
        { key: 'websockets', name: 'WebSocket Support', description: 'Real-time connections', category: 'realtime', required: false },
        { key: 'celery', name: 'Background Tasks', description: 'Celery task queue', category: 'async', required: false },
      ],
      integrations: ['supabase', 'github', 'openai', 'anthropic'],
    },
  ]

  const availableIntegrations = [
    { id: 'shadcn', name: 'shadcn/ui', icon: '✨', description: 'Beautiful UI components' },
    { id: 'semrush-mcp', name: 'Semrush MCP', icon: '📊', description: 'SEO data via AI agents' },
    { id: 'supabase', name: 'Supabase', icon: '⚡', description: 'Database, Auth & Storage' },
    { id: 'github', name: 'GitHub', icon: '🐙', description: 'Version control & CI/CD' },
    { id: 'vercel', name: 'Vercel', icon: '▲', description: 'Deployment platform' },
    { id: 'openai', name: 'OpenAI', icon: '🧠', description: 'GPT models' },
    { id: 'anthropic', name: 'Anthropic', icon: '🤖', description: 'Claude AI' },
    { id: 'stripe', name: 'Stripe', icon: '💳', description: 'Payment processing' },
    { id: 'firecrawl', name: 'Firecrawl', icon: '🕷️', description: 'Web scraping API' },
  ]

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    // Auto-select required features
    const requiredFeatures = template.features.filter(f => f.required).map(f => f.key)
    setSelectedFeatures(requiredFeatures)
    setSelectedIntegrations([])
  }

  const toggleFeature = (featureKey: string) => {
    const feature = selectedTemplate?.features.find(f => f.key === featureKey)
    if (feature?.required) return // Can't toggle required features

    setSelectedFeatures(prev =>
      prev.includes(featureKey)
        ? prev.filter(k => k !== featureKey)
        : [...prev, featureKey]
    )
  }

  const toggleIntegration = (integrationId: string) => {
    setSelectedIntegrations(prev =>
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    )
  }

  const handleGenerate = async () => {
    if (!selectedTemplate || !projectName || !outputPath) return

    setIsGenerating(true)
    setGenerationComplete(false)

    const steps: GenerationStep[] = [
      { name: 'create_folder', displayName: 'Creating project folder', status: 'pending', progress: 0 },
      { name: 'generate_files', displayName: 'Generating files from template', status: 'pending', progress: 0 },
      { name: 'generate_env', displayName: 'Creating environment files', status: 'pending', progress: 0 },
      { name: 'install_dependencies', displayName: 'Installing dependencies', status: 'pending', progress: 0 },
      { name: 'configure_integrations', displayName: 'Configuring integrations', status: 'pending', progress: 0 },
      { name: 'initialize_git', displayName: 'Initializing Git repository', status: 'pending', progress: 0 },
      { name: 'open_ide', displayName: `Opening in ${idePreference.toUpperCase()}`, status: 'pending', progress: 0 },
    ]

    setGenerationSteps(steps)

    // Simulate generation process
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].displayName)
      steps[i].status = 'running'
      setGenerationSteps([...steps])

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

      steps[i].status = 'completed'
      steps[i].progress = 100
      setOverallProgress(Math.floor(((i + 1) / steps.length) * 100))
      setGenerationSteps([...steps])
    }

    setGeneratedPath(`${outputPath}/${projectName}`)
    setGenerationComplete(true)
    setIsGenerating(false)
  }

  const featuresByCategory = selectedTemplate?.features.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = []
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, Feature[]>)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Project Generator</h1>
        <p className="text-muted-foreground">
          Create fully configured projects with auto-setup integrations
        </p>
      </div>

      {!selectedTemplate ? (
        /* Template Selection */
        <div>
          <h2 className="text-xl font-semibold mb-4">Choose a Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div
                  className="text-5xl mb-4 w-16 h-16 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  {template.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{template.displayName}</h3>
                <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  {template.techStack.map((tech) => (
                    <span key={tech} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : isGenerating || generationComplete ? (
        /* Generation Progress */
        <div className="bg-card rounded-lg border border-border p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">
              {generationComplete ? '✅ Project Generated Successfully!' : `Generating ${projectName}...`}
            </h2>
            {!generationComplete && (
              <p className="text-muted-foreground">
                {currentStep} ({overallProgress}%)
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className="h-4 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {generationSteps.map((step) => (
              <div
                key={step.name}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-2xl">
                  {step.status === 'completed' ? '✅' :
                   step.status === 'running' ? '⏳' :
                   step.status === 'failed' ? '❌' :
                   step.status === 'skipped' ? '⊘' : '⚪'}
                </span>
                <span className="flex-1">{step.displayName}</span>
                <span className="text-sm text-muted-foreground capitalize">{step.status}</span>
              </div>
            ))}
          </div>

          {generationComplete && (
            <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h3 className="font-semibold text-green-500 mb-2">🎉 All Set!</h3>
              <p className="text-sm mb-4">Your project has been generated at:</p>
              <code className="block p-3 bg-background rounded text-sm font-mono mb-4">
                {generatedPath}
              </code>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedTemplate(null)
                    setProjectName('')
                    setGenerationComplete(false)
                    setGenerationSteps([])
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  Create Another Project
                </button>
                <button
                  onClick={() => window.location.href = '/project-hub'}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
                >
                  View in Project Hub
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Configuration */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Project Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Output Path</label>
                  <input
                    type="text"
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    placeholder="C:/Projects or /Users/name/Projects"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Open in IDE</label>
                  <select
                    value={idePreference}
                    onChange={(e) => setIdePreference(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  >
                    <option value="vscode">VS Code</option>
                    <option value="cursor">Cursor</option>
                    <option value="webstorm">WebStorm</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Select Features</h2>

              {featuresByCategory && Object.entries(featuresByCategory).map(([category, features]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">{category}</h3>
                  <div className="space-y-2">
                    {features.map((feature) => (
                      <label
                        key={feature.key}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedFeatures.includes(feature.key)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        } ${feature.required ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature.key)}
                          onChange={() => toggleFeature(feature.key)}
                          disabled={feature.required}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium mb-1">
                            {feature.name}
                            {feature.required && <span className="ml-2 text-xs text-primary">(Required)</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                          {feature.requiresIntegration && (
                            <p className="text-xs text-yellow-500 mt-1">
                              Requires: {feature.requiresIntegration}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Integrations */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Connect Integrations</h2>
              <div className="grid grid-cols-2 gap-3">
                {availableIntegrations
                  .filter(int => selectedTemplate.integrations.includes(int.id))
                  .map((integration) => (
                    <label
                      key={integration.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedIntegrations.includes(integration.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIntegrations.includes(integration.id)}
                        onChange={() => toggleIntegration(integration.id)}
                        className="rounded"
                      />
                      <span className="text-2xl">{integration.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{integration.name}</div>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          </div>

          {/* Right: Summary & Actions */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Template</p>
                  <p className="font-medium">{selectedTemplate.displayName}</p>
                </div>

                {projectName && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Project Name</p>
                    <p className="font-medium">{projectName}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Features Selected</p>
                  <p className="font-medium">{selectedFeatures.length} features</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Integrations</p>
                  <p className="font-medium">{selectedIntegrations.length} connected</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGenerate}
                  disabled={!projectName || !outputPath}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  🚀 Generate Project
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
                >
                  ← Change Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
