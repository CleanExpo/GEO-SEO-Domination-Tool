'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Pause, Trash2, Plus, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { ScheduleDialog } from '@/components/ScheduleDialog';

interface ScheduledJob {
  id: string;
  job_type: string;
  name: string;
  description: string;
  schedule: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  config: {
    keywords?: string[];
    search_engine?: string;
    location?: string;
  };
  created_at: string;
}

interface JobExecution {
  id: string;
  status: 'success' | 'failed' | 'running';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error: string | null;
}

export default function SchedulePage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scheduled-jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async (jobId: string) => {
    try {
      const res = await fetch(`/api/scheduled-jobs/${jobId}`);
      const data = await res.json();
      setSelectedJob(data.job);
      setExecutions(data.executions || []);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/scheduled-jobs/\${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to toggle job status:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled job?')) return;

    try {
      await fetch(`/api/scheduled-jobs/\${jobId}`, {
        method: 'DELETE',
      });
      fetchJobs();
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
        setExecutions([]);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const getScheduleDescription = (schedule: string) => {
    const scheduleMap: Record<string, string> = {
      '0 9 * * *': 'Daily at 9:00 AM',
      '0 0 * * 0': 'Weekly on Sunday',
      '0 0 1 * *': 'Monthly on the 1st',
      '0 * * * *': 'Every hour',
    };
    return scheduleMap[schedule] || schedule;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center gap-1">
        <Pause className="h-3 w-3" />
        Paused
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-emerald-600" />
              Scheduled Jobs
            </h1>
            <p className="text-gray-600 mt-1">Automate ranking checks and SEO audits</p>
          </div>
          <button
            onClick={() => {
              setEditingJob(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Schedules</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading schedules...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled jobs yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first scheduled ranking check to automate SEO monitoring
              </p>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Create Schedule
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => fetchJobDetails(job.id)}
                className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedJob?.id === job.id
                    ? 'border-emerald-500 shadow-lg'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.name}</h3>
                    <p className="text-sm text-gray-600">{job.description}</p>
                  </div>
                  {getStatusBadge(job.is_active)}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getScheduleDescription(job.schedule)}
                  </div>
                </div>

                {job.config.keywords && job.config.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.config.keywords.slice(0, 3).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                    {job.config.keywords.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{job.config.keywords.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleJobStatus(job.id, job.is_active);
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    {job.is_active ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingJob(job);
                      setIsDialogOpen(true);
                    }}
                    className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteJob(job.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Job Details & Execution History */}
        <div className="space-y-4">
          {selectedJob ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Schedule</label>
                    <p className="text-gray-900">{getScheduleDescription(selectedJob.schedule)}</p>
                    <p className="text-xs text-gray-500 font-mono">{selectedJob.schedule}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Run</label>
                    <p className="text-gray-900">
                      {selectedJob.last_run_at
                        ? new Date(selectedJob.last_run_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Next Run</label>
                    <p className="text-gray-900">
                      {selectedJob.next_run_at
                        ? new Date(selectedJob.next_run_at).toLocaleString()
                        : 'Not scheduled'}
                    </p>
                  </div>

                  {selectedJob.config.search_engine && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Search Engine</label>
                      <p className="text-gray-900 capitalize">{selectedJob.config.search_engine}</p>
                    </div>
                  )}

                  {selectedJob.config.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Location</label>
                      <p className="text-gray-900">{selectedJob.config.location}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Execution History
                </h2>

                {executions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No executions yet</p>
                ) : (
                  <div className="space-y-2">
                    {executions.map((execution) => (
                      <div
                        key={execution.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {execution.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : execution.status === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(execution.started_at).toLocaleString()}
                            </p>
                            {execution.duration_ms && (
                              <p className="text-xs text-gray-500">{execution.duration_ms}ms</p>
                            )}
                            {execution.error && (
                              <p className="text-xs text-red-600">{execution.error}</p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            execution.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : execution.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {execution.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a job to view details and execution history</p>
            </div>
          )}
        </div>
      </div>

      <ScheduleDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingJob(null);
        }}
        onSuccess={() => {
          fetchJobs();
          setIsDialogOpen(false);
          setEditingJob(null);
        }}
        job={editingJob}
      />
    </div>
  );
}
