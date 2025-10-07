'use client'

import { useState } from 'react'
import { Zap, Code, GitBranch, FileCode, Terminal, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TacticalTask {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  type: 'refactor' | 'feature' | 'bugfix' | 'test'
}

export default function TacticalCodingPage() {
  const [tasks] = useState<TacticalTask[]>([
    {
      id: '1',
      title: 'Optimize API Response Times',
      description: 'Refactor database queries for better performance',
      status: 'completed',
      type: 'refactor',
    },
    {
      id: '2',
      title: 'Add Unit Tests for SEO Module',
      description: 'Increase test coverage to 80%',
      status: 'in_progress',
      type: 'test',
    },
    {
      id: '3',
      title: 'Fix Authentication Edge Cases',
      description: 'Handle session timeout scenarios',
      status: 'pending',
      type: 'bugfix',
    },
  ])

  const getStatusIcon = (status: TacticalTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Zap className="h-5 w-5 text-yellow-600 animate-pulse" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Code className="h-5 w-5 text-gray-400" />
    }
  }

  const getTypeColor = (type: TacticalTask['type']) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'bugfix':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'refactor':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'test':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Tactical Coding</h1>
            <span className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-full">NEW</span>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Precision code changes with AI-powered tactical modifications
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Code className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Fix</h3>
                <p className="text-xs text-muted-foreground">Fix issues fast</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <GitBranch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Refactor</h3>
                <p className="text-xs text-muted-foreground">Improve code</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FileCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Add Feature</h3>
                <p className="text-xs text-muted-foreground">New functionality</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Terminal className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold">Test Gen</h3>
                <p className="text-xs text-muted-foreground">Create tests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Tasks</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                        </div>
                        <CardDescription>{task.description}</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Task History</CardTitle>
                <CardDescription>View completed and archived tactical coding tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No completed tasks yet.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Task Templates</CardTitle>
                <CardDescription>Pre-configured templates for common tactical coding patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">API Optimization</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Improve API endpoint performance with caching and query optimization
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Add Authentication</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Protect routes with authentication middleware and session management
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Database Migration</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create and apply database schema changes safely
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Error Handling</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add comprehensive error handling and logging
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
