'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface QuotaStatus {
  organisationName: string;
  plan: string;
  apiCallsUsed: number;
  apiCallsLimit: number;
  apiUsagePercentage: number;
  storageUsed: number;
  storageLimit: number;
  storageUsagePercentage: number;
  computeUsed: number;
  computeLimit: number;
  computeUsagePercentage: number;
  searchUsed: number;
  searchLimit: number;
  searchUsagePercentage: number;
  exportUsed: number;
  exportLimit: number;
  exportUsagePercentage: number;
  quotaPeriodEnd: string;
}

interface UsageAlert {
  id: string;
  alertType: string;
  resourceType: string;
  thresholdPercentage: number;
  currentUsage: number;
  limitValue: number;
  createdAt: string;
}

export default function UsageDashboard() {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();

      setQuota(data.quota);
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageIcon = (percentage: number) => {
    if (percentage >= 100) return <XCircle className="h-5 w-5 text-red-600" />;
    if (percentage >= 80) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">No usage data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Usage & Billing</h1>
          <p className="text-slate-600">
            Monitor your organisation's resource consumption and quotas
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Organisation: <strong>{quota.organisationName}</strong>
            </span>
            <span className="text-sm text-slate-600">
              Plan: <strong className="capitalize">{quota.plan}</strong>
            </span>
            <span className="text-sm text-slate-600">
              Reset Date:{' '}
              <strong>{new Date(quota.quotaPeriodEnd).toLocaleDateString()}</strong>
            </span>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Alerts</h2>
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {alert.resourceType.replace('_', ' ').toUpperCase()}: {alert.thresholdPercentage}% threshold reached
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            Current usage: {alert.currentUsage} / {alert.limitValue}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quota Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* API Calls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                API Calls
                {getUsageIcon(quota.apiUsagePercentage)}
              </CardTitle>
              <CardDescription>
                {quota.apiCallsUsed.toLocaleString()} / {quota.apiCallsLimit.toLocaleString()} calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={Math.min(quota.apiUsagePercentage, 100)} className="mb-2" />
              <p className={`text-sm font-medium ${getUsageColor(quota.apiUsagePercentage)}`}>
                {quota.apiUsagePercentage.toFixed(1)}% used
              </p>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Storage
                {getUsageIcon(quota.storageUsagePercentage)}
              </CardTitle>
              <CardDescription>
                {quota.storageUsed.toLocaleString()} / {quota.storageLimit.toLocaleString()} MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={Math.min(quota.storageUsagePercentage, 100)} className="mb-2" />
              <p className={`text-sm font-medium ${getUsageColor(quota.storageUsagePercentage)}`}>
                {quota.storageUsagePercentage.toFixed(1)}% used
              </p>
            </CardContent>
          </Card>

          {/* Compute */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Compute
                {getUsageIcon(quota.computeUsagePercentage)}
              </CardTitle>
              <CardDescription>
                {quota.computeUsed.toLocaleString()} / {quota.computeLimit.toLocaleString()} minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={Math.min(quota.computeUsagePercentage, 100)} className="mb-2" />
              <p className={`text-sm font-medium ${getUsageColor(quota.computeUsagePercentage)}`}>
                {quota.computeUsagePercentage.toFixed(1)}% used
              </p>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Searches
                {getUsageIcon(quota.searchUsagePercentage)}
              </CardTitle>
              <CardDescription>
                {quota.searchUsed.toLocaleString()} / {quota.searchLimit.toLocaleString()} searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={Math.min(quota.searchUsagePercentage, 100)} className="mb-2" />
              <p className={`text-sm font-medium ${getUsageColor(quota.searchUsagePercentage)}`}>
                {quota.searchUsagePercentage.toFixed(1)}% used
              </p>
            </CardContent>
          </Card>

          {/* Exports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Exports
                {getUsageIcon(quota.exportUsagePercentage)}
              </CardTitle>
              <CardDescription>
                {quota.exportUsed.toLocaleString()} / {quota.exportLimit.toLocaleString()} exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={Math.min(quota.exportUsagePercentage, 100)} className="mb-2" />
              <p className={`text-sm font-medium ${getUsageColor(quota.exportUsagePercentage)}`}>
                {quota.exportUsagePercentage.toFixed(1)}% used
              </p>
            </CardContent>
          </Card>

          {/* Upgrade CTA */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription className="text-emerald-100">
                Need more resources?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Upgrade to a higher tier for increased quotas and advanced features.
              </p>
              <button className="w-full bg-white text-emerald-600 font-medium py-2 px-4 rounded-lg hover:bg-emerald-50 transition-colors">
                View Plans
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Usage Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Usage Tips</CardTitle>
            <CardDescription>Optimise your resource consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Quotas reset monthly on the first day of each billing cycle</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>
                  You'll receive alerts when usage reaches 80%, 90%, and 100% of your quota
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Export usage data for detailed analysis and reporting</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
