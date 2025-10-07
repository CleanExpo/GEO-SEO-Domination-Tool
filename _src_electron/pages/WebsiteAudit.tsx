export default function WebsiteAudit() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Website Audit</h1>

      <div className="bg-card p-6 rounded-lg border border-border mb-6">
        <h2 className="text-xl font-semibold mb-4">Run Lighthouse Audit</h2>
        <div className="flex gap-4">
          <input
            type="url"
            placeholder="Enter website URL"
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md"
          />
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
            Run Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <ScoreCard title="Performance" score={0} />
        <ScoreCard title="Accessibility" score={0} />
        <ScoreCard title="Best Practices" score={0} />
        <ScoreCard title="SEO" score={0} />
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4">E-E-A-T Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EEATCard title="Experience" score={0} />
          <EEATCard title="Expertise" score={0} />
          <EEATCard title="Authoritativeness" score={0} />
          <EEATCard title="Trustworthiness" score={0} />
        </div>
      </div>
    </div>
  )
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="bg-background p-4 rounded-lg border border-border">
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className={`text-4xl font-bold ${getColor(score)}`}>{score}</p>
    </div>
  )
}

function EEATCard({ title, score }: { title: string; score: number }) {
  return (
    <div className="bg-background p-4 rounded-lg">
      <p className="text-sm mb-2">{title}</p>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${score}%` }}></div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{score}/100</p>
    </div>
  )
}
