'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Key, Loader2, Copy, Trash2, CheckCircle } from 'lucide-react';

type Tab = 'account' | 'api-keys' | 'notifications';

interface UserSettings {
  full_name: string;
  company_name: string;
  email_notifications: boolean;
  weekly_reports: boolean;
  ranking_alerts: boolean;
}

interface ApiKey {
  id: string;
  key_name: string;
  api_key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Account settings
  const [settings, setSettings] = useState<UserSettings>({
    full_name: '',
    company_name: '',
    email_notifications: true,
    weekly_reports: true,
    ranking_alerts: true,
  });

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    if (activeTab === 'api-keys') {
      loadApiKeys();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/api-keys');
      if (!response.ok) throw new Error('Failed to load API keys');
      const data = await response.json();
      setApiKeys(data.apiKeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      const data = await response.json();
      setSettings(data.settings);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_name: newKeyName }),
      });

      if (!response.ok) throw new Error('Failed to generate API key');

      const data = await response.json();
      setGeneratedKey(data.fullKey);
      setShowKeyDialog(true);
      setNewKeyName('');
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate API key');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_id: keyId, is_active: false }),
      });

      if (!response.ok) throw new Error('Failed to revoke API key');

      loadApiKeys();
      setSuccessMessage('API key revoked successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/settings/api-keys?id=${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete API key');

      loadApiKeys();
      setSuccessMessage('API key deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard!');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg font-medium transition-colors ${
                  activeTab === 'account'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="h-5 w-5" />
                Account Settings
              </button>
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg font-medium transition-colors ${
                  activeTab === 'api-keys'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Key className="h-5 w-5" />
                API Keys
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Bell className="h-5 w-5" />
                Notifications
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          )}

          {!loading && activeTab === 'account' && (
            <>
              {/* Account Settings */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={settings.full_name}
                      onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={settings.company_name}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}

          {!loading && activeTab === 'api-keys' && (
            <>
              {/* API Keys */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
                </div>

                {/* Generate New Key */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Generate New API Key</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Enter key name (e.g., Production API)"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleGenerateKey}
                      disabled={saving || !newKeyName.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Generate
                    </button>
                  </div>
                </div>

                {/* API Keys List */}
                <div className="space-y-3">
                  {apiKeys.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No API keys yet. Generate one above to get started.</p>
                  ) : (
                    apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">{key.key_name}</h4>
                            {key.is_active ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                Revoked
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 font-mono">{key.api_key_prefix}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(key.created_at).toLocaleDateString()}
                            {key.last_used_at && ` | Last used: ${new Date(key.last_used_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {key.is_active && (
                            <button
                              onClick={() => handleRevokeKey(key.id)}
                              disabled={saving}
                              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={saving}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Generated Key Dialog */}
              {showKeyDialog && generatedKey && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">API Key Generated</h3>
                    <p className="text-gray-600 mb-4">
                      Save this key securely. You will not be able to see it again.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-sm font-mono break-all">{generatedKey}</code>
                        <button
                          onClick={() => copyToClipboard(generatedKey)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors flex-shrink-0"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowKeyDialog(false);
                        setGeneratedKey(null);
                      }}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      I've Saved My Key
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && activeTab === 'notifications' && (
            <>
              {/* Notifications */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications}
                        onChange={(e) =>
                          setSettings({ ...settings, email_notifications: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Reports</p>
                      <p className="text-sm text-gray-600">Get weekly SEO performance summaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.weekly_reports}
                        onChange={(e) =>
                          setSettings({ ...settings, weekly_reports: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Ranking Alerts</p>
                      <p className="text-sm text-gray-600">
                        Get notified of significant ranking changes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.ranking_alerts}
                        onChange={(e) =>
                          setSettings({ ...settings, ranking_alerts: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
