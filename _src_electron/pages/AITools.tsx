const aiTools = [
  {
    name: 'Relationship Scout',
    description: 'Auto-curates research briefs before every founder or customer call.',
    status: 'Live',
    nextAction: 'Ship integration with LinkedIn Sales Navigator',
  },
  {
    name: 'Deal Coach',
    description: 'Summarizes pipeline health, red flags, and recommended moves per stage.',
    status: 'In Beta',
    nextAction: 'Add win/loss narrative exports',
  },
  {
    name: 'Repo Pulse',
    description: 'Turns GitHub activity into weekly updates for non-technical stakeholders.',
    status: 'Prototype',
    nextAction: 'Plug into GitHub import events for auto sync',
  },
]

export default function AITools() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Resources</p>
        <h1 className="text-2xl font-semibold text-foreground">AI Tools</h1>
        <p className="text-sm text-muted-foreground">
          A suite of micro-agents that amplify coverage across relationships, deals, and builds.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiTools.map((tool) => (
          <article key={tool.name} className="border border-border rounded-xl bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{tool.name}</h2>
              <span className="text-xs font-medium uppercase tracking-wide text-primary">{tool.status}</span>
            </div>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
            <p className="text-xs text-primary font-medium">Next: {tool.nextAction}</p>
            <button type="button" className="text-xs text-muted-foreground hover:text-primary font-medium">
              View roadmap
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
