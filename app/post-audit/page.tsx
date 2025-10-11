'use client';

import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Calendar, Key } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompetitorTrackingDashboard } from '@/components/post-audit/CompetitorTrackingDashboard';
import { AuditSchedulingInterface } from '@/components/post-audit/AuditSchedulingInterface';
import { ComparisonChartsWidget } from '@/components/post-audit/ComparisonChartsWidget';
import { ApiCredentialsManager } from '@/components/post-audit/ApiCredentialsManager';

export default function PostAuditPage() {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveCompany();
  }, []);

  const loadActiveCompany = async () => {
    try {
      const res = await fetch('/api/company/switch');
      const data = await res.json();

      if (data.activeCompanyId) {
        setActiveCompanyId(data.activeCompanyId);
      } else {
        // If no active company, try to get the first company
        const companiesRes = await fetch('/api/companies');
        const companiesData = await companiesRes.json();

        if (companiesData.companies && companiesData.companies.length > 0) {
          setActiveCompanyId(companiesData.companies[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load active company:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Post-Audit Automation System...</p>
        </div>
      </div>
    );
  }

  if (!activeCompanyId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Selected</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Please create or select a company first to use the Post-Audit Automation System.
            </p>
            <a
              href="/companies"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Companies
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Post-Audit Automation System
        </h1>
        <p className="text-gray-600">
          Automated competitor tracking, audit scheduling, and website credential management
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="competitor-tracking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="competitor-tracking" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Competitor Tracking</span>
            <span className="sm:hidden">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="audit-scheduling" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Scheduling</span>
            <span className="sm:hidden">Audits</span>
          </TabsTrigger>
          <TabsTrigger value="comparison-charts" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Comparison Charts</span>
            <span className="sm:hidden">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Credentials</span>
            <span className="sm:hidden">Keys</span>
          </TabsTrigger>
        </TabsList>

        {/* Competitor Tracking Tab */}
        <TabsContent value="competitor-tracking">
          <CompetitorTrackingDashboard companyId={activeCompanyId} />
        </TabsContent>

        {/* Audit Scheduling Tab */}
        <TabsContent value="audit-scheduling">
          <AuditSchedulingInterface companyId={activeCompanyId} />
        </TabsContent>

        {/* Comparison Charts Tab */}
        <TabsContent value="comparison-charts">
          <ComparisonChartsWidget companyId={activeCompanyId} />
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials">
          <ApiCredentialsManager companyId={activeCompanyId} />
        </TabsContent>
      </Tabs>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-gray-200">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Secure by Default
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              All credentials are encrypted with AES-256-CBC and stored securely.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Automated Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Background jobs run automatically based on your configured rules.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Real-time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Monitor competitor performance and get instant insights.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
