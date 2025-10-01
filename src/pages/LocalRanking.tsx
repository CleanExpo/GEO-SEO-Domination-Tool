export default function LocalRanking() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Local Rankings & GEO Tracking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Share of Local Voice</p>
          <p className="text-4xl font-bold text-primary">0%</p>
          <p className="text-xs text-muted-foreground mt-1">Not calculated</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Keywords in Top 3</p>
          <p className="text-4xl font-bold">0</p>
          <p className="text-xs text-muted-foreground mt-1">Local pack positions</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Average Position</p>
          <p className="text-4xl font-bold">-</p>
          <p className="text-xs text-muted-foreground mt-1">No data</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Keyword Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Keyword"
            className="px-3 py-2 bg-background border border-input rounded-md"
          />
          <input
            type="text"
            placeholder="Location"
            className="px-3 py-2 bg-background border border-input rounded-md"
          />
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
            Add Keyword
          </button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4">Tracked Keywords</h2>
        <p className="text-muted-foreground">No keywords tracked yet. Add keywords above to start tracking.</p>
      </div>
    </div>
  )
}
