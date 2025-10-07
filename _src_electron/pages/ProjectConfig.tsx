import { useState } from 'react'

interface ConfigItem {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'secret'
  description: string
  required: boolean
}

export default function ProjectConfig() {
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'integrations' | 'advanced'>('general')

  const projectInfo = {
    name: 'GEO-SEO Domination Tool',
    slug: 'geo-seo-domination',
    description: 'Advanced local SEO and AI-powered ranking analysis',
    version: '1.0.0',
    status: 'active',
  }

  const configurations: ConfigItem[] = [
    {
      key: 'DATABASE_PATH',
      value: './database/geo-seo.db',
      type: 'string',
      description: 'Path to SQLite database file',
      required: true,
    },
    {
      key: 'PORT',
      value: '3000',
      type: 'number',
      description: 'Server port number',
      required: true,
    },
    {
      key: 'NODE_ENV',
      value: 'development',
      type: 'string',
      description: 'Environment mode',
      required: true,
    },
  ]

  const features = [
    { name: 'Lighthouse Audits', enabled: true, icon: '🔍' },
    { name: 'E-E-A-T Scoring', enabled: true, icon: '⭐' },
    { name: 'Local Pack Tracking', enabled: true, icon: '📍' },
    { name: 'Competitor Analysis', enabled: true, icon: '⚔️' },
    { name: 'Citation Management', enabled: true, icon: '📝' },
    { name: 'AI Search Optimization', enabled: true, icon: '🤖' },
    { name: 'Campaign Management', enabled: true, icon: '🎯' },
    { name: 'PDF Reports', enabled: false, icon: '📄' },
  ]

  const integrations = [
    { name: 'SEMrush', status: 'connected', icon: '📊', lastSync: '2 hours ago' },
    { name: 'Anthropic Claude', status: 'connected', icon: '🤖', lastSync: '1 day ago' },
    { name: 'Google PageSpeed', status: 'connected', icon: '🚀', lastSync: '3 hours ago' },
    { name: 'Vercel', status: 'not configured', icon: '▲', lastSync: null },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Project Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Manage settings and features for {projectInfo.name}
        </p>
      </div>

      {/* Project Info Card */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">{projectInfo.name}</h2>
            <p className="text-sm text-muted-foreground mb-3">{projectInfo.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Version: {projectInfo.version}</span>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-xs">
                {projectInfo.status}
              </span>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'general' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'features' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
          }`}
        >
          Features
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'integrations' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
          }`}
        >
          Integrations
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'advanced' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
          }`}
        >
          Advanced
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-lg border border-border">
        {activeTab === 'general' && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">Environment Variables</h3>
            <div className="space-y-4">
              {configurations.map((config) => (
                <div key={config.key} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium font-mono text-sm">{config.key}</span>
                      {config.required && (
                        <span className="text-xs text-red-500">*required</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                    <input
                      type={config.type === 'secret' ? 'password' : 'text'}
                      value={config.value}
                      className="w-full max-w-md px-3 py-2 bg-background border border-input rounded-md text-sm"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-2">{config.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">Feature Toggles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="font-medium">{feature.name}</span>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feature.enabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feature.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">API Integrations</h3>
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {integration.lastSync ? `Last sync: ${integration.lastSync}` : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded text-xs ${
                        integration.status === 'connected'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-orange-500/10 text-orange-500'
                      }`}
                    >
                      {integration.status}
                    </span>
                    <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 text-sm">
                      Configure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">Advanced Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-2">Build Configuration</label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md font-mono text-sm"
                  defaultValue={JSON.stringify({ target: 'nsis', output: 'release' }, null, 2)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Debug Mode</p>
                  <p className="text-sm text-muted-foreground">Enable verbose logging</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-500/50 rounded-lg bg-red-500/5">
                <div>
                  <p className="font-medium text-red-500">Danger Zone</p>
                  <p className="text-sm text-muted-foreground">Irreversible actions</p>
                </div>
                <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                  Reset Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
