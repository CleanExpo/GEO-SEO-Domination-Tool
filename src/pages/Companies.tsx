import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'

export default function Companies() {
  const companies = useCRMStore((state) => state.companies)
  const contacts = useCRMStore((state) => state.contacts)
  const deals = useCRMStore((state) => state.deals)

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Accounts</p>
        <h1 className="text-2xl font-semibold text-foreground">Companies</h1>
        <p className="text-sm text-muted-foreground">
          All client and partner workspaces with their latest sentiment and open opportunities.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {companies.map((company) => {
          const companyContacts = contacts.filter((contact) => contact.companyId === company.id)
          const openDeals = deals.filter(
            (deal) => deal.companyId === company.id && !deal.stage.startsWith('closed')
          )
          return (
            <div key={company.id} className="border border-border rounded-xl bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{company.name}</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{company.industry}</p>
                </div>
                <HealthBadge status={company.health} />
              </div>

              {company.notes ? <p className="mt-3 text-sm text-muted-foreground">{company.notes}</p> : null}

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="uppercase tracking-wide font-medium text-[11px] text-muted-foreground/80">
                    Website
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {company.website ? (
                      <a href={company.website} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide font-medium text-[11px] text-muted-foreground/80">
                    Last Contact
                  </p>
                  <p className="mt-1">
                    {company.lastContact ? (
                      <>
                        {format(parseISO(company.lastContact), 'MMM d, yyyy')}
                        <span className="ml-1 text-muted-foreground/70">
                          ({formatDistanceToNowStrict(parseISO(company.lastContact), { addSuffix: true })})
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide font-medium text-[11px] text-muted-foreground/80">
                    Key Contacts
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {companyContacts.length
                      ? companyContacts
                          .map((contact) => contact.name)
                          .slice(0, 3)
                          .join(', ')
                      : 'No contacts yet'}
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide font-medium text-[11px] text-muted-foreground/80">
                    Open Deals
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {openDeals.length ? ${openDeals.length} active : 'None'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HealthBadge({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const config = {
    green: {
      label: 'Healthy',
      className: 'bg-emerald-500/15 text-emerald-600',
    },
    yellow: {
      label: 'Monitoring',
      className: 'bg-amber-500/15 text-amber-600',
    },
    red: {
      label: 'At Risk',
      className: 'bg-rose-500/15 text-rose-600',
    },
  }[status]

  return (
    <span className={	ext-xs font-medium px-3 py-1 rounded-full uppercase tracking-wide }>
      {config.label}
    </span>
  )
}
