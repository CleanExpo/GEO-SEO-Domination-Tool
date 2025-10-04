'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  totalCompanies: number;
  totalAudits: number;
  totalKeywords: number;
  totalRankings: number;
  avgSeoScore: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    totalAudits: 0,
    totalKeywords: 0,
    totalRankings: 0,
    avgSeoScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const companiesRes = await fetch('/api/companies');
      const companiesData = await companiesRes.json();
      const companiesList = companiesData.companies || [];

      const auditsRes = await fetch('/api/seo-audits');
      const auditsData = await auditsRes.json();
      const auditsList = auditsData.audits || [];

      const keywordsRes = await fetch('/api/keywords');
      const keywordsData = await keywordsRes.json();
      const keywordsList = keywordsData.keywords || [];

      const rankingsRes = await fetch('/api/rankings');
      const rankingsData = await rankingsRes.json();
      const rankingsList = rankingsData.rankings || [];

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

  const chartData = [
    { month: 'Jan', value: 70 },
    { month: 'Feb', value: 87 },
    { month: 'Mar', value: 34 },
    { month: 'Apr', value: 28 },
    { month: 'May', value: 39 },
    { month: 'Jun', value: 80 },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome, Let's dive into your personalized setup guide.</p>
      </div>

      {/* Performance Metrics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Performance Over Time</h2>
            <p className="text-sm text-gray-500">29 Sept, 2024</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Companies"
            value={stats.totalCompanies.toLocaleString()}
            change={+10.2}
            positive
          />
          <MetricCard
            label="Audits"
            value={stats.totalAudits.toLocaleString()}
            change={-6.09}
            positive={false}
          />
          <MetricCard
            label="Keywords"
            value={stats.totalKeywords.toLocaleString()}
            change={+6.01}
            positive
          />
          <MetricCard
            label="Avg Score"
            value={stats.avgSeoScore.toString()}
            change={+6.01}
            positive
          />
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Campaign Performance</h2>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-3xl font-bold text-gray-900">$24,747.01</p>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                +12% vs last month
              </span>
            </div>
            <p className="text-sm text-gray-500">29 Sept, 2024</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Bar dataKey="value" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          title="Run SEO Audit"
          description="Analyze your website's SEO performance"
          href="/companies"
          color="blue"
        />
        <ActionCard
          title="Track Keywords"
          description="Monitor keyword rankings and trends"
          href="/companies"
          color="emerald"
        />
        <ActionCard
          title="Generate Report"
          description="Create comprehensive SEO reports"
          href="/reports"
          color="purple"
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: number;
  positive: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <div className={`flex items-center gap-1 text-sm font-medium ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
          {positive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <span>{positive ? '+' : ''}{change}%</span>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: 'blue' | 'emerald' | 'purple';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-pink-500',
  };

  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl mb-4`} />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}
