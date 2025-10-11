'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Award,
  Zap,
  Clock,
  Target,
  BarChart3,
  ListChecks,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface ComprehensiveAudit {
  overallScore: number;
  categoryScores: {
    technical: number;
    onPage: number;
    content: number;
    userExperience: number;
    localSEO: number;
  };
  analysis: {
    technical: CategoryAnalysis;
    onPage: CategoryAnalysis;
    content: CategoryAnalysis;
    userExperience: CategoryAnalysis;
    localSEO: CategoryAnalysis;
  };
  actionableTasks: Task[];
  estimatedImpact: {
    trafficIncrease: string;
    timeToResults: string;
    difficultyLevel: 'Easy' | 'Medium' | 'Hard';
  };
}

interface CategoryAnalysis {
  score: number;
  points: AnalysisPoint[];
}

interface AnalysisPoint {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  value: any;
  recommendation?: string;
}

interface Task {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  task: string;
  impact: number;
  effort: 'Quick' | 'Moderate' | 'Extensive';
  estimatedTime: string;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

export default function ComprehensiveAuditPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [audit, setAudit] = useState<ComprehensiveAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchCompany();
    fetchLatestAudit();
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      const data = await response.json();
      setCompany(data.company);
    } catch (err) {
      console.error('Failed to fetch company:', err);
      setError('Failed to load company data');
    }
  };

  const fetchLatestAudit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audits/117-point?company_id=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch audit');
      const data = await response.json();

      if (data.audits && data.audits.length > 0) {
        // Parse the latest audit from metadata
        const latestAudit = data.audits[0];
        if (latestAudit.metadata) {
          // Reconstruct audit object from database format
          setAudit({
            overallScore: latestAudit.overall_score,
            categoryScores: latestAudit.metadata.category_scores,
            analysis: {
              technical: { score: 0, points: [] }, // We'll need to fetch full data separately
              onPage: { score: 0, points: [] },
              content: { score: 0, points: [] },
              userExperience: { score: 0, points: [] },
              localSEO: { score: 0, points: [] },
            },
            actionableTasks: latestAudit.metadata.actionable_tasks || [],
            estimatedImpact: latestAudit.metadata.estimated_impact || {
              trafficIncrease: 'Unknown',
              timeToResults: 'Unknown',
              difficultyLevel: 'Medium',
            },
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const runComprehensiveAudit = async () => {
    if (!company?.website) return;

    try {
      setRunning(true);
      setError(null);

      const response = await fetch('/api/audits/117-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          url: company.website,
          include_local_seo: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Audit failed');
      }

      const data = await response.json();
      setAudit(data.audit);
    } catch (err: any) {
      console.error('Audit failed:', err);
      setError(err.message || 'Failed to run comprehensive audit');
    } finally {
      setRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredTasks = selectedCategory === 'all'
    ? audit?.actionableTasks || []
    : audit?.actionableTasks.filter(t => t.category.toLowerCase() === selectedCategory.toLowerCase()) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/companies" className="hover:text-emerald-600">Companies</Link>
          <span>/</span>
          <Link href={`/companies/${companyId}`} className="hover:text-emerald-600">
            {company?.name || 'Company'}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">117-Point SEO Audit</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Award className="w-8 h-8 text-emerald-600" />
              117-Point SEO Analysis
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive SEO audit covering 117 analysis points across 5 categories
            </p>
          </div>

          <button
            onClick={runComprehensiveAudit}
            disabled={running || !company?.website}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {running ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Running Analysis...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run New Audit
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : !audit ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audit Data Yet</h3>
          <p className="text-gray-600 mb-6">
            Run your first comprehensive 117-point SEO audit to get started
          </p>
          <button
            onClick={runComprehensiveAudit}
            disabled={!company?.website}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Run Comprehensive Audit
          </button>
        </div>
      ) : (
        <>
          {/* Overall Score Card */}
          <div className={`p-8 rounded-xl border-2 mb-8 ${getScoreBgColor(audit.overallScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-700 mb-1">Overall SEO Score</h2>
                <div className={`text-6xl font-bold ${getScoreColor(audit.overallScore)}`}>
                  {audit.overallScore}/100
                </div>
                <p className="text-gray-600 mt-2">
                  {audit.overallScore >= 80 && 'Excellent! Your SEO is in great shape.'}
                  {audit.overallScore >= 60 && audit.overallScore < 80 && 'Good start, but room for improvement.'}
                  {audit.overallScore < 60 && 'Needs work. Follow the recommendations below.'}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Estimated Impact</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mb-1">
                  {audit.estimatedImpact.trafficIncrease}
                </div>
                <p className="text-sm text-gray-600">traffic increase potential</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {audit.estimatedImpact.timeToResults} to see results
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Target className="w-4 h-4" />
                  {audit.estimatedImpact.difficultyLevel} difficulty
                </div>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {Object.entries(audit.categoryScores).map(([category, score]) => (
              <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {category === 'onPage' ? 'On-Page' : category === 'userExperience' ? 'UX' : category === 'localSEO' ? 'Local SEO' : category}
                  </span>
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                </div>
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(score)}`}>
                  {score}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Actionable Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ListChecks className="w-6 h-6 text-emerald-600" />
                Prioritized Action Plan
              </h2>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Categories</option>
                <option value="technical">Technical</option>
                <option value="onpage">On-Page</option>
                <option value="content">Content</option>
                <option value="ux">User Experience</option>
                <option value="local">Local SEO</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No tasks in this category</p>
              ) : (
                filteredTasks.map((task, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border flex items-start gap-4 ${getPriorityColor(task.priority)}`}
                  >
                    <div className="flex-shrink-0">
                      {task.priority === 'Critical' && <AlertTriangle className="w-5 h-5" />}
                      {task.priority === 'High' && <Zap className="w-5 h-5" />}
                      {task.priority === 'Medium' && <CheckCircle className="w-5 h-5" />}
                      {task.priority === 'Low' && <CheckCircle className="w-5 h-5" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{task.priority}</span>
                        <span className="text-xs px-2 py-1 bg-white/50 rounded">
                          {task.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{task.task}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Impact: {task.impact}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.effort} effort
                        </span>
                        <span>{task.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
