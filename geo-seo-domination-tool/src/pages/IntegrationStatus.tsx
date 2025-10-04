import { useState } from 'react'

interface IntegrationStatus {
  id: string
  name: string
  displayName: string
  icon: string
  status: 'operational' | 'degraded' | 'down' | 'maintenance'
  uptime: number
  responseTime: number
  lastChecked: Date
  apiCalls24h: number
  errorRate: number
  rateLimit: {
    current: number
    max: number
    resetAt: Date
  }
}

interface HealthMetric {
  timestamp: Date
  responseTime: number
  status: 'success' | 'error'
}

export default function IntegrationStatus() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  const integrations: IntegrationStatus[] = [
    {
      id: '1',
      name: 'github',
      displayName: 'GitHub',
      icon: '🐙',
      status: 'operational',
      uptime: 99.98,
      responseTime: 245,
      lastChecked: new Date(Date.now() - 1000 * 30),
      apiCalls24h: 3247,
      errorRate: 0.02,
      rateLimit: {
        current: 4532,
        max: 5000,
        resetAt: new Date(Date.now() + 1000 * 60 * 45),
      },
    },
    {
      id: '2',
      name: 'claude',
      displayName: 'Claude Code',
      icon: '🤖',
      status: 'operational',
      uptime: 99.95,
      responseTime: 1234,
      lastChecked: new Date(Date.now() - 1000 * 15),
      apiCalls24h: 1523,
      errorRate: 0.05,
      rateLimit: {
        current: 245,
        max: 1000,
        resetAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
    {
      id: '3',
      name: 'supabase',
      displayName: 'Supabase',
      icon: '⚡',
      status: 'operational',
      uptime: 99.99,
      responseTime: 89,
      lastChecked: new Date(Date.now() - 1000 * 20),
      apiCalls24h: 8934,
      errorRate: 0.01,
      rateLimit: {
        current: 15234,
        max: 100000,
        resetAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    },
    {
      id: '4',
      name: 'vercel',
      displayName: 'Vercel',
      icon: '▲',
      status: 'degraded',
      uptime: 98.2,
      responseTime: 567,
      lastChecked: new Date(Date.now() - 1000 * 60),
      apiCalls24h: 423,
      errorRate: 1.8,
      rateLimit: {
        current: 89,
        max: 100,
        resetAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    },
    {
      id: '5',
      name: 'openai',
      displayName: 'OpenAI',
      icon: '🧠',
      status: 'operational',
      uptime: 99.7,
      responseTime: 2145,
      lastChecked: new Date(Date.now() - 1000 * 45),
      apiCalls24h: 567,
      errorRate: 0.3,
      rateLimit: {
        current: 45,
        max: 60,
        resetAt: new Date(Date.now() + 1000 * 60),
      },
    },
  ]

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const formatTimeUntil = (date: Date) => {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  const getStatusColor = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-500 bg-green-500/10'
      case 'degraded':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'down':
        return 'text-red-500 bg-red-500/10'
      case 'maintenance':
        return 'text-blue-500 bg-blue-500/10'
    }
  }

  const getRateLimitPercentage = (integration: IntegrationStatus) => {
    return (integration.rateLimit.current / integration.rateLimit.max) * 100
  }

  const getRateLimitColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Integration Status</h1>
        <p className="text-muted-foreground">
          Monitor health, performance, and API usage across all integrations
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Overall Status</p>
          <p className="text-2xl font-bold text-green-500">Operational</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Avg Uptime</p>
          <p className="text-2xl font-bold">99.6%</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Avg Response</p>
          <p className="text-2xl font-bold">856ms</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">API Calls (24h)</p>
          <p className="text-2xl font-bold">14,694</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Error Rate</p>
          <p className="text-2xl font-bold text-green-500">0.43%</p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2 mb-6">
        {(['1h', '24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              timeRange === range
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Integration Status Cards */}
      <div className="space-y-4">
        {integrations.map((integration) => {
          const rateLimitPercentage = getRateLimitPercentage(integration)

          return (
            <div
              key={integration.id}
              className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => setSelectedIntegration(integration.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{integration.displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last checked {formatTimeAgo(integration.lastChecked)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs rounded capitalize ${getStatusColor(integration.status)}`}>
                  {integration.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                  <p className="text-lg font-semibold">{integration.uptime}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Response Time</p>
                  <p className="text-lg font-semibold">{integration.responseTime}ms</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">API Calls (24h)</p>
                  <p className="text-lg font-semibold">{integration.apiCalls24h.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
                  <p className={`text-lg font-semibold ${integration.errorRate > 1 ? 'text-red-500' : 'text-green-500'}`}>
                    {integration.errorRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Next Reset</p>
                  <p className="text-lg font-semibold">{formatTimeUntil(integration.rateLimit.resetAt)}</p>
                </div>
              </div>

              {/* Rate Limit Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Rate Limit</p>
                  <p className="text-xs text-muted-foreground">
                    {integration.rateLimit.current.toLocaleString()} / {integration.rateLimit.max.toLocaleString()}
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getRateLimitColor(rateLimitPercentage)}`}
                    style={{ width: `${rateLimitPercentage}%` }}
                  />
                </div>
                {rateLimitPercentage > 80 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠️ Approaching rate limit ({rateLimitPercentage.toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Health History Chart Placeholder */}
      <div className="mt-6 bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold text-lg mb-4">Response Time Trends</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="mb-2">📊 Chart visualization would go here</p>
            <p className="text-sm">Showing response times over {timeRange}</p>
          </div>
        </div>
      </div>

      {/* Incidents & Alerts */}
      <div className="mt-6 bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold text-lg mb-4">Recent Incidents</h3>
        <div className="space-y-3">
          {[
            {
              service: 'Vercel',
              icon: '▲',
              message: 'Elevated response times detected',
              severity: 'warning',
              time: new Date(Date.now() - 1000 * 60 * 5),
            },
            {
              service: 'OpenAI',
              icon: '🧠',
              message: 'Rate limit threshold exceeded (90%)',
              severity: 'warning',
              time: new Date(Date.now() - 1000 * 60 * 15),
            },
            {
              service: 'GitHub',
              icon: '🐙',
              message: 'All systems operational',
              severity: 'info',
              time: new Date(Date.now() - 1000 * 60 * 60),
            },
          ].map((incident, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-2xl">{incident.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{incident.service}</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      incident.severity === 'warning'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : incident.severity === 'error'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-blue-500/10 text-blue-500'
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{incident.message}</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatTimeAgo(incident.time)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
