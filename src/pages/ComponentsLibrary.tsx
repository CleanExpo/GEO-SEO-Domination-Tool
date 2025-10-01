const componentSets: Array<{ name: string; description: string; elements: string[] }> = [
  {
    name: 'Deal Room Kit',
    description: 'Templates for pipelines, deal reviews, and commitment trackers.',
    elements: ['Pipeline tracker', 'Mutual action plan', 'Executive summary'],
  },
  {
    name: 'Client Portal Kit',
    description: 'Embed-ready components for sharing dashboards and resource drops.',
    elements: ['Launch checklist', 'Resource drop', 'Feedback form'],
  },
  {
    name: 'Project Sync Kit',
    description: 'Weekly sync notes, decision logs, and integration trackers.',
    elements: ['Weekly agenda', 'Decision log', 'Integration tracker'],
  },
]

export default function ComponentsLibrary() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Resources</p>
        <h1 className="text-2xl font-semibold text-foreground">Components Library</h1>
        <p className="text-sm text-muted-foreground">
          Drop-in building blocks for wikis, project hubs, and automated client updates.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {componentSets.map((set) => (
          <article key={set.name} className="border border-border rounded-xl bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{set.name}</h2>
            <p className="text-sm text-muted-foreground">{set.description}</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {set.elements.map((element) => (
                <p key={element}>• {element}</p>
              ))}
            </div>
            <button type="button" className="text-xs text-primary font-medium hover:underline">
              View components
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
