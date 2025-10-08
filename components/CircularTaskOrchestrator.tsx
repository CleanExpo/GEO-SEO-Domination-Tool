/**
 * Circular Task Orchestrator
 * Visual representation of autonomous tasks as rotating cogs in a circle
 * Active tasks spin, completed tasks are green, pending are gray
 */

'use client';

import { useEffect, useState } from 'react';
import { Settings, CheckCircle2, Clock, Zap, FileText, Share2, Newspaper, Search, TrendingUp } from 'lucide-react';

export interface TaskNode {
  id: string;
  type: 'seo_audit' | 'blog_post' | 'social_post' | 'research_paper' | 'gmb_post' | 'white_paper';
  status: 'scheduled' | 'executing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: string;
  config?: Record<string, any>;
}

interface CircularTaskOrchestratorProps {
  tasks: TaskNode[];
  subscriptionTier: string;
  monthlySpend: number;
  onTaskClick?: (task: TaskNode) => void;
}

/**
 * Main Circular Task Orchestrator Component
 */
export default function CircularTaskOrchestrator({
  tasks,
  subscriptionTier,
  monthlySpend,
  onTaskClick
}: CircularTaskOrchestratorProps) {
  const [rotation, setRotation] = useState(0);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Rotate active tasks continuously
  useEffect(() => {
    const hasActiveTasks = tasks.some(t => t.status === 'executing');
    if (!hasActiveTasks) return;

    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 50); // Smooth rotation

    return () => clearInterval(interval);
  }, [tasks]);

  // Group tasks by type for distribution
  const tasksByType = tasks.reduce((acc, task) => {
    if (!acc[task.type]) acc[task.type] = [];
    acc[task.type].push(task);
    return acc;
  }, {} as Record<string, TaskNode[]>);

  // Calculate positions for task nodes in a circle
  const calculateNodePositions = (): Array<{
    task: TaskNode;
    x: number;
    y: number;
    angle: number;
    icon: any;
    color: string;
    label: string;
  }> => {
    const centerX = 300;
    const centerY = 300;
    const radius = 200;
    const totalTasks = tasks.length;

    const iconMap: Record<string, any> = {
      seo_audit: Search,
      blog_post: FileText,
      social_post: Share2,
      research_paper: Newspaper,
      gmb_post: TrendingUp,
      white_paper: FileText
    };

    const colorMap: Record<string, string> = {
      seo_audit: '#3b82f6',    // Blue
      blog_post: '#10b981',    // Green
      social_post: '#8b5cf6',  // Purple
      research_paper: '#f59e0b', // Amber
      gmb_post: '#ec4899',     // Pink
      white_paper: '#06b6d4'   // Cyan
    };

    const labelMap: Record<string, string> = {
      seo_audit: 'SEO Audit',
      blog_post: 'Blog Post',
      social_post: 'Social',
      research_paper: 'Research',
      gmb_post: 'GMB',
      white_paper: 'White Paper'
    };

    return tasks.map((task, index) => {
      const angle = (index / totalTasks) * 360;
      const radians = (angle * Math.PI) / 180;

      const x = centerX + radius * Math.cos(radians);
      const y = centerY + radius * Math.sin(radians);

      return {
        task,
        x,
        y,
        angle,
        icon: iconMap[task.type] || Settings,
        color: colorMap[task.type] || '#6b7280',
        label: labelMap[task.type] || task.type
      };
    });
  };

  const nodes = calculateNodePositions();

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10b981'; // Green
      case 'executing': return '#f59e0b'; // Orange
      case 'failed': return '#ef4444';    // Red
      default: return '#6b7280';          // Gray
    }
  };

  // Get stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    executing: tasks.filter(t => t.status === 'executing').length,
    scheduled: tasks.filter(t => t.status === 'scheduled').length,
    failed: tasks.filter(t => t.status === 'failed').length
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header Stats */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <div>
          <h2 className="text-2xl font-bold text-white">{subscriptionTier} Plan</h2>
          <p className="text-emerald-400 font-semibold">${monthlySpend.toLocaleString()}/month</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">{completionRate.toFixed(0)}%</div>
            <div className="text-sm text-gray-400">Complete</div>
          </div>
        </div>
      </div>

      {/* SVG Canvas for Circular Visualization */}
      <svg
        width="600"
        height="600"
        viewBox="0 0 600 600"
        className="relative z-0"
        style={{ filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))' }}
      >
        {/* Center Circle (Master Orchestrator) */}
        <g>
          <circle
            cx="300"
            cy="300"
            r="80"
            fill="url(#centerGradient)"
            stroke="#10b981"
            strokeWidth="3"
            className="drop-shadow-2xl"
          />
          <defs>
            <radialGradient id="centerGradient">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </radialGradient>
          </defs>

          {/* Center Icon - Rotating if tasks are executing */}
          <g transform={`translate(300, 300) rotate(${stats.executing > 0 ? rotation : 0})`}>
            <Settings
              x="-24"
              y="-24"
              width="48"
              height="48"
              stroke="#fff"
              fill="none"
              strokeWidth="2"
            />
          </g>

          {/* Center Text */}
          <text
            x="300"
            y="400"
            textAnchor="middle"
            fill="#fff"
            fontSize="16"
            fontWeight="600"
          >
            Autopilot
          </text>
          <text
            x="300"
            y="420"
            textAnchor="middle"
            fill="#10b981"
            fontSize="14"
          >
            {stats.executing > 0 ? 'Running' : 'Idle'}
          </text>
        </g>

        {/* Connection Lines */}
        {nodes.map((node, i) => (
          <line
            key={`line-${i}`}
            x1="300"
            y1="300"
            x2={node.x}
            y2={node.y}
            stroke={node.task.status === 'executing' ? node.color : '#374151'}
            strokeWidth={node.task.status === 'executing' ? '2' : '1'}
            strokeDasharray={node.task.status === 'scheduled' ? '5,5' : '0'}
            opacity="0.4"
          />
        ))}

        {/* Task Nodes */}
        {nodes.map((node, i) => {
          const Icon = node.icon;
          const isExecuting = node.task.status === 'executing';
          const isHovered = hoveredTask === node.task.id;

          return (
            <g
              key={node.task.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer transition-all"
              onClick={() => onTaskClick?.(node.task)}
              onMouseEnter={() => setHoveredTask(node.task.id)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              {/* Outer Ring (Status Indicator) */}
              <circle
                r={isHovered ? '42' : '38'}
                fill="none"
                stroke={getStatusColor(node.task.status)}
                strokeWidth={isHovered ? '3' : '2'}
                className="transition-all"
              />

              {/* Inner Circle (Task Icon Background) */}
              <circle
                r="32"
                fill={node.color}
                opacity={node.task.status === 'completed' ? '1' : '0.8'}
                className="transition-all"
              />

              {/* Task Icon - Rotates if executing */}
              <g transform={`rotate(${isExecuting ? rotation * 2 : 0})`}>
                <Icon
                  x="-16"
                  y="-16"
                  width="32"
                  height="32"
                  stroke="#fff"
                  fill="none"
                  strokeWidth="2"
                />
              </g>

              {/* Status Badge */}
              {node.task.status === 'completed' && (
                <g transform="translate(20, -20)">
                  <circle r="10" fill="#10b981" />
                  <CheckCircle2 x="-6" y="-6" width="12" height="12" stroke="#fff" fill="none" strokeWidth="2" />
                </g>
              )}

              {node.task.status === 'executing' && (
                <g transform="translate(20, -20)">
                  <circle r="10" fill="#f59e0b" />
                  <Zap x="-6" y="-6" width="12" height="12" stroke="#fff" fill="none" strokeWidth="2" />
                </g>
              )}

              {/* Task Label */}
              <text
                y="50"
                textAnchor="middle"
                fill="#fff"
                fontSize="12"
                fontWeight="500"
                className="pointer-events-none"
              >
                {node.label}
              </text>

              {/* Task Count for Same Type */}
              {tasksByType[node.task.type] && tasksByType[node.task.type].length > 1 && (
                <text
                  y="65"
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  ({tasksByType[node.task.type].length})
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Task Details Panel (Hovered Task) */}
      {hoveredTask && (
        <div className="absolute bottom-6 left-6 right-6 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700 z-10">
          {(() => {
            const task = tasks.find(t => t.id === hoveredTask);
            if (!task) return null;

            const node = nodes.find(n => n.task.id === hoveredTask);

            return (
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg`} style={{ backgroundColor: node?.color }}>
                  {node && <node.icon className="w-6 h-6 text-white" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{node?.label}</h3>
                  <p className="text-gray-400 text-sm">
                    Scheduled: {new Date(task.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white`}
                        style={{ backgroundColor: getStatusColor(task.status) }}>
                    {task.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-orange-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  } text-white`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 space-y-2 z-10">
        <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Status</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-sm text-gray-300">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-sm text-gray-300">Executing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-300">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-300">Failed</span>
        </div>
      </div>
    </div>
  );
}
