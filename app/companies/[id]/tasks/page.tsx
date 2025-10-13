'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  XCircle,
  Filter,
  Search,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  RotateCcw,
  FileText,
  TrendingUp,
  Zap,
  Target,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Type Definitions
// ============================================================================

interface AgentTask {
  id: string;
  company_id: string;
  audit_id: string | null;
  task_type: string;
  category: 'content' | 'performance' | 'seo' | 'accessibility' | 'security' | 'ux' | 'technical';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'requires_review' | 'rolled_back' | 'cancelled';
  page_url: string | null;
  instructions: any;
  estimated_time_seconds: number;
  actual_time_seconds: number | null;
  success: boolean | null;
  error_message: string | null;
  before_snapshot: string | null;
  after_snapshot: string | null;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface TaskExecutionLog {
  id: string;
  task_id: string;
  timestamp: string;
  log_level: 'debug' | 'info' | 'warning' | 'error' | 'success';
  message: string;
  step_number: number | null;
  progress_pct: number | null;
}

interface Company {
  id: string;
  name: string;
  website: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function TaskManagementPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded task (for viewing logs)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<Record<string, TaskExecutionLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({});

  // Executing tasks
  const [executingTasks, setExecutingTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCompany();
    fetchTasks();
  }, [companyId]);

  useEffect(() => {
    applyFilters();
  }, [tasks, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      const data = await response.json();
      setCompany(data.company);
    } catch (error) {
      console.error('Failed to fetch company:', error);
      setError(error instanceof Error ? error.message : 'Failed to load company data');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agent-tasks?company_id=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskLogs = async (taskId: string) => {
    if (taskLogs[taskId]) {
      // Already fetched
      return;
    }

    setLoadingLogs(prev => ({ ...prev, [taskId]: true }));

    try {
      const response = await fetch(`/api/agent-tasks/${taskId}/logs`);
      if (!response.ok) {
        // Logs endpoint might not exist, that's okay
        setTaskLogs(prev => ({ ...prev, [taskId]: [] }));
        return;
      }

      const data = await response.json();
      setTaskLogs(prev => ({ ...prev, [taskId]: data.logs || [] }));
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setTaskLogs(prev => ({ ...prev, [taskId]: [] }));
    } finally {
      setLoadingLogs(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // ============================================================================
  // Filtering
  // ============================================================================

  const applyFilters = () => {
    let filtered = [...tasks];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.task_type.toLowerCase().includes(query) ||
        task.page_url?.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  // ============================================================================
  // Task Actions
  // ============================================================================

  const executeTask = async (taskId: string) => {
    setExecutingTasks(prev => ({ ...prev, [taskId]: true }));
    setError(null);

    try {
      const response = await fetch(`/api/agent-tasks/${taskId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute task');
      }

      const result = await response.json();

      // Refresh tasks
      await fetchTasks();

      // Show success message (you could use a toast notification here)
      alert(`Task executed successfully!\nExecution time: ${result.execution_time_seconds}s`);
    } catch (error) {
      console.error('Failed to execute task:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute task');
    } finally {
      setExecutingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const approveTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/agent-tasks/${taskId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve task');

      await fetchTasks();
    } catch (error) {
      console.error('Failed to approve task:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve task');
    }
  };

  const rejectTask = async (taskId: string, reason: string) => {
    try {
      const response = await fetch(`/api/agent-tasks/${taskId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to reject task');

      await fetchTasks();
    } catch (error) {
      console.error('Failed to reject task:', error);
      setError(error instanceof Error ? error.message : 'Failed to reject task');
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      fetchTaskLogs(taskId);
    }
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-600" />;
      case 'requires_review':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'requires_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'seo':
        return <Target className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTaskType = (taskType: string) => {
    return taskType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // ============================================================================
  // Summary Statistics
  // ============================================================================

  const totalTasks = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg text-gray-700">Loading tasks...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/companies/${companyId}`} className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Company Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-8 w-8" />
            SEO Improvement Tasks: {company?.name}
          </h1>
          <p className="text-gray-600 mt-2">Manage and execute automated SEO fixes</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-400">
            <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-500">
            <div className="text-2xl font-bold text-gray-700">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-700">{completedCount}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-700">{failedCount}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="requires_review">Requires Review</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="content">Content</option>
              <option value="performance">Performance</option>
              <option value="seo">SEO</option>
              <option value="accessibility">Accessibility</option>
              <option value="security">Security</option>
              <option value="ux">UX</option>
              <option value="technical">Technical</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">
                {tasks.length === 0
                  ? 'No tasks have been generated yet. Run a comprehensive audit to generate tasks.'
                  : 'No tasks match your current filters.'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Task Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleTaskExpanded(task.id)}
                          className="text-gray-600 hover:text-gray-900 transition"
                        >
                          {expandedTaskId === task.id ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>

                        {getStatusIcon(task.status)}

                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatTaskType(task.task_type)}
                        </h3>

                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                          {task.status.toUpperCase().replace('_', ' ')}
                        </span>

                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>

                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 flex items-center gap-1">
                          {getCategoryIcon(task.category)}
                          {task.category}
                        </span>
                      </div>

                      {task.page_url && (
                        <p className="text-sm text-gray-600 ml-8">
                          <span className="font-medium">Page:</span> {task.page_url}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 ml-8 text-sm text-gray-600">
                        <span>
                          <span className="font-medium">Est. Time:</span> {formatDuration(task.estimated_time_seconds)}
                        </span>
                        {task.actual_time_seconds && (
                          <span>
                            <span className="font-medium">Actual Time:</span> {formatDuration(task.actual_time_seconds)}
                          </span>
                        )}
                        <span>
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {task.status === 'pending' && !task.requires_approval && (
                        <button
                          onClick={() => executeTask(task.id)}
                          disabled={executingTasks[task.id]}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center gap-2"
                        >
                          {executingTasks[task.id] ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Execute
                            </>
                          )}
                        </button>
                      )}

                      {task.status === 'pending' && task.requires_approval && !task.approved_by && (
                        <>
                          <button
                            onClick={() => approveTask(task.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) rejectTask(task.id, reason);
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </>
                      )}

                      {(task.before_snapshot || task.after_snapshot) && (
                        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View Changes
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {task.error_message && (
                    <div className="mt-4 ml-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <p className="font-medium">Error</p>
                      <p className="text-sm">{task.error_message}</p>
                    </div>
                  )}
                </div>

                {/* Expanded Section: Logs & Details */}
                {expandedTaskId === task.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Task Details</h4>

                    {/* Instructions */}
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Instructions</h5>
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(task.instructions, null, 2)}
                      </pre>
                    </div>

                    {/* Execution Logs */}
                    {loadingLogs[task.id] ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading logs...
                      </div>
                    ) : taskLogs[task.id] && taskLogs[task.id].length > 0 ? (
                      <div className="bg-white rounded-lg p-4">
                        <h5 className="font-medium text-gray-700 mb-2">Execution Logs</h5>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {taskLogs[task.id].map((log, idx) => (
                            <div
                              key={idx}
                              className={`text-sm p-2 rounded ${
                                log.log_level === 'error'
                                  ? 'bg-red-50 text-red-700'
                                  : log.log_level === 'warning'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : log.log_level === 'success'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{log.message}</span>
                                {log.progress_pct !== null && (
                                  <span className="text-xs">{log.progress_pct}%</span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No execution logs available</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
