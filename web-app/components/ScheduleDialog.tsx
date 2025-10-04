'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  job?: any | null;
}

export function ScheduleDialog({ isOpen, onClose, onSuccess, job }: ScheduleDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [customCron, setCustomCron] = useState('');
  const [keywords, setKeywords] = useState('');
  const [searchEngine, setSearchEngine] = useState('google');
  const [location, setLocation] = useState('United States');
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      if (job) {
        // Populate form with existing job data
        setName(job.name);
        setDescription(job.description || '');
        setKeywords(job.config?.keywords?.join(', ') || '');
        setSearchEngine(job.config?.search_engine || 'google');
        setLocation(job.config?.location || 'United States');
        setCompanyId(job.company_id || '');

        // Determine schedule type from cron expression
        const cronMap: Record<string, 'daily' | 'weekly' | 'monthly'> = {
          '0 9 * * *': 'daily',
          '0 0 * * 0': 'weekly',
          '0 0 1 * *': 'monthly',
        };
        const detectedType = cronMap[job.schedule];
        if (detectedType) {
          setScheduleType(detectedType);
        } else {
          setScheduleType('custom');
          setCustomCron(job.schedule);
        }
      }
    }
  }, [isOpen, job]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const getCronExpression = () => {
    const cronMap: Record<string, string> = {
      daily: '0 9 * * *',      // Every day at 9:00 AM
      weekly: '0 0 * * 0',     // Every Sunday at midnight
      monthly: '0 0 1 * *',    // First day of month at midnight
    };

    return scheduleType === 'custom' ? customCron : cronMap[scheduleType];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name) {
      setError('Name is required');
      return;
    }

    if (scheduleType === 'custom' && !customCron) {
      setError('Custom cron expression is required');
      return;
    }

    setLoading(true);

    try {
      const keywordArray = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const schedule = getCronExpression();

      const body = {
        job_type: 'ranking_check',
        name,
        description,
        schedule,
        is_active: true,
        config: {
          keywords: keywordArray,
          search_engine: searchEngine,
          location,
        },
        company_id: companyId || null,
      };

      const url = job ? `/api/scheduled-jobs/${job.id}` : '/api/scheduled-jobs';
      const method = job ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save schedule');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setScheduleType('daily');
    setCustomCron('');
    setKeywords('');
    setSearchEngine('google');
    setLocation('United States');
    setCompanyId('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {job ? 'Edit Schedule' : 'New Scheduled Job'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Job Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily SEO Rankings Check"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this scheduled job"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company (Optional)
            </label>
            <select
              id="company"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-2">
              Schedule *
            </label>
            <select
              id="schedule"
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="daily">Daily (9:00 AM)</option>
              <option value="weekly">Weekly (Sunday at midnight)</option>
              <option value="monthly">Monthly (1st at midnight)</option>
              <option value="custom">Custom (Cron expression)</option>
            </select>
          </div>

          {scheduleType === 'custom' && (
            <div>
              <label htmlFor="customCron" className="block text-sm font-medium text-gray-700 mb-2">
                Cron Expression *
              </label>
              <input
                id="customCron"
                type="text"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="e.g., 0 9 * * * (daily at 9am)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Learn about cron expressions at{' '}
                <a
                  href="https://crontab.guru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  crontab.guru
                </a>
              </p>
            </div>
          )}

          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
              Keywords (comma-separated)
            </label>
            <textarea
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="seo tools, keyword research, rank tracker"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="searchEngine" className="block text-sm font-medium text-gray-700 mb-2">
                Search Engine
              </label>
              <select
                id="searchEngine"
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="google">Google</option>
                <option value="bing">Bing</option>
                <option value="yahoo">Yahoo</option>
              </select>
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
                placeholder="United States"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {job ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{job ? 'Update Schedule' : 'Create Schedule'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
