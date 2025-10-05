'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus, TrendingUp, TrendingDown, Minus, Search, Edit2, Trash2,
  Download, Upload, MapPin, DollarSign, Target, AlertCircle,
  BarChart3, Sparkles, Globe
} from 'lucide-react';
import Link from 'next/link';

interface KeywordMetadata {
  cpc?: number;
  competition?: string;
  location?: string;
  source?: 'semrush' | 'dataforseo' | 'mock';
  fetched_at?: string;
}

interface Keyword {
  id: string;
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  current_rank?: number;
  metadata?: KeywordMetadata;
  created_at: string;
  updated_at?: string;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

interface KeywordStats {
  total: number;
  avgDifficulty: number;
  totalVolume: number;
  avgCpc: number;
  highValue: number;
  lowCompetition: number;
}

export default function KeywordsPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [filteredKeywords, setFilteredKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<KeywordStats>({
    total: 0,
    avgDifficulty: 0,
    totalVolume: 0,
    avgCpc: 0,
    highValue: 0,
    lowCompetition: 0,
  });

  useEffect(() => {
    fetchCompany();
    fetchKeywords();
  }, [companyId]);

  useEffect(() => {
    const filtered = keywords.filter(k =>
      k.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.metadata?.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredKeywords(filtered);
    calculateStats(filtered);
  }, [keywords, searchQuery]);

  const calculateStats = (kws: Keyword[]) => {
    if (kws.length === 0) {
      setStats({
        total: 0,
        avgDifficulty: 0,
        totalVolume: 0,
        avgCpc: 0,
        highValue: 0,
        lowCompetition: 0,
      });
      return;
    }

    const difficulties = kws.filter(k => k.difficulty).map(k => k.difficulty!);
    const volumes = kws.filter(k => k.search_volume).map(k => k.search_volume!);
    const cpcs = kws.filter(k => k.metadata?.cpc).map(k => k.metadata!.cpc!);

    const highValue = kws.filter(k =>
      (k.search_volume || 0) > 1000 &&
      (k.metadata?.cpc || 0) > 2
    ).length;

    const lowComp = kws.filter(k =>
      k.metadata?.competition?.toLowerCase() === 'low' ||
      (k.difficulty || 100) < 30
    ).length;

    setStats({
      total: kws.length,
      avgDifficulty: difficulties.length > 0
        ? Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)
        : 0,
      totalVolume: volumes.reduce((a, b) => a + b, 0),
      avgCpc: cpcs.length > 0
        ? parseFloat((cpcs.reduce((a, b) => a + b, 0) / cpcs.length).toFixed(2))
        : 0,
      highValue,
      lowCompetition: lowComp,
    });
  };

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      const data = await response.json();
      setCompany(data.company);
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) return;

    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchKeywords();
      }
    } catch (error) {
      console.error('Failed to delete keyword:', error);
    }
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'text-gray-500';
    if (difficulty < 30) return 'text-green-600';
    if (difficulty < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompetitionColor = (competition?: string) => {
    if (!competition) return 'text-gray-500';
    if (competition.toLowerCase() === 'low') return 'text-green-600';
    if (competition.toLowerCase() === 'medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValueScore = (keyword: Keyword): { score: number; color: string; label: string } => {
    const volume = keyword.search_volume || 0;
    const cpc = keyword.metadata?.cpc || 0;
    const difficulty = keyword.difficulty || 100;

    // Value score formula: (Volume * CPC) / Difficulty
    const value = volume > 0 && cpc > 0 ? (volume * cpc) / Math.max(difficulty, 1) : 0;

    if (value > 500) return { score: Math.round(value), color: 'text-green-600 bg-green-50', label: 'High Value' };
    if (value > 100) return { score: Math.round(value), color: 'text-blue-600 bg-blue-50', label: 'Good Value' };
    if (value > 0) return { score: Math.round(value), color: 'text-gray-600 bg-gray-50', label: 'Low Value' };
    return { score: 0, color: 'text-gray-400 bg-gray-50', label: 'Unknown' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading keywords...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/companies" className="text-emerald-600 hover:underline mb-2 inline-block">
            ← Back to Companies
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Search className="h-8 w-8 text-emerald-600" />
                </div>
                Keyword Research: {company?.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive SEO & GEO keyword analysis with DataForSEO integration
              </p>
            </div>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition shadow-md"
            >
              <Plus className="h-5 w-5" />
              Add Keywords
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Difficulty</p>
                <p className={`text-2xl font-bold ${getDifficultyColor(stats.avgDifficulty)}`}>
                  {stats.avgDifficulty}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalVolume.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg CPC</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.avgCpc.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Value</p>
                <p className="text-2xl font-bold text-green-600">{stats.highValue}</p>
              </div>
              <Sparkles className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Competition</p>
                <p className="text-2xl font-bold text-green-600">{stats.lowCompetition}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search keywords, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
          </div>
        </div>

        {/* Keywords Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume/Mo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKeywords.map((keyword) => {
                  const valueScore = getValueScore(keyword);
                  return (
                    <tr key={keyword.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{keyword.keyword}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {keyword.search_volume ? keyword.search_volume.toLocaleString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${getDifficultyColor(keyword.difficulty)}`}>
                          {keyword.difficulty || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {keyword.metadata?.cpc ? `$${keyword.metadata.cpc.toFixed(2)}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCompetitionColor(keyword.metadata?.competition)}`}>
                          {keyword.metadata?.competition || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {keyword.metadata?.location && (
                            <>
                              <MapPin className="h-3 w-3" />
                              {keyword.metadata.location}
                            </>
                          )}
                          {!keyword.metadata?.location && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${valueScore.color}`}>
                          <Sparkles className="h-3 w-3" />
                          {valueScore.score > 0 ? valueScore.score : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded ${
                          keyword.metadata?.source === 'dataforseo' ? 'bg-blue-100 text-blue-800' :
                          keyword.metadata?.source === 'semrush' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {keyword.metadata?.source || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditingKeyword(keyword);
                              setShowEditDialog(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit keyword"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/companies/${companyId}/rankings?keyword_id=${keyword.id}`}
                            className="text-emerald-600 hover:text-emerald-800"
                            title="Track rankings"
                          >
                            <Globe className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(keyword.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete keyword"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredKeywords.length === 0 && (
            <div className="p-12 text-center">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No keywords found' : 'No keywords yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Add keywords to track performance and get SEO/GEO insights'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Keyword
                </button>
              )}
            </div>
          )}
        </div>

        {/* SEO/GEO Insights */}
        {keywords.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              SEO & GEO Optimization Insights
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {stats.highValue > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong className="text-green-600">{stats.highValue} high-value keywords</strong> identified.
                    These have strong search volume and CPC with manageable difficulty.
                  </p>
                </div>
              )}
              {stats.lowCompetition > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong className="text-emerald-600">{stats.lowCompetition} low-competition keywords</strong> found.
                    Quick wins for improving rankings and local visibility.
                  </p>
                </div>
              )}
              {keywords.filter(k => k.metadata?.location).length > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong className="text-blue-600">
                      {keywords.filter(k => k.metadata?.location).length} geo-targeted keywords
                    </strong> configured for local search optimization.
                  </p>
                </div>
              )}
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong className="text-purple-600">Total search potential:</strong> {stats.totalVolume.toLocaleString()} monthly searches
                  across all tracked keywords.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
