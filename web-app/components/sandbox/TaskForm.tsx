'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface TaskFormProps {
  sessionId: string
  onTaskCreated: (task: any) => void
}

const agents = [
  { value: 'claude', label: 'Claude Code (Max Plan)', model: 'claude-sonnet-4-5-20250929' },
  { value: 'codex', label: 'GPT-5 Codex', model: 'gpt-5-codex' },
  { value: 'cursor', label: 'Cursor Composer', model: 'cursor-composer' },
  { value: 'gemini', label: 'Google Gemini', model: 'gemini-2.0-flash' },
  { value: 'opencode', label: 'OpenCode', model: 'opencode-engine' },
]

export default function TaskForm({ sessionId, onTaskCreated }: TaskFormProps) {
  const [prompt, setPrompt] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('claude')
  const [installDeps, setInstallDeps] = useState(false)
  const [maxDuration, setMaxDuration] = useState('5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAgentConfig = agents.find((a) => a.value === selectedAgent)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sandbox/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          prompt,
          repo_url: repoUrl || null,
          selected_agent: selectedAgent,
          selected_model: selectedAgentConfig?.model,
          install_dependencies: installDeps,
          max_duration: parseInt(maxDuration),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      const data = await response.json()
      onTaskCreated(data.task)

      // Reset form
      setPrompt('')
      setRepoUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">New Task</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Describe what you want to build...&#10;Example: Create a React component for displaying SEO metrics with charts"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Repository URL (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="repoUrl">Repository URL (optional)</Label>
          <Input
            id="repoUrl"
            type="url"
            placeholder="https://github.com/user/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </div>

        {/* Agent Selection */}
        <div className="space-y-2">
          <Label htmlFor="agent">AI Agent</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger id="agent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.value} value={agent.value}>
                  {agent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAgentConfig && (
            <p className="text-xs text-muted-foreground">
              Model: {selectedAgentConfig.model}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={installDeps}
              onChange={(e) => setInstallDeps(e.target.checked)}
              className="rounded"
            />
            Install dependencies
          </label>

          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="maxDuration">Max duration:</label>
            <select
              id="maxDuration"
              value={maxDuration}
              onChange={(e) => setMaxDuration(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading || !prompt}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Code...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Code
            </>
          )}
        </Button>
      </form>

      {/* Info */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        <p>
          💡 Tip: Be specific about the framework, libraries, and features you need.
        </p>
      </div>
    </div>
  )
}
