/**
 * Keyword Research Dashboard - Ahrefs Keywords Explorer Alternative
 *
 * Features:
 * - Research individual keywords (volume, difficulty, SERP features)
 * - Expand seed keyword into 100+ variations
 * - Cluster keywords by topic
 * - Find keyword gaps vs competitors
 * - AI-powered recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Loader2,
  Sparkles,
  Target,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competition: 'Low' | 'Medium' | 'High';
  cpc: number;
  trend: 'rising' | 'falling' | 'stable';
  trendData?: number[];
  serpFeatures: string[];
  relatedKeywords: string[];
  questions: string[];
  currentRanking?: number;
  clickPotential: number;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

export default function KeywordResearchPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [mode, setMode] = useState<'research' | 'expand' | 'gaps'>('research');
  const [keyword, setKeyword] = useState('');
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [keywordData, setKeywordData] = useState<KeywordData | null>(null);
  const [expandedKeywords, setExpandedKeywords] = useState<any[]>([]);
  const [keywordGaps, setKeywordGaps] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      const data = await response.json();
      setCompany(data.company);
    } catch (error) {
      console.error('Failed to fetch company:', error);
    }
  };

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setKeywordData(null);

    try {
      const response = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          keyword: keyword.trim(),
          action: 'research',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to research keyword');
      }

      const data = await response.json();
      setKeywordData(data.keyword);
    } catch (error: any) {
      console.error('Keyword research error:', error);
      setError(error.message || 'Failed to research keyword');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setExpandedKeywords([]);

    try {
      const response = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          keyword: keyword.trim(),
          action: 'expand',
          count: 100,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to expand keyword');
      }

      const data = await response.json();
      setExpandedKeywords(data.keywords);
    } catch (error: any) {
      console.error('Keyword expansion error:', error);
      setError(error.message || 'Failed to expand keyword');
    } finally {
      setLoading(false);
    }
  };

  const handleFindGaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorDomain.trim()) return;

    setLoading(true);
    setError(null);
    setKeywordGaps([]);

    try {
      const response = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          action: 'gaps',
          competitor: competitorDomain.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to find keyword gaps');
      }

      const data = await response.json();
      setKeywordGaps(data.gaps);
    } catch (error: any) {
      console.error('Keyword gap analysis error:', error);
      setError(error.message || 'Failed to find keyword gaps');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-green-600 bg-green-50';
    if (difficulty < 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (trend === 'falling') return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/companies/${companyId}`} className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Company Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Search className="h-8 w-8 text-blue-600" />
                Keyword Research: {company?.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Ahrefs-style keyword research with FREE data sources
              </p>
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="bg-white rounded-lg shadow-md p-1 mb-8 flex gap-1">
          <button
            onClick={() => setMode('research')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${
              mode === 'research'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Target className="inline-block h-5 w-5 mr-2" />
            Research Keyword
          </button>
          <button
            onClick={() => setMode('expand')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${
              mode === 'expand'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="inline-block h-5 w-5 mr-2" />
            Expand Keywords
          </button>
          <button
            onClick={() => setMode('gaps')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${
              mode === 'gaps'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="inline-block h-5 w-5 mr-2" />
            Keyword Gaps
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Research Mode */}
        {mode === 'research' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Research a Keyword</h2>
              <form onSubmit={handleResearch} className="flex gap-4">
                <input
                  type="text"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter keyword (e.g., 'water damage restoration')"
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Research
                    </>
                  )}
                </button>
              </form>
              <p className="text-sm text-gray-600 mt-4">
                Get search volume, difficulty, SERP features, related keywords, and AI recommendations
              </p>
            </div>

            {/* Keyword Data Display */}
            {keywordData && (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Search Volume</span>
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {keywordData.searchVolume.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">searches/month</div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Difficulty</span>
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className={`text-3xl font-bold ${getDifficultyColor(keywordData.difficulty).split(' ')[0]}`}>
                      {keywordData.difficulty}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {keywordData.difficulty < 30 ? 'Easy' : keywordData.difficulty < 60 ? 'Medium' : 'Hard'}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">CPC</span>
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${keywordData.cpc.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{keywordData.competition} competition</div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Click Potential</span>
                      {getTrendIcon(keywordData.trend)}
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {keywordData.clickPotential.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 capitalize">{keywordData.trend} trend</div>
                  </div>
                </div>

                {/* SERP Features */}
                {keywordData.serpFeatures.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold mb-4">SERP Features</h3>
                    <div className="flex flex-wrap gap-3">
                      {keywordData.serpFeatures.map((feature) => (
                        <span
                          key={feature}
                          className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Keywords */}
                {keywordData.relatedKeywords.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold mb-4">Related Keywords</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {keywordData.relatedKeywords.map((kw) => (
                        <div key={kw} className="px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                          {kw}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions */}
                {keywordData.questions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold mb-4">People Also Ask</h3>
                    <div className="space-y-2">
                      {keywordData.questions.map((q) => (
                        <div key={q} className="px-4 py-3 bg-blue-50 text-blue-900 rounded-lg text-sm">
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Ranking */}
                {keywordData.currentRanking && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="h-8 w-8 text-green-600 mt-1" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          You Currently Rank #{keywordData.currentRanking}
                        </h3>
                        <p className="text-gray-700">
                          Your site is already ranking for this keyword! Expected monthly clicks: {keywordData.clickPotential}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expand Mode */}
        {mode === 'expand' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Expand Seed Keyword</h2>
              <form onSubmit={handleExpand} className="flex gap-4">
                <input
                  type="text"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter seed keyword"
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Expanding...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Expand to 100+
                    </>
                  )}
                </button>
              </form>
              <p className="text-sm text-gray-600 mt-4">
                AI generates 100+ related keyword variations (long-tail, semantic, questions, LSI)
              </p>
            </div>

            {/* Expanded Keywords Table */}
            {expandedKeywords.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-bold">
                    {expandedKeywords.length} Keywords Generated
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relevance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {expandedKeywords.slice(0, 50).map((kw, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{kw.keyword}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{kw.searchVolume.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(kw.difficulty)}`}>
                              {kw.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{kw.relevance}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gaps Mode */}
        {mode === 'gaps' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Find Keyword Gaps</h2>
              <form onSubmit={handleFindGaps} className="flex gap-4">
                <input
                  type="text"
                  required
                  value={competitorDomain}
                  onChange={(e) => setCompetitorDomain(e.target.value)}
                  placeholder="Enter competitor domain (e.g., example.com)"
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5" />
                      Find Gaps
                    </>
                  )}
                </button>
              </form>
              <p className="text-sm text-gray-600 mt-4">
                Discover keywords your competitor ranks for that you don't
              </p>
            </div>

            {/* Keyword Gaps Table */}
            {keywordGaps.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-bold">
                    {keywordGaps.length} Keyword Opportunities Found
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relevance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {keywordGaps.map((kw, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{kw.keyword}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{kw.searchVolume.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(kw.difficulty)}`}>
                              {kw.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{kw.relevance}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
