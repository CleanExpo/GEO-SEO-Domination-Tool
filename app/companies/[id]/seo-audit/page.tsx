'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Search,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Globe,
  Link as LinkIcon,
  FileText,
  Activity,
  Award,
  ArrowRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Type Definitions
// ============================================================================

interface AuditScores {
  lighthouse: number;
  technicalSEO: number;
  content: number;
  backlinks: number;
  eeat: number;
}

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  url?: string;
  recommendation?: string;
}

interface Opportunity {
  type: 'keyword' | 'backlink' | 'technical';
  keyword?: string;
  search_volume?: number;
  difficulty?: number;
  relevance?: number;
  opportunity_score?: number;
  domain?: string;
  domain_rating?: number;
  backlinks?: number;
  category?: string;
  current_score?: number;
  target_score?: number;
  estimated_impact?: string;
  recommendation: string;
}

interface Competitor {
  domain: string;
  domainRating: number;
  position: number;
  url: string;
}

interface ExtendedData {
  scores: AuditScores;
  eeat_score: number;
  backlinks: {
    total: number;
    referring_domains: number;
    domain_rating: number;
  };
  keywords: {
    primary: string;
    opportunities: number;
  };
  competitors: Competitor[];
  opportunities: Opportunity[];
  executive_summary: string;
  audit_timestamp: string;
  audit_duration_seconds: number;
}

interface ComprehensiveAudit {
  id: string;
  company_id: string;
  url: string;
  score: number;
  title: string;
  meta_description: string;
  h1_tags: string[];
  meta_tags: Record<string, any>;
  performance_score: number;
  accessibility_score: number;
  seo_score: number;
  issues: AuditIssue[];
  extended_data: ExtendedData;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ComprehensiveAuditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.id as string;
  const auditIdFromUrl = searchParams.get('audit_id');

  const [company, setCompany] = useState<Company | null>(null);
  const [audit, setAudit] = useState<ComprehensiveAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'issues' | 'opportunities' | 'competitors'>('overview');

