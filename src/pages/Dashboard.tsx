export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Lighthouse Score" value="0" subtitle="Not audited yet" />
        <StatCard title="E-E-A-T Score" value="0" subtitle="Not calculated" />
        <StatCard title="Local Pack Visibility" value="0%" subtitle="Share of Local Voice" />
        <StatCard title="Active Keywords" value="0" subtitle="Being tracked" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Recent Audits</h2>
          <p className="text-muted-foreground">No audits yet. Start by creating a company profile.</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <ActionButton href="/profile">Set up Company Profile</ActionButton>
            <ActionButton href="/audit">Run Website Audit</ActionButton>
            <ActionButton href="/ranking">Track Local Rankings</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function ActionButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block w-full px-4 py-2 text-center bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
    >
      {children}
    </a>
  )
}
