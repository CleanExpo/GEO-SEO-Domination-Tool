'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, TrendingUp } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  website: string;
}

interface Keyword {
  id: string;
  keyword: string;
  company_id: string;
  location?: string;
}

interface RankingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RankingDialog({ isOpen, onClose, onSuccess }: RankingDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedKeywordId, setSelectedKeywordId] = useState('');
  const [location, setLocation] = useState('us');
  const [searchEngine, setSearchEngine] = useState<'google' | 'bing'>('google');
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchKeywords(selectedCompanyId);
    } else {
      setKeywords([]);
      setSelectedKeywordId('');
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await fetch('/api/companies');
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchKeywords = async (companyId: string) => {
    setLoadingKeywords(true);
    try {
      const res = await fetch(`/api/keywords?company_id=${companyId}`);
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      setError('Failed to load keywords');
    } finally {
      setLoadingKeywords(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompanyId || !selectedKeywordId) {
      setError('Please select a company and keyword');
      return;
    }

    // Get the selected company's website
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    if (!selectedCompany) {
      setError('Selected company not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_id: selectedKeywordId,
          company_id: selectedCompanyId,
          url: selectedCompany.website,
          location: location.trim(),
          search_engine: searchEngine,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to track ranking');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track ranking');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCompanyId('');
    setSelectedKeywordId('');
    setLocation('us');
    setSearchEngine('google');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Track Keyword Ranking</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <select
                id="company"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Select a company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
              Keyword *
            </label>
            {loadingKeywords ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : keywords.length === 0 && selectedCompanyId ? (
              <div className="text-sm text-gray-500 py-2">
                No keywords found for this company. Please add keywords first.
              </div>
            ) : (
              <select
                id="keyword"
                value={selectedKeywordId}
                onChange={(e) => setSelectedKeywordId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
                disabled={!selectedCompanyId}
              >
                <option value="">Select a keyword...</option>
                {keywords.map((keyword) => (
                  <option key={keyword.id} value={keyword.id}>
                    {keyword.keyword}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., us, Brisbane, New York"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter location code (e.g., us) or city name
            </p>
          </div>

          <div>
            <label htmlFor="searchEngine" className="block text-sm font-medium text-gray-700 mb-2">
              Search Engine
            </label>
            <select
              id="searchEngine"
              value={searchEngine}
              onChange={(e) => setSearchEngine(e.target.value as 'google' | 'bing')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              <option value="google">Google</option>
              <option value="bing">Bing</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCompanyId || keywords.length === 0}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tracking...
                </>
              ) : (
                'Track Ranking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
