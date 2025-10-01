'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, DollarSign, TrendingUp, Clock } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: 'prospect' | 'qualification' | 'proposal' | 'negotiation' | 'closed';
  probability: number;
  closeDate: string;
  contact: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/crm/deals');

      if (!response.ok) {
        throw new Error('Failed to fetch deals');
      }

      const data = await response.json();
      setDeals(data.deals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDeal = async () => {
    // TODO: Implement add deal modal/form
    console.log('Add deal clicked');
  };

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedValue = deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);

  const getStageColor = (stage: Deal['stage']) => {
    const colors = {
      prospect: 'bg-gray-100 text-gray-800',
      qualification: 'bg-blue-100 text-blue-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed: 'bg-green-100 text-green-800',
    };
    return colors[stage];
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading deals</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchDeals}
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
            <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
            <p className="text-gray-600 mt-1">Track and manage your sales pipeline</p>
          </div>
          <button
            onClick={handleAddDeal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Target className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deals</p>
              <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Weighted Value</p>
              <p className="text-2xl font-bold text-gray-900">${Math.round(weightedValue).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Deals</h2>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-gray-600">Loading deals...</p>
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <Target className="h-16 w-16 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals yet</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                Start tracking your sales pipeline by adding your first deal
              </p>
              <button
                onClick={handleAddDeal}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Your First Deal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{deal.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{deal.company} • {deal.contact}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            ${deal.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Close: {new Date(deal.closeDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{deal.probability}% probability</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStageColor(deal.stage)}`}>
                        {deal.stage}
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${deal.probability}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
