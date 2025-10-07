export default function Citations() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Citation Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Citations</p>
          <p className="text-4xl font-bold">0</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">NAP Consistent</p>
          <p className="text-4xl font-bold text-green-500">0</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-1">NAP Inconsistent</p>
          <p className="text-4xl font-bold text-red-500">0</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Citation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Platform (e.g., Yelp)"
            className="px-3 py-2 bg-background border border-input rounded-md"
          />
          <input
            type="url"
            placeholder="Citation URL"
            className="px-3 py-2 bg-background border border-input rounded-md"
          />
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
            Add Citation
          </button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4">Citation Directory</h2>
        <p className="text-muted-foreground">No citations tracked yet. Add citations above or run citation discovery.</p>
      </div>
    </div>
  )
}
