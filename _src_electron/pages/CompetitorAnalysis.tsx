export default function CompetitorAnalysis() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Competitor Analysis</h1>

      <div className="bg-card p-6 rounded-lg border border-border mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Competitor</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Competitor domain (e.g., competitor.com)"
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md"
          />
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
            Add & Analyze
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Keyword Gap Analysis</h2>
          <p className="text-muted-foreground">Add competitors to view keyword gaps</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Backlink Comparison</h2>
          <p className="text-muted-foreground">Add competitors to compare backlink profiles</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Citation Analysis</h2>
          <p className="text-muted-foreground">Compare citation consistency across directories</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Review Performance</h2>
          <p className="text-muted-foreground">Compare review count and ratings</p>
        </div>
      </div>
    </div>
  )
}
