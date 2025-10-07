import { useState } from 'react'

export default function AIStrategy() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)

  const strategies = [
    {
      id: 'ai-revolution',
      name: 'AI Search Revolution',
      category: 'AI Optimization',
      description: 'Adapt SEO for AI-driven tools like Perplexity, ChatGPT, and Google AI Overviews',
      priority: 'critical',
      impact: '120% traffic growth',
    },
    {
      id: 'topic-clusters',
      name: 'Topic Cluster Content',
      category: 'Content Strategy',
      description: 'Strategic topic clusters and pillar content with subtopic support',
      priority: 'high',
      impact: '451% organic traffic growth',
    },
    {
      id: 'buyer-journey',
      name: 'Buyer Journey & Psychographics',
      category: 'Content Strategy',
      description: 'Focus on psychographic profiles and complex buyer journey mapping',
      priority: 'high',
      impact: '20,000% YoY session growth',
    },
    {
      id: 'content-commerce',
      name: 'Content-Driven Commerce',
      category: 'Conversion',
      description: 'Embed commercial actions directly into content to capture AI traffic',
      priority: 'high',
      impact: '8.5% revenue uplift',
    },
    {
      id: 'seasonality',
      name: 'Seasonality Exploitation',
      category: 'Content Strategy',
      description: 'Leverage seasonal search behavior for strategic content planning',
      priority: 'medium',
      impact: 'Top 3 for 4,874 keywords',
    },
    {
      id: 'authority',
      name: 'Trust & Authority Boosting',
      category: 'E-E-A-T',
      description: 'Build first-party experience and proprietary data for AI citations',
      priority: 'critical',
      impact: '69,000+ keywords ranked',
    },
    {
      id: 'integration',
      name: 'Integration Effect',
      category: 'Strategy',
      description: 'Combine all strategies with CRO and multi-channel campaigns',
      priority: 'high',
      impact: '50% lead volume increase',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Search Strategy Hub</h1>
        <p className="text-muted-foreground">
          AI-first SEO strategies optimized for Perplexity, ChatGPT, and Google AI Overviews
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">AI Visibility Score</p>
          <p className="text-4xl font-bold text-primary">0%</p>
          <p className="text-xs text-muted-foreground mt-1">Not analyzed</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Active Campaigns</p>
          <p className="text-4xl font-bold">0</p>
          <p className="text-xs text-muted-foreground mt-1">No campaigns running</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">AI Citations</p>
          <p className="text-4xl font-bold">0</p>
          <p className="text-xs text-muted-foreground mt-1">Not tracked</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">AI Search SEO Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`bg-card p-6 rounded-lg border cursor-pointer transition-all ${
                selectedStrategy === strategy.id
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{strategy.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    strategy.priority === 'critical'
                      ? 'bg-red-500/10 text-red-500'
                      : strategy.priority === 'high'
                      ? 'bg-orange-500/10 text-orange-500'
                      : 'bg-blue-500/10 text-blue-500'
                  }`}
                >
                  {strategy.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{strategy.category}</span>
                <span className="text-green-500 font-medium">{strategy.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">AI Visibility Checker</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your brand name"
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
            />
            <textarea
              placeholder="Enter test queries (one per line)"
              rows={4}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
            />
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Check AI Visibility
            </button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Content AI Optimizer</h2>
          <div className="space-y-4">
            <input
              type="url"
              placeholder="Content URL to analyze"
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
            />
            <select className="w-full px-3 py-2 bg-background border border-input rounded-md">
              <option>Select AI Platform</option>
              <option>Perplexity</option>
              <option>ChatGPT</option>
              <option>Google AI Overview</option>
              <option>All Platforms</option>
            </select>
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Analyze for AI Citations
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
