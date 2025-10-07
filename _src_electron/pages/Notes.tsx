const howToDocument: Array<{ title: string; summary: string; lastUpdated: string; tags: string[] }> = [
  {
    title: 'Weekly Relationship Review',
    summary: 'Checklist for reviewing pipeline health, tasks, and upcoming launches every Friday.',
    lastUpdated: '2025-01-04',
    tags: ['ritual', 'ops'],
  },
  {
    title: 'GitHub Import Playbook',
    summary: 'Steps to authenticate, pull repo signals, and assign next actions for engineering projects.',
    lastUpdated: '2025-01-07',
    tags: ['github', 'automation'],
  },
  {
    title: 'New Client Onboarding Guide',
    summary: 'Sequenced onboarding flow with templates for kickoff, roadmap, and performance tracking.',
    lastUpdated: '2024-12-29',
    tags: ['onboarding', 'templates'],
  },
]

export default function Notes() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Enablement Hub</p>
        <h1 className="text-2xl font-semibold text-foreground">Notes & Docs</h1>
        <p className="text-sm text-muted-foreground">
          Centralize playbooks and repeatable processes so every interaction carries the same energy.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {howToDocument.map((doc) => (
          <article key={doc.title} className="border border-border rounded-xl bg-card p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
              <span>{doc.tags.join(' • ')}</span>
              <span>Updated {doc.lastUpdated}</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{doc.title}</h2>
            <p className="text-sm text-muted-foreground">{doc.summary}</p>
            <button
              type="button"
              className="text-xs text-primary font-medium hover:underline"
            >
              Open doc
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
