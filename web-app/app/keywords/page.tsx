'use client';

import { useState } from 'react';
import { TrendingUp, Plus, Search, ArrowUp, ArrowDown, Minus, Target } from 'lucide-react';

interface Keyword {
  id: string;
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  difficulty: number;
  url: string;
  company: string;
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([
    {
      id: '1',
      keyword: 'local seo services',
      position: 3,
      previousPosition: 5,
      searchVolume: 8200,
      difficulty: 65,
      url: '/services/local-seo',
      company: 'Acme Corp',
    },
    {
      id: '2',
      keyword: 'seo consultant near me',
      position: 7,
      previousPosition: 7,
      searchVolume: 5400,
      difficulty: 58,
      url: '/consulting',
      company: 'Acme Corp',
    },
    {
      id: '3',
      keyword: 'technical seo audit',
      position: 12,
      previousPosition: 8,
      searchVolume: 3100,
      difficulty: 72,
      url: '/services/technical-seo',
      company: 'TechStart Inc',
    },
  ]);

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
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kw.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgPosition = Math.round(keywords.reduce((sum, kw) => sum + kw.position, 0) / keywords.length);
  const totalVolume = keywords.reduce((sum, kw) => sum + kw.searchVolume, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Keyword Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor your keyword rankings and performance</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="h-5 w-5" />
            Add Keywords
          </button>
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
              <p className="text-2xl font-bold text-gray-900">{keywords.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Position</p>
              <p className="text-2xl font-bold text-gray-900">{avgPosition}</p>
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
              <p className="text-2xl font-bold text-gray-900">{totalVolume.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top 10 Rankings</p>
              <p className="text-2xl font-bold text-gray-900">
                {keywords.filter(kw => kw.position <= 10).length}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keyword
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredKeywords.map((keyword) => {
                const change = getPositionChange(keyword.position, keyword.previousPosition);
                const ChangeIcon = change.icon;
                return (
                  <tr key={keyword.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{keyword.keyword}</span>
                        <span className="text-sm text-gray-500">{keyword.url}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">#{keyword.position}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-1 ${change.color}`}>
                        <ChangeIcon className="h-4 w-4" />
                        <span className="font-medium">{change.value}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{keyword.searchVolume.toLocaleString()}/mo</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(keyword.difficulty)}`}>
                        {keyword.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{keyword.company}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
