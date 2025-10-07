'use client';

/**
 * Autonomous SEO Monitoring Dashboard
 *
 * Real-time dashboard for monitoring the autonomous SEO agent:
 * - Agent operational status
 * - Active monitoring schedules
 * - Recent audit results
 * - Unresolved alerts
 * - Performance metrics
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Pause,
  Play,
  Plus,
  TrendingDown,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AgentStatus {
  agent_status: 'running' | 'stopped' | 'error' | 'paused';
  companies_monitored: number;
  active_cron_jobs: number;
  last_health_check?: string;
  total_audits_run: number;
  total_reports_generated: number;
  audits_last_24h: number;
  started_at?: string;
}

interface Schedule {
  company_id: string;
  company_name: string;
  website: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  next_run: string;
  last_run?: string;
  active: boolean;
  last_score?: number;
  last_audit_date?: string;
  audits_this_week: number;
}

interface Alert {
  id: string;
  company_id: string;
  company_name: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  rule_name: string;
  created_at: string;
  acknowledged: boolean;
}

interface AuditResult {
  id: string;
  company_id: string;
  company_name: string;
  website: string;
  overall_score: number;
  lighthouse_overall: number;
  eeat_overall: number;
  audit_type: string;
  created_at: string;
}

export default function SEOMonitorPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    company_id: '',
    company_name: '',
    website: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly'
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, schedulesRes, alertsRes, auditsRes] = await Promise.all([
        fetch('/api/agents/autonomous-seo?action=status'),
        fetch('/api/agents/autonomous-seo?action=schedules'),
        fetch('/api/agents/autonomous-seo?action=alerts'),
        fetch('/api/agents/autonomous-seo?action=recent-audits&limit=10')
      ]);

      const [statusData, schedulesData, alertsData, auditsData] = await Promise.all([
        statusRes.json(),
        schedulesRes.json(),
        alertsRes.json(),
        auditsRes.json()
      ]);

      setStatus(statusData.status);
      setSchedules(schedulesData.schedules || []);
      setAlerts(alertsData.alerts || []);
      setRecentAudits(auditsData.audits || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartStop = async () => {
    setActionLoading(true);
    try {
      const action = status?.agent_status === 'running' ? 'stop' : 'start';
      const response = await fetch('/api/agents/autonomous-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message
        });
        await loadData();
      } else {
        throw new Error(data.error || 'Failed to control agent');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.company_id || !newSchedule.company_name || !newSchedule.website) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/agents/autonomous-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-schedule',
          ...newSchedule
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message
        });
        setAddDialogOpen(false);
        setNewSchedule({
          company_id: '',
          company_name: '',
          website: '',
          frequency: 'daily'
        });
        await loadData();
      } else {
        throw new Error(data.error || 'Failed to add schedule');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveSchedule = async (companyId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/agents/autonomous-seo?type=schedule&id=${companyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message
        });
        await loadData();
      } else {
        throw new Error(data.error || 'Failed to remove schedule');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500">Good</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">Fair</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  const isRunning = status?.agent_status === 'running';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Autonomous SEO Monitoring</h1>
          <p className="text-muted-foreground">24/7 automated SEO audits, rankings, and reports</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Monitoring Schedule</DialogTitle>
                <DialogDescription>
                  Add a company to autonomous SEO monitoring
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="company_id">Company ID</Label>
                  <Input
                    id="company_id"
                    value={newSchedule.company_id}
                    onChange={e => setNewSchedule({ ...newSchedule, company_id: e.target.value })}
                    placeholder="company_123"
                  />
                </div>
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={newSchedule.company_name}
                    onChange={e => setNewSchedule({ ...newSchedule, company_name: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={newSchedule.website}
                    onChange={e => setNewSchedule({ ...newSchedule, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newSchedule.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                      setNewSchedule({ ...newSchedule, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSchedule} disabled={actionLoading}>
                  Add Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleStartStop}
            disabled={actionLoading}
            variant={isRunning ? 'destructive' : 'default'}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Agent
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Agent
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
            {isRunning ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{status?.agent_status || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              {status?.started_at ? `Started ${new Date(status.started_at).toLocaleString()}` : 'Not running'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies Monitored</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.companies_monitored || 0}</div>
            <p className="text-xs text-muted-foreground">
              {status?.active_cron_jobs || 0} active cron jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.total_audits_run || 0}</div>
            <p className="text-xs text-muted-foreground">
              {status?.audits_last_24h || 0} in last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.total_reports_generated || 0}</div>
            <p className="text-xs text-muted-foreground">Weekly reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Unresolved Alerts
            </CardTitle>
            <CardDescription>Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityBadge(alert.severity)}
                      <span className="font-medium">{alert.company_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.rule_name} • {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monitoring Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Monitoring Schedules</CardTitle>
          <CardDescription>Companies being monitored 24/7</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No companies being monitored</p>
              <p className="text-sm">Click "Add Schedule" to start monitoring</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map(schedule => (
                <div
                  key={schedule.company_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{schedule.company_name}</h3>
                      <Badge variant="outline" className="capitalize">
                        {schedule.frequency}
                      </Badge>
                      {schedule.last_score !== undefined && getScoreBadge(schedule.last_score)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{schedule.website}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Next run: {new Date(schedule.next_run).toLocaleString()}</span>
                      {schedule.last_run && (
                        <span>Last run: {new Date(schedule.last_run).toLocaleString()}</span>
                      )}
                      <span>{schedule.audits_this_week} audits this week</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSchedule(schedule.company_id)}
                    disabled={actionLoading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Audits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Results</CardTitle>
          <CardDescription>Latest SEO audit scores</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAudits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent audits</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAudits.map(audit => (
                <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{audit.company_name}</span>
                      {getScoreBadge(audit.overall_score)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Overall: {audit.overall_score}</span>
                      <span>Lighthouse: {audit.lighthouse_overall}</span>
                      <span>E-E-A-T: {audit.eeat_overall}</span>
                      <span>{new Date(audit.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
