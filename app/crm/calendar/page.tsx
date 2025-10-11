'use client';

/**
 * Content Calendar Page
 *
 * Visual calendar interface for scheduling and managing content posts.
 *
 * Features:
 * - Calendar view with scheduled posts
 * - Create new content calendar
 * - Edit/delete scheduled posts
 * - Platform distribution visualization
 * - Cost tracking
 */

import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Play, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface ScheduledPost {
  id: number;
  portfolioId: string;
  scheduledFor: string;
  contentType: string;
  topic: string;
  platforms: string[];
  status: 'scheduled' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
  contentId?: string;
  deploymentId?: string;
  generatedAt?: string;
  publishedAt?: string;
  error?: string;
  createdAt: string;
}

interface CalendarReport {
  success: boolean;
  scheduledPosts: ScheduledPost[];
  totalPosts: number;
  breakdown: {
    educational: number;
    promotional: number;
    news: number;
  };
  platformDistribution: Record<string, number>;
  estimatedCost: number;
  message?: string;
  error?: string;
}

interface Portfolio {
  id: string;
  company_name: string;
  industry: string;
}

export default function ContentCalendarPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [calendarReport, setCalendarReport] = useState<CalendarReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [platforms, setPlatforms] = useState({
    nodejs: { enabled: false, postsPerWeek: 3 },
    wordpress: { enabled: false, postsPerWeek: 3 },
    linkedin: { enabled: false, postsPerWeek: 5 },
    facebook: { enabled: false, postsPerWeek: 5 },
    twitter: { enabled: false, postsPerWeek: 7 },
    gmb: { enabled: false, postsPerWeek: 2 }
  });
  const [contentMix, setContentMix] = useState({
    educational: 70,
    promotional: 20,
    news: 10
  });

  // Load portfolios on mount
  useEffect(() => {
    loadPortfolios();
  }, []);

  // Load scheduled posts when portfolio changes
  useEffect(() => {
    if (selectedPortfolio) {
      loadScheduledPosts();
    }
  }, [selectedPortfolio]);

  const loadPortfolios = async () => {
    setLoadingPortfolios(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/portfolio');
      if (!response.ok) throw new Error('Failed to load portfolios');
      const data = await response.json();
      if (data.success) {
        setPortfolios(data.portfolios);
        if (data.portfolios.length > 0) {
          setSelectedPortfolio(data.portfolios[0].id);
        }
      } else {
        throw new Error(data.error || 'Failed to load portfolios');
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      setError(error instanceof Error ? error.message : 'Failed to load portfolios');
    } finally {
      setLoadingPortfolios(false);
    }
  };

  const loadScheduledPosts = async () => {
    if (!selectedPortfolio) return;

    setLoadingPosts(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/calendar?portfolioId=${selectedPortfolio}`);
      if (!response.ok) throw new Error('Failed to load scheduled posts');
      const data = await response.json();
      if (data.success) {
        setScheduledPosts(data.posts);
      } else {
        throw new Error(data.error || 'Failed to load scheduled posts');
      }
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load scheduled posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const generateCalendar = async () => {
    if (!selectedPortfolio || !startDate || !endDate) {
      setGenerateError('Please select a portfolio and date range');
      return;
    }

    const enabledPlatforms = Object.entries(platforms)
      .filter(([_, config]) => config.enabled)
      .map(([platform, config]) => ({
        platform,
        postsPerWeek: config.postsPerWeek,
        config: {} // Platform-specific config would go here
      }));

    if (enabledPlatforms.length === 0) {
      setGenerateError('Please enable at least one platform');
      return;
    }

    setLoading(true);
    setGenerateError(null);
    try {
      const response = await fetch('/api/crm/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: selectedPortfolio,
          startDate,
          endDate,
          platforms: enabledPlatforms,
          contentMix,
          autoGenerate: false
        })
      });

      if (!response.ok) throw new Error('Failed to generate calendar');
      const data = await response.json();
      if (data.success) {
        setCalendarReport(data);
        setShowCreateModal(false);
        loadScheduledPosts();
      } else {
        throw new Error(data.error || 'Failed to generate calendar');
      }
    } catch (error) {
      console.error('Error generating calendar:', error);
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) return;

    setDeleteError(null);
    try {
      const response = await fetch(`/api/crm/calendar?id=${postId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete post');
      const data = await response.json();
      if (data.success) {
        loadScheduledPosts();
      } else {
        throw new Error(data.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete post. Please try again.');
    }
  };

  const processDuePosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' })
      });

      if (!response.ok) throw new Error('Failed to process posts');
      const data = await response.json();
      if (data.success) {
        loadScheduledPosts();
      } else {
        throw new Error(data.error || 'Failed to process posts');
      }
    } catch (error) {
      console.error('Error processing posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to process posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'generating': return <Play className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'generated': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'publishing': return <TrendingUp className="w-4 h-4 text-purple-500 animate-pulse" />;
      case 'published': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'educational': return 'bg-blue-100 text-blue-800';
      case 'promotional': return 'bg-purple-100 text-purple-800';
      case 'news': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingPortfolios) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading portfolios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-600 mt-2">Schedule and manage automated content publishing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Generate Calendar
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Delete Error</p>
          <p className="text-sm">{deleteError}</p>
        </div>
      )}

      {/* Portfolio Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Portfolio</label>
        <select
          value={selectedPortfolio}
          onChange={(e) => setSelectedPortfolio(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md"
        >
          <option value="">Select a portfolio...</option>
          {portfolios.map(portfolio => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.company_name} - {portfolio.industry}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Report Summary */}
      {calendarReport && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-emerald-900 mb-4">Calendar Generated Successfully!</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-emerald-700">Total Posts</p>
              <p className="text-2xl font-bold text-emerald-900">{calendarReport.totalPosts}</p>
            </div>
            <div>
              <p className="text-sm text-emerald-700">Educational</p>
              <p className="text-2xl font-bold text-emerald-900">{calendarReport.breakdown.educational}</p>
            </div>
            <div>
              <p className="text-sm text-emerald-700">Promotional</p>
              <p className="text-2xl font-bold text-emerald-900">{calendarReport.breakdown.promotional}</p>
            </div>
            <div>
              <p className="text-sm text-emerald-700">Estimated Cost</p>
              <p className="text-2xl font-bold text-emerald-900">${calendarReport.estimatedCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Process Due Posts Button */}
      <div className="mb-6">
        <button
          onClick={processDuePosts}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Processing...' : 'Process Due Posts Now'}
        </button>
      </div>

      {/* Scheduled Posts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Scheduled Posts ({scheduledPosts.length})
            {loadingPosts && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled For</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platforms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No scheduled posts. Click "Generate Calendar" to create a content schedule.
                  </td>
                </tr>
              ) : (
                scheduledPosts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(post.scheduledFor).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{post.topic}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getContentTypeColor(post.contentType)}`}>
                        {post.contentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {post.platforms.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(post.status)}
                        <span className="text-sm text-gray-900">{post.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Calendar Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Generate Content Calendar</h2>
            </div>
            <div className="p-6 space-y-6">
              {generateError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">{generateError}</p>
                </div>
              )}
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                  />
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Publishing Platforms</label>
                <div className="space-y-3">
                  {Object.entries(platforms).map(([platform, config]) => (
                    <div key={platform} className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => setPlatforms({
                          ...platforms,
                          [platform]: { ...config, enabled: e.target.checked }
                        })}
                        className="w-4 h-4"
                      />
                      <span className="w-32 capitalize">{platform}</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={config.postsPerWeek}
                        onChange={(e) => setPlatforms({
                          ...platforms,
                          [platform]: { ...config, postsPerWeek: parseInt(e.target.value) || 1 }
                        })}
                        disabled={!config.enabled}
                        className="border border-gray-300 rounded px-3 py-1 w-20 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-600">posts/week</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Mix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Content Mix (%)</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="w-32">Educational</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={contentMix.educational}
                      onChange={(e) => setContentMix({ ...contentMix, educational: parseInt(e.target.value) || 0 })}
                      className="border border-gray-300 rounded px-3 py-1 w-20"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-32">Promotional</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={contentMix.promotional}
                      onChange={(e) => setContentMix({ ...contentMix, promotional: parseInt(e.target.value) || 0 })}
                      className="border border-gray-300 rounded px-3 py-1 w-20"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-32">News</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={contentMix.news}
                      onChange={(e) => setContentMix({ ...contentMix, news: parseInt(e.target.value) || 0 })}
                      className="border border-gray-300 rounded px-3 py-1 w-20"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={generateCalendar}
                disabled={loading}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
