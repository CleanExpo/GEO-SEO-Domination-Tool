'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import Link from 'next/link';

interface Keyword {
  id: string;
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  cpc?: number;
  trend?: 'up' | 'down' | 'stable';
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

export default function KeywordsPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCompany();
    fetchKeywords();
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      const data = await response.json();
      setCompany(data.company);
    } catch (error) {
      console.error('Failed to fetch company:', error);
    }
  };

  const fetchKeywords = async () => {
    try {
      const response = await fetch(`/api/keywords?company_id=${companyId}`);
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          keyword: newKeyword,
        }),
      });

      if (response.ok) {
        setNewKeyword('');
        setShowForm(false);
        fetchKeywords();
      }
    } catch (error) {
      console.error('Failed to add keyword:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) return;

    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchKeywords();
      }
    } catch (error) {
      console.error('Failed to delete keyword:', error);
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Companies
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Search className="h-8 w-8" />
                Keywords: {company?.name}
              </h1>
              <p className="text-gray-600 mt-2">Track and research keywords for your SEO strategy</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5" />
              Add Keyword
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Keyword</h2>
            <form onSubmit={handleAddKeyword} className="flex gap-4">
              <input
                type="text"
                required
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter keyword or phrase"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={adding}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {adding ? 'Adding...' : 'Add Keyword'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </form>
            <p className="text-sm text-gray-600 mt-2">
              Keyword data (volume, difficulty, CPC) will be automatically fetched if SEMrush API is configured
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {keywords.map((keyword) => (
                <tr key={keyword.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{keyword.keyword}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {keyword.search_volume ? keyword.search_volume.toLocaleString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {keyword.difficulty ? `${keyword.difficulty}%` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {keyword.cpc ? `$${keyword.cpc.toFixed(2)}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(keyword.trend)}
                      <span className="text-sm text-gray-900 capitalize">{keyword.trend || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/companies/${companyId}/rankings?keyword_id=${keyword.id}`}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Track
                    </Link>
                    <button
                      onClick={() => handleDelete(keyword.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {keywords.length === 0 && (
            <div className="p-12 text-center">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No keywords yet</h3>
              <p className="text-gray-600 mb-6">
                Add keywords to track their performance and get insights
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                Add Your First Keyword
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
