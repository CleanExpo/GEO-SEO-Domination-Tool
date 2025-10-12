/**
 * Free SERP Checker - Public Lead Generation Tool
 *
 * Shows:
 * - Top 10 search results for any keyword
 * - Basic DR and backlink counts
 * - Position tracking
 * - SERP feature detection
 *
 * CTA: Sign up for full SERP analysis with opportunity scoring
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  TrendingUp,
  Globe,
  CheckCircle,
  ArrowRight,
  Lock,
  Target,
  BarChart3,
  Sparkles,
  Eye,
} from 'lucide-react';

interface SerpResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  description: string;
  domainRating: number;
  backlinks: number;
  hasSchema: boolean;
}

interface SerpData {
  keyword: string;
  searchVolume: number;
  results: SerpResult[];
  features: string[];
  averageDR: number;
  averageBacklinks: number;
}

export default function FreeSerpChecker() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SerpData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/tools/serp-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check SERP');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error: any) {
      console.error('SERP check error:', error);
      setError(error.message || 'Failed to check SERP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDRColor = (dr: number) => {
    if (dr >= 70) return 'text-green-600';
    if (dr >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-12 w-12" />
            <h1 className="text-5xl font-bold">Free SERP Checker</h1>
          </div>
          <p className="text-xl text-green-100 mb-8">
            Analyze Google search results for any keyword. See top 10 rankings with Domain Rating and backlink counts - 100% FREE.
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <form onSubmit={handleCheck} className="flex gap-4">
              <div className="flex-1 relative">
                <Target className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter keyword (e.g., water damage restoration)"
                  className="w-full pl-14 pr-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-10 py-4 rounded-lg hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50 flex items-center gap-3 font-semibold text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-6 w-6" />
                    Check SERP
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
            {/* Overview Section */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                SERP Results for "{data.keyword}"
              </h3>
              <div className="flex items-center gap-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>{data.searchVolume.toLocaleString()} searches/mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Avg DR: {data.averageDR}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-600" />
                  <span>Avg Backlinks: {data.averageBacklinks.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* SERP Features */}
            {data.features.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">SERP Features Detected</h3>
                <div className="flex flex-wrap gap-3">
                  {data.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 10 Results Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-green-100">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Top 10 Search Results</h3>
                <p className="text-sm text-gray-600 mt-1">Current rankings with domain authority metrics</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Backlinks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.results.map((result) => (
                      <tr key={result.position} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                            {result.position}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {result.domain}
                            </a>
                            <p className="text-sm text-gray-900 mt-1 line-clamp-1">{result.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{result.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-bold text-lg ${getDRColor(result.domainRating)}`}>
                            {result.domainRating}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {result.backlinks.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {result.hasSchema ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-2xl p-8 text-white">
              <div className="flex items-start gap-6">
                <Lock className="h-12 w-12 text-green-200 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">Want Full SERP Analysis with AI Insights?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Ranking opportunity score (0-100)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Estimated timeframe & effort</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Content requirements (word count, sections)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Performance & word count analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span>AI-powered ranking recommendations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span>Ranking requirements checklist</span>
                    </div>
                  </div>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-3 bg-white text-green-600 px-8 py-4 rounded-lg hover:bg-green-50 transition font-bold text-lg shadow-lg"
                  >
                    Get Full SERP Analysis - 99% Cheaper Than Ahrefs
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                  <p className="text-sm text-green-100 mt-3">
                    No credit card required. Start free trial today.
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
              Why Use Our Free SERP Checker?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-100 hover:border-green-300 transition">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time SERP Data</h3>
                <p className="text-gray-600">
                  Live search results from Google, not weeks-old cached data. See current rankings instantly.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-teal-100 hover:border-teal-300 transition">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Domain Authority Metrics</h3>
                <p className="text-gray-600">
                  See Domain Rating and backlink counts for every result. Understand ranking difficulty.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-100 hover:border-green-300 transition">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">100% Free</h3>
                <p className="text-gray-600">
                  No credit card required. Check unlimited keywords for free.
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
            Get backlink analysis, keyword research, competitor tracking, and more - all for 99% less than Ahrefs.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition font-bold text-lg"
          >
            Start Free Trial
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
