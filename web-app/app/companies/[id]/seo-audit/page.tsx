'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Search, AlertCircle, CheckCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

interface SEOAudit {
  id: string;
  url: string;
  score: number;
  title?: string;
  meta_description?: string;
  h1_tags?: string[];
  performance_score?: number;
  accessibility_score?: number;
  seo_score?: number;
  issues: AuditIssue[];
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

export default function SEOAuditPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [audits, setAudits] = useState<SEOAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [auditUrl, setAuditUrl] = useState('');

  useEffect(() => {
    fetchCompany();
    fetchAudits();
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      const data = await response.json();
      setCompany(data.company);
      setAuditUrl(data.company.website);
    } catch (error) {
      console.error('Failed to fetch company:', error);
    }
  };

  const fetchAudits = async () => {
    try {
      const response = await fetch(`/api/seo-audits?company_id=${companyId}`);
      const data = await response.json();
      setAudits(data.audits || []);
    } catch (error) {
      console.error('Failed to fetch audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    setRunningAudit(true);
    try {
      const response = await fetch('/api/seo-audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, url: auditUrl }),
      });

      if (response.ok) {
        fetchAudits();
      }
    } catch (error) {
      console.error('Failed to run audit:', error);
    } finally {
      setRunningAudit(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Companies
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-8 w-8" />
            SEO Audit: {company?.name}
          </h1>
          <p className="text-gray-600 mt-2">Analyze and improve your website's SEO performance</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Run New Audit</h2>
          <div className="flex gap-4">
            <input
              type="url"
              value={auditUrl}
              onChange={(e) => setAuditUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={runAudit}
              disabled={runningAudit || !auditUrl}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {runningAudit ? 'Running...' : 'Run Audit'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {audits.map((audit) => (
            <div key={audit.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{audit.url}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(audit.created_at).toLocaleDateString()} at{' '}
                    {new Date(audit.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className={`text-4xl font-bold ${getScoreColor(audit.score)}`}>
                  {audit.score}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(audit.seo_score || 0)}`}>
                    {audit.seo_score || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">SEO Score</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(audit.performance_score || 0)}`}>
                    {audit.performance_score || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Performance</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(audit.accessibility_score || 0)}`}>
                    {audit.accessibility_score || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Accessibility</div>
                </div>
              </div>

              {audit.title && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">Page Title</h4>
                  <p className="text-gray-600">{audit.title}</p>
                </div>
              )}

              {audit.meta_description && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">Meta Description</h4>
                  <p className="text-gray-600">{audit.meta_description}</p>
                </div>
              )}

              {audit.h1_tags && audit.h1_tags.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">H1 Tags</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {audit.h1_tags.map((h1, idx) => (
                      <li key={idx}>{h1}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Issues Found ({audit.issues?.length || 0})</h4>
                <div className="space-y-3">
                  {audit.issues?.map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{issue.message}</span>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {issue.impact} impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Category: {issue.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {audits.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No audits yet</h3>
            <p className="text-gray-600">Run your first SEO audit to get insights and recommendations</p>
          </div>
        )}
      </div>
    </div>
  );
}
