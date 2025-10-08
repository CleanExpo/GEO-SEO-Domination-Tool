'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Mic,
  Paperclip,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  workflow_id: string;
  priority: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function TaskInboxPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [executing, setExecuting] = useState<number | null>(null);

  // Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [workflow, setWorkflow] = useState('content-opportunity-discovery');
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // TODO: Create list endpoint
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!taskTitle.trim() || !taskDescription.trim()) {
      alert('Please provide a title and description');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          workflow,
          priority
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Task created! ID: ${data.task.id}`);
        setTaskTitle('');
        setTaskDescription('');
        fetchTasks();

        // Auto-execute
        if (window.confirm('Execute task now?')) {
          executeTask(data.task.id);
        }
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const executeTask = async (taskId: number) => {
    setExecuting(taskId);
    try {
      const response = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });

      const data = await response.json();

      if (data.success) {
        alert('Task executed successfully!');
        fetchTasks();
      } else {
        alert(`Execution failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Task Inbox</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-full">AUTONOMOUS</span>
          </div>
          <p className="text-gray-600">
            Submit tasks and watch autonomous agents work in real-time
          </p>
        </div>

        {/* Create Task Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Find content opportunities for water damage niche"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe what you want the agents to do..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                disabled={creating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workflow</label>
                <select
                  value={workflow}
                  onChange={(e) => setWorkflow(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  disabled={creating}
                >
                  <option value="content-opportunity-discovery">Content Opportunity Discovery</option>
                  <option value="automated-research">Automated Research</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  disabled={creating}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={createTask}
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create & Execute
                  </>
                )}
              </button>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Mic className="w-4 h-4" />
                Voice Input
              </button>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Paperclip className="w-4 h-4" />
                Attach Files
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600">Create your first autonomous task above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'queued' && <Clock className="w-5 h-5 text-gray-400" />}
                      {task.status === 'in_progress' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                      {task.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {task.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(task.created_at).toLocaleString()}
                    </div>
                    {task.status === 'queued' && (
                      <button
                        onClick={() => executeTask(task.id)}
                        disabled={executing === task.id}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300"
                      >
                        {executing === task.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Execute
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
