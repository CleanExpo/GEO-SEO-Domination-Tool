const supportOptions = [
  {
    title: 'Instant Support',
    description: 'DM for rapid support during sprints or launches.',
    sla: 'Avg response 10 min',
  },
  {
    title: 'Meet Members',
    description: 'Connect with other builders in the network for co-working and feedback.',
    sla: 'Weekly sessions',
  },
  {
    title: 'Classroom',
    description: 'Deep-dive sessions on playbooks, automation, and deal strategy.',
    sla: 'Live every Thursday',
  },
]

export default function Support() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Members Area</p>
        <h1 className="text-2xl font-semibold text-foreground">Support</h1>
        <p className="text-sm text-muted-foreground">
          Tap into the builder network, live rooms, and async help whenever you need momentum.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportOptions.map((option) => (
          <article key={option.title} className="border border-border rounded-xl bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{option.title}</h2>
            <p className="text-sm text-muted-foreground">{option.description}</p>
            <p className="text-xs text-primary font-medium">{option.sla}</p>
            <button type="button" className="text-xs text-muted-foreground hover:text-primary font-medium">
              Open channel
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
