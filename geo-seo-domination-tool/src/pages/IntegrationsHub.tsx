import { useState } from 'react'

interface Integration {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  icon: string
  color: string
  status: 'connected' | 'available' | 'error'
  authMethod: 'oauth2' | 'api_key' | 'webhook'
  capabilities: {
    webhooks?: boolean
    realtime?: boolean
    storage?: boolean
  }
}

export default function IntegrationsHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showConnectModal, setShowConnectModal] = useState<Integration | null>(null)

  const categories = [
    { id: 'all', name: 'All Integrations', icon: '🔌' },
    { id: 'development', name: 'Development', icon: '💻' },
    { id: 'database', name: 'Database', icon: '🗄️' },
    { id: 'ai', name: 'AI & ML', icon: '🤖' },
    { id: 'deployment', name: 'Deployment', icon: '🚀' },
    { id: 'auth', name: 'Authentication', icon: '🔐' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
  ]

  const integrations: Integration[] = [
    {
      id: '1',
      name: 'github',
      displayName: 'GitHub',
      description: 'Version control, CI/CD, and repository management',
      category: 'development',
      icon: '🐙',
      color: '#24292e',
      status: 'connected',
      authMethod: 'oauth2',
      capabilities: { webhooks: true, realtime: true },
    },
    {
      id: '2',
      name: 'cursor',
      displayName: 'Cursor',
      description: 'AI-powered code editor integration',
      category: 'development',
      icon: '✨',
      color: '#000000',
      status: 'connected',
      authMethod: 'api_key',
      capabilities: { realtime: true },
    },
    {
      id: '3',
      name: 'claude',
      displayName: 'Claude Code',
      description: 'AI coding assistant and automation',
      category: 'ai',
      icon: '🤖',
      color: '#D97757',
      status: 'connected',
      authMethod: 'api_key',
      capabilities: {},
    },
    {
      id: '4',
      name: 'supabase',
      displayName: 'Supabase',
      description: 'Backend-as-a-Service: Database, Auth & Storage',
      category: 'database',
      icon: '⚡',
      color: '#3ECF8E',
      status: 'available',
      authMethod: 'api_key',
      capabilities: { webhooks: true, realtime: true, storage: true },
    },
    {
      id: '5',
      name: 'vercel',
      displayName: 'Vercel',
      description: 'Deployment platform for modern web applications',
      category: 'deployment',
      icon: '▲',
      color: '#000000',
      status: 'available',
      authMethod: 'oauth2',
      capabilities: { webhooks: true },
    },
    {
      id: '6',
      name: 'openai',
      displayName: 'OpenAI',
      description: 'GPT models and AI capabilities',
      category: 'ai',
      icon: '🧠',
      color: '#10a37f',
      status: 'available',
      authMethod: 'api_key',
      capabilities: {},
    },
    {
      id: '7',
      name: 'stripe',
      displayName: 'Stripe',
      description: 'Payment processing and billing',
      category: 'analytics',
      icon: '💳',
      color: '#635BFF',
      status: 'available',
      authMethod: 'api_key',
      capabilities: { webhooks: true },
    },
    {
      id: '8',
      name: 'auth0',
      displayName: 'Auth0',
      description: 'Authentication and authorization platform',
      category: 'auth',
      icon: '🔐',
      color: '#EB5424',
      status: 'available',
      authMethod: 'oauth2',
      capabilities: { webhooks: true },
    },
  ]

  const filteredIntegrations = selectedCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === selectedCategory)

  const connectedCount = integrations.filter(i => i.status === 'connected').length

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Integrations Hub</h1>
        <p className="text-muted-foreground">
          Connect third-party services and data connectors to your projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Available</p>
          <p className="text-2xl font-bold">{integrations.length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Connected</p>
          <p className="text-2xl font-bold text-green-500">{connectedCount}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Categories</p>
          <p className="text-2xl font-bold">{categories.length - 1}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Webhooks Active</p>
          <p className="text-2xl font-bold">2</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-all cursor-pointer group"
            onClick={() => integration.status === 'available' && setShowConnectModal(integration)}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="text-4xl w-14 h-14 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: `${integration.color}20` }}
              >
                {integration.icon}
              </div>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  integration.status === 'connected'
                    ? 'bg-green-500/10 text-green-500'
                    : integration.status === 'error'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {integration.status === 'connected' ? '✓ Connected' : 'Available'}
              </span>
            </div>

            <h3 className="font-semibold text-lg mb-2">{integration.displayName}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {integration.description}
            </p>

            {/* Capabilities */}
            <div className="flex items-center gap-2 mb-4">
              {integration.capabilities.webhooks && (
                <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded">
                  📡 Webhooks
                </span>
              )}
              {integration.capabilities.realtime && (
                <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-500 rounded">
                  ⚡ Realtime
                </span>
              )}
              {integration.capabilities.storage && (
                <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded">
                  💾 Storage
                </span>
              )}
            </div>

            <button
              className={`w-full py-2 rounded-md transition-colors ${
                integration.status === 'connected'
                  ? 'bg-secondary text-secondary-foreground hover:opacity-90'
                  : 'bg-primary text-primary-foreground hover:opacity-90 group-hover:bg-primary/90'
              }`}
            >
              {integration.status === 'connected' ? 'Configure' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-4">
              <div
                className="text-4xl w-14 h-14 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: `${showConnectModal.color}20` }}
              >
                {showConnectModal.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{showConnectModal.displayName}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {showConnectModal.description}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Authentication Method</p>
                <p className="text-sm text-muted-foreground">
                  {showConnectModal.authMethod === 'oauth2' ? '🔐 OAuth 2.0' : '🔑 API Key'}
                </p>
              </div>

              {showConnectModal.authMethod === 'oauth2' ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    You'll be redirected to {showConnectModal.displayName} to authorize access.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Secure OAuth 2.0 authentication</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Automatic token refresh</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Revocable access</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    placeholder="Paste your API key here"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Your API key is encrypted and stored securely
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConnectModal(null)}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle connection
                  setShowConnectModal(null)
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                {showConnectModal.authMethod === 'oauth2' ? 'Authorize' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
