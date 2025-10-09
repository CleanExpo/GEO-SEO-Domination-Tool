'use client';

/**
 * Bytebot Task Viewer Component
 *
 * Displays live view of Bytebot task execution with:
 * - Task status and progress
 * - Live desktop screenshot
 * - Execution logs
 * - Task metadata
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Monitor,
  Play,
  Pause,
  X,
  RefreshCw,
  Download,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BytebotTaskViewerProps {
  taskId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  showDesktopView?: boolean;
  showLogs?: boolean;
  onTaskComplete?: (result: any) => void;
}

interface TaskData {
  id: string;
  description: string;
  priority: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
  logs?: string[];
}

export function BytebotTaskViewer({
  taskId,
  autoRefresh = true,
  refreshInterval = 2000,
  showDesktopView = true,
  showLogs = true,
  onTaskComplete
}: BytebotTaskViewerProps) {
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotTimestamp, setScreenshotTimestamp] = useState(Date.now());

  // Fetch task data
  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/bytebot/tasks/${taskId}`);
      if (!response.ok) throw new Error('Failed to fetch task');

      const data = await response.json();
      setTask(data);

      // If task completed, call callback
      if (
        (data.status === 'COMPLETED' || data.status === 'FAILED') &&
        onTaskComplete &&
        task?.status === 'RUNNING'
      ) {
        onTaskComplete(data);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh task status
  useEffect(() => {
    fetchTask();

    if (!autoRefresh) return;

    const interval = setInterval(fetchTask, refreshInterval);
    return () => clearInterval(interval);
  }, [taskId, autoRefresh, refreshInterval]);

  // Auto-refresh screenshot
  useEffect(() => {
    if (!showDesktopView || !task || task.status !== 'RUNNING') return;

    setScreenshotUrl(`/api/bytebot/tasks/${taskId}/screenshot?t=${screenshotTimestamp}`);

    const interval = setInterval(() => {
      setScreenshotTimestamp(Date.now());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [taskId, showDesktopView, task?.status, refreshInterval]);

  // Cancel task
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this task?')) return;

    try {
      await fetch(`/api/bytebot/tasks/${taskId}`, { method: 'DELETE' });
      await fetchTask();
    } catch (err: any) {
      setError(`Failed to cancel task: ${err.message}`);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500';
      case 'FAILED':
        return 'bg-red-500';
      case 'CANCELLED':
        return 'bg-gray-500';
      case 'RUNNING':
        return 'bg-blue-500 animate-pulse';
      case 'PENDING':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5" />;
      case 'CANCELLED':
        return <X className="h-5 w-5" />;
      case 'RUNNING':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'PENDING':
        return <Clock className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading task data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !task) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertDescription>{error || 'Task not found'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Task Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  Bytebot Task
                </CardTitle>
                <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                <Badge variant="outline">{task.priority}</Badge>
              </div>
              <CardDescription className="line-clamp-2">{task.description}</CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchTask}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {task.status === 'RUNNING' && (
                <Button variant="destructive" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Created: {new Date(task.createdAt).toLocaleString()}
            </div>
            {task.startedAt && (
              <div>Started: {new Date(task.startedAt).toLocaleString()}</div>
            )}
            {task.completedAt && (
              <div>Completed: {new Date(task.completedAt).toLocaleString()}</div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Task Content */}
      <Tabs defaultValue="desktop" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="desktop">
            <Monitor className="h-4 w-4 mr-2" />
            Desktop View
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="result">
            <Eye className="h-4 w-4 mr-2" />
            Result
          </TabsTrigger>
        </TabsList>

        {/* Desktop View Tab */}
        <TabsContent value="desktop">
          <Card>
            <CardHeader>
              <CardTitle>Live Desktop View</CardTitle>
              <CardDescription>
                {task.status === 'RUNNING'
                  ? 'Watching Bytebot work in real-time'
                  : 'Latest desktop screenshot'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showDesktopView && task.status !== 'PENDING' ? (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <img
                    src={screenshotUrl}
                    alt="Bytebot desktop"
                    className="w-full h-full object-contain"
                    onError={() => setScreenshotUrl('/placeholder-desktop.png')}
                  />
                  {task.status === 'RUNNING' && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-red-500 animate-pulse">● LIVE</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-4" />
                    <p>Task not started yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>Task execution history and debug information</CardDescription>
            </CardHeader>
            <CardContent>
              {task.logs && task.logs.length > 0 ? (
                <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg max-h-[500px] overflow-y-auto">
                  {task.logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>No logs available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result">
          <Card>
            <CardHeader>
              <CardTitle>Task Result</CardTitle>
              <CardDescription>
                {task.status === 'COMPLETED'
                  ? 'Task completed successfully'
                  : task.status === 'FAILED'
                  ? 'Task failed with error'
                  : 'Waiting for task completion...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {task.status === 'COMPLETED' && task.result ? (
                <div className="space-y-4">
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
                    {JSON.stringify(task.result, null, 2)}
                  </pre>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download Result
                  </Button>
                </div>
              ) : task.status === 'FAILED' && task.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{task.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                  <p>Task is still running...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
