'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal, Download, Trash2, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogEntry {
  type: 'info' | 'command' | 'error' | 'success'
  message: string
  timestamp?: string
}

interface Task {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'error' | 'stopped'
  progress: number
  logs: LogEntry[]
  branch_name: string | null
  created_at: string
}

interface LogViewerProps {
  tasks: Task[]
}

export default function LogViewer({ tasks }: LogViewerProps) {
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [tasks, autoScroll])

  // Detect manual scroll
  const handleScroll = () => {
    if (!containerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop === clientHeight
    setAutoScroll(isAtBottom)
  }

  const downloadLogs = () => {
    const allLogs = tasks.flatMap((task) =>
      task.logs.map((log) => `[${task.id}] [${log.type}] ${log.message}`)
    )
    const blob = new Blob([allLogs.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sandbox-logs-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    // This would need to call an API to clear logs
    console.log('Clear logs functionality')
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
      case 'command':
        return <Terminal className="h-4 w-4 text-primary flex-shrink-0" />
      default:
        return <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    }
  }

  const getLogClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-destructive/10 text-destructive'
      case 'success':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'command':
        return 'bg-primary/10 text-primary'
      default:
        return 'bg-muted/50'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
          {!autoScroll && (
            <span className="text-xs text-primary">Scroll paused</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadLogs}
            disabled={tasks.length === 0}
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            disabled={tasks.length === 0}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Logs Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2"
      >
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tasks yet</p>
              <p className="text-xs">Create a task to see logs here</p>
            </div>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="space-y-1">
              {/* Task Header */}
              <div className="border-l-2 border-primary pl-3 py-1 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    Task: {task.prompt.substring(0, 50)}
                    {task.prompt.length > 50 ? '...' : ''}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      task.status === 'completed'
                        ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                        : task.status === 'error'
                        ? 'bg-destructive/20 text-destructive'
                        : task.status === 'processing'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                {task.status === 'processing' && (
                  <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Log Entries */}
              {task.logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded ${getLogClass(
                    log.type
                  )}`}
                >
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <pre className="whitespace-pre-wrap break-words">
                      {log.message}
                    </pre>
                    {log.timestamp && (
                      <span className="text-xs opacity-60 mt-1 block">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Branch Info */}
              {task.branch_name && (
                <div className="text-xs text-muted-foreground pl-3">
                  Branch: <code className="bg-muted px-1 py-0.5 rounded">{task.branch_name}</code>
                </div>
              )}
            </div>
          ))
        )}

        {/* Auto-scroll anchor */}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}
