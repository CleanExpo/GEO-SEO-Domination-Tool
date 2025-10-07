'use client'

import { useState, useEffect } from 'react'
import { Terminal, Code, FolderTree as FileTreeIcon, Monitor, Plus } from 'lucide-react'
import TaskForm from '@/components/sandbox/TaskForm'
import LogViewer from '@/components/sandbox/LogViewer'
import FileTree from '@/components/sandbox/FileTree'
import LivePreview from '@/components/sandbox/LivePreview'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SandboxSession {
  id: string
  session_name: string
  git_repo_url: string | null
  vercel_preview_url: string | null
  file_tree: Record<string, any>
  active: boolean
  created_at: string
}

interface SandboxTask {
  id: string
  session_id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'error' | 'stopped'
  progress: number
  logs: Array<{ type: string; message: string; timestamp?: string }>
  branch_name: string | null
  sandbox_url: string | null
  created_at: string
}

export default function SandboxPage() {
  const [sessions, setSessions] = useState<SandboxSession[]>([])
  const [currentSession, setCurrentSession] = useState<SandboxSession | null>(null)
  const [tasks, setTasks] = useState<SandboxTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Load tasks when session changes
  useEffect(() => {
    if (currentSession) {
      loadTasks(currentSession.id)
    }
  }, [currentSession])

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sandbox/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        if (data.sessions?.length > 0 && !currentSession) {
          setCurrentSession(data.sessions[0])
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sandbox/tasks?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const handleTaskCreated = (task: SandboxTask) => {
    setTasks([...tasks, task])
  }

  const handleCreateSession = async (name: string) => {
    try {
      const response = await fetch('/api/sandbox/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_name: name }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessions([...sessions, data.session])
        setCurrentSession(data.session)
        setShowNewSessionModal(false)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const openIn2ndScreen = () => {
    const width = 1600
    const height = 900
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2

    window.open(
      `/sandbox?session=${currentSession?.id}&mode=fullscreen`,
      'Sandbox',
      `width=${width},height=${height},left=${left},top=${top}`
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Terminal className="h-12 w-12 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sandbox environment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            <h1 className="text-2xl font-bold">MetaCoder Sandbox</h1>
          </div>

          <Select
            value={currentSession?.id || ''}
            onValueChange={(value) => {
              const session = sessions.find((s) => s.id === value)
              if (session) setCurrentSession(session)
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.session_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewSessionModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openIn2ndScreen}>
            <Monitor className="h-4 w-4 mr-2" />
            Open in New Window
          </Button>

          {currentSession?.vercel_preview_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(currentSession.vercel_preview_url!, '_blank')}
            >
              <Code className="h-4 w-4 mr-2" />
              Open Preview
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      {currentSession ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Task Form + File Tree */}
          <div className="w-1/3 border-r flex flex-col overflow-hidden">
            <div className="flex-none border-b">
              <TaskForm
                sessionId={currentSession.id}
                onTaskCreated={handleTaskCreated}
              />
            </div>
            <div className="flex-1 overflow-auto">
              <FileTree
                sessionId={currentSession.id}
                fileTree={currentSession.file_tree}
              />
            </div>
          </div>

          {/* Middle Panel: Log Viewer */}
          <div className="w-1/3 border-r flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
              <Terminal className="h-4 w-4" />
              <h2 className="font-semibold">Terminal Output</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <LogViewer tasks={tasks} />
            </div>
          </div>

          {/* Right Panel: Live Preview */}
          <div className="w-1/3 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
              <Monitor className="h-4 w-4" />
              <h2 className="font-semibold">Live Preview</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <LivePreview
                previewUrl={currentSession.vercel_preview_url}
                sessionId={currentSession.id}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileTreeIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Active Session</h2>
            <p className="text-muted-foreground mb-4">
              Create a new session to start coding
            </p>
            <Button onClick={() => setShowNewSessionModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </div>
        </div>
      )}

      {/* New Session Modal (Simple) */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-[400px]">
            <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleCreateSession(formData.get('name') as string)
              }}
            >
              <input
                type="text"
                name="name"
                placeholder="Session name"
                className="w-full px-3 py-2 border rounded mb-4"
                required
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewSessionModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
