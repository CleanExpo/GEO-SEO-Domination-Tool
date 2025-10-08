'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CircularTaskOrchestrator, { TaskNode } from '@/components/CircularTaskOrchestrator';
import {
  Calendar,
  TrendingUp,
  Pause,
  Play,
  Settings,
  Download,
  BarChart3,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

interface SubscriptionData {
  id: number;
  companyName: string;
  tierName: string;
  monthlySpend: number;
  status: string;
  autopilotStatus: string;
  quotas: {
    seoAudits: number;
    blogPosts: number;
    socialPosts: number;
    researchPapers: number;
    gmbPosts: number;
  };
  used: {
    seoAudits: number;
    blogPosts: number;
    socialPosts: number;
    researchPapers: number;
    gmbPosts: number;
  };
}

export default function ClientAutopilotDashboard() {
  const params = useParams();
  const companyId = params.id as string;

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [tasks, setTasks] = useState<TaskNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskNode | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
    fetchTasks();
  }, [companyId]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch(`/api/clients/${companyId}/subscription`);
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/clients/${companyId}/tasks`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handlePauseResume = async () => {
    if (!subscription) return;

    const action = subscription.autopilotStatus === 'active' ? 'pause' : 'resume';

    try {
      const response = await fetch(`/api/clients/${companyId}/autopilot/${action}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        fetchSubscriptionData();
        alert(`Autopilot ${action}d successfully`);
      }
    } catch (error) {
      console.error(`Failed to ${action} autopilot:`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-16 h-16 text-emerald-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading autopilot dashboard...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Subscription Found</h2>
          <p className="text-gray-400 mb-6">
            This company doesn't have an active subscription. Set one up to enable autopilot mode.
          </p>
          <button
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition"
            onClick={() => window.location.href = `/clients/${companyId}/subscribe`}
          >
            Create Subscription
          </button>
        </div>
      </div>
    );
  }

  const completionRate = (subscription.used.blogPosts / subscription.quotas.blogPosts) * 100;
  const totalTasks = Object.values(subscription.quotas).reduce((a, b) => a + b, 0);
  const totalCompleted = Object.values(subscription.used).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{subscription.companyName}</h1>
              <p className="text-emerald-400 text-lg mt-1">
                {subscription.tierName} Plan · ${subscription.monthlySpend.toLocaleString()}/month
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePauseResume}
                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
                  subscription.autopilotStatus === 'active'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {subscription.autopilotStatus === 'active' ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause Autopilot
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Resume Autopilot
                  </>
                )}
              </button>
              <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold flex items-center gap-2 transition">
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Tasks</span>
              <Calendar className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold">{totalTasks}</div>
            <div className="text-sm text-gray-500 mt-1">this month</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">{totalCompleted}</div>
            <div className="text-sm text-gray-500 mt-1">{((totalCompleted / totalTasks) * 100).toFixed(0)}% complete</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">In Progress</span>
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-400">
              {tasks.filter(t => t.status === 'executing').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">running now</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Avg Quality</span>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-400">87</div>
            <div className="text-sm text-gray-500 mt-1">RULER score</div>
          </div>
        </div>

        {/* Main Grid: Circular Visualizer + Task Details */}
        <div className="grid grid-cols-3 gap-6">
          {/* Circular Task Orchestrator */}
          <div className="col-span-2 h-[700px]">
            <CircularTaskOrchestrator
              tasks={tasks}
              subscriptionTier={subscription.tierName}
              monthlySpend={subscription.monthlySpend}
              onTaskClick={setSelectedTask}
            />
          </div>

          {/* Right Sidebar: Task Quotas & Progress */}
          <div className="space-y-6">
            {/* Quota Progress */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Monthly Quotas
              </h3>

              <div className="space-y-4">
                {/* SEO Audits */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">SEO Audits</span>
                    <span className="text-emerald-400 font-semibold">
                      {subscription.used.seoAudits}/{subscription.quotas.seoAudits}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(subscription.used.seoAudits / subscription.quotas.seoAudits) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Blog Posts */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Blog Posts</span>
                    <span className="text-emerald-400 font-semibold">
                      {subscription.used.blogPosts}/{subscription.quotas.blogPosts}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(subscription.used.blogPosts / subscription.quotas.blogPosts) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Social Posts */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Social Posts</span>
                    <span className="text-emerald-400 font-semibold">
                      {subscription.used.socialPosts}/{subscription.quotas.socialPosts}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${(subscription.used.socialPosts / subscription.quotas.socialPosts) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Research Papers */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Research Papers</span>
                    <span className="text-emerald-400 font-semibold">
                      {subscription.used.researchPapers}/{subscription.quotas.researchPapers}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(subscription.used.researchPapers / subscription.quotas.researchPapers) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* GMB Posts */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">GMB Posts</span>
                    <span className="text-emerald-400 font-semibold">
                      {subscription.used.gmbPosts}/{subscription.quotas.gmbPosts}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${(subscription.used.gmbPosts / subscription.quotas.gmbPosts) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Upcoming This Week
              </h3>

              <div className="space-y-3">
                {tasks
                  .filter(t => t.status === 'scheduled')
                  .slice(0, 5)
                  .map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div>
                        <div className="text-sm font-medium text-white capitalize">
                          {task.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(task.scheduledDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Task Details Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full p-8 border border-slate-700">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold capitalize">{selectedTask.type.replace('_', ' ')}</h2>
                  <p className="text-gray-400 mt-1">
                    Scheduled: {new Date(selectedTask.scheduledDate).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className={`px-4 py-2 rounded-lg font-medium ${
                    selectedTask.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    selectedTask.status === 'executing' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedTask.status}
                  </span>
                  <span className={`px-4 py-2 rounded-lg font-medium ${
                    selectedTask.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    selectedTask.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    selectedTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedTask.priority} priority
                  </span>
                </div>

                {selectedTask.config && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Configuration</h3>
                    <pre className="text-sm text-gray-300 overflow-auto">
                      {JSON.stringify(selectedTask.config, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition">
                    View Details
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
