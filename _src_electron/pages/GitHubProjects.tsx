import { FormEvent, useMemo, useState } from 'react'
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'
import type { CRMProject } from '@/store/crmStore'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  updated_at: string
  pushed_at: string
  private: boolean
  fork: boolean
  topics?: string[]
  owner: {
    login: string
  }
}

export default function GitHubProjects() {
  const addImportedProjects = useCRMStore((state) => state.addImportedProjects)
  const githubProjects = useCRMStore((state) => state.projects.filter((project) => project.source === 'github'))

  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [lastImported, setLastImported] = useState<Date | null>(null)

  const selectedRepos = useMemo(
    () => repos.filter((repo) => selectedIds.has(repo.id)),
    [repos, selectedIds]
  )

  async function handleLoadRepos(event: FormEvent) {
    event.preventDefault()
    if (!username.trim()) {
      setError('Enter your GitHub username to continue.')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(https://api.github.com/users//repos?per_page=100, {
        headers: token
          ? {
              Authorization: Bearer ,
              Accept: 'application/vnd.github+json',
            }
          : {
              Accept: 'application/vnd.github+json',
            },
      })

      if (!response.ok) {
        const message = response.status === 401 ? 'Invalid or expired token.' : 'Unable to load repositories.'
        throw new Error(message)
      }

      const data = (await response.json()) as GitHubRepo[]
      setRepos(data)
      setSelectedIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error loading repositories.')
    } finally {
      setIsLoading(false)
    }
  }

  function toggleSelection(repoId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(repoId)) {
        next.delete(repoId)
      } else {
        next.add(repoId)
      }
      return next
    })
  }

  function importSelectedRepos() {
    if (!selectedRepos.length) {
      setError('Select at least one repository to import.')
      return
    }

    const projects: CRMProject[] = selectedRepos.map((repo) => ({
      id: github-,
      externalId: repo.id.toString(),
      name: repo.name,
      owner: repo.owner.login,
      category: repo.topics?.[0] ?? 'GitHub',
      status: 'active',
      source: 'github',
      description: repo.description ?? undefined,
      lastUpdated: repo.updated_at,
      nextAction: 'Review README & align next sprint focus',
      repositoryUrl: repo.html_url,
      language: repo.language ?? undefined,
      stars: repo.stargazers_count,
      visibility: repo.private ? 'private' : 'public',
    }))

    addImportedProjects(projects)
    setSelectedIds(new Set())
    setLastImported(new Date())
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Projects Workspace</p>
          <h1 className="text-2xl font-semibold text-foreground">GitHub Imports</h1>
          <p className="text-sm text-muted-foreground">
            Connect your public or private repositories to keep engineering signals inside your CRM.
          </p>
        </div>
        {lastImported ? (
          <span className="text-xs text-muted-foreground">
            Last import {formatDistanceToNowStrict(lastImported, { addSuffix: true })}
          </span>
        ) : null}
      </header>

      <section className="border border-border rounded-xl bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">1. Load repositories</h2>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleLoadRepos}>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              GitHub Username
            </label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="your-handle"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Personal Access Token (optional)
            </label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Enhances private repo access"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Scope required: <code className="text-xs">repo:read</code> for private repositories.
            </p>
          </div>
          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? 'Loading…' : 'Fetch repositories'}
            </button>
          </div>
        </form>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="border border-border rounded-xl bg-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">2. Select repositories</h2>
          <div className="text-xs text-muted-foreground">
            Selected {selectedRepos.length} of {repos.length}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-2">
          {repos.map((repo) => (
            <label
              key={repo.id}
              className={order rounded-lg p-4 cursor-pointer transition-colors }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{repo.name}</p>
                  <p className="text-xs text-muted-foreground">{repo.full_name}</p>
                </div>
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.has(repo.id)}
                  onChange={() => toggleSelection(repo.id)}
                />
              </div>
              {repo.description ? (
                <p className="mt-2 text-xs text-muted-foreground">{repo.description}</p>
              ) : null}
              <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-3">
                {repo.language ? <span>{repo.language}</span> : null}
                <span>★ {repo.stargazers_count}</span>
                <span>Updated {format(parseISO(repo.updated_at), 'MMM d')}</span>
                <span>{repo.private ? 'Private' : 'Public'}</span>
              </div>
            </label>
          ))}
          {!repos.length ? <p className="text-sm text-muted-foreground">Load repositories to begin selection.</p> : null}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Imported projects stay in sync manually—re-run the fetch anytime to bring in new repos.
          </div>
          <button
            type="button"
            onClick={importSelectedRepos}
            className="bg-emerald-600 text-white font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Import selected
          </button>
        </div>
      </section>

      <section className="border border-border rounded-xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">3. Synced repositories</h2>
          <span className="text-xs text-muted-foreground">{githubProjects.length} imported</span>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {githubProjects.map((project) => (
            <div key={project.id} className="border border-border/70 rounded-lg p-4">
              <p className="text-sm font-semibold text-foreground">{project.name}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                {project.repositoryUrl?.replace('https://github.com/', '')}
              </p>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                {project.language ? <span>{project.language}</span> : null}
                {typeof project.stars === 'number' ? <span>★ {project.stars}</span> : null}
                {project.visibility ? <span>{project.visibility}</span> : null}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Updated {format(parseISO(project.lastUpdated), 'MMM d, yyyy')}
              </p>
              {project.nextAction ? (
                <p className="mt-2 text-xs text-primary font-medium">Next: {project.nextAction}</p>
              ) : null}
            </div>
          ))}
          {!githubProjects.length ? (
            <p className="text-sm text-muted-foreground">Imported repositories will appear here.</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
