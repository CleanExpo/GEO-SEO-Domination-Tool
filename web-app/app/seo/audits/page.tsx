'use client';

/**
 * SEO Audit Tools - CRM UI
 *
 * One-click SEO audits powered by custom MCP server
 * - Technical SEO
 * - Performance (Core Web Vitals)
 * - Mobile Friendliness
 * - E-E-A-T Score
 * - Schema Validation
 * - Accessibility (WCAG)
 * - Security
 */

import { useState } from 'react';
import {
  Shield,
  Zap,
  Smartphone,
  Award,
  Code,
  Eye,
  Lock,
  Play,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface AuditResult {
  url: string;
  timestamp: string;
  score: number;
  grade: string;
  issues?: string[];
  warnings?: string[];
  successes?: string[];
  recommendations?: string[];
  metrics?: any;
  checks?: any;
  breakdown?: any;
  summary?: string;
  assessment?: string;
}

type AuditType = 'technical' | 'performance' | 'mobile' | 'eeat' | 'schema' | 'accessibility' | 'security';

export default function SEOAuditsPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState<AuditType | null>(null);
  const [results, setResults] = useState<Record<AuditType, AuditResult | null>>({
    technical: null,
    performance: null,
    mobile: null,
    eeat: null,
    schema: null,
    accessibility: null,
    security: null,
  });

  const audits = [
    {
      id: 'technical' as AuditType,
      name: 'Technical SEO',
      icon: Shield,
      color: 'emerald',
      description: 'HTTPS, robots.txt, meta tags, headers',
    },
    {
      id: 'performance' as AuditType,
      name: 'Performance',
      icon: Zap,
      color: 'yellow',
      description: 'Core Web Vitals, page speed',
    },
    {
      id: 'mobile' as AuditType,
      name: 'Mobile',
      icon: Smartphone,
      color: 'blue',
      description: 'Mobile-friendliness, responsiveness',
    },
    {
      id: 'eeat' as AuditType,
      name: 'E-E-A-T',
      icon: Award,
      color: 'purple',
      description: 'Experience, Expertise, Authority, Trust',
    },
    {
      id: 'schema' as AuditType,
      name: 'Schema',
      icon: Code,
      color: 'indigo',
      description: 'Structured data validation',
    },
    {
      id: 'accessibility' as AuditType,
      name: 'Accessibility',
      icon: Eye,
      color: 'pink',
      description: 'WCAG compliance, alt text',
    },
    {
      id: 'security' as AuditType,
      name: 'Security',
      icon: Lock,
      color: 'red',
      description: 'HTTPS, headers, best practices',
    },
  ];

  const runAudit = async (type: AuditType) => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    setLoading(type);

    try {
      const response = await fetch('/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type }),
      });

      if (response.ok) {
        const result = await response.json();
        setResults((prev) => ({ ...prev, [type]: result }));
      } else {
        alert('Audit failed. Please check the URL and try again.');
      }
    } catch (error) {
      console.error('Audit error:', error);
      alert('Audit failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const runAllAudits = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    for (const audit of audits) {
      await runAudit(audit.id);
      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `seo-audit-${url.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Audit Tools</h1>
          <p className="text-gray-600">
            One-click comprehensive SEO audits powered by custom MCP server
          </p>
        </div>

        {/* URL Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={runAllAudits}
                disabled={!url || loading !== null}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                Run All Audits
              </button>
              <button
                onClick={exportResults}
                disabled={!Object.values(results).some((r) => r !== null)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Audit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {audits.map((audit) => {
            const Icon = audit.icon;
            const result = results[audit.id];
            const isLoading = loading === audit.id;

            return (
              <div
                key={audit.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${audit.color}-100`}>
                      <Icon className={`h-6 w-6 text-${audit.color}-600`} />
                    </div>
                    {result && (
                      <div className={`px-3 py-1 rounded-full font-bold ${getGradeColor(result.grade)}`}>
                        {result.grade}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{audit.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{audit.description}</p>

                  {result && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Score</span>
                        <span className="text-lg font-bold text-gray-900">{result.score}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            result.score >= 80
                              ? 'bg-green-500'
                              : result.score >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${result.score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => runAudit(audit.id)}
                    disabled={!url || isLoading}
                    className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      isLoading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : `bg-${audit.color}-600 text-white hover:bg-${audit.color}-700`
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run Audit
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Results Section */}
        {Object.values(results).some((r) => r !== null) && (
          <div className="space-y-6">
            {audits.map((audit) => {
              const result = results[audit.id];
              if (!result) return null;

              return (
                <div key={audit.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <audit.icon className={`h-6 w-6 text-${audit.color}-600`} />
                        <h2 className="text-xl font-bold text-gray-900">{audit.name} Results</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-full font-bold ${getGradeColor(result.grade)}`}>
                          {result.grade} ({result.score}/100)
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Summary/Assessment */}
                    {(result.summary || result.assessment) && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-900 font-medium">
                          {result.summary || result.assessment}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Issues */}
                      {result.issues && result.issues.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-2 text-lg font-semibold text-red-900 mb-3">
                            <XCircle className="h-5 w-5" />
                            Issues ({result.issues.length})
                          </h3>
                          <ul className="space-y-2">
                            {result.issues.map((issue, idx) => (
                              <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Warnings */}
                      {result.warnings && result.warnings.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-2 text-lg font-semibold text-yellow-900 mb-3">
                            <AlertTriangle className="h-5 w-5" />
                            Warnings ({result.warnings.length})
                          </h3>
                          <ul className="space-y-2">
                            {result.warnings.map((warning, idx) => (
                              <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                                <span className="text-yellow-500 mt-1">•</span>
                                <span>{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Successes */}
                      {result.successes && result.successes.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-2 text-lg font-semibold text-green-900 mb-3">
                            <CheckCircle className="h-5 w-5" />
                            Passed Checks ({result.successes.length})
                          </h3>
                          <ul className="space-y-2">
                            {result.successes.map((success, idx) => (
                              <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                <span>{success}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900 mb-3">
                            <AlertCircle className="h-5 w-5" />
                            Recommendations ({result.recommendations.length})
                          </h3>
                          <ul className="space-y-2">
                            {result.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Metrics (Performance) */}
                    {result.metrics && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Metrics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {Object.entries(result.metrics).map(([key, metric]: [string, any]) => (
                            <div key={key} className="p-4 bg-gray-50 rounded-lg">
                              <div className="text-xs text-gray-600 uppercase mb-1">{key}</div>
                              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                              <div
                                className={`text-xs mt-1 ${
                                  metric.rating === 'good' ? 'text-green-600' : 'text-yellow-600'
                                }`}
                              >
                                {metric.rating}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-E-A-T Breakdown */}
                    {result.breakdown && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">E-E-A-T Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(result.breakdown).map(([key, value]) => (
                            <div key={key} className="p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 capitalize mb-1">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-sm text-gray-600">{value as string}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
