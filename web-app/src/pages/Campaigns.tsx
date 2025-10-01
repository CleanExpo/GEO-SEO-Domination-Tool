import { useState } from 'react'

export default function Campaigns() {
  const [showNewCampaign, setShowNewCampaign] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Search Campaigns</h1>
          <p className="text-muted-foreground">Manage and track AI-first SEO campaigns</p>
        </div>
        <button
          onClick={() => setShowNewCampaign(!showNewCampaign)}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          {showNewCampaign ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showNewCampaign && (
        <div className="bg-card p-6 rounded-lg border border-border mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Campaign</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Name *</label>
              <input
                type="text"
                placeholder="e.g., Q1 AI Visibility Push"
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Campaign Objective</label>
              <textarea
                placeholder="What do you want to achieve with this campaign?"
                rows={3}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target AI Platforms</label>
              <div className="grid grid-cols-2 gap-3">
                {['Perplexity', 'ChatGPT', 'Google AI Overview', 'Claude'].map((platform) => (
                  <label key={platform} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Budget (optional)</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
              />
            </div>

            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
                Create Campaign
              </button>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4">Active Campaigns</h2>
        <p className="text-muted-foreground">
          No campaigns yet. Create your first AI search campaign to start tracking progress.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-3">Strategy Templates</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Pre-built strategy templates from proven campaigns
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              <span>AI Search Revolution (7 steps)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              <span>Topic Cluster Framework</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              <span>Buyer Journey Mapping</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              <span>Authority Building Program</span>
            </li>
          </ul>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-3">Success Metrics</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Track these KPIs for AI search success
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>AI mention frequency</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Citation position in responses</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Topic cluster coverage</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Conversion from AI traffic</span>
            </li>
          </ul>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-3">Case Study Results</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Real campaign performance
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>Lawn Care Brand</span>
              <span className="text-green-500 font-medium">+120%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Skincare Global</span>
              <span className="text-green-500 font-medium">+451%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Mortgage Client</span>
              <span className="text-green-500 font-medium">+20,000%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Bathroom Brand</span>
              <span className="text-green-500 font-medium">69K keywords</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
