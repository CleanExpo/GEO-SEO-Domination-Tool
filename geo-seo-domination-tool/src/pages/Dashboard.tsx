import { useMemo } from 'react'
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'
import type { Company, CRMProject, DealStage, Task } from '@/store/crmStore'

const stageLabels: Record<DealStage, string> = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal Shared',
  negotiation: 'Negotiation',
  contract: 'Contract Out',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
}

const stageOrder: DealStage[] = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'contract',
  'closed-won',
  'closed-lost',
]

export default function Dashboard() {
  const { contacts, deals, tasks, interactions, projects, companies } = useCRMStore((state) => ({
    contacts: state.contacts,
    deals: state.deals,
    tasks: state.tasks,
    interactions: state.interactions,
    projects: state.projects,
    companies: state.companies,
  }))

  const currency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  )

  const weightedPipelineValue = useMemo(
    () => deals.reduce((total, deal) => total + deal.value * deal.probability, 0),
    [deals]
  )

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed'),
    [tasks]
  )

  const upcomingTasks = useMemo(
    () =>
      [...openTasks]
        .sort((a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4),
    [openTasks]
  )

  const recentInteractions = useMemo(
    () =>
      [...interactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4),
    [interactions]
  )

  const stageDistribution = useMemo(() => {
    return deals.reduce(
      (acc, deal) => {
        acc[deal.stage] = (acc[deal.stage] ?? 0) + 1
        return acc
      },
      {} as Partial<Record<DealStage, number>>
    )
  }, [deals])

  const activeProjects = useMemo(() => projects.filter((project) => project.status === 'active'), [projects])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Workspace Overview</p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Personal CRM Command Center</h1>
            <p className="text-muted-foreground">
              Stay on top of relationships, deals, and projects without leaving your growth workflow.
            </p>
          </div>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-md text-sm font-medium w-fit">
            {contacts.length} active relationships tracked
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Active Contacts"
          primary={contacts.length.toString()}
          secondary="Contacts with current touchpoints"
        />
        <MetricCard
          label="Weighted Pipeline"
          primary={currency.format(weightedPipelineValue)}
          secondary="Based on stage probability"
        />
        <MetricCard
          label="Open Tasks"
          primary={openTasks.length.toString()}
          secondary="In-flight actions due"
        />
        <MetricCard
          label="Active Projects"
          primary={activeProjects.length.toString()}
          secondary="Projects marked as active"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-6">
          <SectionHeader title="Pipeline Snapshot" description="Stage distribution across live deals" />
          <div className="mt-4 space-y-3">
            {stageOrder.map((stage) => {
              const count = stageDistribution[stage] ?? 0
              const ratio = deals.length ? Math.round((count / deals.length) * 100) : 0
              return (
                <div key={stage} className="flex items-center gap-4">
                  <div className="w-40">
                    <p className="text-sm font-medium text-foreground">{stageLabels[stage]}</p>
                    <p className="text-xs text-muted-foreground">{count} open</p>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-muted relative overflow-hidden">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      style={{ width: ${ratio}% }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm text-muted-foreground">{ratio}%</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <SectionHeader title="Upcoming Actions" description="Top focus items across your relationships" />
          <div className="mt-4 space-y-4">
            {upcomingTasks.map((task) => {
              const contact = contacts.find((person) => person.id === task.relatedContactId)
              const dueIn = formatDistanceToNowStrict(new Date(task.dueDate), { addSuffix: true })
              return (
                <div key={task.id} className="rounded-lg border border-border/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-foreground">{task.title}</h3>
                      {contact ? (
                        <p className="text-xs text-muted-foreground">With {contact.name}</p>
                      ) : null}
                    </div>
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">{task.priority}{' '}
                      priority
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Due {format(parseISO(task.dueDate), 'MMM d')}</span>
                    <span>{dueIn}</span>
                  </div>
                </div>
              )
            })}
            {!upcomingTasks.length ? (
              <p className="text-sm text-muted-foreground">All tasks are cleared—nice work.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionHeader title="Latest Interactions" description="Recent conversations and notes" />
          <div className="mt-4 space-y-4">
            {recentInteractions.map((interaction) => {
              const contact = contacts.find((person) => person.id === interaction.contactId)
              const sentimentTone = sentimentLabel(interaction.sentiment)
              return (
                <div key={interaction.id} className="border border-border/70 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {interaction.type.toUpperCase()} • {format(new Date(interaction.date), 'MMM d, yyyy')}
                    </span>
                    {sentimentTone ? <span className="text-xs font-medium">{sentimentTone}</span> : null}
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-foreground">
                    {contact ? contact.name : 'Unknown contact'}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{interaction.summary}</p>
                  {interaction.followUp ? (
                    <p className="mt-2 text-xs text-primary font-medium">Next: {interaction.followUp}</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <SectionHeader
            title="Company Health"
            description="Quick temperature check across partner accounts"
          />
          <div className="mt-4 space-y-3">
            {companies.map((company) => (
              <CompanyHealthCard key={company.id} company={company} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6">
        <SectionHeader title="Project Momentum" description="How your key initiatives are trending this week" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, primary, secondary }: { label: string; primary: string; secondary: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold text-foreground mt-2">{primary}</p>
      <p className="text-xs text-muted-foreground mt-1">{secondary}</p>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function sentimentLabel(
  sentiment: 'positive' | 'neutral' | 'concerned' | undefined
): string | null {
  switch (sentiment) {
    case 'positive':
      return 'Positive tone'
    case 'neutral':
      return 'Neutral check-in'
    case 'concerned':
      return 'Needs attention'
    default:
      return null
  }
}

function CompanyHealthCard({ company }: { company: Company }) {
  const badgeColor = {
    green: 'bg-emerald-500/15 text-emerald-600',
    yellow: 'bg-amber-500/15 text-amber-600',
    red: 'bg-rose-500/15 text-rose-600',
  }[company.health]

  return (
    <div className="border border-border/70 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">{company.name}</h3>
          <p className="text-xs text-muted-foreground">{company.industry}</p>
        </div>
        <span className={	ext-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wide }>
          {company.health === 'green'
            ? 'Healthy'
            : company.health === 'yellow'
            ? 'Monitoring'
            : 'At Risk'}
        </span>
      </div>
      {company.notes ? <p className="mt-2 text-xs text-muted-foreground">{company.notes}</p> : null}
      {company.lastContact ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Last contact {format(parseISO(company.lastContact), 'MMM d, yyyy')}
        </p>
      ) : null}
    </div>
  )
}

function ProjectCard({ project }: { project: CRMProject }) {
  return (
    <div className="border border-border/70 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{project.status}</span>
      </div>
      {project.description ? <p className="mt-2 text-xs text-muted-foreground">{project.description}</p> : null}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{project.category}</span>
        <span>Updated {format(parseISO(project.lastUpdated), 'MMM d')}</span>
      </div>
      {project.nextAction ? (
        <p className="mt-2 text-xs text-primary font-medium">Next: {project.nextAction}</p>
      ) : null}
    </div>
  )
}
