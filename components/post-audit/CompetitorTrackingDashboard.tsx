'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Plus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface CompetitorSnapshot {
  id: string;
  competitor_name: string;
  competitor_website: string;
  snapshot_date: string;
  visibility_score: number;
  local_pack_position: number;
  review_count: number;
  avg_rating: number;
  domain_authority: number;
  backlink_count: number;
  data_source: string;
}

interface CompetitorTrackingDashboardProps {
  companyId: string;
}

export function CompetitorTrackingDashboard({ companyId }: CompetitorTrackingDashboardProps) {
  const [snapshots, setSnapshots] = useState<CompetitorSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadSnapshots();
    }
  }, [companyId]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/post-audit/competitor-tracking?company_id=${companyId}&limit=50`);
      const data = await res.json();
      setSnapshots(data.snapshots || []);
    } catch (error) {
      console.error('Failed to load competitor snapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSnapshots();
    setRefreshing(false);
  };

  // Group snapshots by competitor
  const competitorGroups = snapshots.reduce((acc, snapshot) => {
    const name = snapshot.competitor_name;
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(snapshot);
    return acc;
  }, {} as Record<string, CompetitorSnapshot[]>);

  // Get latest snapshot for each competitor
  const latestSnapshots = Object.entries(competitorGroups).map(([name, snaps]) => {
    const sorted = snaps.sort((a, b) =>
      new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    );
    return sorted[0];
  });

  // Calculate trend for each competitor
  const competitorTrends = Object.entries(competitorGroups).map(([name, snaps]) => {
    const sorted = snaps.sort((a, b) =>
      new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    );

    const latest = sorted[0];
    const previous = sorted[1];

    let visibilityTrend = 0;
    let positionTrend = 0;

    if (previous) {
      visibilityTrend = latest.visibility_score - previous.visibility_score;
      positionTrend = previous.local_pack_position - latest.local_pack_position; // Lower is better
    }

    return {
      name,
      latest,
      previous,
      visibilityTrend,
      positionTrend,
      snapshotCount: sorted.length,
    };
  });

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (latestSnapshots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Competitor Data Yet
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-md mb-6">
            Start tracking your competitors to monitor their SEO performance, rankings, and visibility over time.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Competitor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Competitor Tracking</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring {latestSnapshots.length} competitors with {snapshots.length} total snapshots
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Competitor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitorTrends.map((competitor) => (
          <Card key={competitor.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">
                    {competitor.name}
                  </CardTitle>
                  {competitor.latest.competitor_website && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <a
                        href={competitor.latest.competitor_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        {competitor.latest.competitor_website.replace('https://', '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </CardDescription>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {competitor.snapshotCount} snapshots
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Visibility Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Visibility Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {competitor.latest.visibility_score?.toFixed(1) || 'N/A'}
                  </span>
                  {competitor.previous && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(competitor.visibilityTrend)}
                      <span className={`text-xs font-medium ${getTrendColor(competitor.visibilityTrend)}`}>
                        {Math.abs(competitor.visibilityTrend).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Local Pack Position */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Local Pack</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    #{competitor.latest.local_pack_position || 'N/A'}
                  </span>
                  {competitor.previous && competitor.positionTrend !== 0 && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(competitor.positionTrend)}
                      <span className={`text-xs font-medium ${getTrendColor(competitor.positionTrend)}`}>
                        {Math.abs(competitor.positionTrend)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews */}
              {competitor.latest.review_count !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reviews</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {competitor.latest.review_count}
                    </span>
                    {competitor.latest.avg_rating && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {competitor.latest.avg_rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Domain Authority */}
              {competitor.latest.domain_authority !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Domain Authority</span>
                  <span className="text-sm font-medium text-gray-900">
                    {competitor.latest.domain_authority}/100
                  </span>
                </div>
              )}

              {/* Backlinks */}
              {competitor.latest.backlink_count !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Backlinks</span>
                  <span className="text-sm font-medium text-gray-900">
                    {competitor.latest.backlink_count.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Last Updated */}
              <div className="pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Last updated: {new Date(competitor.latest.snapshot_date).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
