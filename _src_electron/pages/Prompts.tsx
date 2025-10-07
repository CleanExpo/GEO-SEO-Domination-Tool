const promptLibrary: Array<{ title: string; scenario: string; prompt: string }> = [
  {
    title: 'Deal Follow-up Pulse',
    scenario: 'Use after a negotiation call to align decision makers.',
    prompt:
      'Draft a concise follow-up email recapping the call, highlighting decision criteria, and proposing next steps with dates.',
  },
  {
    title: 'Customer Journey Insight',
    scenario: 'Use when prepping a retention review with a leadership team.',
    prompt:
      'Summarize product adoption, support sentiment, and expansion opportunities using CRM notes and latest metrics.',
  },
  {
    title: 'GitHub Repo Summary',
    scenario: 'Use to translate a new repository into a client-facing update.',
    prompt:
      'Explain the goal, status, and blockers of this repository for a non-technical stakeholder. Include last commit context.',
  },
]

export default function Prompts() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Resources</p>
        <h1 className="text-2xl font-semibold text-foreground">Prompt Library</h1>
        <p className="text-sm text-muted-foreground">
          Curated prompt starters for quick outreach, documentation, and insight generation.
        </p>
      </header>

      <div className="space-y-4">
        {promptLibrary.map((item) => (
          <article key={item.title} className="border border-border rounded-xl bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{item.scenario}</span>
            </div>
            <p className="text-sm text-muted-foreground">{item.prompt}</p>
            <button type="button" className="text-xs text-primary font-medium hover:underline">
              Copy prompt
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
