'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  MousePointerClick,
  Target,
  Smartphone,
  Monitor,
  Tablet,
  Sparkles,
} from 'lucide-react';

interface GSCRanking {
  id: string;
  keyword: string;
  page_url: string;
  position: number;
  position_change: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  device: string;
  check_date: string;
}

interface RankingStats {
  total_keywords: number;
  avg_position: number;
  total_clicks: number;
  total_impressions: number;
  top_10_keywords: number;
  top_3_keywords: number;
}

export default function RealRankingsPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [rankings, setRankings] = useState<GSCRanking[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, [companyId, deviceFilter]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        company_id: companyId,
        limit: '100',
      });

      if (deviceFilter !== 'all') {
        params.set('device', deviceFilter);
      }

      const response = await fetch(`/api/gsc/rankings?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRankings(data.rankings || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncRankings = async () => {
    try {
      setSyncing(true);

      // Get connection ID (you'd get this from company data)
      const response = await fetch('/api/gsc');
      const { connections } = await response.json();

      if (!connections || connections.length === 0) {
        alert('Please connect Google Search Console first');
        return;
      }

      // Sync rankings
      const syncResponse = await fetch('/api/gsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          connection_id: connections[0].id,
        }),
      });

      if (syncResponse.ok) {
        await fetchRankings();
        alert('Rankings synced successfully!');
      }
    } catch (error) {
      console.error('Failed to sync rankings:', error);
      alert('Failed to sync rankings');
    } finally {
      setSyncing(false);
    }
  };

  const generateAIInsights = async () => {
    try {
      setShowInsights(true);
      setAiInsights('Analyzing rankings with DeepSeek V3...');

      // Call DeepSeek to analyze ranking data
      const response = await fetch('/api/ai/analyze-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankings: rankings.slice(0, 20), // Top 20 keywords
          stats,
        }),
      });

      const data = await response.json();
      setAiInsights(data.insights || 'No insights available');
    } catch (error) {
      setAiInsights('Failed to generate insights');
    }
  };

  const filteredRankings = rankings.filter(rank =>
    rank.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPositionBadge = (position: number) => {
    if (position <= 3) return 'bg-green-100 text-green-800';
    if (position <= 10) return 'bg-blue-100 text-blue-800';
    if (position <= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getChangeIcon = (change: number | null) => {
    if (!change) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-8 w-8 text-emerald-600" />
              Real Google Rankings
            </h1>
            <p className="text-gray-600 mt-1">
              100% accurate data from Google Search Console
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateAIInsights}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Insights
            </button>
            <button
              onClick={syncRankings}
              disabled={syncing}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Search className="h-4 w-4" />
              Total Keywords
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_keywords}</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Target className="h-4 w-4" />
              Avg Position
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.avg_position.toFixed(1)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <MousePointerClick className="h-4 w-4" />
              Total Clicks
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total_clicks.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Eye className="h-4 w-4" />
              Impressions
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total_impressions.toLocaleString()}
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 text-sm mb-1">
              <CheckCircle className="h-4 w-4" />
              Top 10
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.top_10_keywords}</div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700 text-sm mb-1">
              <CheckCircle className="h-4 w-4" />
              Top 3
            </div>
            <div className="text-2xl font-bold text-emerald-900">{stats.top_3_keywords}</div>
          </div>
        </div>
      )}

      {/* AI Insights Panel */}
      {showInsights && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-purple-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-2">DeepSeek V3 AI Insights</h3>
              <div className="text-gray-700 whitespace-pre-wrap">{aiInsights}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Devices</option>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
          </select>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keyword
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impressions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CTR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRankings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="h-12 w-12 text-gray-400" />
                    <p className="text-gray-600">
                      {searchQuery
                        ? 'No keywords match your search'
                        : 'No ranking data yet. Click "Sync Now" to fetch from Google.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRankings.map((rank) => (
                <tr key={rank.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionBadge(
                          rank.position
                        )}`}
                      >
                        #{rank.position.toFixed(1)}
                      </span>
                      {rank.position_change && getChangeIcon(rank.position_change)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{rank.keyword}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {rank.page_url}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rank.clicks}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rank.impressions.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(rank.ctr * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {getDeviceIcon(rank.device)}
                      {rank.device}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rank.position_change ? (
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          rank.position_change > 0
                            ? 'text-green-600'
                            : rank.position_change < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {rank.position_change > 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : rank.position_change < 0 ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : null}
                        {Math.abs(rank.position_change).toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Data Source Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
        <CheckCircle className="h-4 w-4 text-emerald-600" />
        Real data from Google Search Console • Updated:{' '}
        {rankings[0]?.check_date || 'Never'}
      </div>
    </div>
  );
}
