'use client';

import { useState } from 'react';
import { Search, Plus, AlertCircle, CheckCircle, XCircle, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AuditResult {
  id: string;
  companyName: string;
  url: string;
  date: string;
  score: number;
  issues: {
    critical: number;
    warnings: number;
    passed: number;
  };
  status: 'completed' | 'in-progress' | 'failed';
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditResult[]>([]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SEO Audits</h1>
            <p className="text-gray-600 mt-1">Comprehensive website SEO analysis and recommendations</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="h-5 w-5" />
            New Audit
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Search className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{audits.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {audits.reduce((sum, a) => sum + a.issues.critical, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {audits.reduce((sum, a) => sum + a.issues.warnings, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Passed Checks</p>
              <p className="text-2xl font-bold text-gray-900">
                {audits.reduce((sum, a) => sum + a.issues.passed, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audits List */}
      <div className="space-y-4">
        {audits.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Search className="h-16 w-16 text-gray-300" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No SEO audits yet</h3>
                <p className="text-gray-600 mb-6">
                  Start analyzing your website's SEO performance by running your first audit.
                </p>
                <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto">
                  <Plus className="h-5 w-5" />
                  Run Your First Audit
                </button>
              </div>
            </div>
          </div>
        ) : (
          audits.map((audit) => (
            <div
              key={audit.id}
              className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{audit.companyName}</h3>
                    <a
                      href={audit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      {audit.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Audited on {new Date(audit.date).toLocaleDateString()}
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-600">Critical</p>
                        <p className="text-lg font-semibold text-gray-900">{audit.issues.critical}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-xs text-gray-600">Warnings</p>
                        <p className="text-lg font-semibold text-gray-900">{audit.issues.warnings}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-600">Passed</p>
                        <p className="text-lg font-semibold text-gray-900">{audit.issues.passed}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex flex-col items-center gap-2">
                  <div className={`w-24 h-24 rounded-full ${getScoreBgColor(audit.score)} flex items-center justify-center`}>
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${getScoreColor(audit.score)}`}>{audit.score}</p>
                      <p className="text-xs text-gray-600">Score</p>
                    </div>
                  </div>
                  <Link
                    href={`/companies/${audit.id}/seo-audit`}
                    className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    View Details
                    <TrendingUp className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
