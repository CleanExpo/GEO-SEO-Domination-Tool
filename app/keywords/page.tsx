'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Search, ArrowUp, ArrowDown, Minus, Target, Loader2, Download } from 'lucide-react';
import { KeywordDialog } from '@/components/KeywordDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/EmptyState';

interface Keyword {
  id: string;
  company_id: string;
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  cpc?: number;
  location?: string;
  created_at: string;
}

function KeywordsContent() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/keywords');
      if (!res.ok) {
        throw new Error('Failed to fetch keywords');
      }
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      console.error('Failed to fetch keywords:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch keywords');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (keywords.length === 0) return;

    const headers = ['Keyword', 'Search Volume', 'Difficulty', 'CPC', 'Location', 'Created At'];
    const csvData = keywords.map(kw => [
      kw.keyword,
      kw.search_volume?.toString() || '',
      kw.difficulty?.toString() || '',
      kw.cpc?.toString() || '',
      kw.location || '',
      new Date(kw.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const getPositionChange = (current: number, previous: number) => {
    const change = previous - current;
    if (change > 0) return { icon: ArrowUp, color: 'text-green-600', value: `+${change}` };
    if (change < 0) return { icon: ArrowDown, color: 'text-red-600', value: change };
    return { icon: Minus, color: 'text-gray-400', value: '0' };
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 70) return 'bg-red-100 text-red-800';
    if (difficulty >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const filteredKeywords = keywords.filter(kw =>
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVolume = keywords.reduce((sum, kw) => sum + (kw.search_volume || 0), 0);
  const avgDifficulty = keywords.length > 0
    ? Math.round(keywords.reduce((sum, kw) => sum + (kw.difficulty || 0), 0) / keywords.length)
    : 0;

  if (error) {
    return (
      <div className="p-8 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Keywords</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchKeywords}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
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
            <h1 className="text-3xl font-bold text-gray-900">Keyword Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor your keyword rankings and performance</p>
          </div>
          <div className="flex gap-3">
            {keywords.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            )}
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Keywords
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Target className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Keywords</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : keywords.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Difficulty</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : avgDifficulty}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Search Volume</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : totalVolume.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg CPC</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '-' : `$${(keywords.reduce((sum, kw) => sum + (kw.cpc || 0), 0) / (keywords.length || 1)).toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredKeywords.length === 0 && keywords.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No keywords tracked"
            description="Start tracking your keyword rankings to monitor your SEO performance over time."
            actionLabel="Add Your First Keywords"
            onAction={() => setIsDialogOpen(true)}
          />
        ) : filteredKeywords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Search className="h-16 w-16 text-gray-300" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No keywords found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms to find what you're looking for.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Search Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredKeywords.map((keyword) => (
                  <tr key={keyword.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{keyword.keyword}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">
                        {keyword.search_volume ? `${keyword.search_volume.toLocaleString()}/mo` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {keyword.difficulty ? (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(keyword.difficulty)}`}>
                          {keyword.difficulty}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">
                        {keyword.cpc ? `$${keyword.cpc.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{keyword.location || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <KeywordDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => fetchKeywords()}
      />
    </div>
  );
}

export default function KeywordsPage() {
  return (
    <ErrorBoundary>
      <KeywordsContent />
    </ErrorBoundary>
  );
}
