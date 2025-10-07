'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, TrendingUp, AlertTriangle, CheckCircle, Search } from 'lucide-react';

interface ContentGap {
  id: string;
  topic: string;
  keyword: string;
  search_volume: number;
  competitor_has_content: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'identified' | 'in_progress' | 'completed';
  created_at: string;
  company?: {
    id: string;
    name: string;
  };
}

export default function ContentGapsPage() {
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchContentGaps();
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

  const fetchContentGaps = async () => {
    if (!selectedCompany) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/content-gaps?company_id=${selectedCompany}`);

      if (!response.ok) {
        throw new Error('Failed to fetch content gaps');
      }

      const data = await response.json();
      setGaps(data.gaps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching content gaps:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: ContentGap['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getStatusColor = (status: ContentGap['status']) => {
    const colors = {
      identified: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status];
  };

  const filteredGaps = gaps.filter(gap => {
    if (statusFilter !== 'all' && gap.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && gap.priority !== priorityFilter) return false;
    return true;
  });

  const totalGaps = filteredGaps.length;
  const highPriorityCount = filteredGaps.filter(g => g.priority === 'high').length;
  const completedCount = filteredGaps.filter(g => g.status === 'completed').length;
  const totalVolume = filteredGaps.reduce((sum, g) => sum + (g.search_volume || 0), 0);

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading content gaps</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchContentGaps}
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
            <h1 className="text-3xl font-bold text-gray-900">Content Gap Analysis</h1>
            <p className="text-gray-600 mt-1">Identify and track content opportunities</p>
          </div>
          <button
            onClick={() => console.log('Add gap')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Gap
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Gaps</p>
              <p className="text-2xl font-bold text-gray-900">{totalGaps}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{highPriorityCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">{totalVolume.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="identified">Identified</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content Gaps Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600">Loading content gaps...</p>
          </div>
        ) : !selectedCompany ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Company</h3>
            <p className="text-gray-600 text-center">
              Choose a company from the dropdown above to view content gaps
            </p>
          </div>
        ) : filteredGaps.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {filteredGaps.map((gap) => (
                <div
                  key={gap.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{gap.topic}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700 font-medium">{gap.keyword}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(gap.priority)}`}>
                        {gap.priority}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(gap.status)}`}>
                        {gap.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Volume: <strong className="text-gray-900">{gap.search_volume?.toLocaleString() || 'N/A'}</strong></span>
                    </div>
                    {gap.competitor_has_content && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Competitor has content</span>
                      </div>
                    )}
                    <div className="ml-auto text-gray-500">
                      {new Date(gap.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No content gaps found</h3>
            <p className="text-gray-600 mb-6 text-center">
              Start tracking content opportunities for {companies.find(c => c.id === selectedCompany)?.name || 'this company'}
            </p>
            <button
              onClick={() => console.log('Add gap')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add First Gap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