  useEffect(() => {
    fetchCompany();
    if (auditIdFromUrl) {
      fetchAuditById(auditIdFromUrl);
    } else {
      fetchLatestAudit();
    }
  }, [companyId, auditIdFromUrl]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      const data = await response.json();
      setCompany(data.company);
    } catch (error) {
      console.error('Failed to fetch company:', error);
      setError(error instanceof Error ? error.message : 'Failed to load company data');
    }
  };

  const fetchAuditById = async (auditId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seo-audits/${auditId}`);
      if (!response.ok) throw new Error('Failed to fetch audit');
      const data = await response.json();
      setAudit(data.audit);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch audit:', error);
      setError(error instanceof Error ? error.message : 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestAudit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seo-audits?company_id=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch audits');
      const data = await response.json();

      // Get the most recent audit
      if (data.audits && data.audits.length > 0) {
        setAudit(data.audits[0]);
      }
      setError(null);
    } catch (error) {
      console.error('Failed to fetch audits:', error);
      setError(error instanceof Error ? error.message : 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const runComprehensiveAudit = async () => {
    if (!company) return;

    setRunningAudit(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${companyId}/audit/comprehensive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run comprehensive audit');
      }

      const result = await response.json();

      // Fetch the complete audit data
      await fetchAuditById(result.audit_id);
    } catch (error) {
      console.error('Failed to run audit:', error);
      setError(error instanceof Error ? error.message : 'Failed to run audit');
    } finally {
      setRunningAudit(false);
    }
  };

  const generateImprovementTasks = async () => {
    if (!audit) return;

    setGeneratingTasks(true);
    setError(null);

    try {
      const response = await fetch('/api/agent-tasks/create-from-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_id: audit.id,
          company_id: companyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate tasks');
      }

      const result = await response.json();

      // Redirect to tasks page
      window.location.href = `/companies/${companyId}/tasks`;
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate tasks');
    } finally {
      setGeneratingTasks(false);
    }
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
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

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ============================================================================
  // Render: Loading State
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg text-gray-700">Loading audit data...</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: No Audit State
  // ============================================================================

  if (!audit) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/companies" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Back to Companies
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Search className="h-8 w-8" />
              Comprehensive SEO Audit: {company?.name}
            </h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No audit data available</h3>
            <p className="text-gray-600 mb-6">Run your first comprehensive SEO audit to get detailed insights</p>
            <button
              onClick={runComprehensiveAudit}
              disabled={runningAudit}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 inline-flex items-center gap-2"
            >
              {runningAudit ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Running Comprehensive Audit...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Run Comprehensive Audit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Main Audit Display
  // ============================================================================

  const scores = audit.extended_data.scores;
  const eeatScore = audit.extended_data.eeat_score;
  const backlinks = audit.extended_data.backlinks;
  const keywords = audit.extended_data.keywords;
  const competitors = audit.extended_data.competitors || [];
  const opportunities = audit.extended_data.opportunities || [];
  const executiveSummary = audit.extended_data.executive_summary;
  const highImpactIssues = audit.issues.filter(i => i.impact === 'high');
  const mediumImpactIssues = audit.issues.filter(i => i.impact === 'medium');
  const lowImpactIssues = audit.issues.filter(i => i.impact === 'low');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Companies
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Search className="h-8 w-8" />
                Comprehensive SEO Audit: {company?.name}
              </h1>
              <p className="text-gray-600 mt-2">
                {audit.url} • {new Date(audit.created_at).toLocaleDateString()} at{' '}
                {new Date(audit.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={runComprehensiveAudit}
                disabled={runningAudit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 inline-flex items-center gap-2"
              >
                {runningAudit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Run New Audit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Overall Score Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Overall SEO Score</h2>
              <p className="text-blue-100">
                {audit.issues.length} issues found • {opportunities.length} opportunities identified
              </p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold">{audit.score}</div>
              <div className="text-blue-100">/ 100</div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className={`p-6 rounded-lg shadow-md ${getScoreBgColor(scores.lighthouse)}`}>
            <div className="flex items-center justify-between mb-2">
              <Activity className={`h-6 w-6 ${getScoreColor(scores.lighthouse)}`} />
              <div className={`text-3xl font-bold ${getScoreColor(scores.lighthouse)}`}>
                {scores.lighthouse}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700">Lighthouse</div>
            <div className="text-xs text-gray-600 mt-1">Performance & Speed</div>
          </div>

          <div className={`p-6 rounded-lg shadow-md ${getScoreBgColor(scores.technicalSEO)}`}>
            <div className="flex items-center justify-between mb-2">
              <FileText className={`h-6 w-6 ${getScoreColor(scores.technicalSEO)}`} />
              <div className={`text-3xl font-bold ${getScoreColor(scores.technicalSEO)}`}>
                {scores.technicalSEO}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700">Technical SEO</div>
            <div className="text-xs text-gray-600 mt-1">Meta Tags & Structure</div>
          </div>

          <div className={`p-6 rounded-lg shadow-md ${getScoreBgColor(scores.content)}`}>
            <div className="flex items-center justify-between mb-2">
              <Globe className={`h-6 w-6 ${getScoreColor(scores.content)}`} />
              <div className={`text-3xl font-bold ${getScoreColor(scores.content)}`}>
                {scores.content}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700">Content Quality</div>
            <div className="text-xs text-gray-600 mt-1">H1 Tags & Descriptions</div>
          </div>

          <div className={`p-6 rounded-lg shadow-md ${getScoreBgColor(scores.backlinks)}`}>
            <div className="flex items-center justify-between mb-2">
              <LinkIcon className={`h-6 w-6 ${getScoreColor(scores.backlinks)}`} />
              <div className={`text-3xl font-bold ${getScoreColor(scores.backlinks)}`}>
                {scores.backlinks}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700">Backlinks</div>
            <div className="text-xs text-gray-600 mt-1">
              DR {backlinks.domain_rating} • {backlinks.referring_domains} domains
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-md ${getScoreBgColor(eeatScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <Award className={`h-6 w-6 ${getScoreColor(eeatScore)}`} />
              <div className={`text-3xl font-bold ${getScoreColor(eeatScore)}`}>
                {eeatScore}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700">E-E-A-T</div>
            <div className="text-xs text-gray-600 mt-1">Authority & Trust</div>
          </div>
        </div>

        {/* Executive Summary */}
        {executiveSummary && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Executive Summary
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
              {executiveSummary}
            </div>
          </div>
        )}

        {/* Generate Tasks CTA */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-lg shadow-md p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Ready to improve your SEO?</h3>
              <p className="text-emerald-100">
                Generate actionable tasks from this audit to automatically fix issues and improve rankings
              </p>
            </div>
            <button
              onClick={generateImprovementTasks}
              disabled={generatingTasks}
              className="bg-white text-emerald-700 px-6 py-3 rounded-lg hover:bg-emerald-50 transition disabled:bg-gray-200 disabled:text-gray-500 font-semibold inline-flex items-center gap-2 whitespace-nowrap"
            >
              {generatingTasks ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="h-5 w-5" />
                  Generate Improvement Tasks
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  selectedTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('issues')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  selectedTab === 'issues'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Issues ({audit.issues.length})
              </button>
              <button
                onClick={() => setSelectedTab('opportunities')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  selectedTab === 'opportunities'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Opportunities ({opportunities.length})
              </button>
              <button
                onClick={() => setSelectedTab('competitors')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  selectedTab === 'competitors'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Competitors ({competitors.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {backlinks.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Backlinks</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {backlinks.referring_domains}
                      </div>
                      <div className="text-sm text-gray-600">Referring Domains</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {keywords.opportunities}
                      </div>
                      <div className="text-sm text-gray-600">Keyword Opportunities</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {keywords.primary}
                      </div>
                      <div className="text-sm text-gray-600">Primary Keyword</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Issues Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="text-3xl font-bold text-red-700">{highImpactIssues.length}</div>
                      <div className="text-sm text-red-600">High Impact Issues</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="text-3xl font-bold text-yellow-700">{mediumImpactIssues.length}</div>
                      <div className="text-sm text-yellow-600">Medium Impact Issues</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-700">{lowImpactIssues.length}</div>
                      <div className="text-sm text-blue-600">Low Impact Issues</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {selectedTab === 'issues' && (
              <div className="space-y-6">
                {highImpactIssues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      High Impact Issues ({highImpactIssues.length})
                    </h4>
                    <div className="space-y-3">
                      {highImpactIssues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{issue.message}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getImpactBadgeColor(issue.impact)}`}>
                                {issue.impact.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Category: {issue.category}</p>
                            {issue.recommendation && (
                              <p className="text-sm text-gray-700 mt-2 italic">💡 {issue.recommendation}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mediumImpactIssues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Medium Impact Issues ({mediumImpactIssues.length})
                    </h4>
                    <div className="space-y-3">
                      {mediumImpactIssues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{issue.message}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getImpactBadgeColor(issue.impact)}`}>
                                {issue.impact.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Category: {issue.category}</p>
                            {issue.recommendation && (
                              <p className="text-sm text-gray-700 mt-2 italic">💡 {issue.recommendation}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lowImpactIssues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Low Impact Issues ({lowImpactIssues.length})
                    </h4>
                    <div className="space-y-3">
                      {lowImpactIssues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{issue.message}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getImpactBadgeColor(issue.impact)}`}>
                                {issue.impact.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Category: {issue.category}</p>
                            {issue.recommendation && (
                              <p className="text-sm text-gray-700 mt-2 italic">💡 {issue.recommendation}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Opportunities Tab */}
            {selectedTab === 'opportunities' && (
              <div className="space-y-6">
                {opportunities.filter(o => o.type === 'keyword').length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      Keyword Opportunities
                    </h4>
                    <div className="space-y-3">
                      {opportunities
                        .filter(o => o.type === 'keyword')
                        .map((opp, idx) => (
                          <div key={idx} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{opp.keyword}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  {opp.search_volume?.toLocaleString()} searches/mo
                                </span>
                                <span className="text-sm text-gray-600">
                                  Difficulty: {opp.difficulty}%
                                </span>
                                <span className="text-sm font-semibold text-emerald-700">
                                  Score: {opp.opportunity_score}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 italic">💡 {opp.recommendation}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {opportunities.filter(o => o.type === 'backlink').length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-blue-600" />
                      Backlink Opportunities
                    </h4>
                    <div className="space-y-3">
                      {opportunities
                        .filter(o => o.type === 'backlink')
                        .map((opp, idx) => (
                          <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{opp.domain}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  DR: {opp.domain_rating}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {opp.backlinks?.toLocaleString()} backlinks
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 italic">💡 {opp.recommendation}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {opportunities.filter(o => o.type === 'technical').length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      Technical Improvements
                    </h4>
                    <div className="space-y-3">
                      {opportunities
                        .filter(o => o.type === 'technical')
                        .map((opp, idx) => (
                          <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{opp.category}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  Current: {opp.current_score}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Target: {opp.target_score}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  opp.estimated_impact === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {opp.estimated_impact?.toUpperCase()} IMPACT
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 italic">💡 {opp.recommendation}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Competitors Tab */}
            {selectedTab === 'competitors' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Top Competitors</h4>
                {competitors.length > 0 ? (
                  <div className="space-y-3">
                    {competitors.map((competitor, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 font-bold rounded-full w-8 h-8 flex items-center justify-center">
                            #{competitor.position}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{competitor.domain}</div>
                            <a
                              href={competitor.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {competitor.url.substring(0, 50)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {competitor.domainRating}
                          </div>
                          <div className="text-xs text-gray-600">Domain Rating</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No competitor data available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
