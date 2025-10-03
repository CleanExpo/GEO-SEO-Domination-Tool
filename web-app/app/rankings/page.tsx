'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MapPin, Globe, Calendar, Loader2 } from 'lucide-react';
import { RankingDialog } from '@/components/RankingDialog';

interface Keyword {
  id: string;
  keyword: string;
  company_id: string;
}

interface Ranking {
  id: string;
  keyword_id: string;
  company_id: string;
  position: number;
  url: string | null;
  checked_at: string;
  created_at: string;
  keywords: Keyword;
}

interface RankingData {
  id: string;
  keyword: string;
  company: string;
  location: string;
  rankings: {
    date: string;
    position: number;
  }[];
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rankings');
      const data = await res.json();

      // Transform the API data into the format expected by the UI
      const transformedData = transformRankingsData(data.rankings || []);
      setRankings(transformedData);
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  const transformRankingsData = (apiRankings: Ranking[]): RankingData[] => {
    // Group rankings by keyword_id
    const grouped = apiRankings.reduce((acc, ranking) => {
      const key = ranking.keyword_id;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          keyword: ranking.keywords?.keyword || 'Unknown',
          company: ranking.company_id,
          location: 'us', // Default location, can be enhanced later
          rankings: []
        };
      }
      acc[key].rankings.push({
        date: ranking.checked_at || ranking.created_at,
        position: ranking.position
      });
      return acc;
    }, {} as Record<string, RankingData>);

    // Convert to array and sort rankings by date
    return Object.values(grouped).map(rankingData => ({
      ...rankingData,
      rankings: rankingData.rankings.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    }));
  };

  const getTrendDirection = (data: RankingData) => {
    const first = data.rankings[0].position;
    const last = data.rankings[data.rankings.length - 1].position;
    if (last < first) return { direction: 'up', color: 'text-green-600', change: first - last };
    if (last > first) return { direction: 'down', color: 'text-red-600', change: last - first };
    return { direction: 'stable', color: 'text-gray-400', change: 0 };
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ranking Trends</h1>
            <p className="text-gray-600 mt-1">Track keyword position changes over time</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tracked Keywords</p>
              <p className="text-2xl font-bold text-gray-900">{rankings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Improving</p>
              <p className="text-2xl font-bold text-gray-900">
                {rankings.filter(r => getTrendDirection(r).direction === 'up').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-red-600 transform rotate-180" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Declining</p>
              <p className="text-2xl font-bold text-gray-900">
                {rankings.filter(r => getTrendDirection(r).direction === 'down').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Globe className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Locations</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(rankings.map(r => r.location)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 text-center">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <BarChart3 className="h-16 w-16 text-gray-300" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No ranking data</h3>
                <p className="text-gray-600 mb-6">
                  Start tracking keyword rankings to visualize your position changes over time.
                </p>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
                >
                  <TrendingUp className="h-5 w-5" />
                  Track Your First Keyword
                </button>
              </div>
            </div>
          </div>
        ) : (
          rankings.map((ranking) => {
            const trend = getTrendDirection(ranking);
            const currentPosition = ranking.rankings[ranking.rankings.length - 1].position;
            const previousPosition = ranking.rankings[0].position;

            return (
              <div
                key={ranking.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{ranking.keyword}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span>{ranking.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{ranking.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Current</p>
                      <p className="text-3xl font-bold text-gray-900">#{currentPosition}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">7 Days Ago</p>
                      <p className="text-3xl font-bold text-gray-400">#{previousPosition}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Change</p>
                      <p className={`text-2xl font-bold ${trend.color}`}>
                        {trend.direction === 'up' && '+'}
                        {trend.direction === 'down' && '-'}
                        {trend.change}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ranking Chart (Simple Visualization) */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-end justify-between h-32 gap-2">
                    {ranking.rankings.map((point, index) => {
                      const maxPosition = Math.max(...ranking.rankings.map(r => r.position));
                      const height = ((maxPosition - point.position + 1) / maxPosition) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full relative group">
                            <div
                              className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  #{point.position}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <RankingDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => fetchRankings()}
      />
    </div>
  );
}
