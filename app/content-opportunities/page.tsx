'use client';

import { useState, useEffect } from 'react';
import {
  Lightbulb,
  TrendingUp,
  MessageSquare,
  Search,
  Sparkles,
  FileText,
  Share2,
  Mail,
  Filter,
  Plus
} from 'lucide-react';

interface ContentOpportunity {
  id: number;
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  opportunity_score: number;
  reddit_mentions: number;
  repeated_questions: number;
  confusion_markers: number;
  dissatisfaction_markers: number;
  top_questions: string[];
  status: string;
  company_name?: string;
  content_plans_count: number;
}

export default function ContentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [seedKeyword, setSeedKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOpportunities();
  }, [filterStatus]);

  const fetchOpportunities = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }
      params.set('limit', '50');

      const response = await fetch(`/api/content-opportunities?${params}`);
      const data = await response.json();
      setOpportunities(data.opportunities || []);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    if (!seedKeyword.trim()) return;

    setDiscovering(true);
    try {
      const response = await fetch('/api/content-opportunities/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedKeyword: seedKeyword.trim(),
          topN: 10,
          minScore: 0,
          includeAEO: true
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Discovered ${data.stats.opportunitiesFound} opportunities!`);
        setSeedKeyword('');
        fetchOpportunities();
      } else {
        alert(`Discovery failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Discovery error: ${error.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  const handleGenerateContent = async (opportunityId: number) => {
    try {
      const response = await fetch(`/api/content-opportunities/${opportunityId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTypes: ['article', 'social', 'newsletter']
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Content generated successfully!');
        fetchOpportunities();
      } else {
        alert(`Generation failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Generation error: ${error.message}`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 3) return 'text-green-600 bg-green-50';
    if (score >= 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      discovered: 'bg-blue-100 text-blue-800',
      planned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800'
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Lightbulb className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Content Opportunities</h1>
          </div>
          <p className="text-gray-600">
            Discover high-value content opportunities by mining community gaps and keyword data
          </p>
        </div>

        {/* Discovery Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Discover New Opportunities</h2>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="Enter seed keyword (e.g., 'water damage restoration')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              onKeyPress={(e) => e.key === 'Enter' && handleDiscover()}
              disabled={discovering}
            />
            <button
              onClick={handleDiscover}
              disabled={discovering || !seedKeyword.trim()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {discovering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Discover
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            This will analyze Reddit discussions and keyword data to find content gaps
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="discovered">Discovered</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities yet</h3>
            <p className="text-gray-600 mb-6">
              Start by discovering content opportunities using the form above
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div key={opp.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{opp.keyword}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(opp.status)}`}>
                        {opp.status}
                      </span>
                    </div>
                    {opp.company_name && (
                      <p className="text-sm text-gray-600 mb-2">Company: {opp.company_name}</p>
                    )}
                  </div>

                  <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(opp.opportunity_score)}`}>
                    {opp.opportunity_score.toFixed(2)}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs text-gray-600">Search Volume</p>
                      <p className="text-sm font-semibold">{opp.search_volume.toLocaleString()}/mo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="text-xs text-gray-600">Difficulty</p>
                      <p className="text-sm font-semibold">{(opp.keyword_difficulty * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Reddit Threads</p>
                      <p className="text-sm font-semibold">{opp.reddit_mentions}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Top Questions</p>
                      <p className="text-sm font-semibold">{opp.repeated_questions}</p>
                    </div>
                  </div>
                </div>

                {/* Top Questions Preview */}
                {opp.top_questions && opp.top_questions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Top Questions from Community:</p>
                    <ul className="space-y-1">
                      {opp.top_questions.slice(0, 3).map((q, idx) => (
                        <li key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {opp.content_plans_count === 0 ? (
                    <button
                      onClick={() => handleGenerateContent(opp.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Content
                    </button>
                  ) : (
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg cursor-default">
                      <FileText className="w-4 h-4" />
                      {opp.content_plans_count} Content Plan{opp.content_plans_count > 1 ? 's' : ''}
                    </button>
                  )}

                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>

                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Mail className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
