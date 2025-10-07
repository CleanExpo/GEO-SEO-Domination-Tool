'use client';

/**
 * CEO Guardian Dashboard
 *
 * Self-Healing System Command Center
 * - MCP Health Monitoring
 * - Auto-Fix Agent Status
 * - Gap Detection
 * - Enhancement Suggestions
 */

import { useEffect, useState, Suspense } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface MCPHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'misconfigured';
  lastCheck: string;
  responseTime?: number;
  error?: string;
  suggestions?: string[];
  autoFixAvailable?: boolean;
}

interface HealthMonitorReport {
  timestamp: string;
  totalServers: number;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  misconfiguredCount: number;
  servers: MCPHealthStatus[];
  criticalIssues: string[];
  recommendations: string[];
}

function GuardianDashboardInner() {
  const [healthReport, setHealthReport] = useState<HealthMonitorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchHealthReport();

    // Auto-refresh every 5 minutes
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchHealthReport(true);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchHealthReport = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const response = await fetch('/api/guardian/mcp-health');
      if (response.ok) {
        const data = await response.json();
        setHealthReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch health report:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const triggerManualCheck = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/guardian/mcp-health', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setHealthReport(data);
      }
    } catch (error) {
      console.error('Failed to trigger health check:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'misconfigured':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'healthy':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'degraded':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'down':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'misconfigured':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getHealthPercentage = () => {
    if (!healthReport) return 0;
    return Math.round((healthReport.healthyCount / healthReport.totalServers) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Guardian System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CEO Guardian Dashboard</h1>
                <p className="text-sm text-gray-600">Self-Healing System Command Center</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Auto-refresh (5min)</span>
              </label>
              <button
                onClick={triggerManualCheck}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">System Health</span>
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{getHealthPercentage()}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {healthReport?.healthyCount}/{healthReport?.totalServers} services healthy
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Critical Issues</span>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {healthReport?.criticalIssues.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Requires immediate attention</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Auto-Fix Available</span>
              <Zap className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {healthReport?.servers.filter((s) => s.autoFixAvailable).length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">One-click solutions ready</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Recommendations</span>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {healthReport?.recommendations.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Enhancement suggestions</p>
          </div>
        </div>

        {/* Critical Issues Alert */}
        {healthReport && healthReport.criticalIssues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Critical Issues Detected</h3>
                <ul className="space-y-2">
                  {healthReport.criticalIssues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-800">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {healthReport && healthReport.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {healthReport.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-800">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* MCP Server Status */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">MCP Server Status</h2>
            {healthReport && (
              <p className="text-sm text-gray-600 mt-1">
                Last checked: {new Date(healthReport.timestamp).toLocaleString()}
              </p>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {healthReport?.servers.map((server) => (
              <div key={server.name} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(server.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{server.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={getStatusBadge(server.status)}>{server.status}</span>
                        {server.responseTime !== undefined && (
                          <span className="text-xs text-gray-500">
                            {server.responseTime}ms
                          </span>
                        )}
                      </div>
                      {server.error && (
                        <p className="text-sm text-red-600 mt-2">Error: {server.error}</p>
                      )}
                      {server.suggestions && server.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Suggestions:</p>
                          <ul className="mt-1 space-y-1">
                            {server.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-xs text-gray-600">
                                • {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {server.autoFixAvailable && (
                      <button className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-200">
                        Auto-Fix Available
                      </button>
                    )}
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(server.lastCheck).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Layers */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="h-6 w-6 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">MCP Health Monitor</h3>
            </div>
            <p className="text-sm text-gray-600">
              Continuous scanning every 5 minutes. Detects configuration issues, broken
              connections, and performance degradation.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">Status: Active</div>
              <div className="text-xs text-gray-500 mt-1">
                Next check: {autoRefresh ? '< 5 min' : 'Manual'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="h-6 w-6 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Auto-Fix Agent</h3>
            </div>
            <p className="text-sm text-gray-600">
              Automatically applies solutions for common issues. Switches Docker to npx, fixes
              missing env vars, restarts failed services.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">Status: Ready</div>
              <div className="text-xs text-gray-500 mt-1">
                {healthReport?.servers.filter((s) => s.autoFixAvailable).length || 0} fixes
                available
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Gap Detection</h3>
            </div>
            <p className="text-sm text-gray-600">
              Identifies missing MCPs, outdated packages, and unused integrations. Suggests
              enhancements based on project patterns.
            </p>
            <div className="mt-4 pt-4 border-gray-200">
              <div className="text-xs text-gray-500">Status: Analyzing</div>
              <div className="text-xs text-gray-500 mt-1">
                {healthReport?.recommendations.length || 0} recommendations
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuardianDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <GuardianDashboardInner />
    </Suspense>
  );
}
