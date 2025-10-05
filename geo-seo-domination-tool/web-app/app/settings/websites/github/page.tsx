'use client';

import { useState, useEffect } from 'react';
import {
  GitBranch,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';

interface GitHubConnection {
  id: string;
  repo_owner: string;
  repo_name: string;
  repo_full_name: string;
  branch: string;
  deployment_platform: 'vercel' | 'netlify';
  site_url: string;
  status: string;
  framework: string;
  router_type: string;
  last_tested_at: string;
  created_at: string;
}

export default function GitHubWebsitesPage() {
  const [connections, setConnections] = useState<GitHubConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    repo_owner: '',
    repo_name: '',
    branch: 'main',
    access_token: '',
    deployment_platform: 'vercel' as 'vercel' | 'netlify',
    site_url: '',
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(false);

      const response = await fetch('/api/github-websites');

      if (response.status === 401) {
        setAuthError(true);
        setError('You must be logged in to connect GitHub repositories');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setConnections(data.connections || []);
      } else {
        setError(data.error || 'Failed to fetch connections');
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);

      const response = await fetch('/api/github-websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          ...formData,
        }),
      });

      if (response.ok) {
        await fetchConnections();
        setConnecting(false);
        setFormData({
          repo_owner: '',
          repo_name: '',
          branch: 'main',
          access_token: '',
          deployment_platform: 'vercel',
          site_url: '',
        });
        alert('GitHub repository connected successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to connect: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to connect to GitHub repository');
    } finally {
      setConnecting(false);
    }
  };

  const testConnection = async (connectionId: string) => {
    try {
      setTestingConnection(connectionId);

      const response = await fetch('/api/github-websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          connection_id: connectionId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Connection test successful!\n\nRepository is accessible and ready for SEO optimization.');
        await fetchConnections();
      } else {
        alert(`❌ Connection test failed:\n\n${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const disconnectSite = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this repository? All pending proposals will be lost.')) {
      return;
    }

    try {
      const response = await fetch(`/api/github-websites/${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchConnections();
        alert('Repository disconnected successfully');
      } else {
        alert('Failed to disconnect repository');
      }
    } catch (error) {
      alert('Failed to disconnect');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">GitHub Website Connections</h1>
        <p className="text-gray-600">
          Connect your Next.js/Node.js websites deployed from GitHub to enable automatic SEO optimization
        </p>
      </div>

      {/* Connection Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Add GitHub Repository
            </h2>
            <p className="text-gray-600 text-sm">
              Connect a repository to start optimizing your site automatically
            </p>
          </div>
          <button
            onClick={() => setConnecting(!connecting)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {connecting ? 'Cancel' : 'Connect Repository'}
          </button>
        </div>

        {connecting && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-blue-900 mb-3">
              Repository Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Owner (GitHub username)
                </label>
                <input
                  type="text"
                  placeholder="yourusername"
                  value={formData.repo_owner}
                  onChange={(e) => setFormData({ ...formData, repo_owner: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  placeholder="my-nextjs-site"
                  value={formData.repo_name}
                  onChange={(e) => setFormData({ ...formData, repo_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch (default: main)
                </label>
                <input
                  type="text"
                  placeholder="main"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deployment Platform
                </label>
                <select
                  value={formData.deployment_platform}
                  onChange={(e) => setFormData({ ...formData, deployment_platform: e.target.value as 'vercel' | 'netlify' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="vercel">Vercel</option>
                  <option value="netlify">Netlify</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site URL
              </label>
              <input
                type="url"
                placeholder="https://my-site.vercel.app"
                value={formData.site_url}
                onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Personal Access Token
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 text-xs hover:underline"
                >
                  (Create Token)
                </a>
              </label>
              <textarea
                rows={3}
                placeholder="ghp_..."
                value={formData.access_token}
                onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required scopes: <code className="bg-gray-100 px-1 rounded">repo</code> (Full control of private repositories)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConnect}
                disabled={connecting && !formData.repo_owner}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect Repository'}
              </button>
              <button
                onClick={() => setConnecting(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-800">
                <strong>Security Note:</strong> Your access token is encrypted and stored securely.
                We only use it to read and modify files in the repository you specify.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Connected Repositories */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Repositories</h2>

        {authError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="font-semibold text-red-900">Authentication Required</h3>
            </div>
            <p className="text-red-800 mb-4">
              You must be logged in to connect and manage GitHub repositories.
            </p>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go to Login
            </a>
          </div>
        ) : error ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Error Loading Connections</h3>
            </div>
            <p className="text-yellow-800 mb-4">{error}</p>
            <button
              onClick={fetchConnections}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GitBranch className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No repositories connected yet</p>
            <p className="text-sm">Click "Connect Repository" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="h-5 w-5 text-emerald-600" />
                    <a
                      href={`https://github.com/${conn.repo_full_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-emerald-600"
                    >
                      {conn.repo_full_name}
                    </a>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                      {conn.branch}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        conn.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {conn.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      🚀 <strong>Site:</strong>{' '}
                      <a href={conn.site_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {conn.site_url}
                      </a>
                    </p>
                    <p>
                      📦 <strong>Platform:</strong> {conn.deployment_platform} •
                      <strong className="ml-2">Framework:</strong> {conn.framework || 'Detecting...'} •
                      <strong className="ml-2">Router:</strong> {conn.router_type || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last tested: {conn.last_tested_at ? new Date(conn.last_tested_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testConnection(conn.id)}
                    disabled={testingConnection === conn.id}
                    className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    title="Test Connection"
                  >
                    {testingConnection === conn.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={conn.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-gray-900"
                    title="Open Site"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => disconnectSite(conn.id)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">How It Works:</h3>
        <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
          <li>
            <strong>Connect Repository:</strong> Give the CRM access to your GitHub repo
          </li>
          <li>
            <strong>AI Analyzes Your Site:</strong> DeepSeek V3 scans pages for SEO issues
          </li>
          <li>
            <strong>Review Proposals:</strong> See AI-generated improvements before they're applied
          </li>
          <li>
            <strong>Auto-Deploy:</strong> Changes are committed to GitHub and auto-deploy to Vercel/Netlify
          </li>
          <li>
            <strong>Track Results:</strong> Monitor ranking improvements and rollback if needed
          </li>
        </ol>

        <div className="mt-4 pt-4 border-t border-emerald-200">
          <p className="text-xs text-gray-600">
            <strong>Safety:</strong> All changes create pull requests (not direct commits) and can be rolled back for 90 days.
            Your repository remains under your full control.
          </p>
        </div>
      </div>
    </div>
  );
}
