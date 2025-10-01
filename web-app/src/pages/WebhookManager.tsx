import { useState } from 'react'

interface Webhook {
  id: string
  integrationName: string
  integrationIcon: string
  url: string
  events: string[]
  status: 'active' | 'paused' | 'error'
  lastTriggered?: Date
  totalTriggers: number
  secretKey: string
}

interface WebhookEvent {
  id: string
  webhookId: string
  eventType: string
  status: 'received' | 'processing' | 'completed' | 'failed'
  timestamp: Date
  payload?: any
}

export default function WebhookManager() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [activeTab, setActiveTab] = useState<'webhooks' | 'events' | 'logs'>('webhooks')

  const webhooks: Webhook[] = [
    {
      id: '1',
      integrationName: 'GitHub',
      integrationIcon: '🐙',
      url: 'https://api.yourapp.com/webhooks/github',
      events: ['push', 'pull_request', 'issues', 'release'],
      status: 'active',
      lastTriggered: new Date(Date.now() - 1000 * 60 * 15),
      totalTriggers: 247,
      secretKey: 'whsec_••••••••••••••••',
    },
    {
      id: '2',
      integrationName: 'Supabase',
      integrationIcon: '⚡',
      url: 'https://api.yourapp.com/webhooks/supabase',
      events: ['database.insert', 'database.update', 'auth.user.created'],
      status: 'active',
      lastTriggered: new Date(Date.now() - 1000 * 60 * 5),
      totalTriggers: 1523,
      secretKey: 'whsec_••••••••••••••••',
    },
    {
      id: '3',
      integrationName: 'Vercel',
      integrationIcon: '▲',
      url: 'https://api.yourapp.com/webhooks/vercel',
      events: ['deployment.created', 'deployment.succeeded', 'deployment.failed'],
      status: 'paused',
      lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2),
      totalTriggers: 89,
      secretKey: 'whsec_••••••••••••••••',
    },
  ]

  const recentEvents: WebhookEvent[] = [
    {
      id: '1',
      webhookId: '2',
      eventType: 'database.insert',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: '2',
      webhookId: '1',
      eventType: 'push',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: '3',
      webhookId: '2',
      eventType: 'auth.user.created',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 22),
    },
    {
      id: '4',
      webhookId: '1',
      eventType: 'pull_request',
      status: 'failed',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
    },
  ]

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Webhook Manager</h1>
          <p className="text-muted-foreground">
            Manage webhook subscriptions and monitor incoming events
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          + Create Webhook
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Active Webhooks</p>
          <p className="text-2xl font-bold text-green-500">
            {webhooks.filter(w => w.status === 'active').length}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Events (24h)</p>
          <p className="text-2xl font-bold">1,247</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-green-500">99.2%</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Failed Events</p>
          <p className="text-2xl font-bold text-red-500">10</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-6">
          {(['webhooks', 'events', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => setSelectedWebhook(webhook)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{webhook.integrationIcon}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{webhook.integrationName}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{webhook.url}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded ${
                    webhook.status === 'active'
                      ? 'bg-green-500/10 text-green-500'
                      : webhook.status === 'error'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}
                >
                  {webhook.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-1 text-xs bg-blue-500/10 text-blue-500 rounded"
                  >
                    {event}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    🔑 Secret: <span className="font-mono">{webhook.secretKey}</span>
                  </span>
                  <span className="text-muted-foreground">
                    📊 {webhook.totalTriggers.toLocaleString()} triggers
                  </span>
                </div>
                {webhook.lastTriggered && (
                  <span className="text-muted-foreground">
                    Last: {formatTimeAgo(webhook.lastTriggered)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium">Event Type</th>
                <th className="text-left p-4 font-medium">Webhook</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Timestamp</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((event) => {
                const webhook = webhooks.find(w => w.id === event.webhookId)
                return (
                  <tr key={event.id} className="border-t border-border hover:bg-muted/50">
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{event.eventType}</code>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span>{webhook?.integrationIcon}</span>
                        <span>{webhook?.integrationName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          event.status === 'completed'
                            ? 'bg-green-500/10 text-green-500'
                            : event.status === 'failed'
                            ? 'bg-red-500/10 text-red-500'
                            : event.status === 'processing'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatTimeAgo(event.timestamp)}
                    </td>
                    <td className="p-4">
                      <button className="text-sm text-primary hover:underline">
                        View Payload
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="space-y-2 font-mono text-sm">
            {[
              { level: 'INFO', message: 'Webhook received from GitHub - push event', time: '10:45:23' },
              { level: 'SUCCESS', message: 'Event processed successfully - 247ms', time: '10:45:23' },
              { level: 'INFO', message: 'Webhook received from Supabase - database.insert', time: '10:43:15' },
              { level: 'SUCCESS', message: 'Event processed successfully - 189ms', time: '10:43:15' },
              { level: 'ERROR', message: 'Webhook validation failed - invalid signature', time: '10:30:42' },
              { level: 'WARN', message: 'Rate limit approaching for GitHub webhooks (85%)', time: '10:25:11' },
            ].map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
                <span className="text-muted-foreground">{log.time}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    log.level === 'INFO'
                      ? 'bg-blue-500/10 text-blue-500'
                      : log.level === 'SUCCESS'
                      ? 'bg-green-500/10 text-green-500'
                      : log.level === 'ERROR'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}
                >
                  {log.level}
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">Create New Webhook</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Integration</label>
                <select className="w-full px-3 py-2 bg-background border border-input rounded-md">
                  <option>Select integration...</option>
                  <option>GitHub</option>
                  <option>Supabase</option>
                  <option>Vercel</option>
                  <option>Stripe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://api.yourapp.com/webhooks/..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subscribed Events</label>
                <div className="space-y-2">
                  {['push', 'pull_request', 'issues', 'release'].map((event) => (
                    <label key={event} className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Secret Key (optional)</label>
                <input
                  type="password"
                  placeholder="For signature verification"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
