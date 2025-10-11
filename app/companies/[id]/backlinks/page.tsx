import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, Link2, ExternalLink, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Backlink Analysis | GEO-SEO',
  description: 'Ahrefs-style backlink analysis with Domain Rating, referring domains, and AI recommendations',
};

interface BacklinkPageProps {
  params: { id: string };
}

export default async function BacklinksPage({ params }: BacklinkPageProps) {
  // Fetch backlink data
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/backlinks/${params.id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load backlink data. Please try again.</p>
        </div>
      </div>
    );
  }

  const { profile, cached, lastAnalyzed } = await response.json();

  // Fetch company for context
  const { data: company } = await supabase
    .from('companies')
    .select('name, website')
    .eq('id', params.id)
    .single();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backlink Analysis</h1>
          <p className="text-gray-600 mt-1">
            {company?.name} • {company?.website}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {cached ? '📦 Cached data' : '🔄 Fresh analysis'} • Last analyzed: {new Date(lastAnalyzed).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Analysis
        </button>
      </div>

      {/* Overview Cards - Ahrefs Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Domain Rating */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Domain Rating</h3>
            <span className="text-xs opacity-75">Like Ahrefs DR</span>
          </div>
          <div className="text-4xl font-bold">{profile.domainRating}</div>
          <div className="text-sm opacity-75 mt-1">Out of 100</div>
        </div>

        {/* Total Backlinks */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Backlinks</h3>
            <Link2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {profile.totalBacklinks.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            From {profile.referringDomains.toLocaleString()} domains
          </div>
        </div>

        {/* Dofollow Links */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Dofollow Links</h3>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {((profile.dofollowLinks / profile.totalBacklinks) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {profile.dofollowLinks.toLocaleString()} dofollow
          </div>
        </div>

        {/* Link Velocity */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Link Velocity</h3>
            {profile.linkVelocity.netChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className={`text-3xl font-bold ${
            profile.linkVelocity.netChange > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {profile.linkVelocity.netChange > 0 ? '+' : ''}
            {profile.linkVelocity.netChange}
          </div>
          <div className="text-sm text-gray-500 mt-1">Last 30 days</div>
        </div>
      </div>

      {/* Link Velocity Details */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Link Velocity (Last 30 Days)</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Links Gained</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              +{profile.linkVelocity.gained}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Links Lost</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              -{profile.linkVelocity.lost}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600">Net Change</span>
            </div>
            <div className={`text-3xl font-bold ${
              profile.linkVelocity.netChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {profile.linkVelocity.netChange > 0 ? '+' : ''}
              {profile.linkVelocity.netChange}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {profile.recommendations && profile.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI-Powered Recommendations
          </h2>
          <div className="space-y-3">
            {profile.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < 2 ? 'bg-red-100 text-red-700' :
                  i < 5 ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {i + 1}
                </div>
                <p className="flex-1 text-gray-800">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Referring Domains */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Top Referring Domains</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Domain</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Backlinks</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">DR</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Link Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">First Seen</th>
              </tr>
            </thead>
            <tbody>
              {profile.topReferringDomains.slice(0, 20).map((domain: any, i: number) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <a
                      href={`https://${domain.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {domain.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3 px-4 font-medium">{domain.backlinks.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      domain.domainRating >= 70 ? 'bg-green-100 text-green-700' :
                      domain.domainRating >= 40 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {domain.domainRating}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${
                      domain.linkType === 'dofollow' ? 'text-green-600 font-medium' : 'text-gray-600'
                    }`}>
                      {domain.linkType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(domain.firstSeen).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anchor Text Distribution */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Anchor Text Distribution</h2>
        <div className="space-y-3">
          {profile.anchorTextDistribution.slice(0, 15).map((anchor: any, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-48 text-sm font-medium text-gray-700 truncate">
                {anchor.text}
              </div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full flex items-center px-2 text-xs font-medium text-white ${
                      anchor.type === 'exact' ? 'bg-green-500' :
                      anchor.type === 'branded' ? 'bg-blue-500' :
                      anchor.type === 'partial' ? 'bg-purple-500' :
                      anchor.type === 'generic' ? 'bg-gray-500' :
                      'bg-orange-500'
                    }`}
                    style={{ width: `${Math.max(anchor.percentage, 5)}%` }}
                  >
                    {anchor.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="w-24 text-right">
                <span className="text-sm font-medium text-gray-600">{anchor.count} links</span>
              </div>
              <div className="w-20">
                <span className={`text-xs px-2 py-1 rounded ${
                  anchor.type === 'exact' ? 'bg-green-100 text-green-700' :
                  anchor.type === 'branded' ? 'bg-blue-100 text-blue-700' :
                  anchor.type === 'partial' ? 'bg-purple-100 text-purple-700' :
                  anchor.type === 'generic' ? 'bg-gray-100 text-gray-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {anchor.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Anchor Text Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-600">Exact Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-gray-600">Branded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-gray-600">Partial Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-500"></div>
              <span className="text-gray-600">Generic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-gray-600">Naked URL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Backlinks */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Top 100 Backlinks (by Authority)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Source URL</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Anchor Text</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Authority</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {profile.topBacklinks.slice(0, 100).map((link: any, i: number) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 max-w-md">
                    <a
                      href={link.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm truncate block"
                    >
                      {link.sourceUrl.length > 60
                        ? link.sourceUrl.substring(0, 60) + '...'
                        : link.sourceUrl}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">
                    {link.anchorText || '[no anchor]'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      link.authorityScore >= 70 ? 'bg-green-100 text-green-700' :
                      link.authorityScore >= 40 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {link.authorityScore}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${
                      link.linkType === 'dofollow' ? 'text-green-600 font-medium' : 'text-gray-600'
                    }`}>
                      {link.linkType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {link.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : link.status === 'broken' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
