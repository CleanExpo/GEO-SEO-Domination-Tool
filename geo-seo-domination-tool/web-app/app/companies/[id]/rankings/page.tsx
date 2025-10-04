'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Plus, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Ranking {
  id: string;
  position: number;
  url: string;
  location: string;
  search_engine: 'google' | 'bing';
  date: string;
  keywords?: {
    keyword: string;
  };
}

interface Keyword {
  id: string;
  keyword: string;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

export default function RankingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.id as string;
  const keywordIdParam = searchParams.get('keyword_id');

  const [company, setCompany] = useState<Company | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [checking, setChecking] = useState(false);
  const [formData, setFormData] = useState({
    keyword_id: keywordIdParam || '',
    url: '',
    location: 'us',
    search_engine: 'google' as 'google' | 'bing',
  });

  useEffect(() => {
    fetchCompany();
    fetchKeywords();
    fetchRankings();
  }, [companyId]);

  useEffect(() => {
    if (keywordIdParam) {
      setFormData((prev) => ({ ...prev, keyword_id: keywordIdParam }));
      setShowForm(true);
    }
  }, [keywordIdParam]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      const data = await response.json();
      setCompany(data.company);
      setFormData((prev) => ({ ...prev, url: data.company.website }));
    } catch (error) {
      console.error('Failed to fetch company:', error);
    }
  };

  const fetchKeywords = async () => {
    try {
      const response = await fetch(`/api/keywords?company_id=${companyId}`);
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    }
  };

  const fetchRankings = async () => {
    try {
      const response = await fetch(`/api/rankings?company_id=${companyId}`);
      const data = await response.json();
      setRankings(data.rankings || []);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckRanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);

    try {
      const response = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          ...formData,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        fetchRankings();
      }
    } catch (error) {
      console.error('Failed to check ranking:', error);
    } finally {
      setChecking(false);
    }
  };

  const getPositionTrend = (keyword_id: string) => {
    const keywordRankings = rankings
      .filter((r) => r.keywords?.keyword)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (keywordRankings.length < 2) return null;

    const latest = keywordRankings[keywordRankings.length - 1];
    const previous = keywordRankings[keywordRankings.length - 2];

    if (latest.position < previous.position) return 'up';
    if (latest.position > previous.position) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  // Prepare chart data
  const chartData = rankings
    .filter((r) => r.keywords?.keyword)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      position: r.position > 0 ? r.position : null,
      keyword: r.keywords?.keyword,
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Companies
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Rankings: {company?.name}
              </h1>
              <p className="text-gray-600 mt-2">Track your search engine rankings over time</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5" />
              Check Ranking
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Check Keyword Ranking</h2>
            <form onSubmit={handleCheckRanking} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword *</label>
                <select
                  required
                  value={formData.keyword_id}
                  onChange={(e) => setFormData({ ...formData, keyword_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a keyword</option>
                  {keywords.map((keyword) => (
                    <option key={keyword.id} value={keyword.id}>
                      {keyword.keyword}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="us"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Engine</label>
                <select
                  value={formData.search_engine}
                  onChange={(e) =>
                    setFormData({ ...formData, search_engine: e.target.value as 'google' | 'bing' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="google">Google</option>
                  <option value="bing">Bing</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={checking}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {checking ? 'Checking...' : 'Check Ranking'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
            <p className="text-sm text-gray-600 mt-2">
              Ranking data will be automatically fetched if Google Search API is configured
            </p>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Ranking History</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis reversed domain={[1, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="position" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keyword
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Engine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankings.map((ranking) => (
                <tr key={ranking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {ranking.keywords?.keyword || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ranking.position > 0 ? `#${ranking.position}` : 'Not ranked'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(getPositionTrend(ranking.id))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ranking.location.toUpperCase()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{ranking.search_engine}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(ranking.date).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rankings.length === 0 && (
            <div className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rankings yet</h3>
              <p className="text-gray-600 mb-6">Start tracking your search engine rankings</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                Check Your First Ranking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
