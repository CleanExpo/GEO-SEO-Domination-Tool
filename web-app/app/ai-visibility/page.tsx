'use client';

import { useState, useEffect } from 'react';
import { Eye, TrendingUp, TrendingDown, Target, Calendar, Search, Award } from 'lucide-react';

interface VisibilityRecord {
  id: string;
  query: string;
  ai_platform: 'Perplexity' | 'ChatGPT' | 'Gemini' | 'Claude';
  is_cited: boolean;
  citation_position: number | null;
  citation_context: string;
  citation_url: string;
  visibility_score: number;
  check_date: string;
  company?: {
    id: string;
    name: string;
  };
}

export default function AIVisibilityPage() {
  const [records, setRecords] = useState<VisibilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [citedFilter, setCitedFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchVisibilityRecords();
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

  const fetchVisibilityRecords = async () => {
    if (!selectedCompany) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/ai-visibility?company_id=${selectedCompany}`);

      if (!response.ok) {
        throw new Error('Failed to fetch visibility records');
      }

      const data = await response.json();
      setRecords(data.records || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching visibility records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'Perplexity': 'bg-purple-100 text-purple-800',
      'ChatGPT': 'bg-green-100 text-green-800',
      'Gemini': 'bg-blue-100 text-blue-800',
      'Claude': 'bg-orange-100 text-orange-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const getVisibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredRecords = records.filter(record => {
    if (platformFilter !== 'all' && record.ai_platform !== platformFilter) return false;
    if (citedFilter === 'cited' && !record.is_cited) return false;
    if (citedFilter === 'not_cited' && record.is_cited) return false;
    return true;
  });

  const totalChecks = filteredRecords.length;
  const citedCount = filteredRecords.filter(r => r.is_cited).length;
  const citationRate = totalChecks > 0 ? Math.round((citedCount / totalChecks) * 100) : 0;
  const avgVisibilityScore = totalChecks > 0
    ? Math.round(filteredRecords.reduce((sum, r) => sum + r.visibility_score, 0) / totalChecks)
    : 0;

  // Calculate top position
  const citedRecords = filteredRecords.filter(r => r.is_cited && r.citation_position);
  const topPosition = citedRecords.length > 0
    ? Math.min(...citedRecords.map(r => r.citation_position || Infinity))
    : 0;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading visibility data</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchVisibilityRecords}
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
              <Eye className="h-8 w-8 text-purple-600" />
              AI Visibility Tracking
            </h1>
            <p className="text-gray-600 mt-1">Monitor your presence across AI platforms</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">Multi-Platform Tracking</h3>
            <p className="text-sm text-purple-800">
              Track when and how your content is cited by AI platforms. Monitor citation positions,
              context, and visibility scores across ChatGPT, Claude, Perplexity, and Gemini.
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
              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Checks</p>
              <p className="text-2xl font-bold text-gray-900">{totalChecks}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Citation Rate</p>
              <p className="text-2xl font-bold text-gray-900">{citationRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Visibility</p>
              <p className="text-2xl font-bold text-gray-900">{avgVisibilityScore}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Target className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Position</p>
              <p className="text-2xl font-bold text-gray-900">{topPosition > 0 ? `#${topPosition}` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Platforms</option>
            <option value="Perplexity">Perplexity</option>
            <option value="ChatGPT">ChatGPT</option>
            <option value="Gemini">Gemini</option>
            <option value="Claude">Claude</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Citation Status</label>
          <select
            value={citedFilter}
            onChange={(e) => setCitedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Records</option>
            <option value="cited">Cited Only</option>
            <option value="not_cited">Not Cited</option>
          </select>
        </div>
      </div>

      {/* Visibility Records Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Loading visibility data...</p>
          </div>
        ) : !selectedCompany ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Eye className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Company</h3>
            <p className="text-gray-600 text-center">
              Choose a company from the dropdown above to view AI visibility tracking
            </p>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className={`border rounded-lg p-6 ${
                    record.is_cited ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPlatformColor(record.ai_platform)}`}>
                          {record.ai_platform}
                        </span>
                        {record.is_cited ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <TrendingUp className="h-4 w-4" />
                            Cited
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 text-sm">
                            <TrendingDown className="h-4 w-4" />
                            Not Cited
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{record.query}</h3>
                      {record.citation_context && (
                        <p className="text-sm text-gray-600 italic mb-2">
                          "{record.citation_context}"
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getVisibilityColor(record.visibility_score)}`}>
                        Score: {record.visibility_score}
                      </span>
                      {record.citation_position && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 text-center">
                          Position #{record.citation_position}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    {record.citation_url && (
                      <div className="flex items-center gap-2">
                        <span>URL: <a href={record.citation_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{record.citation_url}</a></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(record.check_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Eye className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No visibility data yet</h3>
            <p className="text-gray-600 mb-6 text-center">
              Start tracking AI citations for {companies.find(c => c.id === selectedCompany)?.name || 'this company'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
