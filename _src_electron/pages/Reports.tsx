export default function Reports() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Reports</h1>

      <div className="bg-card p-6 rounded-lg border border-border mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="px-3 py-2 bg-background border border-input rounded-md">
            <option>Select Report Type</option>
            <option>Executive Summary</option>
            <option>Lighthouse Audit Report</option>
            <option>E-E-A-T Score Report</option>
            <option>Local Pack Visibility</option>
            <option>Competitor Comparison</option>
            <option>Citation Audit</option>
            <option>Comprehensive Report</option>
          </select>

          <select className="px-3 py-2 bg-background border border-input rounded-md">
            <option>Export Format</option>
            <option>PDF</option>
            <option>Excel</option>
            <option>HTML</option>
            <option>JSON</option>
          </select>

          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
            Generate Report
          </button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
        <p className="text-muted-foreground">No reports generated yet. Generate your first report above.</p>
      </div>
    </div>
  )
}
