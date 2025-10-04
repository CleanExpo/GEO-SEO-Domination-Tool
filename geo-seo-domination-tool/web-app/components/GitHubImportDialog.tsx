'use client';

import { useState } from 'react';
import { X, Loader2, Github } from 'lucide-react';

interface GitHubImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GitHubImportDialog({ isOpen, onClose, onSuccess }: GitHubImportDialogProps) {
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // GitHub URL validation regex
  const GITHUB_URL_REGEX = /github\.com\/[\w-]+\/[\w-]+/;

  // Extract owner/repo from URL and auto-populate name
  const handleUrlChange = (url: string) => {
    setRepositoryUrl(url);
    setError('');

    // Validate GitHub URL
    if (url && GITHUB_URL_REGEX.test(url)) {
      try {
        const match = url.match(/github\.com\/([\w-]+)\/([\w-]+)/);
        if (match) {
          const [, owner, repo] = match;
          // Auto-populate name from repo name
          setName(repo.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
      } catch (err) {
        // Ignore parsing errors
      }
    }
  };

  const validateForm = (): boolean => {
    if (!repositoryUrl.trim()) {
      setError('Repository URL is required');
      return false;
    }

    if (!GITHUB_URL_REGEX.test(repositoryUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
      return false;
    }

    if (!name.trim()) {
      setError('Project name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Normalize GitHub URL to https://github.com/owner/repo format
      let normalizedUrl = repositoryUrl.trim();
      if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      // Remove trailing slashes and .git extension
      normalizedUrl = normalizedUrl.replace(/\.git$/, '').replace(/\/$/, '');

      const res = await fetch('/api/projects/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          name: name.trim(),
          description: description.trim() || undefined,
          language: language.trim() || undefined,
          stars: 0,
          forks: 0,
          open_prs: 0,
          last_updated: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to import repository');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repository');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRepositoryUrl('');
    setName('');
    setDescription('');
    setLanguage('');
    setAutoSync(false);
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
              <Github className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Import Repository</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="repositoryUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Repository URL *
            </label>
            <input
              id="repositoryUrl"
              type="text"
              value={repositoryUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a GitHub repository URL (e.g., github.com/owner/repo)
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-populated from URL, but you can edit it
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Primary Language (Optional)
            </label>
            <input
              id="language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g., TypeScript, Python, JavaScript"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="autoSync"
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              disabled={loading}
            />
            <label htmlFor="autoSync" className="text-sm text-gray-700">
              Enable automatic sync (fetch stars, forks, and PRs automatically)
            </label>
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
              disabled={loading}
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
                  Importing...
                </>
              ) : (
                'Import Repository'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
