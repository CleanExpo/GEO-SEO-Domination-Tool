'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="p-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
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
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Campaign Performance</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-3xl font-bold text-gray-900">$24,747.01</p>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  +12% vs last month
                </Badge>
              </div>
              <CardDescription className="text-sm mt-1">29 Sept, 2024</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <Badge variant={positive ? "default" : "destructive"} className={positive ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
            {positive ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {positive ? '+' : ''}{change}%
          </Badge>
        </div>
      </CardContent>
    </Card>
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
    <Link href={href}>
      <Card className="hover:shadow-md transition-all transform hover:scale-105 group cursor-pointer">
        <CardHeader>
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl mb-2 group-hover:scale-110 transition-transform`} />
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
