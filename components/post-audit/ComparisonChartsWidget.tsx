'use client';

import { useState, useEffect } from 'react';
import { LineChart, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CompetitorSnapshot {
  id: string;
  competitor_name: string;
  snapshot_date: string;
  visibility_score: number;
  local_pack_position: number;
}

interface ComparisonChartsWidgetProps {
  companyId: string;
}

export function ComparisonChartsWidget({ companyId }: ComparisonChartsWidgetProps) {
  const [snapshots, setSnapshots] = useState<CompetitorSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [selectedMetric, setSelectedMetric] = useState<'visibility' | 'position'>('visibility');

  useEffect(() => {
    if (companyId) {
      loadSnapshots();
    }
  }, [companyId, timeRange]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/post-audit/competitor-tracking?company_id=${companyId}&limit=200`);
      const data = await res.json();
      setSnapshots(data.snapshots || []);
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter snapshots by time range
  const filteredSnapshots = snapshots.filter((snapshot) => {
    const snapshotDate = new Date(snapshot.snapshot_date);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
    return snapshotDate >= cutoffDate;
  });

  // Group by date for time series
  const snapshotsByDate = filteredSnapshots.reduce((acc, snapshot) => {
    const date = new Date(snapshot.snapshot_date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(snapshot);
    return acc;
  }, {} as Record<string, CompetitorSnapshot[]>);

  // Prepare data for visibility score chart
  const visibilityChartData = Object.entries(snapshotsByDate).map(([date, snaps]) => {
    const dataPoint: any = { date };

    // Get unique competitors
    const competitors = [...new Set(snaps.map((s) => s.competitor_name))];

    competitors.forEach((competitor) => {
      const competitorSnaps = snaps.filter((s) => s.competitor_name === competitor);
      const avgScore =
        competitorSnaps.reduce((sum, s) => sum + (s.visibility_score || 0), 0) /
        competitorSnaps.length;
      dataPoint[competitor] = avgScore.toFixed(1);
    });

    return dataPoint;
  });

  // Prepare data for position chart
  const positionChartData = Object.entries(snapshotsByDate).map(([date, snaps]) => {
    const dataPoint: any = { date };

    const competitors = [...new Set(snaps.map((s) => s.competitor_name))];

    competitors.forEach((competitor) => {
      const competitorSnaps = snaps.filter((s) => s.competitor_name === competitor);
      const avgPosition =
        competitorSnaps.reduce((sum, s) => sum + (s.local_pack_position || 0), 0) /
        competitorSnaps.length;
      dataPoint[competitor] = avgPosition.toFixed(1);
    });

    return dataPoint;
  });

  // Get unique competitors for chart legend
  const competitors = [...new Set(filteredSnapshots.map((s) => s.competitor_name))];

  // Colors for each competitor
  const colors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  // Calculate summary statistics
  const summaryStats = competitors.map((competitor, index) => {
    const competitorSnaps = filteredSnapshots.filter((s) => s.competitor_name === competitor);

    const avgVisibility =
      competitorSnaps.reduce((sum, s) => sum + (s.visibility_score || 0), 0) /
      competitorSnaps.length;

    const avgPosition =
      competitorSnaps.reduce((sum, s) => sum + (s.local_pack_position || 0), 0) /
      competitorSnaps.length;

    // Calculate trends
    const sortedSnaps = competitorSnaps.sort(
      (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );

    const firstSnap = sortedSnaps[0];
    const lastSnap = sortedSnaps[sortedSnaps.length - 1];

    const visibilityTrend =
      firstSnap && lastSnap ? lastSnap.visibility_score - firstSnap.visibility_score : 0;

    const positionTrend =
      firstSnap && lastSnap
        ? firstSnap.local_pack_position - lastSnap.local_pack_position
        : 0; // Lower position is better

    return {
      name: competitor,
      avgVisibility: avgVisibility.toFixed(1),
      avgPosition: avgPosition.toFixed(1),
      visibilityTrend: visibilityTrend.toFixed(1),
      positionTrend: positionTrend.toFixed(1),
      color: colors[index % colors.length],
      snapshotCount: competitorSnaps.length,
    };
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (filteredSnapshots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Comparison Data</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Add competitor snapshots to see comparison charts and trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comparison Charts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Comparing {competitors.length} competitors over {timeRange} days
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryStats.map((stat) => (
          <Card key={stat.name} className="border-l-4" style={{ borderLeftColor: stat.color }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <CardDescription className="text-xs">
                {stat.snapshotCount} data points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Avg Visibility</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{stat.avgVisibility}</span>
                  <span
                    className={`text-xs ${
                      parseFloat(stat.visibilityTrend) > 0
                        ? 'text-green-600'
                        : parseFloat(stat.visibilityTrend) < 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {parseFloat(stat.visibilityTrend) > 0 ? '+' : ''}
                    {stat.visibilityTrend}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Avg Position</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">#{stat.avgPosition}</span>
                  <span
                    className={`text-xs ${
                      parseFloat(stat.positionTrend) > 0
                        ? 'text-green-600'
                        : parseFloat(stat.positionTrend) < 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {parseFloat(stat.positionTrend) > 0 ? '+' : ''}
                    {stat.positionTrend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="visibility" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visibility">
            <TrendingUp className="w-4 h-4 mr-2" />
            Visibility Score
          </TabsTrigger>
          <TabsTrigger value="position">
            <BarChart3 className="w-4 h-4 mr-2" />
            Local Pack Position
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visibility">
          <Card>
            <CardHeader>
              <CardTitle>Visibility Score Over Time</CardTitle>
              <CardDescription>
                Track how competitor visibility scores change over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={visibilityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  {competitors.map((competitor, index) => (
                    <Line
                      key={competitor}
                      type="monotone"
                      dataKey={competitor}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="position">
          <Card>
            <CardHeader>
              <CardTitle>Local Pack Position Over Time</CardTitle>
              <CardDescription>
                Track competitor positions in Google Local Pack (lower is better)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={positionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[1, 10]} reversed />
                  <Tooltip />
                  <Legend />
                  {competitors.map((competitor, index) => (
                    <Line
                      key={competitor}
                      type="monotone"
                      dataKey={competitor}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
