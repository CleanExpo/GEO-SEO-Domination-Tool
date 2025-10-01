import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'
import type { CRMProject } from '@/store/crmStore'

const statusFilters: Array<{ id: CRMProject['status'] | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'planning', label: 'Planning' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'completed', label: 'Completed' },
  { id: 'backlog', label: 'Backlog' },
]

export default function Projects() {
  const [filter, setFilter] = useState<string>('all')
  const projects = useCRMStore((state) => state.projects)

  const filteredProjects = useMemo(() => {
    if (filter === 'all') {
      return projects
    }
    return projects.filter((project) => project.status === filter)
  }, [projects, filter])

  const sourceCounts = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        acc[project.source] = (acc[project.source] ?? 0) + 1
        return acc
      },
      {} as Record<CRMProject['source'], number>
    )
  }, [projects])

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Build Suite</p>
          <h1 className="text-2xl font-semibold text-foreground">Project Board</h1>
          <p className="text-sm text-muted-foreground">
            Centralize personal initiatives, GitHub repos, and partner builds in one control room.
          </p>
        </div>
        <div className="flex gap-2">
          {statusFilters.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={px-3 py-1.5 text-xs font-medium rounded-md border transition-colors }
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>

      <aside className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard title="Manual Projects" count={sourceCounts.manual ?? 0} description="Strategic initiatives you configured manually." />
        <InsightCard title="GitHub Imports" count={sourceCounts.github ?? 0} description="Repositories synced from your GitHub workspace." />
        <InsightCard title="Active Today" count={projects.filter((project) => project.status === 'active').length} description="Projects currently marked as active." />
      </aside>
    </div>
  )
}

function ProjectCard({ project }: { project: CRMProject }) {
  return (
    <div className="border border-border rounded-xl bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{project.category}</p>
          <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wide bg-primary/10 text-primary">
          {project.status}
        </span>
      </div>
      {project.description ? <p className="text-sm text-muted-foreground">{project.description}</p> : null}
      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <span>Owner: {project.owner}</span>
        <span>Updated {format(parseISO(project.lastUpdated), 'MMM d')}</span>
      </div>
      {project.nextAction ? (
        <p className="text-xs text-primary font-medium">Next: {project.nextAction}</p>
      ) : null}
      {project.repositoryUrl ? (
        <a
          href={project.repositoryUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View repository
        </a>
      ) : null}
      {project.language || project.stars ? (
        <div className="pt-3 border-t border-border/70 text-xs text-muted-foreground flex items-center gap-3">
          {project.language ? <span>{project.language}</span> : null}
          {typeof project.stars === 'number' ? <span>★ {project.stars}</span> : null}
          {project.visibility ? <span>{project.visibility}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

function InsightCard({
  title,
  count,
  description,
}: {
  title: string
  count: number
  description: string
}) {
  return (
    <div className="border border-border rounded-xl bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="text-2xl font-semibold text-foreground mt-2">{count}</p>
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  )
}
