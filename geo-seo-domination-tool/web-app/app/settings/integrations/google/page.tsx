'use client';

import { useState, useEffect } from 'react';
import {
  Link2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Plus,
} from 'lucide-react';

interface GSCConnection {
  id: string;
  site_url: string;
  permission_level: string;
  status: string;
  last_synced_at: string;
  created_at: string;
}

export default function GoogleIntegrationsPage() {
  const [connections, setConnections] = useState<GSCConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gsc');
      const data = await response.json();

      if (response.ok) {
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = () => {
    // In production, this would open Google OAuth flow
    // For now, show manual connection instructions
    setConnecting(true);
  };

  const connectManually = async (siteUrl: string, accessToken: string) => {
    try {
      const response = await fetch('/api/gsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          site_url: siteUrl,
          access_token: accessToken,
        }),
      });

      if (response.ok) {
        await fetchConnections();
        setConnecting(false);
        alert('Google Search Console connected successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to connect: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to connect to Google Search Console');
    }
  };

  const disconnectSite = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this site?')) {
      return;
    }

    try {
      // Delete connection (you'd add a DELETE endpoint)
      alert('Disconnect functionality coming soon');
    } catch (error) {
      alert('Failed to disconnect');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Integrations</h1>
        <p className="text-gray-600">
          Connect your Google accounts to access real ranking data and insights
        </p>
      </div>

      {/* Google Search Console Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Google Search Console
            </h2>
            <p className="text-gray-600 text-sm">
              Get 100% accurate ranking data directly from Google
            </p>
          </div>
          <button
            onClick={startOAuth}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Connect Site
          </button>
        </div>

        {/* Connection Instructions (Manual for now) */}
        {connecting && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              Quick Setup Instructions:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>
                Go to{' '}
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Google Search Console
                </a>
              </li>
              <li>Verify ownership of your website</li>
              <li>
                Get an OAuth access token (for now, use Google OAuth Playground or generate
                via Google Cloud Console)
              </li>
              <li>Enter your site URL and access token below</li>
            </ol>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site URL (e.g., https://example.com or sc-domain:example.com)
                </label>
                <input
                  id="site-url"
                  type="text"
                  placeholder="https://disasterrecovery.com.au"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <textarea
                  id="access-token"
                  rows={3}
                  placeholder="ya29.a0AfB_by..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const siteUrl = (document.getElementById('site-url') as HTMLInputElement)
                      ?.value;
                    const accessToken = (
                      document.getElementById('access-token') as HTMLTextAreaElement
                    )?.value;
                    if (siteUrl && accessToken) {
                      connectManually(siteUrl, accessToken);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Connect Now
                </button>
                <button
                  onClick={() => setConnecting(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Full OAuth2 flow will be added soon. For now, use a
                service account or OAuth Playground to generate tokens.
              </p>
            </div>
          </div>
        )}

        {/* Connected Sites */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No sites connected yet</p>
            <p className="text-sm">Click "Connect Site" to get started</p>
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
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-gray-900">{conn.site_url}</span>
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
                  <div className="text-sm text-gray-600">
                    Permission: {conn.permission_level} • Last synced:{' '}
                    {new Date(conn.last_synced_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(
                      conn.site_url
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-gray-900"
                    title="Open in Google Search Console"
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

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">What You Get:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>100% Accurate Rankings</strong> - Real data from Google, not estimates
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Historical Data</strong> - Track ranking changes over time (up to 16
              months)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Device Breakdown</strong> - See how you rank on mobile, desktop, and
              tablet
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Page Performance</strong> - Identify which pages drive the most traffic
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>AI Insights</strong> - DeepSeek V3 analyzes your data and suggests
              improvements
            </span>
          </li>
        </ul>

        <div className="mt-4 pt-4 border-t border-emerald-200">
          <p className="text-xs text-gray-600">
            <strong>Privacy:</strong> We only store aggregated ranking data. Your Google OAuth
            tokens are encrypted and can be revoked at any time from your Google account
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}
