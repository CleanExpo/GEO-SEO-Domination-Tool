/**
 * Free Keyword Generator - Public Lead Generation Tool
 *
 * Shows:
 * - 20 free keyword suggestions from seed keyword
 * - Search volume for top 5 keywords
 * - Difficulty for top 5 keywords
 *
 * CTA: Sign up to generate 100+ keywords with full data
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Loader2,
  TrendingUp,
  Target,
  CheckCircle,
  ArrowRight,
  Lock,
  Lightbulb,
  BarChart3,
} from 'lucide-react';

interface KeywordSuggestion {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  relevance: number;
}

interface KeywordData {
  seed: string;
  keywords: KeywordSuggestion[];
  totalFound: number;
}

export default function FreeKeywordGenerator() {
  const [seedKeyword, setSeedKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KeywordData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedKeyword.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/tools/keyword-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: seedKeyword.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate keywords');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error: any) {
      console.error('Keyword generation error:', error);
      setError(error.message || 'Failed to generate keywords. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-green-600 bg-green-50';
    if (difficulty < 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty < 30) return 'Easy';
    if (difficulty < 60) return 'Medium';
    return 'Hard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-12 w-12" />
            <h1 className="text-5xl font-bold">Free Keyword Generator</h1>
          </div>
          <p className="text-xl text-purple-100 mb-8">
            Generate keyword ideas from a seed keyword using AI. Get 20 free suggestions with search volume and difficulty - no signup required.
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <form onSubmit={handleGenerate} className="flex gap-4">
              <div className="flex-1 relative">
                <Lightbulb className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  required
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  placeholder="Enter seed keyword (e.g., water damage restoration)"
                  className="w-full pl-14 pr-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 flex items-center gap-3 font-semibold text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-6 w-6" />
                    Generate Keywords
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Generated {data.keywords.length} Keywords from "{data.seed}"
              </h3>
              <p className="text-gray-600">
                Showing {data.keywords.length} free keyword suggestions. Upgrade to see all {data.totalFound}+ variations.
              </p>
            </div>

            {/* Top Keywords with Full Data */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-100">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Top 5 Keywords (Full Data)</h3>
                <p className="text-sm text-gray-600 mt-1">Search volume and difficulty included</p>
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
                    {data.keywords.slice(0, 5).map((kw, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{kw.keyword}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">
                              {kw.searchVolume?.toLocaleString()}
                            </span>
                            <span className="text-gray-500 text-xs">/month</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {kw.difficulty !== undefined && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(kw.difficulty)}`}>
                              {kw.difficulty} - {getDifficultyLabel(kw.difficulty)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                                style={{ width: `${kw.relevance}%` }}
                              />
                            </div>
                            <span className="text-gray-700 font-medium">{kw.relevance}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remaining Keywords (Limited Data) */}
            {data.keywords.length > 5 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-100">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">More Keyword Ideas ({data.keywords.length - 5})</h3>
                  <p className="text-sm text-gray-600 mt-1">Sign up to see full data for these keywords</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.keywords.slice(5).map((kw, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="text-sm text-gray-700">{kw.keyword}</span>
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                          {kw.relevance}% match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-2xl p-8 text-white">
              <div className="flex items-start gap-6">
                <Lock className="h-12 w-12 text-purple-200 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">Unlock 100+ Keyword Variations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>100+ AI-generated keyword variations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Full search volume for all keywords</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Keyword difficulty scores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Topic clustering (group by intent)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span>Question keywords (People Also Ask)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span>Competitor keyword gap analysis</span>
                    </div>
                  </div>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-3 bg-white text-purple-600 px-8 py-4 rounded-lg hover:bg-purple-50 transition font-bold text-lg shadow-lg"
                  >
                    Get 100+ Keywords - Start Free Trial
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                  <p className="text-sm text-purple-100 mt-3">
                    No credit card required. 99% cheaper than Ahrefs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section (Before Results) */}
        {!data && !loading && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              How Our Keyword Generator Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-purple-100 hover:border-purple-300 transition">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered</h3>
                <p className="text-gray-600">
                  Advanced AI generates semantically related keywords, long-tail variations, and question keywords.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-pink-100 hover:border-pink-300 transition">
                <div className="bg-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Real Data</h3>
                <p className="text-gray-600">
                  Live search volume from Google Keyword Planner and difficulty scores from SERP analysis.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-100 hover:border-green-300 transition">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">High Relevance</h3>
                <p className="text-gray-600">
                  Every suggestion is scored for relevance to ensure you get keywords your audience is searching for.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Need More SEO Tools?</h3>
          <p className="text-gray-300 mb-6">
            Get backlink analysis, competitor research, SERP tracking, and more - all for 99% less than Ahrefs.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition font-bold text-lg"
          >
            Start Free Trial
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
