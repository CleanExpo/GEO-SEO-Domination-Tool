'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Plus, Target, TrendingUp, Calendar, DollarSign, Play, Pause, CheckCircle } from 'lucide-react';

interface Campaign {
  id: string;
  campaign_name: string;
  objective: string;
  target_ai_platforms: string[]; // Parsed JSON
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'paused' | 'completed';
  budget: number;
  created_at: string;
  company?: {
    id: string;
    name: string;
  };
}

export default function AIStrategyPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchCampaigns();
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data.companies || []);

      // Auto-select first company
      if (data.companies && data.companies.length > 0) {
        setSelectedCompany(data.companies[0].id);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchCampaigns = async () => {
    if (!selectedCompany) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/ai-strategy/campaigns?company_id=${selectedCompany}`);

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return colors[status];
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'planning':
        return <Target className="h-4 w-4" />;
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      'Perplexity': 'bg-purple-100 text-purple-800',
      'ChatGPT': 'bg-green-100 text-green-800',
      'Gemini': 'bg-blue-100 text-blue-800',
      'Claude': 'bg-orange-100 text-orange-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (statusFilter !== 'all' && campaign.status !== statusFilter) return false;
    return true;
  });

  const totalCampaigns = filteredCampaigns.length;
  const activeCampaigns = filteredCampaigns.filter(c => c.status === 'active').length;
  const completedCampaigns = filteredCampaigns.filter(c => c.status === 'completed').length;
  const totalBudget = filteredCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading campaigns</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchCampaigns}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              AI Search Strategy
            </h1>
            <p className="text-gray-600 mt-1">Optimize your presence in AI-powered search platforms</p>
          </div>
          <button
            onClick={() => console.log('Create campaign')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">AI Search Optimization</h3>
            <p className="text-sm text-purple-800">
              Position your brand to be cited by AI platforms like ChatGPT, Claude, Perplexity, and Gemini.
              Track visibility, optimize content for AI citations, and measure your AI search presence.
            </p>
          </div>
        </div>
      </div>

      {/* Company Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Company
        </label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Choose a company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{totalCampaigns}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeCampaigns}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedCampaigns}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Campaigns</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        ) : !selectedCompany ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Sparkles className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Company</h3>
            <p className="text-gray-600 text-center">
              Choose a company from the dropdown above to view AI strategy campaigns
            </p>
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.campaign_name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{campaign.objective}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(campaign.status)}
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>

                  {/* AI Platforms */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Target AI Platforms:</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.target_ai_platforms.map((platform) => (
                        <span
                          key={platform}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlatformBadgeColor(platform)}`}
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {new Date(campaign.start_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>End: {new Date(campaign.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {campaign.budget > 0 && (
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>Budget: ${campaign.budget.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                      View Details
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Sparkles className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6 text-center">
              Create your first AI search optimization campaign for {companies.find(c => c.id === selectedCompany)?.name || 'this company'}
            </p>
            <button
              onClick={() => console.log('Create campaign')}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create First Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
