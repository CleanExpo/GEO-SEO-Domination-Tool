'use client';

/**
 * Agent Dashboard
 * Monitor and manage autonomous SDK agents
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  FileText,
  UserPlus
} from 'lucide-react';

interface Agent {
  name: string;
  description: string;
  status: { name: string; running: boolean };
  capabilities: string[];
}

interface PoolStats {
  registeredAgents: number;
  queuedTasks: number;
  runningTasks: number;
  completedTasks: number;
  availableSlots: number;
}

interface AgentTask {
  id: string;
  agent_name: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: any;
  error?: string;
}

export default function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
    const interval = setInterval(loadAgentData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadAgentData = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();

      if (data.success) {
        setAgents(data.agents);
        setPoolStats(data.pool_stats);
      }
    } catch (error) {
      console.error('Failed to load agent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const queueTask = async (agentName: string, input: string) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: agentName,
          input,
          priority: 'medium'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Task queued! Task ID: ${data.task_id}`);
        loadAgentData();
      }
    } catch (error) {
      console.error('Failed to queue task:', error);
    }
  };

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'seo-audit': return <TrendingUp className="w-5 h-5" />;
      case 'content-generation': return <FileText className="w-5 h-5" />;
      case 'client-onboarding': return <UserPlus className="w-5 h-5" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      queued: { variant: 'secondary', icon: <Clock className="w-3 h-3 mr-1" /> },
      running: { variant: 'default', icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" /> },
      completed: { variant: 'outline', icon: <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> },
      failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3 mr-1" /> },
      cancelled: { variant: 'outline', icon: <Square className="w-3 h-3 mr-1" /> }
    };

    const config = variants[status] || variants.queued;

    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="w-8 h-8" />
          Autonomous Agents
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage AI agents working in the background
        </p>
      </div>

      {/* Pool Statistics */}
      {poolStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Registered Agents</div>
            <div className="text-2xl font-bold">{poolStats.registeredAgents}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Queued Tasks</div>
            <div className="text-2xl font-bold text-yellow-500">{poolStats.queuedTasks}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Running Tasks</div>
            <div className="text-2xl font-bold text-blue-500">{poolStats.runningTasks}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Completed Tasks</div>
            <div className="text-2xl font-bold text-green-500">{poolStats.completedTasks}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Available Slots</div>
            <div className="text-2xl font-bold">{poolStats.availableSlots}</div>
          </Card>
        </div>
      )}

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.name} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  {getAgentIcon(agent.name)}
                </div>
                <div>
                  <h3 className="font-semibold capitalize">
                    {agent.name.replace('-', ' ')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                </div>
              </div>
              {agent.status.running && (
                <Badge variant="default">Running</Badge>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium">Capabilities:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {agent.capabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {cap}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => {
                const input = prompt(`Enter task for ${agent.name}:`);
                if (input) {
                  queueTask(agent.name, input);
                }
              }}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Queue Task
            </Button>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => queueTask('seo-audit', 'Run comprehensive SEO audit for https://example.com')}
            variant="outline"
            className="justify-start"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Run SEO Audit
          </Button>
          <Button
            onClick={() => queueTask('content-generation', 'Generate 5 blog post ideas about home renovation')}
            variant="outline"
            className="justify-start"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Content
          </Button>
          <Button
            onClick={() => queueTask('client-onboarding', 'Onboard new client: ABC Plumbing, industry: home services')}
            variant="outline"
            className="justify-start"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Onboard Client
          </Button>
        </div>
      </Card>

      {/* Recent Tasks (if implemented) */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Tasks</h2>
        <div className="text-center text-muted-foreground py-8">
          Task history will appear here once agents start processing tasks
        </div>
      </Card>
    </div>
  );
}
