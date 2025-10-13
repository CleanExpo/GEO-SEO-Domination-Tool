/**
 * Free Authority Checker - Public Lead Generation Tool
 *
 * Shows:
 * - Domain Rating (0-100)
 * - Trust Score
 * - Authority Level (Low/Medium/High)
 * - Improvement Recommendations
 *
 * CTA: Sign up for detailed authority analysis
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Search,
  Loader2,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  BarChart3,
} from 'lucide-react';

interface AuthorityData {
  domainRating: number;
  trustScore: number;
  authorityLevel: 'Low' | 'Medium' | 'High' | 'Excellent';
  recommendations: string[];
  metrics: {
    backlinks: number;
    referringDomains: number;
    organicTraffic: string;
    topKeywords: number;
  };
}

export default function FreeAuthorityChecker() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuthorityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Clean domain
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

      const response = await fetch('/api/tools/authority-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check authority');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error: any) {
      console.error('Authority check error:', error);
      setError(error.message || 'Failed to check authority. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDRColor = (dr: number) => {
    if (dr >= 70) return 'text-green-600 bg-green-100';
    if (dr >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAuthorityColor = (level: string) => {
    if (level === 'Excellent') return 'text-emerald-600 bg-emerald-100';
    if (level === 'High') return 'text-green-600 bg-green-100';
    if (level === 'Medium') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-12 w-12" />
            <h1 className="text-5xl font-bold">Free Authority Checker</h1>
          </div>
          <p className="text-xl text-indigo-100 mb-8">
            Check domain authority instantly. Get Domain Rating, trust score, and authority level - 100% FREE.
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <form onSubmit={handleCheck} className="flex gap-4">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Enter domain (e.g., example.com)"
                  className="w-full pl-14 pr-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-4 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center gap-3 font-semibold text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-6 w-6" />
                    Check Authority
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
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-xl shadow-lg p-8 border-2 ${getDRColor(data.domainRating)}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Domain Rating</span>
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="text-5xl font-bold">
                  {data.domainRating}
                </div>
                <div className="text-sm mt-2">out of 100</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-indigo-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Trust Score</span>
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="text-5xl font-bold text-indigo-600">
                  {data.trustScore}%
                </div>
                <div className="text-sm text-gray-500 mt-2">trustworthiness</div>
              </div>

              <div className={`rounded-xl shadow-lg p-8 border-2 ${getAuthorityColor(data.authorityLevel)}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Authority Level</span>
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-5xl font-bold">
                  {data.authorityLevel}
                </div>
                <div className="text-sm mt-2">domain authority</div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100">
                <div className="text-sm text-gray-600 mb-2">Backlinks</div>
                <div className="text-3xl font-bold text-gray-900">
                  {data.metrics.backlinks.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100">
                <div className="text-sm text-gray-600 mb-2">Referring Domains</div>
                <div className="text-3xl font-bold text-gray-900">
                  {data.metrics.referringDomains.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100">
                <div className="text-sm text-gray-600 mb-2">Organic Traffic</div>
                <div className="text-3xl font-bold text-gray-900">
                  {data.metrics.organicTraffic}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100">
                <div className="text-sm text-gray-600 mb-2">Top Keywords</div>
                <div className="text-3xl font-bold text-gray-900">
                  {data.metrics.topKeywords.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-indigo-100">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Improvement Recommendations</h3>
                <p className="text-sm text-gray-600 mt-1">Actions to increase your domain authority</p>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {data.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-2xl p-8 text-white">
              <div className="flex items-start gap-6">
                <Lock className="h-12 w-12 text-indigo-200 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">Want Detailed Authority Analysis?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Historical authority tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Competitor authority comparison</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Backlink profile analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Link velocity trends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span>AI-powered growth plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span>Weekly authority reports</span>
                    </div>
                  </div>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-3 bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-indigo-50 transition font-bold text-lg shadow-lg"
                  >
                    Get Full Authority Report - 99% Cheaper Than Ahrefs
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                  <p className="text-sm text-indigo-100 mt-3">
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
              Why Check Your Domain Authority?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-indigo-100 hover:border-indigo-300 transition">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Track Your Progress</h3>
                <p className="text-gray-600">
                  Monitor your domain authority over time to see the impact of your SEO efforts.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-blue-100 hover:border-blue-300 transition">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Build Trust</h3>
                <p className="text-gray-600">
                  High domain authority signals trustworthiness to search engines and users.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-100 hover:border-green-300 transition">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">100% Free</h3>
                <p className="text-gray-600">
                  Check unlimited domains for free. No credit card or account required.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready for Advanced SEO Tools?</h3>
          <p className="text-gray-300 mb-6">
            Get keyword research, competitor analysis, SERP tracking, and more - all for 99% less than Ahrefs.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition font-bold text-lg"
          >
            Start Free Trial
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
