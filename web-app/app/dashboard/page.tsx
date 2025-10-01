'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, FileText, Search, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Stats {
  totalCompanies: number;
  totalAudits: number;
  totalKeywords: number;
  totalRankings: number;
  avgSeoScore: number;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

interface RecentAudit {
  id: string;
  company_id: string;
  url: string;
  score: number;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    totalAudits: 0,
    totalKeywords: 0,
    totalRankings: 0,
    avgSeoScore: 0,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch companies
      const companiesRes = await fetch('/api/companies');
      const companiesData = await companiesRes.json();
      const companiesList = companiesData.companies || [];
      setCompanies(companiesList);

      // Fetch audits
      const auditsRes = await fetch('/api/seo-audits');
      const auditsData = await auditsRes.json();
      const auditsList = auditsData.audits || [];
      setRecentAudits(auditsList.slice(0, 5));

      // Fetch keywords
      const keywordsRes = await fetch('/api/keywords');
      const keywordsData = await keywordsRes.json();
      const keywordsList = keywordsData.keywords || [];

      // Fetch rankings
      const rankingsRes = await fetch('/api/rankings');
      const rankingsData = await rankingsRes.json();
      const rankingsList = rankingsData.rankings || [];

      // Calculate average SEO score
      const avgScore =
        auditsList.length > 0
          ? Math.round(
              auditsList.reduce((sum: number, audit: any) => sum + audit.score, 0) / auditsList.length
            )
          : 0;

      setStats({
        totalCompanies: companiesList.length,
        totalAudits: auditsList.length,
        totalKeywords: keywordsList.length,
        totalRankings: rankingsList.length,
        avgSeoScore: avgScore,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = recentAudits.map((audit) => ({
    date: new Date(audit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: audit.score,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your SEO performance and activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Companies</h3>
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">SEO Audits</h3>
              <Search className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAudits}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Keywords</h3>
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalKeywords}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Rankings</h3>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRankings}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg SEO Score</h3>
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.avgSeoScore}</p>
          </div>
        </div>

        {/* Recent Audits Chart */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent SEO Scores</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/companies"
              className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-center font-medium"
            >
              <Building2 className="h-6 w-6 mx-auto mb-2" />
              Add Company
            </Link>
            <Link
              href="/companies"
              className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-center font-medium"
            >
              <Search className="h-6 w-6 mx-auto mb-2" />
              Run SEO Audit
            </Link>
            <Link
              href="/reports"
              className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-center font-medium"
            >
              <FileText className="h-6 w-6 mx-auto mb-2" />
              Generate Report
            </Link>
            <Link
              href="/companies"
              className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-center font-medium"
            >
              <BarChart3 className="h-6 w-6 mx-auto mb-2" />
              Track Rankings
            </Link>
          </div>
        </div>

        {/* Companies List */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Companies</h2>
            <Link href="/companies" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {companies.slice(0, 3).map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}/seo-audit`}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{company.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{company.website}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No companies yet</p>
              <Link
                href="/companies"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Add Your First Company
              </Link>
            </div>
          )}
        </div>

        {/* Recent Audits */}
        {recentAudits.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Recent SEO Audits</h2>
            <div className="space-y-3">
              {recentAudits.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{audit.url}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(audit.created_at).toLocaleDateString()} at{' '}
                      {new Date(audit.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{audit.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
