'use client';

/**
 * Influence Dashboard
 *
 * Monitor trends, create influence campaigns, and track market dominance.
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Target, BarChart3, Rocket, Eye, Award, Plus, Play } from 'lucide-react';

interface Trend {
  id: string;
  trendName: string;
  category: string;
  description: string;
  momentum: number;
  relevance: number;
  competition: number;
  opportunity: number;
  trendVelocity: string;
  contentIdeas: string[];
  status: string;
}

interface Campaign {
  id: string;
  campaignName: string;
  goal: string;
  status: string;
  startDate: string;
  endDate: string;
  targetMetrics: any;
  actualMetrics?: any;
}

interface Portfolio {
  id: string;
  company_name: string;
  industry: string;
}

export default function InfluenceDashboard() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [trends, setTrends] = useState<Trend[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'trends' | 'campaigns'>('trends');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);

  // Campaign form state
  const [campaignGoal, setCampaignGoal] = useState('thought_leadership');
  const [duration, setDuration] = useState(90);
  const [platforms, setPlatforms] = useState<string[]>(['wordpress', 'linkedin']);

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      loadTrends();
      loadCampaigns();
    }
  }, [selectedPortfolio]);

  const loadPortfolios = async () => {
    try {
      const response = await fetch('/api/crm/portfolio');
      const data = await response.json();
      if (data.success) {
        setPortfolios(data.portfolios);
        if (data.portfolios.length > 0) {
          setSelectedPortfolio(data.portfolios[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
    }
  };

  const loadTrends = async () => {
    if (!selectedPortfolio) return;

    try {
      const response = await fetch(`/api/crm/trends?portfolioId=${selectedPortfolio}`);
      const data = await response.json();
      if (data.success) {
        setTrends(data.trends);
      }
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };

  const loadCampaigns = async () => {
    if (!selectedPortfolio) return;

    try {
      const response = await fetch(`/api/crm/influence?portfolioId=${selectedPortfolio}`);
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const discoverTrends = async () => {
    if (!selectedPortfolio) return;

    const portfolio = portfolios.find(p => p.id === selectedPortfolio);
    if (!portfolio) return;

    setLoading(true);
    try {
      const response = await fetch('/api/crm/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: selectedPortfolio,
          industry: portfolio.industry,
          minMomentum: 50,
          maxCompetition: 70
        })
      });

      const data = await response.json();
      if (data.success) {
        setTrends(data.trends);
        alert(`Discovered ${data.trends.length} trends with ${data.topOpportunities.length} high-opportunity topics!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error discovering trends:', error);
      alert('Failed to discover trends');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!selectedTrend) return;

    setLoading(true);
    try {
      const response = await fetch('/api/crm/influence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: selectedPortfolio,
          trendId: selectedTrend.id,
          campaignGoal,
          targetAudience: 'Business decision makers',
          duration,
          platforms,
          ctaType: 'consultation'
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateCampaign(false);
        setSelectedTrend(null);
        loadCampaigns();
        alert(`Campaign "${data.campaign.campaignName}" created with ${data.campaign.contentPieces.length} content pieces!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const executeCampaign = async (campaignId: string) => {
    if (!confirm('Execute this campaign? This will generate all content and schedule posts.')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/crm/influence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          campaignId
        })
      });

      const data = await response.json();
      if (data.success) {
        loadCampaigns();
        alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error executing campaign:', error);
      alert('Failed to execute campaign');
    } finally {
      setLoading(false);
    }
  };

  const getVelocityIcon = (velocity: string) => {
    if (velocity === 'rising') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (velocity === 'peaking') return <Zap className="w-4 h-4 text-yellow-500" />;
    return <BarChart3 className="w-4 h-4 text-gray-500" />;
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Influence Engine</h1>
          <p className="text-gray-600 mt-2">Discover trends, create campaigns, dominate your market</p>
        </div>
        <button
          onClick={discoverTrends}
          disabled={loading || !selectedPortfolio}
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Eye className="w-5 h-5" />
          {loading ? 'Discovering...' : 'Discover Trends'}
        </button>
      </div>

      {/* Portfolio Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Portfolio</label>
        <select
          value={selectedPortfolio}
          onChange={(e) => setSelectedPortfolio(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md"
        >
          <option value="">Select a portfolio...</option>
          {portfolios.map(portfolio => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.company_name} - {portfolio.industry}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('trends')}
            className={`pb-3 border-b-2 font-medium ${
              activeTab === 'trends'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Trends ({trends.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 border-b-2 font-medium ${
              activeTab === 'campaigns'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
        </div>
      </div>

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 gap-6">
          {trends.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No trends discovered yet. Click "Discover Trends" to find opportunities.</p>
            </div>
          ) : (
            trends.map(trend => (
              <div key={trend.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getVelocityIcon(trend.trendVelocity)}
                      <h3 className="text-xl font-bold text-gray-900">{trend.trendName}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded ${getOpportunityColor(trend.opportunity)}`}>
                        Opportunity: {trend.opportunity}/100
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{trend.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-1 rounded">{trend.category}</span>
                      <span>•</span>
                      <span>{trend.trendVelocity}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTrend(trend);
                      setShowCreateCampaign(true);
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <Rocket className="w-4 h-4" />
                    Create Campaign
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Momentum</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${trend.momentum}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{trend.momentum}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Relevance</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${trend.relevance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{trend.relevance}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Competition</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${trend.competition}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{trend.competition}%</span>
                    </div>
                  </div>
                </div>

                {/* Content Ideas */}
                {trend.contentIdeas && trend.contentIdeas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Content Ideas:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {trend.contentIdeas.slice(0, 3).map((idea, i) => (
                        <li key={i} className="text-sm text-gray-600">{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No campaigns yet. Create your first influence campaign from a trend.</p>
            </div>
          ) : (
            campaigns.map(campaign => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{campaign.campaignName}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{campaign.goal.replace(/_/g, ' ')}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{campaign.status}</span>
                    </div>
                  </div>
                  {campaign.status === 'planning' && (
                    <button
                      onClick={() => executeCampaign(campaign.id)}
                      disabled={loading}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Execute Campaign
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium">{new Date(campaign.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-sm font-medium">{new Date(campaign.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Target Reach</p>
                    <p className="text-sm font-medium">{campaign.targetMetrics?.estimatedReach?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Target Conversions</p>
                    <p className="text-sm font-medium">{campaign.targetMetrics?.ctaConversions || 0}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateCampaign && selectedTrend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create Influence Campaign</h2>
              <p className="text-gray-600 mt-1">Trend: {selectedTrend.trendName}</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Goal</label>
                <select
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                >
                  <option value="thought_leadership">Thought Leadership</option>
                  <option value="lead_generation">Lead Generation</option>
                  <option value="brand_awareness">Brand Awareness</option>
                  <option value="market_dominance">Market Dominance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                <input
                  type="number"
                  min="30"
                  max="365"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Platforms</label>
                <div className="grid grid-cols-2 gap-3">
                  {['wordpress', 'linkedin', 'facebook', 'twitter', 'gmb'].map(platform => (
                    <label key={platform} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPlatforms([...platforms, platform]);
                          } else {
                            setPlatforms(platforms.filter(p => p !== platform));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateCampaign(false);
                  setSelectedTrend(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createCampaign}
                disabled={loading || platforms.length === 0}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
