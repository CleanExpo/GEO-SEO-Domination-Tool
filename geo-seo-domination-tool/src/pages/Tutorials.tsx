const tutorials = [
  {
    title: 'Personal CRM Setup',
    duration: '7 min watch',
    summary: 'Walkthrough of configuring contacts, deals, and the weekly focus view.',
    status: 'Updated Jan 2025',
  },
  {
    title: 'GitHub Project Imports',
    duration: '5 min watch',
    summary: 'Authenticating, selecting repos, and assigning next actions from your CRM.',
    status: 'Updated Jan 2025',
  },
  {
    title: 'Relationship Rituals',
    duration: '9 min watch',
    summary: 'How to run consistent founder touchpoints and keep momentum high.',
    status: 'Updated Dec 2024',
  },
]

export default function Tutorials() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Resources</p>
        <h1 className="text-2xl font-semibold text-foreground">Tutorials</h1>
        <p className="text-sm text-muted-foreground">
          Bite-sized guides to make the most of your personal CRM rituals.
        </p>
      </header>

      <div className="space-y-4">
        {tutorials.map((item) => (
          <article key={item.title} className="border border-border rounded-xl bg-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{item.summary}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{item.duration}</p>
              <p>{item.status}</p>
              <button type="button" className="mt-2 text-primary font-medium hover:underline">
                Watch tutorial
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
