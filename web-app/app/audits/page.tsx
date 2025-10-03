'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, AlertCircle, CheckCircle, XCircle, TrendingUp, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AuditDialog } from '@/components/AuditDialog';

interface AuditResult {
  id: string;
  company_id: string;
  url: string;
  audit_date: string;
  seo_score: number;
  critical_issues: any[];
  warnings: any[];
  recommendations: any[];
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seo-audits');
      const data = await res.json();
      setAudits(data.audits || []);
    } catch (err) {
      console.error('Failed to fetch audits:', err);
    } finally {
      setLoading(false);
    }
  };

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
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
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
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '-' : audits.length}
              </p>
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
                {loading ? '-' : audits.reduce((sum, a) => sum + (a.critical_issues?.length || 0), 0)}
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
                {loading ? '-' : audits.reduce((sum, a) => sum + (a.warnings?.length || 0), 0)}
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
              <p className="text-sm text-gray-600">Recommendations</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '-' : audits.reduce((sum, a) => sum + (a.recommendations?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audits List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : audits.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Search className="h-16 w-16 text-gray-300" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No SEO audits yet</h3>
                <p className="text-gray-600 mb-6">
                  Start analyzing your website's SEO performance by running your first audit.
                </p>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
                >
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
                    <h3 className="text-xl font-semibold text-gray-900">SEO Audit</h3>
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
                    Audited on {new Date(audit.audit_date).toLocaleDateString()}
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-600">Critical</p>
                        <p className="text-lg font-semibold text-gray-900">{audit.critical_issues?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-xs text-gray-600">Warnings</p>
                        <p className="text-lg font-semibold text-gray-900">{audit.warnings?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-600">Recommendations</p>
                        <p className="text-lg font-semibold text-gray-900">{audit.recommendations?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex flex-col items-center gap-2">
                  <div className={`w-24 h-24 rounded-full ${getScoreBgColor(audit.seo_score || 0)} flex items-center justify-center`}>
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${getScoreColor(audit.seo_score || 0)}`}>{audit.seo_score || 0}</p>
                      <p className="text-xs text-gray-600">Score</p>
                    </div>
                  </div>
                  <Link
                    href={`/companies/${audit.company_id}/seo-audit`}
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

      <AuditDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => fetchAudits()}
      />
    </div>
  );
}
