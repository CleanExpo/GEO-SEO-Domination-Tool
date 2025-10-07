import { useState } from 'react'

interface ApiKey {
  id: string
  keyName: string
  serviceName: string
  keyPrefix: string
  environment: 'development' | 'staging' | 'production'
  isActive: boolean
  lastUsed?: string
  expiresAt?: string
}

export default function ApiKeyManager() {
  const [showAddKey, setShowAddKey] = useState(false)
  const [showKey, setShowKey] = useState<string | null>(null)

  const apiKeys: ApiKey[] = [
    {
      id: '1',
      keyName: 'SEMRUSH_API_KEY',
      serviceName: 'SEMrush',
      keyPrefix: 'sk_live_...',
      environment: 'production',
      isActive: true,
      lastUsed: '2 hours ago',
    },
    {
      id: '2',
      keyName: 'ANTHROPIC_API_KEY',
      serviceName: 'Anthropic Claude',
      keyPrefix: 'sk-ant-...',
      environment: 'production',
      isActive: true,
      lastUsed: '1 day ago',
    },
    {
      id: '3',
      keyName: 'GOOGLE_API_KEY',
      serviceName: 'Google PageSpeed Insights',
      keyPrefix: 'AIza...',
      environment: 'production',
      isActive: true,
      lastUsed: '3 hours ago',
    },
  ]

  const services = [
    { name: 'SEMrush', icon: '📊', category: 'SEO' },
    { name: 'Anthropic Claude', icon: '🤖', category: 'AI' },
    { name: 'Google PageSpeed', icon: '🚀', category: 'Performance' },
    { name: 'OpenAI', icon: '🧠', category: 'AI' },
    { name: 'Vercel', icon: '▲', category: 'Deployment' },
    { name: 'Stripe', icon: '💳', category: 'Payment' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">API Key Manager</h1>
          <p className="text-muted-foreground mt-1">
            Securely manage API keys for all your projects
          </p>
        </div>
        <button
          onClick={() => setShowAddKey(true)}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          + Add API Key
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Keys</p>
          <p className="text-2xl font-bold">{apiKeys.length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <p className="text-2xl font-bold text-green-500">
            {apiKeys.filter(k => k.isActive).length}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Services</p>
          <p className="text-2xl font-bold">{new Set(apiKeys.map(k => k.serviceName)).size}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Expiring Soon</p>
          <p className="text-2xl font-bold text-orange-500">0</p>
        </div>
      </div>

      {/* API Keys List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Your API Keys</h2>
        </div>

        <div className="divide-y divide-border">
          {apiKeys.map((key) => (
            <div key={key.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{key.keyName}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        key.environment === 'production'
                          ? 'bg-green-500/10 text-green-500'
                          : key.environment === 'staging'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {key.environment}
                    </span>
                    {key.isActive && (
                      <span className="px-2 py-0.5 text-xs rounded bg-green-500/10 text-green-500">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {key.serviceName}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {showKey === key.id ? 'sk_live_1234567890abcdef...' : key.keyPrefix}
                    </span>
                    <button
                      onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                      className="text-primary hover:underline text-xs"
                    >
                      {showKey === key.id ? 'Hide' : 'Show'}
                    </button>
                    <span className="text-muted-foreground text-xs">
                      Last used: {key.lastUsed || 'Never'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-muted rounded" title="Edit">
                    ✏️
                  </button>
                  <button className="p-2 hover:bg-muted rounded" title="Copy">
                    📋
                  </button>
                  <button className="p-2 hover:bg-muted rounded text-red-500" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Services */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Available Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {services.map((service) => (
            <button
              key={service.name}
              onClick={() => setShowAddKey(true)}
              className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-center"
            >
              <div className="text-3xl mb-2">{service.icon}</div>
              <p className="font-medium text-sm">{service.name}</p>
              <p className="text-xs text-muted-foreground">{service.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Add Key Modal */}
      {showAddKey && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add New API Key</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service</label>
                <select className="w-full px-3 py-2 bg-background border border-input rounded-md">
                  <option>Select a service</option>
                  {services.map((s) => (
                    <option key={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Name</label>
                <input
                  type="text"
                  placeholder="e.g., SEMRUSH_API_KEY"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  placeholder="Paste your API key here"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Environment</label>
                <select className="w-full px-3 py-2 bg-background border border-input rounded-md">
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddKey(false)}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
                Add Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
