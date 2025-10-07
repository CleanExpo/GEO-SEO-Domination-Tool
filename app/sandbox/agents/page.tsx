'use client'

import { useState } from 'react'
import { Bot, Sparkles, Zap, Code, MessageSquare, Play, Pause, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Agent {
  id: string
  name: string
  description: string
  status: 'idle' | 'running' | 'paused'
  icon: typeof Bot
  color: string
}

const availableAgents: Agent[] = [
  {
    id: 'claude-code-max',
    name: 'Claude Code Max',
    description: 'Advanced coding assistant with extended context and reasoning',
    status: 'idle',
    icon: Bot,
    color: 'emerald',
  },
  {
    id: 'gpt-5-codex',
    name: 'GPT-5 Codex',
    description: 'OpenAI\'s latest code generation model with cloud execution',
    status: 'idle',
    icon: Sparkles,
    color: 'blue',
  },
  {
    id: 'cursor-composer',
    name: 'Cursor Composer',
    description: 'Multi-file editing with intelligent code understanding',
    status: 'idle',
    icon: Code,
    color: 'purple',
  },
  {
    id: 'gemini-2',
    name: 'Google Gemini 2.0',
    description: 'Multi-modal AI with advanced reasoning capabilities',
    status: 'idle',
    icon: Zap,
    color: 'orange',
  },
  {
    id: 'opencode-engine',
    name: 'OpenCode Engine',
    description: 'Open-source code generation and optimization',
    status: 'idle',
    icon: MessageSquare,
    color: 'cyan',
  },
]

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(availableAgents)

  const toggleAgent = (id: string) => {
    setAgents(agents.map(agent => {
      if (agent.id === id) {
        return {
          ...agent,
          status: agent.status === 'running' ? 'paused' : 'running'
        }
      }
      return agent
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-full">NEW</span>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Autonomous AI agents for code generation, optimization, and deployment
          </p>
        </div>

        {/* Status Banner */}
        <Card className="mb-6 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                  🚀 AI Agent System
                </h3>
                <p className="text-emerald-700 dark:text-emerald-300">
                  Manage multiple AI agents working in parallel on your codebase
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-3 rounded-lg bg-${agent.color}-100 dark:bg-${agent.color}-900/30`}>
                      <Icon className={`h-6 w-6 text-${agent.color}-600 dark:text-${agent.color}-400`} />
                    </div>
                    <div className={`px-2 py-1 text-xs font-semibold rounded ${
                      agent.status === 'running'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {agent.status === 'running' ? 'Active' : 'Idle'}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => toggleAgent(agent.id)}
                    className="w-full gap-2"
                    variant={agent.status === 'running' ? 'outline' : 'default'}
                  >
                    {agent.status === 'running' ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause Agent
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Start Agent
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About AI Agents</CardTitle>
            <CardDescription>
              Learn how to use autonomous AI agents for development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">🤖 Autonomous Operation</h4>
              <p className="text-sm text-muted-foreground">
                AI agents work independently on assigned tasks, making decisions and executing code changes without constant supervision.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔄 Parallel Execution</h4>
              <p className="text-sm text-muted-foreground">
                Run multiple agents simultaneously on different parts of your codebase for faster development.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Real-time Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                Track agent progress, view logs, and intervene when necessary through the monitoring dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
