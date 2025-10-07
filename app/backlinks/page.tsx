'use client';

import { useState, useEffect } from 'react';
import { Link2, Plus, ExternalLink, TrendingUp, Award, Filter } from 'lucide-react';

interface Backlink {
  id: string;
  source_url: string;
  target_url: string;
  anchor_text: string;
  domain_authority: number;
  follow_type: 'dofollow' | 'nofollow';
  discovered_at: string;
  company?: {
    id: string;
    name: string;
  };
}

export default function BacklinksPage() {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [followTypeFilter, setFollowTypeFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchBacklinks();
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

  const fetchBacklinks = async () => {
    if (!selectedCompany) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/backlinks?company_id=${selectedCompany}`);

      if (!response.ok) {
        throw new Error('Failed to fetch backlinks');
      }

      const data = await response.json();
      setBacklinks(data.backlinks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching backlinks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getDAColor = (da: number) => {
    if (da >= 70) return 'text-green-600 bg-green-100';
    if (da >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredBacklinks = backlinks.filter(backlink => {
    if (followTypeFilter !== 'all' && backlink.follow_type !== followTypeFilter) {
      return false;
    }
    return true;
  });

  const totalBacklinks = filteredBacklinks.length;
  const dofollowCount = filteredBacklinks.filter(b => b.follow_type === 'dofollow').length;
  const averageDA = filteredBacklinks.length > 0
    ? Math.round(filteredBacklinks.reduce((sum, b) => sum + (b.domain_authority || 0), 0) / filteredBacklinks.length)
    : 0;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading backlinks</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchBacklinks}
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
            <h1 className="text-3xl font-bold text-gray-900">Backlinks Analysis</h1>
            <p className="text-gray-600 mt-1">Monitor and analyze your backlink profile</p>
          </div>
          <button
            onClick={() => console.log('Add backlink')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Backlink
          </button>
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
          className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Link2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Backlinks</p>
              <p className="text-2xl font-bold text-gray-900">{totalBacklinks}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">DoFollow Links</p>
              <p className="text-2xl font-bold text-gray-900">{dofollowCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Domain Authority</p>
              <p className="text-2xl font-bold text-gray-900">{averageDA}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">Follow Type:</label>
          <select
            value={followTypeFilter}
            onChange={(e) => setFollowTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Links</option>
            <option value="dofollow">DoFollow Only</option>
            <option value="nofollow">NoFollow Only</option>
          </select>
        </div>
      </div>

      {/* Backlinks Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600">Loading backlinks...</p>
          </div>
        ) : !selectedCompany ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Link2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Company</h3>
            <p className="text-gray-600 text-center">
              Choose a company from the dropdown above to view backlinks
            </p>
          </div>
        ) : filteredBacklinks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anchor Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discovered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBacklinks.map((backlink) => (
                  <tr key={backlink.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={backlink.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <span className="font-medium">{getDomainFromUrl(backlink.source_url)}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{backlink.anchor_text || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 truncate max-w-xs block">
                        {backlink.target_url}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDAColor(backlink.domain_authority)}`}>
                        {backlink.domain_authority || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        backlink.follow_type === 'dofollow'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {backlink.follow_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(backlink.discovered_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Link2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No backlinks found</h3>
            <p className="text-gray-600 mb-6 text-center">
              Start monitoring backlinks for {companies.find(c => c.id === selectedCompany)?.name || 'this company'}
            </p>
            <button
              onClick={() => console.log('Add backlink')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add First Backlink
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
