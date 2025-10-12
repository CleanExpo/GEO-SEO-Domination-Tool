/**
 * Free Backlink Checker - Public Lead Generation Tool
 *
 * Shows:
 * - Domain Rating (0-100)
 * - Total Backlinks
 * - Referring Domains
 * - Top 10 Referring Domains (with DR, backlinks)
 *
 * CTA: Sign up for full report with 1,000+ backlinks
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Link2,
  Search,
  Loader2,
  TrendingUp,
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

interface BacklinkData {
  domainRating: number;
  totalBacklinks: number;
  referringDomains: number;
  dofollowPercentage: number;
  topReferringDomains: {
    domain: string;
    domainRating: number;
    backlinksToYou: number;
    linkType: string;
  }[];
}

export default function FreeBacklinkChecker() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BacklinkData | null>(null);
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

      const response = await fetch('/api/tools/backlink-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check backlinks');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error: any) {
      console.error('Backlink check error:', error);
      setError(error.message || 'Failed to check backlinks. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="h-12 w-12" />
            <h1 className="text-5xl font-bold">Free Backlink Checker</h1>
          </div>
          <p className="text-xl text-blue-100 mb-8">
            Check any domain's backlink profile instantly. Get Domain Rating, total backlinks, and top referring domains - 100% FREE.
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
                  className="w-full pl-14 pr-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center gap-3 font-semibold text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-6 w-6" />
                    Check Backlinks
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Domain Rating</span>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className={`text-4xl font-bold ${getDRColor(data.domainRating)}`}>
                  {data.domainRating}
                </div>
                <div className="text-sm text-gray-500 mt-2">out of 100</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Total Backlinks</span>
                  <Link2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {data.totalBacklinks.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-2">backlinks found</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Referring Domains</span>
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {data.referringDomains.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-2">unique domains</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Dofollow Links</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-green-600">
                  {data.dofollowPercentage}%
                </div>
                <div className="text-sm text-gray-500 mt-2">pass authority</div>
              </div>
            </div>

            {/* Top Referring Domains */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-100">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Top 10 Referring Domains</h3>
                <p className="text-sm text-gray-600 mt-1">Domains linking to your site</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Backlinks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.topReferringDomains.map((ref, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{ref.domain}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-bold ${getDRColor(ref.domainRating)}`}>
                            {ref.domainRating}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{ref.backlinksToYou}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            ref.linkType === 'dofollow'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {ref.linkType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-2xl p-8 text-white">
              <div className="flex items-start gap-6">
                <Lock className="h-12 w-12 text-blue-200 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">Want to See All {data.totalBacklinks.toLocaleString()} Backlinks?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Full backlink list with anchor text</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Link velocity (gained/lost)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Anchor text distribution analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>AI-powered recommendations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span>Historical Domain Rating tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span>Competitor backlink comparison</span>
                    </div>
                  </div>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition font-bold text-lg shadow-lg"
                  >
                    Get Full Report - 99% Cheaper Than Ahrefs
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                  <p className="text-sm text-blue-100 mt-3">
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
              Why Use Our Free Backlink Checker?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-blue-100 hover:border-blue-300 transition">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Accurate Domain Rating</h3>
                <p className="text-gray-600">
                  Get precise Domain Rating (0-100) using the same algorithm as industry leaders.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-purple-100 hover:border-purple-300 transition">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Link2 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Backlinks</h3>
                <p className="text-gray-600">
                  Live backlink data from multiple sources, not weeks-old cached data.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-100 hover:border-green-300 transition">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">100% Free</h3>
                <p className="text-gray-600">
                  No credit card required. Check unlimited domains for free.
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
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-bold text-lg"
          >
            Start Free Trial
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
